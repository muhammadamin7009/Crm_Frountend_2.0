import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { getMyClientAccount } from "../../api/clientSales";

const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

const date = (value) => (value ? new Date(value).toLocaleDateString("uz-UZ") : "-");

const StatCard = ({ label, value, helper, accent = false }) => (
  <Paper
    elevation={0}
    className={`border p-5 ${accent ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"}`}
    sx={{ borderRadius: 2 }}
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h5" fontWeight={800} className="mt-1 text-slate-950">
      {value}
    </Typography>
    <Typography variant="body2" className="mt-1 text-slate-500">
      {helper}
    </Typography>
  </Paper>
);

const ClientDashboard = ({ user }) => {
  const [account, setAccount] = useState({
    balance: { total_amount: 0, paid_amount: 0, debt_amount: 0 },
    client_sales: [],
    client_payments: [],
  });
  const [loading, setLoading] = useState(true);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyClientAccount({ limit: 10, offset: 0 });
      setAccount(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Hisob ma'lumotlarini olishda xato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  if (loading) {
    return (
      <Box className="flex h-full items-center justify-center">
        <CircularProgress size={34} />
      </Box>
    );
  }

  const balance = account.balance || {};

  return (
    <Box className="crm-page h-full overflow-auto pr-1">
      <Box className="mb-5">
        <Typography variant="h5" fontWeight={800} className="text-slate-950">
          Mening hisobim
        </Typography>
        <Typography variant="body2" className="mt-1 text-slate-500">
          Salom, {user?.first_name || "Mijoz"}. Xaridlaringiz, to'lovlaringiz va qolgan qarzingiz
          shu yerda ko'rinadi.
        </Typography>
      </Box>

      <Box className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Jami xarid"
          value={money(balance.total_amount)}
          helper="Sizga berilgan barcha mahsulotlar"
        />
        <StatCard
          label="Jami to'langan"
          value={money(balance.paid_amount)}
          helper="Boshlang'ich va keyingi to'lovlar"
        />
        <StatCard
          label="Qolgan qarz"
          value={money(balance.debt_amount)}
          helper="Hozir to'lanishi kerak bo'lgan summa"
          accent={Number(balance.debt_amount) > 0}
        />
      </Box>

      {Number(balance.debt_amount) <= 0 && (
        <Alert severity="success" className="mb-5">
          Hozirda to'lanmagan qarzingiz yo'q.
        </Alert>
      )}

      <Paper
        elevation={0}
        className="mb-5 overflow-hidden border border-slate-200"
        sx={{ borderRadius: 2 }}
      >
        <Box className="border-b border-slate-200 px-5 py-4">
          <Typography fontWeight={800}>Oxirgi xaridlar</Typography>
        </Box>
        <Box className="overflow-auto">
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow className="bg-slate-50">
                <TableCell>Mahsulot</TableCell>
                <TableCell>Miqdor</TableCell>
                <TableCell>Narx</TableCell>
                <TableCell>Jami</TableCell>
                <TableCell>To'langan</TableCell>
                <TableCell>Qarz</TableCell>
                <TableCell>Sana</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {account.client_sales?.length ? (
                account.client_sales.map((sale) => (
                  <TableRow key={sale.id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{sale.product_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {sale.product_model || sale.product_sku || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{money(sale.unit_price)}</TableCell>
                    <TableCell>{money(sale.total_amount)}</TableCell>
                    <TableCell>{money(sale.current_paid_amount)}</TableCell>
                    <TableCell>{money(sale.remaining_debt)}</TableCell>
                    <TableCell>{date(sale.sold_at)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Hali xarid yozuvi yo'q.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        className="overflow-hidden border border-slate-200"
        sx={{ borderRadius: 2 }}
      >
        <Box className="border-b border-slate-200 px-5 py-4">
          <Typography fontWeight={800}>Oxirgi to'lovlar</Typography>
        </Box>
        <Box className="overflow-auto">
          <Table size="small" sx={{ minWidth: 620 }}>
            <TableHead>
              <TableRow className="bg-slate-50">
                <TableCell>Summa</TableCell>
                <TableCell>Mahsulot / savdo</TableCell>
                <TableCell>Izoh</TableCell>
                <TableCell>Sana</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {account.client_payments?.length ? (
                account.client_payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Typography fontWeight={800}>{money(payment.amount)}</Typography>
                    </TableCell>
                    <TableCell>
                      {payment.product_name ||
                        (payment.client_sale_id
                          ? `Savdo #${payment.client_sale_id}`
                          : "Umumiy to'lov")}
                    </TableCell>
                    <TableCell>{payment.note || "-"}</TableCell>
                    <TableCell>{date(payment.paid_at)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Hali alohida to'lov yozuvi yo'q.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
};

export default ClientDashboard;
