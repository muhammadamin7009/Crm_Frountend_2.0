import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
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

import {
  createMaterialPurchase,
  createRawMaterial,
  createSupplier,
  createSupplierPayment,
  deleteMaterialPurchase,
  deleteSupplier,
  getMaterialPurchases,
  getRawMaterialStock,
  getRawMaterials,
  getSupplierBalance,
  getSuppliers,
  updateSupplier,
} from "../../api/materialPurchases";
import CrmPagination from "../../Components/Common/CrmPagination";
import { useAuth } from "../../Context/AuthContext";
import { hasPermission } from "../../utils/permissions";

const today = () => new Date().toISOString().slice(0, 10);

const emptyPurchase = {
  supplier_id: "",
  purchased_at: today(),
  paid_amount: "",
  note: "",
  items: [{ raw_material_id: "", quantity: "", unit_price: "" }],
};

const emptySupplier = {
  name: "",
  phone: "",
  address: "",
  opening_balance: "",
  note: "",
};

const emptyMaterial = { name: "", unit: "dona", note: "" };

const emptyPayment = {
  supplier_id: "",
  amount: "",
  paid_at: today(),
  note: "",
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const money = (value) =>
  `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

const date = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const Card = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: "var(--aa-radius-xl)",
      border: "1px solid var(--aa-border)",
      background: "var(--aa-surface)",
      boxShadow: "var(--aa-shadow-xs)",
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
      color: "var(--aa-text)",
      bg: "var(--aa-surface-solid)",
      border: "var(--aa-border)",
    },
    blue: {
      color: "var(--aa-info)",
      bg: "color-mix(in srgb, var(--aa-info) 8%, transparent)",
      border: "color-mix(in srgb, var(--aa-info) 18%, transparent)",
    },
    green: {
      color: "var(--aa-success)",
      bg: "color-mix(in srgb, var(--aa-success) 9%, transparent)",
      border: "color-mix(in srgb, var(--aa-success) 20%, transparent)",
    },
    red: {
      color: "var(--aa-brand-700)",
      bg: "var(--aa-brand-50)",
      border: "var(--aa-brand-100)",
    },
    orange: {
      color: "var(--aa-warning)",
      bg: "color-mix(in srgb, var(--aa-warning) 10%, transparent)",
      border: "color-mix(in srgb, var(--aa-warning) 22%, transparent)",
    },
  };

  const current = tones[tone] || tones.default;

  return (
    <Box
      sx={{
        minWidth: 135,
        px: 2,
        py: 1.35,
        borderRadius: "var(--aa-radius-lg)",
        background: current.bg,
        border: `1px solid ${current.border}`,
        boxShadow: "var(--aa-shadow-xs)",
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 850,
          color: "var(--aa-text-secondary)",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.35,
          fontSize: 18,
          fontWeight: 950,
          color: current.color,
          letterSpacing: "-0.04em",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const BalanceBox = ({ label, value, tone = "default" }) => {
  const colors = {
    default: "var(--aa-text)",
    blue: "var(--aa-info)",
    green: "var(--aa-success)",
    red: "var(--aa-brand-700)",
    orange: "var(--aa-warning)",
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: "var(--aa-radius-md)",
        background: "var(--aa-surface-solid)",
        border: "1px solid var(--aa-border)",
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 850,
          color: "var(--aa-text-secondary)",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.45,
          fontSize: 15,
          fontWeight: 950,
          color: colors[tone] || colors.default,
          letterSpacing: "-0.035em",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const PremiumDialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "md",
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth={maxWidth}
    PaperProps={{
      sx: {
        borderRadius: "var(--aa-radius-xl)",
        border: "1px solid var(--aa-border)",
        boxShadow: "var(--aa-shadow-lg)",
        backgroundImage: "none",
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
        color: "var(--aa-text)",
        borderBottom: "1px solid var(--aa-border)",
        background: "var(--aa-surface)",
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
          borderTop: "1px solid var(--aa-border)",
          background: "var(--aa-surface-muted)",
        }}
      >
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

const MaterialPurchases = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const canManage =
    ["super_admin", "admin"].includes(currentUser?.role) &&
    hasPermission(currentUser, "material_purchases.manage");

  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [stockRows, setStockRows] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, offset: 0, limit: 10 });
  const [balance, setBalance] = useState({
    opening_balance: 0,
    total_purchase: 0,
    total_paid: 0,
    debt_amount: 0,
  });
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    q: "",
    supplier_id: "",
    date_from: "",
    date_to: "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [purchaseForm, setPurchaseForm] = useState(emptyPurchase);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState(null);
  const [selectedSupplierForDelete, setSelectedSupplierForDelete] =
    useState(null);
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [quickMaterialOpen, setQuickMaterialOpen] = useState(false);

  const [quickMaterialIndex, setQuickMaterialIndex] = useState(0);
  const [quickMaterialForm, setQuickMaterialForm] = useState(emptyMaterial);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [supplierDeleteOpen, setSupplierDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const openingPeriodDebt = Math.max(
    0,
    Number(balance.debt_amount || 0) -
      (Number(balance.total_purchase || 0) - Number(balance.total_paid || 0)),
  );

  const subtotal = useMemo(
    () =>
      purchaseForm.items.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
        0,
      ),
    [purchaseForm.items],
  );

  const selectedSupplier = suppliers.find(
    (item) => Number(item.id) === Number(purchaseForm.supplier_id),
  );

  const previousDebt = Number(selectedSupplier?.current_debt || 0);
  const paidAmount = Number(purchaseForm.paid_amount || 0);
  const newDebt = previousDebt + subtotal - paidAmount;

  const fetchDictionaries = useCallback(async () => {
    try {
      const [suppliersRes, materialsRes] = await Promise.all([
        getSuppliers({ limit: 100 }),
        getRawMaterials({ limit: 100 }),
      ]);

      const rows = suppliersRes.data.suppliers || [];

      const withBalances = await Promise.all(
        rows.map(async (supplier) => {
          const { data } = await getSupplierBalance({
            supplier_id: supplier.id,
          });

          return { ...supplier, current_debt: data.debt_amount || 0 };
        }),
      );

      setSuppliers(withBalances);
      setMaterials(materialsRes.data.raw_materials || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Ma'lumotlarni olishda xato.",
      );
    }
  }, []);

  const fetchPurchases = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        const params = { offset, limit, sort_order: "desc" };

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== "") params[key] = value;
        });

        const [purchasesRes, balanceRes, stockRes] = await Promise.all([
          getMaterialPurchases(params),
          getSupplierBalance({
            supplier_id: filters.supplier_id || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
          }),
          getRawMaterialStock({
            q: filters.q || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
            limit: 8,
          }),
        ]);

        setPurchases(purchasesRes.data.material_purchases || []);
        setStockRows(stockRes.data.stock || []);
        setPageInfo(purchasesRes.data.pageInfo || { total: 0, offset, limit });
        setBalance(
          balanceRes.data || {
            opening_balance: 0,
            total_purchase: 0,
            total_paid: 0,
            debt_amount: 0,
          },
        );
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Xaridlarni olishda xato.",
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, pageInfo.limit],
  );

  useEffect(() => {
    fetchDictionaries();
  }, [fetchDictionaries]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPurchases(0, pageInfo.limit), 250);

    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit, fetchPurchases]);

  const resetFilters = () => {
    setFilters({ q: "", supplier_id: "", date_from: "", date_to: "" });
    setFiltersOpen(false);
  };

  const close = () => {
    setPurchaseOpen(false);
    setSupplierOpen(false);
    setMaterialOpen(false);
    setPaymentOpen(false);
    setQuickMaterialOpen(false);
    setDeleteOpen(false);
    setSupplierDeleteOpen(false);
    setSelectedPurchase(null);
    setSelectedSupplierForDelete(null);
    setPurchaseForm(emptyPurchase);
    setSupplierForm(emptySupplier);
    setSelectedSupplierForEdit(null);
    setMaterialForm(emptyMaterial);
    setPaymentForm(emptyPayment);
  };

  const refresh = () => {
    fetchDictionaries();
    fetchPurchases(pageInfo.offset, pageInfo.limit);
  };

  const confirmDeletePurchase = async () => {
    if (!selectedPurchase || deleting) return;
    setDeleting(true);
    try {
      await deleteMaterialPurchase(selectedPurchase.id);
      toast.success("Xarid o'chirildi.");
      close();
      refresh();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Xaridni o'chirishda xato.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const changeItem = (index, field, value) =>
    setPurchaseForm((previous) => ({
      ...previous,
      items: previous.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));

  const saveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast.error("Ta'minotchi nomini kiriting.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...supplierForm,
        opening_balance: Number(supplierForm.opening_balance || 0),
      };

      if (selectedSupplierForEdit) {
        await updateSupplier(selectedSupplierForEdit.id, payload);
        toast.success("Ta'minotchi yangilandi.");
      } else {
        await createSupplier(payload);
        toast.success("Ta'minotchi qo'shildi.");
      }

      setSupplierForm(emptySupplier);
      setSelectedSupplierForEdit(null);
      await fetchDictionaries();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const editSupplier = (supplier) => {
    setSelectedSupplierForEdit(supplier);
    setSupplierForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      opening_balance: supplier.opening_balance ?? "",
      note: supplier.note || "",
    });
  };

  const removeSupplier = (supplier) => {
    setSelectedSupplierForDelete(supplier);
    setSupplierDeleteOpen(true);
  };

  const confirmRemoveSupplier = async () => {
    if (!selectedSupplierForDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteSupplier(selectedSupplierForDelete.id);
      toast.success("Ta'minotchi o'chirildi.");

      if (selectedSupplierForEdit?.id === selectedSupplierForDelete.id) {
        setSelectedSupplierForEdit(null);
        setSupplierForm(emptySupplier);
      }

      close();
      refresh();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Ta'minotchini o'chirishda xato.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const saveMaterial = async () => {
    if (!materialForm.name.trim()) {
      toast.error("Homashyo nomini kiriting.");
      return;
    }

    setSaving(true);

    try {
      await createRawMaterial(materialForm);
      toast.success("Homashyo qo'shildi.");
      close();
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const saveQuickMaterial = async () => {
    if (!quickMaterialForm.name.trim()) {
      toast.error("Homashyo nomini kiriting.");
      return;
    }

    setSaving(true);

    try {
      const { data } = await createRawMaterial(quickMaterialForm);
      const newMaterial = data.raw_material;

      setMaterials((previous) => [...previous, newMaterial]);
      changeItem(quickMaterialIndex, "raw_material_id", newMaterial.id);
      setQuickMaterialOpen(false);
      setQuickMaterialForm(emptyMaterial);
      toast.success("Homashyo yaratildi va qatorga tanlandi.");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Homashyoni yaratishda xato.",
      );
    } finally {
      setSaving(false);
    }
  };

  const savePurchase = async () => {
    if (
      !purchaseForm.supplier_id ||
      purchaseForm.items.some(
        (item) =>
          !item.raw_material_id ||
          Number(item.quantity) <= 0 ||
          Number(item.unit_price) < 0,
      )
    ) {
      toast.error("Ta'minotchi va barcha homashyo qatorlarini to'ldiring.");
      return;
    }

    setSaving(true);

    try {
      await createMaterialPurchase({
        ...purchaseForm,
        supplier_id: Number(purchaseForm.supplier_id),
        paid_amount: Number(purchaseForm.paid_amount || 0),
        items: purchaseForm.items.map((item) => ({
          raw_material_id: Number(item.raw_material_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      });

      toast.success("Homashyo xaridi saqlandi.");
      close();
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xaridni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async () => {
    if (!paymentForm.supplier_id || Number(paymentForm.amount) <= 0) {
      toast.error("Ta'minotchi va summani kiriting.");
      return;
    }

    setSaving(true);

    try {
      await createSupplierPayment({
        ...paymentForm,
        supplier_id: Number(paymentForm.supplier_id),
        amount: Number(paymentForm.amount),
      });

      toast.success("Ta'minotchi to'lovi saqlandi.");
      close();
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "To'lovni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2,
        color: "var(--aa-text)",
        "& .MuiOutlinedInput-root": {
          borderRadius: "var(--aa-radius-md)",
          backgroundColor: "var(--aa-surface-solid)",
        },
      }}
    >
      <Card sx={{ mb: 1, px: { xs: 2, md: 2.5 }, py: 2.2, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", xl: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", xl: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Chip
              label="Al-amin CRM - homashyo xaridi"
              size="small"
              sx={{
                mb: 1,
                height: 25,
                fontSize: 12,
                fontWeight: 950,
                color: "var(--aa-brand-700)",
                background: "var(--aa-brand-50)",
                border: "1px solid var(--aa-brand-100)",
                borderRadius: "var(--aa-radius-pill)",
              }}
            />

            <Typography
              sx={{
                fontSize: { xs: 27, md: 33 },
                fontWeight: 950,
                color: "var(--aa-text)",
                letterSpacing: "-0.055em",
                lineHeight: 1.05,
              }}
            >
              Homashyo xaridi
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 14,
                fontWeight: 650,
                color: "var(--aa-text-secondary)",
              }}
            >
              Qayerdan, nima, qancha va nech pulga kelganini nazorat qilish.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(4, auto)",
              },
              gap: 1.2,
              width: { xs: "100%", xl: "auto" },
            }}
          >
            <MiniStat
              label="Davr xaridi"
              value={money(balance.total_purchase)}
              tone="blue"
            />
            <MiniStat
              label="Berildi"
              value={money(balance.total_paid)}
              tone="green"
            />
            <MiniStat
              label="Oldingi qarz"
              value={money(openingPeriodDebt)}
              tone="orange"
            />
            <MiniStat
              label="Umumiy qarz"
              value={money(balance.debt_amount)}
              tone="red"
            />
          </Box>
        </Box>
      </Card>

      <Card sx={{ mb: 1, p: 2, flexShrink: 0 }}>
        <Box
          sx={{
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: 17, fontWeight: 950, color: "var(--aa-text)" }}
            >
              Homashyo kirim hisoboti
            </Typography>
            <Typography
              sx={{
                mt: 0.35,
                fontSize: 13,
                fontWeight: 650,
                color: "var(--aa-text-secondary)",
              }}
            >
              Tanlangan davr bo'yicha kelgan homashyo miqdori va summasi.
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${stockRows.length} tur`}
            sx={{
              height: 26,
              fontSize: 12,
              fontWeight: 900,
              color: "var(--aa-info)",
              background: "color-mix(in srgb, var(--aa-info) 8%, transparent)",
              border:
                "1px solid color-mix(in srgb, var(--aa-info) 16%, transparent)",
            }}
          />
        </Box>

        {stockRows.length ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, 1fr)",
                xl: "repeat(4, 1fr)",
              },
              gap: 1.2,
            }}
          >
            {stockRows.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 1.5,
                  borderRadius: "var(--aa-radius-lg)",
                  background: "var(--aa-surface-solid)",
                  border: "1px solid var(--aa-border)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 950,
                    color: "var(--aa-text)",
                  }}
                >
                  {item.name}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.45,
                    fontSize: 13,
                    fontWeight: 750,
                    color: "var(--aa-text-secondary)",
                  }}
                >
                  {Number(item.total_quantity || 0).toLocaleString("uz-UZ")}{" "}
                  {item.unit}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.35,
                    fontSize: 13,
                    fontWeight: 850,
                    color: "var(--aa-success)",
                  }}
                >
                  Jami: {money(item.total_amount)}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--aa-text-tertiary)",
                  }}
                >
                  O'rtacha: {money(item.average_price)}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            sx={{
              py: 2,
              fontSize: 14,
              fontWeight: 750,
              color: "var(--aa-text-secondary)",
            }}
          >
            Tanlangan davr bo'yicha homashyo kirimi topilmadi.
          </Typography>
        )}
      </Card>

      <Card sx={{ mb: 1, p: 2, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "stretch", xl: "start" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", xl: "row" },
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 1.2,
              flex: 1,
            }}
          >
            <TextField
              size="small"
              label="Qidirish"
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              onKeyDown={(event) => {
                if (event.key === "Enter") fetchPurchases(0, pageInfo.limit);
              }}
            />

            <TextField
              select
              size="small"
              label="Ta'minotchi"
              value={filters.supplier_id}
              onChange={(e) =>
                setFilters((p) => ({ ...p, supplier_id: e.target.value }))
              }
            >
              <MenuItem value="">Barchasi</MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              onClick={() => setFiltersOpen((open) => !open)}
              sx={{
                height: 42,
                borderRadius: "var(--aa-radius-md)",
                textTransform: "none",
                fontWeight: 900,
                color: "var(--aa-text)",
                borderColor: "var(--aa-border-strong)",
                background: "var(--aa-surface-solid)",
              }}
            >
              {filtersOpen ? "Filtrlarni yopish" : "Batafsil filtrlar"}
            </Button>

            <Button
              variant="outlined"
              onClick={resetFilters}
              sx={{
                height: 42,
                borderRadius: "var(--aa-radius-md)",
                textTransform: "none",
                fontWeight: 900,
                color: "var(--aa-text)",
                borderColor: "var(--aa-border-strong)",
                background: "var(--aa-surface-solid)",
              }}
            >
              Tozalash
            </Button>

            {filtersOpen && (
              <>
                <TextField
                  size="small"
                  type="date"
                  label="Dan"
                  value={filters.date_from}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, date_from: e.target.value }))
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <TextField
                  size="small"
                  type="date"
                  label="Gacha"
                  value={filters.date_to}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, date_to: e.target.value }))
                  }
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </>
            )}
          </Box>

          {canManage && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                variant="outlined"
                onClick={() => setSupplierOpen(true)}
                sx={{
                  minWidth: 135,
                  height: 42,
                  borderRadius: "var(--aa-radius-md)",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "var(--aa-text)",
                  borderColor: "var(--aa-border-strong)",
                  background: "var(--aa-surface-solid)",
                }}
              >
                Ta'minotchilar
              </Button>

              <Button
                variant="outlined"
                onClick={() => setMaterialOpen(true)}
                sx={{
                  minWidth: 115,
                  height: 42,
                  borderRadius: "var(--aa-radius-md)",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "var(--aa-text)",
                  borderColor: "var(--aa-border-strong)",
                  background: "var(--aa-surface-solid)",
                }}
              >
                Homashyo
              </Button>

              <Button
                variant="outlined"
                onClick={() => setPaymentOpen(true)}
                sx={{
                  minWidth: 95,
                  height: 42,
                  borderRadius: "var(--aa-radius-md)",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "var(--aa-text)",
                  borderColor: "var(--aa-border-strong)",
                  background: "var(--aa-surface-solid)",
                }}
              >
                To'lov
              </Button>

              <Button
                variant="contained"
                onClick={() => setPurchaseOpen(true)}
                sx={{
                  minWidth: 135,
                  height: 42,
                  borderRadius: "var(--aa-radius-md)",
                  textTransform: "none",
                  fontWeight: 950,
                  background: "var(--aa-brand-700)",
                  boxShadow: "var(--aa-shadow-sm)",
                  "&:hover": {
                    background: "var(--aa-brand-800)",
                  },
                }}
              >
                Xarid qo'shish
              </Button>
            </Stack>
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
              minWidth: 980,
              "& th": {
                py: 1.7,
                fontSize: 12,
                fontWeight: 950,
                color: "var(--aa-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                background: "var(--aa-surface-muted)",
                borderBottom: "1px solid var(--aa-border)",
              },
              "& td": {
                py: 1.55,
                borderBottom: "1px solid var(--aa-border)",
              },
              "& tbody tr:hover": {
                background: "var(--aa-surface-hover)",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Ta'minotchi va homashyolar</TableCell>
                <TableCell>Ushbu xarid hisobi</TableCell>
                <TableCell>Sana va izoh</TableCell>
                {canManage && <TableCell align="right">Amal</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 4 : 3}
                    align="center"
                    sx={{ py: 7 }}
                  >
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : purchases.length ? (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id} hover>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: 14.5,
                          fontWeight: 950,
                          color: "var(--aa-text)",
                        }}
                      >
                        {purchase.supplier_name}
                      </Typography>

                      <Stack spacing={0.6} sx={{ mt: 0.8 }}>
                        {purchase.items.map((item) => (
                          <Typography
                            key={item.id}
                            sx={{
                              fontSize: 12.8,
                              fontWeight: 700,
                              color: "var(--aa-text-secondary)",
                            }}
                          >
                            {item.material_name}: {Number(item.quantity)}{" "}
                            {item.unit} x {money(item.unit_price)}
                          </Typography>
                        ))}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: 14.5,
                          fontWeight: 950,
                          color: "var(--aa-text)",
                        }}
                      >
                        Jami: {money(purchase.subtotal)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: "var(--aa-success)",
                        }}
                      >
                        Berildi: {money(purchase.paid_amount)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: "var(--aa-brand-700)",
                        }}
                      >
                        Qarz qo'shildi: {money(purchase.debt_amount)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: "var(--aa-text-secondary)",
                        }}
                      >
                        {date(purchase.purchased_at)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          maxWidth: 240,
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "var(--aa-text-secondary)",
                        }}
                      >
                        {purchase.note || "Izoh yo'q"}
                      </Typography>
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => {
                            setSelectedPurchase(purchase);
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
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 4 : 3}
                    align="center"
                    sx={{ py: 7, fontWeight: 850 }}
                  >
                    Xaridlar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid var(--aa-border)",
            background: "var(--aa-surface-muted)",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) =>
              fetchPurchases(nextPage * pageInfo.limit, pageInfo.limit)
            }
            onLimitChange={(limit) => fetchPurchases(0, limit)}
          />
        </Box>
      </Card>

      <PremiumDialog
        open={purchaseOpen}
        onClose={close}
        title="Homashyo xaridi"
        actions={
          <>
            <Button
              onClick={close}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 850,
              }}
            >
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              disabled={saving}
              onClick={savePurchase}
              sx={{
                minWidth: 110,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                background: "var(--aa-brand-700)",
                "&:hover": { background: "var(--aa-brand-800)" },
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
              label="Ta'minotchi"
              value={purchaseForm.supplier_id}
              onChange={(e) =>
                setPurchaseForm((p) => ({
                  ...p,
                  supplier_id: e.target.value,
                }))
              }
            >
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="Xarid sanasi"
              value={purchaseForm.purchased_at}
              onChange={(e) =>
                setPurchaseForm((p) => ({
                  ...p,
                  purchased_at: e.target.value,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: "18px",
              background: "var(--aa-surface)",
              border: "1px solid var(--aa-border)",
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
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 950,
                    color: "var(--aa-text)",
                  }}
                >
                  Homashyo qatorlari
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    fontSize: 13,
                    fontWeight: 650,
                    color: "var(--aa-text-secondary)",
                  }}
                >
                  Bir nechta homashyoni bitta xaridga qo'shishingiz mumkin.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                onClick={() =>
                  setPurchaseForm((p) => ({
                    ...p,
                    items: [
                      ...p.items,
                      { raw_material_id: "", quantity: "", unit_price: "" },
                    ],
                  }))
                }
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 900,
                }}
              >
                Yana homashyo
              </Button>
            </Box>

            <Stack spacing={1.4}>
              {purchaseForm.items.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1.5fr 1fr 1fr auto",
                    },
                    gap: 1.3,
                    p: 1.4,
                    borderRadius: "16px",
                    background: "var(--aa-surface-solid)",
                    border: "1px solid var(--aa-border)",
                  }}
                >
                  <Box>
                    <TextField
                      select
                      fullWidth
                      label="Homashyo"
                      value={item.raw_material_id}
                      onChange={(e) =>
                        changeItem(index, "raw_material_id", e.target.value)
                      }
                    >
                      {materials.map((material) => (
                        <MenuItem key={material.id} value={material.id}>
                          {material.name} ({material.unit})
                        </MenuItem>
                      ))}
                    </TextField>

                    <Button
                      size="small"
                      sx={{
                        mt: 0.5,
                        px: 0,
                        textTransform: "none",
                        fontWeight: 850,
                      }}
                      onClick={() => {
                        setQuickMaterialIndex(index);
                        setQuickMaterialForm(emptyMaterial);
                        setQuickMaterialOpen(true);
                      }}
                    >
                      Yangi homashyo yaratish
                    </Button>
                  </Box>

                  <TextField
                    type="number"
                    label="Miqdor"
                    value={item.quantity}
                    onChange={(e) =>
                      changeItem(index, "quantity", e.target.value)
                    }
                  />

                  <TextField
                    type="number"
                    label="Birlik narxi"
                    value={item.unit_price}
                    onChange={(e) =>
                      changeItem(index, "unit_price", e.target.value)
                    }
                  />

                  <Button
                    color="error"
                    disabled={purchaseForm.items.length === 1}
                    onClick={() =>
                      setPurchaseForm((p) => ({
                        ...p,
                        items: p.items.filter((_, i) => i !== index),
                      }))
                    }
                    sx={{
                      borderRadius: "12px",
                      textTransform: "none",
                      fontWeight: 850,
                    }}
                  >
                    Olib tashlash
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>

          {quickMaterialOpen && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1.5fr 1fr auto auto" },
                gap: 1.3,
                p: 1.6,
                borderRadius: "18px",
                background: "var(--aa-surface-muted)",
                border: "1px solid var(--aa-border-strong)",
              }}
            >
              <TextField
                size="small"
                label="Yangi homashyo nomi"
                value={quickMaterialForm.name}
                onChange={(e) =>
                  setQuickMaterialForm((p) => ({ ...p, name: e.target.value }))
                }
              />

              <TextField
                size="small"
                label="Birligi"
                value={quickMaterialForm.unit}
                onChange={(e) =>
                  setQuickMaterialForm((p) => ({ ...p, unit: e.target.value }))
                }
                helperText="dona, kg, metr, litr"
              />

              <Button
                variant="contained"
                disabled={saving}
                onClick={saveQuickMaterial}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 900,
                }}
              >
                Yaratish
              </Button>

              <Button
                onClick={() => setQuickMaterialOpen(false)}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 850,
                }}
              >
                Bekor qilish
              </Button>
            </Box>
          )}

          <TextField
            type="number"
            label="To'lanadigan summa"
            value={purchaseForm.paid_amount}
            onChange={(e) =>
              setPurchaseForm((p) => ({ ...p, paid_amount: e.target.value }))
            }
            slotProps={{ htmlInput: { min: 0, step: 1000 } }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 1.2,
              p: 1.5,
              borderRadius: "18px",
              background: "var(--aa-surface-muted)",
              border: "1px solid var(--aa-border)",
            }}
          >
            <BalanceBox label="Xarid" value={money(subtotal)} tone="blue" />
            <BalanceBox
              label="Oldingi qarz"
              value={money(previousDebt)}
              tone="orange"
            />
            <BalanceBox
              label="Beriladi"
              value={money(paidAmount)}
              tone="green"
            />
            <BalanceBox label="Yangi qarz" value={money(newDebt)} tone="red" />
          </Box>

          <TextField
            multiline
            minRows={2}
            label="Izoh"
            value={purchaseForm.note}
            onChange={(e) =>
              setPurchaseForm((p) => ({ ...p, note: e.target.value }))
            }
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={supplierOpen}
        onClose={close}
        title="Ta'minotchilar"
        maxWidth="md"
        actions={
          <Button
            onClick={close}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 850,
            }}
          >
            Yopish
          </Button>
        }
      >
        <Stack spacing={2}>
          <Typography
            sx={{ fontSize: 16, fontWeight: 950, color: "var(--aa-text)" }}
          >
            {selectedSupplierForEdit
              ? "Ta'minotchini tahrirlash"
              : "Yangi ta'minotchi"}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.4,
            }}
          >
            <TextField
              label="Nomi"
              value={supplierForm.name}
              onChange={(e) =>
                setSupplierForm((p) => ({ ...p, name: e.target.value }))
              }
            />

            <TextField
              label="Telefon"
              value={supplierForm.phone}
              onChange={(e) =>
                setSupplierForm((p) => ({ ...p, phone: e.target.value }))
              }
            />

            <TextField
              label="Manzil"
              value={supplierForm.address}
              onChange={(e) =>
                setSupplierForm((p) => ({ ...p, address: e.target.value }))
              }
            />

            <TextField
              type="number"
              label="Boshlang'ich qarz"
              value={supplierForm.opening_balance}
              onChange={(e) =>
                setSupplierForm((p) => ({
                  ...p,
                  opening_balance: e.target.value,
                }))
              }
            />
          </Box>

          <TextField
            multiline
            minRows={2}
            label="Izoh"
            value={supplierForm.note}
            onChange={(e) =>
              setSupplierForm((p) => ({ ...p, note: e.target.value }))
            }
          />

          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: "flex-end" }}
          >
            {selectedSupplierForEdit && (
              <Button
                onClick={() => {
                  setSelectedSupplierForEdit(null);
                  setSupplierForm(emptySupplier);
                }}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 850,
                }}
              >
                Tozalash
              </Button>
            )}

            <Button
              variant="contained"
              disabled={saving}
              onClick={saveSupplier}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                background: "var(--aa-brand-700)",
                "&:hover": { background: "var(--aa-brand-800)" },
              }}
            >
              {saving
                ? "Saqlanmoqda..."
                : selectedSupplierForEdit
                  ? "Yangilash"
                  : "Qo'shish"}
            </Button>
          </Stack>
        </Stack>

        <Card sx={{ mt: 2.5, boxShadow: "none" }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{
                minWidth: 760,
                "& th": {
                  py: 1.5,
                  fontSize: 12,
                  fontWeight: 950,
                  color: "var(--aa-text-secondary)",
                  textTransform: "uppercase",
                  background: "var(--aa-surface-muted)",
                },
                "& td": {
                  py: 1.4,
                  borderBottom: "1px solid var(--aa-border)",
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Nomi</TableCell>
                  <TableCell>Telefon</TableCell>
                  <TableCell>Manzil</TableCell>
                  <TableCell>Boshlang'ich qarz</TableCell>
                  <TableCell>Hozirgi qarz</TableCell>
                  <TableCell align="right">Amallar</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {suppliers.length ? (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id} hover>
                      <TableCell
                        sx={{ fontWeight: 900, color: "var(--aa-text)" }}
                      >
                        {supplier.name}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: "var(--aa-text-secondary)",
                        }}
                      >
                        {supplier.phone || "-"}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: "var(--aa-text-secondary)",
                        }}
                      >
                        {supplier.address || "-"}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 800,
                          color: "var(--aa-text-secondary)",
                        }}
                      >
                        {money(supplier.opening_balance)}
                      </TableCell>
                      <TableCell
                        sx={{ fontWeight: 950, color: "var(--aa-brand-700)" }}
                      >
                        {money(supplier.current_debt)}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ justifyContent: "flex-end" }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => editSupplier(supplier)}
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
                            variant="outlined"
                            color="error"
                            onClick={() => removeSupplier(supplier)}
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 6, fontWeight: 850 }}
                    >
                      Ta'minotchilar topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </PremiumDialog>

      <PremiumDialog
        open={materialOpen}
        onClose={close}
        title="Homashyo qo'shish"
        maxWidth="sm"
        actions={
          <>
            <Button
              onClick={close}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 850,
              }}
            >
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              disabled={saving}
              onClick={saveMaterial}
              sx={{
                minWidth: 110,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                background: "var(--aa-brand-700)",
                "&:hover": { background: "var(--aa-brand-800)" },
              }}
            >
              Saqlash
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="Nomi"
            value={materialForm.name}
            onChange={(e) =>
              setMaterialForm((p) => ({ ...p, name: e.target.value }))
            }
          />

          <TextField
            label="O'lchov birligi"
            value={materialForm.unit}
            onChange={(e) =>
              setMaterialForm((p) => ({ ...p, unit: e.target.value }))
            }
            helperText="dona, kg, metr yoki litr"
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={paymentOpen}
        onClose={close}
        title="Ta'minotchiga to'lov"
        maxWidth="sm"
        actions={
          <>
            <Button
              onClick={close}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 850,
              }}
            >
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              disabled={saving}
              onClick={savePayment}
              sx={{
                minWidth: 125,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                background: "var(--aa-brand-700)",
                "&:hover": { background: "var(--aa-brand-800)" },
              }}
            >
              To'lov qilish
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            select
            label="Ta'minotchi"
            value={paymentForm.supplier_id}
            onChange={(e) =>
              setPaymentForm((p) => ({ ...p, supplier_id: e.target.value }))
            }
          >
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.name} — qarz {money(supplier.current_debt)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            type="number"
            label="Summa"
            value={paymentForm.amount}
            onChange={(e) =>
              setPaymentForm((p) => ({ ...p, amount: e.target.value }))
            }
          />

          <TextField
            type="date"
            label="Sana"
            value={paymentForm.paid_at}
            onChange={(e) =>
              setPaymentForm((p) => ({ ...p, paid_at: e.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            multiline
            minRows={2}
            label="Izoh"
            value={paymentForm.note}
            onChange={(e) =>
              setPaymentForm((p) => ({ ...p, note: e.target.value }))
            }
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={deleteOpen}
        onClose={close}
        title="Xaridni o'chirish"
        maxWidth="xs"
        actions={
          <>
            <Button
              onClick={close}
              disabled={deleting}
              sx={{ borderRadius: "var(--aa-radius-md)", fontWeight: 850 }}
            >
              Bekor qilish
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={deleting}
              onClick={confirmDeletePurchase}
              sx={{
                minWidth: 110,
                borderRadius: "var(--aa-radius-md)",
                fontWeight: 900,
              }}
            >
              {deleting ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </>
        }
      >
        <Typography
          sx={{
            color: "var(--aa-text-secondary)",
            fontWeight: 700,
            lineHeight: 1.65,
          }}
        >
          <strong>
            {selectedPurchase?.supplier_name || "Tanlangan xarid"}
          </strong>{" "}
          xaridi o'chiriladi. U bilan bog'liq xomashyo kirimi va qarzdorlik
          hisoblari ham qayta hisoblanadi. Davom etasizmi?
        </Typography>
      </PremiumDialog>

      <PremiumDialog
        open={supplierDeleteOpen}
        onClose={close}
        title="Ta'minotchini o'chirish"
        maxWidth="xs"
        actions={
          <>
            <Button
              onClick={close}
              disabled={deleting}
              sx={{ borderRadius: "var(--aa-radius-md)", fontWeight: 850 }}
            >
              Bekor qilish
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={deleting}
              onClick={confirmRemoveSupplier}
              sx={{
                minWidth: 110,
                borderRadius: "var(--aa-radius-md)",
                fontWeight: 900,
              }}
            >
              {deleting ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </>
        }
      >
        <Typography
          sx={{
            color: "var(--aa-text-secondary)",
            fontWeight: 700,
            lineHeight: 1.65,
          }}
        >
          <strong>
            {selectedSupplierForDelete?.name || "Tanlangan ta'minotchi"}
          </strong>
          ta'minotchisi o'chiriladi. Agar unga bog'langan xaridlar mavjud
          bo'lsa, tizim xavfsizlik sababli amalni rad etishi mumkin.
        </Typography>
      </PremiumDialog>
    </Box>
  );
};

export default MaterialPurchases;
