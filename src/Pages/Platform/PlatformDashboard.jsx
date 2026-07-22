import { useCallback, useEffect, useMemo, useState } from "react";
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
import ActiveStatusChip from "../../Components/UI/ActiveStatusChip";
import SharedPremiumDialog from "../../Components/UI/PremiumDialog";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Card from "../../Components/UI/AppCard";
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

const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const date = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const dateParts = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const [year, month, day] = match.slice(1).map(Number);

  const utc = new Date(Date.UTC(year, month - 1, day));

  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    utc,
  };
};

const normalizedBillingDay = ({ year, month, day }) => {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return day === lastDay ? 30 : Math.min(day, 30);
};

const paymentCalculation = (form) => {
  const from = dateParts(form.period_from);
  const to = dateParts(form.period_to);

  const monthlyPrice = Number(form.monthly_price || 0);

  if (!from || !to || to.utc < from.utc || monthlyPrice < 0) {
    return {
      valid: false,
      billingDays: 0,
      grossAmount: 0,
      discountAmount: 0,
      amount: 0,
    };
  }

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

const getPlatformAdmin = () => {
  try {
    return JSON.parse(localStorage.getItem("platform_admin") || "null");
  } catch {
    return null;
  }
};

const getInitial = (value) =>
  String(value || "K")
    .trim()
    .slice(0, 1)
    .toUpperCase();

const HeroMetric = (props) => (
  <SharedHeroMetric {...props} valueSx={{ fontSize: 17 }} />
);
const PlanChip = ({ code, name }) => {
  const styles = {
    business: ["#991b1b", "rgba(153,27,27,.08)", "rgba(153,27,27,.17)"],

    pro: ["#1d4ed8", "rgba(37,99,235,.08)", "rgba(37,99,235,.17)"],

    plus: ["#b45309", "rgba(245,158,11,.09)", "rgba(245,158,11,.19)"],
  };

  const current = styles[code] || ["#64748b", "#f1f5f9", "#e2e8f0"];

  return (
    <Chip
      size="small"
      label={name || code || "Rejasiz"}
      sx={{
        height: 25,
        px: 0.25,

        color: current[0],

        fontSize: 9.5,
        fontWeight: 900,

        backgroundColor: current[1],

        border: `1px solid ${current[2]}`,
      }}
    />
  );
};

const StatusChip = ({ status }) => (
  <ActiveStatusChip
    active={status === "active"}
    inactiveLabel="To‘xtatilgan"
    height={25}
    px={0.25}
  />
);
const UsageBar = ({ label, value, limit, tone = "red" }) => {
  const colors = {
    red: "linear-gradient(90deg,#991b1b,#dc2626)",

    blue: "linear-gradient(90deg,#1d4ed8,#60a5fa)",

    green: "linear-gradient(90deg,#15803d,#4ade80)",
  };

  const maximum = Math.max(Number(limit || 0), 1);

  const percentage = Math.min(
    (Number(value || 0) / maximum) * 100,

    100,
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",

          justifyContent: "space-between",

          gap: 1.5,
        }}
      >
        <Typography
          sx={{
            color: "#64748b",
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            color: "#334155",
            fontSize: 9,
            fontWeight: 950,
          }}
        >
          {number(value)} / {number(limit)}
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 0.55,
          height: 5,
          overflow: "hidden",
          borderRadius: 99,

          backgroundColor: "#edf1f5",
        }}
      >
        <Box
          sx={{
            width: `${percentage}%`,
            height: "100%",
            borderRadius: 99,

            background: colors[tone] || colors.red,
          }}
        />
      </Box>
    </Box>
  );
};

