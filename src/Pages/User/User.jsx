import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { getUser } from "../../api/getUsers";
import { getClientBalance, getClientSales } from "../../api/clientSales";
import { getClientPayments } from "../../api/clientPayments";
import { getWorkerOutputs } from "../../api/workerOutputs";
import { getWorkerBalance, getWorkerPayments } from "../../api/workerPayments";
import { getWorkerAdvanceBalance, getWorkerAdvances } from "../../api/workerAdvances";

const roleNames = {
  super_admin: "Super admin", admin: "Admin", client: "Mijoz",
  customer: "Xaridor", worker: "Ishchi",
};

const money = (value) => `${Number(value || 0).toLocaleString("uz-UZ")} so'm`;
const number = (value) => Number(value || 0).toLocaleString("uz-UZ");
const date = (value, withTime = false) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("uz-UZ", withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(new Date(value));
};

const getImageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const StatCard = ({ label, value, hint, tone = "default" }) => {
  const tones = {
    default: "border-slate-200 bg-white",
    good: "border-emerald-200 bg-emerald-50/60",
    danger: "border-red-200 bg-red-50/60",
    brand: "border-red-200 bg-red-50/40",
  };
  return (
    <Paper elevation={0} className={`rounded-lg border p-4 ${tones[tone]}`}>
      <Typography variant="body2" className="text-slate-500">{label}</Typography>
      <Typography variant="h6" fontWeight={900} className="mt-1 text-slate-950">{value}</Typography>
      {hint && <Typography variant="caption" className="mt-1 block text-slate-500">{hint}</Typography>}
    </Paper>
  );
};

const InfoItem = ({ label, value }) => (
  <Box className="border-b border-slate-100 py-3 last:border-0">
    <Typography variant="caption" className="text-slate-500">{label}</Typography>
    <Typography fontWeight={750} className="mt-1 break-words text-slate-950">{value || "-"}</Typography>
  </Box>
);

const OverviewCard = ({ title, children }) => (
  <Paper elevation={0} className="rounded-lg border border-slate-200 bg-white p-5">
    <Typography fontWeight={900} className="mb-4 text-slate-950">{title}</Typography>
    {children}
  </Paper>
);

const MetricBars = ({ items }) => {
  const max = Math.max(...items.map((item) => Number(item.value || 0)), 1);
  return (
    <Box className="flex h-52 items-end justify-around gap-4 rounded-lg bg-slate-50 px-4 pb-4 pt-6">
      {items.map((item) => (
        <Box key={item.label} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
          <Box className="flex flex-1 items-end justify-center">
            <Box className="w-full max-w-16 rounded-t-lg" style={{ height: `${Math.max(10, (Number(item.value || 0) / max) * 100)}%`, backgroundColor: item.color }} />
          </Box>
          <Typography variant="body2" fontWeight={800} className="mt-2 truncate">{item.label}</Typography>
          <Typography variant="caption" className="truncate text-slate-500">{item.display}</Typography>
        </Box>
      ))}
    </Box>
  );
};

