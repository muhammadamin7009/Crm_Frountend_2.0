import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";

import SharedHeroMetric from "../../Components/UI/HeroMetric";
import SharedPremiumDialog from "../../Components/UI/PremiumDialog";
import BalanceBox from "../../Components/UI/BalanceBox";

import Card from "../../Components/UI/AppCard";
import {
  createMaterialPurchase,
  createRawMaterial,
  createSupplier,
  createSupplierPayment,
  deleteMaterialPurchase,
  deleteSupplier,
  getMaterialPurchases,
  getRawMaterialStock,
  getRawMaterials,
  getSupplierBalance,
  getSuppliers,
  updateSupplier,
} from "../../api/materialPurchases";
import CrmPagination from "../../Components/Common/CrmPagination";
import { useAuth } from "../../Context/AuthContext";
import { hasPermission } from "../../utils/permissions";

const today = () => new Date().toISOString().slice(0, 10);

const emptyPurchase = {
  supplier_id: "",
  purchased_at: today(),
  paid_amount: "",
  note: "",
  items: [
    {
      raw_material_id: "",
      quantity: "",
      unit_price: "",
    },
  ],
};

const emptySupplier = {
  name: "",
  phone: "",
  address: "",
  opening_balance: "",
  note: "",
};

const emptyMaterial = {
  name: "",
  unit: "dona",
  note: "",
};

const emptyPayment = {
  supplier_id: "",
  amount: "",
  paid_at: today(),
  note: "",
};

