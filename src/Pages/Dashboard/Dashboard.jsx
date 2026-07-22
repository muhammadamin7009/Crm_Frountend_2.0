import { useCallback, useEffect, useState } from "react";
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
  if (value === null || value === undefined || value === "") return "0 so'm";
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

const StatCard = ({ label, value, helper }) => (
  <Paper elevation={0} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
    <Typography variant="body2" className="text-slate-500">
      {label}
    </Typography>
    <Typography variant="h5" fontWeight={800} className="mt-1 text-slate-950">
      {value}
    </Typography>
    {helper && (
      <Typography variant="body2" className="mt-1 text-slate-500">
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
      elevation={0}
      sx={{
        position: "relative",
        minHeight: 144,
        p: 2.4,
        overflow: "hidden",
        borderRadius: "22px",
        border: "1px solid rgba(226,232,240,.9)",
        backgroundColor: "#ffffff",
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
              color: "#64748b",
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
              color: "#0f172a",
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
          color: "#94a3b8",
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
    elevation={0}
    className={className}
    sx={{
      p: 2.5,
      borderRadius: "22px",
      border: "1px solid rgba(226,232,240,.9)",
      backgroundColor: "#ffffff",
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
            color: "#0f172a",
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
              color: "#94a3b8",
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
      backgroundColor: "#f8fafc",
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
        color: "#94a3b8",
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
              border: "1px solid #edf0f3",
              background: "linear-gradient(135deg,#f8fafc,#ffffff)",
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
                    color: "#334155",
                    fontSize: 12.5,
                    fontWeight: 900,
                  }}
                >
                  {item.group_name || "Bo‘lim"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color: "#94a3b8",
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
                  color: "#0f172a",
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

      const [monthRes, todayRes, departmentsRes, balanceRes] = await Promise.all([
        getWorkerOutputs({
          ...monthRange,
          offset: 0,
          limit: 8,
          sort_by: "worked_at",
          sort_order: "desc",
        }),

        getWorkerOutputs({
          date_from: today,
          date_to: today,
          offset: 0,
          limit: 1,
        }),

        getWorkerOutputsSummary({
          ...monthRange,
          group_by: "department",
        }),

        getWorkerBalance(monthRange),
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
  }, []);

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
            color: "#94a3b8",
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

  return (
    <Box className="crm-page h-full overflow-auto pr-1">
      {/* Sahifa boshi */}

      <Box
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
          border: "1px solid rgba(226,232,240,.9)",
          background:
            "radial-gradient(circle at 98% 0%,rgba(143,29,32,.075),transparent 28%),linear-gradient(145deg,#ffffff,#fafafa)",
          boxShadow: "0 15px 42px rgba(15,23,42,.055)",
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
              color: "#0f172a",
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
              color: "#94a3b8",
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
                color: "#64748b",
                fontSize: 9.5,
                fontWeight: 750,
              }}
            >
              Hisobot davri
            </Typography>

            <Typography
              sx={{
                mt: 0.3,
                color: "#0f172a",
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

      <Box
        sx={{
          mb: 2.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,minmax(0,1fr))",
            xl: "repeat(5,minmax(0,1fr))",
          },
          gap: 2,
        }}
      >
        <WorkerKpiCard
          label="Bugungi summa"
          value={formatMoney(todayTotals.total_amount)}
          helper={`${formatNumber(todayTotals.total_quantity)} dona ish bajarildi`}
          icon={CheckIcon}
          tone="red"
        />

        <WorkerKpiCard
          label="Bu oy ishlab topilgan"
          value={formatMoney(totalEarned)}
          helper={`${formatNumber(monthTotals.total_quantity)} dona bajarilgan ish`}
          icon={TrendUpIcon}
          tone="violet"
        />

        <WorkerKpiCard
          label="Olingan to‘lov"
          value={formatMoney(totalPaid)}
          helper="Bu oy berilgan jami to‘lov"
          icon={WalletIcon}
          tone="green"
        />

        <WorkerKpiCard
          label="Qolgan summa"
          value={formatMoney(remaining)}
          helper="Hali berilmagan ish haqi"
          icon={WalletIcon}
          tone="amber"
        />

        <WorkerKpiCard
          label="Avans qarzi"
          value={formatMoney(remainingAdvance)}
          helper="Hali oylikdan ushlanmagan"
          icon={BoxIcon}
          tone="blue"
        />
      </Box>

      {/* Balans va bo‘limlar */}

      <Box
        sx={{
          mb: 2.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: ".85fr 1.15fr",
          },
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: "relative",
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
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 900,
              }}
            >
              Bu oydagi hisob
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                color: "rgba(255,255,255,.43)",
                fontSize: 11,
              }}
            >
              Ishlangan va berilgan summa holati
            </Typography>

            <Typography
              sx={{
                mt: 3,
                color: "#ffffff",
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
                color: "rgba(255,255,255,.45)",
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
                    color: "rgba(255,255,255,.52)",
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  To‘lov bajarilishi
                </Typography>

                <Typography
                  sx={{
                    color: "#ffffff",
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
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gap: 1.3,
              }}
            >
              <Box
                sx={{
                  p: 1.7,
                  borderRadius: "15px",
                  border: "1px solid rgba(255,255,255,.07)",
                  backgroundColor: "rgba(255,255,255,.04)",
                }}
              >
                <Typography
                  sx={{
                    color: "rgba(255,255,255,.4)",
                    fontSize: 9.5,
                  }}
                >
                  Berilgan
                </Typography>

                <Typography
                  noWrap
                  sx={{
                    mt: 0.8,
                    color: "#86efac",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  {formatMoney(totalPaid)}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.7,
                  borderRadius: "15px",
                  border: "1px solid rgba(255,255,255,.07)",
                  backgroundColor: "rgba(255,255,255,.04)",
                }}
              >
                <Typography
                  sx={{
                    color: "rgba(255,255,255,.4)",
                    fontSize: 9.5,
                  }}
                >
                  Qolgan
                </Typography>

                <Typography
                  noWrap
                  sx={{
                    mt: 0.8,
                    color: "#fda4af",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  {formatMoney(remaining)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

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
      </Box>

      {/* Oxirgi ishlar */}

      <WorkerSection title="Oxirgi ish yozuvlari" subtitle="Bu oy kiritilgan so‘nggi ishlaringiz">
        {monthOutputs.length ? (
          <Box sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{
                minWidth: 720,

                "& .MuiTableCell-root": {
                  px: 1.5,
                  py: 1.5,
                  color: "#64748b",
                  fontSize: 11,
                  borderColor: "#edf0f3",
                },

                "& .MuiTableHead-root .MuiTableCell-root": {
                  color: "#94a3b8",
                  fontSize: 9.5,
                  fontWeight: 900,
                  letterSpacing: ".04em",
                  textTransform: "uppercase",
                  backgroundColor: "#fafbfc",
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
                            color: "#334155",
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
                          color: "#334155",
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
    </Box>
  );
};

const BusinessDashboard = ({ user }) => (
  <Box className="h-full overflow-auto pr-1">
    <Box className="mb-5">
      <Typography variant="h5" fontWeight={800} className="text-slate-950">
        Bosh sahifa
      </Typography>
      <Typography variant="body2" className="mt-1 text-slate-500">
        Salom, {user?.first_name || "Foydalanuvchi"}. Hisobingiz faol.
      </Typography>
    </Box>

    <Paper elevation={0} className="rounded-2xl border border-slate-200 bg-white p-6">
      <Typography fontWeight={800} className="text-slate-950">
        Ma'lumotlaringiz administrator tomonidan boshqariladi
      </Typography>
      <Typography className="mt-2 max-w-2xl text-slate-500">
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

const NoDashboardPermission = ({ user }) => (
  <Box className="crm-page h-full overflow-auto pr-1">
    <Box className="mb-5">
      <Typography variant="h5" fontWeight={900} className="text-slate-950">
        Xush kelibsiz, {user?.first_name || "Admin"}!
      </Typography>
      <Typography variant="body2" className="mt-1 text-slate-500">
        Shaxsiy hisobingiz faol. Hozircha sizga boshqaruv bo'limlari ochilmagan.
      </Typography>
    </Box>

    <Paper elevation={0} className="crm-card p-6">
      <Box className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5">
        <Typography fontWeight={900} className="text-amber-900">
          Sizda hali hech qanday bo'lim ruxsati yo'q
        </Typography>
        <Typography variant="body2" className="mt-2 max-w-2xl text-amber-800">
          Kerakli bo'limlardan foydalanish uchun korxona super administratoriga murojaat qiling.
          Ruxsat berilgach, shu sahifada faqat sizga ochilgan ma'lumotlar ko'rinadi.
        </Typography>
      </Box>

      <Box className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Foydalanuvchi"
          value={
            `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "-"
          }
          helper={user?.username ? `@${user.username}` : "Shaxsiy profil"}
        />
        <StatCard label="Ruxsat turi" value="Admin" helper="Korxona administratori" />
        <StatCard label="Korxona" value={user?.company_name || "Korxona"} helper="Faol hisob" />
      </Box>
    </Paper>
  </Box>
);

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
