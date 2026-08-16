import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  CompatDialog as Dialog,
  CompatTextField as TextField,
} from "../../Components/UI/MuiCompat";

import SharedHeroMetric from "../../Components/UI/HeroMetric";
import MoneyTextField from "../../Components/UI/MoneyTextField";
import BalanceBox from "../../Components/UI/BalanceBox";
import { toast } from "react-toastify";

import Card from "../../Components/UI/AppCard";
import { useAuth } from "../../Context/AuthContext";
import { ENABLE_MULTI_ACCOUNT_SELECTION } from "../../utils/features";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  getFinancialAccounts,
  updateExpense,
} from "../../api/finance";
import { hasPermission } from "../../utils/permissions";
import { money } from "../../utils/format";
import { formatNumber as number } from "../../utils/format";

const isoDate = (value = new Date()) => value.toISOString().slice(0, 10);

const monthStart = () => {
  const value = new Date();
  value.setDate(1);

  return isoDate(value);
};

const emptyForm = () => ({
  title: "",
  amount: "",
  spent_at: isoDate(),
  account_id: "",
  note: "",
});

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const displayDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const initial = (value) =>
  String(value || "X")
    .trim()
    .slice(0, 1)
    .toUpperCase();

const HeroMetric = (props) => <SharedHeroMetric {...props} />;

