import { useCallback, useEffect, useState } from "react";
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
import { hasPermission } from "../../utils/permissions";
import { getUsers } from "../../api/getUsers";
import {
  createWorkerPayment,
  deleteWorkerPayment,
  getWorkerBalance,
  getWorkerDues,
  getWorkerPayments,
  updateWorkerPayment,
} from "../../api/workerPayments";
import {
  createWorkerAdvance,
  getWorkerAdvances,
  getWorkerAdvanceBalance,
} from "../../api/workerAdvances";

const emptyForm = {
  worker_id: "",
  amount: "",
  advance_deduction: "",
  payment_type: "salary",
  paid_at: new Date().toISOString().slice(0, 10),
  period_from: "",
  period_to: "",
  note: "",
};

const emptyAdvanceForm = {
  worker_id: "",
  amount: "",
  given_at: new Date().toISOString().slice(0, 10),
  note: "",
};

const paymentTypeLabels = {
  salary: "Oylik",
  bonus: "Bonus",
  other: "Boshqa",
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getImageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;

  const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "0 so'm";
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
};

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
        minWidth: 130,
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

const PaymentTypeChip = ({ type }) => {
  const styles = {
    salary: {
      color: "var(--aa-success)",
      bg: "color-mix(in srgb, var(--aa-success) 10%, transparent)",
      border: "color-mix(in srgb, var(--aa-success) 22%, transparent)",
    },
    bonus: {
      color: "var(--aa-info)",
      bg: "color-mix(in srgb, var(--aa-info) 8%, transparent)",
      border: "color-mix(in srgb, var(--aa-info) 16%, transparent)",
    },
    other: {
      color: "var(--aa-warning)",
      bg: "color-mix(in srgb, var(--aa-warning) 10%, transparent)",
      border: "color-mix(in srgb, var(--aa-warning) 22%, transparent)",
    },
  };

  const current = styles[type] || styles.other;

  return (
    <Chip
      size="small"
      label={paymentTypeLabels[type] || type || "-"}
      sx={{
        height: 26,
        px: 0.35,
        fontSize: 12,
        fontWeight: 900,
        color: current.color,
        background: current.bg,
        border: `1px solid ${current.border}`,
      }}
    />
  );
};

const PremiumDialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = "sm",
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

