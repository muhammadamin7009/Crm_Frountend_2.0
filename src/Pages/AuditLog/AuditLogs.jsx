import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
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

import { getAuditLogs } from "../../api/auditLogs";
import CrmPagination from "../../Components/Common/CrmPagination";

const actionNames = {
  POST: "Yaratildi",
  PUT: "Almashtirildi",
  PATCH: "O'zgartirildi",
  DELETE: "O'chirildi",
};

const entityNames = {
  users: "Hodim",
  products: "Mahsulot",
  categories: "Kategoriya",
  departments: "Bo'lim",
  "worker-outputs": "Ish hisoboti",
  "worker-payments": "Ish haqi",
  "worker-advances": "Avans",
  "client-sales": "Mijoz savdosi",
  "client-payments": "Mijoz to'lovi",
  "material-purchases": "Homashyo xaridi",
  suppliers: "Ta'minotchi",
  employees: "Hodim profili",
  "payroll-periods": "Haftalik hisob",
  expenses: "Xarajat",
};

const actionStyles = {
  POST: {
    color: "#15803d",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.24)",
  },
  PUT: {
    color: "#2563eb",
    bg: "rgba(37, 99, 235, 0.08)",
    border: "rgba(37, 99, 235, 0.16)",
  },
  PATCH: {
    color: "#92400e",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.24)",
  },
  DELETE: {
    color: "#8b0101",
    bg: "rgba(139, 1, 1, 0.08)",
    border: "rgba(139, 1, 1, 0.18)",
  },
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
};

const getInitial = (row) => {
  const first = row?.first_name?.[0];
  const last = row?.last_name?.[0];
  const username = row?.username?.[0];

  return (first || last || username || "A").toUpperCase();
};

const getFullName = (row) => {
  return (
    `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
    row.username ||
    "O'chirilgan foydalanuvchi"
  );
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

const MiniStat = ({ label, value, tone = "default" }) => {
  const tones = {
    default: {
      color: "#0f172a",
      bg: "#ffffff",
      border: "rgba(148, 163, 184, 0.24)",
    },
    blue: {
      color: "#2563eb",
      bg: "rgba(37, 99, 235, 0.08)",
      border: "rgba(37, 99, 235, 0.18)",
    },
    red: {
      color: "#8b0101",
      bg: "rgba(139, 1, 1, 0.08)",
      border: "rgba(139, 1, 1, 0.18)",
    },
  };

  const current = tones[tone] || tones.default;

  return (
    <Box
      sx={{
        minWidth: 120,
        px: 2,
        py: 1.35,
        borderRadius: "16px",
        background: current.bg,
        border: `1px solid ${current.border}`,
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>{label}</Typography>

      <Typography
        sx={{
          mt: 0.35,
          fontSize: 20,
          fontWeight: 950,
          color: current.color,
          letterSpacing: "-0.04em",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const ActionChip = ({ action }) => {
  const style = actionStyles[action] || {
    color: "#475569",
    bg: "#f1f5f9",
    border: "rgba(148, 163, 184, 0.24)",
  };

  return (
    <Chip
      size="small"
      label={actionNames[action] || action || "-"}
      sx={{
        height: 26,
        px: 0.35,
        fontSize: 12,
        fontWeight: 900,
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.border}`,
      }}
    />
  );
};

const EntityChip = ({ entity }) => (
  <Chip
    size="small"
    label={entityNames[entity] || entity || "-"}
    sx={{
      height: 26,
      px: 0.35,
      fontSize: 12,
      fontWeight: 900,
      color: "#2563eb",
      background: "rgba(37, 99, 235, 0.08)",
      border: "1px solid rgba(37, 99, 235, 0.16)",
    }}
  />
);

