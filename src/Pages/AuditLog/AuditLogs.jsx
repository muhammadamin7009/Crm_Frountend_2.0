import { useCallback, useEffect, useState } from "react";
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
  warehouses: "Ombor",
  inventory: "Ombor harakati",
  permissions: "Ruxsat",
};

const actionStyles = {
  POST: {
    color: "var(--aa-success)",
    bg: "color-mix(in srgb, var(--aa-success) 10%, transparent)",
    border: "color-mix(in srgb, var(--aa-success) 22%, transparent)",
  },
  PUT: {
    color: "var(--aa-info)",
    bg: "color-mix(in srgb, var(--aa-info) 8%, transparent)",
    border: "color-mix(in srgb, var(--aa-info) 16%, transparent)",
  },
  PATCH: {
    color: "var(--aa-warning)",
    bg: "color-mix(in srgb, var(--aa-warning) 10%, transparent)",
    border: "color-mix(in srgb, var(--aa-warning) 22%, transparent)",
  },
  DELETE: {
    color: "var(--aa-danger)",
    bg: "color-mix(in srgb, var(--aa-danger) 8%, transparent)",
    border: "color-mix(in srgb, var(--aa-danger) 18%, transparent)",
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
      borderRadius: "var(--aa-radius-xl)",
      border: "1px solid var(--aa-border)",
      background: "var(--aa-surface)",
      boxShadow: "var(--aa-shadow-xs)",
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
      color: "var(--aa-text)",
      bg: "var(--aa-surface-solid)",
      border: "var(--aa-border)",
    },
    blue: {
      color: "var(--aa-info)",
      bg: "color-mix(in srgb, var(--aa-info) 8%, transparent)",
      border: "color-mix(in srgb, var(--aa-info) 18%, transparent)",
    },
    red: {
      color: "var(--aa-danger)",
      bg: "color-mix(in srgb, var(--aa-danger) 8%, transparent)",
      border: "color-mix(in srgb, var(--aa-danger) 18%, transparent)",
    },
  };

  const current = tones[tone] || tones.default;

  return (
    <Box
      sx={{
        minWidth: 120,
        px: 2,
        py: 1.35,
        borderRadius: "var(--aa-radius-lg)",
        background: current.bg,
        border: `1px solid ${current.border}`,
        boxShadow: "var(--aa-shadow-xs)",
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 850,
          color: "var(--aa-text-secondary)",
        }}
      >
        {label}
      </Typography>

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
    color: "var(--aa-text-secondary)",
    bg: "var(--aa-surface-muted)",
    border: "var(--aa-border)",
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
      color: "var(--aa-info)",
      background: "color-mix(in srgb, var(--aa-info) 8%, transparent)",
      border: "1px solid color-mix(in srgb, var(--aa-info) 16%, transparent)",
    }}
  />
);

