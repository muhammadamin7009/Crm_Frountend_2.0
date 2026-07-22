import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
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

import SharedHeroMetric from "../../Components/UI/HeroMetric";
import SharedPremiumDialog from "../../Components/UI/PremiumDialog";
import SharedBalanceBox from "../../Components/UI/BalanceBox";

import { useAuth } from "../../Context/AuthContext";
import CrmPagination from "../../Components/Common/CrmPagination";
import { hasPermission } from "../../utils/permissions";
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
import { getInventoryStock, getWarehouses } from "../../api/inventory";

const emptyForm = {
  client_id: "",
  warehouse_id: "",
  product_id: "",
  quantity: "",
  unit_price: "",
  paid_amount: "",
  sold_at: new Date().toISOString().slice(0, 10),
  note: "",
  items: [
    {
      product_id: "",
      quantity: "",
      unit_price: "",
    },
  ],
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
  if (value === null || value === undefined || value === "") {
    return "0 so'm";
  }

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
      borderRadius: "var(--aa-radius-xl)",
      border: "1px solid var(--aa-border)",
      background: "var(--aa-surface)",
      boxShadow: "var(--aa-shadow-sm)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const HeroMetric = (props) => (
  <SharedHeroMetric
    {...props}
    softToneBorder
    labelSx={{ mt: 1.4, color: "rgba(255,255,255,.45) !important" }}
  />
);
const BalanceBox = (props) => <SharedBalanceBox {...props} variant="surface" />;
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
        fontWeight: 850,
        color: hasDebt
          ? "var(--aa-warning)"
          : "var(--aa-success)",
        background: hasDebt
          ? "rgba(245,158,11,.12)"
          : "rgba(34,197,94,.12)",
        border: hasDebt
          ? "1px solid rgba(245,158,11,.24)"
          : "1px solid rgba(34,197,94,.24)",
      }}
    />
  );
};

