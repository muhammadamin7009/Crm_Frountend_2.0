import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  LinearProgress,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";

import { useAuth } from "../../Context/AuthContext";
import { getWorkerOutputs, getWorkerOutputsSummary } from "../../api/workerOutputs";
import { getWorkerBalance } from "../../api/workerPayments";
import AdminOverview from "./AdminOverview";
import ClientDashboard from "./ClientDashboard";
import { hasPermission } from "../../utils/permissions";
import { getAccessibleSections } from "../../utils/navigation";

import CheckIcon from "../../images/ui-icons/check.svg";
import WalletIcon from "../../images/ui-icons/wallet.svg";
import BoxIcon from "../../images/ui-icons/box.svg";
import TrendUpIcon from "../../images/ui-icons/trend-up.svg";

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") {
    return "0 so'm";
  }

  return `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
};

const formatNumber = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("uz-UZ");
};

const getMonthRange = () => {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    date_from: start.toISOString().slice(0, 10),
    date_to: end.toISOString().slice(0, 10),
  };
};

const getToday = () => new Date().toISOString().slice(0, 10);

// Ranglar mavzu o'zgaruvchilaridan olinadi. Ilgari bu yerda qattiq `bg-white` va
// `text-slate-950` turgan — qorong'i mavzuda matn qora fonda qora bo'lib ko'rinmasdi.
const StatCard = ({ label, value, helper }) => (
  <Paper
    elevation={0}
    sx={{
      px: 2.5,
      py: 2,
      borderRadius: "16px",
      border: "1px solid var(--aa-border)",
      backgroundColor: "var(--aa-surface-solid)",
    }}
  >
    <Typography variant="body2" sx={{ color: "var(--aa-text-secondary)" }}>
      {label}
    </Typography>

    <Typography
      variant="h5"
      fontWeight={800}
      sx={{ mt: 0.5, color: "var(--aa-text)", overflowWrap: "anywhere" }}
    >
      {value}
    </Typography>

    {helper && (
      <Typography variant="body2" sx={{ mt: 0.5, color: "var(--aa-text-tertiary)" }}>
        {helper}
      </Typography>
    )}
  </Paper>
);

const workerCardTones = {
  red: {
    gradient: "linear-gradient(145deg,#8f1d20,#c72a32)",
    soft: "rgba(143,29,32,.07)",
    shadow: "rgba(143,29,32,.20)",
  },

  green: {
    gradient: "linear-gradient(145deg,#16985c,#21bd73)",
    soft: "rgba(22,152,92,.07)",
    shadow: "rgba(22,152,92,.18)",
  },

  amber: {
    gradient: "linear-gradient(145deg,#e28720,#f4a238)",
    soft: "rgba(226,135,32,.08)",
    shadow: "rgba(226,135,32,.20)",
  },

  violet: {
    gradient: "linear-gradient(145deg,#6750cf,#8a67e8)",
    soft: "rgba(103,80,207,.07)",
    shadow: "rgba(103,80,207,.20)",
  },

  blue: {
    gradient: "linear-gradient(145deg,#3262d9,#587cf0)",
    soft: "rgba(50,98,217,.07)",
    shadow: "rgba(50,98,217,.20)",
  },
};

const WorkerKpiCard = ({ label, value, helper, icon, tone = "red" }) => {
  const colors = workerCardTones[tone] || workerCardTones.red;

  return (
    <Paper
      className="aa-dashboard-kpi"
      elevation={0}
      sx={{
        position: "relative",
        minHeight: 144,
        p: 2.4,
        overflow: "hidden",
        borderRadius: "22px",
        border: "1px solid rgba(226,232,240,.9)",
        backgroundColor: "var(--aa-surface-solid)",
        boxShadow: "0 14px 40px rgba(15,23,42,.055)",
        transition: "transform .2s ease, box-shadow .2s ease",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 20px 50px rgba(15,23,42,.09)",
        },

        "&::after": {
          content: '""',
          position: "absolute",
          width: 150,
          height: 150,
          top: -80,
          right: -65,
          borderRadius: "50%",
          background: `radial-gradient(
            circle,
            ${colors.soft},
            transparent 68%
          )`,
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "var(--aa-text-secondary)",
              fontSize: 12,
              fontWeight: 750,
            }}
          >
            {label}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 1.2,
              color: "var(--aa-text)",
              fontSize: 21,
              lineHeight: 1.2,
              fontWeight: 950,
              letterSpacing: "-0.035em",
            }}
          >
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            borderRadius: "14px",
            background: colors.gradient,
            boxShadow: `0 12px 25px ${colors.shadow}`,
          }}
        >
          <Box
            component="img"
            src={icon}
            alt=""
            sx={{
              width: 19,
              height: 19,
              filter: "brightness(0) invert(1)",
            }}
          />
        </Box>
      </Box>

      <Typography
        sx={{
          position: "relative",
          zIndex: 1,
          mt: 2.1,
          color: "var(--aa-text-tertiary)",
          fontSize: 11,
          lineHeight: 1.55,
          fontWeight: 600,
        }}
      >
        {helper}
      </Typography>
    </Paper>
  );
};

const WorkerSection = ({ title, subtitle, action, children, className = "" }) => (
  <Paper
    className={`aa-dashboard-section ${className}`}
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: "22px",
      border: "1px solid rgba(226,232,240,.9)",
      backgroundColor: "var(--aa-surface-solid)",
      boxShadow: "0 14px 40px rgba(15,23,42,.045)",
    }}
  >
    <Box
      sx={{
        mb: 2.5,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Typography
          sx={{
            color: "var(--aa-text)",
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              mt: 0.7,
              color: "var(--aa-text-tertiary)",
              fontSize: 11,
              lineHeight: 1.55,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {action}
    </Box>

    {children}
  </Paper>
);

const WorkerEmptyState = ({ children }) => (
  <Box
    sx={{
      minHeight: 150,
      px: 2,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 1.5,
      textAlign: "center",
      borderRadius: "17px",
      border: "1px dashed #cbd5e1",
      backgroundColor: "var(--aa-surface-muted)",
    }}
  >
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: "#cbd5e1",
        boxShadow: "0 0 0 7px rgba(203,213,225,.25)",
      }}
    />

    <Typography
      sx={{
        color: "var(--aa-text-tertiary)",
        fontSize: 12,
        fontWeight: 650,
      }}
    >
      {children}
    </Typography>
  </Box>
);

const WorkerDepartmentList = ({ items }) => {
  const maximum = Math.max(...items.map((item) => Number(item.total_amount || 0)), 1);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
      }}
    >
      {items.slice(0, 7).map((item, index) => {
        const amount = Number(item.total_amount || 0);

        const progress = Math.min(100, Math.round((amount / maximum) * 100));

        return (
          <Box
            key={item.group_id || `${item.group_name}-${index}`}
            sx={{
              p: 1.7,
              borderRadius: "15px",
              border: "1px solid var(--aa-border)",
              background: "linear-gradient(135deg,var(--aa-surface-muted),var(--aa-surface-solid))",
            }}
          >
            <Box
              sx={{
                mb: 1.3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  minWidth: 0,
                }}
              >
                <Typography
                  noWrap
                  sx={{
                    color: "var(--aa-text)",
                    fontSize: 12.5,
                    fontWeight: 900,
                  }}
                >
                  {item.group_name || "Bo‘lim"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color: "var(--aa-text-tertiary)",
                    fontSize: 10.5,
                  }}
                >
                  {formatNumber(item.total_quantity)} dona · {formatNumber(item.entries_count)}{" "}
                  yozuv
                </Typography>
              </Box>

              <Typography
                noWrap
                sx={{
                  color: "var(--aa-text)",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {formatMoney(amount)}
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 99,
                backgroundColor: "#eef1f5",

                "& .MuiLinearProgress-bar": {
                  borderRadius: 99,
                  background: "linear-gradient(90deg,#6750cf,#8a67e8)",
                },
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
};

const WorkerDashboard = ({ user }) => {
  // Ishchi faqat o'ziga berilgan bo'limlarni ko'radi. Ruxsat bo'lmasa karta umuman
  // chizilmaydi — ilgari u nol qiymat bilan turaverar edi (masalan ombor xodimida
  // "Bu oy ishlab topilgan: 0"), bu esa noto'g'ri ma'lumot taassurotini berardi.
  const canViewProduction = hasPermission(user, "production.view");

  const canViewPayroll = hasPermission(user, "payroll.view");

  const canViewInventory = hasPermission(user, "inventory.view");

  const [monthOutputs, setMonthOutputs] = useState([]);

  const [monthTotals, setMonthTotals] = useState({
    total_quantity: 0,
    total_amount: 0,
  });

  const [todayTotals, setTodayTotals] = useState({
    total_quantity: 0,
    total_amount: 0,
  });

  const [departmentSummary, setDepartmentSummary] = useState([]);

  const [balance, setBalance] = useState({
    total_earned: 0,
    total_paid: 0,
    remaining: 0,
    remaining_advance: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const monthRange = getMonthRange();

      const today = getToday();

      const emptyOutputs = { data: { worker_outputs: [], totals: {} } };
      const emptySummary = { data: { summary: [] } };
      const emptyBalance = { data: { balance: {} } };

      // Ruxsati yo'q bo'limga so'rov ham yuborilmaydi — aks holda backend 403 qaytaradi
      // va foydalanuvchi keraksiz xato xabarini ko'radi.
      const [monthRes, todayRes, departmentsRes, balanceRes] = await Promise.all([
        canViewProduction
          ? getWorkerOutputs({
              ...monthRange,
              offset: 0,
              limit: 8,
              sort_by: "worked_at",
              sort_order: "desc",
            })
          : Promise.resolve(emptyOutputs),

        canViewProduction
          ? getWorkerOutputs({
              date_from: today,
              date_to: today,
              offset: 0,
              limit: 1,
            })
          : Promise.resolve(emptyOutputs),

        canViewProduction
          ? getWorkerOutputsSummary({
              ...monthRange,
              group_by: "department",
            })
          : Promise.resolve(emptySummary),

        canViewPayroll ? getWorkerBalance(monthRange) : Promise.resolve(emptyBalance),
      ]);

      setMonthOutputs(monthRes.data.worker_outputs || []);

      setMonthTotals(
        monthRes.data.totals || {
          total_quantity: 0,
          total_amount: 0,
        },
      );

      setTodayTotals(
        todayRes.data.totals || {
          total_quantity: 0,
          total_amount: 0,
        },
      );

      setDepartmentSummary(departmentsRes.data.summary || []);

      setBalance(
        balanceRes.data.balance || {
          total_earned: 0,
          total_paid: 0,
          remaining: 0,
          remaining_advance: 0,
        },
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Bosh sahifa ma’lumotlarini olishda xato.");
    } finally {
      setLoading(false);
    }
  }, [canViewProduction, canViewPayroll]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 430,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            display: "grid",
            placeItems: "center",
            borderRadius: "22px",
            border: "1px solid rgba(143,29,32,.1)",
            backgroundColor: "rgba(143,29,32,.05)",
          }}
        >
          <CircularProgress
            size={34}
            thickness={4.5}
            sx={{
              color: "#8f1d20",
            }}
          />
        </Box>

        <Typography
          sx={{
            color: "var(--aa-text-tertiary)",
            fontSize: 13,
            fontWeight: 750,
          }}
        >
          Ish ma’lumotlari yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  const totalEarned = Number(balance.total_earned || monthTotals.total_amount || 0);

  const totalPaid = Number(balance.total_paid || 0);

  const remaining = Number(balance.remaining || 0);

  const remainingAdvance = Number(balance.remaining_advance || 0);

  const paymentProgress =
    totalEarned > 0 ? Math.min(100, Math.round((totalPaid / totalEarned) * 100)) : 0;

  const month = getMonthRange();

  const hasMonthlyBalance = canViewPayroll && (totalEarned > 0 || totalPaid > 0 || remaining > 0);

  const kpiCards = [
    canViewProduction && {
      label: "Bugungi summa",
      value: formatMoney(todayTotals.total_amount),
      helper: `${formatNumber(todayTotals.total_quantity)} dona ish bajarildi`,
      icon: CheckIcon,
      tone: "red",
    },
    canViewProduction && {
      label: "Bu oy ishlab topilgan",
      value: formatMoney(totalEarned),
      helper: `${formatNumber(monthTotals.total_quantity)} dona bajarilgan ish`,
      icon: TrendUpIcon,
      tone: "violet",
    },
    canViewPayroll && {
      label: "Olingan to‘lov",
      value: formatMoney(totalPaid),
      helper: "Bu oy berilgan jami to‘lov",
      icon: WalletIcon,
      tone: "green",
    },
    canViewPayroll && {
      label: "Qolgan summa",
      value: formatMoney(remaining),
      helper: "Hali berilmagan ish haqi",
      icon: WalletIcon,
      tone: "amber",
    },
    canViewPayroll && {
      label: "Avans qarzi",
      value: formatMoney(remainingAdvance),
      helper: "Hali oylikdan ushlanmagan",
      icon: BoxIcon,
      tone: "blue",
    },
    canViewProduction && {
      label: "Bu oy bajarilgan",
      value: `${formatNumber(monthTotals.total_quantity)} dona`,
      helper: "Oy boshidan jami ishlab chiqarish",
      icon: CheckIcon,
      tone: "green",
    },
  ].filter(Boolean);

  return (
    <Box className="crm-page aa-dashboard-page h-full overflow-auto pr-1">
      {/* Sahifa boshi */}

      <Box
        className="aa-dashboard-hero"
        sx={{
          mb: 2.5,
          p: {
            xs: 2.5,
            sm: 3,
          },
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          justifyContent: "space-between",
          gap: 2.5,
          overflow: "hidden",
          borderRadius: "24px",
          border: "1px solid var(--aa-border)",
          background:
            "radial-gradient(circle at 98% 0%,rgba(143,29,32,.075),transparent 28%),linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",
          boxShadow: "var(--aa-shadow-md)",
        }}
      >
        <Box>
          <Box
            sx={{
              mb: 1.2,
              display: "flex",
              alignItems: "center",
              gap: 1.2,
            }}
          >
            <Box
              sx={{
                width: 25,
                height: 2,
                borderRadius: 99,
                background: "linear-gradient(90deg,#7f1d1d,#dc2626)",
              }}
            />

            <Typography
              sx={{
                color: "#8f1d20",
                fontSize: 10,
                fontWeight: 950,
                letterSpacing: ".13em",
                textTransform: "uppercase",
              }}
            >
              Shaxsiy ish paneli
            </Typography>
          </Box>

          <Typography
            component="h1"
            sx={{
              color: "var(--aa-text)",
              fontSize: {
                xs: 26,
                sm: 30,
              },
              lineHeight: 1.15,
              fontWeight: 950,
              letterSpacing: "-0.04em",
            }}
          >
            Mening ishlarim
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "var(--aa-text-tertiary)",
              fontSize: 13,
              lineHeight: 1.7,
              fontWeight: 600,
            }}
          >
            Salom,{" "}
            <Box
              component="span"
              sx={{
                color: "#8f1d20",
                fontWeight: 850,
              }}
            >
              {user?.first_name || "Ishchi"}
            </Box>
            . Bu oy bajargan ishlaringiz va hisob-kitoblaringiz.
          </Typography>
        </Box>

        <Box
          sx={{
            px: 2,
            py: 1.3,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            borderRadius: "15px",
            border: "1px solid rgba(143,29,32,.1)",
            backgroundColor: "rgba(143,29,32,.045)",
          }}
        >
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              boxShadow: "0 0 0 5px rgba(34,197,94,.09)",
            }}
          />

          <Box>
            <Typography
              sx={{
                color: "var(--aa-text-secondary)",
                fontSize: 9.5,
                fontWeight: 750,
              }}
            >
              Hisobot davri
            </Typography>

            <Typography
              sx={{
                mt: 0.3,
                color: "var(--aa-text)",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {month.date_from} — {month.date_to}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Statistikalar */}

      {kpiCards.length > 0 && (
        <Box
          className="aa-dashboard-kpi-grid"
          sx={{
            mb: 2.5,
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2,minmax(0,1fr))",
              sm: "repeat(2,minmax(0,1fr))",
              md: "repeat(3,minmax(0,1fr))",
              xl: `repeat(${Math.min(kpiCards.length, 6)},minmax(0,1fr))`,
            },
            gap: 2,
          }}
        >
          {kpiCards.map((card) => (
            <WorkerKpiCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              icon={card.icon}
              tone={card.tone}
            />
          ))}
        </Box>
      )}

      {kpiCards.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            mb: 2.5,
            p: 3,
            borderRadius: "24px",
            border: "1px dashed var(--aa-border)",
            backgroundColor: "var(--aa-surface-muted)",
          }}
        >
          <Typography sx={{ color: "var(--aa-text)", fontSize: 15, fontWeight: 900 }}>
            {canViewInventory ? "Ombor bo'limi sizga ochiq" : "Bosh sahifada ko'rsatiladigan ma'lumot yo'q"}
          </Typography>

          <Typography sx={{ mt: 1, color: "var(--aa-text-secondary)", fontSize: 13 }}>
            {canViewInventory
              ? "Ishlab chiqarish va oylik bo'limlari sizga ochilmagan. Chap menyudagi Ombor bo'limidan foydalaning."
              : "Sizga hali bo'lim ruxsati berilmagan. Administrator bilan bog'laning."}
          </Typography>
        </Paper>
      )}

      {/* Balans va bo‘limlar */}

      <Box
        sx={{
          mb: 2.5,
          display: (canViewPayroll || canViewProduction) === true ? "grid" : "none",
          gridTemplateColumns: {
            xs: "1fr",
            xl: canViewPayroll && canViewProduction ? ".85fr 1.15fr" : "1fr",
          },
          gap: 2,
        }}
      >
        {canViewPayroll && hasMonthlyBalance ? (
          <Paper
            elevation={0}
            sx={{
              position: "relative",
              minHeight: 330,
              p: 3,
              overflow: "hidden",
              color: "#ffffff",
              borderRadius: "23px",
              border: "1px solid rgba(255,255,255,.06)",
              background:
                "radial-gradient(circle at 100% 0%,rgba(220,38,38,.28),transparent 32%),linear-gradient(145deg,#11151c,#171117 52%,#321218)",
              boxShadow: "0 20px 55px rgba(15,23,42,.18)",
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,
              }}
            >
              <Typography
                sx={{
                  color: "#ffffff !important",
                  fontSize: 16,
                  fontWeight: 900,
                }}
              >
                Bu oydagi hisob
              </Typography>

              <Typography
                sx={{
                  mt: 0.7,
                  color: "rgba(255,255,255,.43) !important",
                  fontSize: 11,
                }}
              >
                Ishlangan va berilgan summa holati
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  color: "#ffffff !important",
                  fontSize: {
                    xs: 26,
                    sm: 31,
                  },
                  lineHeight: 1.1,
                  fontWeight: 950,
                  letterSpacing: "-0.04em",
                }}
              >
                {formatMoney(totalEarned)}
              </Typography>

              <Typography
                sx={{
                  mt: 0.8,
                  color: "rgba(255,255,255,.45) !important",
                  fontSize: 11,
                }}
              >
                Jami ishlab topilgan
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    mb: 1.2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,.52) !important",
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    To‘lov bajarilishi
                  </Typography>

                  <Typography
                    sx={{
                      color: "#ffffff !important",
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {paymentProgress}%
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={paymentProgress}
                  sx={{
                    height: 9,
                    borderRadius: 99,
                    backgroundColor: "rgba(255,255,255,.09)",

                    "& .MuiLinearProgress-bar": {
                      borderRadius: 99,
                      background: "linear-gradient(90deg,#fb7185,#ef4444)",
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  mt: 3,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2,minmax(0,1fr))",
                  },
                  gap: 1.3,
                }}
              >
                <Box
                  sx={{
                    p: 1.7,
                    minWidth: 0,
                    borderRadius: "15px",
                    border: "1px solid rgba(255,255,255,.07)",
                    backgroundColor: "rgba(255,255,255,.04)",
                  }}
                >
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,.4) !important",
                      fontSize: 9.5,
                    }}
                  >
                    Berilgan
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.8,
                      color: "#86efac !important",
                      fontSize: 14,
                      fontWeight: 900,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {formatMoney(totalPaid)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.7,
                    minWidth: 0,
                    borderRadius: "15px",
                    border: "1px solid rgba(255,255,255,.07)",
                    backgroundColor: "rgba(255,255,255,.04)",
                  }}
                >
                  <Typography
                    sx={{
                      color: "rgba(255,255,255,.4) !important",
                      fontSize: 9.5,
                    }}
                  >
                    Qolgan
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.8,
                      color: "#fda4af !important",
                      fontSize: 14,
                      fontWeight: 900,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {formatMoney(remaining)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        ) : canViewPayroll ? (
          <WorkerSection title="Bu oydagi hisob" subtitle="Ishlangan va berilgan summa holati">
            <WorkerEmptyState>
              Bu oy bo‘yicha hali ish yoki to‘lov ma’lumotlari mavjud emas.
            </WorkerEmptyState>
          </WorkerSection>
        ) : null}

        {canViewProduction && (
          <WorkerSection
            title="Bo‘limlar bo‘yicha"
            subtitle="Bu oy bajarilgan ishlar va hisoblangan summa"
          >
            {departmentSummary.length ? (
              <WorkerDepartmentList items={departmentSummary} />
            ) : (
              <WorkerEmptyState>Bu oy bo‘yicha hali ish yozuvi yo‘q.</WorkerEmptyState>
            )}
          </WorkerSection>
        )}
      </Box>

      {/* Oxirgi ishlar */}

      {canViewProduction && (
      <WorkerSection title="Oxirgi ish yozuvlari" subtitle="Bu oy kiritilgan so‘nggi ishlaringiz">
        {monthOutputs.length ? (
          <Box
            className="aa-mobile-cards aa-worker-output-table"
            sx={{
              overflowX: "auto",
            }}
          >
            <Table
              size="small"
              sx={{
                minWidth: 720,

                "& .MuiTableCell-root": {
                  px: 1.5,
                  py: 1.5,
                  color: "var(--aa-text-secondary)",
                  fontSize: 11,
                  borderColor: "#edf0f3",
                },

                "& .MuiTableHead-root .MuiTableCell-root": {
                  color: "var(--aa-text-tertiary)",
                  fontSize: 9.5,
                  fontWeight: 900,
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  backgroundColor: "var(--aa-surface-muted)",
                },

                "& .MuiTableBody-root .MuiTableRow-root": {
                  transition: "background-color .18s ease",
                },

                "& .MuiTableBody-root .MuiTableRow-root:hover": {
                  backgroundColor: "rgba(143,29,32,.025)",
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Mahsulot</TableCell>

                  <TableCell>Bo‘lim</TableCell>

                  <TableCell>Miqdor</TableCell>

                  <TableCell>Summa</TableCell>

                  <TableCell>Sana</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {monthOutputs.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            borderRadius: "11px",
                            backgroundColor: "rgba(143,29,32,.07)",
                          }}
                        >
                          <Box
                            component="img"
                            src={BoxIcon}
                            alt=""
                            sx={{
                              width: 15,
                              height: 15,
                              opacity: 0.75,
                            }}
                          />
                        </Box>

                        <Typography
                          sx={{
                            color: "var(--aa-text)",
                            fontSize: 11.5,
                            fontWeight: 850,
                          }}
                        >
                          {item.product_name || "Mahsulot"}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>{item.department_name || "-"}</TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "var(--aa-text)",
                          fontSize: 11,
                          fontWeight: 850,
                        }}
                      >
                        {formatNumber(item.quantity)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={formatMoney(item.total_amount)}
                        sx={{
                          height: 24,
                          color: "#16804d",
                          fontSize: 9.5,
                          fontWeight: 900,
                          backgroundColor: "rgba(34,197,94,.10)",
                        }}
                      />
                    </TableCell>

                    <TableCell>{formatDate(item.worked_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : (
          <WorkerEmptyState>Hali ish yozuvi kiritilmagan.</WorkerEmptyState>
        )}
      </WorkerSection>
      )}
    </Box>
  );
};

const BusinessDashboard = ({ user }) => (
  <Box className="h-full overflow-auto pr-1">
    <Box className="mb-5">
      <Typography variant="h5" fontWeight={800} sx={{ color: "var(--aa-text)" }}>
        Bosh sahifa
      </Typography>

      <Typography variant="body2" sx={{ mt: 0.5, color: "var(--aa-text-secondary)" }}>
        Salom, {user?.first_name || "Foydalanuvchi"}. Hisobingiz faol.
      </Typography>
    </Box>

    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "16px",
        border: "1px solid var(--aa-border)",
        backgroundColor: "var(--aa-surface-solid)",
      }}
    >
      <Typography fontWeight={800} sx={{ color: "var(--aa-text)" }}>
        Ma'lumotlaringiz administrator tomonidan boshqariladi
      </Typography>

      <Typography sx={{ mt: 1, maxWidth: 640, color: "var(--aa-text-secondary)" }}>
        Bu ruxsat turi uchun ish haqi va ishlab chiqarish ma'lumotlari ochilmaydi. Kerakli ma'lumot
        yoki ruxsat o'zgarishi bo'yicha administrator bilan bog'laning.
      </Typography>

      <Box className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Ruxsat turi"
          value={user?.role || "-"}
          helper="Joriy foydalanuvchi ruxsati"
        />

        <StatCard label="Holati" value="Faol" helper="Tizimga kirish ruxsati bor" />

        <StatCard label="Aloqa" value="+998 91 571 70 09" helper="Tizim administratori" />
      </Box>
    </Paper>
  </Box>
);

// Bosh sahifa statistikasi (`dashboard.view`) yopiq bo'lsa ham, foydalanuvchida boshqa
// bo'limlar ochiq bo'lishi mumkin. Ilgari bu sahifa har doim "hech qanday ruxsatingiz yo'q"
// deb turgan — yon menyuda bo'limlar ko'rinib turganda bu qarama-qarshi bo'lgan.
const NoDashboardPermission = ({ user }) => {
  const navigate = useNavigate();

  const sections = getAccessibleSections(user);

  return (
    <Box className="crm-page h-full overflow-auto pr-1">
      <Box className="mb-5">
        <Typography variant="h5" fontWeight={900} sx={{ color: "var(--aa-text)" }}>
          Xush kelibsiz, {user?.first_name || "Administrator"}!
        </Typography>

        <Typography variant="body2" sx={{ mt: 0.5, color: "var(--aa-text-secondary)" }}>
          {sections.length
            ? "Quyidagi bo'limlar sizga ochiq. Ishni shulardan boshlashingiz mumkin."
            : "Shaxsiy hisobingiz faol. Hozircha sizga boshqaruv bo'limlari ochilmagan."}
        </Typography>
      </Box>

      <Paper elevation={0} className="crm-card p-6">
        {sections.length ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,minmax(0,1fr))",
                lg: "repeat(3,minmax(0,1fr))",
              },
              gap: 1.5,
            }}
          >
            {sections.map((section) => (
              <Box
                key={section.path}
                role="button"
                tabIndex={0}
                onClick={() => navigate(section.path)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") navigate(section.path);
                }}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minHeight: 62,
                  px: 2,
                  py: 1.5,
                  cursor: "pointer",
                  borderRadius: "16px",
                  border: "1px solid var(--aa-border)",
                  backgroundColor: "var(--aa-surface-solid)",
                  transition: "border-color .15s ease, transform .15s ease",
                  "&:hover": { borderColor: "var(--aa-border-strong)", transform: "translateY(-1px)" },
                }}
              >
                <Box
                  component="img"
                  src={section.icon}
                  alt=""
                  sx={{ width: 20, height: 20, opacity: 0.8 }}
                />

                <Typography sx={{ color: "var(--aa-text)", fontSize: 14, fontWeight: 800 }}>
                  {section.label}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              p: 2.5,
              borderRadius: "16px",
              border: "1px dashed var(--aa-warning-border, rgba(217,119,6,.45))",
              backgroundColor: "var(--aa-warning-soft, rgba(217,119,6,.08))",
            }}
          >
            <Typography fontWeight={900} sx={{ color: "var(--aa-text)" }}>
              Sizda hali hech qanday bo'lim ruxsati yo'q
            </Typography>

            <Typography
              variant="body2"
              sx={{ mt: 1, maxWidth: 640, color: "var(--aa-text-secondary)" }}
            >
              Kerakli bo'limlardan foydalanish uchun korxona super administratoriga murojaat
              qiling. Ruxsat berilgach, shu sahifada faqat sizga ochilgan ma'lumotlar ko'rinadi.
            </Typography>
          </Box>
        )}

        <Box className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Foydalanuvchi"
            value={
              `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "-"
            }
            helper={user?.username ? `@${user.username}` : "Shaxsiy profil"}
          />

          <StatCard label="Ruxsat turi" value="Administrator" helper="Korxona administratori" />

          <StatCard label="Korxona" value={user?.company_name || "Korxona"} helper="Faol hisob" />
        </Box>
      </Paper>
    </Box>
  );
};

const Dashboard = () => {
  const auth = useAuth();

  const user = auth?.user || getLocalUser();

  if (user?.role === "worker") {
    return <WorkerDashboard user={user} />;
  }

  if (user?.role === "admin" && !hasPermission(user, "dashboard.view")) {
    return <NoDashboardPermission user={user} />;
  }

  if (["super_admin", "admin"].includes(user?.role)) {
    return <AdminOverview user={user} />;
  }

  if (user?.role === "client") {
    return <ClientDashboard user={user} />;
  }

  return <BusinessDashboard user={user} />;
};

export default Dashboard;
