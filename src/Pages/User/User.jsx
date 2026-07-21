import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getClientBalance, getClientSales } from "../../api/clientSales";
import { getClientPayments } from "../../api/clientPayments";
import { getUser } from "../../api/getUsers";
import { getWorkerAdvanceBalance, getWorkerAdvances } from "../../api/workerAdvances";
import { getWorkerOutputs } from "../../api/workerOutputs";
import { getWorkerBalance, getWorkerPayments } from "../../api/workerPayments";
import { useAuth } from "../../Context/AuthContext";
import { hasPermission } from "../../utils/permissions";

const roleNames = {
  super_admin: "Super administrator",
  admin: "Administrator",
  client: "Mijoz",
  customer: "Xaridor",
  worker: "Ishchi",
  packer: "Qadoqlovchi",
  supplier: "Yetkazib beruvchi",
};

const roleStyles = {
  super_admin: {
    color: "#fecaca",
    backgroundColor: "rgba(220,38,38,.17)",
    borderColor: "rgba(248,113,113,.18)",
  },

  admin: {
    color: "#bfdbfe",
    backgroundColor: "rgba(37,99,235,.17)",
    borderColor: "rgba(96,165,250,.18)",
  },

  client: {
    color: "#bbf7d0",
    backgroundColor: "rgba(34,197,94,.15)",
    borderColor: "rgba(74,222,128,.18)",
  },

  customer: {
    color: "#ddd6fe",
    backgroundColor: "rgba(139,92,246,.16)",
    borderColor: "rgba(167,139,250,.18)",
  },

  worker: {
    color: "#fde68a",
    backgroundColor: "rgba(245,158,11,.16)",
    borderColor: "rgba(251,191,36,.18)",
  },

  default: {
    color: "#e2e8f0",
    backgroundColor: "rgba(148,163,184,.15)",
    borderColor: "rgba(203,213,225,.16)",
  },
};

const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const date = (value, withTime = false) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    "uz-UZ",
    withTime
      ? {
          dateStyle: "medium",
          timeStyle: "short",
        }
      : {
          dateStyle: "medium",
        },
  ).format(new Date(value));
};

const getImageUrl = (path) => {
  if (!path) return undefined;

  if (path.startsWith("http")) {
    return path;
  }

  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const getInitials = (user) => {
  const first = user?.first_name?.[0] || "";
  const last = user?.last_name?.[0] || "";
  const username = user?.username?.[0] || "";

  return `${first}${last}`.toUpperCase() || username.toUpperCase() || "U";
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const percent = (value, total) => {
  const safeTotal = Number(total || 0);

  if (safeTotal <= 0) return 0;

  return Math.max(0, Math.min(100, Math.round((Number(value || 0) / safeTotal) * 100)));
};

const Surface = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid #e4e9ef",
      backgroundColor: "#ffffff",
      boxShadow: "0 14px 40px rgba(15,23,42,.045)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const RoleChip = ({ role }) => {
  const style = roleStyles[role] || roleStyles.default;

  return (
    <Chip
      size="small"
      label={roleNames[role] || role || "-"}
      sx={{
        height: 27,
        color: `${style.color} !important`,
        fontSize: 10,
        fontWeight: 900,
        border: `1px solid ${style.borderColor}`,
        backgroundColor: `${style.backgroundColor} !important`,
      }}
    />
  );
};

const HeroInfoItem = ({ label, value }) => (
  <Box
    sx={{
      minWidth: 0,
      p: 1.55,
      borderRadius: "15px",
      border: "1px solid rgba(255,255,255,.075)",
      background: "linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.025))",
      backdropFilter: "blur(14px)",
    }}
  >
    <Typography
      sx={{
        color: "rgba(255,255,255,.40) !important",
        fontSize: 9.5,
        fontWeight: 750,
      }}
    >
      {label}
    </Typography>

    <Typography
      noWrap
      sx={{
        mt: 0.7,
        color: "#ffffff !important",
        fontSize: 13,
        fontWeight: 900,
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const StatCard = ({ label, value, helper, tone = "red" }) => {
  const tones = {
    red: {
      color: "#991b1b",
      gradient: "linear-gradient(145deg,#7f1d1d,#dc2626)",
      soft: "rgba(153,27,27,.07)",
      shadow: "rgba(153,27,27,.18)",
      symbol: "!",
    },

    green: {
      color: "#15803d",
      gradient: "linear-gradient(145deg,#15803d,#22c55e)",
      soft: "rgba(34,197,94,.07)",
      shadow: "rgba(34,197,94,.17)",
      symbol: "✓",
    },

    blue: {
      color: "#1d4ed8",
      gradient: "linear-gradient(145deg,#1d4ed8,#60a5fa)",
      soft: "rgba(37,99,235,.07)",
      shadow: "rgba(37,99,235,.17)",
      symbol: "↗",
    },

    amber: {
      color: "#b45309",
      gradient: "linear-gradient(145deg,#d97706,#f59e0b)",
      soft: "rgba(245,158,11,.08)",
      shadow: "rgba(245,158,11,.18)",
      symbol: "△",
    },

    violet: {
      color: "#6d28d9",
      gradient: "linear-gradient(145deg,#6d28d9,#a78bfa)",
      soft: "rgba(139,92,246,.08)",
      shadow: "rgba(139,92,246,.18)",
      symbol: "◇",
    },
  };

  const current = tones[tone] || tones.red;

  return (
    <Surface
      sx={{
        position: "relative",
        minHeight: 140,
        p: 2.3,
        transition: "transform .2s ease,box-shadow .2s ease",

        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 20px 48px rgba(15,23,42,.08)",
        },

        "&::after": {
          content: '""',
          position: "absolute",
          width: 150,
          height: 150,
          top: -80,
          right: -65,
          borderRadius: "50%",
          background: `radial-gradient(circle,${current.soft},transparent 68%)`,
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
              fontSize: 11,
              fontWeight: 750,
            }}
          >
            {label}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 1,
              color: "#0f172a",
              fontSize: {
                xs: 18,
                sm: 21,
              },
              fontWeight: 950,
              letterSpacing: "-.035em",
            }}
          >
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 43,
            height: 43,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: "#ffffff",
            borderRadius: "14px",
            background: current.gradient,
            boxShadow: `0 11px 25px ${current.shadow}`,
            fontSize: 15,
            fontWeight: 950,
          }}
        >
          {current.symbol}
        </Box>
      </Box>

      <Typography
        sx={{
          position: "relative",
          zIndex: 1,
          mt: 2,
          color: "#94a3b8",
          fontSize: 10.5,
          lineHeight: 1.55,
        }}
      >
        {helper}
      </Typography>
    </Surface>
  );
};

