import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { CompatDialog as Dialog, CompatStack as Stack } from "../../Components/UI/MuiCompat";

import SharedHeroMetric from "../../Components/UI/HeroMetric";
import { toast } from "react-toastify";

import Card from "../../Components/UI/AppCard";
import { getAuditLogs } from "../../api/auditLogs";
import CrmPagination from "../../Components/Common/CrmPagination";

const actionNames = {
  POST: "Yaratildi",
  PUT: "Almashtirildi",
  PATCH: "O‘zgartirildi",
  DELETE: "O‘chirildi",
};

const entityNames = {
  users: "Xodim",
  products: "Mahsulot",
  categories: "Kategoriya",
  departments: "Bo‘lim",
  "worker-outputs": "Ish hisoboti",
  "worker-payments": "Ish haqi",
  "worker-advances": "Avans",
  "client-sales": "Mijoz savdosi",
  "client-payments": "Mijoz to‘lovi",
  "material-purchases": "Xomashyo xaridi",
  suppliers: "Ta’minotchi",
  employees: "Xodim profili",
  "payroll-periods": "Haftalik hisob",
  expenses: "Xarajat",
  warehouses: "Ombor",
  inventory: "Ombor harakati",
  permissions: "Ruxsat",
};

const actionStyles = {
  POST: {
    color: "#2f6b45",
    background: "rgba(78, 156, 107,.09)",
    border: "rgba(78, 156, 107,.18)",
  },

  PUT: {
    color: "#1f6f8b",
    background: "rgba(31, 111, 139,.08)",
    border: "rgba(31, 111, 139,.17)",
  },

  PATCH: {
    color: "#a06a12",
    background: "rgba(160, 106, 18,.10)",
    border: "rgba(160, 106, 18,.20)",
  },

  DELETE: {
    color: "#7a1826",
    background: "rgba(140, 29, 43,.08)",
    border: "rgba(140, 29, 43,.18)",
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

const HeroMetric = (props) => <SharedHeroMetric {...props} />;
const ActionChip = ({ action }) => {
  const current = actionStyles[action] || {
    color: "var(--aa-text-secondary)",
    background: "var(--aa-surface-muted)",
    border: "#e8e1d8",
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
        fontWeight: 700,

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
      color: "#1f6f8b",
      fontSize: 9.5,
      fontWeight: 700,

      backgroundColor: "rgba(31, 111, 139,.08)",

      border: "1px solid rgba(31, 111, 139,.16)",
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

        color: unknown ? "#7d716a" : success ? "#2f6b45" : "#7a1826",

        fontSize: 9,
        fontWeight: 700,

        backgroundColor: unknown
          ? "#f4f0ea"
          : success
            ? "rgba(78, 156, 107,.08)"
            : "rgba(140, 29, 43,.08)",

        border: unknown
          ? "1px solid #e8e1d8"
          : success
            ? "1px solid rgba(78, 156, 107,.17)"
            : "1px solid rgba(140, 29, 43,.17)",
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

      border: accent ? "1px solid var(--aa-brand-200)" : "1px solid var(--aa-border)",

      backgroundColor: accent ? "var(--aa-brand-50)" : "var(--aa-surface-muted)",
    }}
  >
    <Typography
      sx={{
        color: "var(--aa-text-tertiary)",
        fontSize: 9,
        fontWeight: 600,
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        mt: 0.5,

        color: accent ? "var(--aa-brand-500)" : "var(--aa-text)",

        fontSize: 10.5,
        fontWeight: 700,
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
        className="crm-page-hero audit-logs-hero"
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

          backgroundColor: "#151211 !important",

          backgroundImage:
            "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.34),transparent 30%),linear-gradient(145deg,#151211,#1e1a18 52%,#3a1219) !important",

          boxShadow: "0 24px 60px rgba(23, 17, 15,.20)",

          flexShrink: 0,

          "&::before": {
            content: '""',
            position: "absolute",
            width: 390,
            height: 390,
            top: -275,
            right: -210,
            borderRadius: "50%",

            border: "1px solid rgba(201, 168, 117,.16)",

            boxShadow:
              "0 0 81px 22px rgba(201, 168, 117,.022),0 0 161px 43px rgba(201, 168, 117,.014)",

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

                  background: "linear-gradient(90deg,#c9a875,#a3283a)",
                }}
              />

              <Typography
                sx={{
                  color: "#d9b782 !important",

                  fontSize: 10,
                  fontWeight: 700,
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
                fontFamily: "var(--aa-display)",
                fontWeight: 400,
                letterSpacing: "-.024em",
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
                fontWeight: 700,
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
        className="crm-sticky-filters"
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

            borderBottom: "1px solid #e8e1d8",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "var(--aa-text)",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Tizim amallari
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "var(--aa-text-tertiary)",
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
              color: "#6e1622",
              fontSize: 9.5,
              fontWeight: 700,

              backgroundColor: "rgba(110, 22, 34,.07)",
            }}
          />
        </Box>

        <TableContainer
          className="aa-mobile-records aa-audit-logs-table"
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
                color: "var(--aa-text-tertiary)",
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: ".045em",
                textTransform: "uppercase",
                backgroundColor: "var(--aa-surface-muted)",
                borderColor: "#e8e1d8",
              },

              "& td": {
                py: 1.4,
                color: "var(--aa-text-secondary)",
                fontSize: 10.5,
                borderColor: "#e8e1d8",
              },

              "& tbody tr": {
                cursor: "pointer",
              },

              "& tbody tr:hover": {
                backgroundColor: "rgba(110, 22, 34,.025)",
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
                        color: "#6e1622",
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
                          color: "var(--aa-text-secondary)",
                          fontSize: 10,
                          fontWeight: 600,
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
                            fontWeight: 700,

                            background: "linear-gradient(135deg,#4d0f18,#8c1d2b)",

                            border: "3px solid #ffffff",

                            boxShadow: "0 8px 20px rgba(77, 15, 24,.16)",
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
                              color: "var(--aa-text)",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {getFullName(row)}
                          </Typography>

                          <Typography
                            noWrap
                            sx={{
                              maxWidth: 205,
                              mt: 0.35,
                              color: "var(--aa-text-tertiary)",
                              fontSize: 9.5,
                            }}
                          >
                            @{row.username || "noma’lum"}
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
                            color: "var(--aa-text-secondary)",
                            fontSize: 10,
                            fontWeight: 700,
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
                          color: "var(--aa-text-secondary)",
                          fontSize: 10,
                          fontWeight: 600,
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
                      color: "var(--aa-text-tertiary)",
                      fontWeight: 600,
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
            borderTop: "1px solid #e8e1d8",

            backgroundColor: "var(--aa-surface-muted)",
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

            border: "1px solid rgba(138, 128, 122,.20)",

            boxShadow: "0 30px 80px rgba(23, 17, 15,.22)",
          },
        }}
      >
        <DialogTitle
          className="audit-log-dialog-title"
          sx={{
            px: 3,
            py: 2.35,

            color: "#ffffff !important",

            backgroundColor: "#151211 !important",

            backgroundImage:
              "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.28),transparent 36%),linear-gradient(135deg,#151211,#2a1117) !important",
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
                  fontWeight: 700,
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

                  border: "1px solid var(--aa-border)",

                  background:
                    "linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",
                }}
              >
                <Avatar
                  sx={{
                    width: 55,
                    height: 55,
                    flexShrink: 0,
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 700,

                    background: "linear-gradient(135deg,#4d0f18,#8c1d2b)",

                    boxShadow: "0 10px 25px rgba(77, 15, 24,.18)",
                  }}
                >
                  {getInitials(selectedLog)}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: "var(--aa-text)",
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {getFullName(selectedLog)}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.35,
                      color: "var(--aa-text-tertiary)",
                      fontSize: 10,
                    }}
                  >
                    @{selectedLog.username || "noma’lum"} · {formatDate(selectedLog.created_at)}
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

                <DetailItem label="Yozuv raqami" value={selectedLog.entity_id || "-"} />

                <DetailItem label="Natija kodi" value={selectedLog.status_code || "-"} />

                <DetailItem label="IP manzil" value={selectedLog.ip || "-"} />

                <DetailItem label="Audit raqami" value={selectedLog.id || "-"} />

                <DetailItem label="Foydalanuvchi nomi" value={selectedLog.username || "-"} />

                <DetailItem label="Vaqt" value={formatDate(selectedLog.created_at)} />
              </Box>

              <Box
                sx={{
                  p: 1.7,
                  borderRadius: "17px",

                  border: "1px solid var(--aa-border)",

                  backgroundColor: "var(--aa-surface-muted)",
                }}
              >
                <Typography
                  sx={{
                    color: "var(--aa-text-tertiary)",
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                >
                  API MANZIL
                </Typography>

                <Typography
                  sx={{
                    mt: 0.6,
                    color: "var(--aa-text-secondary)",
                    fontSize: 10.5,
                    fontWeight: 600,
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
                        color: "var(--aa-text)",
                        fontSize: 11,
                        fontWeight: 700,
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

                        color: "#d8cec1",

                        backgroundColor: "#17110f",

                        border: "1px solid rgba(138, 128, 122,.18)",

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

            borderTop: "1px solid #e8e1d8",

            backgroundColor: "var(--aa-surface-muted)",
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
              fontWeight: 700,
              textTransform: "none",

              background: "linear-gradient(135deg,#4d0f18,#7a1826)",

              boxShadow: "0 10px 24px rgba(77, 15, 24,.18)",

              "&:hover": {
                background: "linear-gradient(135deg,#4d0f18,#6e1622)",
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
  color: "var(--aa-text-secondary)",
  borderRadius: "11px",
  borderColor: "#d8cec1",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",
  backgroundColor: "var(--aa-surface-solid)",

  "&:hover": {
    color: "#6e1622",

    borderColor: "rgba(110, 22, 34,.22)",

    backgroundColor: "rgba(110, 22, 34,.04)",
  },
};

const auditLogsPageStyles = `
  .crm-page .audit-logs-hero {
    color: #ffffff !important;
    background-color: #151211 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(140, 29, 43,.34),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #151211,
        #1e1a18 52%,
        #3a1219
      ) !important;
  }

  .audit-log-dialog-title {
    color: #ffffff !important;
    background-color: #151211 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(140, 29, 43,.28),
        transparent 36%
      ),
      linear-gradient(
        135deg,
        #151211,
        #2a1117
      ) !important;
  }
`;

export default AuditLogs;