const ProgressList = ({ items, empty }) => {
  const max = Math.max(...items.map((item) => Number(item.value || 0)), 1);
  if (!items.length) return <Typography variant="body2" className="text-slate-500">{empty}</Typography>;
  return (
    <Box className="space-y-4">
      {items.slice(0, 6).map((item) => (
        <Box key={item.label}>
          <Box className="mb-1 flex justify-between gap-3">
            <Typography variant="body2" fontWeight={800} className="truncate">{item.label}</Typography>
            <Typography variant="body2" className="shrink-0 text-slate-500">{item.display}</Typography>
          </Box>
          <Box className="h-2 overflow-hidden rounded-full bg-slate-100">
            <Box className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(5, (Number(item.value || 0) / max) * 100)}%` }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

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
          getClientSales({ client_id: user.id, offset: 0, limit: 6, sort_by: "sold_at", sort_order: "desc" }),
          getClientPayments({ client_id: user.id, offset: 0, limit: 6, sort_by: "paid_at", sort_order: "desc" }),
        ]);
        setDetails({
          type: "client",
          balance: balanceResult.status === "fulfilled" ? balanceResult.value.data.balance || {} : {},
          sales: salesResult.status === "fulfilled" ? salesResult.value.data.client_sales || [] : [],
          salesTotal: salesResult.status === "fulfilled" ? salesResult.value.data.pageInfo?.total || 0 : 0,
          payments: paymentsResult.status === "fulfilled" ? paymentsResult.value.data.client_payments || [] : [],
        });
      } else {
        const [balanceResult, advanceBalanceResult, outputsResult, paymentsResult, advancesResult] = await Promise.allSettled([
          getWorkerBalance({ worker_id: user.id }),
          getWorkerAdvanceBalance({ worker_id: user.id }),
          getWorkerOutputs({ worker_id: user.id, offset: 0, limit: 6, sort_by: "worked_at", sort_order: "desc" }),
          getWorkerPayments({ worker_id: user.id, offset: 0, limit: 6, sort_by: "paid_at", sort_order: "desc" }),
          getWorkerAdvances({ worker_id: user.id, offset: 0, limit: 6, sort_by: "given_at", sort_order: "desc" }),
        ]);
        setDetails({
          type: "worker",
          balance: balanceResult.status === "fulfilled" ? balanceResult.value.data.balance || {} : {},
          advance: advanceBalanceResult.status === "fulfilled" ? advanceBalanceResult.value.data.balance || {} : {},
          outputs: outputsResult.status === "fulfilled" ? outputsResult.value.data.worker_outputs || [] : [],
          outputTotals: outputsResult.status === "fulfilled" ? outputsResult.value.data.totals || {} : {},
          payments: paymentsResult.status === "fulfilled" ? paymentsResult.value.data.worker_payments || [] : [],
          advances: advancesResult.status === "fulfilled" ? advancesResult.value.data.worker_advances || [] : [],
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
      if (status === 403) setError("Bu foydalanuvchi ma'lumotlarini ko'rishga ruxsatingiz yo'q.");
      else if (status === 404) setError("Foydalanuvchi topilmadi.");
      else setError(requestError?.response?.data?.message || "Ma'lumotlarni olishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [fetchRoleDetails, id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  if (loading) return <Box className="flex min-h-72 items-center justify-center"><CircularProgress size={34} /></Box>;
  if (error) return <Box><Alert severity="error">{error}</Alert><Button variant="outlined" className="mt-4" onClick={() => navigate("/users")}>Foydalanuvchilarga qaytish</Button></Box>;
  if (!employee) return <Alert severity="warning">Foydalanuvchi topilmadi.</Alert>;

  const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
  const clientBalance = details?.balance || {};
  const workerBalance = details?.balance || {};
  const remainingAdvance = details?.advance?.remaining_advance ?? details?.advance?.balance ?? 0;
  const workerDepartments = Object.values((details?.outputs || []).reduce((result, item) => {
    const label = item.department_name || "Bo'limsiz";
    result[label] = result[label] || { label, value: 0 };
    result[label].value += Number(item.quantity || 0);
    result[label].display = `${number(result[label].value)} dona`;
    return result;
  }, {}));
  const clientProducts = Object.values((details?.sales || []).reduce((result, item) => {
    const label = item.product_name || "Mahsulot";
    result[label] = result[label] || { label, value: 0 };
    result[label].value += Number(item.total_amount || 0);
    result[label].display = money(result[label].value);
    return result;
  }, {}));

  return (
    <Box className="crm-page h-full overflow-auto pr-1">
      <Box className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Box>
          <Typography variant="h5" fontWeight={900}>Foydalanuvchi profili</Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">Shaxsiy ma'lumotlar va role bo'yicha hisob-kitoblar</Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate("/users")}>Orqaga</Button>
      </Box>

      <Paper elevation={0} className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
        <Box className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <Box className="flex items-center gap-4">
            <Avatar src={getImageUrl(employee.user_image)} sx={{ width: 82, height: 82, bgcolor: "#8f1d20", fontSize: 28 }}>{employee.first_name?.[0]?.toUpperCase()}</Avatar>
            <Box>
              <Box className="mb-2 inline-flex rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                ZERR CRM • {roleNames[employee.role] || "Foydalanuvchi"} profili
              </Box>
              <Typography variant="h4" fontWeight={900}>{fullName || "Nomsiz foydalanuvchi"}</Typography>
              <Typography className="mt-1 text-slate-500">@{employee.username || "username"} bo'yicha umumiy nazorat paneli</Typography>
              <Chip size="small" className="mt-2" label={roleNames[employee.role] || employee.role} color={employee.role === "client" ? "success" : employee.role === "admin" ? "warning" : "default"} />
            </Box>
          </Box>
          <Box className="grid min-w-full grid-cols-2 gap-x-6 sm:min-w-80">
            <InfoItem label="Telefon" value={employee.phone} />
            <InfoItem label="Tizimga qo'shilgan" value={date(employee.created_at)} />
            <InfoItem label="Foydalanuvchi ID" value={String(employee.id)} />
            <InfoItem label="Yangilangan" value={date(employee.updated_at, true)} />
          </Box>
        </Box>
      </Paper>

      {detailsLoading && <Box className="flex justify-center py-8"><CircularProgress size={28} /></Box>}

      {!detailsLoading && details?.type === "client" && (
        <>
          <Box className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Jami savdo" value={money(clientBalance.total_amount)} hint={`${details.salesTotal} ta savdo`} />
            <StatCard label="To'langan" value={money(clientBalance.paid_amount)} tone="good" />
            <StatCard label="Qolgan qarz" value={money(clientBalance.debt_amount)} tone={Number(clientBalance.debt_amount) > 0 ? "danger" : "good"} />
            <StatCard label="Hisob holati" value={Number(clientBalance.debt_amount) > 0 ? "Qarzdor" : "Yopilgan"} hint="Mijoz bilan umumiy hisob" />
          </Box>
          <Box className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_.9fr]">
            <OverviewCard title="Mijoz hisobi dinamikasi">
              <MetricBars items={[
                { label: "Savdo", value: clientBalance.total_amount, display: money(clientBalance.total_amount), color: "#2563eb" },
                { label: "Tushum", value: clientBalance.paid_amount, display: money(clientBalance.paid_amount), color: "#10b981" },
                { label: "Qarz", value: clientBalance.debt_amount, display: money(clientBalance.debt_amount), color: "#f59e0b" },
              ]} />
            </OverviewCard>
            <OverviewCard title="Mahsulotlar kesimi">
              <ProgressList items={clientProducts} empty="Mahsulot bo'yicha savdo topilmadi." />
            </OverviewCard>
            <OverviewCard title="Muhim ma'lumotlar">
              <InfoItem label="Qolgan qarz" value={money(clientBalance.debt_amount)} />
              <InfoItem label="Savdolar soni" value={`${details.salesTotal} ta`} />
              <InfoItem label="Oxirgi to'lov" value={details.payments[0] ? `${money(details.payments[0].amount)} • ${date(details.payments[0].paid_at)}` : "To'lov yo'q"} />
            </OverviewCard>
          </Box>
          <Box className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <HistoryTable title="Oxirgi savdolar" empty="Savdo topilmadi" rows={details.sales} columns={[
              ["Sana", (item) => date(item.sold_at || item.created_at)],
              ["Mahsulot", (item) => item.product_name || item.items?.map((x) => x.product_name).filter(Boolean).join(", ") || "-"],
              ["Jami", (item) => money(item.total_amount)],
              ["Qarz", (item) => money(item.remaining_debt ?? item.debt_amount)],
            ]} />
            <HistoryTable title="Oxirgi tushumlar" empty="To'lov topilmadi" rows={details.payments} columns={[
              ["Sana", (item) => date(item.paid_at || item.created_at)],
              ["Summa", (item) => money(item.amount)],
              ["Izoh", (item) => item.note || "-"],
            ]} />
          </Box>
        </>
      )}

      {!detailsLoading && details?.type === "worker" && (
        <>
          <Box className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Hisoblangan ish haqi" value={money(workerBalance.total_earned)} hint={`${number(details.outputTotals.total_quantity)} dona ish`} />
            <StatCard label="Berilgan" value={money(workerBalance.total_paid)} tone="good" />
            <StatCard label="To'lanishi kerak" value={money(workerBalance.remaining)} tone={Number(workerBalance.remaining) > 0 ? "danger" : "good"} />
            <StatCard label="Qolgan avans" value={money(remainingAdvance)} tone="brand" />
          </Box>
          <Box className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_.9fr]">
            <OverviewCard title="Ish haqi dinamikasi">
              <MetricBars items={[
                { label: "Hisoblandi", value: workerBalance.total_earned, display: money(workerBalance.total_earned), color: "#2563eb" },
                { label: "Berildi", value: workerBalance.total_paid, display: money(workerBalance.total_paid), color: "#10b981" },
                { label: "Qoldi", value: workerBalance.remaining, display: money(workerBalance.remaining), color: "#f59e0b" },
              ]} />
            </OverviewCard>
            <OverviewCard title="Bo'limlar kesimi">
              <ProgressList items={workerDepartments} empty="Bo'limlar bo'yicha ish topilmadi." />
            </OverviewCard>
            <OverviewCard title="Muhim ma'lumotlar">
              <InfoItem label="Berilishi kerak" value={money(workerBalance.remaining)} />
              <InfoItem label="Qolgan avans" value={money(remainingAdvance)} />
              <InfoItem label="Bajarilgan ish" value={`${number(details.outputTotals.total_quantity)} dona`} />
            </OverviewCard>
          </Box>
          <Box className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <HistoryTable title="Oxirgi bajarilgan ishlar" empty="Ish yozuvi topilmadi" rows={details.outputs} columns={[
              ["Sana", (item) => date(item.worked_at)],
              ["Mahsulot / bo'lim", (item) => `${item.product_name || "-"} / ${item.department_name || "-"}`],
              ["Miqdor", (item) => `${number(item.quantity)} dona`],
              ["Haq", (item) => money(item.total_amount)],
            ]} />
            <HistoryTable title="Oxirgi ish haqi to'lovlari" empty="To'lov topilmadi" rows={details.payments} columns={[
              ["Sana", (item) => date(item.paid_at || item.payment_date)],
              ["Berilgan", (item) => money(item.amount)],
              ["Avansdan", (item) => money(item.advance_deduction)],
            ]} />
            <Box className="xl:col-span-2">
              <HistoryTable title="Avanslar" empty="Avans topilmadi" rows={details.advances} columns={[
                ["Sana", (item) => date(item.given_at || item.created_at)],
                ["Summa", (item) => money(item.amount)],
                ["Izoh", (item) => item.note || "-"],
              ]} />
            </Box>
          </Box>
        </>
      )}

      {!detailsLoading && !details && (
        <Paper elevation={0} className="rounded-lg border border-slate-200 p-5">
          <Typography fontWeight={850}>Tizim ma'lumotlari</Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">Bu role uchun hozircha alohida hisob-kitob yuritilmaydi.</Typography>
        </Paper>
      )}
    </Box>
  );
};

const HistoryTable = ({ title, rows, columns, empty }) => (
  <Paper elevation={0} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <Box className="border-b border-slate-200 px-4 py-3"><Typography fontWeight={900}>{title}</Typography></Box>
    <Box className="overflow-x-auto">
      <Table size="small">
        <TableHead><TableRow>{columns.map(([label]) => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.length ? rows.map((item, index) => (
            <TableRow key={item.id || index} hover>{columns.map(([label, render]) => <TableCell key={label}>{render(item)}</TableCell>)}</TableRow>
          )) : <TableRow><TableCell colSpan={columns.length} align="center" sx={{ py: 5, color: "text.secondary" }}>{empty}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Box>
  </Paper>
);

export default User;
