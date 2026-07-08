import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { useAuth } from "../../Context/AuthContext";
import CrmPagination from "../../Components/Common/CrmPagination";
import { getUsers } from "../../api/getUsers";
import { getProducts } from "../../api/products";
import { getDepartments } from "../../api/departments";
import {
  createBulkWorkerOutputs,
  deleteWorkerOutput,
  getWorkerOutputs,
  updateWorkerOutput,
} from "../../api/workerOutputs";

const emptyForm = {
  worker_id: "",
  product_id: "",
  department_id: "",
  quantity: "",
  worked_at: new Date().toISOString().slice(0, 10),
  note: "",
};

const emptyBatchItem = { product_id: "", quantity: "" };

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "0 so'm";
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value))} so'm`;
};

const formatNumber = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const getInitial = (value) =>
  String(value || "I")
    .trim()
    .slice(0, 1)
    .toUpperCase();

const Card = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: "20px",
      border: "1px solid rgba(148, 163, 184, 0.22)",
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
      boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const MiniStat = ({ label, value, tone = "default" }) => {
  const tones = {
    default: {
      color: "#0f172a",
      bg: "#ffffff",
      border: "rgba(148, 163, 184, 0.24)",
    },
    blue: {
      color: "#2563eb",
      bg: "rgba(37, 99, 235, 0.08)",
      border: "rgba(37, 99, 235, 0.18)",
    },
    green: {
      color: "#15803d",
      bg: "rgba(34, 197, 94, 0.1)",
      border: "rgba(34, 197, 94, 0.22)",
    },
    red: {
      color: "#8b0101",
      bg: "rgba(139, 1, 1, 0.08)",
      border: "rgba(139, 1, 1, 0.18)",
    },
  };

  const current = tones[tone] || tones.default;

  return (
    <Box
      sx={{
        minWidth: 120,
        px: 2,
        py: 1.4,
        borderRadius: "16px",
        background: current.bg,
        border: `1px solid ${current.border}`,
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.3,
          fontSize: 20,
          fontWeight: 950,
          color: current.color,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const DepartmentChip = ({ label }) => (
  <Chip
    size="small"
    label={label || "-"}
    sx={{
      height: 25,
      px: 0.35,
      fontSize: 12,
      fontWeight: 900,
      color: "#2563eb",
      background: "rgba(37, 99, 235, 0.08)",
      border: "1px solid rgba(37, 99, 235, 0.16)",
    }}
  />
);

const PremiumDialog = ({ open, onClose, title, children, actions, maxWidth = "md" }) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth={maxWidth}
    PaperProps={{
      sx: {
        borderRadius: "22px",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        boxShadow: "0 30px 80px rgba(15, 23, 42, 0.22)",
        overflow: "hidden",
      },
    }}
  >
    <DialogTitle
      sx={{
        px: 3,
        py: 2.2,
        fontSize: 22,
        fontWeight: 950,
        color: "#0f172a",
        borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
        background: "linear-gradient(135deg, #ffffff, #f8fafc)",
      }}
    >
      {title}
    </DialogTitle>

    <DialogContent sx={{ px: 3, py: 2.5 }}>{children}</DialogContent>

    {actions && (
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid rgba(148, 163, 184, 0.18)",
          background: "rgba(248, 250, 252, 0.72)",
        }}
      >
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

const WorkerOutputs = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const canManage = ["super_admin", "admin"].includes(currentUser?.role);

  const [outputs, setOutputs] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, offset: 0, limit: 10 });
  const [totals, setTotals] = useState({ total_quantity: 0, total_amount: 0 });
  const [loading, setLoading] = useState(false);

  const [workers, setWorkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    worker_id: "",
    product_id: "",
    department_id: "",
    date_from: "",
    date_to: "",
    sort_by: "worked_at",
    sort_order: "desc",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [batchItems, setBatchItems] = useState([{ ...emptyBatchItem }]);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const selectedProduct = useMemo(
    () => products.find((product) => Number(product.id) === Number(form.product_id)),
    [form.product_id, products],
  );

  const selectedDepartment = useMemo(
    () => departments.find((department) => Number(department.id) === Number(form.department_id)),
    [departments, form.department_id],
  );

  const fetchSelectData = useCallback(async () => {
    try {
      const [usersRes, productsRes, departmentsRes] = await Promise.all([
        getUsers({
          offset: 0,
          limit: 100,
          sort_by: "created_at",
          sort_order: "desc",
        }),
        getProducts({
          offset: 0,
          limit: 100,
          sort_by: "name",
          sort_order: "asc",
          is_active: true,
        }),
        getDepartments({
          offset: 0,
          limit: 100,
          sort_by: "sort_order",
          sort_order: "asc",
          is_active: true,
        }),
      ]);

      setWorkers(
        (usersRes.data.users || usersRes.data.list || []).filter((user) => user.role === "worker"),
      );
      setProducts(productsRes.data.products || []);
      setDepartments(departmentsRes.data.departments || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Tanlov ma'lumotlarini olishda xato.");
    }
  }, []);

  const buildParams = useCallback(
    (offset = 0, limit = pageInfo.limit) => {
      const params = {
        offset,
        limit,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      };

      for (const key of ["q", "worker_id", "product_id", "department_id", "date_from", "date_to"]) {
        if (filters[key] !== "") params[key] = filters[key];
      }

      return params;
    },
    [filters, pageInfo.limit],
  );

  const fetchOutputs = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        const { data } = await getWorkerOutputs(buildParams(offset, limit));

        setOutputs(data.worker_outputs || []);
        setTotals(data.totals || { total_quantity: 0, total_amount: 0 });
        setPageInfo(data.pageInfo || { total: 0, offset, limit });
      } catch (error) {
        toast.error(error?.response?.data?.message || "Ish yozuvlarini olishda xato.");
      } finally {
        setLoading(false);
      }
    },
    [buildParams, pageInfo.limit],
  );

  useEffect(() => {
    fetchSelectData();
  }, [fetchSelectData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOutputs(0, pageInfo.limit);
    }, 250);

    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit, fetchOutputs]);

  const handleFilterChange = (field) => (event) => {
    setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleFormChange = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const refreshPage = () => {
    fetchOutputs(pageInfo.offset, pageInfo.limit);
  };

  const openCreateModal = () => {
    setSelectedOutput(null);
    setForm(emptyForm);
    setBatchItems([{ ...emptyBatchItem }]);
    setModalOpen(true);
  };

  const openEditModal = (output) => {
    setSelectedOutput(output);
    setForm({
      worker_id: output.worker_id || "",
      product_id: output.product_id || "",
      department_id: output.department_id || "",
      quantity: output.quantity ?? "",
      worked_at: output.worked_at ? String(output.worked_at).slice(0, 10) : emptyForm.worked_at,
      note: output.note || "",
    });
    setModalOpen(true);
  };

  const closeModals = () => {
    setModalOpen(false);
    setDeleteOpen(false);
    setSelectedOutput(null);
    setForm(emptyForm);
    setBatchItems([{ ...emptyBatchItem }]);
  };

  const changeBatchItem = (index, field) => (event) => {
    const value = event.target.value;

    setBatchItems((previous) =>
      previous.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  };

  const addBatchItem = () => {
    setBatchItems((previous) => [...previous, { ...emptyBatchItem }]);
  };

  const removeBatchItem = (index) => {
    setBatchItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const validateForm = () => {
    if (!form.worker_id) {
      toast.error("Ishchini tanlang.");
      return false;
    }

    if (!form.department_id) {
      toast.error("Bo'limni tanlang.");
      return false;
    }

    if (selectedOutput) {
      if (!form.product_id) {
        toast.error("Mahsulotni tanlang.");
        return false;
      }

      if (!form.quantity || Number(form.quantity) <= 0) {
        toast.error("Miqdorni to'g'ri kiriting.");
        return false;
      }
    } else {
      if (batchItems.some((item) => !item.product_id || Number(item.quantity) <= 0)) {
        toast.error("Har bir qatorda mahsulot va miqdorni to'g'ri kiriting.");
        return false;
      }

      const productIds = batchItems.map((item) => String(item.product_id));

      if (new Set(productIds).size !== productIds.length) {
        toast.error("Bir mahsulotni ikki marta tanlamang, miqdorini bitta qatorda jamlang.");
        return false;
      }
    }

    return true;
  };

  const buildPayload = () => ({
    worker_id: Number(form.worker_id),
    product_id: Number(form.product_id),
    department_id: Number(form.department_id),
    quantity: Number(form.quantity),
    worked_at: form.worked_at || undefined,
    note: form.note.trim() || null,
  });

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      if (selectedOutput) {
        await updateWorkerOutput(selectedOutput.id, buildPayload());
        toast.success("Ish yozuvi yangilandi.");
      } else {
        await createBulkWorkerOutputs({
          worker_id: Number(form.worker_id),
          department_id: Number(form.department_id),
          worked_at: form.worked_at || undefined,
          note: form.note.trim() || null,
          items: batchItems.map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
          })),
        });
        toast.success(`${batchItems.length} ta ish yozuvi qo'shildi.`);
      }

      closeModals();
      refreshPage();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ish yozuvini saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOutput) return;

    setDeleting(true);

    try {
      await deleteWorkerOutput(selectedOutput.id);
      toast.success("Ish yozuvi o'chirildi.");
      closeModals();
      refreshPage();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ish yozuvini o'chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const applyFilters = () => {
    fetchOutputs(0, pageInfo.limit);
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      worker_id: "",
      product_id: "",
      department_id: "",
      date_from: "",
      date_to: "",
      sort_by: "worked_at",
      sort_order: "desc",
    });
    setFiltersOpen(false);
  };

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2,
      }}
    >
      <Card sx={{ mb: 2.5, px: { xs: 2, md: 2.5 }, py: 2.2, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Chip
              label="Al-amin CRM • ish hisoboti"
              size="small"
              sx={{
                mb: 1,
                height: 25,
                fontSize: 12,
                fontWeight: 950,
                color: "#2563eb",
                background: "rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(37, 99, 235, 0.16)",
              }}
            />

            <Typography
              sx={{
                fontSize: { xs: 27, md: 33 },
                fontWeight: 950,
                color: "#0f172a",
                letterSpacing: "-0.055em",
                lineHeight: 1.05,
              }}
            >
              Ish hisoboti
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 14,
                fontWeight: 650,
                color: "#64748b",
              }}
            >
              Ishchilar bajargan mahsulot ishlari va oylik hisob-kitobi.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, auto)" },
              gap: 1.4,
              width: { xs: "100%", md: "auto" },
            }}
          >
            <MiniStat label="Yozuvlar" value={pageInfo.total} tone="blue" />
            <MiniStat label="Miqdor" value={formatNumber(totals.total_quantity)} tone="green" />
            <MiniStat label="Summa" value={formatMoney(totals.total_amount)} tone="red" />
          </Box>
        </Box>
      </Card>

      <Card sx={{ mb: 2.5, p: 2, flexShrink: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.6 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "stretch", xl: "center" },
              justifyContent: "space-between",
              flexDirection: { xs: "column", xl: "row" },
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                gap: 1.4,
                flex: 1,
              }}
            >
              <TextField
                size="small"
                label="Qidirish"
                value={filters.q}
                onChange={handleFilterChange("q")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilters();
                }}
              />

              <TextField
                select
                size="small"
                label="Ishchi"
                value={filters.worker_id}
                onChange={handleFilterChange("worker_id")}
              >
                <MenuItem value="">Barchasi</MenuItem>
                {workers.map((worker) => (
                  <MenuItem key={worker.id} value={worker.id}>
                    {worker.first_name} {worker.last_name}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="outlined"
                onClick={() => setFiltersOpen((open) => !open)}
                sx={{
                  height: 42,
                  borderRadius: "13px",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "#0f172a",
                  borderColor: "rgba(37, 99, 235, 0.22)",
                  background: "#fff",
                }}
              >
                {filtersOpen ? "Filtrlarni yopish" : "Batafsil filtrlar"}
              </Button>

              <Button
                variant="outlined"
                onClick={resetFilters}
                sx={{
                  height: 42,
                  borderRadius: "13px",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "#0f172a",
                  borderColor: "rgba(37, 99, 235, 0.22)",
                  background: "#fff",
                }}
              >
                Tozalash
              </Button>
            </Box>

            {canManage && (
              <Button
                variant="contained"
                onClick={openCreateModal}
                sx={{
                  minWidth: 210,
                  height: 42,
                  borderRadius: "13px",
                  textTransform: "none",
                  fontWeight: 950,
                  background: "linear-gradient(135deg, #8b0101, #b91c1c)",
                  boxShadow: "0 14px 28px rgba(139, 1, 1, 0.2)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #7f0101, #991b1b)",
                  },
                }}
              >
                Ish yozuvi qo'shish
              </Button>
            )}
          </Box>

          {filtersOpen && (
            <Box
              sx={{
                pt: 1.6,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                gap: 1.4,
                borderTop: "1px solid rgba(148, 163, 184, 0.18)",
              }}
            >
              <TextField
                select
                size="small"
                label="Mahsulot"
                value={filters.product_id}
                onChange={handleFilterChange("product_id")}
              >
                <MenuItem value="">Barchasi</MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Bo'lim"
                value={filters.department_id}
                onChange={handleFilterChange("department_id")}
              >
                <MenuItem value="">Barchasi</MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                type="date"
                label="Dan"
                value={filters.date_from}
                onChange={handleFilterChange("date_from")}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                size="small"
                type="date"
                label="Gacha"
                value={filters.date_to}
                onChange={handleFilterChange("date_to")}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          )}
        </Box>
      </Card>

      <Card
        sx={{
          minHeight: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ minHeight: 0, flex: 1, overflow: "auto" }}>
          <Table
            sx={{
              minWidth: canManage ? 980 : 820,
              "& th": {
                py: 1.7,
                fontSize: 12,
                fontWeight: 950,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                background: "rgba(248, 250, 252, 0.95)",
                borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
              },
              "& td": {
                py: 1.55,
                borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
              },
              "& tbody tr:hover": {
                background: "rgba(37, 99, 235, 0.035)",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Ishchi</TableCell>
                <TableCell>Ish turi</TableCell>
                <TableCell>Hisob</TableCell>
                <TableCell>Sana</TableCell>
                {canManage && <TableCell align="right">Amallar</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : outputs.length ? (
                outputs.map((output) => (
                  <TableRow key={output.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.6 }}>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: "#8b0101",
                            color: "#fff",
                            fontWeight: 950,
                            border: "3px solid #fff",
                            boxShadow: "0 10px 24px rgba(139, 1, 1, 0.14)",
                          }}
                        >
                          {getInitial(output.worker_name)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 14.5,
                              fontWeight: 900,
                              color: "#0f172a",
                              lineHeight: 1.15,
                            }}
                          >
                            {output.worker_name || "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "#64748b",
                            }}
                          >
                            @{output.worker_username || "worker"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 900, color: "#0f172a" }}>
                        {output.product_name || "-"}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          mb: 0.7,
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        {output.product_sku || output.product_model || "-"}
                      </Typography>

                      <DepartmentChip label={output.department_name} />
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 950, color: "#0f172a" }}>
                        {formatMoney(output.total_amount)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        {formatNumber(output.quantity)} dona × {formatMoney(output.price_per_unit)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 800, color: "#334155" }}>
                      {formatDate(output.worked_at)}
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openEditModal(output)}
                            sx={{
                              borderRadius: "10px",
                              textTransform: "none",
                              fontWeight: 900,
                            }}
                          >
                            O'zgartirish
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => {
                              setSelectedOutput(output);
                              setDeleteOpen(true);
                            }}
                            sx={{
                              borderRadius: "10px",
                              textTransform: "none",
                              fontWeight: 900,
                            }}
                          >
                            O'chirish
                          </Button>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    align="center"
                    sx={{ py: 7, color: "#64748b", fontWeight: 850 }}
                  >
                    Ish yozuvlari topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid rgba(148, 163, 184, 0.18)",
            background: "rgba(248, 250, 252, 0.65)",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) => fetchOutputs(nextPage * pageInfo.limit, pageInfo.limit)}
            onLimitChange={(limit) => fetchOutputs(0, limit)}
          />
        </Box>
      </Card>

      <PremiumDialog
        open={modalOpen}
        onClose={closeModals}
        title={selectedOutput ? "Ish yozuvini tahrirlash" : "Ish yozuvi qo'shish"}
        actions={
          <>
            <Button
              onClick={closeModals}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 850 }}
            >
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{
                minWidth: 120,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                background: "linear-gradient(135deg, #8b0101, #b91c1c)",
                boxShadow: "0 12px 25px rgba(139, 1, 1, 0.2)",
              }}
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </>
        }
      >
        <Stack spacing={2.1}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.6,
            }}
          >
            <TextField
              select
              required
              label="Ishchi"
              value={form.worker_id}
              onChange={handleFormChange("worker_id")}
            >
              {workers.map((worker) => (
                <MenuItem key={worker.id} value={worker.id}>
                  {worker.first_name} {worker.last_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              required
              label="Bo'lim"
              value={form.department_id}
              onChange={handleFormChange("department_id")}
            >
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="Sana"
              value={form.worked_at}
              onChange={handleFormChange("worked_at")}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {selectedOutput ? (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.6,
                }}
              >
                <TextField
                  select
                  required
                  label="Mahsulot"
                  value={form.product_id}
                  onChange={handleFormChange("product_id")}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  required
                  type="number"
                  label="Miqdor"
                  value={form.quantity}
                  onChange={handleFormChange("quantity")}
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                />
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: "18px",
                  background: "#f8fafc",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#64748b" }}>
                  Tanlangan
                </Typography>

                <Typography sx={{ mt: 0.6, fontSize: 15, fontWeight: 950, color: "#0f172a" }}>
                  {selectedProduct?.name || "Mahsulot tanlanmagan"} /{" "}
                  {selectedDepartment?.name || "Bo'lim tanlanmagan"}
                </Typography>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: "18px",
                background: "linear-gradient(135deg, #ffffff, #f8fafc)",
                border: "1px solid rgba(148, 163, 184, 0.22)",
              }}
            >
              <Box
                sx={{
                  mb: 1.6,
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1.3,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 950, color: "#0f172a" }}>
                    Mahsulot va miqdorlar
                  </Typography>

                  <Typography sx={{ mt: 0.4, fontSize: 13, fontWeight: 650, color: "#64748b" }}>
                    Narx va summa backendda avtomatik hisoblanadi.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  onClick={addBatchItem}
                  sx={{
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 900,
                  }}
                >
                  Qator qo'shish
                </Button>
              </Box>

              <Stack spacing={1.4}>
                {batchItems.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 180px auto" },
                      gap: 1.3,
                      p: 1.4,
                      borderRadius: "16px",
                      background: "#ffffff",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                    }}
                  >
                    <TextField
                      select
                      required
                      label="Mahsulot"
                      value={item.product_id}
                      onChange={changeBatchItem(index, "product_id")}
                    >
                      {products.map((product) => (
                        <MenuItem
                          key={product.id}
                          value={product.id}
                          disabled={batchItems.some(
                            (row, rowIndex) =>
                              rowIndex !== index && Number(row.product_id) === Number(product.id),
                          )}
                        >
                          {product.name}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      required
                      type="number"
                      label="Miqdor"
                      value={item.quantity}
                      onChange={changeBatchItem(index, "quantity")}
                      slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    />

                    <Button
                      color="error"
                      onClick={() => removeBatchItem(index)}
                      disabled={batchItems.length === 1}
                      sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 850 }}
                    >
                      Olib tashlash
                    </Button>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Izoh"
            value={form.note}
            onChange={handleFormChange("note")}
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={deleteOpen}
        onClose={closeModals}
        title="Ish yozuvini o'chirish"
        maxWidth="xs"
        actions={
          <>
            <Button
              onClick={closeModals}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 850 }}
            >
              Bekor qilish
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deleting}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 900 }}
            >
              {deleting ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </>
        }
      >
        <Typography sx={{ color: "#334155", fontWeight: 700 }}>
          {selectedOutput?.worker_name} yozuvini o'chirmoqchimisiz?
        </Typography>
      </PremiumDialog>
    </Box>
  );
};

export default WorkerOutputs;