import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { getUser } from "../../api/getUsers";
import { getClientBalance, getClientSales } from "../../api/clientSales";
import { getClientPayments } from "../../api/clientPayments";
import { getWorkerOutputs } from "../../api/workerOutputs";
import { getWorkerBalance, getWorkerPayments } from "../../api/workerPayments";
import { getWorkerAdvanceBalance, getWorkerAdvances } from "../../api/workerAdvances";

const roleNames = {
  super_admin: "Super admin",
  admin: "Admin",
  client: "Mijoz",
  customer: "Xaridor",
  worker: "Ishchi",
  packer: "Qadoqlovchi",
  supplier: "Yetkazuvchi",
};

const roleColors = {
  super_admin: {
    color: "#7c2d12",
    bg: "rgba(251, 146, 60, 0.13)",
    border: "rgba(251, 146, 60, 0.28)",
  },
  admin: {
    color: "#1d4ed8",
    bg: "rgba(59, 130, 246, 0.12)",
    border: "rgba(59, 130, 246, 0.25)",
  },
  client: {
    color: "#15803d",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.25)",
  },
  customer: {
    color: "#6d28d9",
    bg: "rgba(139, 92, 246, 0.12)",
    border: "rgba(139, 92, 246, 0.25)",
  },
  worker: {
    color: "#8b0101",
    bg: "rgba(139, 1, 1, 0.09)",
    border: "rgba(139, 1, 1, 0.18)",
  },
  default: {
    color: "#334155",
    bg: "rgba(100, 116, 139, 0.1)",
    border: "rgba(100, 116, 139, 0.18)",
  },
};

const money = (value) => `${Number(value || 0).toLocaleString("uz-UZ")} so'm`;
const number = (value) => Number(value || 0).toLocaleString("uz-UZ");

const date = (value, withTime = false) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat(
    "uz-UZ",
    withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" },
  ).format(new Date(value));
};

const getImageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;

  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const getInitial = (employee) => {
  const first = employee?.first_name?.[0];
  const username = employee?.username?.[0];

  return (first || username || "Z").toUpperCase();
};

