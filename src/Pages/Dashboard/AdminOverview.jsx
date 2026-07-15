import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
  TextField,
  Typography,
} from "@mui/material";
import TrendUpIcon from "../../images/ui-icons/trend-up.svg";
import CoinsIcon from "../../images/ui-icons/coins.svg";
import BoxIcon from "../../images/ui-icons/box.svg";
import AlertIcon from "../../images/ui-icons/alert.svg";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../../api/getUsers";
import { getProducts } from "../../api/products";
import { getWorkerOutputs, getWorkerOutputsSummary } from "../../api/workerOutputs";
import { getWorkerBalance } from "../../api/workerPayments";
import { getClientBalance, getClientSales, getClientSalesSummary } from "../../api/clientSales";
import { getMaterialPurchases, getSupplierBalance } from "../../api/materialPurchases";
import { hasPermission } from "../../utils/permissions";
import { getInventorySummary } from "../../api/inventory";

const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));
const date = (value) => (value ? new Date(value).toLocaleDateString("uz-UZ") : "-");

const monthRange = () => {
  const now = new Date();
  return {
    date_from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    date_to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
};

const previousMonthRange = () => {
  const now = new Date();
  return {
    date_from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10),
    date_to: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10),
  };
};

const getFinishedQuantity = (summary = []) => {
  const finalDepartment = summary.find((item) => {
    const value = `${item.group_code || ""} ${item.group_name || ""}`.toLowerCase();
    return /upakov|upakof|qadoq|pack|tayyor/.test(value);
  });

  return Number(finalDepartment?.total_quantity || 0);
};

const percentage = (value, total) => {
  if (!Number(total)) return 0;
  return Math.min(100, Math.round((Number(value || 0) / Number(total || 0)) * 100));
};

const StatCard = ({ label, value, helper, icon, tone = "blue" }) => {
  const toneClass = {
    blue: "from-blue-50 to-white text-blue-600 bg-blue-600",
    green: "from-emerald-50 to-white text-emerald-600 bg-emerald-500",
    amber: "from-amber-50 to-white text-amber-600 bg-amber-500",
    violet: "from-violet-50 to-white text-violet-600 bg-violet-500",
    rose: "from-rose-50 to-white text-rose-600 bg-rose-500",
  }[tone];

  const iconBg = {
    blue: "#2563eb",
    green: "#10b981",
    amber: "#f59e0b",
    violet: "#8b5cf6",
    rose: "#f43f5e",
  }[tone];

  return (
    <Paper
      elevation={0}
      className={`crm-soft-card overflow-hidden bg-gradient-to-br ${toneClass.split(" bg-")[0]} p-5`}
    >
      <Box className="flex items-start justify-between gap-4">
        <Box>
          <Typography variant="body2" className="font-bold text-slate-500">
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={950} className="mt-2 text-slate-950">
            {value}
          </Typography>
        </Box>
        <Box
          className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
          style={{ backgroundColor: iconBg }}
        >
          <img className="h-6 w-6 brightness-0 invert" src={icon} alt="" />
        </Box>
      </Box>
      {helper && (
        <Typography variant="body2" className="mt-2 text-slate-500">
          {helper}
        </Typography>
      )}
    </Paper>
  );
};

const SectionCard = ({ title, action, children, className = "" }) => (
  <Paper elevation={0} className={`crm-card p-5 ${className}`}>
    <Box className="mb-4 flex items-center justify-between gap-3">
      <Typography fontWeight={950} className="text-slate-950">
        {title}
      </Typography>
      {action}
    </Box>
    {children}
  </Paper>
);

const Empty = ({ children }) => (
  <Box className="flex min-h-36 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/80">
    <Typography variant="body2" className="text-slate-500">
      {children}
    </Typography>
  </Box>
);