const emptyBalance = {
  opening_balance: 0,
  total_purchase: 0,
  total_paid: 0,
  debt_amount: 0,
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const date = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const initial = (value) =>
  String(value || "T")
    .trim()
    .slice(0, 1)
    .toUpperCase();

const HeroMetric = (props) => (
  <SharedHeroMetric {...props} valueSx={{ fontSize: 17 }} />
);

const DebtChip = ({ value }) => {
  const hasDebt = Number(value || 0) > 0;

  return (
    <Chip
      size="small"
      label={hasDebt ? `Qarz: ${money(value)}` : "Qarz yopilgan"}
      sx={{
        height: 25,

        color: hasDebt ? "#b45309" : "#15803d",

        fontSize: 9.5,
        fontWeight: 900,

        backgroundColor: hasDebt ? "rgba(245,158,11,.10)" : "rgba(34,197,94,.09)",

        border: hasDebt ? "1px solid rgba(245,158,11,.20)" : "1px solid rgba(34,197,94,.18)",
      }}
    />
  );
};

const PremiumDialog = (props) => <SharedPremiumDialog maxWidth="md" subtitle="Homashyo, ta’minotchi va qarzdorlik ma’lumotlari" titleClassName="material-purchases-dialog-title" {...props} />;
const MaterialPurchases = () => {
  const auth = useAuth();

  const currentUser = auth?.user || getLocalUser();

  const canManage =
    ["super_admin", "admin"].includes(currentUser?.role) &&
    hasPermission(currentUser, "material_purchases.manage");

  const [suppliers, setSuppliers] = useState([]);

  const [materials, setMaterials] = useState([]);

  const [purchases, setPurchases] = useState([]);

  const [stockRows, setStockRows] = useState([]);

  const [pageInfo, setPageInfo] = useState({
    total: 0,
    offset: 0,
    limit: 10,
  });

  const [balance, setBalance] = useState(emptyBalance);

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

  const [selectedSupplierForDelete, setSelectedSupplierForDelete] = useState(null);

  const [materialForm, setMaterialForm] = useState(emptyMaterial);

  const [paymentForm, setPaymentForm] = useState(emptyPayment);

  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const [supplierOpen, setSupplierOpen] = useState(false);

  const [materialOpen, setMaterialOpen] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);

  const [quickMaterialOpen, setQuickMaterialOpen] = useState(false);

  const [quickMaterialIndex, setQuickMaterialIndex] = useState(0);

  const [quickMaterialForm, setQuickMaterialForm] = useState(emptyMaterial);

  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [supplierDeleteOpen, setSupplierDeleteOpen] = useState(false);

  const [deleting, setDeleting] = useState(false);

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

  const selectedSupplier = useMemo(
    () => suppliers.find((item) => Number(item.id) === Number(purchaseForm.supplier_id)),

    [purchaseForm.supplier_id, suppliers],
  );

  const selectedPaymentSupplier = useMemo(
    () => suppliers.find((item) => Number(item.id) === Number(paymentForm.supplier_id)),

    [paymentForm.supplier_id, suppliers],
  );

  const previousDebt = Number(selectedSupplier?.current_debt || 0);

  const paidAmount = Number(purchaseForm.paid_amount || 0);

  const newDebt = previousDebt + subtotal - paidAmount;

  const paymentCurrentDebt = Number(selectedPaymentSupplier?.current_debt || 0);

  const paymentAfterDebt = Math.max(
    paymentCurrentDebt - Number(paymentForm.amount || 0),

    0,
  );

  const totalStockQuantity = useMemo(
    () =>
      stockRows.reduce(
        (sum, item) => sum + Number(item.total_quantity || 0),

        0,
      ),

    [stockRows],
  );

  const fetchDictionaries = useCallback(async () => {
    try {
      const [suppliersRes, materialsRes] = await Promise.all([
        getSuppliers({
          limit: 100,
        }),

        getRawMaterials({
          limit: 100,
        }),
      ]);

      const rows = suppliersRes.data.suppliers || [];

      const withBalances = await Promise.all(
        rows.map(async (supplier) => {
          const { data } = await getSupplierBalance({
            supplier_id: supplier.id,
          });

          const balanceData = data?.balance || data || {};

          return {
            ...supplier,

            current_debt: balanceData.debt_amount || 0,
          };
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
        const params = {
          offset,
          limit,
          sort_order: "desc",
        };

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== "") {
            params[key] = value;
          }
        });

        const [purchasesRes, balanceRes, stockRes] = await Promise.all([
          getMaterialPurchases(params),

          getSupplierBalance({
            supplier_id: filters.supplier_id || undefined,

            date_from: filters.date_from || undefined,

            date_to: filters.date_to || undefined,
          }),

          getRawMaterialStock({
            q: filters.q || undefined,

            date_from: filters.date_from || undefined,

            date_to: filters.date_to || undefined,

            limit: 8,
          }),
        ]);

        setPurchases(purchasesRes.data.material_purchases || []);

        setStockRows(stockRes.data.stock || []);

        setPageInfo(
          purchasesRes.data.pageInfo || {
            total: 0,
            offset,
            limit,
          },
        );

        setBalance({
          ...emptyBalance,

          ...(balanceRes.data?.balance || balanceRes.data || {}),
        });
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
    const timer = setTimeout(
      () => fetchPurchases(0, pageInfo.limit),

      250,
    );

    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit, fetchPurchases]);

  const resetFilters = () => {
    setFilters({
      q: "",
      supplier_id: "",
      date_from: "",
      date_to: "",
    });

    setFiltersOpen(false);
  };

  const close = () => {
    setPurchaseOpen(false);
    setSupplierOpen(false);
    setMaterialOpen(false);
    setPaymentOpen(false);
    setQuickMaterialOpen(false);
    setDeleteOpen(false);
    setSupplierDeleteOpen(false);
    setSelectedPurchase(null);
    setSelectedSupplierForDelete(null);

    setPurchaseForm({
      ...emptyPurchase,
      purchased_at: today(),

      items: [
        {
          raw_material_id: "",
          quantity: "",
          unit_price: "",
        },
      ],
    });

    setSupplierForm(emptySupplier);

    setSelectedSupplierForEdit(null);

    setMaterialForm(emptyMaterial);

    setPaymentForm({
      ...emptyPayment,
      paid_at: today(),
    });

    setQuickMaterialForm(emptyMaterial);
  };

  const refresh = () => {
    fetchDictionaries();

    fetchPurchases(pageInfo.offset, pageInfo.limit);
  };

  const confirmDeletePurchase = async () => {
    if (!selectedPurchase || deleting) {
      return;
    }

    setDeleting(true);

    try {
      await deleteMaterialPurchase(selectedPurchase.id);

      toast.success("Xarid o'chirildi.");

      close();
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xaridni o'chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const changeItem = (index, field, value) => {
    setPurchaseForm((previous) => ({
      ...previous,

      items: previous.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
  };

  const saveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast.error("Ta'minotchi nomini kiriting.");

      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...supplierForm,

        name: supplierForm.name.trim(),

        phone: supplierForm.phone.trim() || null,

        address: supplierForm.address.trim() || null,

        opening_balance: Number(supplierForm.opening_balance || 0),

        note: supplierForm.note.trim() || null,
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

  const removeSupplier = (supplier) => {
    setSelectedSupplierForDelete(supplier);

    setSupplierDeleteOpen(true);
  };

  const confirmRemoveSupplier = async () => {
    if (!selectedSupplierForDelete || deleting) {
      return;
    }

    setDeleting(true);

    try {
      await deleteSupplier(selectedSupplierForDelete.id);

      toast.success("Ta'minotchi o'chirildi.");

      if (selectedSupplierForEdit?.id === selectedSupplierForDelete.id) {
        setSelectedSupplierForEdit(null);

        setSupplierForm(emptySupplier);
      }

      close();
      refresh();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ta'minotchini o'chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const saveMaterial = async () => {
    if (!materialForm.name.trim()) {
      toast.error("Homashyo nomini kiriting.");

      return;
    }

    setSaving(true);

    try {
      await createRawMaterial({
        name: materialForm.name.trim(),

        unit: materialForm.unit.trim() || "dona",

        note: materialForm.note.trim() || null,
      });

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
    if (!quickMaterialForm.name.trim()) {
      toast.error("Homashyo nomini kiriting.");

      return;
    }

    setSaving(true);

    try {
      const { data } = await createRawMaterial({
        name: quickMaterialForm.name.trim(),

        unit: quickMaterialForm.unit.trim() || "dona",

        note: quickMaterialForm.note.trim() || null,
      });

      const newMaterial = data.raw_material || data.material || data;

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
    ) {
      toast.error("Ta'minotchi va barcha homashyo qatorlarini to'ldiring.");

      return;
    }

    if (Number(purchaseForm.paid_amount || 0) < 0) {
      toast.error("To'langan summa manfiy bo'lmasin.");

      return;
    }

    setSaving(true);

    try {
      await createMaterialPurchase({
        ...purchaseForm,

        supplier_id: Number(purchaseForm.supplier_id),

        paid_amount: Number(purchaseForm.paid_amount || 0),

        note: purchaseForm.note.trim() || null,

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
    if (!paymentForm.supplier_id || Number(paymentForm.amount) <= 0) {
      toast.error("Ta'minotchi va summani kiriting.");

      return;
    }

    setSaving(true);

    try {
      await createSupplierPayment({
        ...paymentForm,

        supplier_id: Number(paymentForm.supplier_id),

        amount: Number(paymentForm.amount),

        note: paymentForm.note.trim() || null,
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
    <Box
      className="crm-page material-purchases-page"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2.5,
      }}
    >
      <style>{materialPurchasesStyles}</style>

      <Box component="section" className="material-purchases-hero" sx={heroSx}>
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

              <Typography sx={eyebrowSx}>Xarid va ta’minot markazi</Typography>
            </Box>

            <Typography component="h1" sx={heroTitleSx}>
              Homashyo xaridi
            </Typography>

            <Typography sx={heroDescriptionSx}>
              Ta’minotchilar, homashyo kirimi, xarid summalari, to‘lovlar va qarzdorlikni yagona
              sahifada boshqaring.
            </Typography>

            {canManage && (
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1.1}
                sx={{ mt: 2.4 }}
              >
                <Button
                  onClick={() => {
                    setPurchaseForm({
                      ...emptyPurchase,

                      purchased_at: today(),

                      supplier_id: filters.supplier_id || "",

                      items: [
                        {
                          raw_material_id: "",

                          quantity: "",

                          unit_price: "",
                        },
                      ],
                    });

                    setPurchaseOpen(true);
                  }}
                  sx={heroPrimaryButtonSx}
                >
                  + Xarid qo‘shish
                </Button>

                <Button
                  onClick={() => {
                    setPaymentForm({
                      ...emptyPayment,

                      paid_at: today(),

                      supplier_id: filters.supplier_id || "",
                    });

                    setPaymentOpen(true);
                  }}
                  sx={heroSecondaryButtonSx}
                >
                  Ta’minotchiga to‘lov
                </Button>
              </Stack>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2,minmax(0,1fr))",

                lg: "repeat(5,minmax(0,1fr))",
              },

              gap: 1.2,
            }}
          >
            <HeroMetric
              label="Davr xaridi"
              value={money(balance.total_purchase)}
              helper="Tanlangan davrdagi xarid"
              tone="blue"
            />

            <HeroMetric
              label="Berilgan"
              value={money(balance.total_paid)}
              helper="Ta’minotchilarga to‘langan"
              tone="green"
            />

            <HeroMetric
              label="Oldingi qarz"
              value={money(openingPeriodDebt)}
              helper="Davr boshidagi majburiyat"
              tone="amber"
            />

            <HeroMetric
              label="Umumiy qarz"
              value={money(balance.debt_amount)}
              helper="Hozirgi ta’minotchi qarzi"
              tone="red"
            />

            <HeroMetric
              label="Xaridlar"
              value={number(pageInfo.total)}
              helper="Jami xarid yozuvlari"
              tone="violet"
            />
          </Box>
        </Box>
      </Box>

      <Card
        sx={{
          mb: 2,
          p: 2,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            mb: 1.6,
            display: "flex",

            alignItems: {
              xs: "flex-start",
              sm: "center",
            },

            justifyContent: "space-between",

            flexDirection: {
              xs: "column",
              sm: "row",
            },

            gap: 1.4,
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
              Homashyo kirim hisoboti
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "#94a3b8",
                fontSize: 10.5,
              }}
            >
              Tanlangan davrda kelgan homashyo miqdori, summasi va o‘rtacha narxi
            </Typography>
          </Box>

          <Stack direction="row" spacing={0.8}>
            <Chip size="small" label={`${number(stockRows.length)} tur`} sx={softBlueChipSx} />

            <Chip
              size="small"
              label={`${number(totalStockQuantity)} birlik`}
              sx={softGreenChipSx}
            />
          </Stack>
        </Box>

        {stockRows.length ? (
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2,minmax(0,1fr))",

                xl: "repeat(4,minmax(0,1fr))",
              },

              gap: 1.2,
            }}
          >
            {stockRows.map((item, index) => (
              <Box key={item.id || `${item.name}-${index}`} sx={stockCardSx}>
                <Box
                  sx={{
                    position: "relative",

                    zIndex: 1,

                    display: "flex",

                    alignItems: "center",

                    gap: 1.2,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,

                      display: "grid",

                      placeItems: "center",

                      flexShrink: 0,

                      color: "#ffffff",

                      borderRadius: "13px",

                      background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",

                      fontWeight: 950,
                    }}
                  >
                    {initial(item.name)}
                  </Box>

                  <Box
                    sx={{
                      minWidth: 0,
                    }}
                  >
                    <Typography
                      noWrap
                      sx={{
                        color: "#334155",

                        fontSize: 12,

                        fontWeight: 950,
                      }}
                    >
                      {item.name}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.3,

                        color: "#94a3b8",

                        fontSize: 9.5,
                      }}
                    >
                      {number(item.total_quantity)} {item.unit || "birlik"}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    position: "relative",

                    zIndex: 1,

                    mt: 1.4,
                    pt: 1.3,

                    display: "grid",

                    gridTemplateColumns: "1fr 1fr",

                    gap: 1,

                    borderTop: "1px solid #edf0f3",
                  }}
                >
                  <Box>
                    <Typography sx={tinyLabelSx}>Jami summa</Typography>

                    <Typography sx={greenValueSx}>{money(item.total_amount)}</Typography>
                  </Box>

                  <Box>
                    <Typography sx={tinyLabelSx}>O‘rtacha narx</Typography>

                    <Typography sx={darkValueSx}>{money(item.average_price)}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={emptyStateSx}>
            <Typography sx={emptyTextSx}>
              Tanlangan davr bo‘yicha homashyo kirimi topilmadi.
            </Typography>
          </Box>
        )}
      </Card>

      <Card
        sx={{
          mb: 2,
          p: 2,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",

            alignItems: {
              xs: "stretch",
              xl: "start",
            },

            justifyContent: "space-between",

            flexDirection: {
              xs: "column",
              xl: "row",
            },

            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2,minmax(0,1fr))",

                lg: "repeat(4,minmax(0,1fr))",
              },

              gap: 1.2,
              flex: 1,
            }}
          >
            <TextField
              size="small"
              label="Qidirish"
              placeholder="Ta’minotchi yoki homashyo"
              value={filters.q}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,

                  q: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  fetchPurchases(0, pageInfo.limit);
                }
              }}
            />

            <TextField
              select
              size="small"
              label="Ta’minotchi"
              value={filters.supplier_id}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,

                  supplier_id: event.target.value,
                }))
              }
            >
              <MenuItem value="">Barchasi</MenuItem>

              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              onClick={() => setFiltersOpen((open) => !open)}
              sx={filterButtonSx}
            >
              {filtersOpen ? "Filtrlarni yopish" : "Batafsil filtrlar"}
            </Button>

            <Button variant="outlined" onClick={resetFilters} sx={filterButtonSx}>
              Tozalash
            </Button>

            {filtersOpen && (
              <>
                <TextField
                  size="small"
                  type="date"
                  label="Dan"
                  value={filters.date_from}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,

                      date_from: event.target.value,
                    }))
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />

                <TextField
                  size="small"
                  type="date"
                  label="Gacha"
                  value={filters.date_to}
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,

                      date_to: event.target.value,
                    }))
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              </>
            )}
          </Box>

          {canManage && (
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.1}
              useFlexGap
              sx={{
                flexWrap: "wrap",
              }}
            >
              <Button variant="outlined" onClick={() => setSupplierOpen(true)} sx={filterButtonSx}>
                Ta’minotchilar
              </Button>

              <Button variant="outlined" onClick={() => setMaterialOpen(true)} sx={filterButtonSx}>
                Homashyo qo‘shish
              </Button>

              <Button
                variant="outlined"
                onClick={() => {
                  setPaymentForm({
                    ...emptyPayment,

                    paid_at: today(),

                    supplier_id: filters.supplier_id || "",
                  });

                  setPaymentOpen(true);
                }}
                sx={filterButtonSx}
              >
                To‘lov
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  setPurchaseForm({
                    ...emptyPurchase,

                    purchased_at: today(),

                    supplier_id: filters.supplier_id || "",

                    items: [
                      {
                        raw_material_id: "",

                        quantity: "",

                        unit_price: "",
                      },
                    ],
                  });

                  setPurchaseOpen(true);
                }}
                sx={primaryButtonSx}
              >
                + Xarid qo‘shish
              </Button>
            </Stack>
          )}
        </Box>
      </Card>

      <Card
        sx={{
          minHeight: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={tableHeaderBoxSx}>
          <Box>
            <Typography
              sx={{
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 950,
              }}
            >
              Homashyo xaridlari
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "#94a3b8",
                fontSize: 10.5,
              }}
            >
              Ta’minotchi, kelgan homashyolar, to‘lov va qarz ma’lumotlari
            </Typography>
          </Box>

          <Chip size="small" label={`${number(pageInfo.total)} ta`} sx={countChipSx} />
        </Box>

        <Box
          sx={{
            minHeight: 0,
            flex: 1,
            overflow: "auto",
          }}
        >
          <Table sx={tableSx}>
            <TableHead>
              <TableRow>
                <TableCell>Ta’minotchi</TableCell>

                <TableCell>Homashyolar</TableCell>

                <TableCell>Ushbu xarid hisobi</TableCell>

                <TableCell>Sana va izoh</TableCell>

                {canManage && <TableCell align="right">Amal</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} align="center" sx={{ py: 8 }}>
                    <CircularProgress
                      size={30}
                      sx={{
                        color: "#991b1b",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : purchases.length ? (
                purchases.map((purchase) => (
                  <TableRow key={purchase.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",

                          alignItems: "center",

                          gap: 1.4,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 47,
                            height: 47,

                            color: "#ffffff",

                            fontWeight: 950,

                            background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",

                            border: "3px solid #ffffff",

                            boxShadow: "0 8px 20px rgba(127,29,29,.16)",
                          }}
                        >
                          {initial(purchase.supplier_name)}
                        </Avatar>

                        <Box
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            sx={{
                              color: "#334155",

                              fontSize: 12.5,

                              fontWeight: 900,
                            }}
                          >
                            {purchase.supplier_name || "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,

                              color: "#94a3b8",

                              fontSize: 9.5,
                            }}
                          >
                            Xarid #{purchase.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.65}>
                        {(purchase.items || []).slice(0, 4).map((item) => (
                          <Box
                            key={item.id}
                            sx={{
                              display: "flex",

                              alignItems: "center",

                              justifyContent: "space-between",

                              gap: 2,
                            }}
                          >
                            <Typography
                              noWrap
                              sx={{
                                maxWidth: 190,

                                color: "#475569",

                                fontSize: 10.5,

                                fontWeight: 850,
                              }}
                            >
                              {item.material_name}
                            </Typography>

                            <Typography
                              noWrap
                              sx={{
                                color: "#94a3b8",

                                fontSize: 9.5,

                                fontWeight: 750,
                              }}
                            >
                              {number(item.quantity)} {item.unit} × {money(item.unit_price)}
                            </Typography>
                          </Box>
                        ))}

                        {(purchase.items || []).length > 4 && (
                          <Typography
                            sx={{
                              color: "#991b1b",

                              fontSize: 9.5,

                              fontWeight: 900,
                            }}
                          >
                            +{purchase.items.length - 4} ta boshqa homashyo
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "#334155",

                          fontSize: 11.5,

                          fontWeight: 950,
                        }}
                      >
                        Jami: {money(purchase.subtotal)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.4,

                          color: "#15803d",

                          fontSize: 9.5,

                          fontWeight: 850,
                        }}
                      >
                        Berildi: {money(purchase.paid_amount)}
                      </Typography>

                      <Box sx={{ mt: 0.75 }}>
                        <DebtChip value={purchase.debt_amount} />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "#475569",

                          fontSize: 10.5,

                          fontWeight: 850,
                        }}
                      >
                        {date(purchase.purchased_at)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.45,

                          maxWidth: 220,

                          color: "#94a3b8",

                          fontSize: 9.5,

                          lineHeight: 1.55,
                        }}
                      >
                        {purchase.note || "Izoh yo‘q"}
                      </Typography>
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => {
                            setSelectedPurchase(purchase);

                            setDeleteOpen(true);
                          }}
                          sx={tableActionSx}
                        >
                          O‘chirish
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    align="center"
                    sx={{
                      py: 8,
                      color: "#94a3b8",
                      fontWeight: 850,
                    }}
                  >
                    Xaridlar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid #edf0f3",

            backgroundColor: "#fafbfc",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) =>
              fetchPurchases(
                nextPage * pageInfo.limit,

                pageInfo.limit,
              )
            }
            onLimitChange={(limit) => fetchPurchases(0, limit)}
          />
        </Box>
      </Card>

      <PremiumDialog
        open={purchaseOpen}
        onClose={close}
        title="Homashyo xaridi"
        subtitle="Ta’minotchi, kelgan homashyolar va xarid hisobini kiriting"
        actions={
          <>
            <Button onClick={close} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              disabled={saving}
              onClick={savePurchase}
              sx={dialogPrimarySx}
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </>
        }
      >
        <Stack spacing={2.1}>
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },

              gap: 1.6,
            }}
          >
            <TextField
              select
              required
              label="Ta’minotchi"
              value={purchaseForm.supplier_id}
              onChange={(event) =>
                setPurchaseForm((previous) => ({
                  ...previous,

                  supplier_id: event.target.value,
                }))
              }
            >
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name} — qarz {money(supplier.current_debt)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="Xarid sanasi"
              value={purchaseForm.purchased_at}
              onChange={(event) =>
                setPurchaseForm((previous) => ({
                  ...previous,

                  purchased_at: event.target.value,
                }))
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>

          <Box sx={dialogSectionSx}>
            <Box
              sx={{
                mb: 1.6,

                display: "flex",

                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },

                justifyContent: "space-between",

                flexDirection: {
                  xs: "column",
                  sm: "row",
                },

                gap: 1.3,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#334155",

                    fontSize: 15,

                    fontWeight: 950,
                  }}
                >
                  Homashyo qatorlari
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,

                    color: "#94a3b8",

                    fontSize: 10,
                  }}
                >
                  Bir nechta homashyoni bitta xaridga qo‘shish mumkin
                </Typography>
              </Box>

              <Button
                variant="outlined"
                onClick={() =>
                  setPurchaseForm((previous) => ({
                    ...previous,

                    items: [
                      ...previous.items,

                      {
                        raw_material_id: "",

                        quantity: "",

                        unit_price: "",
                      },
                    ],
                  }))
                }
                sx={filterButtonSx}
              >
                + Yana homashyo
              </Button>
            </Box>

            <Stack spacing={1.4}>
              {purchaseForm.items.map((item, index) => (
                <Box key={index} sx={purchaseItemRowSx}>
                  <Box>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Homashyo"
                      value={item.raw_material_id}
                      onChange={(event) =>
                        changeItem(
                          index,

                          "raw_material_id",

                          event.target.value,
                        )
                      }
                    >
                      {materials.map((material) => (
                        <MenuItem key={material.id} value={material.id}>
                          {material.name} ({material.unit})
                        </MenuItem>
                      ))}
                    </TextField>

                    <Button
                      size="small"
                      onClick={() => {
                        setQuickMaterialIndex(index);

                        setQuickMaterialForm(emptyMaterial);

                        setQuickMaterialOpen(true);
                      }}
                      sx={{
                        mt: 0.5,
                        px: 0,

                        color: "#991b1b",

                        fontSize: 9.5,

                        fontWeight: 900,

                        textTransform: "none",
                      }}
                    >
                      Yangi homashyo yaratish
                    </Button>
                  </Box>

                  <TextField
                    required
                    type="number"
                    label="Miqdor"
                    value={item.quantity}
                    onChange={(event) =>
                      changeItem(
                        index,

                        "quantity",

                        event.target.value,
                      )
                    }
                    inputProps={{
                      min: 0,
                      step: 0.001,
                    }}
                  />

                  <TextField
                    required
                    type="number"
                    label="Birlik narxi"
                    value={item.unit_price}
                    onChange={(event) =>
                      changeItem(
                        index,

                        "unit_price",

                        event.target.value,
                      )
                    }
                    inputProps={{
                      min: 0,
                      step: 1000,
                    }}
                  />

                  <Button
                    color="error"
                    disabled={purchaseForm.items.length === 1}
                    onClick={() =>
                      setPurchaseForm((previous) => ({
                        ...previous,

                        items: previous.items.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                    sx={removeButtonSx}
                  >
                    Olib tashlash
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>

          {quickMaterialOpen && (
            <Box sx={quickMaterialBoxSx}>
              <TextField
                size="small"
                label="Yangi homashyo nomi"
                value={quickMaterialForm.name}
                onChange={(event) =>
                  setQuickMaterialForm((previous) => ({
                    ...previous,

                    name: event.target.value,
                  }))
                }
              />

              <TextField
                size="small"
                label="Birligi"
                value={quickMaterialForm.unit}
                onChange={(event) =>
                  setQuickMaterialForm((previous) => ({
                    ...previous,

                    unit: event.target.value,
                  }))
                }
                helperText="dona, kg, metr, litr"
              />

              <Button
                variant="contained"
                disabled={saving}
                onClick={saveQuickMaterial}
                sx={dialogPrimarySx}
              >
                Yaratish
              </Button>

              <Button onClick={() => setQuickMaterialOpen(false)} sx={dialogCancelSx}>
                Bekor qilish
              </Button>
            </Box>
          )}

          <TextField
            type="number"
            label="To‘lanadigan summa"
            value={purchaseForm.paid_amount}
            onChange={(event) =>
              setPurchaseForm((previous) => ({
                ...previous,

                paid_amount: event.target.value,
              }))
            }
            inputProps={{
              min: 0,
              step: 1000,
            }}
          />

          <Box sx={balanceGridSx}>
            <BalanceBox label="Xarid" value={money(subtotal)} tone="blue" />

            <BalanceBox label="Oldingi qarz" value={money(previousDebt)} tone="amber" />

            <BalanceBox label="Beriladi" value={money(paidAmount)} tone="green" />

            <BalanceBox label="Yangi qarz" value={money(newDebt)} tone="red" />
          </Box>

          <TextField
            multiline
            minRows={3}
            label="Izoh"
            value={purchaseForm.note}
            onChange={(event) =>
              setPurchaseForm((previous) => ({
                ...previous,

                note: event.target.value,
              }))
            }
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={supplierOpen}
        onClose={close}
        title="Ta’minotchilar"
        subtitle="Ta’minotchilar va ularning qarzdorlik ma’lumotlarini boshqaring"
        maxWidth="md"
        actions={
          <Button onClick={close} sx={dialogCancelSx}>
            Yopish
          </Button>
        }
      >
        <Stack spacing={2}>
          <Box>
            <Typography
              sx={{
                color: "#334155",
                fontSize: 15,
                fontWeight: 950,
              }}
            >
              {selectedSupplierForEdit ? "Ta’minotchini tahrirlash" : "Yangi ta’minotchi"}
            </Typography>

            <Typography
              sx={{
                mt: 0.4,
                color: "#94a3b8",
                fontSize: 10,
              }}
            >
              Aloqa, manzil va boshlang‘ich qarzni kiriting
            </Typography>
          </Box>

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
              label="Nomi"
              value={supplierForm.name}
              onChange={(event) =>
                setSupplierForm((previous) => ({
                  ...previous,

                  name: event.target.value,
                }))
              }
            />

            <TextField
              label="Telefon"
              value={supplierForm.phone}
              onChange={(event) =>
                setSupplierForm((previous) => ({
                  ...previous,

                  phone: event.target.value,
                }))
              }
            />

            <TextField
              label="Manzil"
              value={supplierForm.address}
              onChange={(event) =>
                setSupplierForm((previous) => ({
                  ...previous,

                  address: event.target.value,
                }))
              }
            />

            <TextField
              type="number"
              label="Boshlang‘ich qarz"
              value={supplierForm.opening_balance}
              onChange={(event) =>
                setSupplierForm((previous) => ({
                  ...previous,

                  opening_balance: event.target.value,
                }))
              }
              inputProps={{
                min: 0,
                step: 1000,
              }}
            />
          </Box>

          <TextField
            multiline
            minRows={2}
            label="Izoh"
            value={supplierForm.note}
            onChange={(event) =>
              setSupplierForm((previous) => ({
                ...previous,

                note: event.target.value,
              }))
            }
          />

          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: "flex-end",
            }}
          >
            {selectedSupplierForEdit && (
              <Button
                onClick={() => {
                  setSelectedSupplierForEdit(null);

                  setSupplierForm(emptySupplier);
                }}
                sx={dialogCancelSx}
              >
                Tozalash
              </Button>
            )}

            <Button
              variant="contained"
              disabled={saving}
              onClick={saveSupplier}
              sx={dialogPrimarySx}
            >
              {saving ? "Saqlanmoqda..." : selectedSupplierForEdit ? "Yangilash" : "Qo‘shish"}
            </Button>
          </Stack>
        </Stack>

        <Card
          sx={{
            mt: 2.5,
            boxShadow: "none",
          }}
        >
          <Box
            sx={{
              overflowX: "auto",
            }}
          >
            <Table size="small" sx={supplierTableSx}>
              <TableHead>
                <TableRow>
                  <TableCell>Ta’minotchi</TableCell>

                  <TableCell>Telefon</TableCell>

                  <TableCell>Manzil</TableCell>

                  <TableCell>Boshlang‘ich qarz</TableCell>

                  <TableCell>Hozirgi qarz</TableCell>

                  <TableCell align="right">Amallar</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {suppliers.length ? (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id} hover>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",

                            alignItems: "center",

                            gap: 1,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,

                              color: "#ffffff",

                              fontSize: 11,

                              fontWeight: 950,

                              background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",
                            }}
                          >
                            {initial(supplier.name)}
                          </Avatar>

                          <Typography
                            sx={{
                              color: "#334155",

                              fontSize: 10.5,

                              fontWeight: 900,
                            }}
                          >
                            {supplier.name}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>{supplier.phone || "-"}</TableCell>

                      <TableCell>{supplier.address || "-"}</TableCell>

                      <TableCell>{money(supplier.opening_balance)}</TableCell>

                      <TableCell>
                        <DebtChip value={supplier.current_debt} />
                      </TableCell>

                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.8}
                          sx={{
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => editSupplier(supplier)}
                            sx={tableActionSx}
                          >
                            Tahrirlash
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => removeSupplier(supplier)}
                            sx={tableActionSx}
                          >
                            O‘chirish
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{
                        py: 6,

                        color: "#94a3b8",

                        fontWeight: 850,
                      }}
                    >
                      Ta’minotchilar topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </PremiumDialog>

      <PremiumDialog
        open={materialOpen}
        onClose={close}
        title="Homashyo qo‘shish"
        subtitle="Yangi homashyo va uning o‘lchov birligini yarating"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={close} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              disabled={saving}
              onClick={saveMaterial}
              sx={dialogPrimarySx}
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            required
            label="Nomi"
            value={materialForm.name}
            onChange={(event) =>
              setMaterialForm((previous) => ({
                ...previous,

                name: event.target.value,
              }))
            }
          />

          <TextField
            label="O‘lchov birligi"
            value={materialForm.unit}
            onChange={(event) =>
              setMaterialForm((previous) => ({
                ...previous,

                unit: event.target.value,
              }))
            }
            helperText="dona, kg, metr yoki litr"
          />

          <TextField
            multiline
            minRows={3}
            label="Izoh"
            value={materialForm.note}
            onChange={(event) =>
              setMaterialForm((previous) => ({
                ...previous,

                note: event.target.value,
              }))
            }
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={paymentOpen}
        onClose={close}
        title="Ta’minotchiga to‘lov"
        subtitle="Ta’minotchi qarzidan to‘lov kiriting"
        maxWidth="sm"
        actions={
          <>
            <Button onClick={close} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              disabled={saving}
              onClick={savePayment}
              sx={dialogPrimarySx}
            >
              {saving ? "Saqlanmoqda..." : "To‘lov qilish"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            select
            required
            label="Ta’minotchi"
            value={paymentForm.supplier_id}
            onChange={(event) =>
              setPaymentForm((previous) => ({
                ...previous,

                supplier_id: event.target.value,
              }))
            }
          >
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.name} — qarz {money(supplier.current_debt)}
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

              gap: 1.6,
            }}
          >
            <TextField
              required
              type="number"
              label="Summa"
              value={paymentForm.amount}
              onChange={(event) =>
                setPaymentForm((previous) => ({
                  ...previous,

                  amount: event.target.value,
                }))
              }
              inputProps={{
                min: 0,
                step: 1000,
              }}
            />

            <TextField
              type="date"
              label="Sana"
              value={paymentForm.paid_at}
              onChange={(event) =>
                setPaymentForm((previous) => ({
                  ...previous,

                  paid_at: event.target.value,
                }))
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3,1fr)",
              },

              gap: 1.2,
              p: 1.5,
              borderRadius: "18px",

              border: "1px solid #e7ebf0",

              backgroundColor: "#f8fafc",
            }}
          >
            <BalanceBox label="Hozirgi qarz" value={money(paymentCurrentDebt)} tone="red" />

            <BalanceBox label="To‘lov" value={money(paymentForm.amount)} tone="green" />

            <BalanceBox label="Qoladigan qarz" value={money(paymentAfterDebt)} tone="amber" />
          </Box>

          <TextField
            multiline
            minRows={3}
            label="Izoh"
            value={paymentForm.note}
            onChange={(event) =>
              setPaymentForm((previous) => ({
                ...previous,

                note: event.target.value,
              }))
            }
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={deleteOpen}
        onClose={close}
        title="Xaridni o‘chirish"
        subtitle="Xarid va unga tegishli hisoblar qayta hisoblanadi"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={close} disabled={deleting} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              color="error"
              disabled={deleting}
              onClick={confirmDeletePurchase}
              sx={deleteButtonSx}
            >
              {deleting ? "O‘chirilmoqda..." : "O‘chirish"}
            </Button>
          </>
        }
      >
        <Typography sx={confirmTextSx}>
          <strong>{selectedPurchase?.supplier_name || "Tanlangan xarid"}</strong> xaridi
          o‘chiriladi. U bilan bog‘liq homashyo kirimi va qarzdorlik hisoblari ham qayta
          hisoblanadi. Davom etasizmi?
        </Typography>
      </PremiumDialog>

      <PremiumDialog
        open={supplierDeleteOpen}
        onClose={close}
        title="Ta’minotchini o‘chirish"
        subtitle="Bog‘langan xaridlar mavjud bo‘lsa tizim amalni rad etishi mumkin"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={close} disabled={deleting} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              color="error"
              disabled={deleting}
              onClick={confirmRemoveSupplier}
              sx={deleteButtonSx}
            >
              {deleting ? "O‘chirilmoqda..." : "O‘chirish"}
            </Button>
          </>
        }
      >
        <Typography sx={confirmTextSx}>
          <strong>{selectedSupplierForDelete?.name || "Tanlangan ta’minotchi"}</strong>{" "}
          ta’minotchisi o‘chiriladi. Unga bog‘langan xaridlar mavjud bo‘lsa, tizim xavfsizlik
          sababli amalni rad etishi mumkin.
        </Typography>
      </PremiumDialog>
    </Box>
  );
};