const Card = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: "20px",
      border: "1px solid rgba(148, 163, 184, 0.22)",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
      boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const StatCard = ({ label, value, hint, tone = "blue" }) => {
  const tones = {
    blue: {
      icon: "↗",
      bg: "linear-gradient(135deg, #2563eb, #4f7df3)",
      soft: "rgba(37, 99, 235, 0.08)",
    },
    green: {
      icon: "●",
      bg: "linear-gradient(135deg, #10b981, #22c55e)",
      soft: "rgba(16, 185, 129, 0.08)",
    },
    purple: {
      icon: "◇",
      bg: "linear-gradient(135deg, #8b5cf6, #a855f7)",
      soft: "rgba(139, 92, 246, 0.08)",
    },
    orange: {
      icon: "△",
      bg: "linear-gradient(135deg, #f59e0b, #fb923c)",
      soft: "rgba(245, 158, 11, 0.1)",
    },
    red: {
      icon: "!",
      bg: "linear-gradient(135deg, #8b0101, #dc2626)",
      soft: "rgba(139, 1, 1, 0.08)",
    },
  };

  const current = tones[tone] || tones.blue;

  return (
    <Card
      sx={{
        minHeight: 112,
        p: 2.5,
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at top right, ${current.soft}, transparent 45%)`,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            {label}
          </Typography>

          <Typography
            sx={{
              mt: 0.7,
              fontSize: { xs: 20, md: 23 },
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-0.04em",
            }}
          >
            {value}
          </Typography>

          {hint && (
            <Typography
              sx={{
                mt: 0.5,
                fontSize: 13,
                fontWeight: 650,
                color: "#64748b",
              }}
            >
              {hint}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "15px",
            display: "grid",
            placeItems: "center",
            background: current.bg,
            color: "#fff",
            fontWeight: 950,
            fontSize: 18,
            boxShadow: "0 14px 28px rgba(15, 23, 42, 0.16)",
          }}
        >
          {current.icon}
        </Box>
      </Box>
    </Card>
  );
};

const InfoItem = ({ label, value }) => (
  <Box
    sx={{
      py: 1.5,
      borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
      "&:last-child": {
        borderBottom: "none",
      },
    }}
  >
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 800,
        color: "#64748b",
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        mt: 0.5,
        fontSize: 15,
        fontWeight: 850,
        color: "#0f172a",
        wordBreak: "break-word",
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const SectionCard = ({ title, subtitle, right, children }) => (
  <Card sx={{ p: 2.5 }}>
    <Box
      sx={{
        mb: 2.2,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: 17,
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              mt: 0.4,
              fontSize: 13,
              fontWeight: 650,
              color: "#64748b",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {right}
    </Box>

    {children}
  </Card>
);

const MetricBars = ({ items }) => {
  const max = Math.max(...items.map((item) => Number(item.value || 0)), 1);

  return (
    <Box
      sx={{
        height: 220,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-around",
        gap: 2,
        p: 2.5,
        pt: 3,
        borderRadius: "18px",
        background: "linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.85))",
      }}
    >
      {items.map((item) => {
        const height = Math.max(16, (Number(item.value || 0) / max) * 100);

        return (
          <Box
            key={item.label}
            sx={{
              flex: 1,
              minWidth: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  width: "70%",
                  maxWidth: 72,
                  height: `${height}%`,
                  borderRadius: "22px 22px 0 0",
                  background: item.color,
                  boxShadow: "0 18px 34px rgba(15, 23, 42, 0.13)",
                }}
              />
            </Box>

            <Typography
              sx={{
                mt: 1.5,
                fontSize: 14,
                fontWeight: 850,
                color: "#334155",
              }}
            >
              {item.label}
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                fontSize: 13,
                fontWeight: 700,
                color: "#8091ad",
              }}
            >
              {item.display}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

const ProgressList = ({ items, empty }) => {
  const max = Math.max(...items.map((item) => Number(item.value || 0)), 1);

  if (!items.length) {
    return (
      <Box
        sx={{
          minHeight: 170,
          display: "grid",
          placeItems: "center",
          borderRadius: "18px",
          background: "rgba(248, 250, 252, 0.9)",
          border: "1px dashed rgba(148, 163, 184, 0.4)",
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: "#64748b",
          }}
        >
          {empty}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 2.2 }}>
      {items.slice(0, 7).map((item) => {
        const width = Math.max(5, (Number(item.value || 0) / max) * 100);

        return (
          <Box key={item.label}>
            <Box
              sx={{
                mb: 0.8,
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 850,
                  color: "#334155",
                }}
              >
                {item.label}
              </Typography>

              <Typography
                sx={{
                  flexShrink: 0,
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#64748b",
                }}
              >
                {item.display}
              </Typography>
            </Box>

            <Box
              sx={{
                height: 9,
                overflow: "hidden",
                borderRadius: 999,
                background: "#e8edf4",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${width}%`,
                  borderRadius: 999,
                  background: "linear-gradient(90deg, #8b5cf6, #7c3aed)",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const HistoryTable = ({ title, rows = [], columns = [], empty }) => (
  <Card>
    <Box
      sx={{
        px: 2.4,
        py: 2,
        borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {title}
      </Typography>

      <Chip
        size="small"
        label={`${rows.length} ta`}
        sx={{
          height: 24,
          fontSize: 12,
          fontWeight: 850,
          color: "#475569",
          background: "#f1f5f9",
        }}
      />
    </Box>

    <Box sx={{ overflowX: "auto" }}>
      <Table
        size="small"
        sx={{
          minWidth: 620,
          "& th": {
            py: 1.6,
            fontSize: 12,
            fontWeight: 900,
            color: "#64748b",
            background: "rgba(248, 250, 252, 0.95)",
            borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
          },
          "& td": {
            py: 1.6,
            fontSize: 13,
            fontWeight: 700,
            color: "#334155",
            borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
          },
          "& tr:last-child td": {
            borderBottom: "none",
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
            rows.map((item, index) => (
              <TableRow key={item.id || index} hover>
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
                  py: 6,
                  color: "#64748b",
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
  </Card>
);

const User = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRoleDetails = useCallback(async (user) => {
    if (!user || !["client", "worker"].includes(user.role)) {
      setDetails(null);
      return;
    }

    setDetailsLoading(true);

    try {
      if (user.role === "client") {
        const [balanceResult, salesResult, paymentsResult] = await Promise.allSettled([
          getClientBalance({ client_id: user.id }),
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
        const [balanceResult, advanceBalanceResult, outputsResult, paymentsResult, advancesResult] =
          await Promise.allSettled([
            getWorkerBalance({ worker_id: user.id }),
            getWorkerAdvanceBalance({ worker_id: user.id }),
            getWorkerOutputs({
              worker_id: user.id,
              offset: 0,
              limit: 6,
              sort_by: "worked_at",
              sort_order: "desc",
            }),
            getWorkerPayments({
              worker_id: user.id,
              offset: 0,
              limit: 6,
              sort_by: "paid_at",
              sort_order: "desc",
            }),
            getWorkerAdvances({
              worker_id: user.id,
              offset: 0,
              limit: 6,
              sort_by: "given_at",
              sort_order: "desc",
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
  }, []);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await getUser(id);
      const user = data?.user || data?.found_user || data?.result || data;

      setEmployee(user);
      await fetchRoleDetails(user);
    } catch (requestError) {
      const status = requestError?.response?.status;

      if (status === 403) {
        setError("Bu foydalanuvchi ma'lumotlarini ko'rishga ruxsatingiz yo'q.");
      } else if (status === 404) {
        setError("Foydalanuvchi topilmadi.");
      } else {
        setError(
          requestError?.response?.data?.message || "Ma'lumotlarni olishda xatolik yuz berdi.",
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
        const label = item.department_name || "Bo'limsiz";

        result[label] = result[label] || { label, value: 0 };
        result[label].value += Number(item.quantity || 0);
        result[label].display = `${number(result[label].value)} dona`;

        return result;
      }, {}),
    );

    const clientProducts = Object.values(
      (details?.sales || []).reduce((result, item) => {
        const label = item.product_name || "Mahsulot";

        result[label] = result[label] || { label, value: 0 };
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
          minHeight: 380,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress size={34} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>

        <Button
          variant="outlined"
          sx={{ mt: 2, borderRadius: "12px", fontWeight: 850 }}
          onClick={() => navigate("/users")}
        >
          Foydalanuvchilarga qaytish
        </Button>
      </Box>
    );
  }

  if (!employee) {
    return <Alert severity="warning">Foydalanuvchi topilmadi.</Alert>;
  }

  const fullName =
    `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Nomsiz foydalanuvchi";

  const roleStyle = roleColors[employee.role] || roleColors.default;
  const roleName = roleNames[employee.role] || employee.role || "Foydalanuvchi";

  const { clientBalance, workerBalance, remainingAdvance, workerDepartments, clientProducts } =
    prepared;

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        pr: 1,
        pb: 4,
      }}
    >
      <Card
        sx={{
          mb: 3,
          p: { xs: 2.2, md: 3 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", lg: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", lg: "row" },
            gap: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 2.2,
              minWidth: 0,
            }}
          >
            <Avatar
              src={getImageUrl(employee.user_image)}
              sx={{
                width: 84,
                height: 84,
                bgcolor: "#8b0101",
                color: "#fff",
                fontSize: 34,
                fontWeight: 900,
                border: "5px solid #fff",
                boxShadow: "0 18px 38px rgba(139, 1, 1, 0.18)",
                flexShrink: 0,
              }}
            >
              {getInitial(employee)}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Chip
                label={`Al-amin CRM • ${roleName} profili`}
                size="small"
                sx={{
                  mb: 1.1,
                  height: 26,
                  fontSize: 12,
                  fontWeight: 950,
                  color: roleStyle.color,
                  background: roleStyle.bg,
                  border: `1px solid ${roleStyle.border}`,
                }}
              />

              <Typography
                sx={{
                  fontSize: { xs: 25, md: 32 },
                  fontWeight: 950,
                  color: "#0f172a",
                  letterSpacing: "-0.055em",
                  lineHeight: 1.05,
                  wordBreak: "break-word",
                }}
              >
                {fullName} profili
              </Typography>

              <Typography
                sx={{
                  mt: 0.7,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#64748b",
                }}
              >
                @{employee.username || "username"} bo‘yicha umumiy nazorat paneli
              </Typography>

              <Box
                sx={{
                  mt: 1.2,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Chip
                  size="small"
                  label={roleName}
                  sx={{
                    height: 26,
                    px: 0.3,
                    fontSize: 12,
                    fontWeight: 900,
                    color: roleStyle.color,
                    background: roleStyle.bg,
                    border: `1px solid ${roleStyle.border}`,
                  }}
                />

                {employee.phone && (
                  <Chip
                    size="small"
                    label={employee.phone}
                    sx={{
                      height: 26,
                      px: 0.3,
                      fontSize: 12,
                      fontWeight: 850,
                      color: "#334155",
                      background: "#f1f5f9",
                      border: "1px solid rgba(148, 163, 184, 0.24)",
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              width: { xs: "100%", lg: "auto" },
              display: "flex",
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "flex-end",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.3,
                minWidth: { xs: "100%", md: 430 },
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "15px",
                  background: "rgba(248, 250, 252, 0.9)",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                  Foydalanuvchi ID
                </Typography>
                <Typography sx={{ mt: 0.4, fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
                  {employee.id || "-"}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "15px",
                  background: "rgba(248, 250, 252, 0.9)",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                  Tizimga qo‘shilgan
                </Typography>
                <Typography sx={{ mt: 0.4, fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
                  {date(employee.created_at)}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              onClick={() => navigate("/users")}
              sx={{
                minWidth: 110,
                height: 42,
                borderRadius: "13px",
                borderColor: "rgba(37, 99, 235, 0.22)",
                color: "#0f172a",
                fontWeight: 900,
                textTransform: "none",
                background: "#fff",
                "&:hover": {
                  borderColor: "#2563eb",
                  background: "rgba(37, 99, 235, 0.04)",
                },
              }}
            >
              Orqaga
            </Button>
          </Box>
        </Box>
      </Card>

      {detailsLoading && (
        <Box
          sx={{
            py: 6,
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress size={28} />
        </Box>
      )}

      {!detailsLoading && details?.type === "client" && (
        <>
          <Box
            sx={{
              mb: 3,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                xl: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            <StatCard
              label="Jami savdo"
              value={money(clientBalance.total_amount)}
              hint={`${details.salesTotal} ta savdo`}
              tone="blue"
            />

            <StatCard
              label="To'langan"
              value={money(clientBalance.paid_amount)}
              hint="Mijozdan kelgan tushum"
              tone="green"
            />

            <StatCard
              label="Qolgan qarz"
              value={money(clientBalance.debt_amount)}
              hint="Mijoz zimmasidagi qarz"
              tone={Number(clientBalance.debt_amount) > 0 ? "orange" : "green"}
            />

            <StatCard
              label="Hisob holati"
              value={Number(clientBalance.debt_amount) > 0 ? "Qarzdor" : "Yopilgan"}
              hint="Mijoz bilan umumiy hisob"
              tone={Number(clientBalance.debt_amount) > 0 ? "red" : "green"}
            />
          </Box>

          <Box
            sx={{
              mb: 3,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "1.2fr 1fr 0.95fr",
              },
              gap: 2,
            }}
          >
            <SectionCard
              title="Mijoz hisobi dinamikasi"
              subtitle="Savdo, tushum va qarz bo‘yicha kesim"
            >
              <MetricBars
                items={[
                  {
                    label: "Savdo",
                    value: clientBalance.total_amount,
                    display: money(clientBalance.total_amount),
                    color: "linear-gradient(180deg, #2563eb, #7aa2ff)",
                  },
                  {
                    label: "Tushum",
                    value: clientBalance.paid_amount,
                    display: money(clientBalance.paid_amount),
                    color: "linear-gradient(180deg, #10b981, #7dd3b0)",
                  },
                  {
                    label: "Qarz",
                    value: clientBalance.debt_amount,
                    display: money(clientBalance.debt_amount),
                    color: "linear-gradient(180deg, #f59e0b, #fdcc72)",
                  },
                ]}
              />
            </SectionCard>

            <SectionCard title="Mahsulotlar kesimi" subtitle="Mijoz olgan mahsulotlar bo‘yicha">
              <ProgressList items={clientProducts} empty="Mahsulot bo'yicha savdo topilmadi." />
            </SectionCard>

            <SectionCard title="Muhim ma'lumotlar" subtitle="Tezkor hisob xulosasi">
              <InfoItem label="Qolgan qarz" value={money(clientBalance.debt_amount)} />
              <InfoItem label="Savdolar soni" value={`${details.salesTotal} ta`} />
              <InfoItem
                label="Oxirgi to'lov"
                value={
                  details.payments[0]
                    ? `${money(details.payments[0].amount)} • ${date(details.payments[0].paid_at)}`
                    : "To'lov yo'q"
                }
              />
            </SectionCard>
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
              empty="Savdo topilmadi"
              rows={details.sales}
              columns={[
                ["Sana", (item) => date(item.sold_at || item.created_at)],
                [
                  "Mahsulot",
                  (item) =>
                    item.product_name ||
                    item.items
                      ?.map((x) => x.product_name)
                      .filter(Boolean)
                      .join(", ") ||
                    "-",
                ],
                ["Jami", (item) => money(item.total_amount)],
                ["Qarz", (item) => money(item.remaining_debt ?? item.debt_amount)],
              ]}
            />

            <HistoryTable
              title="Oxirgi tushumlar"
              empty="To'lov topilmadi"
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

      {!detailsLoading && details?.type === "worker" && (
        <>
          <Box
            sx={{
              mb: 3,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                xl: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            <StatCard
              label="Hisoblangan ish haqi"
              value={money(workerBalance.total_earned)}
              hint={`${number(details.outputTotals.total_quantity)} dona ish`}
              tone="blue"
            />

            <StatCard
              label="Berilgan"
              value={money(workerBalance.total_paid)}
              hint="Ishchiga to‘langan summa"
              tone="green"
            />

            <StatCard
              label="To'lanishi kerak"
              value={money(workerBalance.remaining)}
              hint="Qolgan ish haqi"
              tone={Number(workerBalance.remaining) > 0 ? "orange" : "green"}
            />

            <StatCard
              label="Qolgan avans"
              value={money(remainingAdvance)}
              hint="Avans balansi"
              tone="red"
            />
          </Box>

          <Box
            sx={{
              mb: 3,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "1.2fr 1fr 0.95fr",
              },
              gap: 2,
            }}
          >
            <SectionCard
              title="Ish haqi dinamikasi"
              subtitle="Hisoblangan, berilgan va qolgan summa"
            >
              <MetricBars
                items={[
                  {
                    label: "Hisoblandi",
                    value: workerBalance.total_earned,
                    display: money(workerBalance.total_earned),
                    color: "linear-gradient(180deg, #2563eb, #7aa2ff)",
                  },
                  {
                    label: "Berildi",
                    value: workerBalance.total_paid,
                    display: money(workerBalance.total_paid),
                    color: "linear-gradient(180deg, #10b981, #7dd3b0)",
                  },
                  {
                    label: "Qoldi",
                    value: workerBalance.remaining,
                    display: money(workerBalance.remaining),
                    color: "linear-gradient(180deg, #f59e0b, #fdcc72)",
                  },
                ]}
              />
            </SectionCard>

            <SectionCard title="Bo'limlar kesimi" subtitle="Qaysi bo‘limda qancha ish qilingan">
              <ProgressList items={workerDepartments} empty="Bo'limlar bo'yicha ish topilmadi." />
            </SectionCard>

            <SectionCard title="Muhim ma'lumotlar" subtitle="Ishchi hisobi">
              <InfoItem label="Berilishi kerak" value={money(workerBalance.remaining)} />
              <InfoItem label="Qolgan avans" value={money(remainingAdvance)} />
              <InfoItem
                label="Bajarilgan ish"
                value={`${number(details.outputTotals.total_quantity)} dona`}
              />
            </SectionCard>
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
              empty="Ish yozuvi topilmadi"
              rows={details.outputs}
              columns={[
                ["Sana", (item) => date(item.worked_at)],
                [
                  "Mahsulot / bo'lim",
                  (item) => `${item.product_name || "-"} / ${item.department_name || "-"}`,
                ],
                ["Miqdor", (item) => `${number(item.quantity)} dona`],
                ["Haq", (item) => money(item.total_amount)],
              ]}
            />

            <HistoryTable
              title="Oxirgi ish haqi to'lovlari"
              empty="To'lov topilmadi"
              rows={details.payments}
              columns={[
                ["Sana", (item) => date(item.paid_at || item.payment_date)],
                ["Berilgan", (item) => money(item.amount)],
                ["Avansdan", (item) => money(item.advance_deduction)],
              ]}
            />

            <Box sx={{ gridColumn: { xs: "auto", xl: "1 / -1" } }}>
              <HistoryTable
                title="Avanslar"
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

      {!detailsLoading && !details && (
        <Card sx={{ p: 3 }}>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            Tizim ma'lumotlari
          </Typography>

          <Typography
            sx={{
              mt: 0.7,
              fontSize: 14,
              fontWeight: 650,
              color: "#64748b",
            }}
          >
            Bu role uchun hozircha alohida hisob-kitob yuritilmaydi.
          </Typography>
        </Card>
      )}
    </Box>
  );
};

export default User;
