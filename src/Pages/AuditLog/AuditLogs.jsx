import { useCallback, useEffect, useState } from "react";
import {
  Box,
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
const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", { dateStyle: "short", timeStyle: "medium" }).format(
        new Date(value),
      )
    : "-";

const AuditLogs = () => {
  const [rows, setRows] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, limit: 20, offset: 0 });
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);
      try {
        const { data } = await getAuditLogs({ q: q.trim(), action, offset, limit });
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
  }, [q, action]);

  return (
    <Box className="crm-page flex h-full min-h-0 flex-col">
      <Box className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Amallar tarixi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tizimda bajarilgan muhim o'zgarishlar
          </Typography>
        </Box>
        <Box className="grid gap-2 sm:grid-cols-[260px_170px]">
          <TextField
            size="small"
            label="Qidirish"
            value={q}
            onChange={(event) => setQ(event.target.value)}
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
      </Box>
      <Paper
        elevation={0}
        className="flex min-h-0 flex-1 flex-col overflow-hidden border border-slate-200"
      >
        <TableContainer className="min-h-0 flex-1 overflow-auto">
          <Table stickyHeader>
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
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell>
                      {`${row.first_name || ""} ${row.last_name || ""}`.trim() ||
                        row.username ||
                        "O'chirilgan foydalanuvchi"}
                    </TableCell>
                    <TableCell>{actionNames[row.action] || row.action}</TableCell>
                    <TableCell>{entityNames[row.entity_type] || row.entity_type}</TableCell>
                    <TableCell>{row.entity_id || "-"}</TableCell>
                    <TableCell>{row.path}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Amallar tarixi topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <CrmPagination total={pageInfo.total} page={Math.floor(pageInfo.offset / pageInfo.limit)} limit={pageInfo.limit} onPageChange={(nextPage) => load(nextPage * pageInfo.limit, pageInfo.limit)} onLimitChange={(limit) => load(0, limit)} rowsPerPageOptions={[20, 50, 100]} />
      </Paper>
    </Box>
  );
};

export default AuditLogs;
