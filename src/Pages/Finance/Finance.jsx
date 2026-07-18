import { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
import { toast } from "react-toastify";

import { useAuth } from "../../Context/AuthContext";
import { getClientSales } from "../../api/clientSales";
import { hasPermission } from "../../utils/permissions";
import {
  closePayrollPeriod,
  createCashTransaction,
  createClientReturn,
  createExpense,
  createExpenseCategory,
  createFinancialAccount,
  createPayrollPeriod,
  getCashTransactions,
  getClientReturns,
  getExpenseCategories,
  getExpenses,
  getFinancialAccounts,
  getPayrollPeriod,
  getPayrollPeriods,
  getProfitLoss,
  updatePayrollLine,
} from "../../api/finance";

const today = () => new Date().toISOString().slice(0, 10);

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

const tabItems = [
  ["payroll", "Haftalik ish haqi"],
  ["expenses", "Xarajatlar"],
  ["accounts", "Kassa va bank"],
  ["returns", "Qaytarishlar"],
  ["profit", "Foyda-zarar"],
];

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
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

const StatusChip = ({ status }) => {
  const closed = status === "closed";

  return (
    <Chip
      size="small"
      label={closed ? "Yopilgan" : "Ochiq"}
      sx={{
        height: 26,
        px: 0.35,
        fontSize: 12,
        fontWeight: 900,
        color: closed ? "var(--aa-text-secondary)" : "var(--aa-success)",
        background: closed
          ? "var(--aa-surface-muted)"
          : "color-mix(in srgb, var(--aa-success) 10%, transparent)",
        border: closed
          ? "1px solid var(--aa-border)"
          : "1px solid color-mix(in srgb, var(--aa-success) 22%, transparent)",
      }}
    />
  );
};

const TypeChip = ({ type }) => {
  const income = type === "income";

  return (
    <Chip
      size="small"
      label={income ? "Kirim" : "Chiqim"}
      sx={{
        height: 26,
        px: 0.35,
        fontSize: 12,
        fontWeight: 900,
        color: income ? "var(--aa-success)" : "var(--aa-danger)",
        background: income
          ? "color-mix(in srgb, var(--aa-success) 10%, transparent)"
          : "color-mix(in srgb, var(--aa-danger) 8%, transparent)",
        border: income
          ? "1px solid color-mix(in srgb, var(--aa-success) 22%, transparent)"
          : "1px solid color-mix(in srgb, var(--aa-danger) 18%, transparent)",
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

const Grid = ({ heads, rows, onRow }) => (
  <Card sx={{ boxShadow: "none" }}>
    <Box sx={{ overflowX: "auto" }}>
      <Table
        size="small"
        sx={{
          minWidth: 820,
          "& th": {
            py: 1.6,
            fontSize: 12,
            fontWeight: 950,
            color: "var(--aa-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            background: "var(--aa-surface-muted)",
            borderBottom: "1px solid var(--aa-border)",
          },
          "& td": {
            py: 1.5,
            borderBottom: "1px solid var(--aa-border)",
            fontWeight: 700,
            color: "var(--aa-text-secondary)",
          },
          "& tbody tr:hover": {
            background: onRow ? "var(--aa-surface-hover)" : "inherit",
          },
        }}
      >
        <TableHead>
          <TableRow>
            {heads.map((head) => (
              <TableCell key={head}>{head}</TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length ? (
            rows.map((row, index) => (
              <TableRow
                hover
                key={index}
                onClick={() => onRow?.(row._id)}
                sx={{ cursor: onRow ? "pointer" : "default" }}
              >
                {row.cells.map((value, cellIndex) => (
                  <TableCell key={cellIndex}>{value}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={heads.length}
                align="center"
                sx={{ py: 6, fontWeight: 850 }}
              >
                Ma'lumot topilmadi
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  </Card>
);

const StatCard = ({ label, value, danger }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: "var(--aa-radius-lg)",
      background: danger
        ? "color-mix(in srgb, var(--aa-danger) 7%, transparent)"
        : "var(--aa-surface-solid)",
      border: danger
        ? "1px solid color-mix(in srgb, var(--aa-danger) 22%, transparent)"
        : "1px solid var(--aa-border)",
      boxShadow: "var(--aa-shadow-xs)",
    }}
  >
    <Typography
      sx={{ fontSize: 12, fontWeight: 850, color: "var(--aa-text-secondary)" }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        mt: 0.45,
        fontSize: 18,
        fontWeight: 950,
        color: danger ? "var(--aa-danger)" : "var(--aa-text)",
        letterSpacing: "-0.04em",
      }}
    >
      {value}
    </Typography>
  </Box>
);

const Finance = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const canManage =
    ["super_admin", "admin"].includes(currentUser?.role) &&
    hasPermission(currentUser, "finance.manage");

  const [tab, setTab] = useState("payroll");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    periods: [],
    categories: [],
    expenses: [],
    accounts: [],
    transactions: [],
    returns: [],
    sales: [],
    report: {},
  });
  const [detail, setDetail] = useState(null);
  const [dialog, setDialog] = useState("");
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    date_from: `${today().slice(0, 7)}-01`,
    date_to: today(),
    limit: 100,
    offset: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      if (tab === "payroll") {
        const response = await getPayrollPeriods({ limit: 100, offset: 0 });
        setData((previous) => ({
          ...previous,
          periods: response.data.payroll_periods || [],
        }));
      }

      if (tab === "expenses") {
        const [categoriesRes, expensesRes, accountsRes] = await Promise.all([
          getExpenseCategories(),
          getExpenses(filters),
          getFinancialAccounts(),
        ]);

        setData((previous) => ({
          ...previous,
          categories: categoriesRes.data.expense_categories || [],
          expenses: expensesRes.data.expenses || [],
          expenseTotal: expensesRes.data.total_amount || 0,
          accounts: accountsRes.data.financial_accounts || [],
        }));
      }

      if (tab === "accounts") {
        const [accountsRes, transactionsRes] = await Promise.all([
          getFinancialAccounts(),
          getCashTransactions(filters),
        ]);

        setData((previous) => ({
          ...previous,
          accounts: accountsRes.data.financial_accounts || [],
          transactions: transactionsRes.data.cash_transactions || [],
        }));
      }

      if (tab === "returns") {
        const [returnsRes, salesRes] = await Promise.all([
          getClientReturns(filters),
          getClientSales({ limit: 100, offset: 0 }),
        ]);

        setData((previous) => ({
          ...previous,
          returns: returnsRes.data.client_returns || [],
          sales: salesRes.data.client_sales || [],
        }));
      }

      if (tab === "profit") {
        const response = await getProfitLoss(filters);
        setData((previous) => ({
          ...previous,
          report: response.data.report || {},
        }));
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Ma'lumotlarni olishda xato.",
      );
    } finally {
      setLoading(false);
    }
  }, [tab, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (name, values) => {
    if (!canManage) {
      toast.error("Sizda moliyaviy amallarni bajarish uchun ruxsat yo'q.");
      return;
    }

    setDialog(name);
    setForm(values || {});
  };

  const close = () => {
    setDialog("");
    setForm({});
  };

  const field = (key) => (event) =>
    setForm((previous) => ({ ...previous, [key]: event.target.value }));

  const save = async () => {
    if (!canManage) {
      toast.error("Sizda moliyaviy amallarni bajarish uchun ruxsat yo'q.");
      return;
    }

    setSaving(true);

    try {
      if (dialog === "payroll") await createPayrollPeriod(form);

      if (dialog === "line") {
        await updatePayrollLine(form.id, {
          daily_earnings: Number(form.daily_earnings || 0),
          bonus: Number(form.bonus || 0),
          advance_deduction: Number(form.advance_deduction || 0),
          other_deduction: Number(form.other_deduction || 0),
          cash_amount: Number(form.cash_amount || 0),
          note: form.note || null,
        });
      }

      if (dialog === "category") await createExpenseCategory(form);

      if (dialog === "expense") {
        await createExpense({
          ...form,
          category_id: Number(form.category_id),
          account_id: form.account_id ? Number(form.account_id) : null,
          amount: Number(form.amount),
        });
      }

      if (dialog === "account") {
        await createFinancialAccount({
          ...form,
          opening_balance: Number(form.opening_balance || 0),
        });
      }

      if (dialog === "transaction") {
        await createCashTransaction({
          ...form,
          account_id: Number(form.account_id),
          amount: Number(form.amount),
        });
      }

      if (dialog === "return") {
        await createClientReturn({
          ...form,
          client_sale_id: Number(form.client_sale_id),
          quantity: Number(form.quantity),
        });
      }

      toast.success("Saqlandi.");
      close();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const showPeriod = async (id) => {
    try {
      const response = await getPayrollPeriod(id);
      setDetail(response.data);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Haftalik hisob ochilmadi.",
      );
    }
  };

  const closePeriod = async () => {
    if (!canManage) {
      toast.error("Sizda haftalik hisobni yopish uchun ruxsat yo'q.");
      return;
    }

    try {
      const response = await closePayrollPeriod(detail.payroll_period.id);
      setDetail(response.data);
      load();
      toast.success("Haftalik hisob yopildi.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Yopishda xato.");
    }
  };

  const pageStats = {
    payroll: [
      ["Davrlar", data.periods?.length || 0, "blue"],
      [
        "Ochiq",
        data.periods?.filter((item) => item.status !== "closed").length || 0,
        "green",
      ],
    ],
    expenses: [
      ["Xarajat", money(data.expenseTotal), "red"],
      ["Kategoriya", data.categories?.length || 0, "blue"],
    ],
    accounts: [
      ["Hisoblar", data.accounts?.length || 0, "blue"],
      ["Operatsiyalar", data.transactions?.length || 0, "green"],
    ],
    returns: [
      ["Qaytarishlar", data.returns?.length || 0, "orange"],
      ["Savdolar", data.sales?.length || 0, "blue"],
    ],
    profit: [
      ["Sof tushum", money(data.report?.net_revenue), "green"],
      [
        "Natija",
        money(data.report?.operational_result),
        Number(data.report?.operational_result) < 0 ? "red" : "blue",
      ],
    ],
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
      <Card sx={{ mb: 2.5, px: { xs: 2, md: 2.5 }, py: 2.2, flexShrink: 0 }}>
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
              label="Al-amin CRM • moliya"
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
              Moliya va hisob
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 14,
                fontWeight: 650,
                color: "var(--aa-text-secondary)",
              }}
            >
              Korxonaning pul, xarajat, oylik va foyda-zarar markazi.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(2, auto)",
              },
              gap: 1.2,
              width: { xs: "100%", xl: "auto" },
            }}
          >
            {(pageStats[tab] || []).map(([label, value, tone]) => (
              <MiniStat key={label} label={label} value={value} tone={tone} />
            ))}
          </Box>
        </Box>
      </Card>

      <Card sx={{ mb: 2.5, p: 1.4, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "stretch", lg: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", lg: "row" },
            gap: 1.4,
          }}
        >
          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.2 }}>
            {tabItems.map(([key, label]) => (
              <Button
                key={key}
                variant={tab === key ? "contained" : "outlined"}
                onClick={() => setTab(key)}
                sx={{
                  height: 40,
                  px: 2,
                  borderRadius: "var(--aa-radius-md)",
                  whiteSpace: "nowrap",
                  textTransform: "none",
                  fontWeight: 900,
                  color: tab === key ? "#fff" : "var(--aa-text)",
                  borderColor: "var(--aa-border-strong)",
                  background:
                    tab === key
                      ? "var(--aa-brand-700)"
                      : "var(--aa-surface-solid)",
                  boxShadow: tab === key ? "var(--aa-shadow-sm)" : "none",
                  "&:hover": {
                    background:
                      tab === key
                        ? "var(--aa-brand-800)"
                        : "var(--aa-surface-hover)",
                  },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>

          {tab !== "payroll" && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.2,
                minWidth: { xs: "100%", sm: 340 },
              }}
            >
              <TextField
                size="small"
                type="date"
                label="Dan"
                value={filters.date_from}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    date_from: event.target.value,
                  }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                size="small"
                type="date"
                label="Gacha"
                value={filters.date_to}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    date_to: event.target.value,
                  }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          )}
        </Box>
      </Card>

      <Box sx={{ minHeight: 0, flex: 1, overflow: "auto", pr: 0.5 }}>
        {loading ? (
          <Box sx={{ minHeight: 300, display: "grid", placeItems: "center" }}>
            <CircularProgress size={34} />
          </Box>
        ) : (
          <>
            {tab === "payroll" && (
              <Payroll
                data={data}
                detail={detail}
                show={showPeriod}
                open={open}
                closePeriod={closePeriod}
                canManage={canManage}
              />
            )}
            {tab === "expenses" && (
              <Expenses data={data} open={open} canManage={canManage} />
            )}
            {tab === "accounts" && (
              <Accounts data={data} open={open} canManage={canManage} />
            )}
            {tab === "returns" && (
              <Returns data={data} open={open} canManage={canManage} />
            )}
            {tab === "profit" && <Profit report={data.report} />}
          </>
        )}
      </Box>

      <EntryDialog
        name={dialog}
        form={form}
        field={field}
        close={close}
        save={save}
        saving={saving}
        data={data}
      />
    </Box>
  );
};

const Payroll = ({ data, detail, show, open, closePeriod, canManage }) => (
  <Stack spacing={2.5}>
    {canManage && (
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={() =>
            open("payroll", {
              period_from: "",
              period_to: "",
              payment_date: "",
              note: "",
            })
          }
          sx={{
            minWidth: 135,
            height: 42,
            borderRadius: "var(--aa-radius-md)",
            textTransform: "none",
            fontWeight: 950,
            background: "var(--aa-brand-700)",
            boxShadow: "var(--aa-shadow-sm)",
            "&:hover": { background: "var(--aa-brand-800)" },
          }}
        >
          Hafta ochish
        </Button>
      </Box>
    )}

    <Grid
      heads={["Davr", "To'lov kuni", "Hisoblangan", "Naqd", "Holat"]}
      onRow={show}
      rows={data.periods.map((item) => ({
        _id: item.id,
        cells: [
          `${date(item.period_from)} - ${date(item.period_to)}`,
          date(item.payment_date),
          money(item.total_earned),
          money(item.cash_amount),
          <StatusChip key={`period-status-${item.id}`} status={item.status} />,
        ],
      }))}
    />

    {detail && (
      <Card sx={{ p: 2.2 }}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
          }}
        >
          <Box>
            <Typography
              sx={{ fontSize: 18, fontWeight: 950, color: "var(--aa-text)" }}
            >
              Haftalik ish haqi tafsiloti
            </Typography>
            <Typography
              sx={{
                mt: 0.4,
                fontSize: 13.5,
                fontWeight: 650,
                color: "var(--aa-text-secondary)",
              }}
            >
              Hodimlar bo'yicha hisoblangan va beriladigan summalar.
            </Typography>
          </Box>

          {canManage && detail.payroll_period.status === "open" && (
            <Button
              variant="contained"
              color="success"
              onClick={closePeriod}
              sx={{
                borderRadius: "13px",
                textTransform: "none",
                fontWeight: 900,
              }}
            >
              Davrni yopish
            </Button>
          )}
        </Box>

        <Grid
          heads={[
            "Hodim",
            "Dona",
            "Doimiy",
            "Kunlik",
            "Bonus",
            "Avans",
            "Boshqa ushlanma",
            "Naqd",
            "Amal",
          ]}
          rows={detail.payroll_lines.map((item) => ({
            cells: [
              `${item.first_name} ${item.last_name}`,
              money(item.piece_earnings),
              money(item.fixed_earnings),
              money(item.daily_earnings),
              money(item.bonus),
              money(item.advance_deduction),
              money(item.other_deduction),
              money(item.cash_amount),
              canManage && detail.payroll_period.status === "open" ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => open("line", item)}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 900,
                  }}
                >
                  O'zgartirish
                </Button>
              ) : (
                "-"
              ),
            ],
          }))}
        />
      </Card>
    )}
  </Stack>
);

