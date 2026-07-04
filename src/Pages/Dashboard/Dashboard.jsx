import { useCallback, useEffect, useState } from "react";
import {
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
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext";
import { getUsers } from "../../api/getUsers";
import { getProducts } from "../../api/products";
import { getWorkerOutputs, getWorkerOutputsSummary } from "../../api/workerOutputs";
import { getWorkerBalance } from "../../api/workerPayments";
import { getClientBalance, getClientSales, getClientSalesSummary } from "../../api/clientSales";
import { getMaterialPurchases, getSupplierBalance } from "../../api/materialPurchases";
import AdminOverview from "./AdminOverview";
import ClientDashboard from "./ClientDashboard";

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

const EmptyState = ({ text }) => (
  <Box className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
    <Typography className="text-slate-500">{text}</Typography>
  </Box>
);

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
      setMonthTotals(monthRes.data.totals || { total_quantity: 0, total_amount: 0 });
      setTodayTotals(todayRes.data.totals || { total_quantity: 0, total_amount: 0 });
      setDepartmentSummary(departmentsRes.data.summary || []);
      setBalance(
        balanceRes.data.balance || {
          total_earned: 0,
          total_paid: 0,
          remaining: 0,
        },
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Bosh sahifa ma'lumotlarini olishda xato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <Box className="flex h-full items-center justify-center">
        <CircularProgress size={34} />
      </Box>
    );
  }

  return (
    <Box className="crm-page h-full overflow-auto pr-1">
      <Box className="mb-5">
        <Typography variant="h5" fontWeight={800} className="text-slate-950">
          Mening ishlarim
        </Typography>
        <Typography variant="body2" className="mt-1 text-slate-500">
          Salom, {user?.first_name || "Ishchi"}. Bu oy bajargan ishlaringiz va hisobingiz.
        </Typography>
      </Box>

      <Box className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard
          label="Bugungi summa"
          value={formatMoney(todayTotals.total_amount)}
          helper={`${formatNumber(todayTotals.total_quantity)} dona`}
        />
        <StatCard
          label="Ishlab topgan"
          value={formatMoney(balance.total_earned || monthTotals.total_amount)}
          helper={`${formatNumber(monthTotals.total_quantity)} dona`}
        />
        <StatCard
          label="Olgan"
          value={formatMoney(balance.total_paid)}
          helper="Bu oy berilgan to'lov"
        />
        <StatCard
          label="Qolgan"
          value={formatMoney(balance.remaining)}
          helper="Hali berilmagan summa"
        />
        <StatCard
          label="Avans qarzi"
          value={formatMoney(balance.remaining_advance)}
          helper="Hali oylikdan ushlanmagan"
        />
      </Box>

      <Box className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Paper elevation={0} className="rounded-2xl border border-slate-200 bg-white p-5">
          <Typography fontWeight={800} className="mb-3 text-slate-950">
            Bo'limlar bo'yicha
          </Typography>

          {departmentSummary.length ? (
            <Box className="space-y-3">
              {departmentSummary.map((item) => (
                <Box
                  key={String(item.group_id)}
                  className="auth-info-card rounded-2xl border p-4"
                >
                  <Box className="flex items-center justify-between gap-3">
                    <Box>
                      <Typography fontWeight={800}>{item.group_name || "Bo'lim"}</Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {formatNumber(item.total_quantity)} dona / {item.entries_count} yozuv
                      </Typography>
                    </Box>
                    <Chip label={formatMoney(item.total_amount)} color="success" />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <EmptyState text="Bu oy bo'yicha hali ish yozuvi yo'q." />
          )}
        </Paper>

        <Paper elevation={0} className="rounded-2xl border border-slate-200 bg-white p-5">
          <Typography fontWeight={800} className="mb-3 text-slate-950">
            Oxirgi ish yozuvlari
          </Typography>

          {monthOutputs.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Mahsulot</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Bo'lim</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Miqdor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Summa</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Sana</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthOutputs.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.department_name}</TableCell>
                    <TableCell>{formatNumber(item.quantity)}</TableCell>
                    <TableCell>{formatMoney(item.total_amount)}</TableCell>
                    <TableCell>{formatDate(item.worked_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState text="Hali ish yozuvi kiritilmagan." />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

const _AdminDashboard = ({ user }) => {
  const [viewMode, setViewMode] = useState("internal");
  const [externalMode, setExternalMode] = useState("sales");
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    totalQuantity: 0,
    totalAmount: 0,
  });
  const [clientStats, setClientStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    debtAmount: 0,
    salesCount: 0,
  });
  const [workerSummary, setWorkerSummary] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [clientSummary, setClientSummary] = useState([]);
  const [productSalesSummary, setProductSalesSummary] = useState([]);
  const [purchaseStats, setPurchaseStats] = useState({
    totalPurchase: 0,
    totalPaid: 0,
    debtAmount: 0,
    purchasesCount: 0,
  });
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [paymentBalance, setPaymentBalance] = useState({
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
      const [
        usersRes,
        productsRes,
        outputsRes,
        workerRes,
        departmentRes,
        balanceRes,
        salesRes,
        clientSummaryRes,
        productSalesRes,
        clientBalanceRes,
        purchasesRes,
        supplierBalanceRes,
        supplierDebtRes,
      ] = await Promise.all([
        getUsers({ offset: 0, limit: 1 }),
        getProducts({ offset: 0, limit: 1 }),
        getWorkerOutputs({ ...monthRange, offset: 0, limit: 1 }),
        getWorkerOutputsSummary({ ...monthRange, group_by: "worker" }),
        getWorkerOutputsSummary({ ...monthRange, group_by: "department" }),
        getWorkerBalance(monthRange),
        getClientSales({ ...monthRange, offset: 0, limit: 1 }),
        getClientSalesSummary({ ...monthRange, group_by: "client" }),
        getClientSalesSummary({ ...monthRange, group_by: "product" }),
        getClientBalance(monthRange),
        getMaterialPurchases({ ...monthRange, offset: 0, limit: 6 }),
        getSupplierBalance(monthRange),
        getSupplierBalance({}),
      ]);

      setStats({
        users: usersRes.data.pageInfo?.total || 0,
        products: productsRes.data.pageInfo?.total || 0,
        totalQuantity: outputsRes.data.totals?.total_quantity || 0,
        totalAmount: outputsRes.data.totals?.total_amount || 0,
      });
      setWorkerSummary(workerRes.data.summary || []);
      setDepartmentSummary(departmentRes.data.summary || []);
      setPaymentBalance(
        balanceRes.data.balance || {
          total_earned: 0,
          total_paid: 0,
          remaining: 0,
        },
      );
      setClientStats({
        totalAmount:
          clientBalanceRes.data.balance?.total_amount || salesRes.data.totals?.total_amount || 0,
        paidAmount:
          clientBalanceRes.data.balance?.paid_amount || salesRes.data.totals?.paid_amount || 0,
        debtAmount:
          clientBalanceRes.data.balance?.debt_amount || salesRes.data.totals?.debt_amount || 0,
        salesCount: salesRes.data.pageInfo?.total || 0,
      });
      setClientSummary(clientSummaryRes.data.summary || []);
      setProductSalesSummary(productSalesRes.data.summary || []);
      setPurchaseStats({
        totalPurchase: supplierBalanceRes.data.total_purchase || 0,
        totalPaid: supplierBalanceRes.data.total_paid || 0,
        debtAmount: supplierDebtRes.data.debt_amount || 0,
        purchasesCount: purchasesRes.data.pageInfo?.total || 0,
      });
      setRecentPurchases(purchasesRes.data.material_purchases || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Bosh sahifa ma'lumotlarini olishda xato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <Box className="flex h-full items-center justify-center">
        <CircularProgress size={34} />
      </Box>
    );
  }

  return (
    <Box className="h-full overflow-auto pr-1">
      <Box className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Box>
          <Typography variant="h5" fontWeight={800} className="text-slate-950">
            Bosh sahifa
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            Salom, {user?.first_name || "Admin"}. Korxona bo'yicha umumiy ko'rinish.
          </Typography>
        </Box>

        <Box className="flex rounded-2xl border border-slate-200 bg-white p-1">
          <Button
            variant={viewMode === "internal" ? "contained" : "text"}
            onClick={() => setViewMode("internal")}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Ichki
          </Button>
          <Button
            variant={viewMode === "external" ? "contained" : "text"}
            onClick={() => setViewMode("external")}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Tashqi
          </Button>
        </Box>
      </Box>

      {viewMode === "internal" ? (
        <>
          <Box className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard label="Hodimlar" value={stats.users} helper="Tizimdagi foydalanuvchilar" />
            <StatCard label="Mahsulotlar" value={stats.products} helper="Faol katalog nazorati" />
            <StatCard
              label="Bu oy miqdor"
              value={formatNumber(stats.totalQuantity)}
              helper="Ishchilar bajargan ishlar"
            />
            <StatCard
              label="Bu oy summa"
              value={formatMoney(stats.totalAmount)}
              helper="Hisoblangan ish haqi"
            />
            <StatCard
              label="Berilgan"
              value={formatMoney(paymentBalance.total_paid)}
              helper="Bu oy to'langan"
            />
            <StatCard
              label="Qolgan"
              value={formatMoney(paymentBalance.remaining)}
              helper="To'lanmagan qoldiq"
            />
            <StatCard
              label="Olinmagan avans"
              value={formatMoney(paymentBalance.remaining_advance)}
              helper="Ishchilardan qolgan avans"
            />
          </Box>

          <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Paper elevation={0} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Typography fontWeight={800} className="mb-3 text-slate-950">
                Ishchilar bo'yicha
              </Typography>

              {workerSummary.length ? (
                <Box className="space-y-3">
                  {workerSummary.slice(0, 6).map((item) => (
                    <Box
                      key={String(item.group_id)}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <Box className="flex min-w-0 items-center gap-3">
                        <Avatar sx={{ bgcolor: "#7F1D1D" }}>
                          {item.group_name?.[0]?.toUpperCase() || "I"}
                        </Avatar>
                        <Box className="min-w-0">
                          <Typography className="truncate" fontWeight={800}>
                            {item.group_name || "Ishchi"}
                          </Typography>
                          <Typography variant="body2" className="text-slate-500">
                            {formatNumber(item.total_quantity)} dona
                          </Typography>
                        </Box>
                      </Box>
                      <Typography fontWeight={800}>{formatMoney(item.total_amount)}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <EmptyState text="Bu oy ishchi yozuvlari hali yo'q." />
              )}
            </Paper>

            <Paper elevation={0} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Typography fontWeight={800} className="mb-3 text-slate-950">
                Bo'limlar bo'yicha
              </Typography>

              {departmentSummary.length ? (
                <Box className="space-y-3">
                  {departmentSummary.map((item) => (
                    <Box
                      key={String(item.group_id)}
                      className="auth-info-card rounded-2xl border p-4"
                    >
                      <Box className="flex items-center justify-between gap-3">
                        <Box>
                          <Typography fontWeight={800}>{item.group_name}</Typography>
                          <Typography variant="body2" className="text-slate-500">
                            {formatNumber(item.total_quantity)} dona / {item.entries_count} yozuv
                          </Typography>
                        </Box>
                        <Typography fontWeight={800}>{formatMoney(item.total_amount)}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <EmptyState text="Bo'limlar bo'yicha ma'lumot yo'q." />
              )}
            </Paper>
          </Box>
        </>
      ) : (
        <>
          <Box className="mb-5 flex w-fit rounded-2xl border border-slate-200 bg-white p-1">
            <Button
              variant={externalMode === "sales" ? "contained" : "text"}
              onClick={() => setExternalMode("sales")}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Savdo
            </Button>
            <Button
              variant={externalMode === "purchases" ? "contained" : "text"}
              onClick={() => setExternalMode("purchases")}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Xarid
            </Button>
          </Box>

          <Box className={externalMode === "sales" ? "" : "hidden"}>
            <Box className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              <StatCard
                label="Savdo summasi"
                value={formatMoney(clientStats.totalAmount)}
                helper="Bu oy mijozlarga sotilgan"
              />
              <StatCard
                label="To'langan"
                value={formatMoney(clientStats.paidAmount)}
                helper="Mijozlardan tushgan pul"
              />
              <StatCard
                label="Qarzdorlik"
                value={formatMoney(clientStats.debtAmount)}
                helper="Hali olinmagan summa"
              />
              <StatCard
                label="Savdo yozuvlari"
                value={clientStats.salesCount}
                helper="Bu oy kiritilgan savdolar"
              />
            </Box>

            <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Paper elevation={0} className="rounded-2xl border border-slate-200 bg-white p-5">
                <Typography fontWeight={800} className="mb-3 text-slate-950">
                  Mijozlar bo'yicha
                </Typography>

                {clientSummary.length ? (
                  <Box className="space-y-3">
                    {clientSummary.slice(0, 6).map((item) => (
                      <Box
                        key={String(item.group_id)}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <Box className="flex min-w-0 items-center gap-3">
                          <Avatar sx={{ bgcolor: "#7F1D1D" }}>
                            {item.group_name?.[0]?.toUpperCase() || "C"}
                          </Avatar>
                          <Box className="min-w-0">
                            <Typography className="truncate" fontWeight={800}>
                              {item.group_name || "Mijoz"}
                            </Typography>
                            <Typography variant="body2" className="text-slate-500">
                              {item.sales_count} savdo / qarz {formatMoney(item.debt_amount)}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography fontWeight={800}>{formatMoney(item.total_amount)}</Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <EmptyState text="Bu oy mijoz savdolari hali yo'q." />
                )}
              </Paper>

              <Paper elevation={0} className="rounded-2xl border border-slate-200 bg-white p-5">
                <Typography fontWeight={800} className="mb-3 text-slate-950">
                  Mahsulotlar savdosi
                </Typography>

                {productSalesSummary.length ? (
                  <Box className="space-y-3">
                    {productSalesSummary.slice(0, 6).map((item) => (
                      <Box
                        key={String(item.group_id)}
                        className="auth-info-card rounded-2xl border p-4"
                      >
                        <Box className="flex items-center justify-between gap-3">
                          <Box>
                            <Typography fontWeight={800}>{item.group_name}</Typography>
                            <Typography variant="body2" className="text-slate-500">
                              {item.group_code || "-"} / {item.sales_count} savdo
                            </Typography>
                          </Box>
                          <Typography fontWeight={800}>{formatMoney(item.total_amount)}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <EmptyState text="Mahsulotlar bo'yicha savdo ma'lumoti yo'q." />
                )}
              </Paper>
            </Box>
          </Box>

          {externalMode === "purchases" && (
            <>
              <Box className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard
                  label="Homashyo xaridi"
                  value={formatMoney(purchaseStats.totalPurchase)}
                  helper="Bu oy kelgan homashyolar"
                />
                <StatCard
                  label="Ta'minotchiga berildi"
                  value={formatMoney(purchaseStats.totalPaid)}
                  helper="Bu oy chiqim qilingan"
                />
                <StatCard
                  label="Ta'minotchi qarzi"
                  value={formatMoney(purchaseStats.debtAmount)}
                  helper="Hali berilmagan summa"
                />
                <StatCard
                  label="Xarid yozuvlari"
                  value={purchaseStats.purchasesCount}
                  helper="Bu oygi kirimlar"
                />
              </Box>

              <Paper elevation={0} className="rounded-2xl border border-slate-200 bg-white p-5">
                <Typography fontWeight={800} className="mb-3 text-slate-950">
                  Oxirgi homashyo xaridlari
                </Typography>
                {recentPurchases.length ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ta'minotchi</TableCell>
                        <TableCell>Homashyolar</TableCell>
                        <TableCell>Jami</TableCell>
                        <TableCell>Berildi</TableCell>
                        <TableCell>Qarz</TableCell>
                        <TableCell>Sana</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            <Typography fontWeight={700}>{purchase.supplier_name}</Typography>
                          </TableCell>
                          <TableCell>
                            {purchase.items?.map((item) => item.material_name).join(", ") || "-"}
                          </TableCell>
                          <TableCell>{formatMoney(purchase.subtotal)}</TableCell>
                          <TableCell>{formatMoney(purchase.paid_amount)}</TableCell>
                          <TableCell>{formatMoney(purchase.debt_amount)}</TableCell>
                          <TableCell>{formatDate(purchase.purchased_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState text="Bu oy homashyo xaridi hali kiritilmagan." />
                )}
              </Paper>
            </>
          )}
        </>
      )}
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

const Dashboard = () => {
  const auth = useAuth();
  const user = auth?.user || getLocalUser();

  if (user?.role === "worker") {
    return <WorkerDashboard user={user} />;
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
