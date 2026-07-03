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

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "0 so'm";
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("uz-UZ");
};

const getImageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const WorkerPayments = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const canManage = ["super_admin", "admin"].includes(currentUser?.role);

  const [payments, setPayments] = useState([]);
  const [workerDues, setWorkerDues] = useState([]);
  const [balance, setBalance] = useState({
    total_earned: 0,
    total_paid: 0,
    remaining: 0,
  });
  const [pageInfo, setPageInfo] = useState({ total: 0, offset: 0, limit: 10 });
  const [totals, setTotals] = useState({ total_paid: 0 });
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
  const enteredPaymentTotal = Number(form.amount || 0) + Number(form.advance_deduction || 0);
  const editingPaymentTotal = selectedPayment
    ? Number(selectedPayment.amount || 0) + Number(selectedPayment.advance_deduction || 0)
    : 0;
  const availableWorkerBalance = Number(selectedWorkerBalance.remaining || 0) + editingPaymentTotal;
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
      setWorkers((data.users || data.list || []).filter((user) => user.role === "worker"));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ishchilarni olishda xato.");
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

      for (const key of ["q", "worker_id", "payment_type", "date_from", "date_to"]) {
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
        setTotals(data.totals || { total_paid: 0 });
        setPageInfo(data.pageInfo || { total: 0, offset, limit });
      } catch (error) {
        toast.error(error?.response?.data?.message || "To'lovlarni olishda xato.");
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
      toast.error(error?.response?.data?.message || "Oylik summary olishda xato.");
    } finally {
      setSummaryLoading(false);
    }
  }, [buildParams, filters.group_by, filters.worker_id, filters.date_from, filters.date_to]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments(0, pageInfo.limit);
      fetchSummary();
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit]);

  const handleFilterChange = (field) => (event) => {
    setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const fetchSelectedWorkerBalance = useCallback(async (workerId) => {
    if (!workerId) {
      setSelectedWorkerBalance({
        total_earned: 0,
        total_paid: 0,
        remaining: 0,
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
      toast.error(error?.response?.data?.message || "Ishchi balansini olishda xato.");
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

    if (field === "period_from") {
      fetchSelectedWorkerBalance(form.worker_id);
    }

    if (field === "period_to") {
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
    fetchSelectedWorkerBalance(nextForm.worker_id, nextForm.period_from, nextForm.period_to);
  };

  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    const nextForm = {
      worker_id: payment.worker_id || "",
      amount: payment.amount ?? "",
      advance_deduction: payment.advance_deduction ?? "",
      payment_type: payment.payment_type || "salary",
      paid_at: payment.paid_at ? String(payment.paid_at).slice(0, 10) : emptyForm.paid_at,
      period_from: payment.period_from ? String(payment.period_from).slice(0, 10) : "",
      period_to: payment.period_to ? String(payment.period_to).slice(0, 10) : "",
      note: payment.note || "",
    };

    setForm(nextForm);
    setModalOpen(true);
    fetchSelectedWorkerBalance(nextForm.worker_id, nextForm.period_from, nextForm.period_to);
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
      Number(form.advance_deduction || 0) > Number(selectedWorkerBalance.remaining_advance || 0)
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
    amount: Number(form.amount),
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
      toast.error(error?.response?.data?.message || "To'lovni o'chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const openWorkerPayment = (workerId) => {
    setSelectedPayment(null);
    const nextForm = { ...emptyForm, worker_id: workerId };
    setForm(nextForm);
    setModalOpen(true);
    fetchSelectedWorkerBalance(workerId, "", "");
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
    <Box className="crm-page flex h-full min-h-0 flex-col">
      <Box className="mb-5 flex shrink-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Box>
          <Typography variant="h5" fontWeight={800} className="text-slate-950">
            Oyliklar
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            Ishchilarga berilgan oylik, avans va balans nazorati
          </Typography>
        </Box>

        <Box className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Typography variant="body2" className="text-slate-500">
              Ishlab topgan
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {formatMoney(balance.total_earned)}
            </Typography>
          </Box>
          <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Typography variant="body2" className="text-slate-500">
              Berilgan
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {formatMoney(balance.total_paid)}
            </Typography>
          </Box>
          <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Typography variant="body2" className="text-slate-500">
              Qolgan
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {formatMoney(balance.remaining)}
            </Typography>
          </Box>
          <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Typography variant="body2" className="text-slate-500">
              To'lovlar
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {pageInfo.total}
            </Typography>
          </Box>
          <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Typography variant="body2" className="text-slate-500">
              Olinmagan avans
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {formatMoney(balance.remaining_advance)}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Paper elevation={0} className="mb-4 shrink-0 rounded-2xl border border-slate-200 p-4">
        <Box className="flex flex-col gap-1 xl:flex-row xl:items-center xl:justify-between">
          <Box className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
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
              color="warning"
              onClick={() =>
                setFilters({
                  q: "",
                  worker_id: "",
                  payment_type: "",
                  date_from: "",
                  date_to: "",
                  sort_by: "paid_at",
                  sort_order: "desc",
                  group_by: "worker",
                })
              }
            >
              Tozalash
            </Button>
          </Box>

          {canManage && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button sx={{ paddingX: "32px" }} variant="outlined" onClick={openAdvancesHistory}>
                Avanslar
              </Button>
              <Button
                variant="outlined"
                sx={{ width: "150px" }}
                onClick={() => {
                  setAdvanceForm({
                    ...emptyAdvanceForm,
                    worker_id: filters.worker_id || "",
                  });
                  setAdvanceOpen(true);
                }}
              >
                Avans berish
              </Button>
              <Button
                variant="contained"
                onClick={openCreateModal}
                sx={{ borderRadius: 2, minWidth: "180px" }}
              >
                Oylik berish
              </Button>
            </Stack>
          )}
        </Box>
      </Paper>

      <Box className="mb-4 shrink-0 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {summaryLoading ? (
          <Box className="flex min-h-28 items-center justify-center">
            <CircularProgress size={24} />
          </Box>
        ) : workerDues.length ? (
          <Box className="flex w-max gap-3">
            {workerDues.map((item) => (
              <Paper
                key={item.worker_id}
                elevation={0}
                className="flex w-80 shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <Avatar src={getImageUrl(item.user_image)} sx={{ bgcolor: "#7F1D1D" }}>
                  {item.first_name?.[0]?.toUpperCase() || "I"}
                </Avatar>
                <Box className="min-w-0 flex-1">
                  <Typography className="truncate" fontWeight={700}>
                    {item.first_name} {item.last_name}
                  </Typography>
                  <Typography fontWeight={800} className="text-red-700">
                    {formatMoney(item.remaining)}
                  </Typography>
                  <Typography variant="body2" className="text-slate-500">
                    Berilishi kerak
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => openWorkerPayment(item.worker_id)}
                >
                  Berish
                </Button>
              </Paper>
            ))}
          </Box>
        ) : (
          <Box className="flex min-h-24 items-center justify-center">
            <Typography variant="body2" className="text-slate-500">
              Oyligi qolgan ishchilar yo'q.
            </Typography>
          </Box>
        )}
      </Box>

      <Paper
        elevation={0}
        className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white"
      >
        <Box className="min-h-0 flex-1 overflow-auto">
          <Table sx={{ minWidth: 1080 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Ishchi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>To'lov turi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Summa</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>To'lov sanasi</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Davr</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Izoh</TableCell>
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
                  <TableCell colSpan={canManage ? 7 : 6} align="center">
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : payments.length ? (
                payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Box className="flex items-center gap-3">
                        <Avatar sx={{ width: 40, height: 40, bgcolor: "#7F1D1D" }}>
                          {payment.worker_name?.[0]?.toUpperCase() || "I"}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700}>{payment.worker_name}</Typography>
                          <Typography variant="body2" className="text-slate-500">
                            @{payment.worker_username || "worker"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={paymentTypeLabels[payment.payment_type] || payment.payment_type}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={800}>{formatMoney(payment.amount)}</Typography>
                      {Number(payment.advance_deduction || 0) > 0 && (
                        <Typography variant="body2" className="text-slate-500">
                          Avansdan: {formatMoney(payment.advance_deduction)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(payment.paid_at)}</TableCell>
                    <TableCell>
                      {formatDate(payment.period_from)} - {formatDate(payment.period_to)}
                    </TableCell>
                    <TableCell>{payment.note || "-"}</TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openEditModal(payment)}
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
                  <TableCell colSpan={canManage ? 7 : 6} align="center">
                    To'lovlar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <CrmPagination total={pageInfo.total} page={page} limit={pageInfo.limit} onPageChange={(nextPage) => fetchPayments(nextPage * pageInfo.limit, pageInfo.limit)} onLimitChange={(limit) => fetchPayments(0, limit)} />
      </Paper>

      <Dialog open={modalOpen} onClose={closeModals} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {selectedPayment ? "To'lovni tahrirlash" : "Oylik berish"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
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

            <Box className="auth-info-card rounded-2xl border p-4">
              <Box className="mb-3 flex items-center justify-between gap-3">
                <Typography fontWeight={800} className="text-slate-950">
                  Tanlangan ishchi balansi
                </Typography>
                {balanceLoading && <CircularProgress size={18} />}
              </Box>

              <Box className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <Box className="rounded-xl border border-slate-200 bg-white p-3">
                  <Typography variant="body2" className="text-slate-500">
                    Oldingi qoldiq
                  </Typography>
                  <Typography fontWeight={800}>
                    {formatMoney(selectedWorkerBalance.previous_remaining)}
                  </Typography>
                </Box>
                <Box className="rounded-xl border border-slate-200 bg-white p-3">
                  <Typography variant="body2" className="text-slate-500">
                    Yangi ish haqi
                  </Typography>
                  <Typography fontWeight={800}>
                    {formatMoney(selectedWorkerBalance.new_earnings)}
                  </Typography>
                </Box>
                <Box className="rounded-xl border border-slate-200 bg-white p-3">
                  <Typography variant="body2" className="text-slate-500">
                    Berilishi kerak
                  </Typography>
                  <Typography fontWeight={800} className="text-slate-950">
                    {formatMoney(selectedWorkerBalance.remaining)}
                  </Typography>
                </Box>
                <Box className="rounded-xl border border-slate-200 bg-white p-3">
                  <Typography variant="body2" className="text-slate-500">
                    Qolgan avans
                  </Typography>
                  <Typography fontWeight={800}>
                    {formatMoney(selectedWorkerBalance.remaining_advance)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                required
                type="number"
                label="Naqd beriladi"
                value={form.amount}
                onChange={handleFormChange("amount")}
                error={paymentExceedsBalance}
                helperText={
                  paymentExceedsBalance
                    ? `Ogohlantirish: maksimum ${formatMoney(availableWorkerBalance)}`
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
                    ? "Kiritilgan jami summa qolgan ish haqidan oshdi"
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
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
              <TextField
                type="date"
                label="Davr oxirigacha"
                value={form.period_to}
                onChange={handleFormChange("period_to")}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Box>
            {paymentExceedsBalance && (
              <Box className="rounded-xl border border-red-300 bg-red-50 px-4 py-3">
                <Typography fontWeight={800} className="text-red-700">
                  Ogohlantirish: kiritilgan {formatMoney(enteredPaymentTotal)} summa ishchining
                  qolgan {formatMoney(availableWorkerBalance)} haqidan oshib ketdi.
                </Typography>
              </Box>
            )}
            <Box
              className={`grid grid-cols-1 gap-3 rounded-2xl border p-4 sm:grid-cols-3 ${paymentExceedsBalance ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}
            >
              <Box>
                <Typography variant="body2" className="text-slate-500">
                  Oylikdan yopiladi
                </Typography>
                <Typography fontWeight={800}>
                  {formatMoney(Number(form.amount || 0) + Number(form.advance_deduction || 0))}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="text-slate-500">
                  Naqd beriladi
                </Typography>
                <Typography fontWeight={800}>{formatMoney(form.amount)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="text-slate-500">
                  Qoladigan avans
                </Typography>
                <Typography fontWeight={800}>
                  {formatMoney(
                    Math.max(
                      Number(selectedWorkerBalance.remaining_advance || 0) -
                        Number(form.advance_deduction || 0),
                      0,
                    ),
                  )}
                </Typography>
              </Box>
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
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || paymentExceedsBalance}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={advancesOpen} onClose={() => setAdvancesOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>Avanslar tarixi</DialogTitle>
        <DialogContent dividers>
          {advancesLoading ? (
            <Box className="flex min-h-32 items-center justify-center">
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Ishchi</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Avans</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Sana</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Izoh</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {advances.length ? (
                  advances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell>{advance.worker_name}</TableCell>
                      <TableCell>
                        <Typography fontWeight={800}>{formatMoney(advance.amount)}</Typography>
                      </TableCell>
                      <TableCell>{formatDate(advance.given_at)}</TableCell>
                      <TableCell>{advance.note || "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Avans yozuvlari topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdvancesOpen(false)}>Yopish</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={advanceOpen} onClose={closeModals} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Ishchiga avans berish</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
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
            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleSaveAdvance} disabled={advanceSaving}>
            {advanceSaving ? "Saqlanmoqda..." : "Avans berish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={closeModals} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>To'lovni o'chirish</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedPayment?.worker_name} uchun {formatMoney(selectedPayment?.amount)} to'lovni
            o'chirmoqchimisiz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>Bekor qilish</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkerPayments;