const Expenses = ({ data, open, canManage }) => (
  <Stack spacing={2.5}>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr auto auto" },
        gap: 1.3,
        alignItems: "stretch",
      }}
    >
      <StatCard
        label="Davrdagi xarajat"
        value={money(data.expenseTotal)}
        danger
      />

      {canManage && (
        <>
          <Button
            variant="outlined"
            onClick={() => open("category", { name: "", description: "" })}
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
            Kategoriya
          </Button>

          <Button
            variant="contained"
            onClick={() =>
              open("expense", {
                category_id: "",
                account_id: "",
                title: "",
                amount: "",
                spent_at: today(),
                note: "",
              })
            }
            sx={{
              height: 42,
              borderRadius: "var(--aa-radius-md)",
              textTransform: "none",
              fontWeight: 950,
              background: "var(--aa-brand-700)",
              "&:hover": { background: "var(--aa-brand-800)" },
            }}
          >
            Xarajat qo'shish
          </Button>
        </>
      )}
    </Box>

    <Grid
      heads={["Nomi", "Kategoriya", "Hisob", "Summa", "Sana"]}
      rows={data.expenses.map((item) => ({
        cells: [
          item.title,
          item.category_name,
          item.account_name || "-",
          money(item.amount),
          date(item.spent_at),
        ],
      }))}
    />
  </Stack>
);

