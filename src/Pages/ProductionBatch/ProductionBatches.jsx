import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import Card from "../../Components/UI/AppCard";
import CrmPagination from "../../Components/Common/CrmPagination";
import HeroMetric from "../../Components/UI/HeroMetric";
import PremiumDialog from "../../Components/UI/PremiumDialog";
import { useAuth } from "../../Context/AuthContext";
import { hasPermission } from "../../utils/permissions";
import { getOrders } from "../../api/orders";
import { getProducts } from "../../api/products";
import {
  completeProductionBatch,
  createProductionBatch,
  getProductionBatches,
} from "../../api/productionBatches";
import BatchDetail from "./BatchDetail";
import BatchLabelDialog from "./BatchLabelDialog";
import { formatSize } from "./printLabels";

/**
 * Partiyalar sahifasi.
 *
 * Partiya — bir ishlab chiqarish yo'li. Bir xil "Loro Piana 35-39 ko'k" omborda
 * aralashmasligi kerak: biri 055 padoj va flutr bilan, boshqasi 046 padoj va
 * zamsh bilan ishlangan bo'lishi mumkin. Partiya aynan shu farqni ushlab turadi
 * va yorliq orqali yopiq karobka ichini bilishga imkon beradi.
 *
 * Material va padoj bu yerda TANLANMAYDI — ularni server ish yozuvlaridagi
 * haqiqiy sarfdan aniqlaydi. Shu sababli yangi partiyada ular bo'sh turadi.
 */

const emptyForm = {
  product_id: "",
  order_id: "",
  quantity: "",
  note: "",
};

const STATUS_LABELS = {
  in_progress: "Jarayonda",
  completed: "Yopilgan",
  cancelled: "Bekor qilingan",
};

const STATUS_TONES = {
  in_progress: ["#7d5210", "rgba(160, 106, 18,.12)"],
  completed: ["#255738", "rgba(47, 107, 69,.12)"],
  cancelled: ["#6e1622", "rgba(140, 29, 43,.10)"],
};

const formatNumber = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "-";

const StatusChip = ({ status }) => {
  const [color, backgroundColor] = STATUS_TONES[status] || STATUS_TONES.in_progress;

  return (
    <Chip
      size="small"
      label={STATUS_LABELS[status] || status}
      sx={{ height: 24, px: 0.3, color, backgroundColor, fontSize: 9.5, fontWeight: 700 }}
    />
  );
};

