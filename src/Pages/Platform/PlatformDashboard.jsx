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
  deleteCompany,
  getCompanies,
  getCompanyManagement,
  getSubscriptionPlans,
  resetCompanyAuthenticator,
  updateCompany,
  updateCompanyManagement,
} from "../../api/platform";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
const date = (value) => (value ? new Date(value).toLocaleDateString("uz-UZ") : "-");
const dateParts = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  )
    return null;
  return { year, month, day, utc };
};
const normalizedBillingDay = ({ year, month, day }) => {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day === lastDay ? 30 : Math.min(day, 30);
};
const paymentCalculation = (form) => {
  const from = dateParts(form.period_from);
  const to = dateParts(form.period_to);
  const monthlyPrice = Number(form.monthly_price || 0);
  if (!from || !to || to.utc < from.utc || monthlyPrice < 0)
    return { valid: false, billingDays: 0, grossAmount: 0, discountAmount: 0, amount: 0 };
  const billingDays =
    (to.year - from.year) * 360 +
    (to.month - from.month) * 30 +
    normalizedBillingDay(to) -
    normalizedBillingDay(from) +
    1;
  const grossAmount = Math.round((monthlyPrice * billingDays) / 30);
  const discountValue = Number(form.discount_value || 0);
  const discountAmount = Math.round(
    form.discount_type === "fixed"
      ? discountValue
      : form.discount_type === "percent"
        ? (grossAmount * discountValue) / 100
        : 0,
  );
  const valid =
    billingDays > 0 &&
    discountValue >= 0 &&
    discountAmount <= grossAmount &&
    !(form.discount_type === "percent" && discountValue > 100);
  return {
    valid,
    billingDays,
    grossAmount,
    discountAmount,
    amount: valid ? Math.max(grossAmount - discountAmount, 0) : 0,
  };
};
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
  const [managementLoading, setManagementLoading] = useState(false);

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
        const calculation = paymentCalculation(form);
        if (!calculation.valid) {
          toast.error("To'lov davri yoki chegirma noto'g'ri.");
          setSaving(false);
          return;
        }
        if (calculation.discountAmount > 0 && !String(form.discount_reason || "").trim()) {
          toast.error("Chegirma sababini kiriting.");
          setSaving(false);
          return;
        }
        await createSubscriptionPayment({
          company_id: form.company_id,
          paid_at: form.paid_at,
          period_from: form.period_from,
          period_to: form.period_to,
          discount_type: form.discount_type || "none",
          discount_value: Number(form.discount_value || 0),
          discount_reason: form.discount_reason?.trim() || null,
          note: form.note || null,
        });
      }
      if (dialog === "plan") await updateCompany(form.company_id, { plan_code: form.plan_code });
      if (dialog === "management") {
        await updateCompanyManagement(form.company_id, {
          company: {
            name: form.name,
            phone: form.phone || null,
          },
          super_admin: {
            first_name: form.first_name,
            last_name: form.last_name,
            username: form.username,
            phone: form.admin_phone || null,
            ...(form.password ? { password: form.password } : {}),
          },
        });
      }
      if (dialog === "delete") {
        if (form.confirm_slug !== form.slug) {
          toast.error("Korxona kodini aynan kiriting.");
          setSaving(false);
          return;
        }
        await deleteCompany(form.company_id, form.confirm_slug);
      }
      toast.success(dialog === "delete" ? "Korxona butunlay o'chirildi." : "Saqlandi.");
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

  const openManagement = async (company) => {
    setManagementLoading(true);
    try {
      const { data } = await getCompanyManagement(company.id);
      setForm({
        company_id: company.id,
        name: data.company?.name || "",
        phone: data.company?.phone || "",
        first_name: data.super_admin?.first_name || "",
        last_name: data.super_admin?.last_name || "",
        username: data.super_admin?.username || "",
        admin_phone: data.super_admin?.phone || "",
        totp_enabled: Boolean(data.super_admin?.totp_enabled),
        password: "",
      });
      setDialog("management");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Boshqaruv ma'lumotlarini olishda xato.");
    } finally {
      setManagementLoading(false);
    }
  };

  const resetAuthenticator = async () => {
    if (
      !window.confirm(
        "Super administrator Authenticator sozlamasi va faol sessiyalari o'chiriladi. Davom etilsinmi?",
      )
    )
      return;

    setSaving(true);
    try {
      const { data } = await resetCompanyAuthenticator(form.company_id);
      setForm((current) => ({ ...current, totp_enabled: false }));
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Authenticator sozlamasini tiklashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("platform_token");
    localStorage.removeItem("platform_admin");
    navigate("/platform/login");
  };

  return (
    <Box className="auth-page h-screen overflow-hidden p-4 md:p-7">
      <Box className="crm-page mx-auto flex h-full max-w-7xl flex-col overflow-hidden">
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
          className="flex min-h-0 flex-1 flex-col overflow-hidden border border-slate-200 bg-white"
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
            <Box className="min-h-0 flex-1 overflow-auto">
              <Table sx={{ minWidth: 1220 }}>
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
                        <Typography variant="body2" color="text.secondary">
                          Ishchi: <strong>{company.workers_count}</strong> / {company.max_workers}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mijoz: <strong>{company.clients_count}</strong> / {company.max_clients}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Admin: <strong>{company.admins_count}</strong> / {company.max_admins}
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
                        <Box className="flex justify-end gap-2">
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={managementLoading}
                            onClick={() => openManagement(company)}
                          >
                            Boshqarish
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setForm({ company_id: company.id, plan_code: company.plan_code });
                              setDialog("plan");
                            }}
                          >
                            Reja
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setForm({
                                company_id: company.id,
                                company_name: company.name,
                                plan_code: company.plan_code,
                                plan_name: company.plan_name,
                                monthly_price: company.monthly_price || 0,
                                paid_at: today(),
                                period_from: "",
                                period_to: "",
                                discount_type: "none",
                                discount_value: 0,
                                discount_reason: "",
                                note: "",
                              });
                              setDialog("payment");
                            }}
                          >
                            To'lov
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color={company.status === "active" ? "error" : "success"}
                            onClick={() => toggle(company)}
                          >
                            {company.status === "active" ? "To'xtatish" : "Faollashtirish"}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              setForm({
                                company_id: company.id,
                                company_name: company.name,
                                slug: company.slug,
                                confirm_slug: "",
                              });
                              setDialog("delete");
                            }}
                          >
                            O'chirish
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
        resetAuthenticator={resetAuthenticator}
      />
    </Box>
  );
};

