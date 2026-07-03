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
  createClientSale,
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
  return new Date(value).toLocaleDateString("uz-UZ");
};

const StatBox = ({ label, value, helper }) => (
  <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <Typography variant="body2" className="text-slate-500">
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={800} className="text-slate-950">
      {value}
    </Typography>
    {helper && (
      <Typography variant="body2" className="mt-1 text-slate-500">
        {helper}
      </Typography>
    )}
  </Box>
);

const ClientSales = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const canManage = ["super_admin", "admin"].includes(currentUser?.role);

  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
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
  }, [buildParams, filters.client_id, filters.date_from, filters.date_to, filters.group_by]);

  useEffect(() => {
    fetchDictionaries();
  }, [fetchDictionaries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales(0, pageInfo.limit);
      fetchSummary();
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit]);

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
        client_sale_id: paymentForm.client_sale_id ? Number(paymentForm.client_sale_id) : null,
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
    <Box className="crm-page flex h-full min-h-0 flex-col">
      <Box className="mb-5 flex shrink-0 items-center justify-between">
        <Box>
          <Typography variant="h5" fontWeight={800} className="text-slate-950">
            Mijoz savdo
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            Mijozlarga berilgan mahsulotlar, to'lovlar va qarzdorlik nazorati
          </Typography>
        </Box>

        <Box className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatBox label="Savdo" value={formatMoney(balance.total_amount)} />
          <StatBox label="To'langan" value={formatMoney(balance.paid_amount)} />
          <StatBox label="Qarz" value={formatMoney(balance.debt_amount)} />
          <StatBox label="Yozuvlar" value={pageInfo.total} />
        </Box>
      </Box>

      <Paper elevation={0} className="mb-4 shrink-0 rounded-2xl border border-slate-200 p-4">
        <Box className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <Box className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            {filtersOpen && (
              <>
                <TextField
                  select
                  size="small"
                  label="Mahsulot"
                  sx={{ order: 2 }}
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
                  sx={{ order: 2 }}
                  value={filters.date_from}
                  onChange={handleFilterChange("date_from")}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="Gacha"
                  sx={{ order: 2 }}
                  value={filters.date_to}
                  onChange={handleFilterChange("date_to")}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  select
                  size="small"
                  label="Saralash"
                  sx={{ order: 2 }}
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
                  sx={{ order: 2 }}
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
                  sx={{ order: 2 }}
                  value={filters.group_by}
                  onChange={handleFilterChange("group_by")}
                >
                  <MenuItem value="client">Mijoz</MenuItem>
                  <MenuItem value="product">Mahsulot</MenuItem>
                  <MenuItem value="day">Kun</MenuItem>
                </TextField>
              </>
            )}
            <Button
              variant="text"
              sx={{ order: 1 }}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? "Filtrlarni yopish" : "Batafsil filtrlar"}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              sx={{ order: 1 }}
              onClick={() => {
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
              }}
            >
              Tozalash
            </Button>
          </Box>

          {canManage && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                onClick={() => openPaymentModal()}
                sx={{ borderRadius: 2, minWidth: 160 }}
              >
                Kirim qo'shish
              </Button>
              <Button
                variant="contained"
                onClick={openCreateModal}
                sx={{ borderRadius: 2, minWidth: 190 }}
              >
                Savdo qo'shish
              </Button>
            </Stack>
          )}
        </Box>
      </Paper>

      <Box className="mb-4 grid shrink-0 grid-cols-1 gap-3 md:grid-cols-4">
        {summaryLoading ? (
          <Paper elevation={0} className="rounded-2xl border border-slate-200 p-4 md:col-span-4">
            <CircularProgress size={24} />
          </Paper>
        ) : summary.length ? (
          summary.slice(0, 4).map((item) => (
            <Paper
              key={String(item.group_id)}
              elevation={0}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <Typography variant="body2" className="truncate text-slate-500">
                {item.group_name || "-"}
              </Typography>
              <Typography className="mt-1 text-slate-950" fontWeight={800}>
                {formatMoney(item.total_amount)}
              </Typography>
              <Typography variant="body2" className="mt-1 text-slate-500">
                Qarz: {formatMoney(item.debt_amount)} / {item.sales_count} savdo
              </Typography>
            </Paper>
          ))
        ) : (
          <Paper elevation={0} className="rounded-2xl border border-slate-200 p-4 md:col-span-4">
            <Typography variant="body2" className="text-slate-500">
              Summary uchun savdo ma'lumoti topilmadi.
            </Typography>
          </Paper>
        )}
      </Box>

      <Paper
        elevation={0}
        className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white"
      >
        <Box className="min-h-0 flex-1 overflow-auto">
          <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell width="25%" sx={{ fontWeight: 700 }}>
                  Mijoz
                </TableCell>
                <TableCell width="22%" sx={{ fontWeight: 700 }}>
                  Savdo
                </TableCell>
                <TableCell width="25%" sx={{ fontWeight: 700 }}>
                  Hisob
                </TableCell>
                <TableCell width="14%" sx={{ fontWeight: 700 }}>
                  Sana va izoh
                </TableCell>
                {canManage && (
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Amallar
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} align="center">
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : sales.length ? (
                sales.map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>
                      <Box className="flex items-center gap-3">
                        <Avatar sx={{ bgcolor: "#7F1D1D" }}>
                          {sale.client_name?.[0]?.toUpperCase() || "C"}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700}>{sale.client_name}</Typography>
                          <Typography variant="body2" className="text-slate-500">
                            @{sale.client_username || "client"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>{sale.product_name}</Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {sale.product_sku || "-"}
                      </Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {formatNumber(sale.quantity)} dona × {formatMoney(sale.unit_price)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={800}>
                        Jami: {formatMoney(sale.total_amount)}
                      </Typography>
                      <Typography variant="body2" className="text-emerald-700">
                        To'landi: {formatMoney(sale.current_paid_amount ?? sale.paid_amount)}
                      </Typography>
                      {Number(sale.extra_paid_amount || 0) > 0 && (
                        <Typography variant="body2" className="text-slate-500">
                          Keyingi: {formatMoney(sale.extra_paid_amount)}
                        </Typography>
                      )}
                      <Chip
                        size="small"
                        label={`Qarz: ${formatMoney(sale.debt_amount)}`}
                        color={Number(sale.debt_amount) > 0 ? "warning" : "success"}
                        className="mt-1"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(sale.sold_at)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sale.note || "Izoh yo'q"}
                      </Typography>
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Stack direction="column" spacing={0.5} sx={{ alignItems: "stretch" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            disabled={Number(sale.debt_amount || 0) <= 0}
                            onClick={() => openPaymentModal(sale)}
                          >
                            To'lov
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openEditModal(sale)}
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
                  <TableCell colSpan={canManage ? 5 : 4} align="center">
                    Savdo yozuvlari topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <CrmPagination total={pageInfo.total} page={page} limit={pageInfo.limit} onPageChange={(nextPage) => fetchSales(nextPage * pageInfo.limit, pageInfo.limit)} onLimitChange={(limit) => fetchSales(0, limit)} />
      </Paper>

      <Dialog open={modalOpen} onClose={closeModals} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {selectedSale ? "Savdoni tahrirlash" : "Mijozga mahsulot sotish"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        ? `Default: ${formatMoney(selectedProduct.sale_price)}`
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
              <Stack spacing={1.5}>
                {form.items.map((item, index) => (
                  <Box
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.5fr_0.8fr_1fr_auto]"
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
                    >
                      Olib tashlash
                    </Button>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,
                      items: [...previous.items, { product_id: "", quantity: "", unit_price: "" }],
                    }))
                  }
                >
                  Yana mahsulot
                </Button>
              </Stack>
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

            <Box className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
              <StatBox label="Jami" value={formatMoney(preview.total)} />
              <StatBox label="To'langan" value={formatMoney(preview.paid)} />
              <StatBox label="Qoladigan qarz" value={formatMoney(preview.debt)} />
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
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={closeModals} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Savdoni o'chirish</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedSale?.client_name} uchun {formatMoney(selectedSale?.total_amount)} savdo
            yozuvini o'chirmoqchimisiz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>Bekor qilish</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={paymentOpen} onClose={closeModals} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Mijozdan to'lov</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
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
                .map((sale) => (
                  <MenuItem key={sale.id} value={sale.id}>
                    #{sale.id} - {sale.product_name} / qarz{" "}
                    {formatMoney(sale.remaining_debt ?? sale.debt_amount)}
                  </MenuItem>
                ))}
            </TextField>

            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <Box className="auth-info-card rounded-2xl border p-4">
              <Box className="mb-3 flex items-center justify-between gap-3">
                <Typography fontWeight={800} className="text-slate-950">
                  Qarz holati
                </Typography>
                {paymentBalanceLoading && <CircularProgress size={18} />}
              </Box>

              <Box className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <StatBox label="Savdo" value={formatMoney(paymentBalance.total_amount)} />
                <StatBox label="Kirim" value={formatMoney(paymentForm.amount)} />
                <StatBox
                  label="Jami to'langan"
                  value={formatMoney(
                    Number(paymentBalance.paid_amount || 0) + Number(paymentForm.amount || 0),
                  )}
                />
                <StatBox
                  label="Qolgan qarz"
                  value={formatMoney(
                    Math.max(
                      Number(paymentBalance.debt_amount || 0) - Number(paymentForm.amount || 0),
                      0,
                    ),
                  )}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleSavePayment} disabled={paymentSaving}>
            {paymentSaving ? "Saqlanmoqda..." : "Kirim qilish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientSales;