const PremiumDialog = (props) => <SharedPremiumDialog maxWidth="md" subtitle="Savdo va hisob-kitob maвЂ™lumotlari" titleClassName="client-sales-dialog-title" {...props} />;
const ClientSales = () => {
  const auth = useAuth();

  const currentUser = auth?.user || getLocalUser();

  const canManage =
    ["super_admin", "admin"].includes(currentUser?.role) &&
    hasPermission(currentUser, "client_sales.manage");

  const isSuperAdmin = currentUser?.role === "super_admin";

  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventoryStock, setInventoryStock] = useState([]);
  const [summary, setSummary] = useState([]);

  const [balance, setBalance] = useState({
    total_amount: 0,
    paid_amount: 0,
    debt_amount: 0,
  });

  const [totals, setTotals] = useState({
    total_amount: 0,
    paid_amount: 0,
    debt_amount: 0,
  });

  const [pageInfo, setPageInfo] = useState({
    total: 0,
    offset: 0,
    limit: 10,
  });

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

  const displayTotals = isSuperAdmin ? balance : totals;

  const paymentPercent =
    Number(displayTotals.total_amount || 0) > 0
      ? Math.min(
          100,
          Math.round(
            (Number(displayTotals.paid_amount || 0) / Number(displayTotals.total_amount || 0)) *
              100,
          ),
        )
      : 0;

  const selectedProduct = useMemo(
    () => products.find((product) => Number(product.id) === Number(form.product_id)),
    [form.product_id, products],
  );

  const activeWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.is_active !== false),
    [warehouses],
  );

  const stockByProduct = useMemo(() => {
    const result = new Map();

    for (const row of inventoryStock) {
      if (row.item_type !== "product") {
        continue;
      }

      result.set(`${Number(row.warehouse_id)}:${Number(row.item_id)}`, Number(row.quantity || 0));
    }

    return result;
  }, [inventoryStock]);

  const getAvailableStock = useCallback(
    (productId, warehouseId = form.warehouse_id) =>
      stockByProduct.get(`${Number(warehouseId)}:${Number(productId)}`) || 0,
    [form.warehouse_id, stockByProduct],
  );

  const requestedByProduct = useMemo(() => {
    const requested = new Map();

    for (const item of form.items) {
      if (!item.product_id) continue;

      const productId = Number(item.product_id);

      requested.set(productId, (requested.get(productId) || 0) + Number(item.quantity || 0));
    }

    return requested;
  }, [form.items]);

  const selectedSaleAvailableStock = useMemo(() => {
    if (!selectedSale?.inventory_tracked_at || !form.product_id) {
      return 0;
    }

    const currentStock = getAvailableStock(form.product_id);

    const restoresOriginalStock =
      Number(selectedSale.product_id) === Number(form.product_id) &&
      Number(selectedSale.warehouse_id) === Number(form.warehouse_id);

    return currentStock + (restoresOriginalStock ? Number(selectedSale.quantity || 0) : 0);
  }, [form.product_id, form.warehouse_id, getAvailableStock, selectedSale]);

  const selectedSaleQuantityExceeded = Boolean(
    selectedSale?.inventory_tracked_at &&
    form.product_id &&
    Number(form.quantity || 0) > selectedSaleAvailableStock,
  );

  const bulkSaleQuantityExceeded = useMemo(
    () =>
      [...requestedByProduct.entries()].some(
        ([productId, requestedQuantity]) => requestedQuantity > getAvailableStock(productId),
      ),
    [getAvailableStock, requestedByProduct],
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
      const [usersRes, productsRes, warehousesRes, stockRes] = await Promise.all([
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

        getWarehouses(),

        getInventoryStock({
          item_type: "product",
          limit: 200,
        }),
      ]);

      setClients(
        (usersRes.data.users || usersRes.data.list || []).filter((user) => user.role === "client"),
      );

      setProducts(productsRes.data.products || []);

      setWarehouses(warehousesRes.data.warehouses || []);

      setInventoryStock(stockRes.data.stock || []);
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
        if (filters[key] !== "") {
          params[key] = filters[key];
        }
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

        setTotals(
          data.totals || {
            total_amount: 0,
            paid_amount: 0,
            debt_amount: 0,
          },
        );

        setPageInfo(
          data.pageInfo || {
            total: 0,
            offset,
            limit,
          },
        );
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
  }, [
    buildParams,
    filters.client_id,
    filters.date_from,
    filters.date_to,
    filters.group_by,
    isSuperAdmin,
  ]);

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
    setFilters((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
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

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSaleItemChange = (index, field, value) => {
    setForm((previous) => ({
      ...previous,

      items: previous.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (field === "product_id") {
          const product = products.find((row) => Number(row.id) === Number(value));

          return {
            ...item,
            product_id: value,
            unit_price: product?.sale_price ?? item.unit_price,
          };
        }

        return {
          ...item,
          [field]: value,
        };
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

    const defaultWarehouse =
      activeWarehouses.find((warehouse) => warehouse.is_default) || activeWarehouses[0];

    setSelectedSale(null);

    setForm({
      ...emptyForm,
      client_id: filters.client_id || "",
      warehouse_id: defaultWarehouse?.id || "",

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
      warehouse_id: sale.warehouse_id || "",
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
      const { data } = await getClientBalance({
        client_id: clientId,
      });

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

            paid_amount: Number(sale.current_paid_amount ?? sale.paid_amount ?? 0),

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

      ...(field === "client_id"
        ? {
            client_sale_id: "",
          }
        : {}),
    }));

    if (field === "client_id") {
      fetchPaymentBalance(value);
    }

    if (field === "client_sale_id") {
      const sale = sales.find((item) => Number(item.id) === Number(value));

      if (sale) {
        setPaymentBalance({
          total_amount: Number(sale.total_amount || 0),

          paid_amount: Number(sale.current_paid_amount ?? sale.paid_amount ?? 0),

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

    if (!selectedSale && !form.warehouse_id) {
      toast.error("Mahsulot sotiladigan omborni tanlang.");

      return false;
    }

    if (selectedSale) {
      if (!form.product_id || !form.quantity || Number(form.quantity) <= 0) {
        toast.error("Mahsulot va miqdorni to'g'ri kiriting.");

        return false;
      }

      if (selectedSaleQuantityExceeded) {
        toast.error(
          `Omborda faqat ${formatNumber(selectedSaleAvailableStock)} par mahsulot mavjud.`,
        );

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

    if (!selectedSale) {
      const requested = new Map();

      for (const item of form.items) {
        const productId = Number(item.product_id);

        requested.set(productId, (requested.get(productId) || 0) + Number(item.quantity || 0));
      }

      for (const [productId, requestedQuantity] of requested) {
        const available = getAvailableStock(productId);

        if (requestedQuantity > available) {
          const product = products.find((item) => Number(item.id) === productId);

          toast.error(
            `${product?.name || "Mahsulot"} omborda yetarli emas. Mavjud: ${formatNumber(
              available,
            )}`,
          );

          return false;
        }
      }
    }

    return true;
  };

  const buildPayload = () => ({
    client_id: Number(form.client_id),

    ...(form.warehouse_id
      ? {
          warehouse_id: Number(form.warehouse_id),
        }
      : {}),

    product_id: Number(form.product_id),
    quantity: Number(form.quantity),
    unit_price: Number(form.unit_price),
    paid_amount: Number(form.paid_amount || 0),
    sold_at: form.sold_at || undefined,
    note: form.note.trim() || null,
  });

  const buildBulkPayload = () => ({
    client_id: Number(form.client_id),
    warehouse_id: Number(form.warehouse_id),
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
      fetchDictionaries();
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
    if (!validatePaymentForm()) {
      return;
    }

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
      className="crm-page client-sales-page"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2.5,
      }}
    >
      <style>{clientSalesStyles}</style>
      <Box
        component="section"
        className="client-sales-hero"
        sx={{
          position: "relative",
          isolation: "isolate",
          mb: 2,

          p: {
            xs: 2.5,
            md: 3,
          },

          overflow: "hidden",
          color: "#ffffff",
          borderRadius: "25px",

          border: "1px solid rgba(255,255,255,.075)",

          backgroundColor: "#0d1117 !important",

          backgroundImage:
            "radial-gradient(circle at 100% 0%,rgba(220,38,38,.34),transparent 30%),linear-gradient(145deg,#0d1117,#171117 52%,#3a121a) !important",

          boxShadow: "0 24px 60px rgba(15,23,42,.20)",

          "&::before": {
            content: '""',
            position: "absolute",
            width: 390,
            height: 390,
            top: -275,
            right: -210,
            borderRadius: "50%",

            border: "1px solid rgba(248,113,113,.16)",

            boxShadow: "0 0 0 62px rgba(248,113,113,.022),0 0 0 124px rgba(248,113,113,.014)",

            pointerEvents: "none",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              xl: ".8fr 1.2fr",
            },

            gap: 3,
            alignItems: "center",
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.1,
              }}
            >
              <Box
                sx={{
                  width: 25,
                  height: 2,
                  borderRadius: 99,

                  background: "linear-gradient(90deg,#fb7185,#ef4444)",
                }}
              />

              <Typography
                sx={{
                  color: "#fecdd3 !important",

                  fontSize: 10,
                  fontWeight: 950,
                  letterSpacing: ".13em",
                  textTransform: "uppercase",
                }}
              >
                Savdo va qarzdorlik markazi
              </Typography>
            </Box>

            <Typography
              component="h1"
              sx={{
                mt: 1.5,
                color: "#ffffff !important",

                fontSize: {
                  xs: 29,
                  md: 36,
                },

                lineHeight: 1.08,
                fontWeight: 950,
                letterSpacing: "-.045em",
              }}
            >
              Mijoz savdolari
            </Typography>

            <Typography
              sx={{
                maxWidth: 540,
                mt: 1.4,

                color: "rgba(255,255,255,.45) !important",

                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Mijozlarga sotilgan mahsulotlar, tushumlar, qolgan qarzlar va ombor chiqimini bir
              joydan boshqaring.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,minmax(0,1fr))",
                lg: "repeat(4,minmax(0,1fr))",
              },

              gap: 1.3,
            }}
          >
            <HeroMetric
              label="Jami savdo"
              value={formatMoney(displayTotals.total_amount)}
              helper="Tanlangan filtr bo‘yicha"
              tone="blue"
            />

            <HeroMetric
              label="Jami to‘langan"
              value={formatMoney(displayTotals.paid_amount)}
              helper={`${paymentPercent}% to‘lov bajarilgan`}
              tone="green"
            />

            <HeroMetric
              label="Jami qarz"
              value={formatMoney(displayTotals.debt_amount)}
              helper="Mijozlardan olinadi"
              tone="amber"
            />

            <HeroMetric
              label="Savdo yozuvlari"
              value={formatNumber(pageInfo.total)}
              helper="Jami yozuvlar soni"
              tone="red"
            />
          </Box>
        </Box>
      </Box>{" "}
      <Card
        sx={{
          mb: 2,

          p: {
            xs: 1.5,
            md: 2,
          },

          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",

            alignItems: {
              xs: "stretch",
              xl: "flex-start",
            },

            justifyContent: "space-between",

            flexDirection: {
              xs: "column",
              xl: "row",
            },

            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,1fr)",
                lg: "repeat(4,1fr)",
              },

              gap: 1.2,
              flex: 1,
            }}
          >
            <TextField
              size="small"
              label="Savdo yoki mijozni qidirish"
              value={filters.q}
              onChange={handleFilterChange("q")}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyFilters();
                }
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
                borderRadius: "var(--aa-radius-md)",
                textTransform: "none",
                fontWeight: 800,

                color: "var(--aa-text-secondary)",

                borderColor: "var(--aa-border-strong)",

                background: "#fff",

                "&:hover": {
                  borderColor: "var(--aa-brand-300)",

                  background: "var(--aa-brand-50)",
                },
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
                fontWeight: 800,

                color: "var(--aa-text-secondary)",

                borderColor: "var(--aa-border-strong)",

                background: "#fff",

                "&:hover": {
                  borderColor: "var(--aa-brand-300)",

                  background: "var(--aa-brand-50)",
                },
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
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />

                <TextField
                  size="small"
                  type="date"
                  label="Gacha"
                  value={filters.date_to}
                  onChange={handleFilterChange("date_to")}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
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
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.2}
            >
              <Button
                variant="outlined"
                onClick={() => openPaymentModal()}
                sx={{
                  minWidth: 145,
                  height: 42,

                  borderRadius: "var(--aa-radius-md)",

                  textTransform: "none",
                  fontWeight: 800,

                  color: "var(--aa-text-secondary)",

                  borderColor: "var(--aa-border-strong)",

                  background: "#fff",

                  "&:hover": {
                    borderColor: "var(--aa-brand-300)",

                    background: "var(--aa-brand-50)",
                  },
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

                  borderRadius: "var(--aa-radius-md)",

                  textTransform: "none",
                  fontWeight: 850,

                  background: "var(--aa-brand-800)",

                  boxShadow: "0 10px 24px rgba(143,29,32,.16)",

                  "&:hover": {
                    background: "var(--aa-brand-700)",
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
        <Card
          sx={{
            mb: 2,
            p: 1.6,
            flexShrink: 0,
          }}
        >
          {summaryLoading ? (
            <Box
              sx={{
                minHeight: 92,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : summary.length ? (
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,1fr)",
                  xl: "repeat(4,1fr)",
                },

                gap: 1.4,
              }}
            >
              {summary.slice(0, 4).map((item) => (
                <Box
                  key={String(item.group_id)}
                  sx={{
                    p: 1.6,

                    borderRadius: "var(--aa-radius-lg)",

                    background: "#fff",

                    border: "1px solid var(--aa-border)",

                    boxShadow: "var(--aa-shadow-xs)",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,

                      color: "var(--aa-text-secondary)",

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
                      fontWeight: 850,

                      color: "var(--aa-text)",

                      letterSpacing: "-0.04em",
                    }}
                  >
                    {formatMoney(item.total_amount)}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.45,
                      fontSize: 12.5,
                      fontWeight: 750,

                      color: "var(--aa-text-tertiary)",
                    }}
                  >
                    Qarz: {formatMoney(item.debt_amount)} / {item.sales_count} savdo
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                minHeight: 92,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 750,

                  color: "var(--aa-text-tertiary)",
                }}
              >
                Umumiy savdo ma'lumoti topilmadi.
              </Typography>
            </Box>
          )}
        </Card>
      )}{" "}
      <Card
        sx={{
          minHeight: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            minHeight: 0,
            flex: 1,
            overflow: "auto",
          }}
        >
          <Table
            sx={{
              minWidth: canManage ? 1050 : 900,

              "& th": {
                py: 1.7,
                fontSize: 11.5,
                fontWeight: 850,

                color: "var(--aa-text-tertiary)",

                textTransform: "uppercase",
                letterSpacing: "0.045em",

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
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    align="center"
                    sx={{
                      py: 7,
                    }}
                  >
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : sales.length ? (
                sales.map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.6,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,

                            bgcolor: "var(--aa-brand-800)",

                            color: "#fff",
                            fontWeight: 850,

                            border: "3px solid #fff",

                            boxShadow: "0 8px 20px rgba(143,29,32,.14)",
                          }}
                        >
                          {getInitial(sale.client_name)}
                        </Avatar>

                        <Box
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 14.5,
                              fontWeight: 850,

                              color: "var(--aa-text)",

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

                              color: "var(--aa-text-tertiary)",
                            }}
                          >
                            @{sale.client_username || "client"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: 14.5,
                          fontWeight: 850,

                          color: "var(--aa-text)",
                        }}
                      >
                        {sale.product_name || "-"}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: 12.5,
                          fontWeight: 700,

                          color: "var(--aa-text-tertiary)",
                        }}
                      >
                        {sale.product_sku || "-"}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: 12.5,
                          fontWeight: 750,

                          color: "var(--aa-info)",
                        }}
                      >
                        {sale.warehouse_name || "Tarixiy savdo (omborsiz)"}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: 12.5,
                          fontWeight: 700,

                          color: "var(--aa-text-tertiary)",
                        }}
                      >
                        {formatNumber(sale.quantity)} {sale.product_unit || "par"} ×{" "}
                        {formatMoney(sale.unit_price)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: 14.5,
                          fontWeight: 850,

                          color: "var(--aa-text)",
                        }}
                      >
                        Jami: {formatMoney(sale.total_amount)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: 12.5,
                          fontWeight: 800,
                          color: "#15803d",
                        }}
                      >
                        To'landi: {formatMoney(sale.current_paid_amount ?? sale.paid_amount)}
                      </Typography>

                      {Number(sale.extra_paid_amount || 0) > 0 && (
                        <Typography
                          sx={{
                            mt: 0.35,
                            fontSize: 12.5,
                            fontWeight: 700,

                            color: "var(--aa-text-tertiary)",
                          }}
                        >
                          Keyingi: {formatMoney(sale.extra_paid_amount)}
                        </Typography>
                      )}

                      <Box
                        sx={{
                          mt: 0.8,
                        }}
                      >
                        <DebtChip debt={sale.remaining_debt ?? sale.debt_amount} />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: 13.5,
                          fontWeight: 800,
                          color: "#334155",
                        }}
                      >
                        {formatDate(sale.sold_at)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          maxWidth: 220,
                          fontSize: 12.5,
                          fontWeight: 700,

                          color: "var(--aa-text-secondary)",
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
                          sx={{
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                          }}
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
                    sx={{
                      py: 7,

                      color: "var(--aa-text-tertiary)",

                      fontWeight: 850,
                    }}
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
            borderTop: "1px solid var(--aa-border)",

            background: "var(--aa-surface-muted)",
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
      </Card>{" "}
      <PremiumDialog
        open={modalOpen}
        onClose={closeModals}
        title={selectedSale ? "Savdoni tahrirlash" : "Mijozga mahsulot sotish"}
        maxWidth="md"
        actions={
          <>
            <Button
              onClick={closeModals}
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
              onClick={handleSave}
              disabled={
                saving ||
                selectedSaleQuantityExceeded ||
                (!selectedSale && bulkSaleQuantityExceeded)
              }
              sx={{
                minWidth: 120,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 850,

                background: "var(--aa-brand-800)",

                boxShadow: "0 10px 24px rgba(143,29,32,.16)",

                "&:hover": {
                  background: "var(--aa-brand-700)",
                },
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

              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },

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

            {(!selectedSale || selectedSale.inventory_tracked_at) && (
              <TextField
                select
                required
                label="Mahsulot chiqadigan ombor"
                value={form.warehouse_id}
                onChange={handleFormChange("warehouse_id")}
                helperText="Qoldiq shu ombordan avtomatik kamayadi"
              >
                {activeWarehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}

                    {warehouse.is_default ? " (asosiy)" : ""}
                  </MenuItem>
                ))}
              </TextField>
            )}

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
                      {product.name} - {formatMoney(product.sale_price)} | Omborda:{" "}
                      {formatNumber(getAvailableStock(product.id))}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  required
                  type="number"
                  label="Miqdor"
                  value={form.quantity}
                  onChange={handleFormChange("quantity")}
                  error={selectedSaleQuantityExceeded}
                  helperText={
                    form.product_id
                      ? selectedSaleQuantityExceeded
                        ? `Omborda faqat ${formatNumber(selectedSaleAvailableStock)} par mavjud`
                        : `Omborda: ${formatNumber(selectedSaleAvailableStock)} par`
                      : "Avval mahsulotni tanlang"
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: 1,
                    },
                  }}
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
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: 1000,
                    },
                  }}
                />
              </>
            )}

            <TextField
              type="date"
              label="Sotilgan sana"
              value={form.sold_at}
              onChange={handleFormChange("sold_at")}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>
          {!selectedSale && (
            <Box
              sx={{
                p: 2,
                borderRadius: "18px",

                background: "linear-gradient(135deg,#ffffff,#f8fafc)",

                border: "1px solid rgba(148,163,184,.22)",
              }}
            >
              <Box
                sx={{
                  mb: 1.6,
                  display: "flex",

                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },

                  justifyContent: "space-between",

                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },

                  gap: 1.3,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 950,
                      color: "#0f172a",
                    }}
                  >
                    Mahsulotlar
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,
                      fontSize: 13,
                      fontWeight: 650,
                      color: "#64748b",
                    }}
                  >
                    Bir nechta mahsulotni bitta savdoga qo'shishingiz mumkin.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,

                      items: [
                        ...previous.items,

                        {
                          product_id: "",
                          quantity: "",
                          unit_price: "",
                        },
                      ],
                    }))
                  }
                  sx={{
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 900,
                  }}
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

                      gridTemplateColumns: {
                        xs: "1fr",

                        md: "1.5fr .8fr 1fr auto",
                      },

                      gap: 1.3,
                      p: 1.4,
                      borderRadius: "16px",

                      background: "#ffffff",

                      border: "1px solid rgba(148,163,184,.20)",
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
                        <MenuItem
                          key={product.id}
                          value={product.id}
                          disabled={!form.warehouse_id || getAvailableStock(product.id) <= 0}
                        >
                          {product.name} - {formatMoney(product.sale_price)} | Omborda:{" "}
                          {formatNumber(getAvailableStock(product.id))}
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
                      error={
                        Boolean(item.product_id) &&
                        Number(requestedByProduct.get(Number(item.product_id)) || 0) >
                          getAvailableStock(item.product_id)
                      }
                      helperText={
                        item.product_id
                          ? Number(requestedByProduct.get(Number(item.product_id)) || 0) >
                            getAvailableStock(item.product_id)
                            ? `Omborda faqat ${formatNumber(
                                getAvailableStock(item.product_id),
                              )} par mavjud`
                            : `Omborda: ${formatNumber(getAvailableStock(item.product_id))} par`
                          : "Avval mahsulotni tanlang"
                      }
                      slotProps={{
                        htmlInput: {
                          min: 0,
                          step: 1,
                        },
                      }}
                    />

                    <TextField
                      type="number"
                      label="Sotish narxi"
                      value={item.unit_price}
                      onChange={(event) =>
                        handleSaleItemChange(index, "unit_price", event.target.value)
                      }
                      slotProps={{
                        htmlInput: {
                          min: 0,
                          step: 1000,
                        },
                      }}
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
          )}{" "}
          {selectedSale && !selectedSale.inventory_tracked_at && (
            <Box
              sx={{
                p: 1.6,
                borderRadius: "14px",
                color: "#92400e",

                background: "rgba(245,158,11,.10)",

                border: "1px solid rgba(245,158,11,.25)",

                fontSize: 13,
                fontWeight: 750,
              }}
            >
              Bu eski savdo ombor hisobi yoqilishidan oldin yaratilgan. Uni tahrirlash qoldiqni
              o'zgartirmaydi.
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
            slotProps={{
              htmlInput: {
                min: 0,
                step: 1000,
              },
            }}
          />
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3,1fr)",
              },

              gap: 1.2,
              p: 1.5,
              borderRadius: "18px",

              background: preview.overPaid ? "rgba(254,242,242,.95)" : "#f8fafc",

              border: preview.overPaid
                ? "1px solid rgba(220,38,38,.30)"
                : "1px solid rgba(148,163,184,.20)",
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
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 850,
              }}
            >
              Bekor qilish
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deleting}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
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
            color: "#334155",
            fontWeight: 700,
          }}
        >
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
              onClick={handleSavePayment}
              disabled={paymentSaving}
              sx={{
                minWidth: 120,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,

                background: "linear-gradient(135deg,#8b0101,#b91c1c)",

                boxShadow: "0 12px 25px rgba(139,1,1,.20)",
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
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },

              gap: 1.6,
            }}
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
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 1000,
                },
              }}
            />

            <TextField
              type="date"
              label="To'lov sanasi"
              value={paymentForm.paid_at}
              onChange={handlePaymentChange("paid_at")}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              p: 2,
              borderRadius: "18px",

              background: "linear-gradient(135deg,#ffffff,#f8fafc)",

              border: "1px solid rgba(148,163,184,.22)",
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
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 950,
                  color: "#0f172a",
                }}
              >
                Qarz holati
              </Typography>

              {paymentBalanceLoading && <CircularProgress size={18} />}
            </Box>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,1fr)",
                },

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

const clientSalesStyles = `
  .crm-page .client-sales-hero {
    color: #ffffff !important;
    background-color: #0d1117 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.34),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #0d1117,
        #171117 52%,
        #3a121a
      ) !important;
  }

  .client-sales-dialog-title {
    color: #ffffff !important;
    background-color: #0d1117 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.28),
        transparent 36%
      ),
      linear-gradient(
        135deg,
        #11151c,
        #321319
      ) !important;
  }
`;

export default ClientSales;
