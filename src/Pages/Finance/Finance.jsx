import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { getClientSales } from "../../api/clientSales";
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
const money = (v) => `${new Intl.NumberFormat("uz-UZ").format(Number(v || 0))} so'm`;
const date = (v) => (v ? new Date(v).toLocaleDateString("uz-UZ") : "-");
const tabItems = [
  ["payroll", "Haftalik ish haqi"],
  ["expenses", "Xarajatlar"],
  ["accounts", "Kassa va bank"],
  ["returns", "Qaytarishlar"],
  ["profit", "Foyda-zarar"],
];

const Finance = () => {
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
        const r = await getPayrollPeriods({ limit: 100, offset: 0 });
        setData((d) => ({ ...d, periods: r.data.payroll_periods || [] }));
      }
      if (tab === "expenses") {
        const [c, e, a] = await Promise.all([
          getExpenseCategories(),
          getExpenses(filters),
          getFinancialAccounts(),
        ]);
        setData((d) => ({
          ...d,
          categories: c.data.expense_categories || [],
          expenses: e.data.expenses || [],
          expenseTotal: e.data.total_amount || 0,
          accounts: a.data.financial_accounts || [],
        }));
      }
      if (tab === "accounts") {
        const [a, t] = await Promise.all([getFinancialAccounts(), getCashTransactions(filters)]);
        setData((d) => ({
          ...d,
          accounts: a.data.financial_accounts || [],
          transactions: t.data.cash_transactions || [],
        }));
      }
      if (tab === "returns") {
        const [r, s] = await Promise.all([
          getClientReturns(filters),
          getClientSales({ limit: 100, offset: 0 }),
        ]);
        setData((d) => ({
          ...d,
          returns: r.data.client_returns || [],
          sales: s.data.client_sales || [],
        }));
      }
      if (tab === "profit") {
        const r = await getProfitLoss(filters);
        setData((d) => ({ ...d, report: r.data.report || {} }));
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Ma'lumotlarni olishda xato.");
    } finally {
      setLoading(false);
    }
  }, [tab, filters]);
  useEffect(() => {
    load();
  }, [load]);
  const open = (name, values) => {
    setDialog(name);
    setForm(values || {});
  };
  const close = () => {
    setDialog("");
    setForm({});
  };
  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      if (dialog === "payroll") await createPayrollPeriod(form);
      if (dialog === "line")
        await updatePayrollLine(form.id, {
          daily_earnings: +form.daily_earnings || 0,
          bonus: +form.bonus || 0,
          advance_deduction: +form.advance_deduction || 0,
          other_deduction: +form.other_deduction || 0,
          cash_amount: +form.cash_amount || 0,
          note: form.note || null,
        });
      if (dialog === "category") await createExpenseCategory(form);
      if (dialog === "expense")
        await createExpense({
          ...form,
          category_id: +form.category_id,
          account_id: form.account_id ? +form.account_id : null,
          amount: +form.amount,
        });
      if (dialog === "account")
        await createFinancialAccount({
          ...form,
          opening_balance: +form.opening_balance || 0,
        });
      if (dialog === "transaction")
        await createCashTransaction({
          ...form,
          account_id: +form.account_id,
          amount: +form.amount,
        });
      if (dialog === "return")
        await createClientReturn({
          ...form,
          client_sale_id: +form.client_sale_id,
          quantity: +form.quantity,
        });
      toast.success("Saqlandi.");
      close();
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };
  const showPeriod = async (id) => {
    try {
      setDetail((await getPayrollPeriod(id)).data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Haftalik hisob ochilmadi.");
    }
  };
  const closePeriod = async () => {
    try {
      setDetail((await closePayrollPeriod(detail.payroll_period.id)).data);
      load();
      toast.success("Haftalik hisob yopildi.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Yopishda xato.");
    }
  };

  return (
    <Box className="crm-page flex h-full min-h-0 flex-col">
      <Box className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Moliya va hisob
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Korxonaning pul va hisob-kitob markazi
          </Typography>
        </Box>
        {tab !== "payroll" && (
          <Box className="flex gap-2">
            <TextField
              size="small"
              type="date"
              label="Dan"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size="small"
              type="date"
              label="Gacha"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        )}
      </Box>
      <Paper
        elevation={0}
        className="mb-4 flex shrink-0 gap-1 overflow-auto border border-slate-200 p-1"
        sx={{ borderRadius: 2 }}
      >
        {tabItems.map(([k, l]) => (
          <Button
            key={k}
            variant={tab === k ? "contained" : "text"}
            onClick={() => setTab(k)}
            sx={{ whiteSpace: "nowrap" }}
          >
            {l}
          </Button>
        ))}
      </Paper>
      <Box className="min-h-0 flex-1 overflow-auto pr-1">
        {loading ? (
          <Box className="flex min-h-64 items-center justify-center">
            <CircularProgress />
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
              />
            )}
            {tab === "expenses" && <Expenses data={data} open={open} />}
            {tab === "accounts" && <Accounts data={data} open={open} />}
            {tab === "returns" && <Returns data={data} open={open} />}
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

const Grid = ({ heads, rows, onRow }) => (
  <Paper elevation={0} className="overflow-auto border border-slate-200" sx={{ borderRadius: 2 }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          {heads.map((h) => (
            <TableCell key={h} sx={{ fontWeight: 700 }}>
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length ? (
          rows.map((r, i) => (
            <TableRow
              hover
              key={i}
              onClick={() => onRow?.(r._id)}
              sx={{ cursor: onRow ? "pointer" : "default" }}
            >
              {r.cells.map((v, j) => (
                <TableCell key={j}>{v}</TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={heads.length} align="center">
              Ma'lumot topilmadi
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </Paper>
);
const Card = ({ label, value, danger }) => (
  <Paper
    elevation={0}
    className={`border p-4 ${danger ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}
    sx={{ borderRadius: 2 }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={800}>
      {value}
    </Typography>
  </Paper>
);

const Payroll = ({ data, detail, show, open, closePeriod }) => (
  <Box className="space-y-4">
    <Box className="flex justify-end">
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
      >
        Hafta ochish
      </Button>
    </Box>
    <Grid
      heads={["Davr", "To'lov kuni", "Hisoblangan", "Naqd", "Holat"]}
      onRow={show}
      rows={data.periods.map((x) => ({
        _id: x.id,
        cells: [
          `${date(x.period_from)} - ${date(x.period_to)}`,
          date(x.payment_date),
          money(x.total_earned),
          money(x.cash_amount),
          x.status === "closed" ? "Yopilgan" : "Ochiq",
        ],
      }))}
    />
    {detail && (
      <Paper elevation={0} className="border border-slate-200 p-4" sx={{ borderRadius: 2 }}>
        <Box className="mb-3 flex justify-between">
          <Typography fontWeight={800}>Haftalik ish haqi tafsiloti</Typography>
          {detail.payroll_period.status === "open" && (
            <Button variant="outlined" color="success" onClick={closePeriod}>
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
          rows={detail.payroll_lines.map((x) => ({
            cells: [
              `${x.first_name} ${x.last_name}`,
              money(x.piece_earnings),
              money(x.fixed_earnings),
              money(x.daily_earnings),
              money(x.bonus),
              money(x.advance_deduction),
              money(x.other_deduction),
              money(x.cash_amount),
              detail.payroll_period.status === "open" ? (
                <Button size="small" onClick={() => open("line", x)}>
                  O'zgartirish
                </Button>
              ) : (
                "-"
              ),
            ],
          }))}
        />
      </Paper>
    )}
  </Box>
);
const Expenses = ({ data, open }) => (
  <>
    <Box className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <Card label="Davrdagi xarajat" value={money(data.expenseTotal)} danger />
      <Button variant="outlined" onClick={() => open("category", { name: "", description: "" })}>
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
      >
        Xarajat qo'shish
      </Button>
    </Box>
    <Grid
      heads={["Nomi", "Kategoriya", "Hisob", "Summa", "Sana"]}
      rows={data.expenses.map((x) => ({
        cells: [x.title, x.category_name, x.account_name || "-", money(x.amount), date(x.spent_at)],
      }))}
    />
  </>
);
const Accounts = ({ data, open }) => (
  <>
    <Box className="mb-4 flex justify-end gap-2">
      <Button
        variant="outlined"
        onClick={() =>
          open("account", {
            name: "",
            account_type: "cash",
            opening_balance: "",
          })
        }
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
      >
        Kirim-chiqim
      </Button>
    </Box>
    <Box className="mb-4 grid gap-3 md:grid-cols-3">
      {data.accounts.map((x) => (
        <Card key={x.id} label={`${x.name} / ${x.account_type}`} value={money(x.balance)} />
      ))}
    </Box>
    <Grid
      heads={["Hisob", "Turi", "Summa", "Izoh", "Sana"]}
      rows={data.transactions.map((x) => ({
        cells: [
          x.account_name,
          x.transaction_type === "income" ? "Kirim" : "Chiqim",
          money(x.amount),
          x.description || "-",
          date(x.transacted_at),
        ],
      }))}
    />
  </>
);
const Returns = ({ data, open }) => (
  <>
    <Box className="mb-4 flex justify-end">
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
      >
        Qaytarish qo'shish
      </Button>
    </Box>
    <Grid
      heads={["Mijoz", "Mahsulot", "Miqdor", "Summa", "Sabab", "Sana"]}
      rows={data.returns.map((x) => ({
        cells: [
          x.client_name,
          x.product_name,
          x.quantity,
          money(x.amount),
          x.reason || "-",
          date(x.returned_at),
        ],
      }))}
    />
  </>
);
const Profit = ({ report }) => (
  <>
    <Alert severity="info" className="mb-4">
      Ombor tannarxi ulanmaguncha bu operatsion natija hisoblanadi.
    </Alert>
    <Box className="grid gap-3 md:grid-cols-3">
      <Card label="Savdo" value={money(report.sales)} />
      <Card label="Qaytarish" value={money(report.returns)} danger />
      <Card label="Sof tushum" value={money(report.net_revenue)} />
      <Card label="Homashyo" value={money(report.material_costs)} danger />
      <Card label="Ish haqi" value={money(report.payroll_costs)} danger />
      <Card label="Boshqa xarajat" value={money(report.other_expenses)} danger />
      <Card
        label="Operatsion natija"
        value={money(report.operational_result)}
        danger={Number(report.operational_result) < 0}
      />
    </Box>
  </>
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
  if (name === "payroll")
    fields = (
      <>
        {input("period_from", "Dan", "date")}
        {input("period_to", "Gacha", "date")}
        {input("payment_date", "To'lov sanasi", "date")}
        {input("note", "Izoh")}
      </>
    );
  if (name === "line")
    fields = (
      <>
        {input("daily_earnings", "Kunlik", "number")}
        {input("bonus", "Bonus", "number")}
        {input("advance_deduction", "Avansdan ushlash", "number")}
        {input("other_deduction", "Boshqa ushlanma", "number")}
        {input("cash_amount", "Naqd beriladi", "number")}
      </>
    );
  if (name === "category")
    fields = (
      <>
        {input("name", "Kategoriya nomi")}
        {input("description", "Izoh")}
      </>
    );
  if (name === "expense")
    fields = (
      <>
        <TextField
          select
          label="Kategoriya"
          value={form.category_id || ""}
          onChange={field("category_id")}
        >
          {data.categories.map((x) => (
            <MenuItem key={x.id} value={x.id}>
              {x.name}
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
          {data.accounts.map((x) => (
            <MenuItem key={x.id} value={x.id}>
              {x.name}
            </MenuItem>
          ))}
        </TextField>
        {input("title", "Xarajat nomi")}
        {input("amount", "Summa", "number")}
        {input("spent_at", "Sana", "date")}
        {input("note", "Izoh")}
      </>
    );
  if (name === "account")
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
  if (name === "transaction")
    fields = (
      <>
        <TextField
          select
          label="Hisob"
          value={form.account_id || ""}
          onChange={field("account_id")}
        >
          {data.accounts.map((x) => (
            <MenuItem key={x.id} value={x.id}>
              {x.name}
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
  if (name === "return")
    fields = (
      <>
        <TextField
          select
          label="Savdo"
          value={form.client_sale_id || ""}
          onChange={field("client_sale_id")}
        >
          {data.sales.map((x) => (
            <MenuItem key={x.id} value={x.id}>
              {x.client_name} / {x.product_name} / qolgan{" "}
              {Number(x.quantity) - Number(x.returned_quantity || 0)}
            </MenuItem>
          ))}
        </TextField>
        {input("quantity", "Qaytarilgan miqdor", "number")}
        {input("returned_at", "Sana", "date")}
        {input("reason", "Sabab")}
      </>
    );
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={close}>
      <DialogTitle fontWeight={800}>Ma'lumot kiritish</DialogTitle>
      <DialogContent>
        <Box className="mt-2 grid gap-3">{fields}</Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Bekor qilish</Button>
        <Button variant="contained" disabled={saving} onClick={save}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default Finance;