const Accounts = ({ data, open, canManage }) => (
  <Stack spacing={2.5}>
    {canManage && (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          onClick={() =>
            open("account", {
              name: "",
              account_type: "cash",
              opening_balance: "",
            })
          }
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
          Hisob yaratish
        </Button>

        <Button
          variant="contained"
          onClick={() =>
            open("transaction", {
              account_id: "",
              transaction_type: "income",
              amount: "",
              transacted_at: today(),
              description: "",
            })
          }
          sx={{
            height: 42,
            borderRadius: "var(--aa-radius-md)",
            textTransform: "none",
            fontWeight: 950,
            background: "var(--aa-brand-700)",
            "&:hover": { background: "var(--aa-brand-800)" },
          }}
        >
          Kirim-chiqim
        </Button>
      </Box>
    )}

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        gap: 1.4,
      }}
    >
      {data.accounts.map((item) => (
        <StatCard
          key={item.id}
          label={`${item.name} / ${item.account_type}`}
          value={money(item.balance)}
        />
      ))}
    </Box>

    <Grid
      heads={["Hisob", "Turi", "Summa", "Izoh", "Sana"]}
      rows={data.transactions.map((item) => ({
        cells: [
          item.account_name,
          <TypeChip
            key={`transaction-type-${item.id}`}
            type={item.transaction_type}
          />,
          money(item.amount),
          item.description || "-",
          date(item.transacted_at),
        ],
      }))}
    />
  </Stack>
);