const Expenses = () => {
  const auth = useAuth();

  const currentUser = auth?.user || getLocalUser();

  const canManage = hasPermission(currentUser, "finance.manage");

  const [filters, setFilters] = useState({
    date_from: monthStart(),
    date_to: isoDate(),
  });

  const [rows, setRows] = useState([]);

  const [accounts, setAccounts] = useState([]);

  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [open, setOpen] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [expensesResponse, accountsResponse] = await Promise.all([
        getExpenses({
          ...filters,
          limit: 100,
          offset: 0,
        }),

        getFinancialAccounts(),
      ]);

      const expensesData = expensesResponse.data || {};

      const accountsData = accountsResponse.data || {};

      setRows(expensesData.expenses || []);

      setTotal(expensesData.total_amount || 0);

      setAccounts(accountsData.financial_accounts || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xarajatlarni yuklab bo'lmadi.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedAccount = useMemo(
    () => accounts.find((item) => String(item.id) === String(form.account_id)),

    [accounts, form.account_id],
  );

  const averageExpense = rows.length > 0 ? Number(total || 0) / rows.length : 0;

  const totalAccountsBalance = useMemo(
    () =>
      accounts.reduce(
        (sum, account) => sum + Number(account.balance || 0),

        0,
      ),

    [accounts],
  );

  const highestExpense = useMemo(
    () =>
      rows.reduce(
        (maximum, item) => Math.max(maximum, Number(item.amount || 0)),

        0,
      ),

    [rows],
  );

  const insufficientBalance =
    Boolean(selectedAccount) && Number(selectedAccount.balance || 0) < Number(form.amount || 0);

  const remainingAccountBalance = selectedAccount
    ? Number(selectedAccount.balance || 0) - Number(form.amount || 0)
    : 0;

  const field = (name) => (event) => {
    setForm((previous) => ({
      ...previous,
      [name]: event.target.value,
    }));
  };

  const openCreateModal = () => {
    setSelectedExpense(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEditModal = (expense) => {
    setSelectedExpense(expense);
    setForm({
      title: expense.title || "",
      amount: expense.amount ?? "",
      spent_at: expense.spent_at ? String(expense.spent_at).slice(0, 10) : isoDate(),
      account_id: expense.account_id || "",
      note: expense.note || "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setOpen(false);
    setSelectedExpense(null);
    setForm(emptyForm());
  };

  const resetFilters = () => {
    setFilters({
      date_from: monthStart(),
      date_to: isoDate(),
    });
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Xarajat izohini kiriting.");

      return;
    }

    if (!Number(form.amount) || Number(form.amount) <= 0) {
      toast.error("Xarajat summasini to'g'ri kiriting.");

      return;
    }

    if (!form.spent_at) {
      toast.error("Xarajat sanasini kiriting.");

      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),

        amount: Number(form.amount),

        spent_at: form.spent_at,

        account_id: form.account_id ? Number(form.account_id) : null,

        note: form.note.trim() || null,
      };

      if (selectedExpense) {
        await updateExpense(selectedExpense.id, payload);
      } else {
        await createExpense(payload);
      }

      toast.success(selectedExpense ? "Xarajat yangilandi." : "Xarajat saqlandi.");

      setOpen(false);
      setSelectedExpense(null);
      setForm(emptyForm());

      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xarajatni saqlab bo'lmadi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selectedExpense) return;
    setDeleting(true);
    try {
      await deleteExpense(selectedExpense.id);
      toast.success("Xarajat o'chirildi, hisob balansi tiklandi.");
      setDeleteOpen(false);
      setSelectedExpense(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xarajatni o'chirib bo'lmadi.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box
      className="crm-page expenses-page"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2.5,
      }}
    >
      <style>{expensesPageStyles}</style>

      <Box
        component="section"
        className="crm-page-hero expenses-hero"
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

          backgroundColor: "#151211 !important",

          backgroundImage:
            "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.34),transparent 30%),linear-gradient(145deg,#151211,#1e1a18 52%,#3a1219) !important",

          boxShadow: "0 24px 60px rgba(23, 17, 15,.20)",

          flexShrink: 0,

          "&::before": {
            content: '""',
            position: "absolute",
            width: 390,
            height: 390,
            top: -275,
            right: -210,
            borderRadius: "50%",

            border: "1px solid rgba(201, 168, 117,.16)",

            boxShadow:
              "0 0 81px 22px rgba(201, 168, 117,.022),0 0 161px 43px rgba(201, 168, 117,.014)",

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
                Kundalik moliya nazorati
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
                fontFamily: "var(--aa-display)",
                fontWeight: 400,
                letterSpacing: "-.024em",
              }}
            >
              Mayda xarajatlar
            </Typography>

            <Typography
              sx={{
                maxWidth: 555,
                mt: 1.4,

                color: "rgba(255,255,255,.45) !important",

                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Lampochka, rozetka, yo‘l haqi, ofis buyumlari va boshqa kundalik xarajatlarni
              moliyaviy hisoblar bilan nazorat qiling.
            </Typography>

            {canManage && (
              <Button
                onClick={openCreateModal}
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

                  "&:hover": {
                    background: "linear-gradient(135deg,#4d0f18,#7a1826)",
                  },
                }}
              >
                + Xarajat kiritish
              </Button>
            )}
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
              label="Jami xarajat"
              value={money(total)}
              helper="Tanlangan davr bo‘yicha"
              tone="red"
            />

            <HeroMetric
              label="Xarajatlar soni"
              value={`${number(rows.length)} ta`}
              helper="Kiritilgan xarajat yozuvlari"
              tone="blue"
            />

            <HeroMetric
              label="O‘rtacha xarajat"
              value={money(averageExpense)}
              helper="Har bir yozuv uchun"
              tone="amber"
            />

            <HeroMetric
              label="Hisoblar balansi"
              value={money(totalAccountsBalance)}
              helper={`${number(accounts.length)} ta moliyaviy hisob`}
              tone="green"
            />
          </Box>
        </Box>
      </Box>

      <Card
        className="crm-sticky-filters"
        sx={{
          mb: 2,
          p: 2,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,minmax(0,1fr))",

              lg: "repeat(2,minmax(180px,1fr)) auto auto",
            },

            gap: 1.3,
            alignItems: "center",
          }}
        >
          <TextField
            label="Boshlanish sanasi"
            type="date"
            size="small"
            value={filters.date_from}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,

                date_from: event.target.value,
              }))
            }
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <TextField
            label="Tugash sanasi"
            type="date"
            size="small"
            value={filters.date_to}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,

                date_to: event.target.value,
              }))
            }
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <Button variant="outlined" onClick={load} sx={filterButtonSx}>
            Yangilash
          </Button>

          <Button variant="outlined" onClick={resetFilters} sx={filterButtonSx}>
            Joriy oy
          </Button>
        </Box>
      </Card>

      <Box
        sx={{
          minHeight: 0,
          flex: 1,
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            xl: "minmax(0,1fr) 285px",
          },

          gap: 2,
          alignItems: "start",
        }}
      >
        <Card
          sx={{
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              px: 2.4,
              py: 1.9,
              display: "flex",
              alignItems: "center",

              justifyContent: "space-between",

              gap: 2,

              borderBottom: "1px solid #e8e1d8",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "var(--aa-text)",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                Xarajatlar ro‘yxati
              </Typography>

              <Typography
                sx={{
                  mt: 0.45,
                  color: "var(--aa-text-tertiary)",
                  fontSize: 10.5,
                }}
              >
                Xarajat nomi, hisob, mas’ul xodim va summa
              </Typography>
            </Box>

            <Chip
              size="small"
              label={`${number(rows.length)} ta`}
              sx={{
                height: 25,
                color: "#6e1622",
                fontSize: 9.5,
                fontWeight: 700,

                backgroundColor: "rgba(110, 22, 34,.07)",
              }}
            />
          </Box>

          {loading ? (
            <Box
              sx={{
                minHeight: 310,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CircularProgress
                size={30}
                sx={{
                  color: "#6e1622",
                }}
              />
            </Box>
          ) : rows.length === 0 ? (
            <Box
              sx={{
                minHeight: 310,
                p: 3,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Box>
                <Box
                  sx={{
                    width: 58,
                    height: 58,
                    mx: "auto",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "18px",
                    color: "#6e1622",

                    backgroundColor: "rgba(110, 22, 34,.07)",

                    border: "1px solid rgba(110, 22, 34,.12)",

                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  0
                </Box>

                <Typography
                  sx={{
                    mt: 1.6,
                    color: "var(--aa-text)",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Tanlangan davrda xarajat yo‘q
                </Typography>

                <Typography
                  sx={{
                    mt: 0.6,
                    color: "var(--aa-text-tertiary)",
                    fontSize: 11,
                    lineHeight: 1.6,
                  }}
                >
                  Yangi xarajat kiritilganda shu yerda ko‘rinadi.
                </Typography>
              </Box>
            </Box>
          ) : (
            <TableContainer
              className="aa-mobile-records aa-expenses-table"
              sx={{
                minHeight: 0,
                flex: 1,
              }}
            >
              <Table
                sx={{
                  minWidth: 840,

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

                  "& tbody tr:hover": {
                    backgroundColor: "rgba(110, 22, 34,.025)",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Xarajat</TableCell>

                    <TableCell>Moliyaviy hisob</TableCell>

                    <TableCell>Kim kiritdi</TableCell>

                    <TableCell>Sana</TableCell>

                    <TableCell align="right">Summa</TableCell>

                    {canManage && <TableCell align="right">Amallar</TableCell>}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.3,
                          }}
                        >
                          <Box
                            sx={{
                              width: 43,
                              height: 43,

                              display: "grid",
                              placeItems: "center",

                              flexShrink: 0,

                              color: "#ffffff",

                              borderRadius: "14px",

                              background: "linear-gradient(135deg,#4d0f18,#8c1d2b)",

                              boxShadow: "0 8px 20px rgba(77, 15, 24,.16)",

                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {initial(item.title)}
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                color: "var(--aa-text)",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {item.title || "-"}
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.35,
                                maxWidth: 280,
                                color: "var(--aa-text-tertiary)",
                                fontSize: 9.5,
                                lineHeight: 1.5,
                              }}
                            >
                              {item.note || "Qo‘shimcha izoh yo‘q"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={item.account_name || "Hisobsiz"}
                          sx={{
                            height: 25,

                            color: item.account_name ? "#1f6f8b" : "#7d716a",

                            fontSize: 9.5,
                            fontWeight: 700,

                            backgroundColor: item.account_name
                              ? "rgba(31, 111, 139,.08)"
                              : "#f4f0ea",

                            border: item.account_name
                              ? "1px solid rgba(31, 111, 139,.15)"
                              : "1px solid #e8e1d8",
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,

                              color: "#ffffff",

                              fontSize: 10,
                              fontWeight: 700,

                              background: "linear-gradient(135deg,#5c514b,#17110f)",
                            }}
                          >
                            {initial(item.created_by_name)}
                          </Avatar>

                          <Typography
                            sx={{
                              color: "var(--aa-text-secondary)",
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {item.created_by_name || "-"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            color: "var(--aa-text-secondary)",
                            fontSize: 10.5,
                            fontWeight: 600,
                          }}
                        >
                          {displayDate(item.spent_at)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          noWrap
                          sx={{
                            color: "#7a1826",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          - {money(item.amount)}
                        </Typography>
                      </TableCell>

                      {canManage && (
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.7} sx={{ justifyContent: "flex-end" }}>
                            <Button size="small" onClick={() => openEditModal(item)}>
                              Tahrirlash
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedExpense(item);
                                setDeleteOpen(true);
                              }}
                            >
                              O'chirish
                            </Button>
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        <Stack spacing={2}>
          <Card sx={{ p: 2.3 }}>
            <Typography
              sx={{
                color: "var(--aa-text-tertiary)",
                fontSize: 9.5,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}
            >
              Tanlangan davr
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: "#7a1826",
                fontSize: 25,
                fontWeight: 700,
                letterSpacing: "-.045em",
              }}
            >
              {money(total)}
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: "var(--aa-text-tertiary)",
                fontSize: 10.5,
                lineHeight: 1.6,
              }}
            >
              {displayDate(filters.date_from)} — {displayDate(filters.date_to)}
            </Typography>

            <Box
              sx={{
                mt: 2,
                pt: 1.7,
                display: "grid",
                gap: 1.2,

                borderTop: "1px solid #e8e1d8",
              }}
            >
              <BalanceBox label="Yozuvlar soni" value={`${number(rows.length)} ta`} tone="blue" />

              <BalanceBox label="O‘rtacha xarajat" value={money(averageExpense)} tone="amber" />

              <BalanceBox label="Eng katta xarajat" value={money(highestExpense)} tone="red" />
            </Box>
          </Card>

          <Card sx={{ p: 2.3 }}>
            <Typography
              sx={{
                color: "var(--aa-text)",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Moliyaviy hisoblar
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "var(--aa-text-tertiary)",
                fontSize: 9.5,
                lineHeight: 1.5,
              }}
            >
              Xarajat olinishi mumkin bo‘lgan hisoblar balansi
            </Typography>

            <Stack spacing={1.1} sx={{ mt: 1.7 }}>
              {accounts.length ? (
                accounts.slice(0, 5).map((account) => (
                  <Box
                    key={account.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",

                      justifyContent: "space-between",

                      gap: 1.5,
                      p: 1.2,
                      borderRadius: "14px",

                      border: "1px solid #e8e1d8",

                      backgroundColor: "var(--aa-surface-muted)",
                    }}
                  >
                    <Typography
                      noWrap
                      sx={{
                        minWidth: 0,
                        color: "var(--aa-text-secondary)",
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {account.name}
                    </Typography>

                    <Typography
                      noWrap
                      sx={{
                        color: Number(account.balance || 0) > 0 ? "#2f6b45" : "#7a1826",

                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {money(account.balance)}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Box
                  sx={{
                    p: 1.6,
                    textAlign: "center",
                    borderRadius: "14px",

                    border: "1px dashed #d8cec1",

                    backgroundColor: "var(--aa-surface-muted)",
                  }}
                >
                  <Typography
                    sx={{
                      color: "var(--aa-text-tertiary)",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    Moliyaviy hisoblar topilmadi.
                  </Typography>
                </Box>
              )}
            </Stack>
          </Card>
        </Stack>
      </Box>

      <Dialog
        open={open}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            overflow: "hidden",
            borderRadius: "23px",

            border: "1px solid rgba(138, 128, 122,.20)",

            boxShadow: "0 30px 80px rgba(23, 17, 15,.22)",
          },
        }}
      >
        <DialogTitle
          className="expenses-dialog-title"
          sx={{
            px: 3,
            py: 2.35,

            color: "#ffffff !important",

            backgroundColor: "#151211 !important",

            backgroundImage:
              "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.28),transparent 36%),linear-gradient(135deg,#151211,#2a1117) !important",
          }}
        >
          <Typography
            sx={{
              color: "#ffffff !important",

              fontSize: 19,
              fontWeight: 700,
            }}
          >
            {selectedExpense ? "Xarajatni tahrirlash" : "Yangi mayda xarajat"}
          </Typography>

          <Typography
            sx={{
              mt: 0.5,

              color: "rgba(255,255,255,.43) !important",

              fontSize: 10.5,
            }}
          >
            Xarajat, summa, sana va moliyaviy hisobni kiriting
          </Typography>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            py: "24px !important",
          }}
        >
          <Stack spacing={2}>
            <TextField
              label="Xarajat nomi"
              placeholder="Masalan: 2 ta lampochka olindi"
              value={form.title}
              onChange={field("title")}
              required
              autoFocus
            />

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
              <MoneyTextField
                label="Xarajat summasi"
                value={form.amount}
                onChange={field("amount")}
                required
              />

              <TextField
                label="Sana"
                type="date"
                value={form.spent_at}
                onChange={field("spent_at")}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Box>

            {ENABLE_MULTI_ACCOUNT_SELECTION && (
              <TextField
                select
                label="Qaysi hisobdan to‘landi?"
                value={form.account_id}
                onChange={field("account_id")}
                helperText="Hisob tanlanmasa xarajat faqat yozuv sifatida saqlanadi"
              >
                <MenuItem value="">Hisobsiz yozish</MenuItem>

                {accounts.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} — {money(item.balance)}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {selectedAccount && (
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

                  border: insufficientBalance
                    ? "1px solid rgba(140, 29, 43,.25)"
                    : "1px solid #e8e1d8",

                  backgroundColor: insufficientBalance ? "rgba(140, 29, 43,.045)" : "#faf8f5",
                }}
              >
                <BalanceBox
                  label="Hisob balansi"
                  value={money(selectedAccount.balance)}
                  tone="blue"
                />

                <BalanceBox label="Xarajat" value={money(form.amount)} tone="red" />

                <BalanceBox
                  label="Qoladigan balans"
                  value={money(remainingAccountBalance)}
                  tone={remainingAccountBalance < 0 ? "red" : "green"}
                />
              </Box>
            )}

            {insufficientBalance && (
              <Box
                sx={{
                  px: 1.7,
                  py: 1.4,
                  borderRadius: "14px",
                  color: "#a06a12",

                  backgroundColor: "rgba(160, 106, 18,.09)",

                  border: "1px solid rgba(160, 106, 18,.20)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    lineHeight: 1.6,
                  }}
                >
                  Tanlangan hisobdagi balans xarajat summasidan kam. Hisobda{" "}
                  {money(selectedAccount.balance)} mavjud.
                </Typography>
              </Box>
            )}

            <TextField
              label="Qo‘shimcha izoh"
              value={form.note}
              onChange={field("note")}
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.1,

            borderTop: "1px solid #e8e1d8",

            backgroundColor: "var(--aa-surface-muted)",
          }}
        >
          <Button
            onClick={closeModal}
            disabled={saving}
            sx={{
              color: "var(--aa-text-secondary)",
              borderRadius: "11px",
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            onClick={save}
            disabled={saving || !form.title.trim() || Number(form.amount || 0) <= 0}
            sx={{
              minWidth: 120,
              minHeight: 40,
              px: 2,
              color: "#ffffff",
              borderRadius: "11px",
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: "none",

              background: "linear-gradient(135deg,#4d0f18,#7a1826)",

              boxShadow: "0 10px 24px rgba(77, 15, 24,.18)",

              "&:hover": {
                background: "linear-gradient(135deg,#4d0f18,#6e1622)",
              },
            }}
          >
            {saving ? "Saqlanmoqda..." : selectedExpense ? "Yangilash" : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={deleting ? undefined : () => setDeleteOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Xarajatni o'chirish</DialogTitle>
        <DialogContent>
          <Typography sx={{ pt: 1 }}>
            <strong>{selectedExpense?.title || "Tanlangan xarajat"}</strong> o'chirilsinmi? Hisobdan
            ayrilgan summa avtomatik tiklanadi.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setDeleteOpen(false)}>
            Bekor qilish
          </Button>
          <Button disabled={deleting} color="error" variant="contained" onClick={remove}>
            {deleting ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const filterButtonSx = {
  minHeight: 40,
  px: 1.8,
  color: "var(--aa-text-secondary)",
  borderRadius: "11px",
  borderColor: "#d8cec1",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",
  backgroundColor: "var(--aa-surface-solid)",

  "&:hover": {
    color: "#6e1622",

    borderColor: "rgba(110, 22, 34,.22)",

    backgroundColor: "rgba(110, 22, 34,.04)",
  },
};

const expensesPageStyles = `
  .crm-page .expenses-hero {
    color: #ffffff !important;
    background-color: #151211 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(140, 29, 43,.34),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #151211,
        #1e1a18 52%,
        #3a1219
      ) !important;
  }

  .expenses-dialog-title {
    color: #ffffff !important;
    background-color: #151211 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(140, 29, 43,.28),
        transparent 36%
      ),
      linear-gradient(
        135deg,
        #151211,
        #2a1117
      ) !important;
  }
`;

export default Expenses;
