import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  createMaterialPurchase,
  createRawMaterial,
  createSupplier,
  createSupplierPayment,
  deleteSupplier,
  deleteMaterialPurchase,
  getMaterialPurchases,
  getRawMaterials,
  getSupplierBalance,
  getSuppliers,
  updateSupplier,
} from "../../api/materialPurchases";
import CrmPagination from "../../Components/Common/CrmPagination";

const today = () => new Date().toISOString().slice(0, 10);
const emptyPurchase = {
  supplier_id: "",
  purchased_at: today(),
  paid_amount: "",
  note: "",
  items: [{ raw_material_id: "", quantity: "", unit_price: "" }],
};
const emptySupplier = {
  name: "",
  phone: "",
  address: "",
  opening_balance: "",
  note: "",
};
const emptyMaterial = { name: "", unit: "dona", note: "" };
const emptyPayment = {
  supplier_id: "",
  amount: "",
  paid_at: today(),
  note: "",
};

const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
const date = (value) => (value ? new Date(value).toLocaleDateString("uz-UZ") : "-");

const Stat = ({ label, value }) => (
  <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <Typography variant="body2" className="text-slate-500">
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={800}>
      {value}
    </Typography>
  </Box>
);

const MaterialPurchases = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, offset: 0, limit: 10 });
  const [balance, setBalance] = useState({
    opening_balance: 0,
    total_purchase: 0,
    total_paid: 0,
    debt_amount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    q: "",
    supplier_id: "",
    date_from: "",
    date_to: "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchase);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState(null);
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [quickMaterialOpen, setQuickMaterialOpen] = useState(false);
  const [quickMaterialIndex, setQuickMaterialIndex] = useState(0);
  const [quickMaterialForm, setQuickMaterialForm] = useState(emptyMaterial);
  const [saving, setSaving] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);
  const openingPeriodDebt = Math.max(
    0,
    Number(balance.debt_amount || 0) -
      (Number(balance.total_purchase || 0) - Number(balance.total_paid || 0)),
  );
  const subtotal = useMemo(
    () =>
      purchaseForm.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
        0,
      ),
    [purchaseForm.items],
  );
  const selectedSupplier = suppliers.find(
    (item) => Number(item.id) === Number(purchaseForm.supplier_id),
  );
  const previousDebt = Number(selectedSupplier?.current_debt || 0);

  const fetchDictionaries = useCallback(async () => {
    try {
      const [suppliersRes, materialsRes] = await Promise.all([
        getSuppliers({ limit: 100 }),
        getRawMaterials({ limit: 100 }),
      ]);
      const rows = suppliersRes.data.suppliers || [];
      const withBalances = await Promise.all(
        rows.map(async (supplier) => {
          const { data } = await getSupplierBalance({
            supplier_id: supplier.id,
          });
          return { ...supplier, current_debt: data.debt_amount || 0 };
        }),
      );
      setSuppliers(withBalances);
      setMaterials(materialsRes.data.raw_materials || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ma'lumotlarni olishda xato.");
    }
  }, []);

  const fetchPurchases = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);
      try {
        const params = { offset, limit, sort_order: "desc" };
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== "") params[key] = value;
        });
        const [purchasesRes, balanceRes] = await Promise.all([
          getMaterialPurchases(params),
          getSupplierBalance({
            supplier_id: filters.supplier_id || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
          }),
        ]);
        setPurchases(purchasesRes.data.material_purchases || []);
        setPageInfo(purchasesRes.data.pageInfo || { total: 0, offset, limit });
        setBalance(
          balanceRes.data || {
            opening_balance: 0,
            total_purchase: 0,
            total_paid: 0,
            debt_amount: 0,
          },
        );
      } catch (error) {
        toast.error(error?.response?.data?.message || "Xaridlarni olishda xato.");
      } finally {
        setLoading(false);
      }
    },
    [filters, pageInfo.limit],
  );

  useEffect(() => {
    fetchDictionaries();
  }, [fetchDictionaries]);
  useEffect(() => {
    const timer = setTimeout(() => fetchPurchases(0, pageInfo.limit), 250);
    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit]);

  const close = () => {
    setPurchaseOpen(false);
    setSupplierOpen(false);
    setMaterialOpen(false);
    setPaymentOpen(false);
    setQuickMaterialOpen(false);
    setPurchaseForm(emptyPurchase);
    setSupplierForm(emptySupplier);
    setSelectedSupplierForEdit(null);
    setMaterialForm(emptyMaterial);
    setPaymentForm(emptyPayment);
  };
  const refresh = () => {
    fetchDictionaries();
    fetchPurchases(pageInfo.offset, pageInfo.limit);
  };
  const changeItem = (index, field, value) =>
    setPurchaseForm((previous) => ({
      ...previous,
      items: previous.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));

  const saveSupplier = async () => {
    if (!supplierForm.name.trim()) return toast.error("Ta'minotchi nomini kiriting.");
    setSaving(true);
    try {
      const payload = {
        ...supplierForm,
        opening_balance: Number(supplierForm.opening_balance || 0),
      };
      if (selectedSupplierForEdit) {
        await updateSupplier(selectedSupplierForEdit.id, payload);
        toast.success("Ta'minotchi yangilandi.");
      } else {
        await createSupplier(payload);
        toast.success("Ta'minotchi qo'shildi.");
      }
      setSupplierForm(emptySupplier);
      setSelectedSupplierForEdit(null);
      await fetchDictionaries();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };
  const editSupplier = (supplier) => {
    setSelectedSupplierForEdit(supplier);
    setSupplierForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      opening_balance: supplier.opening_balance ?? "",
      note: supplier.note || "",
    });
  };
  const removeSupplier = async (supplier) => {
    if (!window.confirm(`${supplier.name} ta'minotchisini o'chirmoqchimisiz?`)) return;
    try {
      await deleteSupplier(supplier.id);
      toast.success("Ta'minotchi o'chirildi.");
      if (selectedSupplierForEdit?.id === supplier.id) {
        setSelectedSupplierForEdit(null);
        setSupplierForm(emptySupplier);
      }
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ta'minotchini o'chirishda xato.");
    }
  };
  const saveMaterial = async () => {
    if (!materialForm.name.trim()) return toast.error("Homashyo nomini kiriting.");
    setSaving(true);
    try {
      await createRawMaterial(materialForm);
      toast.success("Homashyo qo'shildi.");
      close();
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };
  const saveQuickMaterial = async () => {
    if (!quickMaterialForm.name.trim()) return toast.error("Homashyo nomini kiriting.");
    setSaving(true);
    try {
      const { data } = await createRawMaterial(quickMaterialForm);
      const newMaterial = data.raw_material;
      setMaterials((previous) => [...previous, newMaterial]);
      changeItem(quickMaterialIndex, "raw_material_id", newMaterial.id);
      setQuickMaterialOpen(false);
      setQuickMaterialForm(emptyMaterial);
      toast.success("Homashyo yaratildi va qatorga tanlandi.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Homashyoni yaratishda xato.");
    } finally {
      setSaving(false);
    }
  };
  const savePurchase = async () => {
    if (
      !purchaseForm.supplier_id ||
      purchaseForm.items.some(
        (item) =>
          !item.raw_material_id || Number(item.quantity) <= 0 || Number(item.unit_price) < 0,
      )
    )
      return toast.error("Ta'minotchi va barcha homashyo qatorlarini to'ldiring.");
    setSaving(true);
    try {
      await createMaterialPurchase({
        ...purchaseForm,
        supplier_id: Number(purchaseForm.supplier_id),
        paid_amount: Number(purchaseForm.paid_amount || 0),
        items: purchaseForm.items.map((item) => ({
          raw_material_id: Number(item.raw_material_id),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      });
      toast.success("Homashyo xaridi saqlandi.");
      close();
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xaridni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };
  const savePayment = async () => {
    if (!paymentForm.supplier_id || Number(paymentForm.amount) <= 0)
      return toast.error("Ta'minotchi va summani kiriting.");
    setSaving(true);
    try {
      await createSupplierPayment({
        ...paymentForm,
        supplier_id: Number(paymentForm.supplier_id),
        amount: Number(paymentForm.amount),
      });
      toast.success("Ta'minotchi to'lovi saqlandi.");
      close();
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "To'lovni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="crm-page flex h-full min-h-0 flex-col">
      <Box className="mb-5 flex shrink-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Homashyo xaridi
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            Qayerdan, nima, qancha va nech pulga kelganini nazorat qilish
          </Typography>
        </Box>
        <Box className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Tanlangan davr xaridi" value={money(balance.total_purchase)} />
          <Stat label="Tanlangan davrda berildi" value={money(balance.total_paid)} />
          <Stat label="Oldingi qarz" value={money(openingPeriodDebt)} />
          <Stat label="Umumiy qarz" value={money(balance.debt_amount)} />
        </Box>
      </Box>

      <Paper elevation={0} className="mb-4 shrink-0 rounded-2xl border border-slate-200 p-4">
        <Box className="flex flex-col gap-3">
          <Box className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Box className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TextField
                size="small"
                label="Qidirish"
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") fetchPurchases(0, pageInfo.limit);
                }}
              />
              <TextField
                select
                size="small"
                label="Ta'minotchi"
                value={filters.supplier_id}
                onChange={(e) => setFilters((p) => ({ ...p, supplier_id: e.target.value }))}
              >
                <MenuItem value="">Barchasi</MenuItem>
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="text" onClick={() => setFiltersOpen((open) => !open)}>
                {filtersOpen ? "Filtrlarni yopish" : "Batafsil filtrlar"}
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => {
                  setFilters({ q: "", supplier_id: "", date_from: "", date_to: "" });
                  setFiltersOpen(false);
                }}
              >
                Tozalash
              </Button>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "nowrap" }}>
              <Button variant="outlined" onClick={() => setSupplierOpen(true)}>
                Ta'minotchilar
              </Button>
              <Button variant="outlined" onClick={() => setMaterialOpen(true)}>
                Homashyo
              </Button>
              <Button variant="outlined" onClick={() => setPaymentOpen(true)}>
                To'lov
              </Button>
              <Button variant="contained" onClick={() => setPurchaseOpen(true)}>
                Xarid qo'shish
              </Button>
            </Stack>
          </Box>

          {filtersOpen && (
            <Box className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
              <TextField
                size="small"
                type="date"
                label="Dan"
                value={filters.date_from}
                onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                size="small"
                type="date"
                label="Gacha"
                value={filters.date_to}
                onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          )}
        </Box>
      </Paper>

      <Paper
        elevation={0}
        className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white"
      >
        <Box className="min-h-0 flex-1 overflow-auto">
          <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell width="42%">Ta'minotchi va homashyolar</TableCell>
                <TableCell width="28%">Ushbu xarid hisobi</TableCell>
                <TableCell width="15%">Sana va izoh</TableCell>
                <TableCell align="right">Amal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : purchases.length ? (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id} hover>
                    <TableCell>
                      <Typography fontWeight={800}>{purchase.supplier_name}</Typography>
                      {purchase.items.map((item) => (
                        <Typography key={item.id} variant="body2">
                          {item.material_name}: {Number(item.quantity)} {item.unit} ×{" "}
                          {money(item.unit_price)}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={800}>Jami: {money(purchase.subtotal)}</Typography>
                      <Typography variant="body2" className="text-emerald-700">
                        Berildi: {money(purchase.paid_amount)}
                      </Typography>
                      <Typography variant="body2" className="text-red-700">
                        Qarz qo'shildi: {money(purchase.debt_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{date(purchase.purchased_at)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {purchase.note || "Izoh yo'q"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={async () => {
                          if (!confirm("Xarid o'chirilsinmi?")) return;
                          await deleteMaterialPurchase(purchase.id);
                          refresh();
                        }}
                      >
                        O'chirish
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Xaridlar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        <CrmPagination total={pageInfo.total} page={page} limit={pageInfo.limit} onPageChange={(nextPage) => fetchPurchases(nextPage * pageInfo.limit, pageInfo.limit)} onLimitChange={(limit) => fetchPurchases(0, limit)} />
      </Paper>

      <Dialog open={purchaseOpen} onClose={close} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>Homashyo xaridi</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                select
                label="Ta'minotchi"
                value={purchaseForm.supplier_id}
                onChange={(e) =>
                  setPurchaseForm((p) => ({
                    ...p,
                    supplier_id: e.target.value,
                  }))
                }
              >
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="date"
                label="Xarid sanasi"
                value={purchaseForm.purchased_at}
                onChange={(e) =>
                  setPurchaseForm((p) => ({
                    ...p,
                    purchased_at: e.target.value,
                  }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            {purchaseForm.items.map((item, index) => (
              <Box
                key={index}
                className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.5fr_1fr_1fr_auto]"
              >
                <Box>
                  <TextField
                    select
                    fullWidth
                    label="Homashyo"
                    value={item.raw_material_id}
                    onChange={(e) => changeItem(index, "raw_material_id", e.target.value)}
                  >
                    {materials.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name} ({m.unit})
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    size="small"
                    sx={{ mt: 0.5, px: 0 }}
                    onClick={() => {
                      setQuickMaterialIndex(index);
                      setQuickMaterialForm(emptyMaterial);
                      setQuickMaterialOpen(true);
                    }}
                  >
                    Yangi homashyo yaratish
                  </Button>
                </Box>
                <TextField
                  type="number"
                  label="Miqdor"
                  value={item.quantity}
                  onChange={(e) => changeItem(index, "quantity", e.target.value)}
                />
                <TextField
                  type="number"
                  label="Birlik narxi"
                  value={item.unit_price}
                  onChange={(e) => changeItem(index, "unit_price", e.target.value)}
                />
                <Button
                  color="error"
                  disabled={purchaseForm.items.length === 1}
                  onClick={() =>
                    setPurchaseForm((p) => ({
                      ...p,
                      items: p.items.filter((_, i) => i !== index),
                    }))
                  }
                >
                  Olib tashlash
                </Button>
              </Box>
            ))}
            {quickMaterialOpen && (
              <Box className="grid grid-cols-1 gap-3 rounded-xl border border-slate-300 bg-slate-50 p-4 sm:grid-cols-[1.5fr_1fr_auto_auto]">
                <TextField
                  size="small"
                  label="Yangi homashyo nomi"
                  value={quickMaterialForm.name}
                  onChange={(e) => setQuickMaterialForm((p) => ({ ...p, name: e.target.value }))}
                />
                <TextField
                  size="small"
                  label="Birligi"
                  value={quickMaterialForm.unit}
                  onChange={(e) => setQuickMaterialForm((p) => ({ ...p, unit: e.target.value }))}
                  helperText="dona, kg, metr, litr"
                />
                <Button variant="contained" disabled={saving} onClick={saveQuickMaterial}>
                  Yaratish
                </Button>
                <Button onClick={() => setQuickMaterialOpen(false)}>Bekor qilish</Button>
              </Box>
            )}
            <Button
              variant="outlined"
              onClick={() =>
                setPurchaseForm((p) => ({
                  ...p,
                  items: [...p.items, { raw_material_id: "", quantity: "", unit_price: "" }],
                }))
              }
            >
              Yana homashyo
            </Button>
            <TextField
              type="number"
              label="To'lanadigan summa"
              value={purchaseForm.paid_amount}
              onChange={(e) => setPurchaseForm((p) => ({ ...p, paid_amount: e.target.value }))}
              slotProps={{ htmlInput: { min: 0, step: 1000 } }}
            />
            <Box className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Xarid" value={money(subtotal)} />
              <Stat label="Oldingi qarz" value={money(previousDebt)} />
              <Stat label="Beriladi" value={money(purchaseForm.paid_amount)} />
              <Stat
                label="Yangi qarz"
                value={money(previousDebt + subtotal - Number(purchaseForm.paid_amount || 0))}
              />
            </Box>
            <TextField
              multiline
              minRows={2}
              label="Izoh"
              value={purchaseForm.note}
              onChange={(e) => setPurchaseForm((p) => ({ ...p, note: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Bekor qilish</Button>
          <Button variant="contained" disabled={saving} onClick={savePurchase}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={supplierOpen} onClose={close} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>Ta'minotchilar</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} className="pt-1">
            <Typography fontWeight={700}>
              {selectedSupplierForEdit ? "Ta'minotchini tahrirlash" : "Yangi ta'minotchi"}
            </Typography>
            <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField
                label="Nomi"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm((p) => ({ ...p, name: e.target.value }))}
              />
              <TextField
                label="Telefon"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm((p) => ({ ...p, phone: e.target.value }))}
              />
              <TextField
                label="Manzil"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm((p) => ({ ...p, address: e.target.value }))}
              />
              <TextField
                type="number"
                label="Boshlang'ich qarz"
                value={supplierForm.opening_balance}
                onChange={(e) =>
                  setSupplierForm((p) => ({
                    ...p,
                    opening_balance: e.target.value,
                  }))
                }
              />
            </Box>
            <TextField
              multiline
              minRows={2}
              label="Izoh"
              value={supplierForm.note}
              onChange={(e) => setSupplierForm((p) => ({ ...p, note: e.target.value }))}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {selectedSupplierForEdit && (
                <Button
                  onClick={() => {
                    setSelectedSupplierForEdit(null);
                    setSupplierForm(emptySupplier);
                  }}
                >
                  Tozalash
                </Button>
              )}
              <Button variant="contained" disabled={saving} onClick={saveSupplier}>
                {saving ? "Saqlanmoqda..." : selectedSupplierForEdit ? "Yangilash" : "Qo'shish"}
              </Button>
            </Stack>
          </Stack>

          <Box className="mt-5 overflow-auto rounded-xl border border-slate-200">
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Nomi</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Telefon</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Manzil</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Boshlang'ich qarz</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hozirgi qarz</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Amallar
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.length ? (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>{supplier.name}</Typography>
                      </TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell>{supplier.address || "-"}</TableCell>
                      <TableCell>{money(supplier.opening_balance)}</TableCell>
                      <TableCell>
                        <Typography fontWeight={700}>{money(supplier.current_debt)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => editSupplier(supplier)}
                          >
                            O'zgartirish
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => removeSupplier(supplier)}
                          >
                            O'chirish
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Ta'minotchilar topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Yopish</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={materialOpen} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Homashyo qo'shish</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <TextField
              label="Nomi"
              value={materialForm.name}
              onChange={(e) => setMaterialForm((p) => ({ ...p, name: e.target.value }))}
            />
            <TextField
              label="O'lchov birligi"
              value={materialForm.unit}
              onChange={(e) => setMaterialForm((p) => ({ ...p, unit: e.target.value }))}
              helperText="dona, kg, metr yoki litr"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Bekor qilish</Button>
          <Button variant="contained" disabled={saving} onClick={saveMaterial}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={paymentOpen} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Ta'minotchiga to'lov</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <TextField
              select
              label="Ta'minotchi"
              value={paymentForm.supplier_id}
              onChange={(e) => setPaymentForm((p) => ({ ...p, supplier_id: e.target.value }))}
            >
              {suppliers.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name} — qarz {money(s.current_debt)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="number"
              label="Summa"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
            />
            <TextField
              type="date"
              label="Sana"
              value={paymentForm.paid_at}
              onChange={(e) => setPaymentForm((p) => ({ ...p, paid_at: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              multiline
              minRows={2}
              label="Izoh"
              value={paymentForm.note}
              onChange={(e) => setPaymentForm((p) => ({ ...p, note: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Bekor qilish</Button>
          <Button variant="contained" disabled={saving} onClick={savePayment}>
            To'lov qilish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MaterialPurchases;
