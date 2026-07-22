import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Avatar,
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
  TextField,
  Typography,
} from "@mui/material";

import SharedHeroMetric from "../../Components/UI/HeroMetric";
import SharedPremiumDialog from "../../Components/UI/PremiumDialog";
import BalanceBox from "../../Components/UI/BalanceBox";

import Card from "../../Components/UI/AppCard";
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

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  worker_id: "",
  amount: "",
  advance_deduction: "",
  payment_type: "salary",
  paid_at: today(),
  period_from: "",
  period_to: "",
  note: "",
};

const emptyAdvanceForm = {
  worker_id: "",
  amount: "",
  given_at: today(),
  note: "",
};

const emptyBalance = {
  total_earned: 0,
  total_paid: 0,
  remaining: 0,
  total_advance: 0,
  advance_deducted: 0,
  remaining_advance: 0,
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

  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const date = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const initial = (value) =>
  String(value || "I")
    .trim()
    .slice(0, 1)
    .toUpperCase();

const HeroMetric = (props) => (
  <SharedHeroMetric {...props} valueSx={{ fontSize: 17, color: "#fff !important" }} />
);
const PaymentTypeChip = ({ type }) => {
  const styles = {
    salary: ["#15803d", "rgba(34,197,94,.10)", "rgba(34,197,94,.20)"],

    bonus: ["#1d4ed8", "rgba(37,99,235,.09)", "rgba(37,99,235,.18)"],

    other: ["#b45309", "rgba(245,158,11,.12)", "rgba(245,158,11,.22)"],
  };

  const current = styles[type] || styles.other;

  return (
    <Chip
      size="small"
      label={paymentTypeLabels[type] || type || "-"}
      sx={{
        height: 25,
        color: current[0],
        fontSize: 9.5,
        fontWeight: 900,
        backgroundColor: current[1],
        border: `1px solid ${current[2]}`,
      }}
    />
  );
};


const PremiumDialog = (props) => <SharedPremiumDialog subtitle="Oylik va avans maвЂ™lumotlarini boshqarish" titleClassName="worker-payments-dialog-title" {...props} />;
const WorkerPayments = () => {
  const auth = useAuth();

  const currentUser = auth?.user || getLocalUser();

  const canManage =
    ["super_admin", "admin"].includes(currentUser?.role) &&
    hasPermission(currentUser, "payroll.manage");

  const [payments, setPayments] = useState([]);

  const [workerDues, setWorkerDues] = useState([]);

  const [balance, setBalance] = useState(emptyBalance);

  const [pageInfo, setPageInfo] = useState({
    total: 0,
    offset: 0,
    limit: 10,
  });

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

  const [selectedWorkerBalance, setSelectedWorkerBalance] = useState(emptyBalance);

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
        if (filters[key] !== "") {
          params[key] = filters[key];
        }
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

        setPageInfo(
          data.pageInfo || {
            total: 0,
            offset,
            limit,
          },
        );
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
      const [balanceRes, duesRes, advanceRes] = await Promise.all([
        getWorkerBalance({
          worker_id: filters.worker_id || undefined,

          date_from: filters.date_from || undefined,

          date_to: filters.date_to || undefined,
        }),

        getWorkerDues(),

        getWorkerAdvanceBalance({
          worker_id: filters.worker_id || undefined,
        }),
      ]);

      setWorkerDues(duesRes.data.worker_dues || []);

      setBalance({
        ...emptyBalance,
        ...(balanceRes.data.balance || {}),
        ...(advanceRes.data.balance || {}),
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Oylik summary olishda xato.");
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
    setFilters((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const fetchSelectedWorkerBalance = useCallback(async (workerId) => {
    if (!workerId) {
      setSelectedWorkerBalance(emptyBalance);

      return;
    }

    setBalanceLoading(true);

    try {
      const [balanceRes, advanceRes] = await Promise.all([
        getWorkerBalance({
          worker_id: workerId,
        }),

        getWorkerAdvanceBalance({
          worker_id: workerId,
        }),
      ]);

      setSelectedWorkerBalance({
        ...emptyBalance,

        ...(balanceRes.data.balance || {}),

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

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (field === "worker_id") {
      fetchSelectedWorkerBalance(value);
    }
  };

  const refreshPage = () => {
    fetchPayments(pageInfo.offset, pageInfo.limit);

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
      paid_at: today(),

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

      paid_at: payment.paid_at ? String(payment.paid_at).slice(0, 10) : today(),

      period_from: payment.period_from ? String(payment.period_from).slice(0, 10) : "",

      period_to: payment.period_to ? String(payment.period_to).slice(0, 10) : "",

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

    setForm({
      ...emptyForm,
      paid_at: today(),
    });

    setAdvanceForm({
      ...emptyAdvanceForm,
      given_at: today(),
    });

    setSelectedWorkerBalance(emptyBalance);
  };

  const validateForm = () => {
    if (!form.worker_id) {
      toast.error("Ishchini tanlang.");
      return false;
    }

    if (Number(form.amount || 0) <= 0 && Number(form.advance_deduction || 0) <= 0) {
      toast.error("Naqd summa yoki avans ushlanmasini kiriting.");

      return false;
    }

    if (
      Number(form.advance_deduction || 0) > Number(selectedWorkerBalance.remaining_advance || 0)
    ) {
      toast.error("Avans ushlanmasi qolgan avansdan oshmasin.");

      return false;
    }

    if (paymentExceedsBalance) {
      toast.error(`To'lov qolgan ${money(availableWorkerBalance)} ish haqidan oshmasin.`);

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
      toast.error(error?.response?.data?.message || "To'lovni o'chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const openWorkerPayment = (workerId) => {
    setSelectedPayment(null);

    const nextForm = {
      ...emptyForm,
      paid_at: today(),
      worker_id: workerId,
    };

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
      className="crm-page worker-payments-page"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2.5,
      }}
    >
      <style>{workerPaymentsStyles}</style>

      <Box component="section" className="worker-payments-hero" sx={heroSx}>
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              xl: ".76fr 1.24fr",
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

              <Typography sx={eyebrowSx}>Ish haqi va avans markazi</Typography>
            </Box>

            <Typography component="h1" sx={heroTitleSx}>
              Oyliklar
            </Typography>

            <Typography sx={heroDescriptionSx}>
              Ishchilarning hisoblangan ish haqi, berilgan to‘lovlar, qolgan qarz va avanslarini
              yagona sahifada nazorat qiling.
            </Typography>

            {canManage && (
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1.1}
                sx={{ mt: 2.4 }}
              >
                <Button onClick={openCreateModal} sx={heroPrimaryButtonSx}>
                  + Oylik berish
                </Button>

                <Button
                  onClick={() => {
                    setAdvanceForm({
                      ...emptyAdvanceForm,

                      given_at: today(),

                      worker_id: filters.worker_id || "",
                    });

                    setAdvanceOpen(true);
                  }}
                  sx={heroSecondaryButtonSx}
                >
                  Avans berish
                </Button>
              </Stack>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2,minmax(0,1fr))",

                lg: "repeat(5,minmax(0,1fr))",
              },

              gap: 1.2,
            }}
          >
            <HeroMetric
              label="Ishlab topgan"
              value={money(balance.total_earned)}
              helper="Hisoblangan ish haqi"
              tone="blue"
            />

            <HeroMetric
              label="Berilgan"
              value={money(balance.total_paid)}
              helper="Naqd va yopilgan summa"
              tone="green"
            />

            <HeroMetric
              label="Qolgan"
              value={money(balance.remaining)}
              helper="Berilishi kerak"
              tone="red"
            />

            <HeroMetric
              label="To‘lovlar"
              value={number(pageInfo.total)}
              helper="To‘lov yozuvlari"
              tone="gray"
            />

            <HeroMetric
              label="Qolgan avans"
              value={money(balance.remaining_advance)}
              helper="Keyingi oylikdan ushlanadi"
              tone="amber"
            />
          </Box>
        </Box>
      </Box>

      <Card
        sx={{
          mb: 2,
          p: 2,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",

            alignItems: {
              xs: "stretch",
              xl: "center",
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

                sm: "repeat(2,minmax(0,1fr))",

                lg: "repeat(4,minmax(0,1fr))",

                xl: "repeat(7,minmax(0,1fr))",
              },

              gap: 1.2,
              flex: 1,
            }}
          >
            <TextField
              size="small"
              label="Qidirish"
              placeholder="Ishchi yoki izoh"
              value={filters.q}
              onChange={handleFilterChange("q")}
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
              label="To‘lov turi"
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

              <MenuItem value="payment_type">To‘lov turi</MenuItem>

              <MenuItem value="day">Kun</MenuItem>
            </TextField>

            <Button variant="outlined" onClick={resetFilters} sx={filterButtonSx}>
              Tozalash
            </Button>
          </Box>

          {canManage && (
            <Button variant="outlined" onClick={openAdvancesHistory} sx={filterButtonSx}>
              Avanslar tarixi
            </Button>
          )}
        </Box>
      </Card>

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
              minHeight: 100,
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircularProgress size={25} sx={{ color: "#991b1b" }} />
          </Box>
        ) : workerDues.length ? (
          <>
            <Box
              sx={{
                mb: 1.4,
                display: "flex",

                justifyContent: "space-between",

                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#0f172a",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  Oyligi qolgan ishchilar
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    color: "#94a3b8",
                    fontSize: 10,
                  }}
                >
                  Tezkor to‘lov qilish uchun ishchini tanlang
                </Typography>
              </Box>

              <Chip
                size="small"
                label={`${number(workerDues.length)} ta`}
                sx={{
                  color: "#991b1b",
                  fontSize: 9.5,
                  fontWeight: 900,

                  backgroundColor: "rgba(153,27,27,.07)",
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1.3,
                overflowX: "auto",
                pb: 0.4,
              }}
            >
              {workerDues.map((item) => (
                <Box key={item.worker_id} sx={dueCardSx}>
                  <Avatar
                    src={getImageUrl(item.user_image)}
                    sx={{
                      width: 45,
                      height: 45,
                      color: "#fff",
                      fontWeight: 950,

                      background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",
                    }}
                  >
                    {initial(item.first_name)}
                  </Avatar>

                  <Box
                    sx={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Typography
                      noWrap
                      sx={{
                        color: "#334155",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {item.first_name} {item.last_name}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.3,
                        color: "#991b1b",
                        fontSize: 14,
                        fontWeight: 950,
                      }}
                    >
                      {money(item.remaining)}
                    </Typography>

                    <Typography
                      sx={{
                        color: "#94a3b8",
                        fontSize: 9.5,
                      }}
                    >
                      Berilishi kerak
                    </Typography>
                  </Box>

                  {canManage && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => openWorkerPayment(item.worker_id)}
                      sx={tableActionSx}
                    >
                      Berish
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
          </>
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
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              Oyligi qolgan ishchilar yo‘q.
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
        <Box sx={tableHeaderBoxSx}>
          <Box>
            <Typography
              sx={{
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 950,
              }}
            >
              To‘lovlar tarixi
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "#94a3b8",
                fontSize: 10.5,
              }}
            >
              Oylik, bonus, avans ushlanmasi va davr ma’lumotlari
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${number(pageInfo.total)} ta`}
            sx={{
              height: 25,
              color: "#991b1b",
              fontSize: 9.5,
              fontWeight: 900,

              backgroundColor: "rgba(153,27,27,.07)",
            }}
          />
        </Box>

        <Box
          sx={{
            minHeight: 0,
            flex: 1,
            overflow: "auto",
          }}
        >
          <Table sx={tableSx}>
            <TableHead>
              <TableRow>
                <TableCell>Ishchi</TableCell>

                <TableCell>To‘lov turi</TableCell>

                <TableCell>Summa</TableCell>

                <TableCell>To‘lov sanasi</TableCell>

                <TableCell>Davr</TableCell>

                <TableCell>Izoh</TableCell>

                {canManage && <TableCell align="right">Amallar</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} align="center" sx={{ py: 8 }}>
                    <CircularProgress
                      size={30}
                      sx={{
                        color: "#991b1b",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : payments.length ? (
                payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",

                          alignItems: "center",

                          gap: 1.4,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 47,
                            height: 47,
                            color: "#fff",
                            fontWeight: 950,

                            background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",

                            border: "3px solid #fff",

                            boxShadow: "0 8px 20px rgba(127,29,29,.16)",
                          }}
                        >
                          {initial(payment.worker_name)}
                        </Avatar>

                        <Box
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            sx={{
                              color: "#334155",

                              fontSize: 12.5,

                              fontWeight: 900,
                            }}
                          >
                            {payment.worker_name || "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              color: "#94a3b8",

                              fontSize: 9.5,
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
                          color: "#15803d",

                          fontSize: 11.5,

                          fontWeight: 950,
                        }}
                      >
                        Naqd: {money(payment.amount)}
                      </Typography>

                      {Number(payment.advance_deduction || 0) > 0 && (
                        <Typography
                          sx={{
                            mt: 0.4,
                            color: "#b45309",

                            fontSize: 9.5,

                            fontWeight: 800,
                          }}
                        >
                          Avansdan: {money(payment.advance_deduction)}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>{date(payment.paid_at)}</TableCell>

                    <TableCell>
                      {date(payment.period_from)} — {date(payment.period_to)}
                    </TableCell>

                    <TableCell
                      sx={{
                        maxWidth: 220,
                      }}
                    >
                      {payment.note || "-"}
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.8}
                          sx={{
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openEditModal(payment)}
                            sx={tableActionSx}
                          >
                            Tahrirlash
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => {
                              setSelectedPayment(payment);

                              setDeleteOpen(true);
                            }}
                            sx={tableActionSx}
                          >
                            O‘chirish
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
                      py: 8,
                      color: "#94a3b8",
                      fontWeight: 850,
                    }}
                  >
                    To‘lovlar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid #edf0f3",

            backgroundColor: "#fafbfc",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) =>
              fetchPayments(
                nextPage * pageInfo.limit,

                pageInfo.limit,
              )
            }
            onLimitChange={(limit) => fetchPayments(0, limit)}
          />
        </Box>
      </Card>

      <PremiumDialog
        open={modalOpen}
        onClose={closeModals}
        title={selectedPayment ? "To‘lovni tahrirlash" : "Oylik berish"}
        maxWidth="md"
        actions={
          <>
            <Button onClick={closeModals} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || paymentExceedsBalance}
              sx={dialogPrimarySx}
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

              border: paymentExceedsBalance ? "1px solid rgba(220,38,38,.28)" : "1px solid #e7ebf0",

              background: "linear-gradient(145deg,#fff,#f8fafc)",
            }}
          >
            <Box
              sx={{
                mb: 1.5,
                display: "flex",

                justifyContent: "space-between",

                gap: 1.5,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#334155",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  Tanlangan ishchi balansi
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    color: "#94a3b8",
                    fontSize: 9.5,
                  }}
                >
                  To‘lovdan oldingi hisob holati
                </Typography>
              </Box>

              {balanceLoading && (
                <CircularProgress
                  size={18}
                  sx={{
                    color: "#991b1b",
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",

                  sm: "repeat(2,1fr)",

                  lg: "repeat(4,1fr)",
                },

                gap: 1.2,
              }}
            >
              <BalanceBox
                label="Oldingi qoldiq"
                value={money(selectedWorkerBalance.previous_remaining)}
                tone="blue"
              />

              <BalanceBox
                label="Yangi ish haqi"
                value={money(selectedWorkerBalance.new_earnings)}
                tone="green"
              />

              <BalanceBox
                label="Berilishi kerak"
                value={money(selectedWorkerBalance.remaining)}
                tone="red"
              />

              <BalanceBox
                label="Qolgan avans"
                value={money(selectedWorkerBalance.remaining_advance)}
                tone="amber"
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,1fr)",
              },

              gap: 1.6,
            }}
          >
            <TextField
              type="number"
              label="Naqd beriladi"
              value={form.amount}
              onChange={handleFormChange("amount")}
              error={paymentExceedsBalance}
              helperText={paymentExceedsBalance ? `Maksimum ${money(availableWorkerBalance)}` : " "}
              inputProps={{
                min: 0,
                step: 1000,
              }}
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
                  : `Maksimum: ${money(selectedWorkerBalance.remaining_advance)}`
              }
              inputProps={{
                min: 0,
                step: 1000,
              }}
            />

            <TextField
              select
              label="To‘lov turi"
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
              label="To‘lov sanasi"
              value={form.paid_at}
              onChange={handleFormChange("paid_at")}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
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
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: "15px",
                color: "#b91c1c",

                backgroundColor: "rgba(220,38,38,.07)",

                border: "1px solid rgba(220,38,38,.22)",
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                Kiritilgan {money(enteredPaymentTotal)} summa ishchining qolgan{" "}
                {money(availableWorkerBalance)} haqidan oshib ketdi.
              </Typography>
            </Box>
          )}

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

              border: "1px solid #e7ebf0",

              backgroundColor: "#f8fafc",
            }}
          >
            <BalanceBox label="Oylikdan yopiladi" value={money(enteredPaymentTotal)} tone="blue" />

            <BalanceBox label="Naqd beriladi" value={money(form.amount)} tone="green" />

            <BalanceBox
              label="Qoladigan avans"
              value={money(
                Math.max(
                  Number(selectedWorkerBalance.remaining_advance || 0) -
                    Number(form.advance_deduction || 0),
                  0,
                ),
              )}
              tone="amber"
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
          <Button onClick={() => setAdvancesOpen(false)} sx={dialogCancelSx}>
            Yopish
          </Button>
        }
      >
        {advancesLoading ? (
          <Box
            sx={{
              minHeight: 160,
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircularProgress size={28} sx={{ color: "#991b1b" }} />
          </Box>
        ) : (
          <Box
            sx={{
              overflowX: "auto",
            }}
          >
            <Table size="small" sx={smallTableSx}>
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
                        sx={{
                          fontWeight: 900,

                          color: "#334155",
                        }}
                      >
                        {advance.worker_name}
                      </TableCell>

                      <TableCell
                        sx={{
                          fontWeight: 950,

                          color: "#991b1b",
                        }}
                      >
                        {money(advance.amount)}
                      </TableCell>

                      <TableCell>{date(advance.given_at)}</TableCell>

                      <TableCell>{advance.note || "-"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{
                        py: 6,
                        color: "#94a3b8",
                        fontWeight: 850,
                      }}
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
        actions={
          <>
            <Button onClick={closeModals} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              onClick={handleSaveAdvance}
              disabled={advanceSaving}
              sx={dialogPrimarySx}
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
              label="Avans summasi"
              value={advanceForm.amount}
              onChange={(event) =>
                setAdvanceForm((previous) => ({
                  ...previous,

                  amount: event.target.value,
                }))
              }
              inputProps={{
                min: 0,
                step: 1000,
              }}
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
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
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
        title="To‘lovni o‘chirish"
        subtitle="Bu amal tanlangan to‘lov yozuvini o‘chiradi"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={closeModals} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deleting}
              sx={deleteButtonSx}
            >
              {deleting ? "O‘chirilmoqda..." : "O‘chirish"}
            </Button>
          </>
        }
      >
        <Typography
          sx={{
            color: "#64748b",
            fontSize: 12.5,
            lineHeight: 1.7,
            fontWeight: 700,
          }}
        >
          <strong>{selectedPayment?.worker_name}</strong> uchun {money(selectedPayment?.amount)}{" "}
          to‘lovni o‘chirmoqchimisiz?
        </Typography>
      </PremiumDialog>
    </Box>
  );
};


const eyebrowSx = {
  color: "#fecdd3 !important",
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: ".13em",
  textTransform: "uppercase",
};

const heroTitleSx = {
  mt: 1.5,
  color: "#fff !important",

  fontSize: {
    xs: 29,
    md: 36,
  },

  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-.045em",
};

const heroDescriptionSx = {
  maxWidth: 555,
  mt: 1.4,

  color: "rgba(255,255,255,.45) !important",

  fontSize: 12.5,
  lineHeight: 1.75,
};

const heroSx = {
  position: "relative",
  isolation: "isolate",
  mb: 2,

  p: {
    xs: 2.5,
    md: 3,
  },

  overflow: "hidden",
  color: "#fff",
  borderRadius: "25px",

  border: "1px solid rgba(255,255,255,.075)",

  backgroundColor: "#0d1117 !important",

  backgroundImage:
    "radial-gradient(circle at 100% 0%,rgba(220,38,38,.34),transparent 30%),linear-gradient(145deg,#0d1117,#171117 52%,#3a121a) !important",

  boxShadow: "0 24px 60px rgba(15,23,42,.20)",

  flexShrink: 0,

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
};

const heroPrimaryButtonSx = {
  minHeight: 43,
  px: 2.2,
  color: "#fff !important",
  borderRadius: "13px",
  fontSize: 11.5,
  fontWeight: 900,
  textTransform: "none",

  background: "linear-gradient(135deg,#991b1b,#dc2626)",

  boxShadow: "0 12px 26px rgba(127,29,29,.30)",

  "&:hover": {
    background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
  },
};

const heroSecondaryButtonSx = {
  minHeight: 43,
  px: 2,

  color: "rgba(255,255,255,.72) !important",

  borderRadius: "13px",

  border: "1px solid rgba(255,255,255,.10)",

  backgroundColor: "rgba(255,255,255,.055)",

  fontSize: 11,
  fontWeight: 900,
  textTransform: "none",

  "&:hover": {
    backgroundColor: "rgba(255,255,255,.10)",
  },
};

const filterButtonSx = {
  minHeight: 40,
  px: 1.8,
  color: "#64748b",
  borderRadius: "11px",
  borderColor: "#dce3ea",
  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",
  backgroundColor: "#fff",

  "&:hover": {
    color: "#991b1b",

    borderColor: "rgba(153,27,27,.22)",

    backgroundColor: "rgba(153,27,27,.04)",
  },
};

const dueCardSx = {
  width: 310,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: 1.3,
  p: 1.35,
  borderRadius: "17px",

  border: "1px solid #e7ebf0",

  background: "linear-gradient(145deg,#fff,#f8fafc)",
};

const tableHeaderBoxSx = {
  px: 2.4,
  py: 1.9,
  display: "flex",
  alignItems: "center",

  justifyContent: "space-between",

  gap: 2,

  borderBottom: "1px solid #edf0f3",
};

const tableActionSx = {
  borderRadius: "9px",
  fontSize: 9.5,
  fontWeight: 900,
  textTransform: "none",
};

const dialogCancelSx = {
  color: "#64748b",
  borderRadius: "11px",
  fontWeight: 850,
  textTransform: "none",
};

const dialogPrimarySx = {
  minWidth: 120,
  minHeight: 40,
  px: 2,
  color: "#fff",
  borderRadius: "11px",
  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",

  background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",

  boxShadow: "0 10px 24px rgba(127,29,29,.18)",

  "&:hover": {
    background: "linear-gradient(135deg,#681818,#991b1b)",
  },
};

const deleteButtonSx = {
  borderRadius: "11px",
  fontWeight: 900,
  textTransform: "none",
};



const tableSx = {
  minWidth: 1120,

  "& th": {
    py: 1.55,
    color: "#94a3b8",
    fontSize: 9.5,
    fontWeight: 900,
    letterSpacing: ".045em",
    textTransform: "uppercase",

    backgroundColor: "#fafbfc",

    borderColor: "#edf0f3",
  },

  "& td": {
    py: 1.4,
    color: "#64748b",
    fontSize: 10.5,
    borderColor: "#edf0f3",
  },

  "& tbody tr:hover": {
    backgroundColor: "rgba(153,27,27,.025)",
  },
};

const smallTableSx = {
  minWidth: 720,

  "& th": {
    py: 1.45,
    color: "#94a3b8",
    fontSize: 9.5,
    fontWeight: 900,
    textTransform: "uppercase",

    backgroundColor: "#fafbfc",
  },

  "& td": {
    py: 1.35,
    color: "#64748b",
    fontSize: 10.5,
    borderColor: "#edf0f3",
  },
};

const workerPaymentsStyles = `
  .crm-page .worker-payments-hero {
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

  .worker-payments-dialog-title {
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

export default WorkerPayments;
