import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
const displayDate = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "-";

const emptyForm = () => ({
  title: "",
  amount: "",
  spent_at: isoDate(),
  account_id: "",
  note: "",
});

const Card = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: "20px",
      border: "1px solid rgba(148, 163, 184, 0.22)",
      background: "rgba(255,255,255,0.96)",
      boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export default function Expenses() {
  const { user } = useAuth();
  const canManage = hasPermission(user, "finance.manage");
  const [filters, setFilters] = useState({ date_from: monthStart(), date_to: isoDate() });
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
        getExpenses({ ...filters, limit: 100, offset: 0 }),
        getFinancialAccounts(),
      ]);
      setRows(expensesResponse.data.expenses || []);
      setTotal(expensesResponse.data.total_amount || 0);
      setAccounts(accountsResponse.data.financial_accounts || []);
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

  const field = (name) => (event) =>
    setForm((previous) => ({ ...previous, [name]: event.target.value }));

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Xarajat izohini kiriting.");
      return;
    }
    if (!Number(form.amount) || Number(form.amount) <= 0) {
      toast.error("Xarajat summasini to'g'ri kiriting.");
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
    <Box sx={{ pb: 3 }}>
      <Card sx={{ p: { xs: 2, md: 2.7 }, mb: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: { xs: 27, md: 33 }, fontWeight: 950, color: "#0f172a" }}>
              Mayda xarajatlar
            </Typography>
            <Typography sx={{ mt: 0.6, color: "#64748b", fontWeight: 650 }}>
              Lampochka, rozetka, yo'l haqi va boshqa kundalik xarajatlarni yozib boring.
            </Typography>
          </Box>
          {canManage && (
            <Button
              variant="contained"
              onClick={() => {
                setForm(emptyForm());
                setOpen(true);
              }}
              sx={{
                minHeight: 44,
                px: 2.5,
                borderRadius: "13px",
                textTransform: "none",
                fontWeight: 950,
                background: "linear-gradient(135deg, #8b0101, #b91c1c)",
              }}
            >
              + Xarajat kiritish
            </Button>
          )}
        </Box>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 260px" },
          gap: 2.5,
        }}
      >
        <Card sx={{ overflow: "hidden" }}>
          <Box
            sx={{
              p: 2,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" },
              gap: 1.2,
              borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
            }}
          >
            <TextField
              label="Boshlanish sanasi"
              type="date"
              size="small"
              value={filters.date_from}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, date_from: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Tugash sanasi"
              type="date"
              size="small"
              value={filters.date_to}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, date_to: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="outlined"
              onClick={load}
              sx={{ borderRadius: "11px", textTransform: "none", fontWeight: 850 }}
            >
              Yangilash
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ minHeight: 260, display: "grid", placeItems: "center" }}>
              <CircularProgress size={30} />
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ minHeight: 260, p: 3, display: "grid", placeItems: "center", textAlign: "center" }}>
              <Box>
                <Typography sx={{ fontWeight: 900, color: "#334155" }}>
                  Tanlangan davrda xarajat yo'q
                </Typography>
                <Typography sx={{ mt: 0.5, color: "#94a3b8", fontSize: 14 }}>
                  Yangi xarajat kiritsangiz shu yerda ko'rinadi.
                </Typography>
              </Box>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow sx={{ background: "#f8fafc" }}>
                    {['Xarajat izohi', 'Kassa', 'Kim kiritdi', 'Sana', 'Summa'].map((label) => (
                      <TableCell key={label} sx={{ fontWeight: 900, color: "#475569" }}>
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 850, color: "#0f172a" }}>{item.title}</Typography>
                        {item.note && (
                          <Typography sx={{ mt: 0.35, fontSize: 12.5, color: "#94a3b8" }}>
                            {item.note}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.account_name || "Hisobsiz"}</TableCell>
                      <TableCell>{item.created_by_name || "-"}</TableCell>
                      <TableCell>{displayDate(item.spent_at)}</TableCell>
                      <TableCell sx={{ fontWeight: 950, color: "#b91c1c", whiteSpace: "nowrap" }}>
                        {money(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        <Card sx={{ p: 2.4, alignSelf: "start" }}>
          <Typography sx={{ color: "#64748b", fontSize: 13, fontWeight: 850 }}>
            Tanlangan davr
          </Typography>
          <Typography sx={{ mt: 0.7, color: "#b91c1c", fontSize: 25, fontWeight: 950 }}>
            {money(total)}
          </Typography>
          <Typography sx={{ mt: 1.2, color: "#94a3b8", fontSize: 13 }}>
            Jami {rows.length} ta xarajat yozuvi
          </Typography>
        </Card>
      </Box>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>Yangi mayda xarajat</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
          <TextField
            label="Xarajat izohi"
            placeholder="Masalan: 2 ta lampochka olindi"
            value={form.title}
            onChange={field("title")}
            required
            autoFocus
          />
          <TextField
            label="Xarajat summasi"
            type="number"
            value={form.amount}
            onChange={field("amount")}
            required
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Sana"
            type="date"
            value={form.spent_at}
            onChange={field("spent_at")}
            InputLabelProps={{ shrink: true }}
          />
          <TextField select label="Qaysi hisobdan to'landi?" value={form.account_id} onChange={field("account_id")}>
            <MenuItem value="">Hisobsiz yozish</MenuItem>
            {accounts.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name} ({money(item.balance)})
              </MenuItem>
            ))}
          </TextField>
          {selectedAccount && Number(selectedAccount.balance) < Number(form.amount || 0) && (
            <Typography sx={{ color: "#b45309", fontSize: 13, fontWeight: 750 }}>
              Eslatma: tanlangan hisobdagi balans xarajat summasidan kam.
            </Typography>
          )}
          <TextField
            label="Qo'shimcha izoh (ixtiyoriy)"
            value={form.note}
            onChange={field("note")}
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setOpen(false)} disabled={saving} sx={{ textTransform: "none", fontWeight: 800 }}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            sx={{ minWidth: 120, textTransform: "none", fontWeight: 900, background: "#991b1b" }}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
