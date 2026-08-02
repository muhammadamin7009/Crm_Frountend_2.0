import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import PageHeader from "../../Components/UI/PageHeader";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import CrmPagination from "../../Components/Common/CrmPagination";
import { useAuth } from "../../Context/AuthContext";
import { hasPermission } from "../../utils/permissions";
import { getUsers } from "../../api/getUsers";
import { getProducts } from "../../api/products";
import { getInventoryStock, getWarehouses } from "../../api/inventory";
import { getFinancialAccounts } from "../../api/finance";
import { getDepartments, updateDepartment } from "../../api/departments";
import {
  assignWorkflowWorkerDepartment,
  convertOrderToSale,
  createOrderTask,
  createOrder,
  deleteOrder,
  getOrder,
  getOrderTasks,
  getOrders,
  getWorkflowWorkers,
  updateOrder,
  deleteOrderTask,
} from "../../api/orders";

const statuses = {
  new: { label: "Yangi", color: "#2563eb", bg: "#eff6ff" },
  confirmed: { label: "Tasdiqlandi", color: "#7c3aed", bg: "#f5f3ff" },
  in_production: { label: "Ishlab chiqarishda", color: "#d97706", bg: "#fffbeb" },
  ready: { label: "Tayyor", color: "#059669", bg: "#ecfdf5" },
  completed: { label: "Bajarildi", color: "#15803d", bg: "#f0fdf4" },
  cancelled: { label: "Bekor qilindi", color: "#dc2626", bg: "#fef2f2" },
};
const editableStatuses = Object.entries(statuses).filter(([value]) => value !== "completed");

const today = () => new Date().toISOString().slice(0, 10);
const emptyItem = { product_id: "", quantity: 1, unit_price: "", note: "" };
const emptyForm = {
  client_id: "",
  status: "new",
  ordered_at: today(),
  due_date: "",
  note: "",
  priority: "normal",
  items: [{ ...emptyItem }],
};
const emptyConversion = { warehouse_id: "", account_id: "", paid_amount: 0, sold_at: today() };
const emptyTask = {
  order_item_id: "",
  department_id: "",
  assigned_to: "",
  planned_quantity: "",
  due_date: "",
  note: "",
};
const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
const date = (value) => (value ? new Intl.DateTimeFormat("uz-UZ").format(new Date(value)) : "—");

const StatusChip = ({ value }) => {
  const status = statuses[value] || statuses.new;
  return (
    <Chip
      size="small"
      label={status.label}
      sx={{
        height: 27,
        color: status.color,
        bgcolor: status.bg,
        border: `1px solid ${status.color}28`,
        fontWeight: 800,
      }}
    />
  );
};