const eyebrowSx = {
  color: "#fecdd3 !important",
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: ".13em",
  textTransform: "uppercase",
};

const heroTitleSx = {
  mt: 1.5,
  color: "#ffffff !important",

  fontSize: {
    xs: 29,
    md: 36,
  },

  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-.045em",
};

const heroDescriptionSx = {
  maxWidth: 555,
  mt: 1.4,

  color: "rgba(255,255,255,.45) !important",

  fontSize: 12.5,
  lineHeight: 1.75,
};

const heroSx = {
  position: "relative",
  isolation: "isolate",
  mb: 2,

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

  flexShrink: 0,

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
};

const heroPrimaryButtonSx = {
  minHeight: 43,
  px: 2.2,
  color: "#ffffff !important",
  borderRadius: "13px",
  fontSize: 11.5,
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
  px: 2,

  color: "rgba(255,255,255,.72) !important",

  borderRadius: "13px",

  border: "1px solid rgba(255,255,255,.10)",

  backgroundColor: "rgba(255,255,255,.055)",

  fontSize: 11,
  fontWeight: 900,
  textTransform: "none",

  "&:hover": {
    backgroundColor: "rgba(255,255,255,.10)",
  },
};

const filterButtonSx = {
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

const tableHeaderBoxSx = {
  px: 2.4,
  py: 1.9,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,

  borderBottom: "1px solid #edf0f3",
};

const countChipSx = {
  height: 25,
  color: "#991b1b",
  fontSize: 9.5,
  fontWeight: 900,

  backgroundColor: "rgba(153,27,27,.07)",
};

const softBlueChipSx = {
  height: 25,
  color: "#1d4ed8",
  fontSize: 9.5,
  fontWeight: 900,

  backgroundColor: "rgba(37,99,235,.08)",

  border: "1px solid rgba(37,99,235,.16)",
};

const softGreenChipSx = {
  height: 25,
  color: "#15803d",
  fontSize: 9.5,
  fontWeight: 900,

  backgroundColor: "rgba(34,197,94,.08)",

  border: "1px solid rgba(34,197,94,.16)",
};

const stockCardSx = {
  position: "relative",
  overflow: "hidden",
  p: 1.5,
  borderRadius: "17px",

  border: "1px solid #e7ebf0",

  background: "linear-gradient(145deg,#ffffff,#f8fafc)",

  "&::after": {
    content: '""',
    position: "absolute",
    width: 100,
    height: 100,
    top: -58,
    right: -46,
    borderRadius: "50%",

    backgroundColor: "rgba(153,27,27,.045)",
  },
};

const tinyLabelSx = {
  color: "#94a3b8",
  fontSize: 8.8,
  fontWeight: 800,
};

const greenValueSx = {
  mt: 0.4,
  color: "#15803d",
  fontSize: 10,
  fontWeight: 950,
};

const darkValueSx = {
  mt: 0.4,
  color: "#475569",
  fontSize: 10,
  fontWeight: 900,
};

const emptyStateSx = {
  minHeight: 110,
  display: "grid",
  placeItems: "center",
  borderRadius: "17px",

  border: "1px dashed #cbd5e1",

  backgroundColor: "#f8fafc",
};

const emptyTextSx = {
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 800,
};

const tableActionSx = {
  borderRadius: "9px",
  fontSize: 9.5,
  fontWeight: 900,
  textTransform: "none",
};

const tableSx = {
  minWidth: 1080,

  "& th": {
    py: 1.55,
    color: "#94a3b8",
    fontSize: 9.5,
    fontWeight: 900,
    letterSpacing: ".045em",
    textTransform: "uppercase",

    backgroundColor: "#fafbfc",

    borderColor: "#edf0f3",
  },

  "& td": {
    py: 1.4,
    color: "#64748b",
    fontSize: 10.5,
    borderColor: "#edf0f3",
  },

  "& tbody tr:hover": {
    backgroundColor: "rgba(153,27,27,.025)",
  },
};

const supplierTableSx = {
  minWidth: 800,

  "& th": {
    py: 1.45,
    color: "#94a3b8",
    fontSize: 9.5,
    fontWeight: 900,
    textTransform: "uppercase",

    backgroundColor: "#fafbfc",
  },

  "& td": {
    py: 1.35,
    color: "#64748b",
    fontSize: 10.5,
    borderColor: "#edf0f3",
  },
};

const dialogSectionSx = {
  p: 2,
  borderRadius: "18px",

  border: "1px solid #e7ebf0",

  background: "linear-gradient(145deg,#ffffff,#f8fafc)",
};

const purchaseItemRowSx = {
  display: "grid",

  gridTemplateColumns: {
    xs: "1fr",

    md: "1.45fr 1fr 1fr auto",
  },

  gap: 1.3,
  p: 1.4,
  borderRadius: "16px",
  backgroundColor: "#ffffff",

  border: "1px solid #e7ebf0",
};

const removeButtonSx = {
  borderRadius: "11px",
  fontSize: 9.5,
  fontWeight: 850,
  textTransform: "none",
};

const quickMaterialBoxSx = {
  display: "grid",

  gridTemplateColumns: {
    xs: "1fr",

    sm: "1.5fr 1fr auto auto",
  },

  gap: 1.3,
  p: 1.6,
  borderRadius: "18px",
  backgroundColor: "#f8fafc",

  border: "1px solid #dce3ea",
};

const balanceGridSx = {
  display: "grid",

  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2,1fr)",
    lg: "repeat(4,1fr)",
  },

  gap: 1.2,
  p: 1.5,
  borderRadius: "18px",
  backgroundColor: "#f8fafc",

  border: "1px solid #e7ebf0",
};

const dialogCancelSx = {
  color: "#64748b",
  borderRadius: "11px",
  fontWeight: 850,
  textTransform: "none",
};

const dialogPrimarySx = {
  minWidth: 110,
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

const deleteButtonSx = {
  minWidth: 110,
  borderRadius: "11px",
  fontWeight: 900,
  textTransform: "none",
};

const confirmTextSx = {
  color: "#64748b",
  fontSize: 12.5,
  fontWeight: 700,
  lineHeight: 1.7,
};



const materialPurchasesStyles = `
  .crm-page .material-purchases-hero {
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

  .material-purchases-dialog-title {
    color: #ffffff !important;
    background-color: #0d1117 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.28),
        transparent 36%
      ),
      linear-gradient(
        135deg,
        #11151c,
        #321319
      ) !important;
  }
`;

export default MaterialPurchases;