const MiniBars = ({
  items,
  valueKey = "total_amount",
  labelKey = "group_name",
  tone = "#2563eb",
}) => {
  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);

  return (
    <Box className="space-y-4">
      {items.slice(0, 6).map((item, index) => {
        const value = Number(item[valueKey] || 0);
        return (
          <Box key={`${item.group_id || item.id || index}-${item[labelKey] || index}`}>
            <Box className="mb-1.5 flex items-center justify-between gap-3">
              <Typography variant="body2" className="truncate font-black text-slate-700">
                {item[labelKey] || "Noma'lum"}
              </Typography>
              <Typography variant="body2" className="shrink-0 font-bold text-slate-500">
                {valueKey.includes("quantity") ? number(value) : money(value)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage(value, max)}
              sx={{
                height: 9,
                borderRadius: 99,
                bgcolor: "#eef2f7",
                "& .MuiLinearProgress-bar": { borderRadius: 99, bgcolor: tone },
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
};

const SalesChart = ({ bars }) => {
  const values = bars.map((bar) => Number(bar.value || 0));
  const max = Math.max(...values, 1);

  return (
    <Box
      className="grid h-[250px] items-end gap-5 rounded-3xl bg-gradient-to-b from-slate-50 to-white px-6 py-5"
      style={{ gridTemplateColumns: `repeat(${Math.max(bars.length, 1)}, minmax(0, 1fr))` }}
    >
      {bars.map((bar) => (
        <Box key={bar.label} className="flex h-full flex-col justify-end gap-3 text-center">
          <Box className="flex flex-1 items-end justify-center">
            <Box
              className="w-full max-w-[82px] rounded-t-[24px] shadow-lg"
              style={{
                height: `${Math.max(22, percentage(bar.value, max))}%`,
                background: `linear-gradient(180deg, ${bar.color} 0%, ${bar.color}99 100%)`,
              }}
            />
          </Box>
          <Box>
            <Typography className="text-xs font-black text-slate-600">{bar.label}</Typography>
            <Typography className="text-xs text-slate-400">{money(bar.value)}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const AdminOverview = ({ user }) => {
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === "super_admin";
  const canViewUsers = hasPermission(user, "users.view");
  const canViewProducts = hasPermission(user, "products.view");
  const canViewProduction = hasPermission(user, "production.view");
  const canViewPayroll = hasPermission(user, "payroll.view");
  const canViewFinance = hasPermission(user, "finance.view");
  const canViewInventory = hasPermission(user, "inventory.view");
  const hasClientAccounting =
    (!user?.plan_code || user.plan_features?.includes("client_accounting")) &&
    hasPermission(user, "client_sales.view");
  const hasSupplierAccounting =
    (!user?.plan_code || user.plan_features?.includes("supplier_accounting")) &&
    hasPermission(user, "material_purchases.view");
  const [loading, setLoading] = useState(true);
  const [filterForm, setFilterForm] = useState(monthRange);
  const [appliedRange, setAppliedRange] = useState(monthRange);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [data, setData] = useState({
    users: 0,
    products: 0,
    productionQuantity: 0,
    productionAmount: 0,
    salaryEarned: 0,
    salaryPaid: 0,
    salaryRemaining: 0,
    advances: 0,
    sales: 0,
    clientIncome: 0,
    clientDebt: 0,
    salesCount: 0,
    purchases: 0,
    supplierPaid: 0,
    supplierDebt: 0,
    purchasesCount: 0,
  });
  const [clients, setClients] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState({
    summary: {
      warehouses_count: 0,
      stock_lines: 0,
      total_quantity: 0,
      low_stock_lines: 0,
      empty_warehouses: 0,
    },
    warehouses: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = appliedRange;
      const [
        usersRes,
        productsRes,
        outputsRes,
        workerRes,
        departmentRes,
        salaryMonthRes,
        salaryAllRes,
        salesRes,
        clientDebtRes,
        clientRes,
        purchasesRes,
        supplierMonthRes,
        supplierDebtRes,
        inventoryRes,
      ] = await Promise.all([
        canViewUsers
          ? getUsers({ offset: 0, limit: 1 })
          : Promise.resolve({ data: { pageInfo: {} } }),
        canViewProducts
          ? getProducts({ offset: 0, limit: 1 })
          : Promise.resolve({ data: { pageInfo: {} } }),
        canViewProduction
          ? getWorkerOutputs({ ...range, offset: 0, limit: 1 })
          : Promise.resolve({ data: { totals: {} } }),
        canViewProduction
          ? getWorkerOutputsSummary({ ...range, group_by: "worker" })
          : Promise.resolve({ data: { summary: [] } }),
        canViewProduction
          ? getWorkerOutputsSummary({ ...range, group_by: "department" })
          : Promise.resolve({ data: { summary: [] } }),
        canViewPayroll ? getWorkerBalance(range) : Promise.resolve({ data: { balance: {} } }),
        canViewPayroll ? getWorkerBalance({}) : Promise.resolve({ data: { balance: {} } }),
        hasClientAccounting
          ? getClientSales({ ...range, offset: 0, limit: 1 })
          : Promise.resolve({ data: { totals: {}, pageInfo: {} } }),
        isSuperAdmin && hasClientAccounting
          ? getClientBalance({})
          : Promise.resolve({ data: { balance: {} } }),
        isSuperAdmin && hasClientAccounting
          ? getClientSalesSummary({ ...range, group_by: "client" })
          : Promise.resolve({ data: { summary: [] } }),
        hasSupplierAccounting
          ? getMaterialPurchases({ ...range, offset: 0, limit: 6 })
          : Promise.resolve({ data: { material_purchases: [], pageInfo: {} } }),
        hasSupplierAccounting ? getSupplierBalance(range) : Promise.resolve({ data: {} }),
        hasSupplierAccounting ? getSupplierBalance({}) : Promise.resolve({ data: {} }),
        canViewInventory
          ? getInventorySummary()
          : Promise.resolve({ data: { summary: {}, warehouses: [] } }),
      ]);

      const departmentSummary = departmentRes.data.summary || [];

      setData({
        users: usersRes.data.pageInfo?.total || 0,
        products: productsRes.data.pageInfo?.total || 0,
        productionQuantity: getFinishedQuantity(departmentSummary),
        productionAmount: outputsRes.data.totals?.total_amount || 0,
        salaryEarned: salaryMonthRes.data.balance?.total_earned || 0,
        salaryPaid: salaryMonthRes.data.balance?.total_paid || 0,
        salaryRemaining: salaryAllRes.data.balance?.remaining || 0,
        advances: salaryAllRes.data.balance?.remaining_advance || 0,
        sales: salesRes.data.totals?.total_amount || 0,
        clientIncome: salesRes.data.totals?.paid_amount || 0,
        clientDebt: clientDebtRes.data.balance?.debt_amount || 0,
        salesCount: salesRes.data.pageInfo?.total || 0,
        purchases: supplierMonthRes.data.total_purchase || 0,
        supplierPaid: supplierMonthRes.data.total_paid || 0,
        supplierDebt: supplierDebtRes.data.debt_amount || 0,
        purchasesCount: purchasesRes.data.pageInfo?.total || 0,
      });
      setClients(clientRes.data.summary || []);
      setWorkers(workerRes.data.summary || []);
      setDepartments(departmentSummary);
      setPurchases(purchasesRes.data.material_purchases || []);
      setInventory({
        summary: inventoryRes.data.summary || {},
        warehouses: inventoryRes.data.warehouses || [],
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Bosh sahifa ma'lumotlarini olishda xato.");
    } finally {
      setLoading(false);
    }
  }, [
    appliedRange,
    canViewUsers,
    canViewProducts,
    canViewProduction,
    canViewPayroll,
    canViewInventory,
    hasClientAccounting,
    hasSupplierAccounting,
    isSuperAdmin,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const allowed = [
      "all",
      hasClientAccounting && "clients",
      canViewProduction && "workers",
      hasSupplierAccounting && "suppliers",
    ].filter(Boolean);

    if (!allowed.includes(sectionFilter)) {
      setSectionFilter("all");
    }
  }, [canViewProduction, hasClientAccounting, hasSupplierAccounting, sectionFilter]);

  const obligations = Number(data.supplierDebt) + Number(data.salaryRemaining);
  const balanceDifference = Number(data.clientDebt) - obligations;

  const attentionItems = useMemo(
    () =>
      [
        isSuperAdmin &&
          hasClientAccounting &&
          Number(data.clientDebt) > 0 && {
            label: "Mijozlardan olinadigan qarz",
            value: money(data.clientDebt),
            helper: "To'lov kutilayotgan umumiy summa",
            path: "/client-sales",
            tone: "green",
          },
        hasSupplierAccounting &&
          Number(data.supplierDebt) > 0 && {
            label: "Ta'minotchilarga qarz",
            value: money(data.supplierDebt),
            helper: "Oldingi qarzlar bilan umumiy summa",
            path: "/material-purchases",
            tone: "rose",
          },
        canViewPayroll &&
          Number(data.salaryRemaining) > 0 && {
            label: "Berilmagan ish haqi",
            value: money(data.salaryRemaining),
            helper: "Hodimlarga to'lanishi kerak",
            path: "/worker-payments",
            tone: "amber",
          },
        canViewPayroll &&
          Number(data.advances) > 0 && {
            label: "Hodimlarning avansi",
            value: money(data.advances),
            helper: "Keyingi hisobda ushlanishi mumkin",
            path: "/worker-payments",
            tone: "violet",
          },
        canViewInventory &&
          Number(inventory.summary.low_stock_lines) > 0 && {
            label: "Omborda kam qolgan mahsulotlar",
            value: `${number(inventory.summary.low_stock_lines)} ta`,
            helper: "Minimal qoldiq chegarasiga yetgan pozitsiyalar",
            path: "/inventory",
            tone: "rose",
          },
      ].filter(Boolean),
    [
      canViewInventory,
      canViewPayroll,
      data,
      hasClientAccounting,
      hasSupplierAccounting,
      inventory,
      isSuperAdmin,
    ],
  );

  if (loading)
    return (
      <Box className="flex h-full items-center justify-center">
        <CircularProgress size={38} />
      </Box>
    );

  const showClient =
    isSuperAdmin && hasClientAccounting && ["all", "clients"].includes(sectionFilter);
  const showSupplier = hasSupplierAccounting && ["all", "suppliers"].includes(sectionFilter);
  const showWorkers = canViewProduction && ["all", "workers"].includes(sectionFilter);
  const allowedFilters = [
    ["all", "Hammasi"],
    isSuperAdmin && hasClientAccounting && ["clients", "Mijozlar"],
    canViewProduction && ["workers", "Ishchilar"],
    hasSupplierAccounting && ["suppliers", "Yetkazib beruvchi"],
  ].filter(Boolean);
  const chartBars = [
    isSuperAdmin && hasClientAccounting && { label: "Savdo", value: data.sales, color: "#2563eb" },
    hasSupplierAccounting && { label: "Xarid", value: data.purchases, color: "#f59e0b" },
    canViewProduction && {
      label: "Ishlab chiqarish",
      value: data.productionAmount,
      color: "#10b981",
    },
  ].filter(Boolean);

  return (
    <Box className="crm-page h-full overflow-auto pr-1">
      <Box className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <Box>
          <Box className="mb-2 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            Al-amin CRM - kengaytirilgan boshqaruv paneli
          </Box>
          <Typography variant="h4" fontWeight={950} className="text-slate-950">
            Xush kelibsiz, {user?.first_name || "Admin"}!
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            Sizga ochilgan bo'limlar bo'yicha tanlangan davr ko'rsatkichlari.
          </Typography>
        </Box>

        <Paper elevation={0} className="crm-soft-card p-3">
          <Box className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const range = monthRange();
                setFilterForm(range);
                setAppliedRange(range);
              }}
            >
              Bu oy
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const range = previousMonthRange();
                setFilterForm(range);
                setAppliedRange(range);
              }}
            >
              O'tgan oy
            </Button>
            <TextField
              type="date"
              size="small"
              value={filterForm.date_from}
              onChange={(event) =>
                setFilterForm((previous) => ({ ...previous, date_from: event.target.value }))
              }
            />
            <TextField
              type="date"
              size="small"
              value={filterForm.date_to}
              onChange={(event) =>
                setFilterForm((previous) => ({ ...previous, date_to: event.target.value }))
              }
            />
            <Button size="small" variant="contained" onClick={() => setAppliedRange(filterForm)}>
              Ko'rish
            </Button>
          </Box>
        </Paper>
      </Box>

      <Box className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isSuperAdmin && hasClientAccounting && (
          <StatCard
            label="Jami savdo"
            value={money(data.sales)}
            helper={`${data.salesCount} ta savdo, tanlangan davr`}
            icon={TrendUpIcon}
            tone="blue"
          />
        )}
        {isSuperAdmin && hasClientAccounting && (
          <StatCard
            label="Mijozlardan tushum"
            value={money(data.clientIncome)}
            helper={`Mijozlar qarzi: ${money(data.clientDebt)}`}
            icon={CoinsIcon}
            tone="green"
          />
        )}
        {canViewProduction && (
          <StatCard
            label="Tayyor mahsulot"
            value={`${number(data.productionQuantity)} par`}
            helper={money(data.productionAmount)}
            icon={BoxIcon}
            tone="violet"
          />
        )}
        {hasSupplierAccounting && (
          <StatCard
            label="Homashyo xaridi"
            value={money(data.purchases)}
            helper={`${data.purchasesCount} ta xarid, tanlangan davr`}
            icon={AlertIcon}
            tone="amber"
          />
        )}
        {canViewInventory && (
          <StatCard
            label="Omborlardagi jami qoldiq"
            value={`${number(inventory.summary.total_quantity)} birlik`}
            helper={`${number(inventory.summary.warehouses_count)} ta faol ombor`}
            icon={BoxIcon}
            tone="green"
          />
        )}
      </Box>

      {canViewInventory && (
        <SectionCard
          title="Omborlar holati"
          className="mb-5"
          action={
            <Button size="small" onClick={() => navigate("/inventory")}>
              Omborlarga o'tish
            </Button>
          }
        >
          {inventory.warehouses.length ? (
            <Box className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {inventory.warehouses.map((warehouse) => {
                const hasWarning = Number(warehouse.low_stock_lines) > 0;
                return (
                  <Box
                    key={warehouse.id}
                    onClick={() => navigate(`/inventory/warehouses/${warehouse.id}`)}
                    className="cursor-pointer rounded-3xl border border-slate-200 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/70"
                  >
                    <Box className="mb-4 flex items-start justify-between gap-3">
                      <Box className="min-w-0">
                        <Typography className="truncate font-black text-slate-900">
                          {warehouse.name}
                        </Typography>
                        <Typography variant="body2" className="text-slate-500">
                          {warehouse.location || warehouse.code}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        color={hasWarning ? "warning" : "success"}
                        label={hasWarning ? `${warehouse.low_stock_lines} ta kam` : "Me'yorda"}
                      />
                    </Box>
                    <Box className="grid grid-cols-3 gap-2">
                      <Box>
                        <Typography variant="caption" className="text-slate-500">
                          Pozitsiya
                        </Typography>
                        <Typography fontWeight={950}>{number(warehouse.stock_lines)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" className="text-slate-500">
                          Jami
                        </Typography>
                        <Typography fontWeight={950}>{number(warehouse.total_quantity)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" className="text-slate-500">
                          Tugagan
                        </Typography>
                        <Typography fontWeight={950}>{number(warehouse.empty_lines)}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Empty>Faol ombor topilmadi.</Empty>
          )}
        </SectionCard>
      )}

      <Box className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_.9fr_.9fr]">
        {chartBars.length > 0 && (
          <SectionCard
            title="Faoliyat dinamikasi"
            action={
              <Chip label={`${appliedRange.date_from} / ${appliedRange.date_to}`} size="small" />
            }
          >
            <SalesChart bars={chartBars} />
          </SectionCard>
        )}

        {canViewProduction && (
          <SectionCard title="Bo'limlar kesimi">
            {departments.length ? (
              <MiniBars
                items={departments}
                valueKey="total_quantity"
                labelKey="group_name"
                tone="#8b5cf6"
              />
            ) : (
              <Empty>Bo'limlar bo'yicha ma'lumot yo'q.</Empty>
            )}
          </SectionCard>
        )}

        <SectionCard title="Muhim eslatmalar">
          {attentionItems.length ? (
            <Box className="space-y-3">
              {attentionItems.slice(0, 4).map((item) => (
                <Box
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/80 p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/70"
                >
                  <Box className="flex items-start justify-between gap-3">
                    <Box>
                      <Typography className="font-black text-slate-800">{item.label}</Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {item.helper}
                      </Typography>
                    </Box>
                    <Chip label={item.value} size="small" />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Empty>Hozircha muhim ogohlantirish yo'q.</Empty>
          )}
        </SectionCard>
      </Box>

      <Box className="mb-5 flex flex-wrap gap-2">
        {allowedFilters.map(([value, label]) => (
          <Button
            key={value}
            variant={sectionFilter === value ? "contained" : "outlined"}
            onClick={() => setSectionFilter(value)}
          >
            {label}
          </Button>
        ))}
      </Box>

      <Box className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {showClient && (
          <SectionCard
            title="So'nggi mijozlar va savdo"
            action={
              <Button size="small" onClick={() => navigate("/client-sales")}>
                Barchasi
              </Button>
            }
          >
            {clients.length ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Mijoz</TableCell>
                    <TableCell>Jami savdo</TableCell>
                    <TableCell>To'langan</TableCell>
                    <TableCell>Qarz</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.slice(0, 6).map((client, index) => (
                    <TableRow key={client.group_id || client.client_id || index} hover>
                      <TableCell>
                        <Box className="flex items-center gap-2">
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              bgcolor: "#dbeafe",
                              color: "#2563eb",
                              fontSize: 13,
                              fontWeight: 900,
                            }}
                          >
                            {(client.group_name || "M")[0]}
                          </Avatar>
                          <Typography className="font-bold">
                            {client.group_name || "Mijoz"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{money(client.total_amount)}</TableCell>
                      <TableCell>{money(client.paid_amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={money(client.debt_amount)}
                          size="small"
                          color={Number(client.debt_amount) > 0 ? "warning" : "success"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty>Mijozlar bo'yicha ma'lumot yo'q.</Empty>
            )}
          </SectionCard>
        )}

        {showWorkers && (
          <SectionCard
            title="Ishchilar samaradorligi"
            action={
              <Button size="small" onClick={() => navigate("/worker-outputs")}>
                Barchasi
              </Button>
            }
          >
            {workers.length ? (
              <MiniBars
                items={workers}
                valueKey="total_amount"
                labelKey="group_name"
                tone="#10b981"
              />
            ) : (
              <Empty>Ishchilar bo'yicha yozuv yo'q.</Empty>
            )}
          </SectionCard>
        )}

        {showSupplier && (
          <SectionCard
            title="Oxirgi homashyo xaridlari"
            action={
              <Button size="small" onClick={() => navigate("/material-purchases")}>
                Barchasi
              </Button>
            }
          >
            {purchases.length ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Yetkazib beruvchi</TableCell>
                    <TableCell>Sana</TableCell>
                    <TableCell>Jami</TableCell>
                    <TableCell>Holat</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchases.slice(0, 6).map((purchase) => (
                    <TableRow key={purchase.id} hover>
                      <TableCell className="font-bold">
                        {purchase.supplier_name || "Ta'minotchi"}
                      </TableCell>
                      <TableCell>{date(purchase.purchased_at || purchase.created_at)}</TableCell>
                      <TableCell>{money(purchase.total_amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={purchase.status === "active" ? "Faol" : purchase.status || "Faol"}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty>Homashyo xaridlari topilmadi.</Empty>
            )}
          </SectionCard>
        )}

        {canViewFinance && (
          <SectionCard title="Korxona balansi" className="xl:col-span-2">
            <Box className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Box className="rounded-3xl border border-slate-200 bg-blue-50 p-4">
                <Typography className="font-bold text-slate-500">Foydalanuvchilar</Typography>
                <Typography variant="h5" fontWeight={950}>
                  {number(data.users)}
                </Typography>
              </Box>
              <Box className="rounded-3xl border border-slate-200 bg-violet-50 p-4">
                <Typography className="font-bold text-slate-500">Mahsulotlar</Typography>
                <Typography variant="h5" fontWeight={950}>
                  {number(data.products)}
                </Typography>
              </Box>
              <Box className="rounded-3xl border border-slate-200 bg-emerald-50 p-4">
                <Typography className="font-bold text-slate-500">Olinadigan</Typography>
                <Typography variant="h5" fontWeight={950}>
                  {money(data.clientDebt)}
                </Typography>
              </Box>
              <Box className="rounded-3xl border border-slate-200 bg-rose-50 p-4">
                <Typography className="font-bold text-slate-500">Farq</Typography>
                <Typography
                  variant="h5"
                  fontWeight={950}
                  className={balanceDifference >= 0 ? "text-emerald-700" : "text-rose-700"}
                >
                  {money(balanceDifference)}
                </Typography>
              </Box>
            </Box>
          </SectionCard>
        )}
      </Box>
    </Box>
  );
};

export default AdminOverview;
