import { useCallback, useEffect, useMemo, useState } from "react";
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
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";

import { useAuth } from "../../Context/AuthContext";
import { createExpense, getExpenses, getFinancialAccounts } from "../../api/finance";
import { hasPermission } from "../../utils/permissions";

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

const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

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

const Card = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid #e4e9ef",
      backgroundColor: "#ffffff",
      boxShadow: "0 14px 40px rgba(15,23,42,.045)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const HeroMetric = ({ label, value, helper, tone = "red" }) => {
  const tones = {
    red: ["#fecdd3", "rgba(220,38,38,.15)", "rgba(248,113,113,.15)"],

    green: ["#bbf7d0", "rgba(34,197,94,.14)", "rgba(74,222,128,.15)"],

    blue: ["#bfdbfe", "rgba(37,99,235,.15)", "rgba(96,165,250,.15)"],

    amber: ["#fde68a", "rgba(245,158,11,.15)", "rgba(251,191,36,.15)"],
  };

  const current = tones[tone] || tones.red;

  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: 126,
        p: 1.8,
        borderRadius: "18px",

        border: "1px solid rgba(255,255,255,.075)",

        background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",

        backdropFilter: "blur(16px)",
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          display: "grid",
          placeItems: "center",
          borderRadius: "11px",
          color: current[0],

          backgroundColor: current[1],

          border: `1px solid ${current[2]}`,

          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.35,

          color: "rgba(255,255,255,.44) !important",

          fontSize: 9.5,
          fontWeight: 750,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.6,
          color: "#ffffff !important",
          fontSize: 18,
          lineHeight: 1.2,
          fontWeight: 950,
          letterSpacing: "-.035em",
        }}
      >
        {value}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.55,

          color: "rgba(255,255,255,.28) !important",

          fontSize: 9,
        }}
      >
        {helper}
      </Typography>
    </Box>
  );
};

