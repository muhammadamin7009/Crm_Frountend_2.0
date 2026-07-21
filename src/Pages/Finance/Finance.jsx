import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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

const today = () =>
  new Date().toISOString().slice(0, 10);

const money = (value) =>
  `${new Intl.NumberFormat("uz-UZ").format(
    Number(value || 0),
  )} so'm`;

const number = (value) =>
  new Intl.NumberFormat("uz-UZ").format(
    Number(value || 0),
  );

const date = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "uz-UZ",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(parsed);
};

const tabItems = [
  ["payroll", "Haftalik ish haqi"],
  ["expenses", "Xarajatlar"],
  ["accounts", "Kassa va bank"],
  ["returns", "Qaytarishlar"],
  ["profit", "Foyda-zarar"],
];

const dialogTitles = {
  payroll: "Yangi haftalik hisob",
  line: "Ish haqi qatorini tahrirlash",
  category: "Xarajat kategoriyasi",
  expense: "Yangi xarajat",
  account: "Yangi moliyaviy hisob",
  transaction: "Kirim yoki chiqim",
  return: "Mijoz qaytarishi",
};

const getLocalUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") ||
        "null",
    );
  } catch {
    return null;
  }
};

const Card = ({
  children,
  sx = {},
}) => (
  <Paper
    elevation={0}
    sx={{
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid #e4e9ef",
      backgroundColor: "#ffffff",

      boxShadow:
        "0 14px 40px rgba(15,23,42,.045)",

      ...sx,
    }}
  >
    {children}
  </Paper>
);

const HeroMetric = ({
  label,
  value,
  helper,
  tone = "red",
}) => {
  const tones = {
    red: [
      "#fecdd3",
      "rgba(220,38,38,.15)",
      "rgba(248,113,113,.15)",
    ],

    green: [
      "#bbf7d0",
      "rgba(34,197,94,.14)",
      "rgba(74,222,128,.15)",
    ],

    blue: [
      "#bfdbfe",
      "rgba(37,99,235,.15)",
      "rgba(96,165,250,.15)",
    ],

    amber: [
      "#fde68a",
      "rgba(245,158,11,.15)",
      "rgba(251,191,36,.15)",
    ],

    violet: [
      "#ddd6fe",
      "rgba(139,92,246,.16)",
      "rgba(167,139,250,.15)",
    ],
  };

  const current =
    tones[tone] || tones.red;

  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: 126,
        p: 1.8,
        borderRadius: "18px",

        border:
          "1px solid rgba(255,255,255,.075)",

        background:
          "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",

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

          backgroundColor:
            current[1],

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

          color:
            "rgba(255,255,255,.44) !important",

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

          color:
            "#ffffff !important",

          fontSize: 17,
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

          color:
            "rgba(255,255,255,.28) !important",

          fontSize: 9,
        }}
      >
        {helper}
      </Typography>
    </Box>
  );
};

const StatusChip = ({ status }) => {
  const closed =
    status === "closed";

  return (
    <Chip
      size="small"
      label={
        closed
          ? "Yopilgan"
          : "Ochiq"
      }
      sx={{
        height: 25,
        px: 0.3,

        color: closed
          ? "#64748b"
          : "#15803d",

        fontSize: 9.5,
        fontWeight: 900,

        backgroundColor: closed
          ? "#f1f5f9"
          : "rgba(34,197,94,.09)",

        border: closed
          ? "1px solid #e2e8f0"
          : "1px solid rgba(34,197,94,.18)",
      }}
    />
  );
};

const TypeChip = ({ type }) => {
  const income =
    type === "income";

  return (
    <Chip
      size="small"
      label={
        income ? "Kirim" : "Chiqim"
      }
      sx={{
        height: 25,
        px: 0.3,

        color: income
          ? "#15803d"
          : "#b91c1c",

        fontSize: 9.5,
        fontWeight: 900,

        backgroundColor: income
          ? "rgba(34,197,94,.09)"
          : "rgba(220,38,38,.08)",

        border: income
          ? "1px solid rgba(34,197,94,.18)"
          : "1px solid rgba(220,38,38,.18)",
      }}
    />
  );
};

const StatCard = ({
  label,
  value,
  tone = "default",
  helper,
}) => {
  const tones = {
    default: [
      "#334155",
      "#ffffff",
      "#e7ebf0",
    ],

    green: [
      "#15803d",
      "rgba(34,197,94,.07)",
      "rgba(34,197,94,.17)",
    ],

    red: [
      "#991b1b",
      "rgba(153,27,27,.07)",
      "rgba(153,27,27,.16)",
    ],

    blue: [
      "#1d4ed8",
      "rgba(37,99,235,.07)",
      "rgba(37,99,235,.17)",
    ],

    amber: [
      "#b45309",
      "rgba(245,158,11,.09)",
      "rgba(245,158,11,.19)",
    ],

    violet: [
      "#6d28d9",
      "rgba(139,92,246,.08)",
      "rgba(139,92,246,.18)",
    ],
  };

  const current =
    tones[tone] || tones.default;

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.7,
        borderRadius: "17px",

        backgroundColor:
          current[1],

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
          mt: 0.6,
          color: current[0],
          fontSize: 16,
          fontWeight: 950,
          letterSpacing: "-.035em",
        }}
      >
        {value}
      </Typography>

      {helper && (
        <Typography
          sx={{
            mt: 0.45,
            color: "#94a3b8",
            fontSize: 9,
            lineHeight: 1.5,
          }}
        >
          {helper}
        </Typography>
      )}
    </Box>
  );
};