const BalanceBox = ({ label, value, tone = "default" }) => {
  const colors = {
    default: "var(--aa-text)",
    green: "var(--aa-success)",
    red: "var(--aa-brand-700)",
    blue: "var(--aa-info)",
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

const WorkerPayments = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const canManage =
    ["super_admin", "admin"].includes(currentUser?.role) &&
    hasPermission(currentUser, "payroll.manage");

  const [payments, setPayments] = useState([]);
  const [workerDues, setWorkerDues] = useState([]);
  const [balance, setBalance] = useState({
    total_earned: 0,
    total_paid: 0,
    remaining: 0,
  });
  const [pageInfo, setPageInfo] = useState({ total: 0, offset: 0, limit: 10 });
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [filters, setFilters] = useState({
    q: "",
    worker_id: "",
    payment_type: "",
    date_from: "",
    date_to: "",
    sort_by: "paid_at",
    sort_order: "desc",
    group_by: "worker",
  });

  const [form, setForm] = useState(emptyForm);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advancesOpen, setAdvancesOpen] = useState(false);
  const [advances, setAdvances] = useState([]);
  const [advancesLoading, setAdvancesLoading] = useState(false);
  const [advanceForm, setAdvanceForm] = useState(emptyAdvanceForm);
  const [advanceSaving, setAdvanceSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedWorkerBalance, setSelectedWorkerBalance] = useState({
    total_earned: 0,
    total_paid: 0,
    remaining: 0,
    total_advance: 0,
    advance_deducted: 0,
    remaining_advance: 0,
  });
  const [balanceLoading, setBalanceLoading] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);
  const enteredPaymentTotal =
    Number(form.amount || 0) + Number(form.advance_deduction || 0);
  const editingPaymentTotal = selectedPayment
    ? Number(selectedPayment.amount || 0) +
      Number(selectedPayment.advance_deduction || 0)
    : 0;
  const availableWorkerBalance =
    Number(selectedWorkerBalance.remaining || 0) + editingPaymentTotal;
  const paymentExceedsBalance =
    Boolean(form.worker_id) && enteredPaymentTotal > availableWorkerBalance;

  const fetchWorkers = useCallback(async () => {
    try {
      const { data } = await getUsers({
        offset: 0,
        limit: 100,
        sort_by: "created_at",
        sort_order: "desc",
      });

      setWorkers(
        (data.users || data.list || []).filter(
          (user) => user.role === "worker",
        ),
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Ishchilarni olishda xato.",
      );
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

      for (const key of [
        "q",
        "worker_id",
        "payment_type",
        "date_from",
        "date_to",
      ]) {
        if (filters[key] !== "") params[key] = filters[key];
      }

      return params;
    },
    [filters, pageInfo.limit],
  );

  const fetchPayments = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        const { data } = await getWorkerPayments(buildParams(offset, limit));

        setPayments(data.worker_payments || []);
        setPageInfo(data.pageInfo || { total: 0, offset, limit });
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "To'lovlarni olishda xato.",
        );
      } finally {
        setLoading(false);
      }
    },
    [buildParams, pageInfo.limit],
  );

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);

    try {
      const [balanceRes, duesRes] = await Promise.all([
        getWorkerBalance({
          worker_id: filters.worker_id || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
        }),
        getWorkerDues(),
      ]);

      setWorkerDues(duesRes.data.worker_dues || []);
      setBalance(
        balanceRes.data.balance || {
          total_earned: 0,
          total_paid: 0,
          remaining: 0,
        },
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Oylik summary olishda xato.",
      );
    } finally {
      setSummaryLoading(false);
    }
  }, [filters.worker_id, filters.date_from, filters.date_to]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments(0, pageInfo.limit);
      fetchSummary();
    }, 250);

    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit, fetchPayments, fetchSummary]);

  const handleFilterChange = (field) => (event) => {
    setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const fetchSelectedWorkerBalance = useCallback(async (workerId) => {
    if (!workerId) {
      setSelectedWorkerBalance({
        total_earned: 0,
        total_paid: 0,
        remaining: 0,
        total_advance: 0,
        advance_deducted: 0,
        remaining_advance: 0,
      });
      return;
    }

    setBalanceLoading(true);

    try {
      const [{ data }, advanceRes] = await Promise.all([
        getWorkerBalance({
          worker_id: workerId,
        }),
        getWorkerAdvanceBalance({ worker_id: workerId }),
      ]);

      setSelectedWorkerBalance({
        ...(data.balance || {
          total_earned: 0,
          total_paid: 0,
          remaining: 0,
        }),
        ...(advanceRes.data.balance || {}),
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Ishchi balansini olishda xato.",
      );
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const handleFormChange = (field) => (event) => {
    const value = event.target.value;

    setForm((previous) => ({ ...previous, [field]: value }));

    if (field === "worker_id") {
      fetchSelectedWorkerBalance(value);
    }

    if (field === "period_from" || field === "period_to") {
      fetchSelectedWorkerBalance(form.worker_id);
    }
  };

  const refreshPage = () => {
    fetchPayments(pageInfo.offset, pageInfo.limit);
    fetchSummary();
  };

  const applyFilters = () => {
    fetchPayments(0, pageInfo.limit);
    fetchSummary();
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      worker_id: "",
      payment_type: "",
      date_from: "",
      date_to: "",
      sort_by: "paid_at",
      sort_order: "desc",
      group_by: "worker",
    });
  };

  const openCreateModal = () => {
    setSelectedPayment(null);

    const nextForm = {
      ...emptyForm,
      period_from: filters.date_from || "",
      period_to: filters.date_to || "",
      worker_id: filters.worker_id || "",
    };

    setForm(nextForm);
    setModalOpen(true);
    fetchSelectedWorkerBalance(nextForm.worker_id);
  };

  const openEditModal = (payment) => {
    setSelectedPayment(payment);

    const nextForm = {
      worker_id: payment.worker_id || "",
      amount: payment.amount ?? "",
      advance_deduction: payment.advance_deduction ?? "",
      payment_type: payment.payment_type || "salary",
      paid_at: payment.paid_at
        ? String(payment.paid_at).slice(0, 10)
        : emptyForm.paid_at,
      period_from: payment.period_from
        ? String(payment.period_from).slice(0, 10)
        : "",
      period_to: payment.period_to
        ? String(payment.period_to).slice(0, 10)
        : "",
      note: payment.note || "",
    };

    setForm(nextForm);
    setModalOpen(true);
    fetchSelectedWorkerBalance(nextForm.worker_id);
  };

  const closeModals = () => {
    setModalOpen(false);
    setDeleteOpen(false);
    setAdvanceOpen(false);
    setSelectedPayment(null);
    setForm(emptyForm);
    setAdvanceForm(emptyAdvanceForm);
    setSelectedWorkerBalance({
      total_earned: 0,
      total_paid: 0,
      remaining: 0,
      total_advance: 0,
      advance_deducted: 0,
      remaining_advance: 0,
    });
  };

  const validateForm = () => {
    if (!form.worker_id) {
      toast.error("Ishchini tanlang.");
      return false;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      if (Number(form.advance_deduction || 0) <= 0) {
        toast.error("Naqd summa yoki avans ushlanmasini kiriting.");
        return false;
      }
    }

    if (
      Number(form.advance_deduction || 0) >
      Number(selectedWorkerBalance.remaining_advance || 0)
    ) {
      toast.error("Avans ushlanmasi qolgan avansdan oshmasin.");
      return false;
    }

    if (paymentExceedsBalance) {
      toast.error(
        `Ogohlantirish: to'lov qolgan ${formatMoney(availableWorkerBalance)} ish haqidan oshmasin.`,
      );
      return false;
    }

    if (
      form.period_from &&
      form.period_to &&
      new Date(form.period_from) > new Date(form.period_to)
    ) {
      toast.error("Davr boshlanishi tugash sanasidan katta bo'lmasin.");
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    worker_id: Number(form.worker_id),
    amount: Number(form.amount || 0),
    advance_deduction: Number(form.advance_deduction || 0),
    payment_type: form.payment_type,
    paid_at: form.paid_at || undefined,
    period_from: form.period_from || null,
    period_to: form.period_to || null,
    note: form.note.trim() || null,
  });

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      if (selectedPayment) {
        await updateWorkerPayment(selectedPayment.id, buildPayload());
        toast.success("To'lov yangilandi.");
      } else {
        await createWorkerPayment(buildPayload());
        toast.success("To'lov qo'shildi.");
      }

      closeModals();
      refreshPage();
    } catch (error) {
      toast.error(error?.response?.data?.message || "To'lovni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;

    setDeleting(true);

    try {
      await deleteWorkerPayment(selectedPayment.id);
      toast.success("To'lov o'chirildi.");
      closeModals();
      refreshPage();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "To'lovni o'chirishda xato.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const openWorkerPayment = (workerId) => {
    setSelectedPayment(null);

    const nextForm = { ...emptyForm, worker_id: workerId };

    setForm(nextForm);
    setModalOpen(true);
    fetchSelectedWorkerBalance(workerId);
  };

  const handleSaveAdvance = async () => {
    if (!advanceForm.worker_id || Number(advanceForm.amount) <= 0) {
      toast.error("Ishchi va avans summasini kiriting.");
      return;
    }

    setAdvanceSaving(true);

    try {
      await createWorkerAdvance({
        worker_id: Number(advanceForm.worker_id),
        amount: Number(advanceForm.amount),
        given_at: advanceForm.given_at,
        note: advanceForm.note.trim() || null,
      });

      toast.success("Avans berildi.");
      closeModals();
      refreshPage();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Avansni saqlashda xato.");
    } finally {
      setAdvanceSaving(false);
    }
  };

  const openAdvancesHistory = async () => {
    setAdvancesOpen(true);
    setAdvancesLoading(true);

    try {
      const { data } = await getWorkerAdvances({
        worker_id: filters.worker_id || undefined,
        offset: 0,
        limit: 100,
        sort_by: "given_at",
        sort_order: "desc",
      });

      setAdvances(data.worker_advances || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Avanslarni olishda xato.");
    } finally {
      setAdvancesLoading(false);
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
              label="Al-amin CRM • oyliklar"
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
              Oyliklar
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 14,
                fontWeight: 650,
                color: "var(--aa-text-secondary)",
              }}
            >
              Ishchilarga berilgan oylik, avans va balans nazorati.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, auto)",
                xl: "repeat(5, auto)",
              },
              gap: 1.2,
              width: { xs: "100%", xl: "auto" },
            }}
          >
            <MiniStat
              label="Ishlab topgan"
              value={formatMoney(balance.total_earned)}
              tone="blue"
            />
            <MiniStat
              label="Berilgan"
              value={formatMoney(balance.total_paid)}
              tone="green"
            />
            <MiniStat
              label="Qolgan"
              value={formatMoney(balance.remaining)}
              tone="red"
            />
            <MiniStat label="To'lovlar" value={pageInfo.total} tone="default" />
            <MiniStat
              label="Qolgan avans"
              value={formatMoney(balance.remaining_advance)}
              tone="orange"
            />
          </Box>
        </Box>
      </Card>

      <Card sx={{ mb: 1, p: 2, flexShrink: 0 }}>
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
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
                xl: "repeat(7, 1fr)",
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

            <TextField
              select
              size="small"
              label="To'lov turi"
              value={filters.payment_type}
              onChange={handleFilterChange("payment_type")}
            >
              <MenuItem value="">Barchasi</MenuItem>
              {Object.entries(paymentTypeLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
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
              label="Guruhlash"
              value={filters.group_by}
              onChange={handleFilterChange("group_by")}
            >
              <MenuItem value="worker">Ishchi</MenuItem>
              <MenuItem value="payment_type">To'lov turi</MenuItem>
              <MenuItem value="day">Kun</MenuItem>
            </TextField>

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
          </Box>

          {canManage && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                variant="outlined"
                onClick={openAdvancesHistory}
                sx={{
                  minWidth: 120,
                  height: 42,
                  borderRadius: "var(--aa-radius-md)",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "var(--aa-text)",
                  borderColor: "var(--aa-border-strong)",
                  background: "var(--aa-surface-solid)",
                }}
              >
                Avanslar
              </Button>

              <Button
                variant="outlined"
                onClick={() => {
                  setAdvanceForm({
                    ...emptyAdvanceForm,
                    worker_id: filters.worker_id || "",
                  });
                  setAdvanceOpen(true);
                }}
                sx={{
                  minWidth: 130,
                  height: 42,
                  borderRadius: "var(--aa-radius-md)",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "var(--aa-text)",
                  borderColor: "var(--aa-border-strong)",
                  background: "var(--aa-surface-solid)",
                }}
              >
                Avans berish
              </Button>

              <Button
                variant="contained"
                onClick={openCreateModal}
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
                Oylik berish
              </Button>
            </Stack>
          )}
        </Box>
      </Card>

      <Card sx={{ mb: 1, p: 1.6, flexShrink: 0 }}>
        {summaryLoading ? (
          <Box sx={{ minHeight: 92, display: "grid", placeItems: "center" }}>
            <CircularProgress size={24} />
          </Box>
        ) : workerDues.length ? (
          <Box sx={{ display: "flex", gap: 1.4, overflowX: "auto", pb: 0.3 }}>
            {workerDues.map((item) => (
              <Box
                key={item.worker_id}
                sx={{
                  width: 315,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.4,
                  p: 1.4,
                  borderRadius: "var(--aa-radius-lg)",
                  background: "var(--aa-surface-solid)",
                  border: "1px solid var(--aa-border)",
                  boxShadow: "var(--aa-shadow-xs)",
                }}
              >
                <Avatar
                  src={getImageUrl(item.user_image)}
                  sx={{
                    width: 46,
                    height: 46,
                    bgcolor: "var(--aa-brand-50)",
                    color: "var(--aa-brand-700)",
                    fontWeight: 950,
                  }}
                >
                  {getInitial(item.first_name)}
                </Avatar>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: "var(--aa-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.first_name} {item.last_name}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,
                      fontSize: 15,
                      fontWeight: 950,
                      color: "var(--aa-brand-700)",
                    }}
                  >
                    {formatMoney(item.remaining)}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--aa-text-secondary)",
                    }}
                  >
                    Berilishi kerak
                  </Typography>
                </Box>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => openWorkerPayment(item.worker_id)}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 900,
                  }}
                >
                  Berish
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ minHeight: 92, display: "grid", placeItems: "center" }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 750,
                color: "var(--aa-text-secondary)",
              }}
            >
              Oyligi qolgan ishchilar yo'q.
            </Typography>
          </Box>
        )}
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
              minWidth: canManage ? 1080 : 940,
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
                <TableCell>Ishchi</TableCell>
                <TableCell>To'lov turi</TableCell>
                <TableCell>Summa</TableCell>
                <TableCell>To'lov sanasi</TableCell>
                <TableCell>Davr</TableCell>
                <TableCell>Izoh</TableCell>
                {canManage && <TableCell align="right">Amallar</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 7 : 6}
                    align="center"
                    sx={{ py: 7 }}
                  >
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : payments.length ? (
                payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.6 }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: "var(--aa-brand-50)",
                            color: "var(--aa-brand-700)",
                            fontWeight: 950,
                            border: "3px solid var(--aa-surface-solid)",
                            boxShadow: "var(--aa-shadow-sm)",
                          }}
                        >
                          {getInitial(payment.worker_name)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 14.5,
                              fontWeight: 900,
                              color: "var(--aa-text)",
                              lineHeight: 1.15,
                            }}
                          >
                            {payment.worker_name || "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "var(--aa-text-secondary)",
                            }}
                          >
                            @{payment.worker_username || "worker"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <PaymentTypeChip type={payment.payment_type} />
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: 14.5,
                          fontWeight: 950,
                          color: "var(--aa-text)",
                        }}
                      >
                        {formatMoney(payment.amount)}
                      </Typography>

                      {Number(payment.advance_deduction || 0) > 0 && (
                        <Typography
                          sx={{
                            mt: 0.35,
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "var(--aa-text-secondary)",
                          }}
                        >
                          Avansdan: {formatMoney(payment.advance_deduction)}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 800,
                        color: "var(--aa-text-secondary)",
                      }}
                    >
                      {formatDate(payment.paid_at)}
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 750,
                        color: "var(--aa-text-secondary)",
                      }}
                    >
                      {formatDate(payment.period_from)} -{" "}
                      {formatDate(payment.period_to)}
                    </TableCell>

                    <TableCell
                      sx={{
                        maxWidth: 220,
                        color: "var(--aa-text-secondary)",
                        fontWeight: 700,
                      }}
                    >
                      {payment.note || "-"}
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openEditModal(payment)}
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
                              setSelectedPayment(payment);
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
                    colSpan={canManage ? 7 : 6}
                    align="center"
                    sx={{
                      py: 7,
                      color: "var(--aa-text-secondary)",
                      fontWeight: 850,
                    }}
                  >
                    To'lovlar topilmadi
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
              fetchPayments(nextPage * pageInfo.limit, pageInfo.limit)
            }
            onLimitChange={(limit) => fetchPayments(0, limit)}
          />
        </Box>
      </Card>

      <PremiumDialog
        open={modalOpen}
        onClose={closeModals}
        title={selectedPayment ? "To'lovni tahrirlash" : "Oylik berish"}
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
              disabled={saving || paymentExceedsBalance}
              sx={{
                minWidth: 120,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                background: "var(--aa-brand-700)",
                boxShadow: "var(--aa-shadow-sm)",
                "&:hover": { background: "var(--aa-brand-800)" },
              }}
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </>
        }
      >
        <Stack spacing={2.1}>
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

          <Box
            sx={{
              p: 2,
              borderRadius: "18px",
              background: "var(--aa-surface)",
              border: paymentExceedsBalance
                ? "1px solid color-mix(in srgb, var(--aa-danger) 35%, transparent)"
                : "1px solid var(--aa-border)",
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
                sx={{ fontSize: 16, fontWeight: 950, color: "var(--aa-text)" }}
              >
                Tanlangan ishchi balansi
              </Typography>

              {balanceLoading && <CircularProgress size={18} />}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
                gap: 1.2,
              }}
            >
              <BalanceBox
                label="Oldingi qoldiq"
                value={formatMoney(selectedWorkerBalance.previous_remaining)}
                tone="blue"
              />
              <BalanceBox
                label="Yangi ish haqi"
                value={formatMoney(selectedWorkerBalance.new_earnings)}
                tone="green"
              />
              <BalanceBox
                label="Berilishi kerak"
                value={formatMoney(selectedWorkerBalance.remaining)}
                tone="red"
              />
              <BalanceBox
                label="Qolgan avans"
                value={formatMoney(selectedWorkerBalance.remaining_advance)}
                tone="orange"
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.6,
            }}
          >
            <TextField
              required
              type="number"
              label="Naqd beriladi"
              value={form.amount}
              onChange={handleFormChange("amount")}
              error={paymentExceedsBalance}
              helperText={
                paymentExceedsBalance
                  ? `Maksimum ${formatMoney(availableWorkerBalance)}`
                  : " "
              }
              slotProps={{ htmlInput: { min: 0, step: 1000 } }}
            />

            <TextField
              type="number"
              label="Avansdan ushlash"
              value={form.advance_deduction}
              onChange={handleFormChange("advance_deduction")}
              error={paymentExceedsBalance}
              helperText={
                paymentExceedsBalance
                  ? "Jami summa qolgan ish haqidan oshdi"
                  : `Maksimum: ${formatMoney(selectedWorkerBalance.remaining_advance)}`
              }
              slotProps={{ htmlInput: { min: 0, step: 1000 } }}
            />

            <TextField
              select
              label="To'lov turi"
              value={form.payment_type}
              onChange={handleFormChange("payment_type")}
            >
              {Object.entries(paymentTypeLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="To'lov sanasi"
              value={form.paid_at}
              onChange={handleFormChange("paid_at")}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="date"
              label="Davr boshidan"
              value={form.period_from}
              onChange={handleFormChange("period_from")}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              type="date"
              label="Davr oxirigacha"
              value={form.period_to}
              onChange={handleFormChange("period_to")}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          {paymentExceedsBalance && (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: "16px",
                background:
                  "color-mix(in srgb, var(--aa-danger) 7%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--aa-danger) 28%, transparent)",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: "var(--aa-danger)",
                }}
              >
                Ogohlantirish: kiritilgan {formatMoney(enteredPaymentTotal)}{" "}
                summa ishchining qolgan {formatMoney(availableWorkerBalance)}{" "}
                haqidan oshib ketdi.
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 1.2,
              p: 1.5,
              borderRadius: "18px",
              background: paymentExceedsBalance
                ? "color-mix(in srgb, var(--aa-danger) 7%, transparent)"
                : "var(--aa-surface-muted)",
              border: paymentExceedsBalance
                ? "1px solid color-mix(in srgb, var(--aa-danger) 28%, transparent)"
                : "1px solid var(--aa-border)",
            }}
          >
            <BalanceBox
              label="Oylikdan yopiladi"
              value={formatMoney(
                Number(form.amount || 0) + Number(form.advance_deduction || 0),
              )}
              tone="blue"
            />

            <BalanceBox
              label="Naqd beriladi"
              value={formatMoney(form.amount)}
              tone="green"
            />

            <BalanceBox
              label="Qoladigan avans"
              value={formatMoney(
                Math.max(
                  Number(selectedWorkerBalance.remaining_advance || 0) -
                    Number(form.advance_deduction || 0),
                  0,
                ),
              )}
              tone="orange"
            />
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
        open={advancesOpen}
        onClose={() => setAdvancesOpen(false)}
        title="Avanslar tarixi"
        maxWidth="md"
        actions={
          <Button
            onClick={() => setAdvancesOpen(false)}
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
        {advancesLoading ? (
          <Box sx={{ minHeight: 160, display: "grid", placeItems: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{
                minWidth: 720,
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
                  <TableCell>Ishchi</TableCell>
                  <TableCell>Avans</TableCell>
                  <TableCell>Sana</TableCell>
                  <TableCell>Izoh</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {advances.length ? (
                  advances.map((advance) => (
                    <TableRow key={advance.id} hover>
                      <TableCell
                        sx={{ fontWeight: 900, color: "var(--aa-text)" }}
                      >
                        {advance.worker_name}
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{ fontWeight: 950, color: "var(--aa-brand-700)" }}
                        >
                          {formatMoney(advance.amount)}
                        </Typography>
                      </TableCell>

                      <TableCell
                        sx={{
                          fontWeight: 750,
                          color: "var(--aa-text-secondary)",
                        }}
                      >
                        {formatDate(advance.given_at)}
                      </TableCell>

                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: "var(--aa-text-secondary)",
                        }}
                      >
                        {advance.note || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 6, fontWeight: 850 }}
                    >
                      Avans yozuvlari topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </PremiumDialog>

      <PremiumDialog
        open={advanceOpen}
        onClose={closeModals}
        title="Ishchiga avans berish"
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
              onClick={handleSaveAdvance}
              disabled={advanceSaving}
              sx={{
                minWidth: 125,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                background: "var(--aa-brand-700)",
                boxShadow: "var(--aa-shadow-sm)",
                "&:hover": { background: "var(--aa-brand-800)" },
              }}
            >
              {advanceSaving ? "Saqlanmoqda..." : "Avans berish"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            select
            required
            label="Ishchi"
            value={advanceForm.worker_id}
            onChange={(event) =>
              setAdvanceForm((previous) => ({
                ...previous,
                worker_id: event.target.value,
              }))
            }
          >
            {workers.map((worker) => (
              <MenuItem key={worker.id} value={worker.id}>
                {worker.first_name} {worker.last_name}
              </MenuItem>
            ))}
          </TextField>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.6,
            }}
          >
            <TextField
              required
              type="number"
              label="Avans summasi"
              value={advanceForm.amount}
              onChange={(event) =>
                setAdvanceForm((previous) => ({
                  ...previous,
                  amount: event.target.value,
                }))
              }
              slotProps={{ htmlInput: { min: 0, step: 1000 } }}
            />

            <TextField
              type="date"
              label="Berilgan sana"
              value={advanceForm.given_at}
              onChange={(event) =>
                setAdvanceForm((previous) => ({
                  ...previous,
                  given_at: event.target.value,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <TextField
            multiline
            minRows={3}
            label="Izoh"
            value={advanceForm.note}
            onChange={(event) =>
              setAdvanceForm((previous) => ({
                ...previous,
                note: event.target.value,
              }))
            }
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={deleteOpen}
        onClose={closeModals}
        title="To'lovni o'chirish"
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
        <Typography sx={{ color: "var(--aa-text-secondary)", fontWeight: 700 }}>
          {selectedPayment?.worker_name} uchun{" "}
          {formatMoney(selectedPayment?.amount)} to'lovni o'chirmoqchimisiz?
        </Typography>
      </PremiumDialog>
    </Box>
  );
};

export default WorkerPayments;
