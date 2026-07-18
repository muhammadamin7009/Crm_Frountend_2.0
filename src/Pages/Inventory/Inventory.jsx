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
  createProductionReceipt,
  createInventoryTransfer,
  createWarehouse,
  getInventoryItems,
  getInventoryCount,
  getInventoryCounts,
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
  opening: "Boshlang'ich qoldiq",
  in: "Kirim",
  out: "Chiqim",
  adjustment: "Tuzatish",
  transfer_in: "Ko'chirish kirimi",
  transfer_out: "Ko'chirish chiqimi",
};

const itemTypeLabel = (type) => (type === "product" ? "Mahsulot" : "Homashyo");
const warehouseTypeLabel = (type) =>
  type === "product"
    ? "Tayyor mahsulot"
    : type === "raw_material"
      ? "Homashyo"
      : "Aralash";
const quantity = (value) =>
  Number(value || 0).toLocaleString("uz-UZ", { maximumFractionDigits: 3 });
const errorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const surfaceCardSx = {
  borderRadius: "var(--aa-radius-xl)",
  border: "1px solid var(--aa-border)",
  background: "var(--aa-surface)",
  boxShadow: "var(--aa-shadow-sm)",
};

const tableSx = {
  "& th": {
    py: 1.55,
    color: "var(--aa-text-secondary)",
    fontSize: 12,
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    background: "var(--aa-surface-muted)",
    borderBottom: "1px solid var(--aa-border)",
  },
  "& td": {
    py: 1.45,
    color: "var(--aa-text)",
    borderBottom: "1px solid var(--aa-border)",
  },
  "& tbody tr:hover": {
    background: "var(--aa-surface-hover)",
  },
};

const dialogPaperSx = {
  borderRadius: "var(--aa-radius-xl)",
  border: "1px solid var(--aa-border)",
  boxShadow: "var(--aa-shadow-lg)",
  overflow: "hidden",
};

const dialogTitleSx = {
  px: 3,
  py: 2.2,
  color: "var(--aa-text)",
  fontWeight: 950,
  borderBottom: "1px solid var(--aa-border)",
};

const dialogContentSx = { px: 3, py: 2.5 };
const dialogActionsSx = {
  px: 3,
  py: 2,
  borderTop: "1px solid var(--aa-border)",
  background: "var(--aa-surface-muted)",
};

const primaryButtonSx = {
  minHeight: 40,
  borderRadius: "var(--aa-radius-md)",
  textTransform: "none",
  fontWeight: 900,
  background:
    "linear-gradient(135deg, var(--aa-brand-800), var(--aa-brand-600))",
  boxShadow: "var(--aa-shadow-sm)",
  "&:hover": {
    background:
      "linear-gradient(135deg, var(--aa-brand-900), var(--aa-brand-700))",
  },
};