const SummaryBox = ({ label, value, tone = "default" }) => {
  const tones = {
    default: ["#334155", "#ffffff", "#e7ebf0"],

    red: ["#991b1b", "rgba(153,27,27,.07)", "rgba(153,27,27,.16)"],

    green: ["#15803d", "rgba(34,197,94,.07)", "rgba(34,197,94,.17)"],

    blue: ["#1d4ed8", "rgba(37,99,235,.07)", "rgba(37,99,235,.17)"],

    amber: ["#b45309", "rgba(245,158,11,.09)", "rgba(245,158,11,.19)"],
  };

  const current = tones[tone] || tones.default;

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.45,
        borderRadius: "15px",

        color: current[0],

        backgroundColor: current[1],

        border: `1px solid ${current[2]}`,
      }}
    >
      <Typography
        sx={{
          color: "#94a3b8",
          fontSize: 9,
          fontWeight: 800,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.55,
          color: "inherit",
          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const PremiumDialog = (props) => <SharedPremiumDialog titleClassName="platform-dashboard-dialog-title" contentSx={{ py: "24px !important" }} {...props} />;
const PlatformDashboard = () => {
  const navigate = useNavigate();

  const platformAdmin = getPlatformAdmin();

  const [companies, setCompanies] = useState([]);

  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);

  const [dialog, setDialog] = useState("");

  const [form, setForm] = useState({});

  const [saving, setSaving] = useState(false);

  const [managementLoadingId, setManagementLoadingId] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [query, setQuery] = useState("");

  const [planFilter, setPlanFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState("");

  const totals = useMemo(
    () => ({
      companies: companies.length,

      active: companies.filter((company) => company.status === "active").length,

      users: companies.reduce(
        (sum, company) => sum + Number(company.users_count || 0),

        0,
      ),

      revenue: companies.reduce(
        (sum, company) => sum + Number(company.total_paid || 0),

        0,
      ),
    }),

    [companies],
  );

  const filteredCompanies = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("uz-UZ");

    return companies.filter((company) => {
      const matchesQuery =
        !needle ||
        [company.name, company.slug, company.phone, company.plan_name, company.plan_code]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("uz-UZ")
          .includes(needle);

      const matchesPlan = !planFilter || company.plan_code === planFilter;

      const matchesStatus = !statusFilter || company.status === statusFilter;

      return matchesQuery && matchesPlan && matchesStatus;
    });
  }, [companies, planFilter, query, statusFilter]);

  const load = useCallback(async () => {
    if (!localStorage.getItem("platform_token")) {
      navigate("/platform/login", {
        replace: true,
      });

      return;
    }

    setLoading(true);

    try {
      const [companiesRes, plansRes] = await Promise.all([getCompanies(), getSubscriptionPlans()]);

      const companiesData = companiesRes?.data || companiesRes || {};

      const plansData = plansRes?.data || plansRes || {};

      setCompanies(companiesData.companies || []);

      setPlans(plansData.subscription_plans || []);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("platform_token");

        localStorage.removeItem("platform_admin");

        navigate("/platform/login", {
          replace: true,
        });
      } else {
        toast.error(error?.response?.data?.message || "Korxonalarni olishda xato.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const closeDialog = () => {
    if (saving) return;

    setDialog("");
    setForm({});
  };

  const save = async () => {
    setSaving(true);

    try {
      if (dialog === "company") {
        if (
          !form.name?.trim() ||
          !form.slug?.trim() ||
          !form.first_name?.trim() ||
          !form.last_name?.trim() ||
          !form.username?.trim() ||
          !form.password
        ) {
          toast.error("Korxona va super administrator ma’lumotlarini to‘ldiring.");

          return;
        }

        await createCompany({
          name: form.name.trim(),

          slug: form.slug.trim(),

          phone: form.phone?.trim() || null,

          plan_code: form.plan_code,

          subscription_ends_at: form.subscription_ends_at || null,

          super_admin: {
            first_name: form.first_name.trim(),

            last_name: form.last_name.trim(),

            username: form.username.trim(),

            password: form.password,

            phone: form.admin_phone?.trim() || null,
          },
        });
      }

      if (dialog === "payment") {
        const calculation = paymentCalculation(form);

        if (!calculation.valid) {
          toast.error("To‘lov davri yoki chegirma noto‘g‘ri.");

          return;
        }

        if (calculation.discountAmount > 0 && !String(form.discount_reason || "").trim()) {
          toast.error("Chegirma sababini kiriting.");

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

          note: form.note?.trim() || null,
        });
      }

      if (dialog === "plan") {
        await updateCompany(form.company_id, {
          plan_code: form.plan_code,
        });
      }

      if (dialog === "management") {
        await updateCompanyManagement(form.company_id, {
          company: {
            name: form.name?.trim(),

            phone: form.phone?.trim() || null,
          },

          super_admin: {
            first_name: form.first_name?.trim(),

            last_name: form.last_name?.trim(),

            username: form.username?.trim(),

            phone: form.admin_phone?.trim() || null,

            ...(form.password
              ? {
                  password: form.password,
                }
              : {}),
          },
        });
      }

      if (dialog === "delete") {
        if (form.confirm_slug !== form.slug) {
          toast.error("Korxona kodini aynan kiriting.");

          return;
        }

        await deleteCompany(form.company_id, form.confirm_slug);
      }

      toast.success(dialog === "delete" ? "Korxona butunlay o‘chirildi." : "Saqlandi.");

      setDialog("");
      setForm({});

      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (company) => {
    const status = company.status === "active" ? "suspended" : "active";

    setActionLoadingId(company.id);

    try {
      await updateCompany(company.id, {
        status,

        subscription_status: status === "active" ? "active" : "suspended",
      });

      toast.success(status === "active" ? "Korxona faollashtirildi." : "Korxona to‘xtatildi.");

      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Holatni o‘zgartirishda xato.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openManagement = async (company) => {
    setManagementLoadingId(company.id);

    try {
      const response = await getCompanyManagement(company.id);

      const data = response?.data || response || {};

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
      toast.error(error?.response?.data?.message || "Boshqaruv ma’lumotlarini olishda xato.");
    } finally {
      setManagementLoadingId(null);
    }
  };

  const resetAuthenticator = async () => {
    if (
      !window.confirm(
        "Super administrator Authenticator sozlamasi va faol sessiyalari o‘chiriladi. Davom etilsinmi?",
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      const response = await resetCompanyAuthenticator(form.company_id);

      const data = response?.data || response || {};

      setForm((current) => ({
        ...current,

        totp_enabled: false,
      }));

      toast.success(data.message || "Authenticator sozlamasi tiklandi.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Authenticator sozlamasini tiklashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("platform_token");

    localStorage.removeItem("platform_admin");

    navigate("/platform/login", {
      replace: true,
    });
  };

  const resetFilters = () => {
    setQuery("");
    setPlanFilter("");
    setStatusFilter("");
  };

  return (
    <Box
      className="platform-dashboard-page"
      sx={{
        minHeight: "100vh",

        p: {
          xs: 1.5,
          sm: 2.5,
          lg: 3,
        },

        backgroundColor: "#f4f6f8",

        backgroundImage:
          "radial-gradient(circle at 0% 0%,rgba(153,27,27,.07),transparent 28%),radial-gradient(circle at 100% 100%,rgba(15,23,42,.06),transparent 32%)",
      }}
    >
      <style>{platformDashboardStyles}</style>

      <Box
        sx={{
          width: "100%",
          maxWidth: 1600,
          mx: "auto",
        }}
      >
        <Box
          component="section"
          className="platform-dashboard-hero"
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
                  Platforma boshqaruv markazi
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
                Korxonalar boshqaruvi
              </Typography>

              <Typography
                sx={{
                  maxWidth: 560,
                  mt: 1.4,

                  color: "rgba(255,255,255,.45) !important",

                  fontSize: 12.5,
                  lineHeight: 1.75,
                }}
              >
                Korxonalar, obuna rejalari, foydalanuvchi limitlari va platforma tushumlarini yagona
                boshqaruv markazidan nazorat qiling.
              </Typography>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
                sx={{ mt: 2.35 }}
              >
                <Button
                  onClick={() => {
                    setForm(emptyCompany);

                    setDialog("company");
                  }}
                  sx={heroPrimaryButtonSx}
                >
                  + Korxona qo‘shish
                </Button>

                <Button onClick={logout} sx={heroSecondaryButtonSx}>
                  Platformadan chiqish
                </Button>
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,

                    color: "#ffffff",

                    fontSize: 10,
                    fontWeight: 950,

                    background: "linear-gradient(135deg,#7f1d1d,#dc2626)",

                    border: "2px solid rgba(255,255,255,.10)",
                  }}
                >
                  {getInitial(
                    platformAdmin?.first_name || platformAdmin?.name || platformAdmin?.username,
                  )}
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,.72) !important",

                      fontSize: 9.5,
                      fontWeight: 900,
                    }}
                  >
                    {platformAdmin?.first_name || platformAdmin?.name || "Platform admin"}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,

                      color: "rgba(255,255,255,.28) !important",

                      fontSize: 8.5,
                    }}
                  >
                    @{platformAdmin?.username || "administrator"}
                  </Typography>
                </Box>
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
              <HeroMetric
                label="Jami korxonalar"
                value={number(totals.companies)}
                helper="Platformadagi barcha mijozlar"
                tone="blue"
              />

              <HeroMetric
                label="Faol korxonalar"
                value={number(totals.active)}
                helper={`${number(totals.companies - totals.active)} ta faol emas`}
                tone="green"
              />

              <HeroMetric
                label="Foydalanuvchilar"
                value={number(totals.users)}
                helper="Barcha korxonalar yig‘indisi"
                tone="amber"
              />

              <HeroMetric
                label="Jami tushum"
                value={money(totals.revenue)}
                helper="Kiritilgan obuna to‘lovlari"
                tone="red"
              />
            </Box>
          </Box>
        </Box>

        <Card
          sx={{
            mb: 2,
            p: 2,
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

              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",

                  sm: "repeat(2,minmax(0,1fr))",

                  lg: "minmax(260px,2fr) repeat(2,minmax(160px,1fr))",
                },

                gap: 1.2,
                flex: 1,
              }}
            >
              <TextField
                size="small"
                label="Korxonani qidirish"
                placeholder="Nomi, kodi, telefon yoki reja"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />

              <TextField
                select
                size="small"
                label="Obuna rejasi"
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
              >
                <MenuItem value="">Barcha rejalar</MenuItem>

                {plans.map((plan) => (
                  <MenuItem key={plan.code} value={plan.code}>
                    {plan.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Korxona holati"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="">Barcha holatlar</MenuItem>

                <MenuItem value="active">Faol</MenuItem>

                <MenuItem value="suspended">To‘xtatilgan</MenuItem>
              </TextField>
            </Box>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
            >
              <Button variant="outlined" onClick={resetFilters} sx={secondaryButtonSx}>
                Tozalash
              </Button>

              <Button variant="outlined" onClick={load} disabled={loading} sx={secondaryButtonSx}>
                Yangilash
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  setForm(emptyCompany);

                  setDialog("company");
                }}
                sx={primaryButtonSx}
              >
                + Korxona qo‘shish
              </Button>
            </Stack>
          </Box>
        </Card>

        <Card
          sx={{
            minHeight: 520,
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
                Platformadagi korxonalar
              </Typography>

              <Typography
                sx={{
                  mt: 0.45,
                  color: "#94a3b8",
                  fontSize: 10.5,
                }}
              >
                Obuna, limit, tushum va boshqaruv ma’lumotlari
              </Typography>
            </Box>

            <Chip
              size="small"
              label={`${number(filteredCompanies.length)} ta`}
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
                minHeight: 380,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Box
                sx={{
                  textAlign: "center",
                }}
              >
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
                  Korxonalar yuklanmoqda...
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                overflowX: "auto",
              }}
            >
              <Table
                sx={{
                  minWidth: 1420,

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

                    verticalAlign: "middle",
                  },

                  "& tbody tr:hover": {
                    backgroundColor: "rgba(153,27,27,.025)",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Korxona</TableCell>

                    <TableCell>Kod</TableCell>

                    <TableCell>Reja</TableCell>

                    <TableCell>Foydalanuvchi limitlari</TableCell>

                    <TableCell>Obuna muddati</TableCell>

                    <TableCell>To‘lovlar</TableCell>

                    <TableCell>Holati</TableCell>

                    <TableCell align="right">Amallar</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredCompanies.length ? (
                    filteredCompanies.map((company) => (
                      <TableRow key={company.id} hover>
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
                                width: 48,
                                height: 48,

                                color: "#ffffff",

                                fontSize: 13,

                                fontWeight: 950,

                                background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",

                                border: "3px solid #ffffff",

                                boxShadow: "0 8px 20px rgba(127,29,29,.16)",
                              }}
                            >
                              {getInitial(company.name)}
                            </Avatar>

                            <Box
                              sx={{
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                noWrap
                                sx={{
                                  maxWidth: 220,

                                  color: "#334155",

                                  fontSize: 12.5,

                                  fontWeight: 900,
                                }}
                              >
                                {company.name}
                              </Typography>

                              <Typography
                                noWrap
                                sx={{
                                  maxWidth: 220,

                                  mt: 0.4,

                                  color: "#94a3b8",

                                  fontSize: 9.5,
                                }}
                              >
                                {company.phone || "Telefon kiritilmagan"}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box
                            component="code"
                            sx={{
                              px: 1,
                              py: 0.6,

                              display: "inline-block",

                              color: "#475569",

                              borderRadius: "9px",

                              backgroundColor: "#f1f5f9",

                              border: "1px solid #e2e8f0",

                              fontSize: 9.5,

                              fontWeight: 850,
                            }}
                          >
                            {company.slug || "-"}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <PlanChip code={company.plan_code} name={company.plan_name} />

                          <Typography
                            sx={{
                              mt: 0.6,

                              color: "#475569",

                              fontSize: 9.5,

                              fontWeight: 900,
                            }}
                          >
                            {money(company.monthly_price)} / oy
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack
                            spacing={1}
                            sx={{
                              minWidth: 190,
                            }}
                          >
                            <UsageBar
                              label="Ishchi"
                              value={company.workers_count}
                              limit={company.max_workers}
                              tone="red"
                            />

                            <UsageBar
                              label="Mijoz"
                              value={company.clients_count}
                              limit={company.max_clients}
                              tone="blue"
                            />

                            <UsageBar
                              label="Admin"
                              value={company.admins_count}
                              limit={company.max_admins}
                              tone="green"
                            />
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Typography
                            sx={{
                              color: "#334155",

                              fontSize: 10.5,

                              fontWeight: 900,
                            }}
                          >
                            {date(company.ends_at || company.subscription_ends_at)}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.4,

                              color: "#94a3b8",

                              fontSize: 9,
                            }}
                          >
                            Obuna tugash sanasi
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography
                            sx={{
                              color: "#15803d",

                              fontSize: 11.5,

                              fontWeight: 950,
                            }}
                          >
                            {money(company.total_paid)}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.4,

                              color: "#94a3b8",

                              fontSize: 9,
                            }}
                          >
                            Oxirgi: {date(company.last_paid_at)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <StatusChip status={company.status} />
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.75}
                            useFlexGap
                            sx={{
                              justifyContent: "flex-end",

                              flexWrap: "wrap",

                              minWidth: 410,
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={managementLoadingId === company.id}
                              onClick={() => openManagement(company)}
                              sx={tableActionSx}
                            >
                              {managementLoadingId === company.id ? "Ochilmoqda..." : "Boshqarish"}
                            </Button>

                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setForm({
                                  company_id: company.id,

                                  company_name: company.name,

                                  plan_code: company.plan_code,
                                });

                                setDialog("plan");
                              }}
                              sx={tableActionSx}
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
                              sx={tableActionSx}
                            >
                              To‘lov
                            </Button>

                            <Button
                              size="small"
                              variant="contained"
                              color={company.status === "active" ? "error" : "success"}
                              disabled={actionLoadingId === company.id}
                              onClick={() => toggle(company)}
                              sx={tableActionSx}
                            >
                              {actionLoadingId === company.id
                                ? "Bajarilmoqda..."
                                : company.status === "active"
                                  ? "To‘xtatish"
                                  : "Faollashtirish"}
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
                              sx={tableActionSx}
                            >
                              O‘chirish
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        align="center"
                        sx={{
                          py: 8,

                          color: "#94a3b8",

                          fontWeight: 850,
                        }}
                      >
                        Korxonalar topilmadi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Card>
      </Box>

      <Entry
        dialog={dialog}
        form={form}
        setForm={setForm}
        close={closeDialog}
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

  const field = (key, label, type = "text", extra = {}) => (
    <TextField
      fullWidth
      type={type}
      label={label}
      value={form[key] ?? ""}
      onChange={(event) =>
        setForm((current) => ({
          ...current,

          [key]: event.target.value,
        }))
      }
      autoComplete={extra.autoComplete}
      multiline={extra.multiline}
      minRows={extra.minRows}
      helperText={extra.helperText}
      required={extra.required}
      slotProps={{
        ...(type === "date"
          ? {
              inputLabel: {
                shrink: true,
              },
            }
          : {}),

        ...(extra.htmlInput
          ? {
              htmlInput: extra.htmlInput,
            }
          : {}),
      }}
    />
  );

  const planField = (
    <TextField
      select
      fullWidth
      required
      label="Obuna rejasi"
      value={form.plan_code || ""}
      onChange={(event) =>
        setForm((current) => ({
          ...current,

          plan_code: event.target.value,
        }))
      }
    >
      {plans.map((plan) => (
        <MenuItem key={plan.code} value={plan.code}>
          {plan.name} — {money(plan.monthly_price)} / oy — {plan.max_workers} ishchi,{" "}
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
          ? "Korxonani butunlay o‘chirish"
          : dialog === "plan"
            ? "Obuna rejasini almashtirish"
            : "Obuna to‘lovi";

  const subtitle =
    dialog === "company"
      ? "Korxona, obuna va super administrator ma’lumotlarini kiriting"
      : dialog === "management"
        ? "Korxona va super administrator ma’lumotlarini boshqaring"
        : dialog === "delete"
          ? "Bu amal korxonadagi barcha ma’lumotlarni qaytarib bo‘lmaydigan tarzda o‘chiradi"
          : dialog === "plan"
            ? "Korxona uchun yangi obuna rejasini tanlang"
            : "To‘lov davri, chegirma va yakuniy summani kiriting";

  return (
    <PremiumDialog
      open
      onClose={close}
      title={title}
      subtitle={subtitle}
      maxWidth={
        dialog === "company" || dialog === "management" || dialog === "payment" ? "md" : "sm"
      }
      actions={
        <>
          <Button onClick={close} disabled={saving} sx={dialogCancelSx}>
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            color={dialog === "delete" ? "error" : "primary"}
            onClick={save}
            disabled={
              saving || paymentInvalid || (dialog === "delete" && form.confirm_slug !== form.slug)
            }
            sx={
              dialog === "delete"
                ? {
                    minWidth: 150,
                    minHeight: 40,

                    borderRadius: "11px",

                    fontSize: 10.5,
                    fontWeight: 900,

                    textTransform: "none",
                  }
                : dialogPrimarySx
            }
          >
            {saving ? "Bajarilmoqda..." : dialog === "delete" ? "Butunlay o‘chirish" : "Saqlash"}
          </Button>
        </>
      }
    >
      {dialog === "company" && (
        <Stack spacing={2.2}>
          <Box sx={dialogSectionSx}>
            <Typography sx={sectionTitleSx}>Korxona ma’lumotlari</Typography>

            <Typography sx={sectionSubtitleSx}>
              Korxona nomi, kodi, telefon raqami va obuna rejasini kiriting
            </Typography>

            <Box sx={formGridSx}>
              {field("name", "Korxona nomi", "text", {
                required: true,
              })}

              {field("slug", "Korxona kodi", "text", {
                required: true,
              })}

              {field("phone", "Korxona telefoni")}

              {planField}

              {field("subscription_ends_at", "Obuna tugash sanasi", "date")}
            </Box>
          </Box>

          <Box sx={dialogSectionSx}>
            <Typography sx={sectionTitleSx}>Super administrator</Typography>

            <Typography sx={sectionSubtitleSx}>
              Korxonaga birinchi bo‘lib kiradigan bosh administrator ma’lumotlari
            </Typography>

            <Box sx={formGridSx}>
              {field("first_name", "Ism", "text", {
                required: true,
              })}

              {field("last_name", "Familiya", "text", {
                required: true,
              })}

              {field("username", "Foydalanuvchi nomi", "text", {
                required: true,

                autoComplete: "username",
              })}

              {field("password", "Parol", "password", {
                required: true,

                autoComplete: "new-password",
              })}

              {field("admin_phone", "Administrator telefoni")}
            </Box>
          </Box>
        </Stack>
      )}

      {dialog === "management" && (
        <Stack spacing={2.2}>
          <Box sx={dialogSectionSx}>
            <Typography sx={sectionTitleSx}>Korxona ma’lumotlari</Typography>

            <Typography sx={sectionSubtitleSx}>
              Korxona nomi va aloqa ma’lumotlarini yangilang
            </Typography>

            <Box sx={formGridSx}>
              {field("name", "Korxona nomi", "text", {
                required: true,
              })}

              {field("phone", "Korxona telefoni")}
            </Box>
          </Box>

          <Box sx={dialogSectionSx}>
            <Typography sx={sectionTitleSx}>Super administrator</Typography>

            <Typography sx={sectionSubtitleSx}>
              Administrator profilini va kerak bo‘lsa parolini yangilang
            </Typography>

            <Box sx={formGridSx}>
              {field("first_name", "Ism", "text", {
                required: true,
              })}

              {field("last_name", "Familiya", "text", {
                required: true,
              })}

              {field("username", "Foydalanuvchi nomi", "text", {
                required: true,

                autoComplete: "username",
              })}

              {field("admin_phone", "Administrator telefoni")}

              {field("password", "Yangi parol", "password", {
                autoComplete: "new-password",

                helperText: "Parol o‘zgarmasa maydonni bo‘sh qoldiring.",
              })}
            </Box>
          </Box>

          <Box
            sx={{
              p: 1.7,

              display: "flex",

              alignItems: {
                xs: "flex-start",
                sm: "center",
              },

              justifyContent: "space-between",

              flexDirection: {
                xs: "column",
                sm: "row",
              },

              gap: 1.5,
              borderRadius: "17px",

              border: form.totp_enabled
                ? "1px solid rgba(245,158,11,.20)"
                : "1px solid rgba(34,197,94,.17)",

              backgroundColor: form.totp_enabled ? "rgba(245,158,11,.055)" : "rgba(34,197,94,.045)",
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#334155",
                  fontSize: 11.5,
                  fontWeight: 950,
                }}
              >
                Google Authenticator
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,

                  color: form.totp_enabled ? "#b45309" : "#15803d",

                  fontSize: 9.5,
                  fontWeight: 850,
                }}
              >
                Holati: {form.totp_enabled ? "Ulangan" : "Hali ulanmagan"}
              </Typography>
            </Box>

            <Button
              color="warning"
              variant="outlined"
              disabled={saving || !form.totp_enabled}
              onClick={resetAuthenticator}
              sx={secondaryButtonSx}
            >
              Authenticator’ni qayta sozlash
            </Button>
          </Box>
        </Stack>
      )}

      {dialog === "delete" && (
        <Stack spacing={2}>
          <Box
            sx={{
              p: 1.7,
              borderRadius: "17px",
              color: "#b91c1c",

              backgroundColor: "rgba(220,38,38,.06)",

              border: "1px solid rgba(220,38,38,.18)",
            }}
          >
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: 950,
              }}
            >
              Bu amalni ortga qaytarib bo‘lmaydi
            </Typography>

            <Typography
              sx={{
                mt: 0.65,
                color: "#64748b",
                fontSize: 10,
                lineHeight: 1.65,
              }}
            >
              <strong>{form.company_name}</strong> korxonasidagi foydalanuvchilar, mahsulotlar,
              savdolar, ish haqlari va barcha boshqa ma’lumotlar butunlay o‘chadi.
            </Typography>
          </Box>

          <Typography
            sx={{
              color: "#475569",
              fontSize: 10.5,
              lineHeight: 1.65,
            }}
          >
            Tasdiqlash uchun <strong>{form.slug}</strong> kodini aynan kiriting.
          </Typography>

          {field("confirm_slug", "Korxona kodi", "text", {
            required: true,
          })}
        </Stack>
      )}

      {dialog === "plan" && (
        <Stack spacing={2}>
          {form.company_name && (
            <Box sx={dialogSectionSx}>
              <Typography sx={sectionSubtitleSx}>Tanlangan korxona</Typography>

              <Typography sx={sectionTitleSx}>{form.company_name}</Typography>
            </Box>
          )}

          {planField}
        </Stack>
      )}

      {dialog === "payment" && (
        <Stack spacing={2.1}>
          <Box sx={dialogSectionSx}>
            <Typography sx={sectionSubtitleSx}>Tanlangan korxona</Typography>

            <Typography sx={sectionTitleSx}>{form.company_name || "Korxona"}</Typography>

            <Box
              sx={{
                mt: 1.2,
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <PlanChip code={form.plan_code} name={form.plan_name} />

              <Chip
                size="small"
                label={`${money(form.monthly_price)} / 30 kun`}
                sx={{
                  height: 25,
                  color: "#15803d",
                  fontSize: 9.5,
                  fontWeight: 900,

                  backgroundColor: "rgba(34,197,94,.08)",

                  border: "1px solid rgba(34,197,94,.17)",
                }}
              />
            </Box>
          </Box>

          <Box sx={formGridSx}>
            {field("paid_at", "To‘lov sanasi", "date", {
              required: true,
            })}

            {field("period_from", "Qaysi sanadan", "date", {
              required: true,
            })}

            {field("period_to", "Qaysi sanagacha", "date", {
              required: true,
            })}

            <TextField
              select
              fullWidth
              label="Chegirma turi"
              value={form.discount_type || "none"}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,

                  discount_type: event.target.value,

                  discount_value: 0,

                  discount_reason: "",
                }))
              }
            >
              <MenuItem value="none">Chegirmasiz</MenuItem>

              <MenuItem value="fixed">Qat’iy summa</MenuItem>

              <MenuItem value="percent">Foiz</MenuItem>
            </TextField>

            {form.discount_type !== "none" && (
              <>
                <TextField
                  fullWidth
                  type="number"
                  label={form.discount_type === "percent" ? "Chegirma foizi" : "Chegirma summasi"}
                  value={form.discount_value ?? 0}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      discount_value: event.target.value,
                    }))
                  }
                  error={!calculation.valid && Boolean(form.period_from && form.period_to)}
                  slotProps={{
                    htmlInput: {
                      min: 0,

                      max: form.discount_type === "percent" ? 100 : undefined,

                      step: form.discount_type === "percent" ? 1 : 1000,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Chegirma sababi"
                  value={form.discount_reason || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      discount_reason: event.target.value,
                    }))
                  }
                  required={calculation.discountAmount > 0}
                  error={discountNeedsReason}
                  helperText={discountNeedsReason ? "Chegirma sababini yozing" : " "}
                />
              </>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2,minmax(0,1fr))",

                md: "repeat(4,minmax(0,1fr))",
              },

              gap: 1.2,
              p: 1.5,
              borderRadius: "18px",

              border: calculation.valid ? "1px solid #e7ebf0" : "1px solid rgba(220,38,38,.20)",

              backgroundColor: calculation.valid ? "#f8fafc" : "rgba(220,38,38,.045)",
            }}
          >
            <SummaryBox
              label="Hisoblangan kun"
              value={`${number(calculation.billingDays)} kun`}
              tone="blue"
            />

            <SummaryBox label="Asosiy summa" value={money(calculation.grossAmount)} tone="amber" />

            <SummaryBox
              label="Chegirma"
              value={`- ${money(calculation.discountAmount)}`}
              tone="red"
            />

            <SummaryBox label="Yakuniy to‘lov" value={money(calculation.amount)} tone="green" />
          </Box>

          {field("note", "Izoh", "text", {
            multiline: true,
            minRows: 3,
          })}
        </Stack>
      )}
    </PremiumDialog>
  );
};