const Orders = () => {
  const { user } = useAuth();
  const canManage = hasPermission(user, "orders.manage");
  const canConvert =
    canManage &&
    hasPermission(user, "client_sales.manage") &&
    hasPermission(user, "inventory.view");
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [conversionStock, setConversionStock] = useState([]);
  const [totals, setTotals] = useState({ total_orders: 0, total_amount: 0 });
  const [pageInfo, setPageInfo] = useState({ total: 0, limit: 10, offset: 0 });
  const [filters, setFilters] = useState({ q: "", status: "", client_id: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [conversionOpen, setConversionOpen] = useState(false);
  const [conversionOrder, setConversionOrder] = useState(null);
  const [conversionForm, setConversionForm] = useState(emptyConversion);
  const [converting, setConverting] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [taskOrder, setTaskOrder] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskSaving, setTaskSaving] = useState(false);
  const [departmentOrderOpen, setDepartmentOrderOpen] = useState(false);
  const [departmentOrder, setDepartmentOrder] = useState([]);
  const [workerDepartments, setWorkerDepartments] = useState({});
  const [departmentOrderSaving, setDepartmentOrderSaving] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);
  const productById = useMemo(
    () => new Map(products.map((product) => [Number(product.id), product])),
    [products],
  );
  const formTotal = useMemo(
    () =>
      form.items.reduce((sum, item) => {
        const product = productById.get(Number(item.product_id));
        const price =
          item.unit_price === "" ? Number(product?.sale_price || 0) : Number(item.unit_price || 0);
        return sum + Number(item.quantity || 0) * price;
      }, 0),
    [form.items, productById],
  );

  const loadOptions = useCallback(async () => {
    try {
      const [
        clientsResponse,
        productsResponse,
        warehousesResponse,
        accountsResponse,
        departmentsResponse,
        workersResponse,
      ] = await Promise.all([
        getUsers({ role: "client", limit: 100, offset: 0 }),
        getProducts({ limit: 100, offset: 0, is_active: true }),
        getWarehouses().catch(() => ({ data: { warehouses: [] } })),
        getFinancialAccounts().catch(() => ({ data: { financial_accounts: [] } })),
        getDepartments({ is_active: true, limit: 100 }),
        canManage ? getWorkflowWorkers() : Promise.resolve({ data: { workers: [] } }),
      ]);
      setClients(clientsResponse.data.users || []);
      setProducts(productsResponse.data.products || []);
      setWarehouses(
        (warehousesResponse.data.warehouses || []).filter(
          (item) =>
            item.is_active !== false &&
            ["product", "mixed"].includes(item.warehouse_type || "mixed"),
        ),
      );
      setAccounts(accountsResponse.data.financial_accounts || []);
      setDepartments(departmentsResponse.data.departments || []);
      setWorkers(workersResponse.data.workers || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Ma'lumotnomalarni yuklab bo'lmadi");
    }
  }, [canManage]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getOrders({
        ...filters,
        limit: pageInfo.limit,
        offset: pageInfo.offset,
      });
      setOrders(data.orders || []);
      setTotals(data.totals || { total_orders: 0, total_amount: 0 });
      setPageInfo((current) => ({ ...current, ...(data.pageInfo || {}) }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Zakazlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [filters, pageInfo.limit, pageInfo.offset]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);
  useEffect(() => {
    const timer = setTimeout(loadOrders, 250);
    return () => clearTimeout(timer);
  }, [loadOrders]);
  useEffect(() => {
    if (!conversionOpen || !conversionForm.warehouse_id) {
      setConversionStock([]);
      return undefined;
    }
    let active = true;
    setStockLoading(true);
    getInventoryStock({
      warehouse_id: conversionForm.warehouse_id,
      item_type: "product",
      limit: 200,
    })
      .then(({ data }) => {
        if (active) setConversionStock(data.stock || []);
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || "Ombor qoldig'ini olib bo'lmadi");
      })
      .finally(() => {
        if (active) setStockLoading(false);
      });
    return () => {
      active = false;
    };
  }, [conversionForm.warehouse_id, conversionOpen]);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPageInfo((current) => ({ ...current, offset: 0 }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, items: [{ ...emptyItem }], ordered_at: today() });
    setOpen(true);
  };

  const openEdit = async (id) => {
    try {
      const { data } = await getOrder(id);
      const order = data.order;
      setEditingId(id);
      setForm({
        client_id: order.client_id || "",
        status: order.status || "new",
        ordered_at: String(order.ordered_at || "").slice(0, 10),
        due_date: String(order.due_date || "").slice(0, 10),
        note: order.note || "",
        priority: order.priority || "normal",
        items: (order.items || []).map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          note: item.note || "",
        })),
      });
      setOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Zakazni ochib bo'lmadi");
    }
  };

  const changeItem = (index, key, value) =>
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        if (key === "product_id")
          return {
            ...item,
            product_id: value,
            unit_price: productById.get(Number(value))?.sale_price ?? "",
          };
        return { ...item, [key]: value };
      }),
    }));

  const save = async () => {
    if (
      !form.client_id ||
      form.items.some((item) => !item.product_id || Number(item.quantity) <= 0)
    ) {
      toast.warning("Mijoz, mahsulot va miqdorni to'ldiring");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        due_date: form.due_date || null,
        items: form.items.map((item) => ({
          ...item,
          unit_price: item.unit_price === "" ? undefined : Number(item.unit_price),
          quantity: Number(item.quantity),
        })),
      };
      if (editingId) await updateOrder(editingId, payload);
      else await createOrder(payload);
      toast.success(editingId ? "Zakaz yangilandi" : "Yangi zakaz yaratildi");
      setOpen(false);
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Zakazni saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (order, status) => {
    try {
      await updateOrder(order.id, { status });
      toast.success("Holat yangilandi");
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Holatni yangilab bo‘lmadi");
    }
  };

  const remove = async (order) => {
    if (!window.confirm(`${order.order_number} zakazini o'chirasizmi?`)) return;
    try {
      await deleteOrder(order.id);
      toast.success("Zakaz o'chirildi");
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Zakazni o'chirib bo'lmadi");
    }
  };

  const openConversion = async (order) => {
    try {
      const { data } = await getOrder(order.id);
      const defaultWarehouse = warehouses.find((item) => item.is_default) || warehouses[0];
      setConversionOrder(data.order);
      setConversionForm({
        ...emptyConversion,
        warehouse_id: defaultWarehouse?.id || "",
        sold_at: today(),
      });
      setConversionOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Zakazni ochib bo'lmadi");
    }
  };

  const conversionStockByProduct = useMemo(
    () =>
      new Map(conversionStock.map((item) => [Number(item.item_id), Number(item.quantity || 0)])),
    [conversionStock],
  );
  const insufficientItems = useMemo(
    () =>
      (conversionOrder?.items || []).filter(
        (item) =>
          Number(item.quantity) >
          Number(conversionStockByProduct.get(Number(item.product_id)) || 0),
      ),
    [conversionOrder, conversionStockByProduct],
  );
  const conversionPaidTooMuch =
    Number(conversionForm.paid_amount || 0) > Number(conversionOrder?.total_amount || 0);

  const convertToSale = async () => {
    if (!conversionForm.warehouse_id) {
      toast.warning("Mahsulot chiqadigan omborni tanlang");
      return;
    }
    if (conversionPaidTooMuch) {
      toast.warning("To'lov zakaz summasidan oshmasin");
      return;
    }
    if (insufficientItems.length) {
      toast.warning("Tanlangan omborda mahsulot yetarli emas");
      return;
    }
    setConverting(true);
    try {
      await convertOrderToSale(conversionOrder.id, {
        warehouse_id: Number(conversionForm.warehouse_id),
        account_id: conversionForm.account_id ? Number(conversionForm.account_id) : undefined,
        paid_amount: Number(conversionForm.paid_amount || 0),
        sold_at: conversionForm.sold_at,
      });
      toast.success("Zakaz savdoga o'tkazildi, ombor va mijoz hisobi yangilandi");
      setConversionOpen(false);
      setConversionOrder(null);
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Zakazni savdoga o'tkazib bo'lmadi");
    } finally {
      setConverting(false);
    }
  };

  const loadTaskDetails = async (orderId) => {
    const [orderResponse, tasksResponse] = await Promise.all([
      getOrder(orderId),
      getOrderTasks(orderId),
    ]);
    setTaskOrder(orderResponse.data.order);
    setTasks(tasksResponse.data.tasks || []);
    return orderResponse.data.order;
  };

  const openTasks = async (order) => {
    setTaskLoading(true);
    try {
      const detail = await loadTaskDetails(order.id);
      setTaskForm({
        ...emptyTask,
        order_item_id: detail.items?.[0]?.id || "",
        due_date: String(detail.due_date || "").slice(0, 10),
      });
      setTasksOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Vazifalarni ochib bo'lmadi");
    } finally {
      setTaskLoading(false);
    }
  };

  const saveTask = async () => {
    if (
      !taskForm.order_item_id ||
      !taskForm.department_id ||
      !taskForm.assigned_to ||
      Number(taskForm.planned_quantity) <= 0
    ) {
      toast.warning("Mahsulot, bo'lim, xodim va miqdorni to'ldiring");
      return;
    }
    setTaskSaving(true);
    try {
      await createOrderTask(taskOrder.id, {
        ...taskForm,
        order_item_id: Number(taskForm.order_item_id),
        department_id: Number(taskForm.department_id),
        assigned_to: Number(taskForm.assigned_to),
        planned_quantity: Number(taskForm.planned_quantity),
        due_date: taskForm.due_date || null,
      });
      toast.success("Vazifa xodimga biriktirildi");
      await loadTaskDetails(taskOrder.id);
      setTaskForm((current) => ({ ...emptyTask, order_item_id: current.order_item_id }));
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Vazifani saqlab bo'lmadi");
    } finally {
      setTaskSaving(false);
    }
  };

  const removeTask = async (task) => {
    if (!window.confirm(`${task.worker_name} uchun vazifani o'chirasizmi?`)) return;
    try {
      await deleteOrderTask(task.id);
      await loadTaskDetails(taskOrder.id);
      loadOrders();
      toast.success("Vazifa o'chirildi");
    } catch (error) {
      toast.error(error.response?.data?.message || "Vazifani o'chirib bo'lmadi");
    }
  };

  const openDepartmentOrder = () => {
    setDepartmentOrder([...departments]);
    setWorkerDepartments(
      Object.fromEntries(workers.map((worker) => [worker.id, worker.department_id || ""])),
    );
    setDepartmentOrderOpen(true);
  };

  const moveDepartment = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= departmentOrder.length) return;
    setDepartmentOrder((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const saveDepartmentOrder = async () => {
    setDepartmentOrderSaving(true);
    try {
      await Promise.all(
        departmentOrder.map((department, index) =>
          updateDepartment(department.id, { sort_order: index + 1 }),
        ),
      );
      for (const worker of workers) {
        const departmentId = workerDepartments[worker.id];
        if (departmentId) {
          await assignWorkflowWorkerDepartment(worker.id, Number(departmentId));
        }
      }
      const { data } = await getDepartments({ is_active: true, limit: 100 });
      const workersResponse = await getWorkflowWorkers();
      setDepartments(data.departments || []);
      setWorkers(workersResponse.data.workers || []);
      setDepartmentOrderOpen(false);
      toast.success("Bo'limlar tartibi va xodimlar saqlandi");
    } catch (error) {
      toast.error(error.response?.data?.message || "Bo'limlar tartibini saqlab bo'lmadi");
    } finally {
      setDepartmentOrderSaving(false);
    }
  };

  return (
    <Stack className="crm-page" spacing={3} sx={{ p: { xs: 2, md: 3.5 }, minWidth: 0 }}>
      <PageHeader
        eyebrow="Savdo jarayoni"
        title="Zakazlar"
        description="Mijoz buyurtmalarini qabul qiling, muddat va bajarilish holatini kuzating."
        actions={
          canManage && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={openDepartmentOrder}
                sx={{ minHeight: 44, textTransform: "none", fontWeight: 850 }}
              >
                Bo'limlar va xodimlar
              </Button>
              <Button
                variant="contained"
                onClick={openCreate}
                sx={{
                  minHeight: 44,
                  px: 2.5,
                  bgcolor: "var(--aa-brand-700)",
                  fontWeight: 850,
                  textTransform: "none",
                  borderRadius: 2.5,
                }}
              >
                + Yangi zakaz
              </Button>
            </Stack>
          )
        }
      />

      <Box
        className="aa-mobile-metrics-row"
        sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" }, gap: 2 }}
      >
        {[
          ["Jami zakaz", totals.total_orders, "Barcha natijalar"],
          ["Zakazlar summasi", money(totals.total_amount), "Filtr bo'yicha"],
          [
            "Jarayonda",
            orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length,
            "Joriy sahifada",
          ],
        ].map(([label, value, hint]) => (
          <Paper
            className="aa-mobile-compact-metric"
            key={label}
            elevation={0}
            sx={{
              p: 2.2,
              border: "1px solid var(--aa-border)",
              borderRadius: 3,
              bgcolor: "var(--aa-surface)",
            }}
          >
            <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 12.5, fontWeight: 750 }}>
              {label}
            </Typography>
            <Typography sx={{ mt: 0.7, color: "var(--aa-text)", fontSize: 25, fontWeight: 900 }}>
              {value}
            </Typography>
            <Typography sx={{ mt: 0.25, color: "var(--aa-text-muted)", fontSize: 11.5 }}>
              {hint}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid var(--aa-border)",
          borderRadius: 3,
          overflow: "visible",
          bgcolor: "var(--aa-surface)",
        }}
      >
        <Box
          className="crm-sticky-filters"
          sx={{
            p: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" },
            gap: 1.5,
            borderBottom: "1px solid var(--aa-border)",
            borderRadius: "12px 12px 0 0",
            bgcolor: "var(--aa-surface-solid)",
          }}
        >
          <TextField
            size="small"
            label="Zakaz yoki mijozni qidirish"
            value={filters.q}
            onChange={(event) => setFilter("q", event.target.value)}
          />
          <TextField
            select
            size="small"
            label="Holat"
            value={filters.status}
            onChange={(event) => setFilter("status", event.target.value)}
          >
            <MenuItem value="">Barcha holatlar</MenuItem>
            {Object.entries(statuses).map(([value, item]) => (
              <MenuItem key={value} value={value}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Mijoz"
            value={filters.client_id}
            onChange={(event) => setFilter("client_id", event.target.value)}
          >
            <MenuItem value="">Barcha mijozlar</MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {`${client.first_name || ""} ${client.last_name || ""}`.trim() || client.username}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 1080 }}>
            <TableHead>
              <TableRow>
                {[
                  "Zakaz",
                  "Mijoz",
                  "Sana / muddat",
                  "Pozitsiya",
                  "Jarayon",
                  "Summa",
                  "Holat",
                  "Amallar",
                ].map((head) => (
                  <TableCell
                    key={head}
                    sx={{
                      bgcolor: "#f8fafc",
                      color: "var(--aa-text-secondary)",
                      fontSize: 11.5,
                      fontWeight: 850,
                    }}
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 7, color: "var(--aa-text-secondary)" }}
                  >
                    Zakazlar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 900, color: "var(--aa-text)" }}>
                        {order.order_number}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: "var(--aa-text-muted)" }}>
                        {order.note || "Izohsiz"}
                      </Typography>
                      {order.priority === "urgent" && (
                        <Chip
                          size="small"
                          label="Shoshilinch"
                          sx={{
                            mt: 0.6,
                            height: 22,
                            color: "#b91c1c",
                            bgcolor: "#fef2f2",
                            fontWeight: 850,
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 750 }}>{order.client_name || "—"}</Typography>
                      <Typography sx={{ fontSize: 11.5, color: "var(--aa-text-muted)" }}>
                        {order.client_phone || ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>{date(order.ordered_at)}</Typography>
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          color:
                            order.due_date &&
                            String(order.due_date).slice(0, 10) < today() &&
                            !["completed", "cancelled"].includes(order.status)
                              ? "#dc2626"
                              : "var(--aa-text-muted)",
                        }}
                      >
                        Muddat: {date(order.due_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>{Number(order.item_count || 0)} ta</TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography sx={{ fontSize: 11.5, fontWeight: 750 }}>
                          {Number(order.completed_task_count || 0)}/{Number(order.task_count || 0)}{" "}
                          vazifa
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, fontWeight: 850 }}>
                          {Number(order.progress_percent || 0)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Number(order.progress_percent || 0)}
                        sx={{ height: 6, borderRadius: 6 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 850 }}>{money(order.total_amount)}</TableCell>
                    <TableCell>
                      {canManage &&
                      !order.converted_batch_id &&
                      Number(order.task_count || 0) === 0 ? (
                        <TextField
                          select
                          size="small"
                          value={order.status}
                          onChange={(event) => changeStatus(order, event.target.value)}
                          sx={{
                            minWidth: 160,
                            "& .MuiOutlinedInput-root": { bgcolor: statuses[order.status]?.bg },
                          }}
                        >
                          {editableStatuses.map(([value, item]) => (
                            <MenuItem key={value} value={value}>
                              {item.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      ) : (
                        <StatusChip value={order.status} />
                      )}
                    </TableCell>
                    <TableCell>
                      {canManage && (
                        <Stack direction="row" spacing={0.5}>
                          <Button
                            size="small"
                            onClick={() => openTasks(order)}
                            disabled={taskLoading}
                            sx={{ textTransform: "none", fontWeight: 800 }}
                          >
                            Vazifalar
                          </Button>
                          {canConvert && order.status === "ready" && !order.converted_batch_id && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => openConversion(order)}
                              sx={{
                                whiteSpace: "nowrap",
                                bgcolor: "#15803d",
                                textTransform: "none",
                                fontWeight: 850,
                              }}
                            >
                              Savdoga o'tkazish
                            </Button>
                          )}
                          {!order.converted_batch_id && Number(order.task_count || 0) === 0 && (
                            <>
                              <div className="flex gap-2">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => openEdit(order.id)}
                                  sx={{ textTransform: "none", fontWeight: 800 }}
                                >
                                  Tahrirlash
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => remove(order)}
                                >
                                  delete
                                </Button>
                              </div>
                            </>
                          )}
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
        <CrmPagination
          total={pageInfo.total}
          page={page}
          limit={pageInfo.limit}
          onPageChange={(next) =>
            setPageInfo((current) => ({ ...current, offset: next * current.limit }))
          }
          onLimitChange={(limit) => setPageInfo((current) => ({ ...current, limit, offset: 0 }))}
        />
      </Paper>

      <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editingId ? "Zakazni tahrirlash" : "Yangi zakaz"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.2} sx={{ pt: 0.5 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
                gap: 1.5,
              }}
            >
              <TextField
                select
                label="Mijoz"
                value={form.client_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, client_id: event.target.value }))
                }
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {`${client.first_name || ""} ${client.last_name || ""}`.trim() ||
                      client.username}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="date"
                label="Zakaz sanasi"
                InputLabelProps={{ shrink: true }}
                value={form.ordered_at}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ordered_at: event.target.value }))
                }
              />
              <TextField
                type="date"
                label="Bajarish muddati"
                InputLabelProps={{ shrink: true }}
                value={form.due_date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, due_date: event.target.value }))
                }
              />
            </Box>
            <TextField
              select
              label="Holat"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value }))
              }
            >
              {editableStatuses.map(([value, item]) => (
                <MenuItem key={value} value={value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Ustuvorlik"
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({ ...current, priority: event.target.value }))
              }
            >
              <MenuItem value="normal">Oddiy</MenuItem>
              <MenuItem value="urgent">Shoshilinch</MenuItem>
            </TextField>
            <Typography sx={{ fontWeight: 900 }}>Mahsulotlar</Typography>
            {form.items.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "2fr .65fr 1fr auto" },
                  gap: 1,
                  alignItems: "center",
                }}
              >
                <TextField
                  select
                  size="small"
                  label="Mahsulot"
                  value={item.product_id}
                  onChange={(event) => changeItem(index, "product_id", event.target.value)}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                      {product.sku ? ` · ${product.sku}` : ""}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  type="number"
                  label="Miqdor"
                  value={item.quantity}
                  onChange={(event) => changeItem(index, "quantity", event.target.value)}
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Narx"
                  value={item.unit_price}
                  onChange={(event) => changeItem(index, "unit_price", event.target.value)}
                  inputProps={{ min: 0 }}
                />
                <IconButton
                  disabled={form.items.length === 1}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      items: current.items.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                  sx={{ color: "#dc2626" }}
                >
                  ×
                </IconButton>
              </Box>
            ))}
            <Button
              onClick={() =>
                setForm((current) => ({ ...current, items: [...current.items, { ...emptyItem }] }))
              }
              sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 850 }}
            >
              + Mahsulot qo'shish
            </Button>
            <TextField
              multiline
              minRows={2}
              label="Izoh"
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            />
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: "#f8fafc",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ color: "var(--aa-text-secondary)", fontWeight: 750 }}>
                Zakaz summasi
              </Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{money(formTotal)}</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={saving} sx={{ textTransform: "none" }}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            sx={{ bgcolor: "var(--aa-brand-700)", textTransform: "none", fontWeight: 850 }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={departmentOrderOpen}
        onClose={() => !departmentOrderSaving && setDepartmentOrderOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Ishlab chiqarish bo'limlari tartibi</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2, color: "var(--aa-text-secondary)", fontSize: 13 }}>
            Zakaz yuqoridan pastga shu tartibda yuradi. Yangi tasdiqlangan zakazlarga qo'llanadi.
          </Typography>
          <Stack spacing={1}>
            {departmentOrder.map((department, index) => (
              <Paper
                key={department.id}
                variant="outlined"
                sx={{ p: 1.3, display: "flex", alignItems: "center", gap: 1.2, borderRadius: 2 }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 1.5,
                    bgcolor: "#f1f5f9",
                    fontWeight: 900,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography sx={{ flex: 1, fontWeight: 850 }}>{department.name}</Typography>
                <Button
                  size="small"
                  disabled={index === 0}
                  onClick={() => moveDepartment(index, -1)}
                >
                  ↑
                </Button>
                <Button
                  size="small"
                  disabled={index === departmentOrder.length - 1}
                  onClick={() => moveDepartment(index, 1)}
                >
                  ↓
                </Button>
              </Paper>
            ))}
          </Stack>
          <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid var(--aa-border)" }}>
            <Typography sx={{ mb: 0.5, fontWeight: 900 }}>
              Xodimlarni bo'limlarga biriktirish
            </Typography>
            <Typography sx={{ mb: 2, color: "var(--aa-text-secondary)", fontSize: 13 }}>
              Xodim faqat o'z bo'limiga kelgan zakazlarni ko'radi va bajaradi.
            </Typography>
            <Stack spacing={1}>
              {workers.map((worker) => (
                <Paper
                  key={worker.id}
                  variant="outlined"
                  sx={{
                    p: 1.3,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 850 }}>
                      {[worker.first_name, worker.last_name].filter(Boolean).join(" ") ||
                        worker.username}
                    </Typography>
                    <Typography noWrap sx={{ color: "var(--aa-text-secondary)", fontSize: 12 }}>
                      {worker.position_name || "Lavozim biriktirilmagan"}
                    </Typography>
                  </Box>
                  <TextField
                    select
                    size="small"
                    label="Bo'lim"
                    value={workerDepartments[worker.id] || ""}
                    onChange={(event) =>
                      setWorkerDepartments((current) => ({
                        ...current,
                        [worker.id]: event.target.value,
                      }))
                    }
                    sx={{ width: { xs: 170, sm: 220 } }}
                  >
                    <MenuItem value="">Biriktirilmagan</MenuItem>
                    {departmentOrder.map((department) => (
                      <MenuItem key={department.id} value={department.id}>
                        {department.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Paper>
              ))}
              {!workers.length && (
                <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 13 }}>
                  Ishchi turidagi xodimlar topilmadi.
                </Typography>
              )}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDepartmentOrderOpen(false)}
            disabled={departmentOrderSaving}
            sx={{ textTransform: "none" }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={saveDepartmentOrder}
            disabled={departmentOrderSaving}
            sx={{ textTransform: "none", fontWeight: 850 }}
          >
            {departmentOrderSaving ? (
              <CircularProgress size={19} color="inherit" />
            ) : (
              "Tartib va birikmalarni saqlash"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={tasksOpen}
        onClose={() => !taskSaving && setTasksOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Xodimlarga vazifa biriktirish · {taskOrder?.order_number}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {false &&
              taskOrder &&
              !taskOrder.converted_batch_id &&
              !["completed", "cancelled"].includes(taskOrder.status) && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                  <Typography sx={{ mb: 1.5, fontWeight: 900 }}>Yangi vazifa</Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1.5fr 1fr 1fr .7fr" },
                      gap: 1.2,
                    }}
                  >
                    <TextField
                      select
                      size="small"
                      label="Zakaz mahsuloti"
                      value={taskForm.order_item_id}
                      onChange={(event) => {
                        const item = taskOrder.items.find(
                          (row) => Number(row.id) === Number(event.target.value),
                        );
                        setTaskForm((current) => ({
                          ...current,
                          order_item_id: event.target.value,
                          planned_quantity: item?.quantity || "",
                        }));
                      }}
                    >
                      {(taskOrder.items || []).map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.product_name} · {item.quantity} {item.product_unit || "ta"}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      size="small"
                      label="Bo'lim"
                      value={taskForm.department_id}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          department_id: event.target.value,
                        }))
                      }
                    >
                      {departments.map((department) => (
                        <MenuItem key={department.id} value={department.id}>
                          {department.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      size="small"
                      label="Xodim"
                      value={taskForm.assigned_to}
                      onChange={(event) =>
                        setTaskForm((current) => ({ ...current, assigned_to: event.target.value }))
                      }
                    >
                      {workers.map((worker) => (
                        <MenuItem key={worker.id} value={worker.id}>
                          {`${worker.first_name || ""} ${worker.last_name || ""}`.trim() ||
                            worker.username}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      type="number"
                      label="Miqdor"
                      value={taskForm.planned_quantity}
                      onChange={(event) =>
                        setTaskForm((current) => ({
                          ...current,
                          planned_quantity: event.target.value,
                        }))
                      }
                      inputProps={{ min: 0.01 }}
                    />
                  </Box>
                  <Box
                    sx={{
                      mt: 1.2,
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr auto" },
                      gap: 1.2,
                    }}
                  >
                    <TextField
                      size="small"
                      type="date"
                      label="Muddat"
                      value={taskForm.due_date}
                      onChange={(event) =>
                        setTaskForm((current) => ({ ...current, due_date: event.target.value }))
                      }
                    />
                    <TextField
                      size="small"
                      label="Xodim uchun izoh"
                      value={taskForm.note}
                      onChange={(event) =>
                        setTaskForm((current) => ({ ...current, note: event.target.value }))
                      }
                    />
                    <Button
                      variant="contained"
                      onClick={saveTask}
                      disabled={taskSaving}
                      sx={{ textTransform: "none", fontWeight: 850 }}
                    >
                      {taskSaving ? <CircularProgress size={19} color="inherit" /> : "Biriktirish"}
                    </Button>
                  </Box>
                </Paper>
              )}

            <Typography sx={{ fontWeight: 900 }}>Avtomatik ishlab chiqarish marshruti</Typography>
            {tasks.length === 0 ? (
              <Typography sx={{ py: 3, textAlign: "center", color: "var(--aa-text-secondary)" }}>
                Zakaz «Tasdiqlandi» holatiga o‘tganda marshrut avtomatik yaratiladi
              </Typography>
            ) : (
              tasks.map((task) => {
                const percent = Math.round(
                  (Number(task.completed_quantity || 0) * 100) / Number(task.planned_quantity || 1),
                );
                return (
                  <Paper key={task.id} variant="outlined" sx={{ p: 1.7, borderRadius: 2.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 850 }}>
                          {task.product_name} · {task.department_name}
                        </Typography>
                        <Typography
                          sx={{ mt: 0.3, fontSize: 12.5, color: "var(--aa-text-secondary)" }}
                        >
                          {task.worker_name || "Bo'lim navbatida"} · {task.completed_quantity}/
                          {task.planned_quantity} {task.product_unit || "ta"}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={
                            task.status === "completed"
                              ? "Tugallandi"
                              : task.status === "in_progress"
                                ? "Jarayonda"
                                : "Kutilmoqda"
                          }
                        />
                        {false && (
                          <IconButton
                            size="small"
                            disabled={task.status === "completed"}
                            onClick={() => removeTask(task)}
                            sx={{ color: "#dc2626" }}
                          >
                            ×
                          </IconButton>
                        )}
                      </Stack>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      sx={{ mt: 1.2, height: 6, borderRadius: 6 }}
                    />
                  </Paper>
                );
              })
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTasksOpen(false)} sx={{ textTransform: "none" }}>
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={conversionOpen}
        onClose={() => !converting && setConversionOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Zakazni savdoga o'tkazish</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc" }}>
              <Typography sx={{ fontWeight: 900 }}>
                {conversionOrder?.order_number} · {conversionOrder?.client_name}
              </Typography>
              <Typography sx={{ mt: 0.4, color: "var(--aa-text-secondary)", fontSize: 13 }}>
                {(conversionOrder?.items || []).length} ta pozitsiya ·{" "}
                {money(conversionOrder?.total_amount)}
              </Typography>
            </Paper>

            <TextField
              select
              required
              label="Mahsulot chiqadigan ombor"
              value={conversionForm.warehouse_id}
              onChange={(event) =>
                setConversionForm((current) => ({ ...current, warehouse_id: event.target.value }))
              }
              helperText="Qoldiq shu ombordan avtomatik kamayadi"
            >
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                  {warehouse.is_default ? " (asosiy)" : ""}
                </MenuItem>
              ))}
            </TextField>

            <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
              {(conversionOrder?.items || []).map((item) => {
                const available = Number(
                  conversionStockByProduct.get(Number(item.product_id)) || 0,
                );
                const enough = available >= Number(item.quantity);
                return (
                  <Box
                    key={item.id}
                    sx={{
                      px: 2,
                      py: 1.3,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      borderBottom: "1px solid var(--aa-border)",
                      "&:last-child": { borderBottom: 0 },
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
                        {item.product_name}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: "var(--aa-text-muted)" }}>
                        Kerak: {item.quantity} {item.product_unit || "ta"}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        color: enough ? "#15803d" : "#dc2626",
                        fontSize: 12.5,
                        fontWeight: 850,
                      }}
                    >
                      {stockLoading ? "Tekshirilmoqda..." : <>Omborda: {available}</>}
                    </Typography>
                  </Box>
                );
              })}
            </Paper>

            {insufficientItems.length > 0 && !stockLoading && (
              <Typography
                sx={{
                  p: 1.4,
                  borderRadius: 2,
                  color: "#b91c1c",
                  bgcolor: "#fef2f2",
                  fontSize: 12.5,
                  fontWeight: 750,
                }}
              >
                Tanlangan omborda mahsulot yetarli emas.
              </Typography>
            )}
            <TextField
              type="date"
              label="Savdo sanasi"
              InputLabelProps={{ shrink: true }}
              value={conversionForm.sold_at}
              onChange={(event) =>
                setConversionForm((current) => ({ ...current, sold_at: event.target.value }))
              }
            />
            <TextField
              type="number"
              label="Boshlang'ich to'lov"
              value={conversionForm.paid_amount}
              onChange={(event) =>
                setConversionForm((current) => ({ ...current, paid_amount: event.target.value }))
              }
              error={conversionPaidTooMuch}
              helperText={
                conversionPaidTooMuch ? (
                  "To'lov zakaz summasidan oshmasin"
                ) : (
                  <>
                    Qarz:{" "}
                    {money(
                      Math.max(
                        0,
                        Number(conversionOrder?.total_amount || 0) -
                          Number(conversionForm.paid_amount || 0),
                      ),
                    )}
                  </>
                )
              }
              inputProps={{ min: 0 }}
            />
            <TextField
              select
              label="Pul tushadigan hisob"
              value={conversionForm.account_id}
              onChange={(event) =>
                setConversionForm((current) => ({ ...current, account_id: event.target.value }))
              }
              helperText="Tanlanmasa Asosiy kassa ishlatiladi"
            >
              <MenuItem value="">Asosiy kassa (avtomatik)</MenuItem>
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name} · {money(account.balance)}
                </MenuItem>
              ))}
            </TextField>
            <Typography
              sx={{ p: 1.4, borderRadius: 2, color: "#92400e", bgcolor: "#fffbeb", fontSize: 12.5 }}
            >
              Tasdiqlangach zakaz savdoga yoziladi, ombor qoldig‘i kamayadi va mijoz qarzi
              hisoblanadi. Bu amal takrorlanmaydi.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConversionOpen(false)}
            disabled={converting}
            sx={{ textTransform: "none" }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={convertToSale}
            disabled={
              converting ||
              stockLoading ||
              !conversionForm.warehouse_id ||
              insufficientItems.length > 0 ||
              conversionPaidTooMuch
            }
            sx={{ bgcolor: "#15803d", textTransform: "none", fontWeight: 850 }}
          >
            {converting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Tasdiqlash va savdoga o'tkazish"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default Orders;