const Section = ({ title, subtitle, action, children, sx = {} }) => (
  <Surface
    sx={{
      p: 2.4,
      ...sx,
    }}
  >
    <Box
      sx={{
        mb: 2.3,
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
            fontWeight: 950,
            letterSpacing: "-.02em",
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              mt: 0.55,
              color: "#94a3b8",
              fontSize: 10.5,
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
  </Surface>
);

const InfoItem = ({ label, value, valueColor = "#334155" }) => (
  <Box
    sx={{
      py: 1.4,
      borderBottom: "1px solid #edf0f3",

      "&:last-of-type": {
        borderBottom: 0,
      },
    }}
  >
    <Typography
      sx={{
        color: "#94a3b8",
        fontSize: 9.5,
        fontWeight: 750,
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        mt: 0.55,
        color: valueColor,
        fontSize: 12,
        lineHeight: 1.5,
        fontWeight: 900,
        wordBreak: "break-word",
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const EmptyState = ({ children }) => (
  <Box
    sx={{
      minHeight: 160,
      px: 2,
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      borderRadius: "17px",
      border: "1px dashed #cbd5e1",
      backgroundColor: "#f8fafc",
    }}
  >
    <Typography
      sx={{
        color: "#94a3b8",
        fontSize: 11.5,
        fontWeight: 750,
      }}
    >
      {children}
    </Typography>
  </Box>
);

const ProgressRows = ({ items = [], color = "#7c3aed", empty = "Ma’lumot topilmadi." }) => {
  const max = Math.max(...items.map((item) => Number(item.value || 0)), 1);

  if (!items.length) {
    return <EmptyState>{empty}</EmptyState>;
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.9,
      }}
    >
      {items.slice(0, 7).map((item, index) => (
        <Box key={`${item.label}-${index}`}>
          <Box
            sx={{
              mb: 0.9,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Typography
              noWrap
              sx={{
                color: "#475569",
                fontSize: 10.5,
                fontWeight: 900,
              }}
            >
              {item.label}
            </Typography>

            <Typography
              noWrap
              sx={{
                color: "#94a3b8",
                fontSize: 9.5,
                fontWeight: 750,
              }}
            >
              {item.display}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={percent(item.value, max)}
            sx={{
              height: 8,
              borderRadius: 99,
              backgroundColor: "#edf1f5",

              "& .MuiLinearProgress-bar": {
                borderRadius: 99,
                backgroundColor: color,
              },
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

const AccountProgress = ({
  title,
  subtitle,
  percentValue,
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  color = "#22c55e",
}) => (
  <Box
    sx={{
      p: 2.2,
      borderRadius: "18px",
      border: "1px solid #e7ebf0",
      background: "linear-gradient(145deg,#ffffff,#f8fafc)",
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Typography
          sx={{
            color: "#334155",
            fontSize: 12.5,
            fontWeight: 950,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            color: "#94a3b8",
            fontSize: 9.5,
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      <Typography
        sx={{
          color,
          fontSize: 22,
          fontWeight: 950,
          letterSpacing: "-.04em",
        }}
      >
        {percentValue}%
      </Typography>
    </Box>

    <LinearProgress
      variant="determinate"
      value={percentValue}
      sx={{
        mt: 2.2,
        height: 11,
        borderRadius: 99,
        backgroundColor: "#e9eef3",

        "& .MuiLinearProgress-bar": {
          borderRadius: 99,
          background: `linear-gradient(90deg,${color},${color}bb)`,
        },
      }}
    />

    <Box
      sx={{
        mt: 2.2,
        pt: 1.8,
        display: "grid",
        gridTemplateColumns: "repeat(2,minmax(0,1fr))",
        gap: 1.3,
        borderTop: "1px solid #edf0f3",
      }}
    >
      <Box>
        <Typography
          sx={{
            color: "#94a3b8",
            fontSize: 9,
            fontWeight: 750,
          }}
        >
          {leftLabel}
        </Typography>

        <Typography
          noWrap
          sx={{
            mt: 0.6,
            color: "#334155",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {leftValue}
        </Typography>
      </Box>

      <Box>
        <Typography
          sx={{
            color: "#94a3b8",
            fontSize: 9,
            fontWeight: 750,
          }}
        >
          {rightLabel}
        </Typography>

        <Typography
          noWrap
          sx={{
            mt: 0.6,
            color,
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {rightValue}
        </Typography>
      </Box>
    </Box>
  </Box>
);

const HistoryTable = ({ title, subtitle, rows = [], columns = [], empty }) => (
  <Surface>
    <Box
      sx={{
        px: 2.4,
        py: 2,
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
            fontSize: 14,
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
              fontSize: 9.5,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      <Chip
        size="small"
        label={`${number(rows.length)} ta`}
        sx={{
          height: 24,
          color: "#64748b",
          fontSize: 9,
          fontWeight: 900,
          backgroundColor: "#f1f5f9",
        }}
      />
    </Box>

    <Box sx={{ overflowX: "auto" }}>
      <Table
        size="small"
        sx={{
          minWidth: 620,

          "& th": {
            py: 1.45,
            color: "#94a3b8",
            fontSize: 9.5,
            fontWeight: 900,
            letterSpacing: ".035em",
            textTransform: "uppercase",
            backgroundColor: "#fafbfc",
            borderColor: "#edf0f3",
          },

          "& td": {
            py: 1.4,
            color: "#475569",
            fontSize: 10.5,
            fontWeight: 700,
            borderColor: "#edf0f3",
          },

          "& tbody tr:hover": {
            backgroundColor: "rgba(153,27,27,.025)",
          },
        }}
      >
        <TableHead>
          <TableRow>
            {columns.map(([label]) => (
              <TableCell key={label}>{label}</TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length ? (
            rows.map((item, rowIndex) => (
              <TableRow key={item.id || rowIndex} hover>
                {columns.map(([label, render]) => (
                  <TableCell key={label}>{render(item)}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                align="center"
                sx={{
                  py: 7,
                  color: "#94a3b8",
                  fontWeight: 800,
                }}
              >
                {empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  </Surface>
);

const User = ({ backTo = "/users" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const currentUser = auth?.user || getLocalUser();

  const canViewClientSales = hasPermission(currentUser, "client_sales.view");

  const canViewProduction = hasPermission(currentUser, "production.view");

  const canViewPayroll = hasPermission(currentUser, "payroll.view");

  const [employee, setEmployee] = useState(null);

  const [details, setDetails] = useState(null);

  const [loading, setLoading] = useState(true);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const [error, setError] = useState("");

  const fetchRoleDetails = useCallback(
    async (user) => {
      if (!user || !["client", "worker"].includes(user.role)) {
        setDetails(null);
        return;
      }

      setDetailsLoading(true);

      try {
        if (user.role === "client") {
          if (!canViewClientSales) {
            setDetails({
              type: "client",
              restricted: true,
            });

            return;
          }

          const [balanceResult, salesResult, paymentsResult] = await Promise.allSettled([
            getClientBalance({
              client_id: user.id,
            }),

            getClientSales({
              client_id: user.id,
              offset: 0,
              limit: 6,
              sort_by: "sold_at",
              sort_order: "desc",
            }),

            getClientPayments({
              client_id: user.id,
              offset: 0,
              limit: 6,
              sort_by: "paid_at",
              sort_order: "desc",
            }),
          ]);

          setDetails({
            type: "client",

            balance:
              balanceResult.status === "fulfilled" ? balanceResult.value.data.balance || {} : {},

            sales:
              salesResult.status === "fulfilled" ? salesResult.value.data.client_sales || [] : [],

            salesTotal:
              salesResult.status === "fulfilled" ? salesResult.value.data.pageInfo?.total || 0 : 0,

            payments:
              paymentsResult.status === "fulfilled"
                ? paymentsResult.value.data.client_payments || []
                : [],
          });
        } else {
          if (!canViewProduction && !canViewPayroll) {
            setDetails({
              type: "worker",
              restricted: true,
            });

            return;
          }

          const [
            balanceResult,
            advanceBalanceResult,
            outputsResult,
            paymentsResult,
            advancesResult,
          ] = await Promise.allSettled([
            canViewPayroll
              ? getWorkerBalance({
                  worker_id: user.id,
                })
              : Promise.resolve({
                  data: {
                    balance: {},
                  },
                }),

            canViewPayroll
              ? getWorkerAdvanceBalance({
                  worker_id: user.id,
                })
              : Promise.resolve({
                  data: {
                    balance: {},
                  },
                }),

            canViewProduction
              ? getWorkerOutputs({
                  worker_id: user.id,
                  offset: 0,
                  limit: 6,
                  sort_by: "worked_at",
                  sort_order: "desc",
                })
              : Promise.resolve({
                  data: {
                    worker_outputs: [],
                    totals: {},
                  },
                }),

            canViewPayroll
              ? getWorkerPayments({
                  worker_id: user.id,
                  offset: 0,
                  limit: 6,
                  sort_by: "paid_at",
                  sort_order: "desc",
                })
              : Promise.resolve({
                  data: {
                    worker_payments: [],
                  },
                }),

            canViewPayroll
              ? getWorkerAdvances({
                  worker_id: user.id,
                  offset: 0,
                  limit: 6,
                  sort_by: "given_at",
                  sort_order: "desc",
                })
              : Promise.resolve({
                  data: {
                    worker_advances: [],
                  },
                }),
          ]);

          setDetails({
            type: "worker",

            balance:
              balanceResult.status === "fulfilled" ? balanceResult.value.data.balance || {} : {},

            advance:
              advanceBalanceResult.status === "fulfilled"
                ? advanceBalanceResult.value.data.balance || {}
                : {},

            outputs:
              outputsResult.status === "fulfilled"
                ? outputsResult.value.data.worker_outputs || []
                : [],

            outputTotals:
              outputsResult.status === "fulfilled" ? outputsResult.value.data.totals || {} : {},

            payments:
              paymentsResult.status === "fulfilled"
                ? paymentsResult.value.data.worker_payments || []
                : [],

            advances:
              advancesResult.status === "fulfilled"
                ? advancesResult.value.data.worker_advances || []
                : [],
          });
        }
      } finally {
        setDetailsLoading(false);
      }
    },
    [canViewClientSales, canViewPayroll, canViewProduction],
  );

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await getUser(id);

      const foundUser = data?.user || data?.found_user || data?.result || data;

      setEmployee(foundUser);

      await fetchRoleDetails(foundUser);
    } catch (requestError) {
      const status = requestError?.response?.status;

      if (status === 403) {
        setError("Bu foydalanuvchi ma’lumotlarini ko‘rishga ruxsatingiz yo‘q.");
      } else if (status === 404) {
        setError("Foydalanuvchi topilmadi.");
      } else {
        setError(
          requestError?.response?.data?.message || "Ma’lumotlarni olishda xatolik yuz berdi.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [fetchRoleDetails, id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const prepared = useMemo(() => {
    const clientBalance = details?.balance || {};

    const workerBalance = details?.balance || {};

    const remainingAdvance = details?.advance?.remaining_advance ?? details?.advance?.balance ?? 0;

    const workerDepartments = Object.values(
      (details?.outputs || []).reduce((result, item) => {
        const label = item.department_name || "Bo‘limsiz";

        result[label] = result[label] || {
          label,
          value: 0,
        };

        result[label].value += Number(item.quantity || 0);

        result[label].display = `${number(result[label].value)} dona`;

        return result;
      }, {}),
    );

    const clientProducts = Object.values(
      (details?.sales || []).reduce((result, item) => {
        const label = item.product_name || "Mahsulot";

        result[label] = result[label] || {
          label,
          value: 0,
        };

        result[label].value += Number(item.total_amount || 0);

        result[label].display = money(result[label].value);

        return result;
      }, {}),
    );

    return {
      clientBalance,
      workerBalance,
      remainingAdvance,
      workerDepartments,
      clientProducts,
    };
  }, [details]);

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
            border: "1px solid rgba(153,27,27,.10)",
            backgroundColor: "rgba(153,27,27,.05)",
          }}
        >
          <CircularProgress
            size={34}
            thickness={4.5}
            sx={{
              color: "#991b1b",
            }}
          />
        </Box>

        <Typography
          sx={{
            color: "#94a3b8",
            fontSize: 12.5,
            fontWeight: 750,
          }}
        >
          Foydalanuvchi ma’lumotlari yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>

        <Button
          variant="outlined"
          onClick={() => navigate(backTo)}
          sx={{
            mt: 2,
            borderRadius: "12px",
            fontWeight: 850,
            textTransform: "none",
          }}
        >
          Orqaga qaytish
        </Button>
      </Box>
    );
  }

  if (!employee) {
    return <Alert severity="warning">Foydalanuvchi topilmadi.</Alert>;
  }

  const fullName =
    `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Nomsiz foydalanuvchi";

  const roleName = roleNames[employee.role] || employee.role || "Foydalanuvchi";

  const { clientBalance, workerBalance, remainingAdvance, workerDepartments, clientProducts } =
    prepared;

  const clientPaymentPercent = percent(clientBalance.paid_amount, clientBalance.total_amount);

  const workerPaymentPercent = percent(workerBalance.total_paid, workerBalance.total_earned);

  return (
    <Box
      className="crm-page"
      sx={{
        height: "100%",
        minHeight: 0,
        pr: 0.5,
        pb: 4,
        overflowY: "auto",
      }}
    >
      <style>{userPageStyles}</style>

      {/* Profil hero */}

      <Box
        component="section"
        className="user-profile-hero"
        sx={{
          position: "relative",
          isolation: "isolate",
          mb: 2.5,
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
            "radial-gradient(circle at 100% 0%,rgba(220,38,38,.34),transparent 31%),linear-gradient(145deg,#0d1117,#171117 52%,#3a121a) !important",
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
              xl: "1.05fr .95fr",
            },
            gap: 3,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              minWidth: 0,
              display: "flex",
              flexDirection: {
                xs: "column",
                sm: "row",
              },
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              gap: 2.3,
            }}
          >
            <Avatar
              src={getImageUrl(employee.user_image)}
              sx={{
                width: {
                  xs: 82,
                  md: 94,
                },
                height: {
                  xs: 82,
                  md: 94,
                },
                flexShrink: 0,
                color: "#ffffff",
                fontSize: 30,
                fontWeight: 950,
                background: "linear-gradient(135deg,#7f1d1d,#dc2626)",
                border: "5px solid rgba(255,255,255,.12)",
                boxShadow: "0 18px 42px rgba(127,29,29,.32)",
              }}
            >
              {getInitials(employee)}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <RoleChip role={employee.role} />

                <Chip
                  size="small"
                  label={employee.is_deleted ? "O‘chirilgan" : "Faol profil"}
                  sx={{
                    height: 27,
                    color: employee.is_deleted ? "#fecaca !important" : "#bbf7d0 !important",
                    fontSize: 9.5,
                    fontWeight: 900,
                    border: employee.is_deleted
                      ? "1px solid rgba(248,113,113,.18)"
                      : "1px solid rgba(74,222,128,.16)",
                    backgroundColor: employee.is_deleted
                      ? "rgba(220,38,38,.14) !important"
                      : "rgba(34,197,94,.13) !important",
                  }}
                />
              </Box>

              <Typography
                component="h1"
                sx={{
                  mt: 1.5,
                  color: "#ffffff !important",
                  fontSize: {
                    xs: 27,
                    md: 36,
                  },
                  lineHeight: 1.08,
                  fontWeight: 950,
                  letterSpacing: "-.045em",
                  wordBreak: "break-word",
                }}
              >
                {fullName}
              </Typography>

              <Typography
                sx={{
                  mt: 0.9,
                  color: "rgba(255,255,255,.47) !important",
                  fontSize: 12,
                  lineHeight: 1.65,
                }}
              >
                @{employee.username || "username"} · {roleName}
              </Typography>

              <Typography
                sx={{
                  maxWidth: 570,
                  mt: 1.2,
                  color: "rgba(255,255,255,.34) !important",
                  fontSize: 10.5,
                  lineHeight: 1.7,
                }}
              >
                Foydalanuvchining shaxsiy, ish va hisob-kitob ma’lumotlari.
              </Typography>
            </Box>
          </Box>

          <Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,minmax(0,1fr))",
                },
                gap: 1.2,
              }}
            >
              <HeroInfoItem label="Foydalanuvchi ID" value={`#${employee.id}`} />

              <HeroInfoItem label="Telefon" value={employee.phone || "-"} />

              <HeroInfoItem label="Tizimga qo‘shilgan" value={date(employee.created_at)} />

              <HeroInfoItem label="Oxirgi yangilanish" value={date(employee.updated_at)} />
            </Box>

            <Button
              onClick={() => navigate(backTo)}
              sx={{
                mt: 1.5,
                minHeight: 41,
                px: 2,
                color: "#ffffff !important",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,.10)",
                backgroundColor: "rgba(255,255,255,.055)",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "none",

                "&:hover": {
                  backgroundColor: "rgba(255,255,255,.10)",
                },
              }}
            >
              ← Orqaga qaytish
            </Button>
          </Box>
        </Box>
      </Box>

      {detailsLoading && (
        <Box
          sx={{
            minHeight: 260,
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress
            size={30}
            sx={{
              color: "#991b1b",
            }}
          />
        </Box>
      )}

      {!detailsLoading && details?.restricted && (
        <Surface sx={{ p: 3 }}>
          <Typography
            sx={{
              color: "#0f172a",
              fontSize: 17,
              fontWeight: 950,
            }}
          >
            Ma’lumotlar yopiq
          </Typography>

          <Typography
            sx={{
              mt: 0.8,
              color: "#64748b",
              fontSize: 12,
              lineHeight: 1.7,
            }}
          >
            Sizda bu foydalanuvchining moliyaviy yoki ishlab chiqarish ma’lumotlarini ko‘rish uchun
            ruxsat mavjud emas.
          </Typography>
        </Surface>
      )}

      {/* Mijoz ma’lumotlari */}

      {!detailsLoading && details?.type === "client" && !details.restricted && (
        <>
          <Box
            sx={{
              mb: 2.5,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,minmax(0,1fr))",
                xl: "repeat(4,minmax(0,1fr))",
              },
              gap: 2,
            }}
          >
            <StatCard
              label="Jami savdo"
              value={money(clientBalance.total_amount)}
              helper={`${number(details.salesTotal)} ta savdo yozuvi`}
              tone="blue"
            />

            <StatCard
              label="Jami to‘langan"
              value={money(clientBalance.paid_amount)}
              helper={`${clientPaymentPercent}% to‘lov bajarilgan`}
              tone="green"
            />

            <StatCard
              label="Qolgan qarz"
              value={money(clientBalance.debt_amount)}
              helper="Mijozdan olinishi kerak"
              tone={Number(clientBalance.debt_amount) > 0 ? "amber" : "green"}
            />

            <StatCard
              label="Hisob holati"
              value={Number(clientBalance.debt_amount) > 0 ? "Qarzdor" : "Yopilgan"}
              helper="Mijoz bilan umumiy hisob"
              tone={Number(clientBalance.debt_amount) > 0 ? "red" : "green"}
            />
          </Box>

          <Box
            sx={{
              mb: 2.5,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "1.15fr .9fr .75fr",
              },
              gap: 2,
            }}
          >
            <Section title="To‘lov holati" subtitle="Savdo summasining to‘langan qismi">
              <AccountProgress
                title="Mijoz to‘lov darajasi"
                subtitle="Jami savdoga nisbatan"
                percentValue={clientPaymentPercent}
                leftLabel="Jami savdo"
                leftValue={money(clientBalance.total_amount)}
                rightLabel="To‘langan"
                rightValue={money(clientBalance.paid_amount)}
                color="#22c55e"
              />
            </Section>

            <Section title="Mahsulotlar kesimi" subtitle="Mijoz olgan mahsulotlar">
              <ProgressRows
                items={clientProducts}
                color="#7c3aed"
                empty="Mahsulotlar bo‘yicha savdo topilmadi."
              />
            </Section>

            <Section title="Muhim ma’lumotlar" subtitle="Tezkor hisob xulosasi">
              <InfoItem
                label="Qolgan qarz"
                value={money(clientBalance.debt_amount)}
                valueColor={Number(clientBalance.debt_amount) > 0 ? "#b45309" : "#15803d"}
              />

              <InfoItem label="Savdolar soni" value={`${number(details.salesTotal)} ta`} />

              <InfoItem
                label="Oxirgi to‘lov"
                value={
                  details.payments[0]
                    ? `${money(details.payments[0].amount)} · ${date(details.payments[0].paid_at)}`
                    : "To‘lov mavjud emas"
                }
              />
            </Section>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            <HistoryTable
              title="Oxirgi savdolar"
              subtitle="Mijozga rasmiylashtirilgan savdolar"
              empty="Savdo topilmadi"
              rows={details.sales}
              columns={[
                ["Sana", (item) => date(item.sold_at || item.created_at)],

                [
                  "Mahsulot",
                  (item) =>
                    item.product_name ||
                    item.items
                      ?.map((value) => value.product_name)
                      .filter(Boolean)
                      .join(", ") ||
                    "-",
                ],

                ["Jami", (item) => money(item.total_amount)],

                ["Qarz", (item) => money(item.remaining_debt ?? item.debt_amount)],
              ]}
            />

            <HistoryTable
              title="Oxirgi to‘lovlar"
              subtitle="Mijozdan qabul qilingan tushumlar"
              empty="To‘lov topilmadi"
              rows={details.payments}
              columns={[
                ["Sana", (item) => date(item.paid_at || item.created_at)],

                ["Summa", (item) => money(item.amount)],

                ["Izoh", (item) => item.note || "-"],
              ]}
            />
          </Box>
        </>
      )}

      {/* Ishchi ma’lumotlari */}

      {!detailsLoading && details?.type === "worker" && !details.restricted && (
        <>
          <Box
            sx={{
              mb: 2.5,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,minmax(0,1fr))",
                xl: "repeat(4,minmax(0,1fr))",
              },
              gap: 2,
            }}
          >
            <StatCard
              label="Hisoblangan ish haqi"
              value={money(workerBalance.total_earned)}
              helper={`${number(details.outputTotals.total_quantity)} dona bajarilgan ish`}
              tone="blue"
            />

            <StatCard
              label="Jami berilgan"
              value={money(workerBalance.total_paid)}
              helper={`${workerPaymentPercent}% to‘lov bajarilgan`}
              tone="green"
            />

            <StatCard
              label="To‘lanishi kerak"
              value={money(workerBalance.remaining)}
              helper="Qolgan ish haqi"
              tone={Number(workerBalance.remaining) > 0 ? "amber" : "green"}
            />

            <StatCard
              label="Qolgan avans"
              value={money(remainingAdvance)}
              helper="Keyingi hisobda ushlanadi"
              tone="red"
            />
          </Box>

          <Box
            sx={{
              mb: 2.5,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "1.15fr .9fr .75fr",
              },
              gap: 2,
            }}
          >
            <Section title="Ish haqi holati" subtitle="Hisoblangan summaning to‘langan qismi">
              <AccountProgress
                title="Ish haqi to‘lov darajasi"
                subtitle="Hisoblangan ish haqiga nisbatan"
                percentValue={workerPaymentPercent}
                leftLabel="Hisoblangan"
                leftValue={money(workerBalance.total_earned)}
                rightLabel="Berilgan"
                rightValue={money(workerBalance.total_paid)}
                color="#22c55e"
              />
            </Section>

            <Section title="Bo‘limlar kesimi" subtitle="Bo‘limlarda bajarilgan ishlar">
              <ProgressRows
                items={workerDepartments}
                color="#7c3aed"
                empty="Bo‘limlar bo‘yicha ish topilmadi."
              />
            </Section>

            <Section title="Muhim ma’lumotlar" subtitle="Ishchi hisobining xulosasi">
              <InfoItem
                label="Berilishi kerak"
                value={money(workerBalance.remaining)}
                valueColor={Number(workerBalance.remaining) > 0 ? "#b45309" : "#15803d"}
              />

              <InfoItem label="Qolgan avans" value={money(remainingAdvance)} />

              <InfoItem
                label="Bajarilgan ish"
                value={`${number(details.outputTotals.total_quantity)} dona`}
              />
            </Section>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            <HistoryTable
              title="Oxirgi bajarilgan ishlar"
              subtitle="Ishchining ishlab chiqarish yozuvlari"
              empty="Ish yozuvi topilmadi"
              rows={details.outputs}
              columns={[
                ["Sana", (item) => date(item.worked_at)],

                [
                  "Mahsulot / bo‘lim",
                  (item) => `${item.product_name || "-"} / ${item.department_name || "-"}`,
                ],

                ["Miqdor", (item) => `${number(item.quantity)} dona`],

                ["Haq", (item) => money(item.total_amount)],
              ]}
            />

            <HistoryTable
              title="Oxirgi ish haqi to‘lovlari"
              subtitle="Ishchiga berilgan pullar"
              empty="To‘lov topilmadi"
              rows={details.payments}
              columns={[
                ["Sana", (item) => date(item.paid_at || item.payment_date)],

                ["Berilgan", (item) => money(item.amount)],

                ["Avansdan", (item) => money(item.advance_deduction)],
              ]}
            />

            <Box
              sx={{
                gridColumn: {
                  xs: "auto",
                  xl: "1 / -1",
                },
              }}
            >
              <HistoryTable
                title="Avanslar"
                subtitle="Ishchiga berilgan avanslar tarixi"
                empty="Avans topilmadi"
                rows={details.advances}
                columns={[
                  ["Sana", (item) => date(item.given_at || item.created_at)],

                  ["Summa", (item) => money(item.amount)],

                  ["Izoh", (item) => item.note || "-"],
                ]}
              />
            </Box>
          </Box>
        </>
      )}

      {/* Admin va boshqa rollar */}

      {!detailsLoading && !details && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              xl: ".75fr 1.25fr",
            },
            gap: 2,
          }}
        >
          <Section title="Profil ma’lumotlari" subtitle="Foydalanuvchining asosiy ma’lumotlari">
            <InfoItem label="Ism va familiya" value={fullName} />

            <InfoItem label="Foydalanuvchi nomi" value={`@${employee.username || "-"}`} />

            <InfoItem label="Telefon" value={employee.phone || "-"} />

            <InfoItem label="Ruxsat turi" value={roleName} />

            {employee.position_name && <InfoItem label="Lavozim" value={employee.position_name} />}

            {employee.department_name && (
              <InfoItem label="Bo‘lim" value={employee.department_name} />
            )}
          </Section>

          <Section title="Tizimdagi holati" subtitle="Profil va ruxsat haqida ma’lumot">
            <Box
              sx={{
                minHeight: 230,
                p: 2.4,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                borderRadius: "18px",
                border: "1px solid #e7ebf0",
                background:
                  "radial-gradient(circle at 100% 0%,rgba(153,27,27,.07),transparent 31%),linear-gradient(145deg,#ffffff,#f8fafc)",
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  display: "grid",
                  placeItems: "center",
                  color: "#ffffff",
                  borderRadius: "15px",
                  background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
                  boxShadow: "0 12px 26px rgba(127,29,29,.20)",
                  fontSize: 17,
                  fontWeight: 950,
                }}
              >
                {roleName.charAt(0)}
              </Box>

              <Typography
                sx={{
                  mt: 2,
                  color: "#0f172a",
                  fontSize: 18,
                  fontWeight: 950,
                }}
              >
                {roleName}
              </Typography>

              <Typography
                sx={{
                  maxWidth: 600,
                  mt: 0.8,
                  color: "#64748b",
                  fontSize: 11.5,
                  lineHeight: 1.75,
                }}
              >
                Bu foydalanuvchi uchun alohida moliyaviy yoki ishlab chiqarish hisoboti
                yuritilmaydi. Uning imkoniyatlari biriktirilgan rol va ruxsatlar orqali
                boshqariladi.
              </Typography>

              <Box
                sx={{
                  mt: 2.2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Chip size="small" label={`ID: ${employee.id}`} sx={genericChipSx} />

                <Chip
                  size="small"
                  label={employee.is_deleted ? "O‘chirilgan" : "Faol"}
                  sx={{
                    ...genericChipSx,
                    color: employee.is_deleted ? "#b91c1c" : "#15803d",
                    backgroundColor: employee.is_deleted
                      ? "rgba(220,38,38,.08)"
                      : "rgba(34,197,94,.08)",
                  }}
                />
              </Box>
            </Box>
          </Section>
        </Box>
      )}
    </Box>
  );
};

const genericChipSx = {
  height: 25,
  color: "#64748b",
  fontSize: 9.5,
  fontWeight: 900,
  backgroundColor: "#f1f5f9",
};

const userPageStyles = `
  .crm-page .user-profile-hero {
    color: #ffffff !important;
    background-color: #0d1117 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.34),
        transparent 31%
      ),
      linear-gradient(
        145deg,
        #0d1117,
        #171117 52%,
        #3a121a
      ) !important;
  }
`;

export default User;