const Returns = ({ data, open, canManage }) => (
  <Stack spacing={2.5}>
    {canManage && (
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={() =>
            open("return", {
              client_sale_id: "",
              quantity: "",
              returned_at: today(),
              reason: "",
            })
          }
          sx={{
            height: 42,
            borderRadius: "var(--aa-radius-md)",
            textTransform: "none",
            fontWeight: 950,
            background: "var(--aa-brand-700)",
            "&:hover": { background: "var(--aa-brand-800)" },
          }}
        >
          Qaytarish qo'shish
        </Button>
      </Box>
    )}

    <Grid
      heads={["Mijoz", "Mahsulot", "Miqdor", "Summa", "Sabab", "Sana"]}
      rows={data.returns.map((item) => ({
        cells: [
          item.client_name,
          item.product_name,
          item.quantity,
          money(item.amount),
          item.reason || "-",
          date(item.returned_at),
        ],
      }))}
    />
  </Stack>
);

const Profit = ({ report }) => (
  <Stack spacing={2.5}>
    <Alert severity="info" sx={{ borderRadius: "16px", fontWeight: 700 }}>
      Ombor tannarxi ulanmaguncha bu operatsion natija hisoblanadi.
    </Alert>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
        gap: 1.4,
      }}
    >
      <StatCard label="Savdo" value={money(report.sales)} />
      <StatCard label="Qaytarish" value={money(report.returns)} danger />
      <StatCard label="Sof tushum" value={money(report.net_revenue)} />
      <StatCard label="Homashyo" value={money(report.material_costs)} danger />
      <StatCard label="Ish haqi" value={money(report.payroll_costs)} danger />
      <StatCard
        label="Boshqa xarajat"
        value={money(report.other_expenses)}
        danger
      />
      <StatCard
        label="Operatsion natija"
        value={money(report.operational_result)}
        danger={Number(report.operational_result) < 0}
      />
    </Box>
  </Stack>
);

