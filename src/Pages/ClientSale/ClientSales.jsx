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
import {
  createBulkClientSale,
  deleteClientSale,
  getClientBalance,
  getClientSales,
  getClientSalesSummary,
  updateClientSale,
} from "../../api/clientSales";
import { createClientPayment } from "../../api/clientPayments";

const emptyForm = {
  client_id: "",
  product_id: "",
  quantity: "",
  unit_price: "",
  paid_amount: "",
  sold_at: new Date().toISOString().slice(0, 10),
  note: "",
  items: [{ product_id: "", quantity: "", unit_price: "" }],
};

const emptyPaymentForm = {
  client_id: "",
  client_sale_id: "",
  amount: "",
  paid_at: new Date().toISOString().slice(0, 10),
  note: "",
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "0 so'm";
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
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
  String(value || "M")
    .trim()
    .slice(0, 1)
    .toUpperCase();

const Card = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: "20px",
      border: "1px solid rgba(148, 163, 184, 0.22)",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
      boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const MiniStat = ({ label, value, tone = "default", helper }) => {
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
    orange: {
      color: "#92400e",
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.24)",
    },
  };

  const current = tones[tone] || tones.default;

  return (
    <Box
      sx={{
        minWidth: 122,
        px: 2,
        py: 1.35,
        borderRadius: "16px",
        background: current.bg,
        border: `1px solid ${current.border}`,
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>{label}</Typography>

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

      {helper && (
        <Typography sx={{ mt: 0.35, fontSize: 12, fontWeight: 700, color: "#64748b" }}>
          {helper}
        </Typography>
      )}
    </Box>
  );
};

const BalanceBox = ({ label, value, tone = "default" }) => {
  const colors = {
    default: "#0f172a",
    blue: "#2563eb",
    green: "#15803d",
    red: "#8b0101",
    orange: "#92400e",
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: "15px",
        background: "#fff",
        border: "1px solid rgba(148, 163, 184, 0.2)",
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>{label}</Typography>

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

const DebtChip = ({ debt }) => {
  const hasDebt = Number(debt || 0) > 0;

  return (
    <Chip
      size="small"
      label={`Qarz: ${formatMoney(debt)}`}
      sx={{
        height: 26,
        px: 0.35,
        fontSize: 12,
        fontWeight: 900,
        color: hasDebt ? "#92400e" : "#15803d",
        background: hasDebt ? "rgba(245, 158, 11, 0.12)" : "rgba(34, 197, 94, 0.12)",
        border: hasDebt
          ? "1px solid rgba(245, 158, 11, 0.24)"
          : "1px solid rgba(34, 197, 94, 0.24)",
      }}
    />
  );
};

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

const ClientSales = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const canManage = ["super_admin", "admin"].includes(currentUser?.role);
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState([]);
  const [balance, setBalance] = useState({
    total_amount: 0,
    paid_amount: 0,
    debt_amount: 0,
  });
  const [, setTotals] = useState({
    total_amount: 0,
    paid_amount: 0,
    debt_amount: 0,
  });
  const [pageInfo, setPageInfo] = useState({ total: 0, offset: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [filters, setFilters] = useState({
    q: "",
    client_id: "",
    product_id: "",
    date_from: "",
    date_to: "",
    sort_by: "sold_at",
    sort_order: "desc",
    group_by: "client",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [selectedSale, setSelectedSale] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [paymentBalance, setPaymentBalance] = useState({
    total_amount: 0,
    paid_amount: 0,
    debt_amount: 0,
  });
  const [paymentBalanceLoading, setPaymentBalanceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const selectedProduct = useMemo(
    () => products.find((product) => Number(product.id) === Number(form.product_id)),
    [form.product_id, products],
  );

  const preview = useMemo(() => {
    const total = selectedSale
      ? Number(form.quantity || 0) * Number(form.unit_price || 0)
      : form.items.reduce(
          (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
          0,
        );

    const paid = Number(form.paid_amount || 0);

    return {
      total,
      paid,
      debt: Math.max(total - paid, 0),
      overPaid: paid > total && total > 0,
    };
  }, [form.quantity, form.unit_price, form.paid_amount, form.items, selectedSale]);

  const fetchDictionaries = useCallback(async () => {
    try {
      const [usersRes, productsRes] = await Promise.all([
        getUsers({
          offset: 0,
          limit: 100,
          sort_by: "created_at",
          sort_order: "desc",
        }),
        getProducts({
          offset: 0,
          limit: 100,
          is_active: true,
          sort_by: "name",
          sort_order: "asc",
        }),
      ]);

      setClients(
        (usersRes.data.users || usersRes.data.list || []).filter((user) => user.role === "client"),
      );
      setProducts(productsRes.data.products || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Mijoz va mahsulotlarni olishda xato.");
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

      for (const key of ["q", "client_id", "product_id", "date_from", "date_to"]) {
        if (filters[key] !== "") params[key] = filters[key];
      }

      return params;
    },
    [filters, pageInfo.limit],
  );

  const fetchSales = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        const { data } = await getClientSales(buildParams(offset, limit));

        setSales(data.client_sales || []);
        setTotals(data.totals || { total_amount: 0, paid_amount: 0, debt_amount: 0 });
        setPageInfo(data.pageInfo || { total: 0, offset, limit });
      } catch (error) {
        toast.error(error?.response?.data?.message || "Savdolarni olishda xato.");
      } finally {
        setLoading(false);
      }
    },
    [buildParams, pageInfo.limit],
  );

  const fetchSummary = useCallback(async () => {
    if (!isSuperAdmin) {
      setSummary([]);
      setBalance({
        total_amount: 0,
        paid_amount: 0,
        debt_amount: 0,
      });
      return;
    }

    setSummaryLoading(true);

    try {
      const params = buildParams(0, 100);
      delete params.offset;
      delete params.limit;
      params.group_by = filters.group_by;

      const [summaryRes, balanceRes] = await Promise.all([
        getClientSalesSummary(params),
        getClientBalance({
          client_id: filters.client_id || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
        }),
      ]);

      setSummary(summaryRes.data.summary || []);
      setBalance(
        balanceRes.data.balance || {
          total_amount: 0,
          paid_amount: 0,
          debt_amount: 0,
        },
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Savdo summary olishda xato.");
    } finally {
      setSummaryLoading(false);
    }
  }, [buildParams, filters.client_id, filters.date_from, filters.date_to, filters.group_by, isSuperAdmin]);

  useEffect(() => {
    fetchDictionaries();
  }, [fetchDictionaries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales(0, pageInfo.limit);
      fetchSummary();
    }, 250);

    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit, fetchSales, fetchSummary]);

  const handleFilterChange = (field) => (event) => {
    setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleFormChange = (field) => (event) => {
    const value = event.target.value;

    if (field === "product_id") {
      const product = products.find((item) => Number(item.id) === Number(value));

      setForm((previous) => ({
        ...previous,
        product_id: value,
        unit_price: product?.sale_price ?? previous.unit_price,
      }));
      return;
    }

    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSaleItemChange = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "product_id") {
          const product = products.find((row) => Number(row.id) === Number(value));

          return {
            ...item,
            product_id: value,
            unit_price: product?.sale_price ?? item.unit_price,
          };
        }

        return { ...item, [field]: value };
      }),
    }));
  };

  const applyFilters = () => {
    fetchSales(0, pageInfo.limit);
    fetchSummary();
  };

  const refreshPage = () => {
    fetchSales(pageInfo.offset, pageInfo.limit);
    fetchSummary();
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      client_id: "",
      product_id: "",
      date_from: "",
      date_to: "",
      sort_by: "sold_at",
      sort_order: "desc",
      group_by: "client",
    });
    setFiltersOpen(false);
  };

  const openCreateModal = () => {
    const product = products.find((item) => Number(item.id) === Number(filters.product_id));

    setSelectedSale(null);
    setForm({
      ...emptyForm,
      client_id: filters.client_id || "",
      items: [
        {
          product_id: filters.product_id || "",
          quantity: "",
          unit_price: product?.sale_price ?? "",
        },
      ],
    });
    setModalOpen(true);
  };

  const openEditModal = (sale) => {
    setSelectedSale(sale);
    setForm({
      client_id: sale.client_id || "",
      product_id: sale.product_id || "",
      quantity: sale.quantity ?? "",
      unit_price: sale.unit_price ?? "",
      paid_amount: sale.paid_amount ?? "",
      sold_at: sale.sold_at ? String(sale.sold_at).slice(0, 10) : emptyForm.sold_at,
      note: sale.note || "",
      items: [],
    });
    setModalOpen(true);
  };

  const fetchPaymentBalance = useCallback(async (clientId) => {
    if (!clientId) {
      setPaymentBalance({
        total_amount: 0,
        paid_amount: 0,
        debt_amount: 0,
      });
      return;
    }

    setPaymentBalanceLoading(true);

    try {
      const { data } = await getClientBalance({ client_id: clientId });

      setPaymentBalance(
        data.balance || {
          total_amount: 0,
          paid_amount: 0,
          debt_amount: 0,
        },
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Mijoz balansini olishda xato.");
    } finally {
      setPaymentBalanceLoading(false);
    }
  }, []);

  const openPaymentModal = (sale = null) => {
    setSelectedSale(sale);

    const nextForm = {
      ...emptyPaymentForm,
      client_id: sale?.client_id || filters.client_id || "",
      client_sale_id: sale?.id || "",
      note: sale ? `${sale.product_name || "Savdo"} qarzidan to'lov` : "",
    };

    setPaymentForm(nextForm);
    setPaymentBalance(
      sale
        ? {
            total_amount: Number(sale.total_amount || 0),
            paid_amount: Number(sale.current_paid_amount || sale.paid_amount || 0),
            debt_amount: Number(sale.remaining_debt ?? sale.debt_amount ?? 0),
          }
        : {
            total_amount: 0,
            paid_amount: 0,
            debt_amount: 0,
          },
    );
    setPaymentOpen(true);

    if (!sale && nextForm.client_id) {
      fetchPaymentBalance(nextForm.client_id);
    }
  };

  const handlePaymentChange = (field) => (event) => {
    const value = event.target.value;

    setPaymentForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "client_id" ? { client_sale_id: "" } : {}),
    }));

    if (field === "client_id") {
      fetchPaymentBalance(value);
    }

    if (field === "client_sale_id") {
      const sale = sales.find((item) => Number(item.id) === Number(value));

      if (sale) {
        setPaymentBalance({
          total_amount: Number(sale.total_amount || 0),
          paid_amount: Number(sale.current_paid_amount || sale.paid_amount || 0),
          debt_amount: Number(sale.remaining_debt ?? sale.debt_amount ?? 0),
        });
      } else if (paymentForm.client_id) {
        fetchPaymentBalance(paymentForm.client_id);
      }
    }
  };

  const closeModals = () => {
    setModalOpen(false);
    setDeleteOpen(false);
    setPaymentOpen(false);
    setSelectedSale(null);
    setForm(emptyForm);
    setPaymentForm(emptyPaymentForm);
    setPaymentBalance({
      total_amount: 0,
      paid_amount: 0,
      debt_amount: 0,
    });
  };

  const validateForm = () => {
    if (!form.client_id) {
      toast.error("Mijozni tanlang.");
      return false;
    }

    if (selectedSale) {
      if (!form.product_id || !form.quantity || Number(form.quantity) <= 0) {
        toast.error("Mahsulot va miqdorni to'g'ri kiriting.");
        return false;
      }
    } else if (
      !form.items.length ||
      form.items.some(
        (item) =>
          !item.product_id ||
          Number(item.quantity) <= 0 ||
          item.unit_price === "" ||
          Number(item.unit_price) < 0,
      )
    ) {
      toast.error("Barcha mahsulot qatorlarini to'liq kiriting.");
      return false;
    }

    if (Number(form.paid_amount || 0) < 0) {
      toast.error("To'langan summa manfiy bo'lmasin.");
      return false;
    }

    if (preview.overPaid) {
      toast.error("To'langan summa jami savdo summasidan oshmasin.");
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    client_id: Number(form.client_id),
    product_id: Number(form.product_id),
    quantity: Number(form.quantity),
    unit_price: Number(form.unit_price),
    paid_amount: Number(form.paid_amount || 0),
    sold_at: form.sold_at || undefined,
    note: form.note.trim() || null,
  });

  const buildBulkPayload = () => ({
    client_id: Number(form.client_id),
    paid_amount: Number(form.paid_amount || 0),
    sold_at: form.sold_at || undefined,
    note: form.note.trim() || null,
    items: form.items.map((item) => ({
      product_id: Number(item.product_id),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
  });

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      if (selectedSale) {
        await updateClientSale(selectedSale.id, buildPayload());
        toast.success("Savdo yangilandi.");
      } else {
        await createBulkClientSale(buildBulkPayload());
        toast.success(`${form.items.length} xil mahsulot savdoga qo'shildi.`);
      }

      closeModals();
      refreshPage();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Savdoni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSale) return;

    setDeleting(true);

    try {
      await deleteClientSale(selectedSale.id);

      toast.success("Savdo o'chirildi.");
      closeModals();
      refreshPage();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Savdoni o'chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const validatePaymentForm = () => {
    if (!paymentForm.client_id) {
      toast.error("Mijozni tanlang.");
      return false;
    }

    if (!paymentForm.client_sale_id) {
      toast.error("Qaysi savdodan to'lov qilinishini tanlang.");
      return false;
    }

    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error("To'lov summasini to'g'ri kiriting.");
      return false;
    }

    if (Number(paymentForm.amount) > Number(paymentBalance.debt_amount || 0)) {
      toast.error("To'lov summasi qolgan qarzdan oshmasin.");
      return false;
    }

    return true;
  };

  const handleSavePayment = async () => {
    if (!validatePaymentForm()) return;

    setPaymentSaving(true);

    try {
      await createClientPayment({
        client_id: Number(paymentForm.client_id),
        client_sale_id: Number(paymentForm.client_sale_id),
        amount: Number(paymentForm.amount),
        paid_at: paymentForm.paid_at || undefined,
        note: paymentForm.note.trim() || null,
      });

      toast.success("Mijoz to'lovi kiritildi.");
      closeModals();
      refreshPage();
    } catch (error) {
      toast.error(error?.response?.data?.message || "To'lovni saqlashda xato.");
    } finally {
      setPaymentSaving(false);
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
      }}
    >
      <Card sx={{ mb: 0.5, px: { xs: 2, md: 2.5 }, py: 2.2, flexShrink: 0 }}>
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
              label="Al-amin CRM • mijoz savdo"
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
              Mijoz savdo
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 14,
                fontWeight: 650,
                color: "#64748b",
              }}
            >
              Mijozlarga berilgan mahsulotlar, to'lovlar va qarzdorlik nazorati.
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
            {isSuperAdmin && (
              <MiniStat label="Jami savdo" value={formatMoney(balance.total_amount)} tone="blue" />
            )}
            {isSuperAdmin && (
              <MiniStat
                label="Jami to'langan"
                value={formatMoney(balance.paid_amount)}
                tone="green"
              />
            )}
            {isSuperAdmin && (
              <MiniStat label="Jami qarz" value={formatMoney(balance.debt_amount)} tone="orange" />
            )}
            <MiniStat label="Yozuvlar" value={pageInfo.total} tone="default" />
          </Box>
        </Box>
      </Card>

      <Card sx={{ mb: 1, p: 2, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "stretch", xl: "flex-start" },
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
              onChange={handleFilterChange("q")}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyFilters();
              }}
            />

            <TextField
              select
              size="small"
              label="Mijoz"
              value={filters.client_id}
              onChange={handleFilterChange("client_id")}
            >
              <MenuItem value="">Barchasi</MenuItem>
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
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

            {filtersOpen && (
              <>
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

                <TextField
                  select
                  size="small"
                  label="Saralash"
                  value={filters.sort_by}
                  onChange={handleFilterChange("sort_by")}
                >
                  <MenuItem value="sold_at">Sotilgan sana</MenuItem>
                  <MenuItem value="created_at">Yaratilgan</MenuItem>
                  <MenuItem value="updated_at">Yangilangan</MenuItem>
                  <MenuItem value="total_amount">Savdo summa</MenuItem>
                  <MenuItem value="debt_amount">Qarz summa</MenuItem>
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Tartib"
                  value={filters.sort_order}
                  onChange={handleFilterChange("sort_order")}
                >
                  <MenuItem value="desc">Yangidan eskiga</MenuItem>
                  <MenuItem value="asc">Eskidan yangiga</MenuItem>
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Guruhlash"
                  value={filters.group_by}
                  onChange={handleFilterChange("group_by")}
                >
                  <MenuItem value="client">Mijoz</MenuItem>
                  <MenuItem value="product">Mahsulot</MenuItem>
                  <MenuItem value="day">Kun</MenuItem>
                </TextField>
              </>
            )}
          </Box>

          {canManage && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                variant="outlined"
                onClick={() => openPaymentModal()}
                sx={{
                  minWidth: 145,
                  height: 42,
                  borderRadius: "13px",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "#0f172a",
                  borderColor: "rgba(37, 99, 235, 0.22)",
                  background: "#fff",
                }}
              >
                Kirim qo'shish
              </Button>

              <Button
                variant="contained"
                onClick={openCreateModal}
                sx={{
                  minWidth: 150,
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
                Savdo qo'shish
              </Button>
            </Stack>
          )}
        </Box>
      </Card>

      {isSuperAdmin && (
        <Card sx={{ mb: 1, p: 1.6, flexShrink: 0 }}>
          {summaryLoading ? (
            <Box sx={{ minHeight: 92, display: "grid", placeItems: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : summary.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  xl: "repeat(4, 1fr)",
                },
                gap: 1.4,
              }}
            >
              {summary.slice(0, 4).map((item) => (
                <Box
                  key={String(item.group_id)}
                  sx={{
                    p: 1.6,
                    borderRadius: "17px",
                    background: "#fff",
                    border: "1px solid rgba(148, 163, 184, 0.22)",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#64748b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.group_name || "-"}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.45,
                      fontSize: 18,
                      fontWeight: 950,
                      color: "#0f172a",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {formatMoney(item.total_amount)}
                  </Typography>

                  <Typography sx={{ mt: 0.45, fontSize: 12.5, fontWeight: 750, color: "#64748b" }}>
                    Qarz: {formatMoney(item.debt_amount)} / {item.sales_count} savdo
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ minHeight: 92, display: "grid", placeItems: "center" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 750, color: "#64748b" }}>
                Umumiy savdo ma'lumoti topilmadi.
              </Typography>
            </Box>
          )}
        </Card>
      )}

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
              minWidth: canManage ? 1050 : 900,
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
                <TableCell>Mijoz</TableCell>
                <TableCell>Savdo</TableCell>
                <TableCell>Hisob</TableCell>
                <TableCell>Sana va izoh</TableCell>
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
              ) : sales.length ? (
                sales.map((sale) => (
                  <TableRow key={sale.id} hover>
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
                          {getInitial(sale.client_name)}
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
                            {sale.client_name || "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "#64748b",
                            }}
                          >
                            @{sale.client_username || "client"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 900, color: "#0f172a" }}>
                        {sale.product_name || "-"}
                      </Typography>

                      <Typography
                        sx={{ mt: 0.35, fontSize: 12.5, fontWeight: 700, color: "#64748b" }}
                      >
                        {sale.product_sku || "-"}
                      </Typography>

                      <Typography
                        sx={{ mt: 0.35, fontSize: 12.5, fontWeight: 700, color: "#64748b" }}
                      >
                        {formatNumber(sale.quantity)} dona × {formatMoney(sale.unit_price)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 950, color: "#0f172a" }}>
                        Jami: {formatMoney(sale.total_amount)}
                      </Typography>

                      <Typography
                        sx={{ mt: 0.35, fontSize: 12.5, fontWeight: 800, color: "#15803d" }}
                      >
                        To'landi: {formatMoney(sale.current_paid_amount ?? sale.paid_amount)}
                      </Typography>

                      {Number(sale.extra_paid_amount || 0) > 0 && (
                        <Typography
                          sx={{ mt: 0.35, fontSize: 12.5, fontWeight: 700, color: "#64748b" }}
                        >
                          Keyingi: {formatMoney(sale.extra_paid_amount)}
                        </Typography>
                      )}

                      <Box sx={{ mt: 0.8 }}>
                        <DebtChip debt={sale.remaining_debt ?? sale.debt_amount} />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: "#334155" }}>
                        {formatDate(sale.sold_at)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          maxWidth: 220,
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        {sale.note || "Izoh yo'q"}
                      </Typography>
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
                            color="success"
                            disabled={Number(sale.remaining_debt ?? sale.debt_amount ?? 0) <= 0}
                            onClick={() => openPaymentModal(sale)}
                            sx={{
                              borderRadius: "10px",
                              textTransform: "none",
                              fontWeight: 900,
                            }}
                          >
                            To'lov
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openEditModal(sale)}
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
                              setSelectedSale(sale);
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
                    Savdo yozuvlari topilmadi
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
            onPageChange={(nextPage) => fetchSales(nextPage * pageInfo.limit, pageInfo.limit)}
            onLimitChange={(limit) => fetchSales(0, limit)}
          />
        </Box>
      </Card>

      <PremiumDialog
        open={modalOpen}
        onClose={closeModals}
        title={selectedSale ? "Savdoni tahrirlash" : "Mijozga mahsulot sotish"}
        maxWidth="md"
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
              label="Mijoz"
              value={form.client_id}
              onChange={handleFormChange("client_id")}
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </MenuItem>
              ))}
            </TextField>

            {selectedSale && (
              <>
                <TextField
                  select
                  required
                  label="Mahsulot"
                  value={form.product_id}
                  onChange={handleFormChange("product_id")}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} - {formatMoney(product.sale_price)}
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

                <TextField
                  required
                  type="number"
                  label="Sotish narxi"
                  value={form.unit_price}
                  onChange={handleFormChange("unit_price")}
                  helperText={
                    selectedProduct
                      ? `Standart narx: ${formatMoney(selectedProduct.sale_price)}`
                      : "Mahsulot tanlanganda avtomatik tushadi"
                  }
                  slotProps={{ htmlInput: { min: 0, step: 1000 } }}
                />
              </>
            )}

            <TextField
              type="date"
              label="Sotilgan sana"
              value={form.sold_at}
              onChange={handleFormChange("sold_at")}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          {!selectedSale && (
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
                    Mahsulotlar
                  </Typography>

                  <Typography sx={{ mt: 0.4, fontSize: 13, fontWeight: 650, color: "#64748b" }}>
                    Bir nechta mahsulotni bitta savdoga qo'shishingiz mumkin.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,
                      items: [...previous.items, { product_id: "", quantity: "", unit_price: "" }],
                    }))
                  }
                  sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 900 }}
                >
                  Yana mahsulot
                </Button>
              </Box>

              <Stack spacing={1.4}>
                {form.items.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1.5fr 0.8fr 1fr auto" },
                      gap: 1.3,
                      p: 1.4,
                      borderRadius: "16px",
                      background: "#ffffff",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                    }}
                  >
                    <TextField
                      select
                      label="Mahsulot"
                      value={item.product_id}
                      onChange={(event) =>
                        handleSaleItemChange(index, "product_id", event.target.value)
                      }
                    >
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name} - {formatMoney(product.sale_price)}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      type="number"
                      label="Miqdor"
                      value={item.quantity}
                      onChange={(event) =>
                        handleSaleItemChange(index, "quantity", event.target.value)
                      }
                      slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    />

                    <TextField
                      type="number"
                      label="Sotish narxi"
                      value={item.unit_price}
                      onChange={(event) =>
                        handleSaleItemChange(index, "unit_price", event.target.value)
                      }
                      slotProps={{ htmlInput: { min: 0, step: 1000 } }}
                    />

                    <Button
                      color="error"
                      disabled={form.items.length === 1}
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          items: previous.items.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
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
            type="number"
            label="To'langan summa"
            value={form.paid_amount}
            onChange={handleFormChange("paid_amount")}
            error={preview.overPaid}
            helperText={
              preview.overPaid
                ? "To'lov jami summadan oshmasin"
                : "Qisman to'lov yoki 0 bo'lishi mumkin"
            }
            slotProps={{ htmlInput: { min: 0, step: 1000 } }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 1.2,
              p: 1.5,
              borderRadius: "18px",
              background: preview.overPaid ? "rgba(254, 242, 242, 0.95)" : "#f8fafc",
              border: preview.overPaid
                ? "1px solid rgba(220, 38, 38, 0.3)"
                : "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            <BalanceBox label="Jami" value={formatMoney(preview.total)} tone="blue" />
            <BalanceBox label="To'langan" value={formatMoney(preview.paid)} tone="green" />
            <BalanceBox label="Qoladigan qarz" value={formatMoney(preview.debt)} tone="orange" />
          </Box>

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
        title="Savdoni o'chirish"
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
          {selectedSale?.client_name} uchun {formatMoney(selectedSale?.total_amount)} savdo yozuvini
          o'chirmoqchimisiz?
        </Typography>
      </PremiumDialog>

      <PremiumDialog
        open={paymentOpen}
        onClose={closeModals}
        title="Mijozdan to'lov"
        maxWidth="sm"
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
              onClick={handleSavePayment}
              disabled={paymentSaving}
              sx={{
                minWidth: 120,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                background: "linear-gradient(135deg, #8b0101, #b91c1c)",
                boxShadow: "0 12px 25px rgba(139, 1, 1, 0.2)",
              }}
            >
              {paymentSaving ? "Saqlanmoqda..." : "Kirim qilish"}
            </Button>
          </>
        }
      >
        <Stack spacing={2.1}>
          <TextField
            select
            required
            label="Mijoz"
            value={paymentForm.client_id}
            onChange={handlePaymentChange("client_id")}
            disabled={Boolean(selectedSale)}
          >
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.first_name} {client.last_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            required
            label="Qaysi savdodan"
            value={paymentForm.client_sale_id}
            onChange={handlePaymentChange("client_sale_id")}
            disabled={Boolean(selectedSale)}
            helperText="Savdoni tanlash majburiy"
          >
            {sales
              .filter(
                (sale) =>
                  !paymentForm.client_id ||
                  Number(sale.client_id) === Number(paymentForm.client_id),
              )
              .filter((sale) => Number(sale.remaining_debt ?? sale.debt_amount ?? 0) > 0)
              .map((sale) => (
                <MenuItem key={sale.id} value={sale.id}>
                  #{sale.id} - {sale.product_name} / qarz{" "}
                  {formatMoney(sale.remaining_debt ?? sale.debt_amount)}
                </MenuItem>
              ))}
          </TextField>

          <Box
            sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.6 }}
          >
            <TextField
              required
              type="number"
              label="Kirim summa"
              value={paymentForm.amount}
              onChange={handlePaymentChange("amount")}
              error={Number(paymentForm.amount || 0) > Number(paymentBalance.debt_amount || 0)}
              helperText={
                Number(paymentForm.amount || 0) > Number(paymentBalance.debt_amount || 0)
                  ? "Summa qolgan qarzdan oshmasin"
                  : "Masalan: 1700000"
              }
              slotProps={{ htmlInput: { min: 0, step: 1000 } }}
            />

            <TextField
              type="date"
              label="To'lov sanasi"
              value={paymentForm.paid_at}
              onChange={handlePaymentChange("paid_at")}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

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
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Typography sx={{ fontSize: 16, fontWeight: 950, color: "#0f172a" }}>
                Qarz holati
              </Typography>

              {paymentBalanceLoading && <CircularProgress size={18} />}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 1.2,
              }}
            >
              <BalanceBox
                label="Savdo"
                value={formatMoney(paymentBalance.total_amount)}
                tone="blue"
              />
              <BalanceBox label="Kirim" value={formatMoney(paymentForm.amount)} tone="green" />
              <BalanceBox
                label="Jami to'langan"
                value={formatMoney(
                  Number(paymentBalance.paid_amount || 0) + Number(paymentForm.amount || 0),
                )}
                tone="green"
              />
              <BalanceBox
                label="Qolgan qarz"
                value={formatMoney(
                  Math.max(
                    Number(paymentBalance.debt_amount || 0) - Number(paymentForm.amount || 0),
                    0,
                  ),
                )}
                tone="orange"
              />
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Izoh"
            value={paymentForm.note}
            onChange={handlePaymentChange("note")}
          />
        </Stack>
      </PremiumDialog>
    </Box>
  );
};

export default ClientSales;