const AuditLogs = () => {
  const [rows, setRows] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, limit: 20, offset: 0 });
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const load = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        const { data } = await getAuditLogs({
          q: q.trim(),
          action,
          offset,
          limit,
        });

        setRows(data.audit_logs || []);
        setPageInfo(data.pageInfo || { total: 0, offset, limit });
      } catch (error) {
        toast.error(error?.response?.data?.message || "Amallar tarixini olishda xato.");
      } finally {
        setLoading(false);
      }
    },
    [action, q, pageInfo.limit],
  );

  useEffect(() => {
    const timer = setTimeout(() => load(0, pageInfo.limit), 350);

    return () => clearTimeout(timer);
  }, [q, action, pageInfo.limit, load]);

  const resetFilters = () => {
    setQ("");
    setAction("");
  };

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2,
      }}
    >
      <Card sx={{ mb: 0.5, px: { xs: 2, md: 2.5 }, py: 2.2, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Chip
              label="ZERR CRM • audit logs"
              size="small"
              sx={{
                mb: 1,
                height: 25,
                fontSize: 12,
                fontWeight: 950,
                color: "#2563eb",
                background: "rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(37, 99, 235, 0.16)",
              }}
            />

            <Typography
              sx={{
                fontSize: { xs: 27, md: 33 },
                fontWeight: 950,
                color: "#0f172a",
                letterSpacing: "-0.055em",
                lineHeight: 1.05,
              }}
            >
              Amallar tarixi
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 14,
                fontWeight: 650,
                color: "#64748b",
              }}
            >
              Tizimda bajarilgan muhim o'zgarishlar va foydalanuvchi harakatlari.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(2, auto)" },
              gap: 1.2,
              width: { xs: "100%", md: "auto" },
            }}
          >
            <MiniStat label="Jami yozuv" value={pageInfo.total} tone="blue" />
            <MiniStat label="Sahifada" value={rows.length} tone="default" />
          </Box>
        </Box>
      </Card>

      <Card sx={{ mb: 0.5, p: 2, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 1.4,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "260px 170px" },
              gap: 1.2,
              flex: 1,
            }}
          >
            <TextField
              size="small"
              label="Qidirish"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") load(0, pageInfo.limit);
              }}
            />

            <TextField
              select
              size="small"
              label="Amal"
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

          <Button
            variant="outlined"
            onClick={resetFilters}
            sx={{
              minWidth: 110,
              height: 42,
              borderRadius: "13px",
              textTransform: "none",
              fontWeight: 900,
              color: "#0f172a",
              borderColor: "rgba(37, 99, 235, 0.22)",
              background: "#fff",
            }}
          >
            Tozalash
          </Button>
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
        <TableContainer sx={{ minHeight: 0, flex: 1, overflow: "auto" }}>
          <Table
            stickyHeader
            sx={{
              minWidth: 980,
              "& th": {
                py: 1.7,
                fontSize: 12,
                fontWeight: 950,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                background: "rgba(248, 250, 252, 0.98)",
                borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
              },
              "& td": {
                py: 1.55,
                borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
              },
              "& tbody tr:hover": {
                background: "rgba(37, 99, 235, 0.035)",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Vaqt</TableCell>
                <TableCell>Foydalanuvchi</TableCell>
                <TableCell>Amal</TableCell>
                <TableCell>Bo'lim</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Manzil</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 800, color: "#334155" }}>
                      {formatDate(row.created_at)}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.6 }}>
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: "#8b0101",
                            color: "#fff",
                            fontWeight: 950,
                            border: "3px solid #fff",
                            boxShadow: "0 10px 24px rgba(139, 1, 1, 0.14)",
                          }}
                        >
                          {getInitial(row)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 14.5,
                              fontWeight: 900,
                              color: "#0f172a",
                              lineHeight: 1.15,
                            }}
                          >
                            {getFullName(row)}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "#64748b",
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

                    <TableCell sx={{ fontWeight: 900, color: "#334155" }}>
                      {row.entity_id || "-"}
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          maxWidth: 360,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#64748b",
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
                  <TableCell colSpan={6} align="center" sx={{ py: 7, fontWeight: 850 }}>
                    Amallar tarixi topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            borderTop: "1px solid rgba(148, 163, 184, 0.18)",
            background: "rgba(248, 250, 252, 0.65)",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) => load(nextPage * pageInfo.limit, pageInfo.limit)}
            onLimitChange={(limit) => load(0, limit)}
            rowsPerPageOptions={[20, 50, 100]}
          />
        </Box>
      </Card>
    </Box>
  );
};

export default AuditLogs;