const SectionHeader = ({
  title,
  subtitle,
  actions,
}) => (
  <Box
    sx={{
      mb: 1.7,
      display: "flex",

      alignItems: {
        xs: "flex-start",
        sm: "center",
      },

      justifyContent:
        "space-between",

      flexDirection: {
        xs: "column",
        sm: "row",
      },

      gap: 1.4,
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
        {title}
      </Typography>

      {subtitle && (
        <Typography
          sx={{
            mt: 0.45,
            color: "#94a3b8",
            fontSize: 10,
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>

    {actions}
  </Box>
);

const PremiumDialog = ({
  open,
  onClose,
  title,

  subtitle =
    "Moliyaviy ma’lumotlarni kiriting",

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
        overflow: "hidden",
        borderRadius: "23px",

        border:
          "1px solid rgba(148,163,184,.20)",

        boxShadow:
          "0 30px 80px rgba(15,23,42,.22)",
      },
    }}
  >
    <DialogTitle
      className="finance-dialog-title"
      sx={{
        px: 3,
        py: 2.35,

        color:
          "#ffffff !important",

        backgroundColor:
          "#0d1117 !important",

        backgroundImage:
          "radial-gradient(circle at 100% 0%,rgba(220,38,38,.28),transparent 36%),linear-gradient(135deg,#11151c,#321319) !important",
      }}
    >
      <Typography
        sx={{
          color:
            "#ffffff !important",

          fontSize: 19,
          fontWeight: 950,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,

          color:
            "rgba(255,255,255,.43) !important",

          fontSize: 10.5,
        }}
      >
        {subtitle}
      </Typography>
    </DialogTitle>

    <DialogContent
      sx={{
        px: 3,

        py:
          "24px !important",
      }}
    >
      {children}
    </DialogContent>

    {actions && (
      <DialogActions
        sx={{
          px: 3,
          py: 2.1,

          borderTop:
            "1px solid #edf0f3",

          backgroundColor:
            "#fafbfc",
        }}
      >
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

const Grid = ({
  heads,
  rows,
  onRow,
  minWidth = 820,
}) => (
  <Card sx={{ boxShadow: "none" }}>
    <Box sx={{ overflowX: "auto" }}>
      <Table
        size="small"
        sx={{
          minWidth,

          "& th": {
            py: 1.55,
            color: "#94a3b8",
            fontSize: 9.5,
            fontWeight: 900,
            letterSpacing: ".045em",
            textTransform: "uppercase",

            backgroundColor:
              "#fafbfc",

            borderColor: "#edf0f3",
          },

          "& td": {
            py: 1.4,
            color: "#64748b",
            fontSize: 10.5,
            borderColor: "#edf0f3",
          },

          "& tbody tr:hover": {
            backgroundColor: onRow
              ? "rgba(153,27,27,.025)"
              : "inherit",
          },
        }}
      >
        <TableHead>
          <TableRow>
            {heads.map((head) => (
              <TableCell key={head}>
                {head}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length ? (
            rows.map(
              (row, index) => (
                <TableRow
                  hover={Boolean(onRow)}
                  key={
                    row._id || index
                  }
                  onClick={() =>
                    onRow?.(row._id)
                  }
                  sx={{
                    cursor: onRow
                      ? "pointer"
                      : "default",
                  }}
                >
                  {row.cells.map(
                    (
                      value,
                      cellIndex,
                    ) => (
                      <TableCell
                        key={cellIndex}
                      >
                        {value}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ),
            )
          ) : (
            <TableRow>
              <TableCell
                colSpan={heads.length}
                align="center"
                sx={{
                  py: 7,
                  color: "#94a3b8",
                  fontWeight: 850,
                }}
              >
                Ma’lumot topilmadi
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  </Card>
);

const Finance = () => {
  const auth = useAuth();

  const currentUser =
    auth?.user || getLocalUser();

  const canManage =
    ["super_admin", "admin"].includes(
      currentUser?.role,
    ) &&
    hasPermission(
      currentUser,
      "finance.manage",
    );

  const [tab, setTab] =
    useState("payroll");

  const [loading, setLoading] =
    useState(true);

  const [data, setData] = useState({
    periods: [],
    categories: [],
    expenses: [],
    accounts: [],
    transactions: [],
    returns: [],
    sales: [],
    report: {},
    expenseTotal: 0,
  });

  const [detail, setDetail] =
    useState(null);

  const [dialog, setDialog] =
    useState("");

  const [form, setForm] =
    useState({});

  const [saving, setSaving] =
    useState(false);

  const [filters, setFilters] =
    useState({
      date_from: `${today().slice(
        0,
        7,
      )}-01`,

      date_to: today(),
      limit: 100,
      offset: 0,
    });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      if (tab === "payroll") {
        const response =
          await getPayrollPeriods({
            limit: 100,
            offset: 0,
          });

        const responseData =
          response?.data ||
          response ||
          {};

        setData((previous) => ({
          ...previous,

          periods:
            responseData.payroll_periods ||
            [],
        }));
      }

      if (tab === "expenses") {
        const [
          categoriesRes,
          expensesRes,
          accountsRes,
        ] = await Promise.all([
          getExpenseCategories(),

          getExpenses(filters),

          getFinancialAccounts(),
        ]);

        const categoriesData =
          categoriesRes?.data ||
          categoriesRes ||
          {};

        const expensesData =
          expensesRes?.data ||
          expensesRes ||
          {};

        const accountsData =
          accountsRes?.data ||
          accountsRes ||
          {};

        setData((previous) => ({
          ...previous,

          categories:
            categoriesData.expense_categories ||
            [],

          expenses:
            expensesData.expenses ||
            [],

          expenseTotal:
            expensesData.total_amount ||
            0,

          accounts:
            accountsData.financial_accounts ||
            [],
        }));
      }

      if (tab === "accounts") {
        const [
          accountsRes,
          transactionsRes,
        ] = await Promise.all([
          getFinancialAccounts(),

          getCashTransactions(filters),
        ]);

        const accountsData =
          accountsRes?.data ||
          accountsRes ||
          {};

        const transactionsData =
          transactionsRes?.data ||
          transactionsRes ||
          {};

        setData((previous) => ({
          ...previous,

          accounts:
            accountsData.financial_accounts ||
            [],

          transactions:
            transactionsData.cash_transactions ||
            [],
        }));
      }

      if (tab === "returns") {
        const [
          returnsRes,
          salesRes,
        ] = await Promise.all([
          getClientReturns(filters),

          getClientSales({
            limit: 100,
            offset: 0,
          }),
        ]);

        const returnsData =
          returnsRes?.data ||
          returnsRes ||
          {};

        const salesData =
          salesRes?.data ||
          salesRes ||
          {};

        setData((previous) => ({
          ...previous,

          returns:
            returnsData.client_returns ||
            [],

          sales:
            salesData.client_sales ||
            [],
        }));
      }

      if (tab === "profit") {
        const response =
          await getProfitLoss(filters);

        const responseData =
          response?.data ||
          response ||
          {};

        setData((previous) => ({
          ...previous,

          report:
            responseData.report || {},
        }));
      }
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Ma’lumotlarni olishda xato.",
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
      toast.error(
        "Sizda moliyaviy amallarni bajarish uchun ruxsat yo‘q.",
      );

      return;
    }

    setDialog(name);
    setForm(values || {});
  };

  const close = () => {
    setDialog("");
    setForm({});
  };

  const field =
    (key) => (event) =>
      setForm((previous) => ({
        ...previous,

        [key]:
          event.target.value,
      }));

  const save = async () => {
    if (!canManage) {
      toast.error(
        "Sizda moliyaviy amallarni bajarish uchun ruxsat yo‘q.",
      );

      return;
    }

    setSaving(true);

    try {
      if (dialog === "payroll") {
        await createPayrollPeriod(
          form,
        );
      }

      if (dialog === "line") {
        await updatePayrollLine(
          form.id,
          {
            daily_earnings: Number(
              form.daily_earnings ||
                0,
            ),

            bonus: Number(
              form.bonus || 0,
            ),

            advance_deduction:
              Number(
                form.advance_deduction ||
                  0,
              ),

            other_deduction:
              Number(
                form.other_deduction ||
                  0,
              ),

            cash_amount: Number(
              form.cash_amount || 0,
            ),

            note:
              form.note || null,
          },
        );
      }

      if (dialog === "category") {
        await createExpenseCategory(
          form,
        );
      }

      if (dialog === "expense") {
        await createExpense({
          ...form,

          category_id: Number(
            form.category_id,
          ),

          account_id:
            form.account_id
              ? Number(
                  form.account_id,
                )
              : null,

          amount: Number(
            form.amount,
          ),
        });
      }

      if (dialog === "account") {
        await createFinancialAccount({
          ...form,

          opening_balance: Number(
            form.opening_balance ||
              0,
          ),
        });
      }

      if (
        dialog === "transaction"
      ) {
        await createCashTransaction({
          ...form,

          account_id: Number(
            form.account_id,
          ),

          amount: Number(
            form.amount,
          ),
        });
      }

      if (dialog === "return") {
        await createClientReturn({
          ...form,

          client_sale_id: Number(
            form.client_sale_id,
          ),

          quantity: Number(
            form.quantity,
          ),
        });
      }

      toast.success("Saqlandi.");

      close();

      await load();
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Saqlashda xato.",
      );
    } finally {
      setSaving(false);
    }
  };

  const showPeriod =
    async (id) => {
      try {
        const response =
          await getPayrollPeriod(id);

        setDetail(
          response?.data ||
            response ||
            null,
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Haftalik hisob ochilmadi.",
        );
      }
    };

  const closePeriod = async () => {
    if (!canManage) {
      toast.error(
        "Sizda haftalik hisobni yopish uchun ruxsat yo‘q.",
      );

      return;
    }

    if (
      !detail?.payroll_period?.id
    ) {
      return;
    }

    try {
      const response =
        await closePayrollPeriod(
          detail.payroll_period.id,
        );

      setDetail(
        response?.data ||
          response ||
          null,
      );

      await load();

      toast.success(
        "Haftalik hisob yopildi.",
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Yopishda xato.",
      );
    }
  };

  const heroMetrics = useMemo(() => {
    if (tab === "payroll") {
      const openPeriods = (
        data.periods || []
      ).filter(
        (item) =>
          item.status !== "closed",
      ).length;

      const earned = (
        data.periods || []
      ).reduce(
        (sum, item) =>
          sum +
          Number(
            item.total_earned || 0,
          ),

        0,
      );

      const cash = (
        data.periods || []
      ).reduce(
        (sum, item) =>
          sum +
          Number(
            item.cash_amount || 0,
          ),

        0,
      );

      return [
        [
          "Davrlar",

          `${number(
            data.periods?.length,
          )} ta`,

          "Haftalik hisoblar",

          "blue",
        ],

        [
          "Ochiq davr",

          `${number(
            openPeriods,
          )} ta`,

          "Yopilmagan hisoblar",

          "green",
        ],

        [
          "Hisoblangan",

          money(earned),

          "Davrlar bo‘yicha jami",

          "amber",
        ],

        [
          "Naqd berilgan",

          money(cash),

          "To‘langan ish haqi",

          "red",
        ],
      ];
    }

    if (tab === "expenses") {
      return [
        [
          "Jami xarajat",

          money(
            data.expenseTotal,
          ),

          "Tanlangan davr",

          "red",
        ],

        [
          "Xarajatlar",

          `${number(
            data.expenses?.length,
          )} ta`,

          "Kiritilgan yozuvlar",

          "blue",
        ],

        [
          "Kategoriyalar",

          `${number(
            data.categories?.length,
          )} ta`,

          "Xarajat guruhlari",

          "amber",
        ],

        [
          "Hisoblar",

          `${number(
            data.accounts?.length,
          )} ta`,

          "Moliyaviy manbalar",

          "green",
        ],
      ];
    }

    if (tab === "accounts") {
      const balance = (
        data.accounts || []
      ).reduce(
        (sum, item) =>
          sum +
          Number(item.balance || 0),

        0,
      );

      const income = (
        data.transactions || []
      )
        .filter(
          (item) =>
            item.transaction_type ===
            "income",
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(item.amount || 0),

          0,
        );

      const expense = (
        data.transactions || []
      )
        .filter(
          (item) =>
            item.transaction_type !==
            "income",
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(item.amount || 0),

          0,
        );

      return [
        [
          "Umumiy balans",
          money(balance),
          "Kassa va bank hisoblari",
          "green",
        ],

        [
          "Hisoblar",

          `${number(
            data.accounts?.length,
          )} ta`,

          "Faol moliyaviy hisoblar",

          "blue",
        ],

        [
          "Kirim",
          money(income),
          "Tanlangan davr",
          "amber",
        ],

        [
          "Chiqim",
          money(expense),
          "Tanlangan davr",
          "red",
        ],
      ];
    }

    if (tab === "returns") {
      const amount = (
        data.returns || []
      ).reduce(
        (sum, item) =>
          sum +
          Number(item.amount || 0),

        0,
      );

      const quantity = (
        data.returns || []
      ).reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0),

        0,
      );

      return [
        [
          "Qaytarishlar",

          `${number(
            data.returns?.length,
          )} ta`,

          "Qaytarish yozuvlari",

          "red",
        ],

        [
          "Qaytarilgan summa",

          money(amount),

          "Mijozga qaytarilgan",

          "amber",
        ],

        [
          "Qaytarilgan miqdor",

          number(quantity),

          "Mahsulot birliklari",

          "blue",
        ],

        [
          "Savdolar",

          `${number(
            data.sales?.length,
          )} ta`,

          "Tanlash uchun savdolar",

          "green",
        ],
      ];
    }

    const report =
      data.report || {};

    const totalCosts =
      Number(
        report.material_costs ||
          0,
      ) +
      Number(
        report.payroll_costs ||
          0,
      ) +
      Number(
        report.other_expenses ||
          0,
      );

    return [
      [
        "Savdo",

        money(report.sales),

        "Yalpi savdo tushumi",

        "blue",
      ],

      [
        "Sof tushum",

        money(
          report.net_revenue,
        ),

        "Qaytarishlardan keyin",

        "green",
      ],

      [
        "Jami xarajat",

        money(totalCosts),

        "Homashyo, oylik va boshqa",

        "amber",
      ],

      [
        "Operatsion natija",

        money(
          report.operational_result,
        ),

        "Tanlangan davr natijasi",

        Number(
          report.operational_result ||
            0,
        ) < 0
          ? "red"
          : "violet",
      ],
    ];
  }, [data, tab]);

  const tabTitle =
    tabItems.find(
      ([key]) => key === tab,
    )?.[1] || "Moliya";

  return (
    <Box
      className="crm-page finance-page"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2.5,
      }}
    >
      <style>{financePageStyles}</style>

      <Box
        component="section"
        className="finance-hero"
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

          border:
            "1px solid rgba(255,255,255,.075)",

          backgroundColor:
            "#0d1117 !important",

          backgroundImage:
            "radial-gradient(circle at 100% 0%,rgba(220,38,38,.34),transparent 30%),linear-gradient(145deg,#0d1117,#171117 52%,#3a121a) !important",

          boxShadow:
            "0 24px 60px rgba(15,23,42,.20)",

          flexShrink: 0,

          "&::before": {
            content: '""',
            position: "absolute",
            width: 390,
            height: 390,
            top: -275,
            right: -210,
            borderRadius: "50%",

            border:
              "1px solid rgba(248,113,113,.16)",

            boxShadow:
              "0 0 0 62px rgba(248,113,113,.022),0 0 0 124px rgba(248,113,113,.014)",

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
              xl: ".78fr 1.22fr",
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

                  background:
                    "linear-gradient(90deg,#fb7185,#ef4444)",
                }}
              />

              <Typography
                sx={{
                  color:
                    "#fecdd3 !important",

                  fontSize: 10,
                  fontWeight: 950,
                  letterSpacing: ".13em",
                  textTransform: "uppercase",
                }}
              >
                Korxona moliya markazi
              </Typography>
            </Box>

            <Typography
              component="h1"
              sx={{
                mt: 1.5,

                color:
                  "#ffffff !important",

                fontSize: {
                  xs: 29,
                  md: 36,
                },

                lineHeight: 1.08,
                fontWeight: 950,
                letterSpacing: "-.045em",
              }}
            >
              Moliya va hisob
            </Typography>

            <Typography
              sx={{
                maxWidth: 560,
                mt: 1.4,

                color:
                  "rgba(255,255,255,.45) !important",

                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Ish haqi, xarajatlar,
              kassa, bank, qaytarishlar
              va foyda-zarar
              ko‘rsatkichlarini yagona
              markazdan boshqaring.
            </Typography>

            <Box
              sx={{
                mt: 2.2,
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 1.4,
                py: 0.85,
                borderRadius: "12px",

                border:
                  "1px solid rgba(255,255,255,.09)",

                backgroundColor:
                  "rgba(255,255,255,.055)",
              }}
            >
              <Typography
                sx={{
                  color:
                    "rgba(255,255,255,.42) !important",

                  fontSize: 9.5,
                  fontWeight: 800,
                }}
              >
                Faol bo‘lim
              </Typography>

              <Typography
                sx={{
                  color:
                    "#ffffff !important",

                  fontSize: 10.5,
                  fontWeight: 950,
                }}
              >
                {tabTitle}
              </Typography>
            </Box>
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
            {heroMetrics.map(
              ([
                label,
                value,
                helper,
                tone,
              ]) => (
                <HeroMetric
                  key={label}
                  label={label}
                  value={value}
                  helper={helper}
                  tone={tone}
                />
              ),
            )}
          </Box>
        </Box>
      </Box>

      <Card
        sx={{
          mb: 2,
          p: 1.4,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",

            alignItems: {
              xs: "stretch",
              lg: "center",
            },

            justifyContent:
              "space-between",

            flexDirection: {
              xs: "column",
              lg: "row",
            },

            gap: 1.4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 0.8,
              overflowX: "auto",
              pb: 0.2,
            }}
          >
            {tabItems.map(
              ([key, label]) => {
                const active =
                  tab === key;

                return (
                  <Button
                    key={key}
                    onClick={() => {
                      setTab(key);
                      setDetail(null);
                    }}
                    sx={{
                      minHeight: 40,
                      px: 1.8,
                      flexShrink: 0,

                      color: active
                        ? "#ffffff"
                        : "#64748b",

                      borderRadius:
                        "11px",

                      border: active
                        ? "1px solid rgba(153,27,27,.10)"
                        : "1px solid #e1e7ed",

                      fontSize: 10.5,
                      fontWeight: 900,
                      textTransform:
                        "none",

                      background: active
                        ? "linear-gradient(135deg,#7f1d1d,#b91c1c)"
                        : "#ffffff",

                      boxShadow: active
                        ? "0 8px 20px rgba(127,29,29,.18)"
                        : "none",

                      "&:hover": {
                        color: active
                          ? "#ffffff"
                          : "#991b1b",

                        borderColor:
                          active
                            ? "rgba(153,27,27,.10)"
                            : "rgba(153,27,27,.22)",

                        background:
                          active
                            ? "linear-gradient(135deg,#681818,#991b1b)"
                            : "rgba(153,27,27,.04)",
                      },
                    }}
                  >
                    {label}
                  </Button>
                );
              },
            )}
          </Box>

          {tab !== "payroll" && (
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },

                gap: 1.2,

                minWidth: {
                  xs: "100%",
                  sm: 340,
                },
              }}
            >
              <TextField
                size="small"
                type="date"
                label="Dan"
                value={
                  filters.date_from
                }
                onChange={(event) =>
                  setFilters(
                    (previous) => ({
                      ...previous,

                      date_from:
                        event.target
                          .value,
                    }),
                  )
                }
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
                onChange={(event) =>
                  setFilters(
                    (previous) => ({
                      ...previous,

                      date_to:
                        event.target
                          .value,
                    }),
                  )
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Card>

      <Box
        sx={{
          minHeight: 0,
          flex: 1,
          overflow: "auto",
          pr: 0.4,
        }}
      >
        {loading ? (
          <Box
            sx={{
              minHeight: 330,
              display: "grid",
              placeItems: "center",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress
                size={32}
                sx={{
                  color: "#991b1b",
                }}
              />

              <Typography
                sx={{
                  mt: 1.3,
                  color: "#94a3b8",
                  fontSize: 10.5,
                  fontWeight: 800,
                }}
              >
                Moliyaviy ma’lumotlar
                yuklanmoqda...
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {tab === "payroll" && (
              <Payroll
                data={data}
                detail={detail}
                show={showPeriod}
                open={open}
                closePeriod={
                  closePeriod
                }
                canManage={canManage}
              />
            )}

            {tab === "expenses" && (
              <Expenses
                data={data}
                open={open}
                canManage={canManage}
              />
            )}

            {tab === "accounts" && (
              <Accounts
                data={data}
                open={open}
                canManage={canManage}
              />
            )}

            {tab === "returns" && (
              <Returns
                data={data}
                open={open}
                canManage={canManage}
              />
            )}

            {tab === "profit" && (
              <Profit
                report={data.report}
              />
            )}
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

const Payroll = ({
  data,
  detail,
  show,
  open,
  closePeriod,
  canManage,
}) => {
  const period =
    detail?.payroll_period;

  const lines =
    detail?.payroll_lines || [];

  const detailTotals = useMemo(
    () => ({
      piece: lines.reduce(
        (sum, item) =>
          sum +
          Number(
            item.piece_earnings ||
              0,
          ),

        0,
      ),

      fixed: lines.reduce(
        (sum, item) =>
          sum +
          Number(
            item.fixed_earnings ||
              0,
          ),

        0,
      ),

      bonus: lines.reduce(
        (sum, item) =>
          sum +
          Number(item.bonus || 0),

        0,
      ),

      cash: lines.reduce(
        (sum, item) =>
          sum +
          Number(
            item.cash_amount || 0,
          ),

        0,
      ),
    }),

    [lines],
  );

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2.2 }}>
        <SectionHeader
          title="Haftalik ish haqi davrlari"
          subtitle="Davr ustiga bosib hodimlar kesimidagi batafsil hisobni ko‘ring"
          actions={
            canManage ? (
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
                sx={primaryButtonSx}
              >
                + Hafta ochish
              </Button>
            ) : null
          }
        />

        <Grid
          heads={[
            "Davr",
            "To‘lov kuni",
            "Hisoblangan",
            "Naqd",
            "Holat",
          ]}
          onRow={show}
          rows={(
            data.periods || []
          ).map((item) => ({
            _id: item.id,

            cells: [
              <Typography
                key={`period-${item.id}`}
                sx={strongCellSx}
              >
                {date(
                  item.period_from,
                )}{" "}
                —{" "}
                {date(item.period_to)}
              </Typography>,

              date(
                item.payment_date,
              ),

              <Typography
                key={`earned-${item.id}`}
                sx={greenCellSx}
              >
                {money(
                  item.total_earned,
                )}
              </Typography>,

              money(
                item.cash_amount,
              ),

              <StatusChip
                key={`period-status-${item.id}`}
                status={item.status}
              />,
            ],
          }))}
        />
      </Card>

      {detail && (
        <Card sx={{ p: 2.2 }}>
          <SectionHeader
            title="Haftalik hisob tafsiloti"
            subtitle={`${date(
              period?.period_from,
            )} — ${date(
              period?.period_to,
            )} davri bo‘yicha hodimlar hisoboti`}
            actions={
              canManage &&
              period?.status ===
                "open" ? (
                <Button
                  variant="contained"
                  onClick={closePeriod}
                  sx={{
                    ...primaryButtonSx,

                    background:
                      "linear-gradient(135deg,#15803d,#22c55e)",

                    "&:hover": {
                      background:
                        "linear-gradient(135deg,#166534,#16a34a)",
                    },
                  }}
                >
                  Davrni yopish
                </Button>
              ) : (
                <StatusChip
                  status={
                    period?.status
                  }
                />
              )
            }
          />

          <Box
            sx={{
              mb: 1.7,
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2,minmax(0,1fr))",

                lg: "repeat(4,minmax(0,1fr))",
              },

              gap: 1.2,
            }}
          >
            <StatCard
              label="Dona bo‘yicha"
              value={money(
                detailTotals.piece,
              )}
              tone="blue"
            />

            <StatCard
              label="Doimiy ish haqi"
              value={money(
                detailTotals.fixed,
              )}
              tone="violet"
            />

            <StatCard
              label="Bonuslar"
              value={money(
                detailTotals.bonus,
              )}
              tone="amber"
            />

            <StatCard
              label="Naqd beriladi"
              value={money(
                detailTotals.cash,
              )}
              tone="green"
            />
          </Box>

          <Grid
            minWidth={1140}
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
            rows={lines.map(
              (item) => ({
                _id: item.id,

                cells: [
                  <Typography
                    key={`worker-${item.id}`}
                    sx={strongCellSx}
                  >
                    {item.first_name}{" "}
                    {item.last_name}
                  </Typography>,

                  money(
                    item.piece_earnings,
                  ),

                  money(
                    item.fixed_earnings,
                  ),

                  money(
                    item.daily_earnings,
                  ),

                  money(item.bonus),

                  money(
                    item.advance_deduction,
                  ),

                  money(
                    item.other_deduction,
                  ),

                  <Typography
                    key={`cash-${item.id}`}
                    sx={greenCellSx}
                  >
                    {money(
                      item.cash_amount,
                    )}
                  </Typography>,

                  canManage &&
                  period?.status ===
                    "open" ? (
                    <Button
                      key={`edit-${item.id}`}
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        open(
                          "line",
                          item,
                        )
                      }
                      sx={
                        tableActionSx
                      }
                    >
                      O‘zgartirish
                    </Button>
                  ) : (
                    "-"
                  ),
                ],
              }),
            )}
          />
        </Card>
      )}
    </Stack>
  );
};

const Expenses = ({
  data,
  open,
  canManage,
}) => (
  <Card sx={{ p: 2.2 }}>
    <SectionHeader
      title="Xarajatlar"
      subtitle="Kategoriyalar, moliyaviy hisoblar va xarajat yozuvlari"
      actions={
        canManage ? (
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
          >
            <Button
              variant="outlined"
              onClick={() =>
                open("category", {
                  name: "",
                  description: "",
                })
              }
              sx={secondaryButtonSx}
            >
              Kategoriya qo‘shish
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
              sx={primaryButtonSx}
            >
              + Xarajat qo‘shish
            </Button>
          </Stack>
        ) : null
      }
    />

    <Box
      sx={{
        mb: 1.7,
        display: "grid",

        gridTemplateColumns: {
          xs: "1fr",

          sm: "repeat(3,minmax(0,1fr))",
        },

        gap: 1.2,
      }}
    >
      <StatCard
        label="Davrdagi xarajat"
        value={money(
          data.expenseTotal,
        )}
        tone="red"
      />

      <StatCard
        label="Xarajat yozuvlari"
        value={`${number(
          data.expenses?.length,
        )} ta`}
        tone="blue"
      />

      <StatCard
        label="Kategoriyalar"
        value={`${number(
          data.categories?.length,
        )} ta`}
        tone="amber"
      />
    </Box>

    <Grid
      heads={[
        "Nomi",
        "Kategoriya",
        "Hisob",
        "Summa",
        "Sana",
      ]}
      rows={(
        data.expenses || []
      ).map((item) => ({
        _id: item.id,

        cells: [
          <Typography
            key={`expense-${item.id}`}
            sx={strongCellSx}
          >
            {item.title || "-"}
          </Typography>,

          item.category_name ||
            "-",

          item.account_name ||
            "Hisobsiz",

          <Typography
            key={`expense-money-${item.id}`}
            sx={redCellSx}
          >
            {money(item.amount)}
          </Typography>,

          date(item.spent_at),
        ],
      }))}
    />
  </Card>
);

const Accounts = ({
  data,
  open,
  canManage,
}) => {
  const totalBalance = (
    data.accounts || []
  ).reduce(
    (sum, item) =>
      sum +
      Number(item.balance || 0),

    0,
  );

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2.2 }}>
        <SectionHeader
          title="Kassa va bank hisoblari"
          subtitle="Moliyaviy hisoblar balansi va ulardagi kirim-chiqimlar"
          actions={
            canManage ? (
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
              >
                <Button
                  variant="outlined"
                  onClick={() =>
                    open("account", {
                      name: "",

                      account_type:
                        "cash",

                      opening_balance:
                        "",
                    })
                  }
                  sx={
                    secondaryButtonSx
                  }
                >
                  Hisob yaratish
                </Button>

                <Button
                  variant="contained"
                  onClick={() =>
                    open(
                      "transaction",
                      {
                        account_id: "",

                        transaction_type:
                          "income",

                        amount: "",

                        transacted_at:
                          today(),

                        description: "",
                      },
                    )
                  }
                  sx={primaryButtonSx}
                >
                  + Kirim-chiqim
                </Button>
              </Stack>
            ) : null
          }
        />

        <Box
          sx={{
            mb: 1.8,
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",

              sm: "repeat(2,minmax(0,1fr))",

              lg: "repeat(4,minmax(0,1fr))",
            },

            gap: 1.2,
          }}
        >
          <StatCard
            label="Umumiy balans"
            value={money(
              totalBalance,
            )}
            tone="green"
          />

          {(data.accounts || [])
            .slice(0, 3)
            .map((item, index) => (
              <StatCard
                key={item.id}
                label={`${item.name} / ${
                  item.account_type ||
                  "hisob"
                }`}
                value={money(
                  item.balance,
                )}
                tone={
                  [
                    "blue",
                    "amber",
                    "violet",
                  ][index] ||
                  "default"
                }
              />
            ))}
        </Box>

        <Grid
          heads={[
            "Hisob",
            "Turi",
            "Summa",
            "Izoh",
            "Sana",
          ]}
          rows={(
            data.transactions || []
          ).map((item) => ({
            _id: item.id,

            cells: [
              <Typography
                key={`account-${item.id}`}
                sx={strongCellSx}
              >
                {item.account_name ||
                  "-"}
              </Typography>,

              <TypeChip
                key={`transaction-type-${item.id}`}
                type={
                  item.transaction_type
                }
              />,

              <Typography
                key={`transaction-money-${item.id}`}
                sx={
                  item.transaction_type ===
                  "income"
                    ? greenCellSx
                    : redCellSx
                }
              >
                {money(item.amount)}
              </Typography>,

              item.description ||
                "-",

              date(
                item.transacted_at,
              ),
            ],
          }))}
        />
      </Card>
    </Stack>
  );
};

const Returns = ({
  data,
  open,
  canManage,
}) => {
  const returnTotal = (
    data.returns || []
  ).reduce(
    (sum, item) =>
      sum +
      Number(item.amount || 0),

    0,
  );

  return (
    <Card sx={{ p: 2.2 }}>
      <SectionHeader
        title="Mijoz qaytarishlari"
        subtitle="Sotilgan mahsulotlarning qaytarilgan miqdori va summasi"
        actions={
          canManage ? (
            <Button
              variant="contained"
              onClick={() =>
                open("return", {
                  client_sale_id: "",
                  quantity: "",

                  returned_at:
                    today(),

                  reason: "",
                })
              }
              sx={primaryButtonSx}
            >
              + Qaytarish qo‘shish
            </Button>
          ) : null
        }
      />

      <Box
        sx={{
          mb: 1.7,
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            sm: "repeat(3,minmax(0,1fr))",
          },

          gap: 1.2,
        }}
      >
        <StatCard
          label="Qaytarilgan summa"
          value={money(
            returnTotal,
          )}
          tone="red"
        />

        <StatCard
          label="Qaytarishlar"
          value={`${number(
            data.returns?.length,
          )} ta`}
          tone="amber"
        />

        <StatCard
          label="Mavjud savdolar"
          value={`${number(
            data.sales?.length,
          )} ta`}
          tone="blue"
        />
      </Box>

      <Grid
        heads={[
          "Mijoz",
          "Mahsulot",
          "Miqdor",
          "Summa",
          "Sabab",
          "Sana",
        ]}
        rows={(
          data.returns || []
        ).map((item) => ({
          _id: item.id,

          cells: [
            <Typography
              key={`client-${item.id}`}
              sx={strongCellSx}
            >
              {item.client_name ||
                "-"}
            </Typography>,

            item.product_name ||
              "-",

            number(item.quantity),

            <Typography
              key={`return-money-${item.id}`}
              sx={redCellSx}
            >
              {money(item.amount)}
            </Typography>,

            item.reason || "-",

            date(item.returned_at),
          ],
        }))}
      />
    </Card>
  );
};

const Profit = ({
  report = {},
}) => {
  const totalCosts =
    Number(
      report.material_costs || 0,
    ) +
    Number(
      report.payroll_costs || 0,
    ) +
    Number(
      report.other_expenses || 0,
    );

  const positive =
    Number(
      report.operational_result ||
        0,
    ) >= 0;

  return (
    <Stack spacing={2}>
      <Alert
        severity="info"
        sx={{
          borderRadius: "16px",

          border:
            "1px solid rgba(37,99,235,.14)",

          fontSize: 10.5,
          fontWeight: 750,
        }}
      >
        Ombor tannarxi to‘liq
        ulanmaguncha bu ko‘rsatkich
        operatsion natija hisoblanadi.
      </Alert>

      <Card sx={{ p: 2.2 }}>
        <SectionHeader
          title="Foyda va zarar hisoboti"
          subtitle="Savdo tushumi, qaytarishlar va asosiy xarajatlar bo‘yicha natija"
        />

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",

              sm: "repeat(2,minmax(0,1fr))",

              xl: "repeat(4,minmax(0,1fr))",
            },

            gap: 1.3,
          }}
        >
          <StatCard
            label="Savdo"
            value={money(
              report.sales,
            )}
            tone="blue"
          />

          <StatCard
            label="Qaytarish"
            value={money(
              report.returns,
            )}
            tone="red"
          />

          <StatCard
            label="Sof tushum"
            value={money(
              report.net_revenue,
            )}
            tone="green"
          />

          <StatCard
            label="Jami xarajat"
            value={money(totalCosts)}
            tone="amber"
          />

          <StatCard
            label="Homashyo"
            value={money(
              report.material_costs,
            )}
            tone="violet"
          />

          <StatCard
            label="Ish haqi"
            value={money(
              report.payroll_costs,
            )}
            tone="red"
          />

          <StatCard
            label="Boshqa xarajat"
            value={money(
              report.other_expenses,
            )}
            tone="amber"
          />

          <StatCard
            label="Operatsion natija"
            value={money(
              report.operational_result,
            )}
            tone={
              positive
                ? "green"
                : "red"
            }
          />
        </Box>

        <Box
          sx={{
            mt: 2,

            p: {
              xs: 2,
              md: 2.5,
            },

            borderRadius: "20px",
            color: "#ffffff",

            background: positive
              ? "linear-gradient(135deg,#14532d,#15803d)"
              : "linear-gradient(135deg,#450a0a,#991b1b)",

            boxShadow: positive
              ? "0 18px 42px rgba(21,128,61,.18)"
              : "0 18px 42px rgba(153,27,27,.18)",
          }}
        >
          <Typography
            sx={{
              color:
                "rgba(255,255,255,.58) !important",

              fontSize: 9.5,
              fontWeight: 850,
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            Yakuniy operatsion natija
          </Typography>

          <Typography
            sx={{
              mt: 0.8,

              color:
                "#ffffff !important",

              fontSize: {
                xs: 27,
                md: 34,
              },

              fontWeight: 950,
              letterSpacing: "-.05em",
            }}
          >
            {money(
              report.operational_result,
            )}
          </Typography>

          <Typography
            sx={{
              mt: 0.65,

              color:
                "rgba(255,255,255,.55) !important",

              fontSize: 10.5,
            }}
          >
            {positive
              ? "Tanlangan davr bo‘yicha ijobiy moliyaviy natija."
              : "Tanlangan davr bo‘yicha xarajatlar tushumdan yuqori."}
          </Typography>
        </Box>
      </Card>
    </Stack>
  );
};

const EntryDialog = ({
  name,
  form,
  field,
  close,
  save,
  saving,
  data,
}) => {
  if (!name) return null;

  const input = (
    key,
    label,
    type = "text",
    extra = {},
  ) => (
    <TextField
      type={type}
      label={label}
      value={form[key] ?? ""}
      onChange={field(key)}
      slotProps={
        type === "date"
          ? {
              inputLabel: {
                shrink: true,
              },

              htmlInput:
                extra.htmlInput,
            }
          : extra.htmlInput
            ? {
                htmlInput:
                  extra.htmlInput,
              }
            : undefined
      }
      multiline={extra.multiline}
      minRows={extra.minRows}
      helperText={extra.helperText}
    />
  );

  let fields = null;

  if (name === "payroll") {
    fields = (
      <>
        {input(
          "period_from",
          "Davr boshidan",
          "date",
        )}

        {input(
          "period_to",
          "Davr oxirigacha",
          "date",
        )}

        {input(
          "payment_date",
          "To‘lov sanasi",
          "date",
        )}

        {input(
          "note",
          "Izoh",
          "text",
          {
            multiline: true,
            minRows: 3,
          },
        )}
      </>
    );
  }

  if (name === "line") {
    fields = (
      <>
        {input(
          "daily_earnings",
          "Kunlik",
          "number",
          {
            htmlInput: {
              min: 0,
              step: 1000,
            },
          },
        )}

        {input(
          "bonus",
          "Bonus",
          "number",
          {
            htmlInput: {
              min: 0,
              step: 1000,
            },
          },
        )}

        {input(
          "advance_deduction",
          "Avansdan ushlash",
          "number",
          {
            htmlInput: {
              min: 0,
              step: 1000,
            },
          },
        )}

        {input(
          "other_deduction",
          "Boshqa ushlanma",
          "number",
          {
            htmlInput: {
              min: 0,
              step: 1000,
            },
          },
        )}

        {input(
          "cash_amount",
          "Naqd beriladi",
          "number",
          {
            htmlInput: {
              min: 0,
              step: 1000,
            },
          },
        )}

        {input(
          "note",
          "Izoh",
          "text",
          {
            multiline: true,
            minRows: 3,
          },
        )}
      </>
    );
  }

  if (name === "category") {
    fields = (
      <>
        {input(
          "name",
          "Kategoriya nomi",
        )}

        {input(
          "description",
          "Izoh",
          "text",
          {
            multiline: true,
            minRows: 3,
          },
        )}
      </>
    );
  }

  if (name === "expense") {
    fields = (
      <>
        <TextField
          select
          label="Kategoriya"
          value={
            form.category_id || ""
          }
          onChange={field(
            "category_id",
          )}
        >
          {(data.categories || []).map(
            (item) => (
              <MenuItem
                key={item.id}
                value={item.id}
              >
                {item.name}
              </MenuItem>
            ),
          )}
        </TextField>

        <TextField
          select
          label="Moliyaviy hisob"
          value={
            form.account_id || ""
          }
          onChange={field(
            "account_id",
          )}
        >
          <MenuItem value="">
            Hisobsiz
          </MenuItem>

          {(data.accounts || []).map(
            (item) => (
              <MenuItem
                key={item.id}
                value={item.id}
              >
                {item.name} —{" "}
                {money(item.balance)}
              </MenuItem>
            ),
          )}
        </TextField>

        {input(
          "title",
          "Xarajat nomi",
        )}

        {input(
          "amount",
          "Summa",
          "number",
          {
            htmlInput: {
              min: 0,
              step: 1000,
            },
          },
        )}

        {input(
          "spent_at",
          "Sana",
          "date",
        )}

        {input(
          "note",
          "Izoh",
          "text",
          {
            multiline: true,
            minRows: 3,
          },
        )}
      </>
    );
  }

  if (name === "account") {
    fields = (
      <>
        {input(
          "name",
          "Hisob nomi",
        )}

        <TextField
          select
          label="Hisob turi"
          value={
            form.account_type ||
            "cash"
          }
          onChange={field(
            "account_type",
          )}
        >
          <MenuItem value="cash">
            Naqd
          </MenuItem>

          <MenuItem value="card">
            Karta
          </MenuItem>

          <MenuItem value="bank">
            Bank
          </MenuItem>
        </TextField>

        {input(
          "opening_balance",
          "Boshlang‘ich balans",
          "number",
          {
            htmlInput: {
              min: 0,
              step: 1000,
            },
          },
        )}
      </>
    );
  }

  if (name === "transaction") {
    fields = (
      <>
        <TextField
          select
          label="Hisob"
          value={
            form.account_id || ""
          }
          onChange={field(
            "account_id",
          )}
        >
          {(data.accounts || []).map(
            (item) => (
              <MenuItem
                key={item.id}
                value={item.id}
              >
                {item.name} —{" "}
                {money(item.balance)}
              </MenuItem>
            ),
          )}
        </TextField>

        <TextField
          select
          label="Operatsiya turi"
          value={
            form.transaction_type ||
            "income"
          }
          onChange={field(
            "transaction_type",
          )}
        >
          <MenuItem value="income">
            Kirim
          </MenuItem>

          <MenuItem value="expense">
            Chiqim
          </MenuItem>
        </TextField>

        {input(
          "amount",
          "Summa",
          "number",
          {
            htmlInput: {
              min: 0,
              step: 1000,
            },
          },
        )}

        {input(
          "transacted_at",
          "Sana",
          "date",
        )}

        {input(
          "description",
          "Izoh",
          "text",
          {
            multiline: true,
            minRows: 3,
          },
        )}
      </>
    );
  }

  if (name === "return") {
    fields = (
      <>
        <TextField
          select
          label="Savdo"
          value={
            form.client_sale_id ||
            ""
          }
          onChange={field(
            "client_sale_id",
          )}
        >
          {(data.sales || []).map(
            (item) => {
              const remaining =
                Number(
                  item.quantity || 0,
                ) -
                Number(
                  item.returned_quantity ||
                    0,
                );

              return (
                <MenuItem
                  key={item.id}
                  value={item.id}
                >
                  {item.client_name} /{" "}
                  {item.product_name} /
                  qolgan {remaining}
                </MenuItem>
              );
            },
          )}
        </TextField>

        {input(
          "quantity",
          "Qaytarilgan miqdor",
          "number",
          {
            htmlInput: {
              min: 0,
              step: 1,
            },
          },
        )}

        {input(
          "returned_at",
          "Sana",
          "date",
        )}

        {input(
          "reason",
          "Sabab",
          "text",
          {
            multiline: true,
            minRows: 3,
          },
        )}
      </>
    );
  }

  return (
    <PremiumDialog
      open
      onClose={close}
      title={
        dialogTitles[name] ||
        "Ma’lumot kiritish"
      }
      maxWidth={
        name === "line" ||
        name === "expense"
          ? "md"
          : "sm"
      }
      actions={
        <>
          <Button
            onClick={close}
            disabled={saving}
            sx={dialogCancelSx}
          >
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            disabled={saving}
            onClick={save}
            sx={dialogPrimarySx}
          >
            {saving
              ? "Saqlanmoqda..."
              : "Saqlash"}
          </Button>
        </>
      }
    >
      <Box
        sx={{
          display: "grid",

          gridTemplateColumns:
            name === "line" ||
            name === "expense"
              ? {
                  xs: "1fr",

                  sm: "repeat(2,minmax(0,1fr))",
                }
              : "1fr",

          gap: 1.6,
        }}
      >
        {fields}
      </Box>
    </PremiumDialog>
  );
};

const primaryButtonSx = {
  minHeight: 40,
  px: 2,
  color: "#ffffff",
  borderRadius: "11px",
  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",

  background:
    "linear-gradient(135deg,#7f1d1d,#b91c1c)",

  boxShadow:
    "0 10px 24px rgba(127,29,29,.18)",

  "&:hover": {
    background:
      "linear-gradient(135deg,#681818,#991b1b)",
  },
};

const secondaryButtonSx = {
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

    borderColor:
      "rgba(153,27,27,.22)",

    backgroundColor:
      "rgba(153,27,27,.04)",
  },
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
  minWidth: 110,
  minHeight: 40,
  px: 2,
  color: "#ffffff",
  borderRadius: "11px",
  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",

  background:
    "linear-gradient(135deg,#7f1d1d,#b91c1c)",

  boxShadow:
    "0 10px 24px rgba(127,29,29,.18)",

  "&:hover": {
    background:
      "linear-gradient(135deg,#681818,#991b1b)",
  },
};

const strongCellSx = {
  color: "#334155",
  fontSize: 10.5,
  fontWeight: 900,
};

const greenCellSx = {
  color: "#15803d",
  fontSize: 10.5,
  fontWeight: 950,
};

const redCellSx = {
  color: "#b91c1c",
  fontSize: 10.5,
  fontWeight: 950,
};

const financePageStyles = `
  .crm-page .finance-hero {
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

  .finance-dialog-title {
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

export default Finance;