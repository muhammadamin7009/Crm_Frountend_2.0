import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../../Context/AuthContext";
import {
  archiveWarehouse,
  createInventoryCount,
  createInventoryMovement,
  createInventoryTransfer,
  createProductionReceipt,
  createWarehouse,
  getInventoryCount,
  getInventoryCounts,
  getInventoryItems,
  getInventoryMovements,
  getInventoryStock,
  getWarehouses,
  updateInventoryThreshold,
  updateWarehouse,
} from "../../api/inventory";
import { hasPermission } from "../../utils/permissions";

const emptyMovement = {
  warehouse_id: "",
  item_type: "raw_material",
  item_id: "",
  movement_type: "in",
  quantity: "",
  unit_cost: "",
  note: "",
};

const emptyTransfer = {
  from_warehouse_id: "",
  to_warehouse_id: "",
  item_type: "raw_material",
  item_id: "",
  quantity: "",
  note: "",
};

const emptyReceipt = {
  warehouse_id: "",
  product_id: "",
  quantity: "",
  unit_cost: "",
  occurred_at: new Date().toISOString().slice(0, 10),
  note: "",
};

const emptyWarehouse = {
  name: "",
  code: "",
  location: "",
  warehouse_type: "mixed",
};

const movementLabels = {
  opening: "Boshlang‘ich qoldiq",
  in: "Kirim",
  out: "Chiqim",
  adjustment: "Tuzatish",
  transfer_in: "Ko‘chirish kirimi",
  transfer_out: "Ko‘chirish chiqimi",
};

const itemTypeLabel = (type) => (type === "product" ? "Mahsulot" : "Homashyo");

const warehouseTypeLabel = (type) =>
  type === "product" ? "Tayyor mahsulot" : type === "raw_material" ? "Homashyo" : "Aralash";

const quantity = (value) =>
  Number(value || 0).toLocaleString("uz-UZ", {
    maximumFractionDigits: 3,
  });

const safeDateTime = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("uz-UZ");
};

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const surfaceCardSx = {
  overflow: "hidden",
  borderRadius: "22px",
  border: "1px solid #e4e9ef",
  background: "#ffffff",
  boxShadow: "0 14px 40px rgba(15,23,42,.045)",
};

const tableSx = {
  "& th": {
    py: 1.55,
    color: "#94a3b8",
    fontSize: 9.5,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: ".045em",
    background: "#fafbfc",
    borderBottom: "1px solid #edf0f3",
  },

  "& td": {
    py: 1.4,
    color: "#64748b",
    fontSize: 10.5,
    borderBottom: "1px solid #edf0f3",
  },

  "& tbody tr:hover": {
    background: "rgba(153,27,27,.025)",
  },
};

const dialogPaperSx = {
  overflow: "hidden",
  borderRadius: "23px",

  border: "1px solid rgba(148,163,184,.20)",

  boxShadow: "0 30px 80px rgba(15,23,42,.22)",
};

const dialogTitleSx = {
  px: 3,
  py: 2.35,

  color: "#ffffff !important",

  fontSize: 18,
  fontWeight: 950,

  backgroundColor: "#0d1117 !important",

  backgroundImage:
    "radial-gradient(circle at 100% 0%,rgba(220,38,38,.28),transparent 36%),linear-gradient(135deg,#11151c,#321319) !important",
};

const dialogContentSx = {
  px: 3,
  py: "24px !important",
};

const dialogActionsSx = {
  px: 3,
  py: 2.1,

  borderTop: "1px solid #edf0f3",

  background: "#fafbfc",
};

const primaryButtonSx = {
  minHeight: 40,
  px: 2,
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
};

const secondaryButtonSx = {
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

const tableActionSx = {
  minHeight: 30,
  borderRadius: "9px",
  fontSize: 9.5,
  fontWeight: 900,
  textTransform: "none",
};

const heroPrimaryButtonSx = {
  minHeight: 43,
  px: 2.2,

  color: "#ffffff !important",

  borderRadius: "13px",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "none",

  background: "linear-gradient(135deg,#991b1b,#dc2626)",

  boxShadow: "0 12px 26px rgba(127,29,29,.30)",

  "&:hover": {
    background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
  },
};

const heroSecondaryButtonSx = {
  minHeight: 43,
  px: 1.9,

  color: "rgba(255,255,255,.72) !important",

  borderRadius: "13px",

  border: "1px solid rgba(255,255,255,.10)",

  backgroundColor: "rgba(255,255,255,.055)",

  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",

  "&:hover": {
    backgroundColor: "rgba(255,255,255,.10)",
  },
};

const MetricCard = ({ label, value, hint, tone = "red" }) => {
  const tones = {
    red: ["#991b1b", "rgba(153,27,27,.07)", "rgba(153,27,27,.16)"],

    green: ["#15803d", "rgba(34,197,94,.07)", "rgba(34,197,94,.17)"],

    blue: ["#1d4ed8", "rgba(37,99,235,.07)", "rgba(37,99,235,.17)"],

    amber: ["#b45309", "rgba(245,158,11,.09)", "rgba(245,158,11,.19)"],
  };

  const current = tones[tone] || tones.red;

  return (
    <Card
      elevation={0}
      sx={{
        ...surfaceCardSx,
        minHeight: 126,
        p: 1.8,
        backgroundColor: current[1],
        borderColor: current[2],
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,

          display: "grid",
          placeItems: "center",

          color: current[0],
          borderRadius: "11px",

          backgroundColor: "rgba(255,255,255,.68)",

          border: `1px solid ${current[2]}`,

          fontSize: 12,
          fontWeight: 950,
        }}
      >
        {label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.2,
          color: "#94a3b8",
          fontSize: 9.5,
          fontWeight: 800,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.5,
          color: current[0],
          fontSize: 19,
          fontWeight: 950,
          letterSpacing: "-.035em",
        }}
      >
        {value}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.45,
          color: "#94a3b8",
          fontSize: 9,
        }}
      >
        {hint}
      </Typography>
    </Card>
  );
};

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

          fontSize: 17,
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