const EntryDialog = ({ name, form, field, close, save, saving, data }) => {
  if (!name) return null;

  const input = (key, label, type = "text") => (
    <TextField
      type={type}
      label={label}
      value={form[key] ?? ""}
      onChange={field(key)}
      slotProps={type === "date" ? { inputLabel: { shrink: true } } : undefined}
    />
  );

  let fields = null;

  if (name === "payroll") {
    fields = (
      <>
        {input("period_from", "Dan", "date")}
        {input("period_to", "Gacha", "date")}
        {input("payment_date", "To'lov sanasi", "date")}
        {input("note", "Izoh")}
      </>
    );
  }

  if (name === "line") {
    fields = (
      <>
        {input("daily_earnings", "Kunlik", "number")}
        {input("bonus", "Bonus", "number")}
        {input("advance_deduction", "Avansdan ushlash", "number")}
        {input("other_deduction", "Boshqa ushlanma", "number")}
        {input("cash_amount", "Naqd beriladi", "number")}
      </>
    );
  }

  if (name === "category") {
    fields = (
      <>
        {input("name", "Kategoriya nomi")}
        {input("description", "Izoh")}
      </>
    );
  }

  if (name === "expense") {
    fields = (
      <>
        <TextField
          select
          label="Kategoriya"
          value={form.category_id || ""}
          onChange={field("category_id")}
        >
          {data.categories.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Hisob"
          value={form.account_id || ""}
          onChange={field("account_id")}
        >
          <MenuItem value="">Hisobsiz</MenuItem>
          {data.accounts.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>

        {input("title", "Xarajat nomi")}
        {input("amount", "Summa", "number")}
        {input("spent_at", "Sana", "date")}
        {input("note", "Izoh")}
      </>
    );
  }

  if (name === "account") {
    fields = (
      <>
        {input("name", "Hisob nomi")}

        <TextField
          select
          label="Turi"
          value={form.account_type || "cash"}
          onChange={field("account_type")}
        >
          <MenuItem value="cash">Naqd</MenuItem>
          <MenuItem value="card">Karta</MenuItem>
          <MenuItem value="bank">Bank</MenuItem>
        </TextField>

        {input("opening_balance", "Boshlang'ich balans", "number")}
      </>
    );
  }

  if (name === "transaction") {
    fields = (
      <>
        <TextField
          select
          label="Hisob"
          value={form.account_id || ""}
          onChange={field("account_id")}
        >
          {data.accounts.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Turi"
          value={form.transaction_type || "income"}
          onChange={field("transaction_type")}
        >
          <MenuItem value="income">Kirim</MenuItem>
          <MenuItem value="expense">Chiqim</MenuItem>
        </TextField>

        {input("amount", "Summa", "number")}
        {input("transacted_at", "Sana", "date")}
        {input("description", "Izoh")}
      </>
    );
  }

  if (name === "return") {
    fields = (
      <>
        <TextField
          select
          label="Savdo"
          value={form.client_sale_id || ""}
          onChange={field("client_sale_id")}
        >
          {data.sales.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.client_name} / {item.product_name} / qolgan{" "}
              {Number(item.quantity) - Number(item.returned_quantity || 0)}
            </MenuItem>
          ))}
        </TextField>

        {input("quantity", "Qaytarilgan miqdor", "number")}
        {input("returned_at", "Sana", "date")}
        {input("reason", "Sabab")}
      </>
    );
  }

  return (
    <PremiumDialog
      open
      onClose={close}
      title="Ma'lumot kiritish"
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
            onClick={save}
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
      <Box sx={{ display: "grid", gap: 1.5 }}>{fields}</Box>
    </PremiumDialog>
  );
};

export default Finance;
