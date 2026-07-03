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
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createCompany,
  createSubscriptionPayment,
  getCompanies,
  getSubscriptionPlans,
  updateCompany,
} from "../../api/platform";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
const date = (value) => (value ? new Date(value).toLocaleDateString("uz-UZ") : "-");
const emptyCompany = {
  name: "",
  slug: "",
  phone: "",
  plan_code: "pro",
  subscription_ends_at: "",
  first_name: "",
  last_name: "",
  username: "",
  password: "",
  admin_phone: "",
};

const Stat = ({ label, value, helper, tone = "default" }) => {
  const color =
    tone === "success" ? "text-emerald-700" : tone === "brand" ? "text-red-900" : "text-slate-950";
  return (
    <Paper elevation={0} className="border border-slate-200 bg-white p-4" sx={{ borderRadius: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={900} className={`mt-1 ${color}`}>
        {value}
      </Typography>
      <Typography variant="body2" className="mt-1 text-slate-500">
        {helper}
      </Typography>
    </Paper>
  );
};

const PlanChip = ({ code, name }) => {
  const color = code === "business" ? "error" : code === "pro" ? "primary" : "default";
  return (
    <Chip
      size="small"
      color={color}
      variant={code === "plus" ? "outlined" : "filled"}
      label={name || code || "Rejasiz"}
    />
  );
};

const PlatformDashboard = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState("");
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const totals = useMemo(
    () => ({
      companies: companies.length,
      active: companies.filter((company) => company.status === "active").length,
      users: companies.reduce((sum, company) => sum + Number(company.users_count || 0), 0),
      revenue: companies.reduce((sum, company) => sum + Number(company.total_paid || 0), 0),
    }),
    [companies],
  );

  const load = useCallback(async () => {
    if (!localStorage.getItem("platform_token")) {
      navigate("/platform/login", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const [companiesRes, plansRes] = await Promise.all([getCompanies(), getSubscriptionPlans()]);
      setCompanies(companiesRes.data.companies || []);
      setPlans(plansRes.data.subscription_plans || []);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("platform_token");
        navigate("/platform/login", { replace: true });
      } else toast.error(error?.response?.data?.message || "Korxonalarni olishda xato.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      if (dialog === "company") {
        await createCompany({
          name: form.name,
          slug: form.slug,
          phone: form.phone || null,
          plan_code: form.plan_code,
          subscription_ends_at: form.subscription_ends_at || null,
          super_admin: {
            first_name: form.first_name,
            last_name: form.last_name,
            username: form.username,
            password: form.password,
            phone: form.admin_phone || null,
          },
        });
      }
      if (dialog === "payment") {
        await createSubscriptionPayment({
          company_id: form.company_id,
          amount: Number(form.amount),
          paid_at: form.paid_at,
          period_from: form.period_from || null,
          period_to: form.period_to || null,
          note: form.note || null,
        });
      }
      if (dialog === "plan") await updateCompany(form.company_id, { plan_code: form.plan_code });
      toast.success("Saqlandi.");
      setDialog("");
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (company) => {
    const status = company.status === "active" ? "suspended" : "active";
    try {
      await updateCompany(company.id, {
        status,
        subscription_status: status === "active" ? "active" : "suspended",
      });
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Holatni o'zgartirishda xato.");
    }
  };

  const logout = () => {
    localStorage.removeItem("platform_token");
    localStorage.removeItem("platform_admin");
    navigate("/platform/login");
  };

  return (
    <Box className="auth-page min-h-screen p-4 md:p-7">
      <Box className="crm-page mx-auto max-w-7xl">
        <Box className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <Box>
            <Typography
              variant="overline"
              fontWeight={800}
              className="text-red-900"
              sx={{ letterSpacing: 0 }}
            >
              CRM PLATFORM
            </Typography>
            <Typography variant="h4" fontWeight={900}>
              Korxonalar boshqaruvi
            </Typography>
            <Typography color="text.secondary">
              Obunalar, foydalanuvchilar va tushum nazorati
            </Typography>
          </Box>
          <Box className="flex gap-2">
            <Button variant="outlined" color="inherit" onClick={logout}>
              Chiqish
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setForm(emptyCompany);
                setDialog("company");
              }}
            >
              Korxona qo'shish
            </Button>
          </Box>
        </Box>

        <Box className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Jami korxonalar"
            value={totals.companies}
            helper="Platformadagi barcha mijozlar"
          />
          <Stat
            label="Faol korxonalar"
            value={totals.active}
            helper={`${totals.companies - totals.active} ta faol emas`}
            tone="success"
          />
          <Stat
            label="Jami foydalanuvchilar"
            value={totals.users}
            helper="Barcha korxonalar yig'indisi"
          />
          <Stat
            label="Jami tushum"
            value={money(totals.revenue)}
            helper="Kiritilgan obuna to'lovlari"
            tone="brand"
          />
        </Box>

        <Paper
          elevation={0}
          className="overflow-hidden border border-slate-200 bg-white"
          sx={{ borderRadius: 2 }}
        >
          <Box className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <Box>
              <Typography fontWeight={800}>Korxonalar</Typography>
              <Typography variant="body2" color="text.secondary">
                Reja, limit va obuna holati
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {companies.length} ta
            </Typography>
          </Box>
          {loading ? (
            <Box className="flex min-h-64 items-center justify-center">
              <CircularProgress />
            </Box>
          ) : (
            <Box className="overflow-auto">
              <Table sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow className="bg-slate-50">
                    <TableCell>Korxona</TableCell>
                    <TableCell>Kod</TableCell>
                    <TableCell>Reja</TableCell>
                    <TableCell>Foydalanuvchilar</TableCell>
                    <TableCell>Obuna muddati</TableCell>
                    <TableCell>Jami to'lov</TableCell>
                    <TableCell>Holati</TableCell>
                    <TableCell align="right">Amallar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} hover>
                      <TableCell>
                        <Typography fontWeight={800}>{company.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {company.phone || "Telefon yo'q"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography className="font-mono text-sm">{company.slug}</Typography>
                      </TableCell>
                      <TableCell>
                        <PlanChip code={company.plan_code} name={company.plan_name} />
                        <Typography variant="body2" className="mt-1 text-slate-500">
                          {money(company.monthly_price)}/oy
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={800}>
                          {company.users_count} / {company.max_users || "∞"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          foydalanuvchi
                        </Typography>
                      </TableCell>
                      <TableCell>{date(company.ends_at)}</TableCell>
                      <TableCell>
                        <Typography fontWeight={800}>{money(company.total_paid)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Oxirgi: {date(company.last_paid_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={company.status === "active" ? "Faol" : "To'xtatilgan"}
                          color={company.status === "active" ? "success" : "error"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box className="flex justify-end gap-1">
                          <Button
                            size="small"
                            onClick={() => {
                              setForm({ company_id: company.id, plan_code: company.plan_code });
                              setDialog("plan");
                            }}
                          >
                            Reja
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setForm({
                                company_id: company.id,
                                company_name: company.name,
                                amount: company.monthly_price || "",
                                paid_at: today(),
                                period_from: "",
                                period_to: "",
                                note: "",
                              });
                              setDialog("payment");
                            }}
                          >
                            To'lov
                          </Button>
                          <Button
                            size="small"
                            color={company.status === "active" ? "error" : "success"}
                            onClick={() => toggle(company)}
                          >
                            {company.status === "active" ? "To'xtatish" : "Faollashtirish"}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!companies.length && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        Korxonalar topilmadi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      </Box>
      <Entry
        dialog={dialog}
        form={form}
        setForm={setForm}
        close={() => setDialog("")}
        save={save}
        saving={saving}
        plans={plans}
      />
    </Box>
  );
};

const Entry = ({ dialog, form, setForm, close, save, saving, plans }) => {
  if (!dialog) return null;
  const field = (key, label, type = "text") => (
    <TextField
      type={type}
      label={label}
      value={form[key] || ""}
      onChange={(event) => setForm({ ...form, [key]: event.target.value })}
      slotProps={type === "date" ? { inputLabel: { shrink: true } } : undefined}
    />
  );
  const planField = (
    <TextField
      select
      label="Obuna rejasi"
      value={form.plan_code || ""}
      onChange={(event) => setForm({ ...form, plan_code: event.target.value })}
    >
      {plans.map((plan) => (
        <MenuItem key={plan.code} value={plan.code}>
          {plan.name} — {money(plan.monthly_price)}/oy — {plan.max_users} foydalanuvchi
        </MenuItem>
      ))}
    </TextField>
  );
  const title =
    dialog === "company"
      ? "Yangi korxona"
      : dialog === "plan"
        ? "Obuna rejasini almashtirish"
        : "Obuna to'lovi";
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={close}>
      <DialogTitle fontWeight={900}>{title}</DialogTitle>
      <DialogContent>
        <Box className="mt-2 grid gap-3">
          {dialog === "company" ? (
            <>
              {field("name", "Korxona nomi")}
              {field("slug", "Korxona kodi")}
              {field("phone", "Korxona telefoni")}
              {planField}
              {field("subscription_ends_at", "Obuna tugash sanasi", "date")}
              <Typography fontWeight={800} className="pt-2">
                Super administrator
              </Typography>
              {field("first_name", "Ism")}
              {field("last_name", "Familiya")}
              {field("username", "Username")}
              {field("password", "Parol", "password")}
              {field("admin_phone", "Telefon")}
            </>
          ) : dialog === "plan" ? (
            planField
          ) : (
            <>
              {form.company_name && <Typography fontWeight={800}>{form.company_name}</Typography>}
              {field("amount", "Summa", "number")}
              {field("paid_at", "To'lov sanasi", "date")}
              {field("period_from", "Qaysi sanadan", "date")}
              {field("period_to", "Qaysi sanagacha", "date")}
              {field("note", "Izoh")}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Bekor qilish</Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlatformDashboard;