const AuditLogs = () => {
  const [rows, setRows] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, limit: 20, offset: 0 });
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

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
        toast.error(
          error?.response?.data?.message || "Amallar tarixini olishda xato.",
        );
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
        color: "var(--aa-text)",
        "& .MuiOutlinedInput-root": {
          borderRadius: "var(--aa-radius-md)",
          backgroundColor: "var(--aa-surface-solid)",
        },
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
              label="Al-amin CRM • amallar nazorati"
              size="small"
              sx={{
                mb: 1,
                height: 25,
                fontSize: 12,
                fontWeight: 950,
                color: "var(--aa-brand-700)",
                background: "var(--aa-brand-50)",
                border: "1px solid var(--aa-brand-100)",
                borderRadius: "var(--aa-radius-pill)",
              }}
            />

            <Typography
              sx={{
                fontSize: { xs: 27, md: 33 },
                fontWeight: 950,
                color: "var(--aa-text)",
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
                color: "var(--aa-text-secondary)",
              }}
            >
              Tizimda bajarilgan muhim o'zgarishlar va foydalanuvchi
              harakatlari.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(2, auto)",
              },
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
              borderRadius: "var(--aa-radius-md)",
              textTransform: "none",
              fontWeight: 900,
              color: "var(--aa-text)",
              borderColor: "var(--aa-border-strong)",
              background: "var(--aa-surface-solid)",
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
                color: "var(--aa-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                background: "var(--aa-surface-muted)",
                borderBottom: "1px solid var(--aa-border)",
              },
              "& td": {
                py: 1.55,
                borderBottom: "1px solid var(--aa-border)",
              },
              "& tbody tr:hover": {
                background: "var(--aa-surface-hover)",
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
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => setSelectedLog(row)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell
                      sx={{
                        whiteSpace: "nowrap",
                        fontWeight: 800,
                        color: "var(--aa-text-secondary)",
                      }}
                    >
                      {formatDate(row.created_at)}
                    </TableCell>

                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.6 }}
                      >
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: "var(--aa-brand-50)",
                            color: "var(--aa-brand-700)",
                            fontWeight: 950,
                            border: "3px solid var(--aa-surface-solid)",
                            boxShadow: "var(--aa-shadow-sm)",
                          }}
                        >
                          {getInitial(row)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 14.5,
                              fontWeight: 900,
                              color: "var(--aa-text)",
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
                              color: "var(--aa-text-secondary)",
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

                    <TableCell
                      sx={{
                        fontWeight: 900,
                        color: "var(--aa-text-secondary)",
                      }}
                    >
                      {row.entity_id || "-"}
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          maxWidth: 360,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--aa-text-secondary)",
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
                    sx={{ py: 7, fontWeight: 850 }}
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
            borderTop: "1px solid var(--aa-border)",
            background: "var(--aa-surface-muted)",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) =>
              load(nextPage * pageInfo.limit, pageInfo.limit)
            }
            onLimitChange={(limit) => load(0, limit)}
            rowsPerPageOptions={[20, 50, 100]}
          />
        </Box>
      </Card>

      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "var(--aa-radius-xl)",
            border: "1px solid var(--aa-border)",
            boxShadow: "var(--aa-shadow-lg)",
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2.2,
            fontSize: 21,
            fontWeight: 950,
            borderBottom: "1px solid var(--aa-border)",
          }}
        >
          Amal tafsiloti
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: "22px !important" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "130px minmax(0, 1fr)",
              gap: 1.25,
            }}
          >
            {[
              ["Foydalanuvchi", selectedLog ? getFullName(selectedLog) : "-"],
              ["Vaqt", formatDate(selectedLog?.created_at)],
              [
                "Amal",
                actionNames[selectedLog?.action] || selectedLog?.action || "-",
              ],
              [
                "Bo'lim",
                entityNames[selectedLog?.entity_type] ||
                  selectedLog?.entity_type ||
                  "-",
              ],
              ["Obyekt ID", selectedLog?.entity_id || "-"],
              ["Natija kodi", selectedLog?.status_code || "-"],
              ["IP manzil", selectedLog?.ip || "-"],
              ["API manzil", selectedLog?.path || "-"],
            ].map(([label, value]) => (
              <Box key={label} sx={{ display: "contents" }}>
                <Typography
                  sx={{
                    color: "var(--aa-text-tertiary)",
                    fontSize: 12.5,
                    fontWeight: 800,
                  }}
                >
                  {label}
                </Typography>
                <Typography
                  sx={{
                    color: "var(--aa-text)",
                    fontSize: 13.5,
                    fontWeight: 750,
                    wordBreak: "break-word",
                  }}
                >
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>

          {selectedLog?.details && (
            <Box sx={{ mt: 2.2 }}>
              <Typography
                sx={{
                  mb: 0.8,
                  color: "var(--aa-text-secondary)",
                  fontSize: 12.5,
                  fontWeight: 850,
                }}
              >
                Qo'shimcha ma'lumot
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  maxHeight: 240,
                  overflow: "auto",
                  borderRadius: "var(--aa-radius-md)",
                  bgcolor: "var(--aa-surface-muted)",
                  border: "1px solid var(--aa-border)",
                  color: "var(--aa-text-secondary)",
                  fontSize: 12,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  userSelect: "text",
                }}
              >
                {JSON.stringify(selectedLog.details, null, 2)}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid var(--aa-border)",
            bgcolor: "var(--aa-surface-muted)",
          }}
        >
          <Button onClick={() => setSelectedLog(null)} sx={{ fontWeight: 850 }}>
            Yopish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogs;
