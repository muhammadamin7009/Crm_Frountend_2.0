import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
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
  Stack,
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

import { getAuditLogs } from "../../api/auditLogs";
import CrmPagination from "../../Components/Common/CrmPagination";

const actionNames = {
  POST: "Yaratildi",
  PUT: "Almashtirildi",
  PATCH: "O‘zgartirildi",
  DELETE: "O‘chirildi",
};

const entityNames = {
  users: "Hodim",
  products: "Mahsulot",
  categories: "Kategoriya",
  departments: "Bo‘lim",
  "worker-outputs": "Ish hisoboti",
  "worker-payments": "Ish haqi",
  "worker-advances": "Avans",
  "client-sales": "Mijoz savdosi",
  "client-payments": "Mijoz to‘lovi",
  "material-purchases": "Homashyo xaridi",
  suppliers: "Ta’minotchi",
  employees: "Hodim profili",
  "payroll-periods": "Haftalik hisob",
  expenses: "Xarajat",
  warehouses: "Ombor",
  inventory: "Ombor harakati",
  permissions: "Ruxsat",
};

const actionStyles = {
  POST: {
    color: "#15803d",
    background: "rgba(34,197,94,.09)",
    border: "rgba(34,197,94,.18)",
  },

  PUT: {
    color: "#1d4ed8",
    background: "rgba(37,99,235,.08)",
    border: "rgba(37,99,235,.17)",
  },

  PATCH: {
    color: "#b45309",
    background: "rgba(245,158,11,.10)",
    border: "rgba(245,158,11,.20)",
  },

  DELETE: {
    color: "#b91c1c",
    background: "rgba(220,38,38,.08)",
    border: "rgba(220,38,38,.18)",
  },
};

const formatNumber = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "-";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(parsedDate);
};

const getInitials = (row) => {
  const first = row?.first_name?.[0] || "";

  const last = row?.last_name?.[0] || "";

  const username = row?.username?.[0] || "";

  return `${first}${last}`.toUpperCase() || username.toUpperCase() || "A";
};