const ProductionBatches = () => {
  const { user } = useAuth();

  const canManage = hasPermission(user, "production.manage");

  const canSeeOutputs = hasPermission(user, "production.view");

  const [batches, setBatches] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, offset: 0, limit: 20 });
  const [counts, setCounts] = useState({ in_progress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ q: "", status: "", product_id: "" });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [detailBatch, setDetailBatch] = useState(null);
  const [labelBatch, setLabelBatch] = useState(null);
  const [completing, setCompleting] = useState(null);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const buildParams = useCallback(
    (offset, limit) => {
      const params = { offset, limit };
      if (filters.q.trim()) params.q = filters.q.trim();
      if (filters.status) params.status = filters.status;
      if (filters.product_id) params.product_id = filters.product_id;
      return params;
    },
    [filters],
  );

  const fetchBatches = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        // Ro'yxat bilan birga holat bo'yicha sanoqlar: `pageInfo.total` filtrlangan
        // sonni beradi, sarlavhadagi ko'rsatkichlar esa umumiy manzarani.
        const countParams = { ...buildParams(0, 1) };
        delete countParams.status;

        const [listRes, progressRes, doneRes] = await Promise.all([
          getProductionBatches(buildParams(offset, limit)),
          getProductionBatches({ ...countParams, status: "in_progress" }),
          getProductionBatches({ ...countParams, status: "completed" }),
        ]);

        setBatches(listRes.data.production_batches || []);
        setPageInfo(listRes.data.pageInfo || { total: 0, offset, limit });

        setCounts({
          in_progress: Number(progressRes.data.pageInfo?.total || 0),
          completed: Number(doneRes.data.pageInfo?.total || 0),
        });
      } catch (error) {
        toast.error(error?.response?.data?.message || "Partiyalarni olishda xato.");
      } finally {
        setLoading(false);
      }
    },
    [buildParams, pageInfo.limit],
  );

  useEffect(() => {
    const timer = setTimeout(() => fetchBatches(0, pageInfo.limit), 250);
    return () => clearTimeout(timer);
  }, [fetchBatches, pageInfo.limit]);

  // Mahsulotlar filtrga ham kerak, zakazlar esa faqat partiya ochish shakliga.
  // Ikkalasi alohida: ombor xodimida `products.view` bo'lmasligi mumkin va bunda
  // filtr bo'sh qolsa ham sahifaning qolgani ishlayveradi.
  useEffect(() => {
    getProducts({ offset: 0, limit: 100, sort_by: "name", sort_order: "asc", is_active: true })
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (!canManage) return;

    getOrders({ offset: 0, limit: 100 })
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => setOrders([]));
  }, [canManage]);

  const selectedProduct = useMemo(
    () => products.find((product) => Number(product.id) === Number(form.product_id)),
    [form.product_id, products],
  );

  const handleFilter = (field) => (event) =>
    setFilters((previous) => ({ ...previous, [field]: event.target.value }));

  const handleForm = (field) => (event) =>
    setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!form.product_id) {
      toast.error("Mahsulotni tanlang.");
      return;
    }

    setSaving(true);

    try {
      const { data } = await createProductionBatch({
        product_id: Number(form.product_id),
        order_id: form.order_id ? Number(form.order_id) : null,
        quantity: Number(form.quantity || 0),
        note: form.note.trim() || null,
      });

      toast.success(`${data.production_batch.batch_number} partiyasi ochildi.`);
      setCreateOpen(false);
      setForm(emptyForm);
      fetchBatches(0, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Partiya ochishda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (batch) => {
    setCompleting(batch.id);

    try {
      await completeProductionBatch(batch.id);
      toast.success(`${batch.batch_number} yopildi.`);
      fetchBatches(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Partiyani yopishda xato.");
    } finally {
      setCompleting(null);
    }
  };

  return (
    <Box
      className="crm-page"
      sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", pb: 2.5 }}
    >
      <Box
        component="section"
        className="crm-page-hero"
        sx={{
          position: "relative",
          isolation: "isolate",
          mb: 2,
          p: { xs: 2.5, md: 3 },
          overflow: "hidden",
          color: "#ffffff",
          borderRadius: "25px",
          border: "1px solid rgba(255,255,255,.075)",
          backgroundColor: "#151211 !important",
          backgroundImage:
            "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.34),transparent 30%),linear-gradient(145deg,#151211,#1e1a18 52%,#3a1219) !important",
          boxShadow: "0 24px 60px rgba(23, 17, 15,.20)",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", xl: ".9fr 1.1fr" },
            gap: 3,
            alignItems: "center",
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.1 }}>
              <Box
                sx={{
                  width: 25,
                  height: 2,
                  borderRadius: 99,
                  background: "linear-gradient(90deg,#c9a875,#a3283a)",
                }}
              />

              <Typography
                sx={{
                  color: "#d9b782 !important",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".13em",
                  textTransform: "uppercase",
                }}
              >
                Ishlab chiqarish
              </Typography>
            </Box>

            <Typography
              component="h1"
              sx={{
                mt: 1.5,
                color: "#ffffff !important",
                fontSize: { xs: 29, md: 36 },
                lineHeight: 1.08,
                fontFamily: "var(--aa-display)",
                fontWeight: 400,
                letterSpacing: "-.024em",
              }}
            >
              Partiyalar
            </Typography>

            <Typography
              sx={{
                maxWidth: 560,
                mt: 1.4,
                color: "rgba(255,255,255,.45) !important",
                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Har bir partiya — bitta ishlab chiqarish yo‘li. Kroy qaysi materialdan kesgani va
              kosib qaysi padojni ishlatgani ish yozuvlaridan o‘zi aniqlanadi, yorliq esa yopiq
              karobka ichini ko‘rsatadi.
            </Typography>

            {canManage && (
              <Button
                onClick={openCreate}
                sx={{
                  mt: 2.4,
                  minHeight: 43,
                  px: 2.2,
                  color: "#ffffff !important",
                  borderRadius: "13px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: "none",
                  background: "linear-gradient(135deg,#6e1622,#8c1d2b)",
                  boxShadow: "0 12px 26px rgba(77, 15, 24,.30)",
                  "&:hover": { background: "linear-gradient(135deg,#4d0f18,#7a1826)" },
                }}
              >
                + Yangi partiya
              </Button>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", lg: "repeat(3,minmax(0,1fr))" },
              gap: 1.3,
            }}
          >
            <HeroMetric
              label="Jarayonda"
              value={formatNumber(counts.in_progress)}
              helper="Ochiq partiyalar"
              tone="amber"
              labelSx={{ mt: 1.4 }}
            />

            <HeroMetric
              label="Yopilgan"
              value={formatNumber(counts.completed)}
              helper="Yakunlangan"
              tone="green"
              labelSx={{ mt: 1.4 }}
            />

            <HeroMetric
              label="Ro‘yxatda"
              value={formatNumber(pageInfo.total)}
              helper="Filtr bo‘yicha"
              tone="blue"
              labelSx={{ mt: 1.4 }}
            />
          </Box>
        </Box>
      </Box>

      <Card sx={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            p: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.6fr 1fr 1fr" },
            gap: 1.4,
            borderBottom: "1px solid var(--aa-border)",
          }}
        >
          <TextField
            size="small"
            label="Qidirish"
            placeholder="Partiya raqami yoki mahsulot"
            value={filters.q}
            onChange={handleFilter("q")}
          />

          <TextField
            size="small"
            select
            label="Holat"
            value={filters.status}
            onChange={handleFilter("status")}
          >
            <MenuItem value="">Barchasi</MenuItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            select
            label="Mahsulot"
            value={filters.product_id}
            onChange={handleFilter("product_id")}
          >
            <MenuItem value="">Barchasi</MenuItem>
            {products.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.name}
                {product.color ? ` — ${product.color}` : ""}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box className="aa-mobile-records" sx={{ minHeight: 0, flex: 1, overflow: "auto" }}>
          <Table
            sx={{
              minWidth: 900,
              "& th": {
                py: 1.55,
                color: "var(--aa-text-tertiary)",
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: ".045em",
                textTransform: "uppercase",
                backgroundColor: "var(--aa-surface-muted)",
                borderColor: "#e8e1d8",
              },
              "& td": {
                py: 1.4,
                color: "var(--aa-text-secondary)",
                fontSize: 10.5,
                borderColor: "#e8e1d8",
              },
              "& tbody tr:hover": { backgroundColor: "rgba(110, 22, 34,.025)" },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Partiya</TableCell>
                <TableCell>Mahsulot</TableCell>
                <TableCell>Material / padoj</TableCell>
                <TableCell>Miqdor</TableCell>
                <TableCell>Ochilgan</TableCell>
                <TableCell align="right">Amallar</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={30} sx={{ color: "#6e1622" }} />
                  </TableCell>
                </TableRow>
              ) : batches.length ? (
                batches.map((batch) => (
                  <TableRow
                    key={batch.id}
                    hover
                    onClick={() => setDetailBatch(batch)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Typography
                        sx={{
                          color: "var(--aa-text)",
                          fontSize: 14,
                          fontWeight: 700,
                          letterSpacing: ".04em",
                        }}
                      >
                        {batch.batch_number}
                      </Typography>

                      <Box sx={{ mt: 0.6 }}>
                        <StatusChip status={batch.status} />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ color: "var(--aa-text)", fontSize: 13, fontWeight: 700 }}>
                        {batch.product_name}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.3,
                          color: "var(--aa-text-secondary)",
                          fontSize: 11.5,
                          fontWeight: 700,
                        }}
                      >
                        {[batch.product_color, formatSize(batch), batch.order_number]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {batch.material_name || batch.sole_name ? (
                        <>
                          <Typography
                            sx={{ color: "var(--aa-text)", fontSize: 11.5, fontWeight: 600 }}
                          >
                            {batch.material_name || "—"}
                          </Typography>

                          <Typography
                            sx={{ mt: 0.3, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}
                          >
                            {batch.sole_name || "padoj yo‘q"}
                          </Typography>
                        </>
                      ) : (
                        <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
                          Sarf yozilmagan
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ color: "var(--aa-text)", fontSize: 13, fontWeight: 700 }}>
                        {formatNumber(batch.quantity)} par
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600 }}>{formatDate(batch.started_at)}</TableCell>

                    <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setLabelBatch(batch)}
                          sx={tableActionSx}
                        >
                          Yorliq
                        </Button>

                        {canManage && batch.status === "in_progress" && (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={completing === batch.id}
                            onClick={() => handleComplete(batch)}
                            sx={tableActionSx}
                          >
                            {completing === batch.id ? "..." : "Yopish"}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 7, color: "var(--aa-text-tertiary)", fontWeight: 600 }}
                  >
                    Partiya topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box sx={{ borderTop: "1px solid #e8e1d8", backgroundColor: "var(--aa-surface-muted)" }}>
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) => fetchBatches(nextPage * pageInfo.limit, pageInfo.limit)}
            onLimitChange={(limit) => fetchBatches(0, limit)}
          />
        </Box>
      </Card>

      <PremiumDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Yangi partiya"
        subtitle="Material va padoj ish yozuvlaridan o'zi aniqlanadi"
        actions={
          <>
            <Button onClick={() => setCreateOpen(false)} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={saving || !form.product_id}
              sx={dialogPrimarySx}
            >
              {saving ? "Ochilmoqda..." : "Partiya ochish"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            select
            required
            label="Mahsulot"
            value={form.product_id}
            onChange={handleForm("product_id")}
          >
            {products.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.name}
                {product.color ? ` — ${product.color}` : ""}
              </MenuItem>
            ))}
          </TextField>

          {selectedProduct && (
            <Typography sx={{ mt: -1, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
              O‘lcham: {formatSize(selectedProduct) || "belgilanmagan"}
            </Typography>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" },
              gap: 1.6,
            }}
          >
            <TextField
              type="number"
              label="Miqdor (par)"
              value={form.quantity}
              onChange={handleForm("quantity")}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
            />

            <TextField
              select
              label="Zakaz (ixtiyoriy)"
              value={form.order_id}
              onChange={handleForm("order_id")}
            >
              <MenuItem value="">Zakazsiz</MenuItem>
              {orders.map((order) => (
                <MenuItem key={order.id} value={order.id}>
                  {order.order_number}
                  {order.client_name ? ` — ${order.client_name}` : ""}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            multiline
            minRows={2}
            label="Izoh"
            value={form.note}
            onChange={handleForm("note")}
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={Boolean(detailBatch)}
        onClose={() => setDetailBatch(null)}
        maxWidth="md"
        title="Partiya kartasi"
        subtitle="Karobka ichida nima borligi"
        actions={
          <>
            <Button onClick={() => setDetailBatch(null)} sx={dialogCancelSx}>
              Yopish
            </Button>

            <Button
              variant="contained"
              onClick={() => {
                setLabelBatch(detailBatch);
                setDetailBatch(null);
              }}
              sx={dialogPrimarySx}
            >
              Yorliq chop etish
            </Button>
          </>
        }
      >
        {detailBatch && (
          <BatchDetail
            batchId={detailBatch.id}
            canSeeOutputs={canSeeOutputs}
            onLoaded={setDetailBatch}
          />
        )}
      </PremiumDialog>

      <BatchLabelDialog
        open={Boolean(labelBatch)}
        batch={labelBatch}
        onClose={() => setLabelBatch(null)}
      />
    </Box>
  );
};

const tableActionSx = {
  minHeight: 32,
  px: 1.4,
  borderRadius: "9px",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "none",
  borderColor: "var(--aa-border-strong)",
  color: "var(--aa-text-secondary)",
};

const dialogCancelSx = {
  minHeight: 42,
  px: 2.2,
  color: "var(--aa-text-secondary)",
  borderRadius: "12px",
  fontSize: 11.5,
  fontWeight: 600,
  textTransform: "none",
};

const dialogPrimarySx = {
  minHeight: 42,
  px: 2.6,
  color: "#ffffff !important",
  borderRadius: "12px",
  fontSize: 11.5,
  fontWeight: 700,
  textTransform: "none",
  background: "linear-gradient(135deg,#6e1622,#8c1d2b)",
  boxShadow: "0 12px 26px rgba(77, 15, 24,.28)",
  "&:hover": { background: "linear-gradient(135deg,#4d0f18,#7a1826)" },
};

export default ProductionBatches;