const MetricCard = ({ label, value, hint, tone = "var(--aa-brand-800)" }) => (
  <Card sx={{ ...surfaceCardSx, p: 2.2, minHeight: 124 }}>
    <Typography
      sx={{ color: "var(--aa-text-secondary)", fontSize: 13, fontWeight: 850 }}
    >
      {label}
    </Typography>
    <Typography sx={{ mt: 1, color: tone, fontSize: 28, fontWeight: 950 }}>
      {value}
    </Typography>
    <Typography
      sx={{
        mt: 0.6,
        color: "var(--aa-text-tertiary)",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {hint}
    </Typography>
  </Card>
);

const Inventory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { warehouseId } = useParams();
  const isCountsPage = location.pathname === "/inventory/counts";
  const isManagementPage = location.pathname === "/inventory/warehouses";
  const canManageAll = hasPermission(user, "inventory.manage");
  const canManageMovements =
    canManageAll || hasPermission(user, "inventory.movements");
  const canManageWarehouses =
    canManageAll || hasPermission(user, "inventory.warehouses");
  const canCount = canManageAll || hasPermission(user, "inventory.count");
  const canReceive =
    canManageMovements || hasPermission(user, "production.manage");
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
  const [countedAt, setCountedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [countNote, setCountNote] = useState("");
  const [countDetail, setCountDetail] = useState(null);
  const [countWarehouseChoice, setCountWarehouseChoice] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [warehouseRes, stockRes, movementRes, itemRes, countRes] =
        await Promise.all([
          getWarehouses(),
          getInventoryStock({ limit: 200 }),
          getInventoryMovements({ limit: 150 }),
          getInventoryItems({ limit: 300 }),
          getInventoryCounts({ limit: 100 }),
        ]);
      setWarehouses(warehouseRes.data.warehouses || []);
      setStock(stockRes.data.stock || []);
      setMovements(
        movementRes.data.inventory_movements ||
          movementRes.data.movements ||
          [],
      );
      setItems(itemRes.data.items || []);
      setCounts(countRes.data.inventory_counts || []);
    } catch (error) {
      toast.error(errorMessage(error, "Ombor ma'lumotlarini olishda xato."));
    } finally {
      if (!quiet) setLoading(false);
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
      activeWarehouses.find(
        (warehouse) => Number(warehouse.id) === Number(warehouseId),
      ) || null,
    [activeWarehouses, warehouseId],
  );

  useEffect(() => {
    if (warehouseId) setWarehouseFilter(String(warehouseId));
  }, [warehouseId]);

  useEffect(() => {
    if (!loading && location.pathname === "/inventory") {
      const target = canManageWarehouses
        ? "/inventory/warehouses"
        : activeWarehouses[0]
          ? `/inventory/warehouses/${activeWarehouses[0].id}`
          : "/inventory/counts";
      navigate(target, { replace: true });
    }
  }, [
    activeWarehouses,
    canManageWarehouses,
    loading,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (!loading && warehouseId && !selectedWarehouse) {
      navigate("/inventory", { replace: true });
    }
  }, [loading, navigate, selectedWarehouse, warehouseId]);

  const filterText = search.trim().toLocaleLowerCase("uz-UZ");
  const filteredStock = useMemo(
    () =>
      stock.filter(
        (row) =>
          (!warehouseFilter ||
            Number(row.warehouse_id) === Number(warehouseFilter)) &&
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
          (!warehouseFilter ||
            Number(row.warehouse_id) === Number(warehouseFilter)) &&
          (!filterText ||
            `${row.item_name || ""} ${row.warehouse_name || ""} ${row.note || ""}`
              .toLocaleLowerCase("uz-UZ")
              .includes(filterText)),
      ),
    [filterText, movements, warehouseFilter],
  );

  const selectableItems = (type) =>
    items.filter((item) => item.item_type === type);
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
    const rows = stock.filter(
      (row) => Number(row.warehouse_id) === Number(warehouse.id),
    );
    if (!rows.length) {
      toast.error("Bu omborda sanash uchun qoldiq pozitsiyalari yo'q.");
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
      countRows.some(
        (row) =>
          row.counted_quantity === "" || Number(row.counted_quantity) < 0,
      )
    ) {
      toast.error("Barcha haqiqiy miqdorlarni to'g'ri kiriting.");
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
      const { data } = await getInventoryCount(id);
      setCountDetail(data.inventory_count);
      setCountDetailOpen(true);
    } catch (error) {
      toast.error(
        errorMessage(error, "Inventarizatsiya tafsilotlarini olishda xato."),
      );
    }
  };

  const saveMovement = async () => {
    if (
      !movementForm.warehouse_id ||
      !movementForm.item_id ||
      !movementForm.quantity
    ) {
      return toast.error("Ombor, element va miqdorni kiriting.");
    }
    setSaving(true);
    try {
      await createInventoryMovement({
        ...movementForm,
        warehouse_id: Number(movementForm.warehouse_id),
        item_id: Number(movementForm.item_id),
        quantity: Number(movementForm.quantity),
        unit_cost:
          movementForm.unit_cost === "" ? null : Number(movementForm.unit_cost),
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
    if (
      !receiptForm.warehouse_id ||
      !receiptForm.product_id ||
      Number(receiptForm.quantity) <= 0
    ) {
      return toast.error("Ombor, tayyor mahsulot va miqdorni kiriting.");
    }
    setSaving(true);
    try {
      await createProductionReceipt({
        warehouse_id: Number(receiptForm.warehouse_id),
        product_id: Number(receiptForm.product_id),
        quantity: Number(receiptForm.quantity),
        unit_cost:
          receiptForm.unit_cost === "" ? null : Number(receiptForm.unit_cost),
        occurred_at: receiptForm.occurred_at || undefined,
        note: receiptForm.note.trim() || null,
        idempotency_key: crypto.randomUUID(),
      });
      toast.success("Tayyor mahsulot omborga qabul qilindi.");
      closeDialogs();
      await load(true);
    } catch (error) {
      toast.error(
        errorMessage(error, "Tayyor mahsulotni omborga qabul qilishda xato."),
      );
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
      return toast.error("Barcha majburiy maydonlarni kiriting.");
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
      toast.success("Qoldiq omborlar orasida ko'chirildi.");
      closeDialogs();
      await load(true);
    } catch (error) {
      toast.error(errorMessage(error, "Ko'chirishda xato."));
    } finally {
      setSaving(false);
    }
  };

  const saveWarehouse = async () => {
    if (!warehouseForm.name.trim() || !warehouseForm.code.trim()) {
      return toast.error("Ombor nomi va kodini kiriting.");
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
        const { data } = await updateWarehouse(editingWarehouse.id, payload);
        savedWarehouse = data.warehouse;
      } else {
        const { data } = await createWarehouse(payload);
        savedWarehouse = data.warehouse;
      }
      toast.success(
        editingWarehouse ? "Ombor yangilandi." : "Ombor qo'shildi.",
      );
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
    if (!warehousePendingDelete) return;

    const warehouse = warehousePendingDelete;
    setSaving(true);
    try {
      await archiveWarehouse(warehouse.id);
      toast.success("Ombor o'chirildi.");
      closeDialogs();
      await load(true);
      window.dispatchEvent(new Event("warehouses-updated"));
      if (Number(warehouseId) === Number(warehouse.id))
        navigate("/inventory", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error, "Omborni o'chirishda xato."));
    } finally {
      setSaving(false);
    }
  };

  const saveThreshold = async () => {
    if (!thresholdRow || thresholdValue === "" || Number(thresholdValue) < 0)
      return;
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
      <Box className="flex h-80 items-center justify-center">
        <CircularProgress size={32} sx={{ color: "var(--aa-brand-800)" }} />
      </Box>
    );
  }

  return (
    <Box className="crm-page space-y-4" sx={{ pb: 2.5 }}>
      <Card
        sx={{
          ...surfaceCardSx,
          p: { xs: 2, md: 2.5 },
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", lg: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Chip
            size="small"
            label="Al-amin CRM • ombor nazorati"
            sx={{
              mb: 1,
              color: "var(--aa-brand-800)",
              fontSize: 12,
              fontWeight: 950,
              background: "var(--aa-brand-50)",
              border: "1px solid var(--aa-brand-200)",
            }}
          />
          <Typography
            sx={{
              color: "var(--aa-text)",
              fontSize: { xs: 27, md: 33 },
              fontWeight: 950,
              letterSpacing: "-0.045em",
              lineHeight: 1.08,
            }}
          >
            {isCountsPage
              ? "Inventarizatsiya"
              : isManagementPage
                ? "Omborlar boshqaruvi"
                : selectedWarehouse?.name || "Ombor"}
          </Typography>
          <Typography
            sx={{ mt: 0.7, color: "var(--aa-text-secondary)", fontWeight: 700 }}
          >
            {isCountsPage
              ? "Omborlarni sanash, farqlarni aniqlash va oldingi inventarizatsiyalar tarixi."
              : isManagementPage
                ? "Omborlarni yaratish, tahrirlash va o'chirish."
                : `${warehouseTypeLabel(selectedWarehouse?.warehouse_type)} qoldig'i va kirim-chiqim harakatlari.`}
          </Typography>
        </Box>
        {isManagementPage && canManageWarehouses && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {canManageMovements && (
              <Button
                variant="outlined"
                onClick={() => setTransferOpen(true)}
                disabled={activeWarehouses.length < 2}
                sx={{
                  minHeight: 40,
                  borderRadius: "var(--aa-radius-md)",
                  fontWeight: 900,
                }}
              >
                Ombordan omborga o'tkazish
              </Button>
            )}
            <Button
              variant="contained"
              onClick={() => setWarehouseOpen(true)}
              sx={primaryButtonSx}
            >
              Yangi ombor qo'shish
            </Button>
          </Stack>
        )}
        {!isCountsPage &&
          !isManagementPage &&
          selectedWarehouse?.warehouse_type === "product" &&
          canReceive && (
            <Button
              variant="contained"
              onClick={() => setReceiptOpen(true)}
              sx={primaryButtonSx}
            >
              Mahsulot ishlab chiqarish
            </Button>
          )}
      </Card>

      {isManagementPage && (
        <Card sx={{ ...surfaceCardSx, p: 2.2 }}>
          <Box
            sx={{
              mb: 1.8,
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box>
              <Typography
                sx={{ color: "var(--aa-text)", fontSize: 18, fontWeight: 950 }}
              >
                Faol omborlar
              </Typography>
              <Typography
                sx={{
                  mt: 0.4,
                  color: "var(--aa-text-secondary)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Ombor yaratish, tahrirlash yoki o'chirish uchun sodda boshqaruv
                oynasi.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(3, minmax(0, 1fr))",
              },
              gap: 1.4,
            }}
          >
            {warehouses.map((warehouse) => {
              return (
                <Card
                  key={warehouse.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: "var(--aa-radius-lg)",
                    borderColor: "var(--aa-border)",
                    background: "var(--aa-surface-solid)",
                    boxShadow: "var(--aa-shadow-xs)",
                    opacity: warehouse.is_active ? 1 : 0.62,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{ fontWeight: 950, color: "var(--aa-text)" }}
                        noWrap
                      >
                        {warehouse.name}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.4,
                          color: "var(--aa-text-secondary)",
                          fontSize: 12,
                          fontWeight: 750,
                        }}
                      >
                        {warehouse.code} •{" "}
                        {warehouseTypeLabel(warehouse.warehouse_type)}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      color={warehouse.is_active ? "success" : "default"}
                      label={warehouse.is_active ? "Faol" : "Arxiv"}
                    />
                  </Stack>
                  <Typography
                    sx={{
                      mt: 1.5,
                      fontSize: 24,
                      fontWeight: 950,
                      color: "var(--aa-brand-800)",
                    }}
                  >
                    {warehouse.stock_lines || 0}
                  </Typography>
                  <Typography
                    sx={{
                      color: "var(--aa-text-tertiary)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    qoldiq pozitsiyasi
                  </Typography>

                  {canManageWarehouses && warehouse.is_active && (
                    <Stack direction="row" spacing={0.7} sx={{ mt: 1.5 }}>
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
                      >
                        Tahrirlash
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => requestWarehouseDelete(warehouse)}
                      >
                        O'chirish
                      </Button>
                    </Stack>
                  )}
                </Card>
              );
            })}
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
                xl: "repeat(4, 1fr)",
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
            />
            <MetricCard
              label="Qoldiq pozitsiyalari"
              value={filteredStock.length}
              hint="Shu ombordagi qatorlar"
              tone="var(--aa-info)"
            />
            <MetricCard
              label="Kam qolgan"
              value={filteredStock.filter((row) => row.is_low).length}
              hint="Minimal miqdorga yetgan pozitsiyalar"
              tone={
                filteredStock.some((row) => row.is_low)
                  ? "var(--aa-danger)"
                  : "var(--aa-success)"
              }
            />
            <MetricCard
              label="Harakatlar"
              value={filteredMovements.length}
              hint="Shu ombordagi operatsiyalar"
              tone="var(--aa-brand-600)"
            />
          </Box>

          <Card sx={{ ...surfaceCardSx, overflow: "hidden" }}>
            <Box
              sx={{
                px: 2,
                pt: 1.2,
                borderBottom: "1px solid var(--aa-border)",
              }}
            >
              <Tabs
                value={tab}
                onChange={(_event, value) => setTab(value)}
                variant="scrollable"
              >
                <Tab label="Qoldiq" />
                <Tab label="Harakatlar" />
              </Tabs>
            </Box>

            {
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
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Box>
            }

            {tab === 0 && (
              <Box sx={{ overflowX: "auto" }}>
                <Table sx={{ minWidth: 900, ...tableSx }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Element</TableCell>
                      <TableCell>Turi</TableCell>
                      <TableCell>Ombor</TableCell>
                      <TableCell>Qoldiq</TableCell>
                      <TableCell>Minimum</TableCell>
                      <TableCell>Holat</TableCell>
                      {canManageMovements && (
                        <TableCell align="right">Amal</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStock.length ? (
                      filteredStock.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontWeight: 900 }}>
                            {row.item_name || `#${row.item_id}`}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={itemTypeLabel(row.item_type)}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 750 }}>
                            {row.warehouse_name}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 950,
                              color: row.is_low
                                ? "var(--aa-danger)"
                                : "var(--aa-text)",
                            }}
                          >
                            {quantity(row.quantity)} {row.unit}
                          </TableCell>
                          <TableCell>
                            {quantity(row.minimum_quantity)} {row.unit}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={row.is_low ? "error" : "success"}
                              label={row.is_low ? "Kam qolgan" : "Yetarli"}
                            />
                          </TableCell>
                          {canManageMovements && (
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setThresholdRow(row);
                                  setThresholdValue(
                                    String(row.minimum_quantity || 0),
                                  );
                                  setThresholdOpen(true);
                                }}
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
                            color: "var(--aa-text-secondary)",
                            fontWeight: 800,
                          }}
                        >
                          Qoldiq topilmadi. Birinchi kirimni qo'shing.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ overflowX: "auto" }}>
                <Table sx={{ minWidth: 980, ...tableSx }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sana</TableCell>
                      <TableCell>Element</TableCell>
                      <TableCell>Ombor</TableCell>
                      <TableCell>Operatsiya</TableCell>
                      <TableCell>Miqdor</TableCell>
                      <TableCell>Mas'ul</TableCell>
                      <TableCell>Izoh</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMovements.length ? (
                      filteredMovements.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            {new Date(row.occurred_at).toLocaleString("uz-UZ")}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900 }}>
                            {row.item_name || `#${row.item_id}`}
                          </TableCell>
                          <TableCell>{row.warehouse_name}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                movementLabels[row.movement_type] ||
                                row.movement_type
                              }
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 950,
                              color:
                                Number(row.quantity_delta) < 0
                                  ? "var(--aa-danger)"
                                  : "var(--aa-success)",
                            }}
                          >
                            {Number(row.quantity_delta) > 0 ? "+" : ""}
                            {quantity(row.quantity_delta)} {row.unit}
                          </TableCell>
                          <TableCell>
                            {`${row.first_name || ""} ${row.last_name || ""}`.trim() ||
                              row.username ||
                              "-"}
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: 260,
                              color: "var(--aa-text-secondary)",
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
                            color: "var(--aa-text-secondary)",
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
        <Card sx={{ ...surfaceCardSx, overflow: "hidden" }}>
          <Box
            sx={{
              p: 2,
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 1.2,
              borderBottom: "1px solid var(--aa-border)",
            }}
          >
            <Box>
              <Typography
                sx={{ color: "var(--aa-text)", fontSize: 18, fontWeight: 950 }}
              >
                Inventarizatsiya
              </Typography>
              <Typography
                sx={{
                  mt: 0.4,
                  color: "var(--aa-text-secondary)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Haqiqiy sanov, tizimdagi qoldiq bilan farq va oldingi
                inventarizatsiyalar tarixi.
              </Typography>
            </Box>
            {canCount && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  size="small"
                  select
                  label="Omborni tanlang"
                  value={countWarehouseChoice}
                  onChange={(event) =>
                    setCountWarehouseChoice(event.target.value)
                  }
                  sx={{ minWidth: 230 }}
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
                      (item) =>
                        Number(item.id) === Number(countWarehouseChoice),
                    );
                    if (warehouse) openInventoryCount(warehouse);
                  }}
                  sx={primaryButtonSx}
                >
                  Inventarizatsiya qilish
                </Button>
              </Stack>
            )}
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 850, ...tableSx }}>
              <TableHead>
                <TableRow>
                  <TableCell>Sana</TableCell>
                  <TableCell>Ombor</TableCell>
                  <TableCell>Sanov qatorlari</TableCell>
                  <TableCell>Farqli qatorlar</TableCell>
                  <TableCell>Mas'ul</TableCell>
                  <TableCell>Izoh</TableCell>
                  <TableCell align="right">Amal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {counts.length ? (
                  counts.map((count) => (
                    <TableRow key={count.id} hover>
                      <TableCell>
                        {new Date(count.counted_at).toLocaleString("uz-UZ")}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>
                        {count.warehouse_name}
                      </TableCell>
                      <TableCell>{count.total_lines}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={
                            Number(count.variance_lines) ? "warning" : "success"
                          }
                          label={
                            Number(count.variance_lines)
                              ? `${count.variance_lines} ta farq`
                              : "Farq yo'q"
                          }
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
                          color: "var(--aa-text-secondary)",
                        }}
                      >
                        {count.note || "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openCountDetail(count.id)}
                        >
                          Ko'rish
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
                        color: "var(--aa-text-secondary)",
                        fontWeight: 800,
                      }}
                    >
                      Hozircha inventarizatsiya o'tkazilmagan.
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
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={dialogTitleSx}>
          Inventarizatsiya — {countWarehouse?.name}
        </DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "220px 1fr" },
                gap: 1.4,
              }}
            >
              <TextField
                type="date"
                label="Sanov sanasi"
                value={countedAt}
                onChange={(event) => setCountedAt(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
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
                border: "1px solid var(--aa-border)",
                borderRadius: "var(--aa-radius-md)",
              }}
            >
              <Table size="small" sx={{ minWidth: 700, ...tableSx }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Element</TableCell>
                    <TableCell>Turi</TableCell>
                    <TableCell>Tizimdagi</TableCell>
                    <TableCell sx={{ width: 180 }}>Haqiqiy sanov</TableCell>
                    <TableCell>Farq</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {countRows.map((row, index) => {
                    const difference =
                      Number(row.counted_quantity || 0) -
                      Number(row.quantity || 0);
                    return (
                      <TableRow key={row.id}>
                        <TableCell sx={{ fontWeight: 900 }}>
                          {row.item_name}
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
                            slotProps={{ htmlInput: { min: 0, step: 0.001 } }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 950,
                            color: difference
                              ? "var(--aa-warning)"
                              : "var(--aa-success)",
                          }}
                        >
                          {difference > 0 ? "+" : ""}
                          {quantity(difference)} {row.unit}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
            <Typography
              sx={{
                color: "var(--aa-text-secondary)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Saqlanganda farqlar avtomatik ombor tuzatishi sifatida yoziladi va
              tarixda qoladi.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs}>Bekor qilish</Button>
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
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={dialogTitleSx}>
          Inventarizatsiya #{countDetail?.id} — {countDetail?.warehouse_name}
        </DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Typography
              sx={{ color: "var(--aa-text-secondary)", fontWeight: 700 }}
            >
              {countDetail?.counted_at
                ? new Date(countDetail.counted_at).toLocaleString("uz-UZ")
                : "-"}{" "}
              • {countDetail?.note || "Izohsiz"}
            </Typography>
            <Box
              sx={{
                overflowX: "auto",
                border: "1px solid var(--aa-border)",
                borderRadius: "var(--aa-radius-md)",
              }}
            >
              <Table size="small" sx={{ minWidth: 680, ...tableSx }}>
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
                      <TableCell sx={{ fontWeight: 900 }}>
                        {row.item_name}
                      </TableCell>
                      <TableCell>{itemTypeLabel(row.item_type)}</TableCell>
                      <TableCell>
                        {quantity(row.expected_quantity)} {row.unit}
                      </TableCell>
                      <TableCell>
                        {quantity(row.counted_quantity)} {row.unit}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 950,
                          color: Number(row.difference_quantity)
                            ? "var(--aa-warning)"
                            : "var(--aa-success)",
                        }}
                      >
                        {Number(row.difference_quantity) > 0 ? "+" : ""}
                        {quantity(row.difference_quantity)} {row.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs}>Yopish</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={movementOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={dialogTitleSx}>Ombor kirim / chiqimi</DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
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
                <MenuItem
                  key={`${item.item_type}-${item.item_id}`}
                  value={item.item_id}
                >
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
              <MenuItem value="opening">Boshlang'ich qoldiq</MenuItem>
              <MenuItem value="adjustment">Tuzatish (+ yoki -)</MenuItem>
            </TextField>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.4,
              }}
            >
              <TextField
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
          <Button onClick={closeDialogs}>Bekor qilish</Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={saveMovement}
            sx={primaryButtonSx}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={receiptOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={dialogTitleSx}>
          Tayyor mahsulotni omborga qabul qilish
        </DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: "14px" }}>
              Retsepti va yakunlovchi bo'limi sozlangan mahsulotlar ish
              hisobotidan avtomatik kiradi. Quyidagi qo'lda kirim faqat
              avtomatik hisob yoqilmagan mahsulotlar uchun.
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
                  disabled={Boolean(
                    item.has_recipe && item.completion_department_id,
                  )}
                >
                  {item.name} ({item.unit})
                  {item.has_recipe && item.completion_department_id
                    ? " — avtomatik"
                    : ""}
                </MenuItem>
              ))}
            </TextField>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
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
                slotProps={{ htmlInput: { min: 0.001, step: 1 } }}
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
                slotProps={{ htmlInput: { min: 0, step: 1000 } }}
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
              slotProps={{ inputLabel: { shrink: true } }}
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
              placeholder="Masalan: Yakuniy nazoratdan o'tdi, 2-smena"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs}>Bekor qilish</Button>
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
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={dialogTitleSx}>
          Omborlar orasida ko'chirish
        </DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              label="Qaysi ombordan"
              value={transferForm.from_warehouse_id}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  from_warehouse_id: event.target.value,
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
                  (warehouse) =>
                    Number(warehouse.id) !==
                    Number(transferForm.from_warehouse_id),
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
                <MenuItem
                  key={`${item.item_type}-${item.item_id}`}
                  value={item.item_id}
                >
                  {item.name} ({item.unit})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="number"
              label="Miqdor"
              value={transferForm.quantity}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
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
          <Button onClick={closeDialogs}>Bekor qilish</Button>
          <Button
            variant="contained"
            disabled={saving || activeWarehouses.length < 2}
            onClick={saveTransfer}
            sx={primaryButtonSx}
          >
            {saving ? "Ko'chirilmoqda..." : "Ko'chirish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={warehouseOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={dialogTitleSx}>
          {editingWarehouse ? "Omborni tahrirlash" : "Yangi ombor"}
        </DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
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
          <Button onClick={closeDialogs}>Bekor qilish</Button>
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
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={dialogTitleSx}>Omborni o'chirish</DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <Stack spacing={1.2}>
            <Typography sx={{ color: "var(--aa-text)", fontWeight: 850 }}>
              {warehousePendingDelete?.name || "Tanlangan ombor"} o'chirilsinmi?
            </Typography>
            <Typography
              sx={{
                color: "var(--aa-text-secondary)",
                fontSize: 13.5,
                lineHeight: 1.55,
              }}
            >
              Ombor arxivlanadi va faol omborlar ro'yxatidan olib tashlanadi. Bu
              amalni faqat ishonchingiz komil bo'lsa tasdiqlang.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs} disabled={saving}>
            Bekor qilish
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={saving || !warehousePendingDelete}
            onClick={removeWarehouse}
            sx={{
              minHeight: 40,
              borderRadius: "var(--aa-radius-md)",
              textTransform: "none",
              fontWeight: 900,
            }}
          >
            {saving ? "O'chirilmoqda..." : "Ha, o'chirish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={thresholdOpen}
        onClose={closeDialogs}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: dialogPaperSx }}
      >
        <DialogTitle sx={dialogTitleSx}>Minimal qoldiq</DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <Typography sx={{ mb: 2, color: "var(--aa-text-secondary)" }}>
            {thresholdRow?.item_name} — {thresholdRow?.warehouse_name}
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Ogohlantirish miqdori"
            value={thresholdValue}
            onChange={(event) => setThresholdValue(event.target.value)}
            inputProps={{ min: 0, step: 0.001 }}
          />
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button onClick={closeDialogs}>Bekor qilish</Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={saveThreshold}
            sx={primaryButtonSx}
          >
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