const Entry = ({ dialog, form, setForm, close, save, saving, plans, resetAuthenticator }) => {
  if (!dialog) return null;
  const calculation = paymentCalculation(form);
  const discountNeedsReason =
    dialog === "payment" && calculation.discountAmount > 0 && !form.discount_reason?.trim();
  const paymentInvalid = dialog === "payment" && (!calculation.valid || discountNeedsReason);
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
          {plan.name} - {money(plan.monthly_price)}/oy - {plan.max_workers} ishchi,{" "}
          {plan.max_clients} mijoz, {plan.max_admins} admin
        </MenuItem>
      ))}
    </TextField>
  );
  const title =
    dialog === "company"
      ? "Yangi korxona"
      : dialog === "management"
        ? "Korxonani boshqarish"
        : dialog === "delete"
          ? "Korxonani butunlay o'chirish"
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
              {field("username", "Foydalanuvchi nomi")}
              {field("password", "Parol", "password")}
              {field("admin_phone", "Telefon")}
            </>
          ) : dialog === "management" ? (
            <>
              <Typography fontWeight={800}>Korxona ma'lumotlari</Typography>
              {field("name", "Korxona nomi")}
              {field("phone", "Korxona telefoni")}
              <Typography fontWeight={800} className="pt-2">
                Super administrator
              </Typography>
              {field("first_name", "Ism")}
              {field("last_name", "Familiya")}
              {field("username", "Foydalanuvchi nomi")}
              {field("admin_phone", "Telefon")}
              {field("password", "Yangi parol", "password")}
              <Typography variant="caption" color="text.secondary">
                Parolni o'zgartirmasangiz, bu maydonni bo'sh qoldiring. Amaldagi parol
                ko'rsatilmaydi.
              </Typography>
              <Box className="rounded-xl border border-slate-200 p-3">
                <Typography fontWeight={800}>Google Authenticator</Typography>
                <Typography variant="body2" color="text.secondary" className="mb-2">
                  Holati: {form.totp_enabled ? "Ulangan" : "Hali ulanmagan"}
                </Typography>
                <Button
                  color="warning"
                  variant="outlined"
                  disabled={saving || !form.totp_enabled}
                  onClick={resetAuthenticator}
                >
                  Authenticator'ni qayta sozlash
                </Button>
              </Box>
            </>
          ) : dialog === "delete" ? (
            <>
              <Typography color="error" fontWeight={800}>
                Bu amalni ortga qaytarib bo'lmaydi.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {form.company_name} korxonasidagi foydalanuvchilar, mahsulotlar, savdolar, ish
                haqlari va barcha boshqa ma'lumotlar butunlay o'chadi.
              </Typography>
              <Typography variant="body2">
                Tasdiqlash uchun <strong>{form.slug}</strong> kodini kiriting.
              </Typography>
              {field("confirm_slug", "Korxona kodi")}
            </>
          ) : dialog === "plan" ? (
            planField
          ) : (
            <>
              {form.company_name && <Typography fontWeight={800}>{form.company_name}</Typography>}
              <Typography variant="body2" color="text.secondary">
                {form.plan_name || form.plan_code} tarifi - {money(form.monthly_price)}/30 kun
              </Typography>
              {field("paid_at", "To'lov sanasi", "date")}
              {field("period_from", "Qaysi sanadan", "date")}
              {field("period_to", "Qaysi sanagacha", "date")}
              <TextField
                select
                label="Chegirma turi"
                value={form.discount_type || "none"}
                onChange={(event) =>
                  setForm({
                    ...form,
                    discount_type: event.target.value,
                    discount_value: 0,
                    discount_reason: "",
                  })
                }
              >
                <MenuItem value="none">Chegirmasiz</MenuItem>
                <MenuItem value="fixed">Qat'iy summa</MenuItem>
                <MenuItem value="percent">Foiz</MenuItem>
              </TextField>
              {form.discount_type !== "none" && (
                <>
                  <TextField
                    type="number"
                    label={form.discount_type === "percent" ? "Chegirma foizi" : "Chegirma summasi"}
                    value={form.discount_value ?? 0}
                    onChange={(event) => setForm({ ...form, discount_value: event.target.value })}
                    error={!calculation.valid && Boolean(form.period_from && form.period_to)}
                    inputProps={{ min: 0, max: form.discount_type === "percent" ? 100 : undefined }}
                  />
                  <TextField
                    label="Chegirma sababi"
                    value={form.discount_reason || ""}
                    onChange={(event) => setForm({ ...form, discount_reason: event.target.value })}
                    required={calculation.discountAmount > 0}
                    error={discountNeedsReason}
                    helperText={discountNeedsReason ? "Chegirma sababini yozing" : " "}
                  />
                </>
              )}
              <Box className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Box className="flex justify-between gap-3">
                  <Typography color="text.secondary">Hisoblangan kun</Typography>
                  <Typography fontWeight={800}>{calculation.billingDays || 0} kun</Typography>
                </Box>
                <Box className="mt-2 flex justify-between gap-3">
                  <Typography color="text.secondary">Asosiy summa</Typography>
                  <Typography fontWeight={800}>{money(calculation.grossAmount)}</Typography>
                </Box>
                <Box className="mt-2 flex justify-between gap-3">
                  <Typography color="text.secondary">Chegirma</Typography>
                  <Typography fontWeight={800} color="error.main">
                    - {money(calculation.discountAmount)}
                  </Typography>
                </Box>
                <Box className="mt-3 flex justify-between gap-3 border-t border-slate-200 pt-3">
                  <Typography fontWeight={900}>Yakuniy to'lov</Typography>
                  <Typography fontWeight={900} color="success.main">
                    {money(calculation.amount)}
                  </Typography>
                </Box>
              </Box>
              {field("note", "Izoh")}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Bekor qilish</Button>
        <Button
          variant="contained"
          color={dialog === "delete" ? "error" : "primary"}
          onClick={save}
          disabled={
            saving ||
            paymentInvalid ||
            (dialog === "delete" && form.confirm_slug !== form.slug)
          }
        >
          {saving ? "Bajarilmoqda..." : dialog === "delete" ? "Butunlay o'chirish" : "Saqlash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlatformDashboard;