const getFullName = (row) => {
  if (!row) return "-";

  return (
    `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
    row.username ||
    "O‘chirilgan foydalanuvchi"
  );
};

const formatDetails = (details) => {
  if (details === null || details === undefined || details === "") {
    return "";
  }

  if (typeof details === "string") {
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch {
      return details;
    }
  }

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
};

const Card = ({ children, sx = {} }) => (
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

const HeroMetric = ({ label, value, helper, tone = "red" }) => {
  const tones = {
    red: ["#fecdd3", "rgba(220,38,38,.15)", "rgba(248,113,113,.15)"],

    green: ["#bbf7d0", "rgba(34,197,94,.14)", "rgba(74,222,128,.15)"],

    blue: ["#bfdbfe", "rgba(37,99,235,.15)", "rgba(96,165,250,.15)"],

    amber: ["#fde68a", "rgba(245,158,11,.15)", "rgba(251,191,36,.15)"],
  };

  const current = tones[tone] || tones.red;

  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: 126,
        p: 1.8,
        borderRadius: "18px",

        border: "1px solid rgba(255,255,255,.075)",

        background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",

        backdropFilter: "blur(16px)",
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          display: "grid",
          placeItems: "center",
          borderRadius: "11px",
          color: current[0],
          backgroundColor: current[1],
          border: `1px solid ${current[2]}`,
          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.35,

          color: "rgba(255,255,255,.44) !important",

          fontSize: 9.5,
          fontWeight: 750,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.6,

          color: "#ffffff !important",

          fontSize: 18,
          lineHeight: 1.2,
          fontWeight: 950,
          letterSpacing: "-.035em",
        }}
      >
        {value}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.55,

          color: "rgba(255,255,255,.28) !important",

          fontSize: 9,
        }}
      >
        {helper}
      </Typography>
    </Box>
  );
};

const ActionChip = ({ action }) => {
  const current = actionStyles[action] || {
    color: "#64748b",
    background: "#f1f5f9",
    border: "#e2e8f0",
  };

  return (
    <Chip
      size="small"
      label={actionNames[action] || action || "-"}
      sx={{
        height: 25,
        px: 0.3,
        color: current.color,
        fontSize: 9.5,
        fontWeight: 900,

        backgroundColor: current.background,

        border: `1px solid ${current.border}`,
      }}
    />
  );
};

const EntityChip = ({ entity }) => (
  <Chip
    size="small"
    label={entityNames[entity] || entity || "-"}
    sx={{
      height: 25,
      px: 0.3,
      color: "#1d4ed8",
      fontSize: 9.5,
      fontWeight: 900,

      backgroundColor: "rgba(37,99,235,.08)",

      border: "1px solid rgba(37,99,235,.16)",
    }}
  />
);

const StatusChip = ({ status }) => {
  const statusCode = Number(status || 0);

  const success = statusCode >= 200 && statusCode < 400;

  const unknown = !statusCode;

  return (
    <Chip
      size="small"
      label={unknown ? "Kod yo‘q" : `${statusCode}`}
      sx={{
        height: 23,
        px: 0.2,

        color: unknown ? "#64748b" : success ? "#15803d" : "#b91c1c",

        fontSize: 9,
        fontWeight: 900,

        backgroundColor: unknown
          ? "#f1f5f9"
          : success
            ? "rgba(34,197,94,.08)"
            : "rgba(220,38,38,.08)",

        border: unknown
          ? "1px solid #e2e8f0"
          : success
            ? "1px solid rgba(34,197,94,.17)"
            : "1px solid rgba(220,38,38,.17)",
      }}
    />
  );
};

const DetailItem = ({ label, value, accent = false }) => (
  <Box
    sx={{
      minWidth: 0,
      p: 1.45,
      borderRadius: "15px",

      border: accent ? "1px solid rgba(153,27,27,.15)" : "1px solid #e7ebf0",

      backgroundColor: accent ? "rgba(153,27,27,.045)" : "#f8fafc",
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
      sx={{
        mt: 0.5,

        color: accent ? "#991b1b" : "#475569",

        fontSize: 10.5,
        fontWeight: 900,
        lineHeight: 1.55,
        wordBreak: "break-word",
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const AuditLogs = () => {
  const [rows, setRows] = useState([]);

  const [pageInfo, setPageInfo] = useState({
    total: 0,
    limit: 20,
    offset: 0,
  });

  const [q, setQ] = useState("");

  const [action, setAction] = useState("");

  const [loading, setLoading] = useState(false);

  const [selectedLog, setSelectedLog] = useState(null);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const pageStats = useMemo(() => {
    const actions = rows.reduce((result, row) => {
      const key = row.action || "OTHER";

      result[key] = (result[key] || 0) + 1;

      return result;
    }, {});

    const uniqueUsers = new Set(rows.map((row) => row.user_id || row.username || getFullName(row)))
      .size;

    return {
      created: actions.POST || 0,

      updated: (actions.PUT || 0) + (actions.PATCH || 0),

      deleted: actions.DELETE || 0,

      users: uniqueUsers,
    };
  }, [rows]);

  const load = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        const response = await getAuditLogs({
          q: q.trim(),
          action,
          offset,
          limit,
        });

        const data = response?.data || response || {};

        setRows(data.audit_logs || data.logs || []);

        setPageInfo(
          data.pageInfo || {
            total: 0,
            offset,
            limit,
          },
        );
      } catch (error) {
        toast.error(error?.response?.data?.message || "Amallar tarixini olishda xato.");
      } finally {
        setLoading(false);
      }
    },
    [action, q, pageInfo.limit],
  );

  useEffect(() => {
    const timer = setTimeout(
      () => load(0, pageInfo.limit),

      350,
    );

    return () => clearTimeout(timer);
  }, [q, action, pageInfo.limit, load]);

  const resetFilters = () => {
    setQ("");
    setAction("");
  };

  const closeDetails = () => {
    setSelectedLog(null);
  };

  return (
    <Box
      className="crm-page audit-logs-page"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2.5,
      }}
    >
      <style>{auditLogsPageStyles}</style>

      <Box
        component="section"
        className="audit-logs-hero"
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

          flexShrink: 0,

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
              xl: ".78fr 1.22fr",
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
                Tizim xavfsizligi
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
              Amallar tarixi
            </Typography>

            <Typography
              sx={{
                maxWidth: 555,
                mt: 1.4,

                color: "rgba(255,255,255,.45) !important",

                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Tizimda foydalanuvchilar tomonidan bajarilgan yaratish, tahrirlash, o‘chirish va
              boshqa muhim amallarni nazorat qiling.
            </Typography>

            <Button
              onClick={() => load(pageInfo.offset, pageInfo.limit)}
              disabled={loading}
              sx={{
                mt: 2.4,
                minHeight: 43,
                px: 2.1,

                color: "#ffffff !important",

                borderRadius: "13px",

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
              {loading ? "Yangilanmoqda..." : "Tarixni yangilash"}
            </Button>
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
              label="Jami yozuv"
              value={formatNumber(pageInfo.total)}
              helper="Tizimdagi barcha amallar"
              tone="blue"
            />

            <HeroMetric
              label="Sahifadagi amallar"
              value={formatNumber(rows.length)}
              helper={`${formatNumber(pageStats.users)} ta foydalanuvchi`}
              tone="green"
            />

            <HeroMetric
              label="Yaratilgan"
              value={formatNumber(pageStats.created)}
              helper="Joriy sahifadagi POST amallari"
              tone="amber"
            />

            <HeroMetric
              label="O‘chirilgan"
              value={formatNumber(pageStats.deleted)}
              helper={`${formatNumber(pageStats.updated)} ta o‘zgartirish`}
              tone="red"
            />
          </Box>
        </Box>
      </Box>

      <Card
        sx={{
          mb: 2,
          p: 2,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",

            alignItems: {
              xs: "stretch",
              md: "center",
            },

            justifyContent: "space-between",

            flexDirection: {
              xs: "column",
              md: "row",
            },

            gap: 1.4,
          }}
        >
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(240px,1fr) 190px",
              },

              gap: 1.2,
              flex: 1,
            }}
          >
            <TextField
              size="small"
              label="Qidirish"
              placeholder="Foydalanuvchi, bo‘lim yoki API manzil"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  load(0, pageInfo.limit);
                }
              }}
            />

            <TextField
              select
              size="small"
              label="Amal turi"
              value={action}
              onChange={(event) => setAction(event.target.value)}
            >
              <MenuItem value="">Barchasi</MenuItem>

              {Object.entries(actionNames).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
          >
            <Button variant="outlined" onClick={resetFilters} sx={filterButtonSx}>
              Tozalash
            </Button>

            <Button
              variant="outlined"
              onClick={() => load(0, pageInfo.limit)}
              disabled={loading}
              sx={filterButtonSx}
            >
              Yangilash
            </Button>
          </Stack>
        </Box>
      </Card>

      <Card
        sx={{
          minHeight: 0,
          flex: 1,
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
              Tizim amallari
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "#94a3b8",
                fontSize: 10.5,
              }}
            >
              Batafsil ma’lumotni ko‘rish uchun yozuv ustiga bosing
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${formatNumber(pageInfo.total)} ta`}
            sx={{
              height: 25,
              color: "#991b1b",
              fontSize: 9.5,
              fontWeight: 900,

              backgroundColor: "rgba(153,27,27,.07)",
            }}
          />
        </Box>

        <TableContainer
          sx={{
            minHeight: 0,
            flex: 1,
            overflow: "auto",
          }}
        >
          <Table
            stickyHeader
            sx={{
              minWidth: 1080,

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
              },

              "& tbody tr": {
                cursor: "pointer",
              },

              "& tbody tr:hover": {
                backgroundColor: "rgba(153,27,27,.025)",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Vaqt</TableCell>

                <TableCell>Foydalanuvchi</TableCell>

                <TableCell>Amal</TableCell>

                <TableCell>Bo‘lim</TableCell>

                <TableCell>Obyekt</TableCell>

                <TableCell>API manzil</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CircularProgress
                      size={30}
                      sx={{
                        color: "#991b1b",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id} hover onClick={() => setSelectedLog(row)}>
                    <TableCell
                      sx={{
                        minWidth: 150,
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#475569",
                          fontSize: 10,
                          fontWeight: 850,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(row.created_at)}
                      </Typography>
                    </TableCell>

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
                            width: 46,
                            height: 46,
                            flexShrink: 0,
                            color: "#ffffff",
                            fontSize: 12,
                            fontWeight: 950,

                            background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",

                            border: "3px solid #ffffff",

                            boxShadow: "0 8px 20px rgba(127,29,29,.16)",
                          }}
                        >
                          {getInitials(row)}
                        </Avatar>

                        <Box
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            noWrap
                            sx={{
                              maxWidth: 205,
                              color: "#334155",
                              fontSize: 12,
                              fontWeight: 900,
                            }}
                          >
                            {getFullName(row)}
                          </Typography>

                          <Typography
                            noWrap
                            sx={{
                              maxWidth: 205,
                              mt: 0.35,
                              color: "#94a3b8",
                              fontSize: 9.5,
                            }}
                          >
                            @{row.username || "unknown"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <ActionChip action={row.action} />
                    </TableCell>

                    <TableCell>
                      <EntityChip entity={row.entity_type} />
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Typography
                          sx={{
                            color: "#475569",
                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        >
                          #{row.entity_id || "-"}
                        </Typography>

                        <StatusChip status={row.status_code} />
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          maxWidth: 380,
                          color: "#64748b",
                          fontSize: 10,
                          fontWeight: 750,
                          lineHeight: 1.55,
                          wordBreak: "break-word",
                        }}
                      >
                        {row.path || "-"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{
                      py: 8,
                      color: "#94a3b8",
                      fontWeight: 850,
                    }}
                  >
                    Amallar tarixi topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            borderTop: "1px solid #edf0f3",

            backgroundColor: "#fafbfc",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) =>
              load(
                nextPage * pageInfo.limit,

                pageInfo.limit,
              )
            }
            onLimitChange={(limit) => load(0, limit)}
            rowsPerPageOptions={[20, 50, 100]}
          />
        </Box>
      </Card>

      <Dialog
        open={Boolean(selectedLog)}
        onClose={closeDetails}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            overflow: "hidden",
            borderRadius: "23px",

            border: "1px solid rgba(148,163,184,.20)",

            boxShadow: "0 30px 80px rgba(15,23,42,.22)",
          },
        }}
      >
        <DialogTitle
          className="audit-log-dialog-title"
          sx={{
            px: 3,
            py: 2.35,

            color: "#ffffff !important",

            backgroundColor: "#0d1117 !important",

            backgroundImage:
              "radial-gradient(circle at 100% 0%,rgba(220,38,38,.28),transparent 36%),linear-gradient(135deg,#11151c,#321319) !important",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",

              justifyContent: "space-between",

              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#ffffff !important",

                  fontSize: 19,
                  fontWeight: 950,
                }}
              >
                Amal tafsiloti
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  color: "rgba(255,255,255,.43) !important",

                  fontSize: 10.5,
                }}
              >
                Foydalanuvchi, obyekt, natija va API ma’lumotlari
              </Typography>
            </Box>

            {selectedLog && <ActionChip action={selectedLog.action} />}
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            py: "24px !important",
          }}
        >
          {selectedLog && (
            <Stack spacing={2.2}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.7,
                  borderRadius: "18px",

                  border: "1px solid #e7ebf0",

                  background: "linear-gradient(145deg,#ffffff,#f8fafc)",
                }}
              >
                <Avatar
                  sx={{
                    width: 55,
                    height: 55,
                    flexShrink: 0,
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 950,

                    background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",

                    boxShadow: "0 10px 25px rgba(127,29,29,.18)",
                  }}
                >
                  {getInitials(selectedLog)}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: "#0f172a",
                      fontSize: 15,
                      fontWeight: 950,
                    }}
                  >
                    {getFullName(selectedLog)}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.35,
                      color: "#94a3b8",
                      fontSize: 10,
                    }}
                  >
                    @{selectedLog.username || "unknown"} · {formatDate(selectedLog.created_at)}
                  </Typography>
                </Box>
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
                }}
              >
                <DetailItem
                  label="Amal"
                  value={actionNames[selectedLog.action] || selectedLog.action || "-"}
                  accent
                />

                <DetailItem
                  label="Bo‘lim"
                  value={entityNames[selectedLog.entity_type] || selectedLog.entity_type || "-"}
                />

                <DetailItem label="Obyekt ID" value={selectedLog.entity_id || "-"} />

                <DetailItem label="Natija kodi" value={selectedLog.status_code || "-"} />

                <DetailItem label="IP manzil" value={selectedLog.ip || "-"} />

                <DetailItem label="Audit ID" value={selectedLog.id || "-"} />

                <DetailItem label="Username" value={selectedLog.username || "-"} />

                <DetailItem label="Vaqt" value={formatDate(selectedLog.created_at)} />
              </Box>

              <Box
                sx={{
                  p: 1.7,
                  borderRadius: "17px",

                  border: "1px solid #e7ebf0",

                  backgroundColor: "#f8fafc",
                }}
              >
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                >
                  API MANZIL
                </Typography>

                <Typography
                  sx={{
                    mt: 0.6,
                    color: "#475569",
                    fontSize: 10.5,
                    fontWeight: 850,
                    lineHeight: 1.6,
                    wordBreak: "break-word",
                    userSelect: "text",
                  }}
                >
                  {selectedLog.path || "-"}
                </Typography>
              </Box>

              {selectedLog.details !== null &&
                selectedLog.details !== undefined &&
                selectedLog.details !== "" && (
                  <Box>
                    <Typography
                      sx={{
                        mb: 0.9,
                        color: "#334155",
                        fontSize: 11,
                        fontWeight: 950,
                      }}
                    >
                      Qo‘shimcha ma’lumot
                    </Typography>

                    <Box
                      component="pre"
                      sx={{
                        m: 0,
                        p: 1.7,
                        maxHeight: 320,
                        overflow: "auto",
                        borderRadius: "16px",

                        color: "#cbd5e1",

                        backgroundColor: "#0f172a",

                        border: "1px solid rgba(148,163,184,.18)",

                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",

                        fontSize: 10.5,
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        userSelect: "text",
                      }}
                    >
                      {formatDetails(selectedLog.details)}
                    </Box>
                  </Box>
                )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.1,

            borderTop: "1px solid #edf0f3",

            backgroundColor: "#fafbfc",
          }}
        >
          <Button
            onClick={closeDetails}
            sx={{
              minWidth: 100,
              minHeight: 40,
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
            }}
          >
            Yopish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const filterButtonSx = {
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

const auditLogsPageStyles = `
  .crm-page .audit-logs-hero {
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

  .audit-log-dialog-title {
    color: #ffffff !important;
    background-color: #0d1117 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.28),
        transparent 36%
      ),
      linear-gradient(
        135deg,
        #11151c,
        #321319
      ) !important;
  }
`;

export default AuditLogs;