const heroPrimaryButtonSx = {
  minHeight: 43,
  px: 2.2,

  color: "#ffffff !important",

  borderRadius: "13px",
  fontSize: 11,
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
  px: 1.9,

  color: "rgba(255,255,255,.72) !important",

  borderRadius: "13px",

  border: "1px solid rgba(255,255,255,.10)",

  backgroundColor: "rgba(255,255,255,.055)",

  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",

  "&:hover": {
    backgroundColor: "rgba(255,255,255,.10)",
  },
};

const primaryButtonSx = {
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

    borderColor: "rgba(153,27,27,.22)",

    backgroundColor: "rgba(153,27,27,.04)",
  },
};

const tableActionSx = {
  minHeight: 30,
  borderRadius: "9px",
  fontSize: 9,
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
};

const dialogSectionSx = {
  p: 1.8,
  borderRadius: "18px",

  border: "1px solid #e7ebf0",

  background: "linear-gradient(145deg,#ffffff,#f8fafc)",
};

const sectionTitleSx = {
  color: "#334155",
  fontSize: 14,
  fontWeight: 950,
};

const sectionSubtitleSx = {
  mt: 0.4,
  mb: 1.6,
  color: "#94a3b8",
  fontSize: 9.5,
  lineHeight: 1.55,
};

const formGridSx = {
  display: "grid",

  gridTemplateColumns: {
    xs: "1fr",

    sm: "repeat(2,minmax(0,1fr))",
  },

  gap: 1.5,
};

const platformDashboardStyles = `
  .platform-dashboard-page * {
    box-sizing: border-box;
  }

  .platform-dashboard-page .platform-dashboard-hero {
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

  .platform-dashboard-dialog-title {
    color: #ffffff !important;
    background-color: #0d1117 !important;
  }
`;

export default PlatformDashboard;
