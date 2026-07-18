import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import {
  createExpense,
  getExpenses,
  getFinancialAccounts,
} from "../../api/finance";
import { hasPermission } from "../../utils/permissions";

const isoDate = (value = new Date()) => value.toISOString().slice(0, 10);
const monthStart = () => {
  const value = new Date();
  value.setDate(1);
  return isoDate(value);
};
const money = (value) =>
  `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
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
      borderRadius: "var(--aa-radius-xl)",
      border: "1px solid var(--aa-border)",
      background: "var(--aa-surface)",
      boxShadow: "var(--aa-shadow-xs)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export default function Expenses() {
  const { user } = useAuth();
  const canManage = hasPermission(user, "finance.manage");
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
        getExpenses({ ...filters, limit: 100, offset: 0 }),
        getFinancialAccounts(),
      ]);
      setRows(expensesResponse.data.expenses || []);
      setTotal(expensesResponse.data.total_amount || 0);
      setAccounts(accountsResponse.data.financial_accounts || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Xarajatlarni yuklab bo'lmadi.",
      );
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
  const averageExpense = rows.length ? Number(total || 0) / rows.length : 0;

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
      toast.error(
        error?.response?.data?.message || "Xarajatni saqlab bo'lmadi.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        pb: 3,
        color: "var(--aa-text)",
        "& .MuiOutlinedInput-root": {
          borderRadius: "var(--aa-radius-md)",
          backgroundColor: "var(--aa-surface-solid)",
        },
      }}
    >
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
            <Chip
              size="small"
              label="Al-amin CRM • kundalik xarajatlar"
              sx={{
                mb: 1,
                height: 25,
                borderRadius: "var(--aa-radius-pill)",
                bgcolor: "var(--aa-brand-50)",
                color: "var(--aa-brand-700)",
                border: "1px solid var(--aa-brand-100)",
                fontWeight: 850,
                fontSize: 11.5,
              }}
            />
            <Typography
              sx={{
                fontSize: { xs: 27, md: 33 },
                fontWeight: 950,
                color: "var(--aa-text)",
              }}
            >
              Mayda xarajatlar
            </Typography>
            <Typography
              sx={{
                mt: 0.6,
                color: "var(--aa-text-secondary)",
                fontWeight: 650,
              }}
            >
              Lampochka, rozetka, yo'l haqi va boshqa kundalik xarajatlarni
              yozib boring.
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
                borderRadius: "var(--aa-radius-md)",
                textTransform: "none",
                fontWeight: 950,
                background: "var(--aa-brand-700)",
                boxShadow: "var(--aa-shadow-sm)",
                "&:hover": { background: "var(--aa-brand-800)" },
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
              borderBottom: "1px solid var(--aa-border)",
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
              InputLabelProps={{ shrink: true }}
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
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="outlined"
              onClick={load}
              sx={{
                borderRadius: "var(--aa-radius-md)",
                textTransform: "none",
                fontWeight: 850,
              }}
            >
              Yangilash
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ minHeight: 260, display: "grid", placeItems: "center" }}>
              <CircularProgress size={30} />
            </Box>
          ) : rows.length === 0 ? (
            <Box
              sx={{
                minHeight: 260,
                p: 3,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900, color: "var(--aa-text)" }}>
                  Tanlangan davrda xarajat yo'q
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    color: "var(--aa-text-tertiary)",
                    fontSize: 14,
                  }}
                >
                  Yangi xarajat kiritsangiz shu yerda ko'rinadi.
                </Typography>
              </Box>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow sx={{ background: "var(--aa-surface-muted)" }}>
                    {[
                      "Xarajat izohi",
                      "Kassa",
                      "Kim kiritdi",
                      "Sana",
                      "Summa",
                    ].map((label) => (
                      <TableCell
                        key={label}
                        sx={{
                          fontWeight: 900,
                          color: "var(--aa-text-secondary)",
                          borderColor: "var(--aa-border)",
                        }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography
                          sx={{ fontWeight: 850, color: "var(--aa-text)" }}
                        >
                          {item.title}
                        </Typography>
                        {item.note && (
                          <Typography
                            sx={{
                              mt: 0.35,
                              fontSize: 12.5,
                              color: "var(--aa-text-tertiary)",
                            }}
                          >
                            {item.note}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.account_name || "Hisobsiz"}</TableCell>
                      <TableCell>{item.created_by_name || "-"}</TableCell>
                      <TableCell>{displayDate(item.spent_at)}</TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 950,
                          color: "var(--aa-danger)",
                          whiteSpace: "nowrap",
                        }}
                      >
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
          <Typography
            sx={{
              color: "var(--aa-text-secondary)",
              fontSize: 13,
              fontWeight: 850,
            }}
          >
            Tanlangan davr
          </Typography>
          <Typography
            sx={{
              mt: 0.7,
              color: "var(--aa-danger)",
              fontSize: 25,
              fontWeight: 950,
            }}
          >
            {money(total)}
          </Typography>
          <Typography
            sx={{ mt: 1.2, color: "var(--aa-text-tertiary)", fontSize: 13 }}
          >
            Jami {rows.length} ta xarajat yozuvi
          </Typography>
          <Box sx={{ mt: 2, pt: 1.7, borderTop: "1px solid var(--aa-border)" }}>
            <Typography
              sx={{
                color: "var(--aa-text-secondary)",
                fontSize: 12.5,
                fontWeight: 750,
              }}
            >
              O'rtacha xarajat
            </Typography>
            <Typography
              sx={{
                mt: 0.45,
                color: "var(--aa-text)",
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              {money(averageExpense)}
            </Typography>
          </Box>
        </Card>
      </Box>

      <Dialog
        open={open}
        onClose={() => !saving && setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "var(--aa-radius-xl)",
            border: "1px solid var(--aa-border)",
            boxShadow: "var(--aa-shadow-lg)",
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2.2,
            fontSize: 21,
            fontWeight: 950,
            borderBottom: "1px solid var(--aa-border)",
          }}
        >
          Yangi mayda xarajat
        </DialogTitle>
        <DialogContent
          sx={{ px: 3, py: "22px !important", display: "grid", gap: 2 }}
        >
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
          <TextField
            select
            label="Qaysi hisobdan to'landi?"
            value={form.account_id}
            onChange={field("account_id")}
          >
            <MenuItem value="">Hisobsiz yozish</MenuItem>
            {accounts.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name} ({money(item.balance)})
              </MenuItem>
            ))}
          </TextField>
          {selectedAccount &&
            Number(selectedAccount.balance) < Number(form.amount || 0) && (
              <Typography
                sx={{
                  px: 1.5,
                  py: 1.2,
                  borderRadius: "var(--aa-radius-sm)",
                  color: "var(--aa-warning)",
                  bgcolor:
                    "color-mix(in srgb, var(--aa-warning) 8%, transparent)",
                  border:
                    "1px solid color-mix(in srgb, var(--aa-warning) 20%, transparent)",
                  fontSize: 13,
                  fontWeight: 750,
                }}
              >
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
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid var(--aa-border)",
            bgcolor: "var(--aa-surface-muted)",
          }}
        >
          <Button
            onClick={() => setOpen(false)}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            sx={{
              minWidth: 120,
              borderRadius: "var(--aa-radius-md)",
              textTransform: "none",
              fontWeight: 900,
              background: "var(--aa-brand-700)",
              "&:hover": { background: "var(--aa-brand-800)" },
            }}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