const Inventory = () => {
  const auth = useAuth();
  const user = auth?.user;

  const navigate = useNavigate();
  const location = useLocation();

  const { warehouseId } = useParams();

  const isCountsPage = location.pathname === "/inventory/counts";

  const isManagementPage = location.pathname === "/inventory/warehouses";

  const canManageAll = hasPermission(user, "inventory.manage");

  const canManageMovements = canManageAll || hasPermission(user, "inventory.movements");

  const canManageWarehouses = canManageAll || hasPermission(user, "inventory.warehouses");

  const canCount = canManageAll || hasPermission(user, "inventory.count");

  const canReceive = canManageMovements || hasPermission(user, "production.manage");

  const [tab, setTab] = useState(0);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [warehouseFilter, setWarehouseFilter] = useState("");

  const [warehouses, setWarehouses] = useState([]);

  const [stock, setStock] = useState([]);

  const [movements, setMovements] = useState([]);

  const [items, setItems] = useState([]);

  const [counts, setCounts] = useState([]);

  const [movementOpen, setMovementOpen] = useState(false);

  const [receiptOpen, setReceiptOpen] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);

  const [warehouseOpen, setWarehouseOpen] = useState(false);

  const [warehouseDeleteOpen, setWarehouseDeleteOpen] = useState(false);

  const [warehousePendingDelete, setWarehousePendingDelete] = useState(null);

  const [thresholdOpen, setThresholdOpen] = useState(false);

  const [movementForm, setMovementForm] = useState(emptyMovement);

  const [receiptForm, setReceiptForm] = useState(emptyReceipt);

  const [transferForm, setTransferForm] = useState(emptyTransfer);

  const [warehouseForm, setWarehouseForm] = useState(emptyWarehouse);

  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const [thresholdRow, setThresholdRow] = useState(null);

  const [thresholdValue, setThresholdValue] = useState("");

  const [countOpen, setCountOpen] = useState(false);

  const [countDetailOpen, setCountDetailOpen] = useState(false);

  const [countWarehouse, setCountWarehouse] = useState(null);

  const [countRows, setCountRows] = useState([]);

  const [countedAt, setCountedAt] = useState(new Date().toISOString().slice(0, 10));

  const [countNote, setCountNote] = useState("");

  const [countDetail, setCountDetail] = useState(null);

  const [countWarehouseChoice, setCountWarehouseChoice] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (!quiet) {
      setLoading(true);
    }

    try {
      const [warehouseRes, stockRes, movementRes, itemRes, countRes] = await Promise.all([
        getWarehouses(),

        getInventoryStock({
          limit: 200,
        }),

        getInventoryMovements({
          limit: 150,
        }),

        getInventoryItems({
          limit: 300,
        }),

        getInventoryCounts({
          limit: 100,
        }),
      ]);

      const warehouseData = warehouseRes?.data || warehouseRes || {};

      const stockData = stockRes?.data || stockRes || {};

      const movementData = movementRes?.data || movementRes || {};

      const itemData = itemRes?.data || itemRes || {};

      const countData = countRes?.data || countRes || {};

      setWarehouses(warehouseData.warehouses || []);

      setStock(stockData.stock || []);

      setMovements(movementData.inventory_movements || movementData.movements || []);

      setItems(itemData.items || []);

      setCounts(countData.inventory_counts || []);
    } catch (error) {
      toast.error(errorMessage(error, "Ombor ma’lumotlarini olishda xato."));
    } finally {
      if (!quiet) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.is_active !== false),

    [warehouses],
  );

  const selectedWarehouse = useMemo(
    () =>
      activeWarehouses.find((warehouse) => Number(warehouse.id) === Number(warehouseId)) || null,

    [activeWarehouses, warehouseId],
  );

  useEffect(() => {
    if (warehouseId) {
      setWarehouseFilter(String(warehouseId));
    }
  }, [warehouseId]);

  useEffect(() => {
    if (!loading && location.pathname === "/inventory") {
      const target = canManageWarehouses
        ? "/inventory/warehouses"
        : activeWarehouses[0]
          ? `/inventory/warehouses/${activeWarehouses[0].id}`
          : "/inventory/counts";

      navigate(target, {
        replace: true,
      });
    }
  }, [activeWarehouses, canManageWarehouses, loading, location.pathname, navigate]);

  useEffect(() => {
    if (!loading && warehouseId && !selectedWarehouse) {
      navigate("/inventory", {
        replace: true,
      });
    }
  }, [loading, navigate, selectedWarehouse, warehouseId]);

  const filterText = search.trim().toLocaleLowerCase("uz-UZ");

  const filteredStock = useMemo(
    () =>
      stock.filter(
        (row) =>
          (!warehouseFilter || Number(row.warehouse_id) === Number(warehouseFilter)) &&
          (!filterText ||
            `${row.item_name || ""} ${row.warehouse_name || ""} ${itemTypeLabel(row.item_type)}`
              .toLocaleLowerCase("uz-UZ")
              .includes(filterText)),
      ),

    [filterText, stock, warehouseFilter],
  );

  const filteredMovements = useMemo(
    () =>
      movements.filter(
        (row) =>
          (!warehouseFilter || Number(row.warehouse_id) === Number(warehouseFilter)) &&
          (!filterText ||
            `${row.item_name || ""} ${row.warehouse_name || ""} ${row.note || ""}`
              .toLocaleLowerCase("uz-UZ")
              .includes(filterText)),
      ),

    [filterText, movements, warehouseFilter],
  );

  const pageMetrics = useMemo(() => {
    if (isManagementPage) {
      return [
        ["Faol omborlar", activeWarehouses.length, "Hozir ishlayotgan omborlar", "blue"],

        ["Qoldiq qatorlari", stock.length, "Barcha omborlardagi pozitsiyalar", "green"],

        ["Kam qolgan", stock.filter((row) => row.is_low).length, "Minimal qoldiqqa yetgan", "red"],

        ["Harakatlar", movements.length, "Kirim, chiqim va ko‘chirish", "amber"],
      ];
    }

    if (isCountsPage) {
      return [
        ["Inventarizatsiyalar", counts.length, "O‘tkazilgan sanovlar", "blue"],

        ["Faol omborlar", activeWarehouses.length, "Sanash mumkin bo‘lgan omborlar", "green"],

        [
          "Farqli qatorlar",

          counts.reduce(
            (sum, item) => sum + Number(item.variance_lines || 0),

            0,
          ),

          "Tarixdagi aniqlangan farqlar",
          "red",
        ],

        ["Qoldiq qatorlari", stock.length, "Tizimdagi jami pozitsiyalar", "amber"],
      ];
    }

    return [
      [
        "Ombor turi",

        warehouseTypeLabel(selectedWarehouse?.warehouse_type),

        selectedWarehouse?.code || "Kod yo‘q",

        "blue",
      ],

      ["Qoldiq qatorlari", filteredStock.length, "Tanlangan ombordagi pozitsiyalar", "green"],

      [
        "Kam qolgan",

        filteredStock.filter((row) => row.is_low).length,

        "Minimal qoldiqqa yetgan",
        "red",
      ],

      ["Harakatlar", filteredMovements.length, "Kirim, chiqim va tuzatishlar", "amber"],
    ];
  }, [
    activeWarehouses.length,
    counts,
    filteredMovements.length,
    filteredStock,
    isCountsPage,
    isManagementPage,
    movements.length,
    selectedWarehouse,
    stock,
  ]);

  const selectableItems = (type) => items.filter((item) => item.item_type === type);

  const compatibleWarehouses = (type) =>
    activeWarehouses.filter(
      (warehouse) =>
        !warehouse.warehouse_type ||
        warehouse.warehouse_type === "mixed" ||
        warehouse.warehouse_type === type,
    );

  const closeDialogs = () => {
    setMovementOpen(false);
    setReceiptOpen(false);
    setTransferOpen(false);
    setWarehouseOpen(false);
    setWarehouseDeleteOpen(false);

    setWarehousePendingDelete(null);

    setThresholdOpen(false);
    setEditingWarehouse(null);

    setMovementForm(emptyMovement);
    setReceiptForm(emptyReceipt);
    setTransferForm(emptyTransfer);
    setWarehouseForm(emptyWarehouse);

    setThresholdRow(null);
    setThresholdValue("");

    setCountOpen(false);
    setCountDetailOpen(false);
    setCountWarehouse(null);
    setCountRows([]);

    setCountedAt(new Date().toISOString().slice(0, 10));

    setCountNote("");
    setCountDetail(null);
  };

  const openInventoryCount = (warehouse) => {
    const rows = stock.filter((row) => Number(row.warehouse_id) === Number(warehouse.id));

    if (!rows.length) {
      toast.error("Bu omborda sanash uchun qoldiq pozitsiyalari yo‘q.");

      return;
    }

    setCountWarehouse(warehouse);

    setCountRows(
      rows.map((row) => ({
        ...row,

        counted_quantity: String(Number(row.quantity || 0)),
      })),
    );

    setCountedAt(new Date().toISOString().slice(0, 10));

    setCountNote("");
    setCountOpen(true);
  };

  const saveInventoryCount = async () => {
    if (
      !countWarehouse ||
      countRows.some((row) => row.counted_quantity === "" || Number(row.counted_quantity) < 0)
    ) {
      toast.error("Barcha haqiqiy miqdorlarni to‘g‘ri kiriting.");

      return;
    }

    setSaving(true);

    try {
      await createInventoryCount({
        warehouse_id: Number(countWarehouse.id),

        counted_at: countedAt,

        note: countNote.trim() || null,

        idempotency_key: crypto.randomUUID(),

        items: countRows.map((row) => ({
          item_type: row.item_type,

          item_id: Number(row.item_id),

          counted_quantity: Number(row.counted_quantity),
        })),
      });

      toast.success("Inventarizatsiya yakunlandi va qoldiq yangilandi.");

      closeDialogs();

      await load(true);
    } catch (error) {
      toast.error(errorMessage(error, "Inventarizatsiyani saqlashda xato."));
    } finally {
      setSaving(false);
    }
  };

  const openCountDetail = async (id) => {
    try {
      const response = await getInventoryCount(id);

      const data = response?.data || response || {};

      setCountDetail(data.inventory_count || null);

      setCountDetailOpen(true);
    } catch (error) {
      toast.error(errorMessage(error, "Inventarizatsiya tafsilotlarini olishda xato."));
    }
  };

  const saveMovement = async () => {
    if (!movementForm.warehouse_id || !movementForm.item_id || !movementForm.quantity) {
      toast.error("Ombor, element va miqdorni kiriting.");

      return;
    }

    setSaving(true);

    try {
      await createInventoryMovement({
        ...movementForm,

        warehouse_id: Number(movementForm.warehouse_id),

        item_id: Number(movementForm.item_id),

        quantity: Number(movementForm.quantity),

        unit_cost: movementForm.unit_cost === "" ? null : Number(movementForm.unit_cost),

        note: movementForm.note.trim() || null,

        idempotency_key: crypto.randomUUID(),
      });

      toast.success("Ombor harakati saqlandi.");

      closeDialogs();

      await load(true);
    } catch (error) {
      toast.error(errorMessage(error, "Ombor harakatini saqlashda xato."));
    } finally {
      setSaving(false);
    }
  };

  const saveProductionReceipt = async () => {
    if (!receiptForm.warehouse_id || !receiptForm.product_id || Number(receiptForm.quantity) <= 0) {
      toast.error("Ombor, tayyor mahsulot va miqdorni kiriting.");

      return;
    }

    setSaving(true);

    try {
      await createProductionReceipt({
        warehouse_id: Number(receiptForm.warehouse_id),

        product_id: Number(receiptForm.product_id),

        quantity: Number(receiptForm.quantity),

        unit_cost: receiptForm.unit_cost === "" ? null : Number(receiptForm.unit_cost),

        occurred_at: receiptForm.occurred_at || undefined,

        note: receiptForm.note.trim() || null,

        idempotency_key: crypto.randomUUID(),
      });

      toast.success("Tayyor mahsulot omborga qabul qilindi.");

      closeDialogs();

      await load(true);
    } catch (error) {
      toast.error(errorMessage(error, "Tayyor mahsulotni omborga qabul qilishda xato."));
    } finally {
      setSaving(false);
    }
  };

  const saveTransfer = async () => {
    if (
      !transferForm.from_warehouse_id ||
      !transferForm.to_warehouse_id ||
      !transferForm.item_id ||
      !transferForm.quantity
    ) {
      toast.error("Barcha majburiy maydonlarni kiriting.");

      return;
    }

    if (Number(transferForm.from_warehouse_id) === Number(transferForm.to_warehouse_id)) {
      toast.error("Manba va qabul qiluvchi ombor bir xil bo‘lmasin.");

      return;
    }

    setSaving(true);

    try {
      await createInventoryTransfer({
        ...transferForm,

        from_warehouse_id: Number(transferForm.from_warehouse_id),

        to_warehouse_id: Number(transferForm.to_warehouse_id),

        item_id: Number(transferForm.item_id),

        quantity: Number(transferForm.quantity),

        note: transferForm.note.trim() || null,

        idempotency_key: crypto.randomUUID(),
      });

      toast.success("Qoldiq omborlar orasida ko‘chirildi.");

      closeDialogs();

      await load(true);
    } catch (error) {
      toast.error(errorMessage(error, "Ko‘chirishda xato."));
    } finally {
      setSaving(false);
    }
  };

  const saveWarehouse = async () => {
    if (!warehouseForm.name.trim() || !warehouseForm.code.trim()) {
      toast.error("Ombor nomi va kodini kiriting.");

      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...warehouseForm,

        name: warehouseForm.name.trim(),

        code: warehouseForm.code.trim().toUpperCase(),

        location: warehouseForm.location.trim() || null,
      };

      let savedWarehouse = editingWarehouse;

      if (editingWarehouse) {
        const response = await updateWarehouse(editingWarehouse.id, payload);

        const data = response?.data || response || {};

        savedWarehouse = data.warehouse || editingWarehouse;
      } else {
        const response = await createWarehouse(payload);

        const data = response?.data || response || {};

        savedWarehouse = data.warehouse || null;
      }

      toast.success(editingWarehouse ? "Ombor yangilandi." : "Ombor qo‘shildi.");

      closeDialogs();

      await load(true);

      window.dispatchEvent(new Event("warehouses-updated"));

      if (savedWarehouse?.id && !isManagementPage) {
        navigate(`/inventory/warehouses/${savedWarehouse.id}`);
      }
    } catch (error) {
      toast.error(errorMessage(error, "Omborni saqlashda xato."));
    } finally {
      setSaving(false);
    }
  };

  const requestWarehouseDelete = (warehouse) => {
    setWarehousePendingDelete(warehouse);

    setWarehouseDeleteOpen(true);
  };

  const removeWarehouse = async () => {
    if (!warehousePendingDelete) {
      return;
    }

    const warehouse = warehousePendingDelete;

    setSaving(true);

    try {
      await archiveWarehouse(warehouse.id);

      toast.success("Ombor o‘chirildi.");

      closeDialogs();

      await load(true);

      window.dispatchEvent(new Event("warehouses-updated"));

      if (Number(warehouseId) === Number(warehouse.id)) {
        navigate("/inventory", {
          replace: true,
        });
      }
    } catch (error) {
      toast.error(errorMessage(error, "Omborni o‘chirishda xato."));
    } finally {
      setSaving(false);
    }
  };

  const saveThreshold = async () => {
    if (!thresholdRow || thresholdValue === "" || Number(thresholdValue) < 0) {
      toast.error("Minimal qoldiqni to‘g‘ri kiriting.");

      return;
    }

    setSaving(true);

    try {
      await updateInventoryThreshold(thresholdRow.id, Number(thresholdValue));

      toast.success("Minimal qoldiq yangilandi.");

      closeDialogs();

      await load(true);
    } catch (error) {
      toast.error(errorMessage(error, "Minimal qoldiqni saqlashda xato."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 430,

          display: "flex",
          flexDirection: "column",

          alignItems: "center",
          justifyContent: "center",

          gap: 1.6,
        }}
      >
        <Box
          sx={{
            width: 70,
            height: 70,

            display: "grid",
            placeItems: "center",

            borderRadius: "22px",

            border: "1px solid rgba(153,27,27,.11)",

            backgroundColor: "rgba(153,27,27,.055)",
          }}
        >
          <CircularProgress
            size={32}
            sx={{
              color: "#991b1b",
            }}
          />
        </Box>

        <Typography
          sx={{
            color: "#94a3b8",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          Ombor ma’lumotlari yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  const pageTitle = isCountsPage
    ? "Inventarizatsiya"
    : isManagementPage
      ? "Omborlar boshqaruvi"
      : selectedWarehouse?.name || "Ombor";

  const pageDescription = isCountsPage
    ? "Omborlarni sanash, farqlarni aniqlash va oldingi inventarizatsiyalar tarixini nazorat qiling."
    : isManagementPage
      ? "Omborlarni yarating, tahrirlang, arxivlang va qoldiq oqimlarini yagona markazdan boshqaring."
      : `${warehouseTypeLabel(
          selectedWarehouse?.warehouse_type,
        )} qoldig‘i, minimal miqdor va kirim-chiqim harakatlarini boshqaring.`;

  return (
    <Box
      className="crm-page inventory-page"
      sx={{
        pb: 2.5,

        display: "grid",
        gap: 2,
      }}
    >
      <style>{inventoryPageStyles}</style>

      <Box
        component="section"
        className="inventory-hero"
        sx={{
          position: "relative",
          isolation: "isolate",

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
                Al Amin CRM • ombor nazorati
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
              {pageTitle}
            </Typography>

            <Typography
              sx={{
                maxWidth: 570,
                mt: 1.4,

                color: "rgba(255,255,255,.45) !important",

                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              {pageDescription}
            </Typography>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
              useFlexGap
              sx={{
                mt: 2.35,
                flexWrap: "wrap",
              }}
            >
              {isManagementPage && canManageWarehouses && (
                <Button
                  onClick={() => {
                    setEditingWarehouse(null);

                    setWarehouseForm(emptyWarehouse);

                    setWarehouseOpen(true);
                  }}
                  sx={heroPrimaryButtonSx}
                >
                  + Yangi ombor
                </Button>
              )}

              {isManagementPage && canManageMovements && (
                <Button
                  disabled={activeWarehouses.length < 2}
                  onClick={() => setTransferOpen(true)}
                  sx={heroSecondaryButtonSx}
                >
                  Ombordan omborga o‘tkazish
                </Button>
              )}

              {!isCountsPage && !isManagementPage && canManageMovements && (
                <Button
                  onClick={() => {
                    setMovementForm({
                      ...emptyMovement,

                      warehouse_id: selectedWarehouse?.id || "",

                      item_type:
                        selectedWarehouse?.warehouse_type === "product"
                          ? "product"
                          : "raw_material",
                    });

                    setMovementOpen(true);
                  }}
                  sx={heroPrimaryButtonSx}
                >
                  + Kirim / chiqim
                </Button>
              )}

              {!isCountsPage &&
                !isManagementPage &&
                selectedWarehouse?.warehouse_type === "product" &&
                canReceive && (
                  <Button
                    onClick={() => {
                      setReceiptForm({
                        ...emptyReceipt,

                        warehouse_id: selectedWarehouse.id,
                      });

                      setReceiptOpen(true);
                    }}
                    sx={heroSecondaryButtonSx}
                  >
                    Mahsulot qabul qilish
                  </Button>
                )}

              {isCountsPage && canCount && (
                <Button
                  disabled={!countWarehouseChoice}
                  onClick={() => {
                    const warehouse = activeWarehouses.find(
                      (item) => Number(item.id) === Number(countWarehouseChoice),
                    );

                    if (warehouse) {
                      openInventoryCount(warehouse);
                    }
                  }}
                  sx={heroPrimaryButtonSx}
                >
                  Inventarizatsiya boshlash
                </Button>
              )}
            </Stack>
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
            {pageMetrics.map(([label, value, helper, tone]) => (
              <HeroMetric
                key={label}
                label={label}
                value={typeof value === "number" ? quantity(value) : value}
                helper={helper}
                tone={tone}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {isManagementPage && (
        <Card
          elevation={0}
          sx={{
            ...surfaceCardSx,
            p: 2.2,
          }}
        >
          <Box
            sx={{
              mb: 1.8,

              display: "flex",

              alignItems: {
                xs: "flex-start",
                sm: "center",
              },

              justifyContent: "space-between",

              gap: 1,
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
                Omborlar ro‘yxati
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  color: "#94a3b8",
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              >
                Ombor yaratish, tahrirlash, ochish yoki arxivlash uchun boshqaruv oynasi.
              </Typography>
            </Box>

            <Chip
              size="small"
              label={`${quantity(warehouses.length)} ta`}
              sx={{
                height: 25,
                color: "#991b1b",
                fontSize: 9.5,
                fontWeight: 900,

                backgroundColor: "rgba(153,27,27,.07)",
              }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2,minmax(0,1fr))",

                xl: "repeat(3,minmax(0,1fr))",
              },

              gap: 1.4,
            }}
          >
            {warehouses.map((warehouse) => (
              <Card
                key={warehouse.id}
                variant="outlined"
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  p: 2,
                  borderRadius: "18px",

                  borderColor: "#e4e9ef",

                  background: "linear-gradient(145deg,#ffffff,#f8fafc)",

                  boxShadow: "0 10px 28px rgba(15,23,42,.045)",

                  opacity: warehouse.is_active ? 1 : 0.62,

                  transition: "transform .2s ease, box-shadow .2s ease",

                  "&:hover": {
                    transform: "translateY(-2px)",

                    boxShadow: "0 18px 42px rgba(15,23,42,.08)",
                  },

                  "&::after": {
                    content: '""',

                    position: "absolute",

                    width: 130,
                    height: 130,

                    top: -75,
                    right: -65,

                    borderRadius: "50%",

                    backgroundColor: "rgba(153,27,27,.045)",

                    pointerEvents: "none",
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box
                    sx={{
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      noWrap
                      sx={{
                        color: "#334155",

                        fontSize: 13,

                        fontWeight: 950,
                      }}
                    >
                      {warehouse.name}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.4,

                        color: "#94a3b8",

                        fontSize: 9.5,

                        fontWeight: 750,
                      }}
                    >
                      {warehouse.code} • {warehouseTypeLabel(warehouse.warehouse_type)}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={warehouse.is_active ? "Faol" : "Arxiv"}
                    sx={{
                      height: 25,

                      color: warehouse.is_active ? "#15803d" : "#64748b",

                      fontSize: 9.5,
                      fontWeight: 900,

                      backgroundColor: warehouse.is_active ? "rgba(34,197,94,.09)" : "#f1f5f9",

                      border: warehouse.is_active
                        ? "1px solid rgba(34,197,94,.18)"
                        : "1px solid #e2e8f0",
                    }}
                  />
                </Stack>

                <Typography
                  sx={{
                    mt: 1.5,

                    color: "#991b1b",

                    fontSize: 25,
                    fontWeight: 950,
                    letterSpacing: "-.04em",
                  }}
                >
                  {quantity(warehouse.stock_lines || 0)}
                </Typography>

                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 9.5,
                    fontWeight: 700,
                  }}
                >
                  qoldiq pozitsiyasi
                </Typography>

                {warehouse.location && (
                  <Typography
                    sx={{
                      mt: 1,

                      color: "#64748b",
                      fontSize: 9.5,
                      lineHeight: 1.5,
                    }}
                  >
                    {warehouse.location}
                  </Typography>
                )}

                <Stack
                  direction="row"
                  spacing={0.7}
                  useFlexGap
                  sx={{
                    mt: 1.5,
                    flexWrap: "wrap",
                  }}
                >
                  {warehouse.is_active && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/inventory/warehouses/${warehouse.id}`)}
                      sx={tableActionSx}
                    >
                      Omborni ochish
                    </Button>
                  )}

                  {canManageWarehouses && warehouse.is_active && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setEditingWarehouse(warehouse);

                          setWarehouseForm({
                            name: warehouse.name,

                            code: warehouse.code,

                            location: warehouse.location || "",

                            warehouse_type: warehouse.warehouse_type || "mixed",
                          });

                          setWarehouseOpen(true);
                        }}
                        sx={tableActionSx}
                      >
                        Tahrirlash
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => requestWarehouseDelete(warehouse)}
                        sx={tableActionSx}
                      >
                        O‘chirish
                      </Button>
                    </>
                  )}
                </Stack>
              </Card>
            ))}

            {!warehouses.length && (
              <Box
                sx={{
                  gridColumn: "1 / -1",
                  minHeight: 180,

                  display: "grid",
                  placeItems: "center",

                  borderRadius: "18px",

                  border: "1px dashed #cbd5e1",

                  backgroundColor: "#f8fafc",
                }}
              >
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 10.5,
                    fontWeight: 800,
                  }}
                >
                  Hozircha ombor yaratilmagan.
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      )}

      {!isCountsPage && !isManagementPage && selectedWarehouse && (
        <>
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                xl: "repeat(4,1fr)",
              },

              gap: 1.5,
            }}
          >
            <MetricCard
              label="Saqlash turi"
              value={
                selectedWarehouse.warehouse_type === "mixed"
                  ? "Aralash"
                  : itemTypeLabel(selectedWarehouse.warehouse_type)
              }
              hint={selectedWarehouse.code}
              tone="red"
            />

            <MetricCard
              label="Qoldiq pozitsiyalari"
              value={quantity(filteredStock.length)}
              hint="Shu ombordagi qatorlar"
              tone="blue"
            />

            <MetricCard
              label="Kam qolgan"
              value={quantity(filteredStock.filter((row) => row.is_low).length)}
              hint="Minimal miqdorga yetgan pozitsiyalar"
              tone={filteredStock.some((row) => row.is_low) ? "red" : "green"}
            />

            <MetricCard
              label="Harakatlar"
              value={quantity(filteredMovements.length)}
              hint="Shu ombordagi operatsiyalar"
              tone="amber"
            />
          </Box>

          <Card
            elevation={0}
            sx={{
              ...surfaceCardSx,
            }}
          >
            <Box
              sx={{
                px: 2,
                pt: 1.2,

                borderBottom: "1px solid #edf0f3",
              }}
            >
              <Tabs value={tab} onChange={(_event, value) => setTab(value)} variant="scrollable">
                <Tab label="Qoldiq" />
                <Tab label="Harakatlar" />
              </Tabs>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr",

                gap: 1.4,
                p: 2,
              }}
            >
              <TextField
                size="small"
                label="Ombordagi elementni qidirish"
                placeholder="Mahsulot yoki homashyo nomi"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </Box>

            {tab === 0 && (
              <Box
                sx={{
                  overflowX: "auto",
                }}
              >
                <Table
                  sx={{
                    minWidth: 900,
                    ...tableSx,
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Element</TableCell>

                      <TableCell>Turi</TableCell>

                      <TableCell>Ombor</TableCell>

                      <TableCell>Qoldiq</TableCell>

                      <TableCell>Minimum</TableCell>

                      <TableCell>Holat</TableCell>

                      {canManageMovements && <TableCell align="right">Amal</TableCell>}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredStock.length ? (
                      filteredStock.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            <Typography
                              sx={{
                                color: "#334155",

                                fontSize: 10.5,

                                fontWeight: 900,
                              }}
                            >
                              {row.item_name || `#${row.item_id}`}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={itemTypeLabel(row.item_type)}
                              sx={{
                                height: 25,

                                color: row.item_type === "product" ? "#1d4ed8" : "#b45309",

                                fontSize: 9.5,

                                fontWeight: 900,

                                backgroundColor:
                                  row.item_type === "product"
                                    ? "rgba(37,99,235,.08)"
                                    : "rgba(245,158,11,.09)",
                              }}
                            />
                          </TableCell>

                          <TableCell>{row.warehouse_name || "-"}</TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                color: row.is_low ? "#b91c1c" : "#15803d",

                                fontSize: 10.5,

                                fontWeight: 950,
                              }}
                            >
                              {quantity(row.quantity)} {row.unit}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {quantity(row.minimum_quantity)} {row.unit}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={row.is_low ? "Kam qolgan" : "Yetarli"}
                              sx={{
                                height: 25,

                                color: row.is_low ? "#b91c1c" : "#15803d",

                                fontSize: 9.5,

                                fontWeight: 900,

                                backgroundColor: row.is_low
                                  ? "rgba(220,38,38,.08)"
                                  : "rgba(34,197,94,.09)",

                                border: row.is_low
                                  ? "1px solid rgba(220,38,38,.18)"
                                  : "1px solid rgba(34,197,94,.18)",
                              }}
                            />
                          </TableCell>

                          {canManageMovements && (
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setThresholdRow(row);

                                  setThresholdValue(String(row.minimum_quantity || 0));

                                  setThresholdOpen(true);
                                }}
                                sx={tableActionSx}
                              >
                                Minimum
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={canManageMovements ? 7 : 6}
                          align="center"
                          sx={{
                            py: 7,
                            color: "#94a3b8",
                            fontWeight: 800,
                          }}
                        >
                          Qoldiq topilmadi. Birinchi kirimni qo‘shing.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

            {tab === 1 && (
              <Box
                sx={{
                  overflowX: "auto",
                }}
              >
                <Table
                  sx={{
                    minWidth: 980,
                    ...tableSx,
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Sana</TableCell>

                      <TableCell>Element</TableCell>

                      <TableCell>Ombor</TableCell>

                      <TableCell>Operatsiya</TableCell>

                      <TableCell>Miqdor</TableCell>

                      <TableCell>Mas’ul</TableCell>

                      <TableCell>Izoh</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredMovements.length ? (
                      filteredMovements.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>{safeDateTime(row.occurred_at)}</TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                color: "#334155",

                                fontSize: 10.5,

                                fontWeight: 900,
                              }}
                            >
                              {row.item_name || `#${row.item_id}`}
                            </Typography>
                          </TableCell>

                          <TableCell>{row.warehouse_name || "-"}</TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              label={movementLabels[row.movement_type] || row.movement_type}
                              sx={{
                                height: 25,

                                color: Number(row.quantity_delta) < 0 ? "#b91c1c" : "#15803d",

                                fontSize: 9.5,

                                fontWeight: 900,

                                backgroundColor:
                                  Number(row.quantity_delta) < 0
                                    ? "rgba(220,38,38,.08)"
                                    : "rgba(34,197,94,.09)",
                              }}
                            />
                          </TableCell>

                          <TableCell>
                            <Typography
                              sx={{
                                color: Number(row.quantity_delta) < 0 ? "#b91c1c" : "#15803d",

                                fontSize: 10.5,

                                fontWeight: 950,
                              }}
                            >
                              {Number(row.quantity_delta) > 0 ? "+" : ""}
                              {quantity(row.quantity_delta)} {row.unit}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {`${row.first_name || ""} ${row.last_name || ""}`.trim() ||
                              row.username ||
                              "-"}
                          </TableCell>

                          <TableCell
                            sx={{
                              maxWidth: 260,

                              color: "#94a3b8",

                              lineHeight: 1.55,
                            }}
                          >
                            {row.note || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          align="center"
                          sx={{
                            py: 7,
                            color: "#94a3b8",
                            fontWeight: 800,
                          }}
                        >
                          Harakatlar topilmadi.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Card>
        </>
      )}

      {isCountsPage && (
        <Card
          elevation={0}
          sx={{
            ...surfaceCardSx,
          }}
        >
          <Box
            sx={{
              p: 2,

              display: "flex",

              flexDirection: {
                xs: "column",
                sm: "row",
              },

              alignItems: {
                xs: "flex-start",
                sm: "center",
              },

              justifyContent: "space-between",

              gap: 1.2,

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
                Inventarizatsiya tarixi
              </Typography>

              <Typography
                sx={{
                  mt: 0.4,
                  color: "#94a3b8",
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              >
                Haqiqiy sanov, tizimdagi qoldiq va aniqlangan farqlar.
              </Typography>
            </Box>

            {canCount && (
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
              >
                <TextField
                  size="small"
                  select
                  label="Omborni tanlang"
                  value={countWarehouseChoice}
                  onChange={(event) => setCountWarehouseChoice(event.target.value)}
                  sx={{
                    minWidth: 230,
                  }}
                >
                  {activeWarehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Button
                  variant="contained"
                  disabled={!countWarehouseChoice}
                  onClick={() => {
                    const warehouse = activeWarehouses.find(
                      (item) => Number(item.id) === Number(countWarehouseChoice),
                    );

                    if (warehouse) {
                      openInventoryCount(warehouse);
                    }
                  }}
                  sx={primaryButtonSx}
                >
                  Inventarizatsiya qilish
                </Button>
              </Stack>
            )}
          </Box>

          <Box
            sx={{
              overflowX: "auto",
            }}
          >
            <Table
              sx={{
                minWidth: 850,
                ...tableSx,
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Sana</TableCell>

                  <TableCell>Ombor</TableCell>

                  <TableCell>Sanov qatorlari</TableCell>

                  <TableCell>Farqli qatorlar</TableCell>

                  <TableCell>Mas’ul</TableCell>

                  <TableCell>Izoh</TableCell>

                  <TableCell align="right">Amal</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {counts.length ? (
                  counts.map((count) => (
                    <TableRow key={count.id} hover>
                      <TableCell>{safeDateTime(count.counted_at)}</TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            color: "#334155",

                            fontSize: 10.5,

                            fontWeight: 900,
                          }}
                        >
                          {count.warehouse_name || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell>{quantity(count.total_lines)}</TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            Number(count.variance_lines)
                              ? `${count.variance_lines} ta farq`
                              : "Farq yo‘q"
                          }
                          sx={{
                            height: 25,

                            color: Number(count.variance_lines) ? "#b45309" : "#15803d",

                            fontSize: 9.5,

                            fontWeight: 900,

                            backgroundColor: Number(count.variance_lines)
                              ? "rgba(245,158,11,.09)"
                              : "rgba(34,197,94,.09)",

                            border: Number(count.variance_lines)
                              ? "1px solid rgba(245,158,11,.19)"
                              : "1px solid rgba(34,197,94,.18)",
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        {`${count.first_name || ""} ${count.last_name || ""}`.trim() ||
                          count.username ||
                          "-"}
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: 250,
                          color: "#94a3b8",
                          lineHeight: 1.55,
                        }}
                      >
                        {count.note || "-"}
                      </TableCell>

                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openCountDetail(count.id)}
                          sx={tableActionSx}
                        >
                          Ko‘rish
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{
                        py: 6,
                        color: "#94a3b8",
                        fontWeight: 800,
                      }}
                    >
                      Hozircha inventarizatsiya o‘tkazilmagan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      <Dialog
        open={countOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: dialogPaperSx,
        }}
      >
        <DialogTitle sx={dialogTitleSx}>Inventarizatsiya — {countWarehouse?.name}</DialogTitle>

        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "220px 1fr",
                },

                gap: 1.4,
              }}
            >
              <TextField
                type="date"
                label="Sanov sanasi"
                value={countedAt}
                onChange={(event) => setCountedAt(event.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <TextField
                label="Izoh"
                value={countNote}
                onChange={(event) => setCountNote(event.target.value)}
                placeholder="Masalan: Oy yakuni sanovi"
              />
            </Box>

            <Box
              sx={{
                overflowX: "auto",

                border: "1px solid #e4e9ef",

                borderRadius: "14px",
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 700,
                  ...tableSx,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Element</TableCell>

                    <TableCell>Turi</TableCell>

                    <TableCell>Tizimdagi</TableCell>

                    <TableCell
                      sx={{
                        width: 180,
                      }}
                    >
                      Haqiqiy sanov
                    </TableCell>

                    <TableCell>Farq</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {countRows.map((row, index) => {
                    const difference =
                      Number(row.counted_quantity || 0) - Number(row.quantity || 0);

                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Typography
                            sx={{
                              color: "#334155",

                              fontSize: 10.5,

                              fontWeight: 900,
                            }}
                          >
                            {row.item_name}
                          </Typography>
                        </TableCell>

                        <TableCell>{itemTypeLabel(row.item_type)}</TableCell>

                        <TableCell>
                          {quantity(row.quantity)} {row.unit}
                        </TableCell>

                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={row.counted_quantity}
                            onChange={(event) =>
                              setCountRows((current) =>
                                current.map((item, rowIndex) =>
                                  rowIndex === index
                                    ? {
                                        ...item,

                                        counted_quantity: event.target.value,
                                      }
                                    : item,
                                ),
                              )
                            }
                            slotProps={{
                              htmlInput: {
                                min: 0,
                                step: 0.001,
                              },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography
                            sx={{
                              color: difference ? "#b45309" : "#15803d",

                              fontSize: 10.5,

                              fontWeight: 950,
                            }}
                          >
                            {difference > 0 ? "+" : ""}
                            {quantity(difference)} {row.unit}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 10.5,
                fontWeight: 700,
                lineHeight: 1.6,
              }}
            >
              Saqlanganda farqlar avtomatik ombor tuzatishi sifatida yoziladi va tarixda qoladi.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs} sx={secondaryButtonSx}>
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            disabled={saving}
            onClick={saveInventoryCount}
            sx={primaryButtonSx}
          >
            {saving ? "Saqlanmoqda..." : "Inventarizatsiyani yakunlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={countDetailOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: dialogPaperSx,
        }}
      >
        <DialogTitle sx={dialogTitleSx}>
          Inventarizatsiya #{countDetail?.id} — {countDetail?.warehouse_name}
        </DialogTitle>

        <DialogContent sx={dialogContentSx}>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 10.5,
                fontWeight: 700,
              }}
            >
              {safeDateTime(countDetail?.counted_at)} • {countDetail?.note || "Izohsiz"}
            </Typography>

            <Box
              sx={{
                overflowX: "auto",

                border: "1px solid #e4e9ef",

                borderRadius: "14px",
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 680,
                  ...tableSx,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Element</TableCell>

                    <TableCell>Turi</TableCell>

                    <TableCell>Tizimdagi</TableCell>

                    <TableCell>Sanalgan</TableCell>

                    <TableCell>Farq</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {(countDetail?.items || []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Typography
                          sx={{
                            color: "#334155",

                            fontSize: 10.5,

                            fontWeight: 900,
                          }}
                        >
                          {row.item_name}
                        </Typography>
                      </TableCell>

                      <TableCell>{itemTypeLabel(row.item_type)}</TableCell>

                      <TableCell>
                        {quantity(row.expected_quantity)} {row.unit}
                      </TableCell>

                      <TableCell>
                        {quantity(row.counted_quantity)} {row.unit}
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            color: Number(row.difference_quantity) ? "#b45309" : "#15803d",

                            fontSize: 10.5,

                            fontWeight: 950,
                          }}
                        >
                          {Number(row.difference_quantity) > 0 ? "+" : ""}
                          {quantity(row.difference_quantity)} {row.unit}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs} sx={secondaryButtonSx}>
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={movementOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: dialogPaperSx,
        }}
      >
        <DialogTitle sx={dialogTitleSx}>Ombor kirim / chiqimi</DialogTitle>

        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              required
              label="Ombor"
              value={movementForm.warehouse_id}
              onChange={(event) =>
                setMovementForm((current) => ({
                  ...current,

                  warehouse_id: event.target.value,
                }))
              }
            >
              {compatibleWarehouses(movementForm.item_type).map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Element turi"
              value={movementForm.item_type}
              onChange={(event) =>
                setMovementForm((current) => ({
                  ...current,

                  item_type: event.target.value,

                  item_id: "",
                  warehouse_id: "",
                }))
              }
            >
              <MenuItem value="raw_material">Homashyo</MenuItem>

              <MenuItem value="product">Mahsulot</MenuItem>
            </TextField>

            <TextField
              select
              required
              label="Element"
              value={movementForm.item_id}
              onChange={(event) =>
                setMovementForm((current) => ({
                  ...current,

                  item_id: event.target.value,
                }))
              }
            >
              {selectableItems(movementForm.item_type).map((item) => (
                <MenuItem key={`${item.item_type}-${item.item_id}`} value={item.item_id}>
                  {item.name} ({item.unit})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Operatsiya"
              value={movementForm.movement_type}
              onChange={(event) =>
                setMovementForm((current) => ({
                  ...current,

                  movement_type: event.target.value,
                }))
              }
            >
              <MenuItem value="in">Kirim</MenuItem>

              <MenuItem value="out">Chiqim</MenuItem>

              <MenuItem value="opening">Boshlang‘ich qoldiq</MenuItem>

              <MenuItem value="adjustment">Tuzatish (+ yoki -)</MenuItem>
            </TextField>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },

                gap: 1.4,
              }}
            >
              <TextField
                required
                type="number"
                label="Miqdor"
                value={movementForm.quantity}
                onChange={(event) =>
                  setMovementForm((current) => ({
                    ...current,

                    quantity: event.target.value,
                  }))
                }
                helperText={
                  movementForm.movement_type === "adjustment"
                    ? "Kamaytirish uchun manfiy son"
                    : "Musbat miqdor"
                }
                slotProps={{
                  htmlInput: {
                    step: 0.001,
                  },
                }}
              />

              <TextField
                type="number"
                label="Birlik tannarxi"
                value={movementForm.unit_cost}
                onChange={(event) =>
                  setMovementForm((current) => ({
                    ...current,

                    unit_cost: event.target.value,
                  }))
                }
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: 1000,
                  },
                }}
              />
            </Box>

            <TextField
              multiline
              minRows={2}
              label="Izoh"
              value={movementForm.note}
              onChange={(event) =>
                setMovementForm((current) => ({
                  ...current,

                  note: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs} sx={secondaryButtonSx}>
            Bekor qilish
          </Button>

          <Button variant="contained" disabled={saving} onClick={saveMovement} sx={primaryButtonSx}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={receiptOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: dialogPaperSx,
        }}
      >
        <DialogTitle sx={dialogTitleSx}>Tayyor mahsulotni omborga qabul qilish</DialogTitle>

        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert
              severity="info"
              sx={{
                borderRadius: "14px",
                fontSize: 10.5,
                lineHeight: 1.6,
              }}
            >
              Retsepti va yakunlovchi bo‘limi sozlangan mahsulotlar ish hisobotidan avtomatik
              kiradi. Qo‘lda kirim avtomatik hisob yoqilmagan mahsulotlar uchun ishlatiladi.
            </Alert>

            <TextField
              select
              required
              label="Qabul qiluvchi ombor"
              value={receiptForm.warehouse_id}
              onChange={(event) =>
                setReceiptForm((current) => ({
                  ...current,

                  warehouse_id: event.target.value,
                }))
              }
            >
              {compatibleWarehouses("product").map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              required
              label="Tayyor mahsulot"
              value={receiptForm.product_id}
              onChange={(event) =>
                setReceiptForm((current) => ({
                  ...current,

                  product_id: event.target.value,
                }))
              }
            >
              {selectableItems("product").map((item) => (
                <MenuItem
                  key={item.item_id}
                  value={item.item_id}
                  disabled={Boolean(item.has_recipe && item.completion_department_id)}
                >
                  {item.name} ({item.unit})
                  {item.has_recipe && item.completion_department_id ? " — avtomatik" : ""}
                </MenuItem>
              ))}
            </TextField>

            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },

                gap: 1.4,
              }}
            >
              <TextField
                required
                type="number"
                label="Qabul qilingan miqdor"
                value={receiptForm.quantity}
                onChange={(event) =>
                  setReceiptForm((current) => ({
                    ...current,

                    quantity: event.target.value,
                  }))
                }
                slotProps={{
                  htmlInput: {
                    min: 0.001,
                    step: 1,
                  },
                }}
              />

              <TextField
                type="number"
                label="Birlik tannarxi"
                value={receiptForm.unit_cost}
                onChange={(event) =>
                  setReceiptForm((current) => ({
                    ...current,

                    unit_cost: event.target.value,
                  }))
                }
                helperText="Ixtiyoriy"
                slotProps={{
                  htmlInput: {
                    min: 0,
                    step: 1000,
                  },
                }}
              />
            </Box>

            <TextField
              type="date"
              label="Qabul sanasi"
              value={receiptForm.occurred_at}
              onChange={(event) =>
                setReceiptForm((current) => ({
                  ...current,

                  occurred_at: event.target.value,
                }))
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              multiline
              minRows={2}
              label="Izoh"
              value={receiptForm.note}
              onChange={(event) =>
                setReceiptForm((current) => ({
                  ...current,

                  note: event.target.value,
                }))
              }
              placeholder="Masalan: Yakuniy nazoratdan o‘tdi, 2-smena"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs} sx={secondaryButtonSx}>
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            disabled={saving}
            onClick={saveProductionReceipt}
            sx={primaryButtonSx}
          >
            {saving ? "Saqlanmoqda..." : "Omborga qabul qilish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={transferOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: dialogPaperSx,
        }}
      >
        <DialogTitle sx={dialogTitleSx}>Omborlar orasida ko‘chirish</DialogTitle>

        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              required
              label="Qaysi ombordan"
              value={transferForm.from_warehouse_id}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,

                  from_warehouse_id: event.target.value,

                  to_warehouse_id: "",
                }))
              }
            >
              {compatibleWarehouses(transferForm.item_type).map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              required
              label="Qaysi omborga"
              value={transferForm.to_warehouse_id}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,

                  to_warehouse_id: event.target.value,
                }))
              }
            >
              {compatibleWarehouses(transferForm.item_type)
                .filter(
                  (warehouse) => Number(warehouse.id) !== Number(transferForm.from_warehouse_id),
                )
                .map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              select
              label="Element turi"
              value={transferForm.item_type}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,

                  item_type: event.target.value,

                  item_id: "",

                  from_warehouse_id: "",

                  to_warehouse_id: "",
                }))
              }
            >
              <MenuItem value="raw_material">Homashyo</MenuItem>

              <MenuItem value="product">Mahsulot</MenuItem>
            </TextField>

            <TextField
              select
              required
              label="Element"
              value={transferForm.item_id}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,

                  item_id: event.target.value,
                }))
              }
            >
              {selectableItems(transferForm.item_type).map((item) => (
                <MenuItem key={`${item.item_type}-${item.item_id}`} value={item.item_id}>
                  {item.name} ({item.unit})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              type="number"
              label="Miqdor"
              value={transferForm.quantity}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,

                  quantity: event.target.value,
                }))
              }
              slotProps={{
                htmlInput: {
                  min: 0.001,
                  step: 0.001,
                },
              }}
            />

            <TextField
              multiline
              minRows={2}
              label="Izoh"
              value={transferForm.note}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,

                  note: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs} sx={secondaryButtonSx}>
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            disabled={saving || activeWarehouses.length < 2}
            onClick={saveTransfer}
            sx={primaryButtonSx}
          >
            {saving ? "Ko‘chirilmoqda..." : "Ko‘chirish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={warehouseOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: dialogPaperSx,
        }}
      >
        <DialogTitle sx={dialogTitleSx}>
          {editingWarehouse ? "Omborni tahrirlash" : "Yangi ombor"}
        </DialogTitle>

        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              required
              label="Ombor nomi"
              value={warehouseForm.name}
              onChange={(event) =>
                setWarehouseForm((current) => ({
                  ...current,

                  name: event.target.value,
                }))
              }
            />

            <TextField
              required
              label="Ombor kodi"
              value={warehouseForm.code}
              onChange={(event) =>
                setWarehouseForm((current) => ({
                  ...current,

                  code: event.target.value.toUpperCase(),
                }))
              }
              helperText="Masalan: FILIAL yoki CHILONZOR"
            />

            <TextField
              label="Manzil"
              value={warehouseForm.location}
              onChange={(event) =>
                setWarehouseForm((current) => ({
                  ...current,

                  location: event.target.value,
                }))
              }
            />

            <TextField
              select
              label="Saqlanadigan tur"
              value={warehouseForm.warehouse_type}
              onChange={(event) =>
                setWarehouseForm((current) => ({
                  ...current,

                  warehouse_type: event.target.value,
                }))
              }
            >
              <MenuItem value="product">Tayyor mahsulot</MenuItem>

              <MenuItem value="raw_material">Homashyo</MenuItem>

              <MenuItem value="mixed">Aralash ombor</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs} sx={secondaryButtonSx}>
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            disabled={saving}
            onClick={saveWarehouse}
            sx={primaryButtonSx}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={warehouseDeleteOpen}
        onClose={saving ? undefined : closeDialogs}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: dialogPaperSx,
        }}
      >
        <DialogTitle sx={dialogTitleSx}>Omborni o‘chirish</DialogTitle>

        <DialogContent sx={dialogContentSx}>
          <Stack spacing={1.2}>
            <Typography
              sx={{
                color: "#334155",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {warehousePendingDelete?.name || "Tanlangan ombor"} o‘chirilsinmi?
            </Typography>

            <Typography
              sx={{
                color: "#64748b",
                fontSize: 10.5,
                lineHeight: 1.65,
              }}
            >
              Ombor arxivlanadi va faol omborlar ro‘yxatidan olib tashlanadi. Bu amalni faqat
              ishonchingiz komil bo‘lsa tasdiqlang.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs} disabled={saving} sx={secondaryButtonSx}>
            Bekor qilish
          </Button>

          <Button
            color="error"
            variant="contained"
            disabled={saving || !warehousePendingDelete}
            onClick={removeWarehouse}
            sx={{
              minHeight: 40,
              borderRadius: "11px",
              fontSize: 10.5,
              fontWeight: 900,
              textTransform: "none",
            }}
          >
            {saving ? "O‘chirilmoqda..." : "Ha, o‘chirish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={thresholdOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: dialogPaperSx,
        }}
      >
        <DialogTitle sx={dialogTitleSx}>Minimal qoldiq</DialogTitle>

        <DialogContent sx={dialogContentSx}>
          <Typography
            sx={{
              mb: 2,
              color: "#64748b",
              fontSize: 10.5,
              lineHeight: 1.6,
            }}
          >
            {thresholdRow?.item_name} — {thresholdRow?.warehouse_name}
          </Typography>

          <TextField
            fullWidth
            type="number"
            label="Ogohlantirish miqdori"
            value={thresholdValue}
            onChange={(event) => setThresholdValue(event.target.value)}
            slotProps={{
              htmlInput: {
                min: 0,
                step: 0.001,
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs} sx={secondaryButtonSx}>
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            disabled={saving}
            onClick={saveThreshold}
            sx={primaryButtonSx}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const inventoryPageStyles = `
  .inventory-page {
    --aa-radius-md: 11px;
    --aa-radius-lg: 18px;
    --aa-radius-xl: 22px;
    --aa-border: #e4e9ef;
    --aa-surface: #ffffff;
    --aa-surface-solid: #ffffff;
    --aa-surface-muted: #fafbfc;
    --aa-surface-hover: rgba(153,27,27,.025);
    --aa-text: #334155;
    --aa-text-secondary: #64748b;
    --aa-text-tertiary: #94a3b8;
    --aa-brand-50: rgba(153,27,27,.055);
    --aa-brand-200: rgba(153,27,27,.14);
    --aa-brand-600: #b91c1c;
    --aa-brand-700: #991b1b;
    --aa-brand-800: #7f1d1d;
    --aa-brand-900: #681818;
    --aa-danger: #b91c1c;
    --aa-warning: #b45309;
    --aa-success: #15803d;
    --aa-info: #1d4ed8;
  }

  .inventory-page .inventory-hero {
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

  .inventory-page .MuiTabs-indicator {
    height: 3px;
    border-radius: 99px;
    background-color: #991b1b;
  }

  .inventory-page .MuiTab-root {
    min-height: 48px;
    color: #94a3b8;
    font-size: 10.5px;
    font-weight: 900;
    text-transform: none;
  }

  .inventory-page
    .MuiTab-root.Mui-selected {
    color: #991b1b;
  }
`;

export default Inventory;