const BalanceBox = ({ label, value, tone = "default" }) => {
  const tones = {
    default: ["#334155", "#ffffff", "#e7ebf0"],

    green: ["#15803d", "rgba(34,197,94,.07)", "rgba(34,197,94,.17)"],

    red: ["#991b1b", "rgba(153,27,27,.07)", "rgba(153,27,27,.16)"],

    blue: ["#1d4ed8", "rgba(37,99,235,.07)", "rgba(37,99,235,.17)"],

    amber: ["#b45309", "rgba(245,158,11,.09)", "rgba(245,158,11,.19)"],
  };

  const current = tones[tone] || tones.default;

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.5,
        borderRadius: "15px",
        backgroundColor: current[1],
        border: `1px solid ${current[2]}`,
      }}
    >
      <Typography
        sx={{
          color: "#94a3b8",
          fontSize: 9.5,
          fontWeight: 800,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.55,
          color: current[0],
          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

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
    setForm(emptyForm());
    setOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setOpen(false);
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
      await createExpense({
        title: form.title.trim(),

        amount: Number(form.amount),

        spent_at: form.spent_at,

        account_id: form.account_id ? Number(form.account_id) : null,

        note: form.note.trim() || null,
      });

      toast.success("Xarajat saqlandi.");

      setOpen(false);
      setForm(emptyForm());

      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xarajatni saqlab bo'lmadi.");
    } finally {
      setSaving(false);
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
        className="expenses-hero"
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
                fontWeight: 950,
                letterSpacing: "-.045em",
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
                  fontWeight: 900,
                  textTransform: "none",

                  background: "linear-gradient(135deg,#991b1b,#dc2626)",

                  boxShadow: "0 12px 26px rgba(127,29,29,.30)",

                  "&:hover": {
                    background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
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

              borderBottom: "1px solid #edf0f3",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#0f172a",
                  fontSize: 15,
                  fontWeight: 950,
                }}
              >
                Xarajatlar ro‘yxati
              </Typography>

              <Typography
                sx={{
                  mt: 0.45,
                  color: "#94a3b8",
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
                color: "#991b1b",
                fontSize: 9.5,
                fontWeight: 900,

                backgroundColor: "rgba(153,27,27,.07)",
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
                  color: "#991b1b",
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
                    color: "#991b1b",

                    backgroundColor: "rgba(153,27,27,.07)",

                    border: "1px solid rgba(153,27,27,.12)",

                    fontSize: 20,
                    fontWeight: 950,
                  }}
                >
                  0
                </Box>

                <Typography
                  sx={{
                    mt: 1.6,
                    color: "#334155",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  Tanlangan davrda xarajat yo‘q
                </Typography>

                <Typography
                  sx={{
                    mt: 0.6,
                    color: "#94a3b8",
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
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Xarajat</TableCell>

                    <TableCell>Moliyaviy hisob</TableCell>

                    <TableCell>Kim kiritdi</TableCell>

                    <TableCell>Sana</TableCell>

                    <TableCell align="right">Summa</TableCell>
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

                              background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",

                              boxShadow: "0 8px 20px rgba(127,29,29,.16)",

                              fontSize: 12,
                              fontWeight: 950,
                            }}
                          >
                            {initial(item.title)}
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                color: "#334155",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              {item.title || "-"}
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.35,
                                maxWidth: 280,
                                color: "#94a3b8",
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

                            color: item.account_name ? "#1d4ed8" : "#64748b",

                            fontSize: 9.5,
                            fontWeight: 900,

                            backgroundColor: item.account_name ? "rgba(37,99,235,.08)" : "#f1f5f9",

                            border: item.account_name
                              ? "1px solid rgba(37,99,235,.15)"
                              : "1px solid #e2e8f0",
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
                              fontWeight: 950,

                              background: "linear-gradient(135deg,#475569,#0f172a)",
                            }}
                          >
                            {initial(item.created_by_name)}
                          </Avatar>

                          <Typography
                            sx={{
                              color: "#475569",
                              fontSize: 10,
                              fontWeight: 850,
                            }}
                          >
                            {item.created_by_name || "-"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            color: "#475569",
                            fontSize: 10.5,
                            fontWeight: 850,
                          }}
                        >
                          {displayDate(item.spent_at)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          noWrap
                          sx={{
                            color: "#b91c1c",
                            fontSize: 12,
                            fontWeight: 950,
                          }}
                        >
                          - {money(item.amount)}
                        </Typography>
                      </TableCell>
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
                color: "#94a3b8",
                fontSize: 9.5,
                fontWeight: 850,
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}
            >
              Tanlangan davr
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: "#b91c1c",
                fontSize: 25,
                fontWeight: 950,
                letterSpacing: "-.045em",
              }}
            >
              {money(total)}
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: "#94a3b8",
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

                borderTop: "1px solid #edf0f3",
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
                color: "#334155",
                fontSize: 13,
                fontWeight: 950,
              }}
            >
              Moliyaviy hisoblar
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "#94a3b8",
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

                      border: "1px solid #e7ebf0",

                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <Typography
                      noWrap
                      sx={{
                        minWidth: 0,
                        color: "#475569",
                        fontSize: 10,
                        fontWeight: 850,
                      }}
                    >
                      {account.name}
                    </Typography>

                    <Typography
                      noWrap
                      sx={{
                        color: Number(account.balance || 0) > 0 ? "#15803d" : "#b91c1c",

                        fontSize: 10,
                        fontWeight: 950,
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

                    border: "1px dashed #cbd5e1",

                    backgroundColor: "#f8fafc",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#94a3b8",
                      fontSize: 10,
                      fontWeight: 800,
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

            border: "1px solid rgba(148,163,184,.20)",

            boxShadow: "0 30px 80px rgba(15,23,42,.22)",
          },
        }}
      >
        <DialogTitle
          className="expenses-dialog-title"
          sx={{
            px: 3,
            py: 2.35,

            color: "#ffffff !important",

            backgroundColor: "#0d1117 !important",

            backgroundImage:
              "radial-gradient(circle at 100% 0%,rgba(220,38,38,.28),transparent 36%),linear-gradient(135deg,#11151c,#321319) !important",
          }}
        >
          <Typography
            sx={{
              color: "#ffffff !important",

              fontSize: 19,
              fontWeight: 950,
            }}
          >
            Yangi mayda xarajat
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
              <TextField
                label="Xarajat summasi"
                type="number"
                value={form.amount}
                onChange={field("amount")}
                required
                inputProps={{
                  min: 1,
                  step: 1000,
                }}
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
                    ? "1px solid rgba(220,38,38,.25)"
                    : "1px solid #e7ebf0",

                  backgroundColor: insufficientBalance ? "rgba(220,38,38,.045)" : "#f8fafc",
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
                  color: "#b45309",

                  backgroundColor: "rgba(245,158,11,.09)",

                  border: "1px solid rgba(245,158,11,.20)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 900,
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

            borderTop: "1px solid #edf0f3",

            backgroundColor: "#fafbfc",
          }}
        >
          <Button
            onClick={closeModal}
            disabled={saving}
            sx={{
              color: "#64748b",
              borderRadius: "11px",
              fontWeight: 850,
              textTransform: "none",
            }}
          >
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            sx={{
              minWidth: 120,
              minHeight: 40,
              px: 2,
              color: "#ffffff",
              borderRadius: "11px",
              fontSize: 10.5,
              fontWeight: 900,
              textTransform: "none",

              background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",

              boxShadow: "0 10px 24px rgba(127,29,29,.18)",

              "&:hover": {
                background: "linear-gradient(135deg,#681818,#991b1b)",
              },
            }}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
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
  backgroundColor: "#ffffff",

  "&:hover": {
    color: "#991b1b",

    borderColor: "rgba(153,27,27,.22)",

    backgroundColor: "rgba(153,27,27,.04)",
  },
};

const expensesPageStyles = `
  .crm-page .expenses-hero {
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

  .expenses-dialog-title {
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

export default Expenses;
