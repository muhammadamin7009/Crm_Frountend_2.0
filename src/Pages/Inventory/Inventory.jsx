import {
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
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext";
import {
  archiveWarehouse,
  createInventoryMovement,
  createInventoryTransfer,
  createWarehouse,
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

const emptyWarehouse = { name: "", code: "", location: "", is_default: false };

const movementLabels = {
  opening: "Boshlang'ich qoldiq",
  in: "Kirim",
  out: "Chiqim",
  adjustment: "Tuzatish",
  transfer_in: "Ko'chirish kirimi",
  transfer_out: "Ko'chirish chiqimi",
};

const itemTypeLabel = (type) => (type === "product" ? "Mahsulot" : "Homashyo");
const quantity = (value) => Number(value || 0).toLocaleString("uz-UZ", { maximumFractionDigits: 3 });
const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const MetricCard = ({ label, value, hint, tone = "#8f1d20" }) => (
  <Card className="crm-soft-card" sx={{ p: 2.2, minHeight: 124 }}>
    <Typography sx={{ color: "#64748b", fontSize: 13, fontWeight: 850 }}>{label}</Typography>
    <Typography sx={{ mt: 1, color: tone, fontSize: 28, fontWeight: 950 }}>{value}</Typography>
    <Typography sx={{ mt: 0.6, color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>
      {hint}
    </Typography>
  </Card>
);

const Inventory = () => {
  const { user } = useAuth();
  const canManage = hasPermission(user, "inventory.manage");
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [stock, setStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [movementOpen, setMovementOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [movementForm, setMovementForm] = useState(emptyMovement);
  const [transferForm, setTransferForm] = useState(emptyTransfer);
  const [warehouseForm, setWarehouseForm] = useState(emptyWarehouse);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [thresholdRow, setThresholdRow] = useState(null);
  const [thresholdValue, setThresholdValue] = useState("");

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [warehouseRes, stockRes, movementRes, itemRes] = await Promise.all([
        getWarehouses(),
        getInventoryStock({ limit: 200 }),
        getInventoryMovements({ limit: 150 }),
        getInventoryItems({ limit: 300 }),
      ]);
      setWarehouses(warehouseRes.data.warehouses || []);
      setStock(stockRes.data.stock || []);
      setMovements(movementRes.data.inventory_movements || movementRes.data.movements || []);
      setItems(itemRes.data.items || []);
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

  const lowStock = useMemo(
    () => stock.filter((row) => Number(row.minimum_quantity) > 0 && Number(row.quantity) <= Number(row.minimum_quantity)),
    [stock],
  );

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

  const selectableItems = (type) => items.filter((item) => item.item_type === type);

  const closeDialogs = () => {
    setMovementOpen(false);
    setTransferOpen(false);
    setWarehouseOpen(false);
    setThresholdOpen(false);
    setEditingWarehouse(null);
    setMovementForm(emptyMovement);
    setTransferForm(emptyTransfer);
    setWarehouseForm(emptyWarehouse);
    setThresholdRow(null);
    setThresholdValue("");
  };

  const saveMovement = async () => {
    if (!movementForm.warehouse_id || !movementForm.item_id || !movementForm.quantity) {
      return toast.error("Ombor, element va miqdorni kiriting.");
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
      if (editingWarehouse) await updateWarehouse(editingWarehouse.id, payload);
      else await createWarehouse(payload);
      toast.success(editingWarehouse ? "Ombor yangilandi." : "Ombor qo'shildi.");
      closeDialogs();
      await load(true);
    } catch (error) {
      toast.error(errorMessage(error, "Omborni saqlashda xato."));
    } finally {
      setSaving(false);
    }
  };

  const removeWarehouse = async (warehouse) => {
    if (!window.confirm(`${warehouse.name} omborini arxivlaysizmi?`)) return;
    try {
      await archiveWarehouse(warehouse.id);
      toast.success("Ombor arxivlandi.");
      await load(true);
    } catch (error) {
      toast.error(errorMessage(error, "Omborni arxivlashda xato."));
    }
  };

  const saveThreshold = async () => {
    if (!thresholdRow || thresholdValue === "" || Number(thresholdValue) < 0) return;
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
        <CircularProgress size={32} sx={{ color: "#8f1d20" }} />
      </Box>
    );
  }

  return (
    <Box className="crm-page space-y-4">
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={950}>Ombor boshqaruvi</Typography>
          <Typography sx={{ mt: 0.7, color: "#64748b", fontWeight: 700 }}>
            Mahsulot va homashyoning haqiqiy qoldig'i, kirim-chiqimi va omborlararo harakati.
          </Typography>
        </Box>
        {canManage && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="outlined" onClick={() => setTransferOpen(true)}>Ko'chirish</Button>
            <Button variant="outlined" onClick={() => setWarehouseOpen(true)}>Yangi ombor</Button>
            <Button variant="contained" onClick={() => setMovementOpen(true)}>Kirim / chiqim</Button>
          </Stack>
        )}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(4, 1fr)" }, gap: 1.5 }}>
        <MetricCard label="Faol omborlar" value={activeWarehouses.length} hint="Korxonadagi omborlar" />
        <MetricCard label="Qoldiq pozitsiyalari" value={stock.length} hint="Mahsulot va homashyo qatorlari" tone="#1d4ed8" />
        <MetricCard label="Kam qolgan" value={lowStock.length} hint="Minimal miqdorga yetgan pozitsiyalar" tone={lowStock.length ? "#b91c1c" : "#15803d"} />
        <MetricCard label="Harakatlar" value={movements.length} hint="So'nggi yuklangan operatsiyalar" tone="#7c3aed" />
      </Box>

      <Card className="crm-card" sx={{ overflow: "hidden" }}>
        <Box sx={{ px: 2, pt: 1.2, borderBottom: "1px solid #e6edf7" }}>
          <Tabs value={tab} onChange={(_event, value) => setTab(value)} variant="scrollable">
            <Tab label="Qoldiq" />
            <Tab label="Harakatlar" />
            <Tab label="Omborlar" />
          </Tabs>
        </Box>

        {tab < 2 && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 260px" }, gap: 1.4, p: 2 }}>
            <TextField size="small" label="Qidirish" value={search} onChange={(event) => setSearch(event.target.value)} />
            <TextField size="small" select label="Ombor" value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)}>
              <MenuItem value="">Barcha omborlar</MenuItem>
              {activeWarehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}
            </TextField>
          </Box>
        )}

        {tab === 0 && (
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead><TableRow><TableCell>Element</TableCell><TableCell>Turi</TableCell><TableCell>Ombor</TableCell><TableCell>Qoldiq</TableCell><TableCell>Minimum</TableCell><TableCell>Holat</TableCell>{canManage && <TableCell align="right">Amal</TableCell>}</TableRow></TableHead>
              <TableBody>
                {filteredStock.length ? filteredStock.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 900 }}>{row.item_name || `#${row.item_id}`}</TableCell>
                    <TableCell><Chip size="small" label={itemTypeLabel(row.item_type)} /></TableCell>
                    <TableCell sx={{ fontWeight: 750 }}>{row.warehouse_name}</TableCell>
                    <TableCell sx={{ fontWeight: 950, color: row.is_low ? "#b91c1c" : "#0f172a" }}>{quantity(row.quantity)} {row.unit}</TableCell>
                    <TableCell>{quantity(row.minimum_quantity)} {row.unit}</TableCell>
                    <TableCell><Chip size="small" color={row.is_low ? "error" : "success"} label={row.is_low ? "Kam qolgan" : "Yetarli"} /></TableCell>
                    {canManage && <TableCell align="right"><Button size="small" variant="outlined" onClick={() => { setThresholdRow(row); setThresholdValue(String(row.minimum_quantity || 0)); setThresholdOpen(true); }}>Minimum</Button></TableCell>}
                  </TableRow>
                )) : <TableRow><TableCell colSpan={canManage ? 7 : 6} align="center" sx={{ py: 7, color: "#64748b", fontWeight: 800 }}>Qoldiq topilmadi. Birinchi kirimni qo'shing.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 980 }}>
              <TableHead><TableRow><TableCell>Sana</TableCell><TableCell>Element</TableCell><TableCell>Ombor</TableCell><TableCell>Operatsiya</TableCell><TableCell>Miqdor</TableCell><TableCell>Mas'ul</TableCell><TableCell>Izoh</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredMovements.length ? filteredMovements.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{new Date(row.occurred_at).toLocaleString("uz-UZ")}</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>{row.item_name || `#${row.item_id}`}</TableCell>
                    <TableCell>{row.warehouse_name}</TableCell>
                    <TableCell><Chip size="small" label={movementLabels[row.movement_type] || row.movement_type} /></TableCell>
                    <TableCell sx={{ fontWeight: 950, color: Number(row.quantity_delta) < 0 ? "#b91c1c" : "#15803d" }}>{Number(row.quantity_delta) > 0 ? "+" : ""}{quantity(row.quantity_delta)} {row.unit}</TableCell>
                    <TableCell>{`${row.first_name || ""} ${row.last_name || ""}`.trim() || row.username || "-"}</TableCell>
                    <TableCell sx={{ maxWidth: 260, color: "#64748b" }}>{row.note || "-"}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={7} align="center" sx={{ py: 7, color: "#64748b", fontWeight: 800 }}>Harakatlar topilmadi.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 780 }}>
              <TableHead><TableRow><TableCell>Nomi</TableCell><TableCell>Kodi</TableCell><TableCell>Manzil</TableCell><TableCell>Qoldiq qatorlari</TableCell><TableCell>Holat</TableCell>{canManage && <TableCell align="right">Amallar</TableCell>}</TableRow></TableHead>
              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id} hover>
                    <TableCell sx={{ fontWeight: 950 }}>{warehouse.name} {warehouse.is_default && <Chip size="small" color="primary" label="Asosiy" sx={{ ml: 1 }} />}</TableCell>
                    <TableCell sx={{ fontWeight: 850 }}>{warehouse.code}</TableCell>
                    <TableCell>{warehouse.location || "-"}</TableCell>
                    <TableCell>{warehouse.stock_lines || 0}</TableCell>
                    <TableCell><Chip size="small" color={warehouse.is_active ? "success" : "default"} label={warehouse.is_active ? "Faol" : "Arxiv"} /></TableCell>
                    {canManage && <TableCell align="right"><Stack direction="row" spacing={1} justifyContent="flex-end"><Button size="small" variant="outlined" disabled={!warehouse.is_active} onClick={() => { setEditingWarehouse(warehouse); setWarehouseForm({ name: warehouse.name, code: warehouse.code, location: warehouse.location || "", is_default: Boolean(warehouse.is_default) }); setWarehouseOpen(true); }}>Tahrirlash</Button><Button size="small" color="error" disabled={!warehouse.is_active} onClick={() => removeWarehouse(warehouse)}>Arxiv</Button></Stack></TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <Dialog open={movementOpen} onClose={closeDialogs} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>Ombor kirim / chiqimi</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select label="Ombor" value={movementForm.warehouse_id} onChange={(event) => setMovementForm((current) => ({ ...current, warehouse_id: event.target.value }))}>{activeWarehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}</TextField>
          <TextField select label="Element turi" value={movementForm.item_type} onChange={(event) => setMovementForm((current) => ({ ...current, item_type: event.target.value, item_id: "" }))}><MenuItem value="raw_material">Homashyo</MenuItem><MenuItem value="product">Mahsulot</MenuItem></TextField>
          <TextField select label="Element" value={movementForm.item_id} onChange={(event) => setMovementForm((current) => ({ ...current, item_id: event.target.value }))}>{selectableItems(movementForm.item_type).map((item) => <MenuItem key={`${item.item_type}-${item.item_id}`} value={item.item_id}>{item.name} ({item.unit})</MenuItem>)}</TextField>
          <TextField select label="Operatsiya" value={movementForm.movement_type} onChange={(event) => setMovementForm((current) => ({ ...current, movement_type: event.target.value }))}><MenuItem value="in">Kirim</MenuItem><MenuItem value="out">Chiqim</MenuItem><MenuItem value="opening">Boshlang'ich qoldiq</MenuItem><MenuItem value="adjustment">Tuzatish (+ yoki -)</MenuItem></TextField>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.4 }}><TextField type="number" label="Miqdor" value={movementForm.quantity} onChange={(event) => setMovementForm((current) => ({ ...current, quantity: event.target.value }))} helperText={movementForm.movement_type === "adjustment" ? "Kamaytirish uchun manfiy son" : "Musbat miqdor"} /><TextField type="number" label="Birlik tannarxi" value={movementForm.unit_cost} onChange={(event) => setMovementForm((current) => ({ ...current, unit_cost: event.target.value }))} /></Box>
          <TextField multiline minRows={2} label="Izoh" value={movementForm.note} onChange={(event) => setMovementForm((current) => ({ ...current, note: event.target.value }))} />
        </Stack></DialogContent>
        <DialogActions><Button onClick={closeDialogs}>Bekor qilish</Button><Button variant="contained" disabled={saving} onClick={saveMovement}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button></DialogActions>
      </Dialog>

      <Dialog open={transferOpen} onClose={closeDialogs} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>Omborlar orasida ko'chirish</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select label="Qaysi ombordan" value={transferForm.from_warehouse_id} onChange={(event) => setTransferForm((current) => ({ ...current, from_warehouse_id: event.target.value }))}>{activeWarehouses.map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}</TextField>
          <TextField select label="Qaysi omborga" value={transferForm.to_warehouse_id} onChange={(event) => setTransferForm((current) => ({ ...current, to_warehouse_id: event.target.value }))}>{activeWarehouses.filter((warehouse) => Number(warehouse.id) !== Number(transferForm.from_warehouse_id)).map((warehouse) => <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>)}</TextField>
          <TextField select label="Element turi" value={transferForm.item_type} onChange={(event) => setTransferForm((current) => ({ ...current, item_type: event.target.value, item_id: "" }))}><MenuItem value="raw_material">Homashyo</MenuItem><MenuItem value="product">Mahsulot</MenuItem></TextField>
          <TextField select label="Element" value={transferForm.item_id} onChange={(event) => setTransferForm((current) => ({ ...current, item_id: event.target.value }))}>{selectableItems(transferForm.item_type).map((item) => <MenuItem key={`${item.item_type}-${item.item_id}`} value={item.item_id}>{item.name} ({item.unit})</MenuItem>)}</TextField>
          <TextField type="number" label="Miqdor" value={transferForm.quantity} onChange={(event) => setTransferForm((current) => ({ ...current, quantity: event.target.value }))} />
          <TextField multiline minRows={2} label="Izoh" value={transferForm.note} onChange={(event) => setTransferForm((current) => ({ ...current, note: event.target.value }))} />
        </Stack></DialogContent>
        <DialogActions><Button onClick={closeDialogs}>Bekor qilish</Button><Button variant="contained" disabled={saving || activeWarehouses.length < 2} onClick={saveTransfer}>{saving ? "Ko'chirilmoqda..." : "Ko'chirish"}</Button></DialogActions>
      </Dialog>

      <Dialog open={warehouseOpen} onClose={closeDialogs} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>{editingWarehouse ? "Omborni tahrirlash" : "Yangi ombor"}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField label="Ombor nomi" value={warehouseForm.name} onChange={(event) => setWarehouseForm((current) => ({ ...current, name: event.target.value }))} /><TextField label="Ombor kodi" value={warehouseForm.code} onChange={(event) => setWarehouseForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} helperText="Masalan: MAIN yoki CHILONZOR" /><TextField label="Manzil" value={warehouseForm.location} onChange={(event) => setWarehouseForm((current) => ({ ...current, location: event.target.value }))} /><TextField select label="Turi" value={warehouseForm.is_default ? "default" : "regular"} onChange={(event) => setWarehouseForm((current) => ({ ...current, is_default: event.target.value === "default" }))}><MenuItem value="regular">Oddiy ombor</MenuItem><MenuItem value="default">Asosiy ombor</MenuItem></TextField></Stack></DialogContent>
        <DialogActions><Button onClick={closeDialogs}>Bekor qilish</Button><Button variant="contained" disabled={saving} onClick={saveWarehouse}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button></DialogActions>
      </Dialog>

      <Dialog open={thresholdOpen} onClose={closeDialogs} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 950 }}>Minimal qoldiq</DialogTitle>
        <DialogContent><Typography sx={{ mb: 2, color: "#64748b" }}>{thresholdRow?.item_name} — {thresholdRow?.warehouse_name}</Typography><TextField fullWidth type="number" label="Ogohlantirish miqdori" value={thresholdValue} onChange={(event) => setThresholdValue(event.target.value)} inputProps={{ min: 0, step: 0.001 }} /></DialogContent>
        <DialogActions><Button onClick={closeDialogs}>Bekor qilish</Button><Button variant="contained" disabled={saving} onClick={saveThreshold}>Saqlash</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
