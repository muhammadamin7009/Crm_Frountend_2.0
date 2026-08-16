import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import {
  CompatDialog as Dialog,
  CompatTextField as TextField,
} from "../../Components/UI/MuiCompat";

import SharedHeroMetric from "../../Components/UI/HeroMetric";
import MoneyTextField from "../../Components/UI/MoneyTextField";
import ActiveStatusChip from "../../Components/UI/ActiveStatusChip";
import Surface from "../../Components/UI/Surface";

import {
  getProduct,
  getProductCost,
  getProductRecipe,
  saveProductDepartmentPrices,
  saveProductRecipe,
} from "../../api/products";
import { createDepartment, getDepartments } from "../../api/departments";
import { useAuth } from "../../Context/AuthContext";
import { hasPermission } from "../../utils/permissions";
import { formatNumber } from "../../utils/format";

const MANAGER_ROLES = ["super_admin", "admin"];

const emptyDepartmentForm = {
  name: "",
  code: "",
  description: "",
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return undefined;

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  return `${baseUrl}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const makeDepartmentCode = (value) => {
  const code = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);

  return code || `bolim_${Date.now()}`;
};

const normalizeDepartmentPrices = (prices = []) =>
  prices.map((item) => ({
    id: item.id,
    department_id: item.department_id,

    department_name: item.department_name || item.name || "Bo'lim",

    department_code: item.department_code || item.code || "",

    price_per_unit: item.price_per_unit ?? "",

    is_active: item.is_active ?? true,
  }));

const buildDepartmentPriceRows = (departments = [], prices = []) => {
  const existingPrices = new Map(
    normalizeDepartmentPrices(prices).map((price) => [Number(price.department_id), price]),
  );

  const departmentRows = departments.map((department) => {
    const existing = existingPrices.get(Number(department.id));

    return {
      id: existing?.id,
      department_id: department.id,

      department_name: department.name || existing?.department_name || "Bo'lim",

      department_code: department.code || existing?.department_code || "",

      price_per_unit: existing?.price_per_unit ?? "",

      is_active: existing?.is_active ?? true,
    };
  });

  return departmentRows.length ? departmentRows : normalizeDepartmentPrices(prices);
};

const getInitial = (value) =>
  String(value || "M")
    .trim()
    .slice(0, 1)
    .toUpperCase();

const HeroMetric = (props) => <SharedHeroMetric {...props} labelSx={{ mt: 1.4 }} />;
const InfoItem = ({ label, value, accent = false }) => (
  <Box
    sx={{
      minWidth: 0,
      p: 1.65,
      borderRadius: "16px",

      border: accent ? "1px solid rgba(110, 22, 34,.24)" : "1px solid var(--aa-border)",

      background: accent
        ? "linear-gradient(145deg,var(--aa-brand-100),var(--aa-surface-solid))"
        : "linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",
    }}
  >
    <Typography
      sx={{
        color: "var(--aa-text-tertiary)",
        fontSize: 9.5,
        fontWeight: 600,
      }}
    >
      {label}
    </Typography>

    <Typography
      noWrap
      sx={{
        mt: 0.65,

        color: accent ? "var(--aa-brand-600)" : "var(--aa-text)",

        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const PricePanel = ({ label, value, tone = "green", helper }) => {
  const tones = {
    green: {
      color: "#2f6b45",
      background: "rgba(78, 156, 107,.08)",
      border: "rgba(78, 156, 107,.18)",
    },

    blue: {
      color: "#1f6f8b",
      background: "rgba(31, 111, 139,.07)",
      border: "rgba(31, 111, 139,.17)",
    },

    red: {
      color: "#6e1622",
      background: "rgba(110, 22, 34,.07)",
      border: "rgba(110, 22, 34,.16)",
    },
  };

  const current = tones[tone] || tones.green;

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 2,
        borderRadius: "18px",

        border: `1px solid ${current.border}`,

        background: current.background,
      }}
    >
      <Typography
        sx={{
          color: "var(--aa-text-secondary)",
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.8,
          color: current.color,
          fontSize: 21,
          fontWeight: 700,
          letterSpacing: "-.04em",
        }}
      >
        {value}
      </Typography>

      {helper && (
        <Typography
          sx={{
            mt: 0.6,
            color: "var(--aa-text-tertiary)",
            fontSize: 9.5,
          }}
        >
          {helper}
        </Typography>
      )}
    </Box>
  );
};

const StatusChip = (props) => <ActiveStatusChip {...props} height={27} px={0.3} />;
const SectionHeader = ({ title, subtitle, actions }) => (
  <Box
    sx={{
      mb: 2.2,
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

      gap: 1.5,
    }}
  >
    <Box>
      <Typography
        sx={{
          color: "var(--aa-text)",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "-.02em",
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          sx={{
            mt: 0.55,
            color: "var(--aa-text-tertiary)",
            fontSize: 10.5,
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>

    {actions}
  </Box>
);

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const auth = useAuth() || {};

  const currentUser = auth.user || getLocalUser();

  const isManagerRole = MANAGER_ROLES.includes(currentUser?.role);

  // Uchta alohida ruxsat. Ilgari uchalasi ham `products.manage` ostida edi va katalogni
  // boshqara oladigan har bir admin bir birlik ish haqini hamda mahsulotning xomashyo
  // tarkibini ham ko'rar edi.
  const canManageProduct = isManagerRole && hasPermission(currentUser, "products.manage");

  const canViewPrices = isManagerRole && hasPermission(currentUser, "products.prices");

  const canViewRecipe = isManagerRole && hasPermission(currentUser, "products.recipe");

  // Bo'limlar ro'yxati ikkala bo'limga ham kerak: narxlar jadvaliga ham,
  // retseptdagi "Yakunlovchi bo'lim" tanlagichiga ham.
  const needsDepartments = canViewPrices || canViewRecipe;

  // "+ Bo'lim qo'shish" yangi ishlab chiqarish bo'limi yaratadi — bu departments
  // modulining ruxsati, `products.prices` uni qamramaydi (POST /departments 403 beradi).
  const canCreateDepartment =
    isManagerRole &&
    ["products.manage", "production.manage", "employees.manage", "orders.manage"].some((key) =>
      hasPermission(currentUser, key),
    );

  const [product, setProduct] = useState(null);

  const [selectedImage, setSelectedImage] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [priceRows, setPriceRows] = useState([]);

  const [priceSaving, setPriceSaving] = useState(false);

  const [departmentOpen, setDepartmentOpen] = useState(false);

  const [departmentSaving, setDepartmentSaving] = useState(false);

  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm);

  const [completionDepartmentId, setCompletionDepartmentId] = useState("");

  const [recipeRows, setRecipeRows] = useState([]);

  const [rawMaterials, setRawMaterials] = useState([]);

  const [recipeSaving, setRecipeSaving] = useState(false);

  // Haqiqiy tannarx: ombor harakatlaridan yig'iladi, retsept bilan solishtiriladi.
  const [costReport, setCostReport] = useState(null);

  const images = useMemo(() => product?.images || [], [product?.images]);

  const primaryImage = useMemo(
    () => images.find((image) => image.is_primary) || images[0],
    [images],
  );

  const activeImage = selectedImage || primaryImage?.image_url || "";

  // Tannarx endi `products.purchase_price` dan olinmaydi. U qo'lda yozilgan
  // eski maydon — yangi mahsulotlarda doim nol turadi va foydani yolg'on
  // ko'rsatardi. Haqiqiy tannarx sarflangan xomashyodan hisoblanadi.
  const unitCost = costReport?.produced_pairs > 0 ? Number(costReport.cost_per_pair || 0) : null;

  const profitAmount = useMemo(
    () => (unitCost === null ? null : Number(product?.sale_price || 0) - unitCost),
    [product?.sale_price, unitCost],
  );

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [{ data }, departmentsRes, recipeRes, costRes] = await Promise.all([
        getProduct(id),

        needsDepartments
          ? getDepartments({
              is_active: true,
              limit: 100,
              sort_by: "sort_order",
              sort_order: "asc",
            })
          : Promise.resolve({
              data: {
                departments: [],
              },
            }),

        canViewRecipe
          ? getProductRecipe(id)
          : Promise.resolve({
              data: {
                recipe: {
                  materials: [],
                },
                raw_materials: [],
              },
            }),

        canViewRecipe ? getProductCost(id) : Promise.resolve({ data: { cost: null } }),
      ]);

      const receivedProduct = data?.product || data?.found_product || data;

      const departments = departmentsRes.data?.departments || [];

      setProduct(receivedProduct);

      setPriceRows(buildDepartmentPriceRows(departments, receivedProduct?.department_prices || []));

      setSelectedImage(
        receivedProduct?.images?.find((image) => image.is_primary)?.image_url ||
          receivedProduct?.images?.[0]?.image_url ||
          "",
      );

      setCompletionDepartmentId(recipeRes.data?.recipe?.completion_department_id || "");

      setRecipeRows(
        (recipeRes.data?.recipe?.materials || []).map((material, index) => ({
          row_id: material.id || `${material.raw_material_id}-${index}`,

          raw_material_id: material.raw_material_id,

          quantity_per_pair: material.quantity_per_pair,

          department_id: material.department_id || "",
        })),
      );

      setRawMaterials(recipeRes.data?.raw_materials || []);

      setCostReport(costRes.data?.cost || null);
    } catch (requestError) {
      const status = requestError?.response?.status;

      if (status === 404) {
        setError("Mahsulot topilmadi.");
      } else if (status === 403) {
        setError("Bu mahsulot ma'lumotlarini ko'rishga ruxsatingiz yo'q.");
      } else {
        setError(
          requestError?.response?.data?.message ||
            "Mahsulot ma'lumotlarini olishda xatolik yuz berdi.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [canViewRecipe, id, needsDepartments]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handlePriceChange = (departmentId, value) => {
    setPriceRows((current) =>
      current.map((row) =>
        Number(row.department_id) === Number(departmentId)
          ? {
              ...row,
              price_per_unit: value,
            }
          : row,
      ),
    );
  };

  const openDepartmentModal = () => {
    setDepartmentForm(emptyDepartmentForm);

    setDepartmentOpen(true);
  };

  const closeDepartmentModal = () => {
    if (departmentSaving) return;

    setDepartmentOpen(false);
  };

  const handleDepartmentChange = (field) => (event) => {
    const value = event.target.value;

    setDepartmentForm((current) => ({
      ...current,
      [field]: value,

      ...(field === "name" && !current.code
        ? {
            code: makeDepartmentCode(value),
          }
        : {}),
    }));
  };

  const handleCreateDepartment = async () => {
    const name = departmentForm.name.trim();

    const code = makeDepartmentCode(departmentForm.code || departmentForm.name);

    if (!name) {
      toast.error("Bo'lim nomini kiriting.");

      return;
    }

    setDepartmentSaving(true);

    try {
      const { data } = await createDepartment({
        name,
        code,

        description: departmentForm.description.trim() || null,

        is_active: true,
      });

      const department = data?.new_department || data?.department || data;

      setPriceRows((current) => [
        ...current,

        {
          department_id: department.id,

          department_name: department.name,

          department_code: department.code,

          price_per_unit: "",

          is_active: department.is_active ?? true,
        },
      ]);

      toast.success("Bo'lim yaratildi. Endi narx kiriting.");

      setDepartmentOpen(false);

      setDepartmentForm(emptyDepartmentForm);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Bo'lim yaratishda xatolik.");
    } finally {
      setDepartmentSaving(false);
    }
  };

  const handleSavePrices = async () => {
    if (!product?.id || !priceRows.length) {
      return;
    }

    setPriceSaving(true);

    try {
      const prices = priceRows.map((row) => ({
        department_id: row.department_id,

        price_per_unit: Number(row.price_per_unit || 0),

        is_active: row.is_active ?? true,
      }));

      const { data } = await saveProductDepartmentPrices(product.id, prices);

      const updatedPrices = data?.department_prices || data?.prices || [];

      if (updatedPrices.length) {
        setPriceRows(normalizeDepartmentPrices(updatedPrices));

        setProduct((current) => ({
          ...current,

          department_prices: updatedPrices,
        }));
      }

      toast.success("Bo'lim narxlari saqlandi.");
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Bo'lim narxlarini saqlashda xatolik.");
    } finally {
      setPriceSaving(false);
    }
  };

  const addRecipeRow = () => {
    setRecipeRows((current) => [
      ...current,

      {
        row_id: `${Date.now()}-${Math.random()}`,
        raw_material_id: "",
        quantity_per_pair: "",
        department_id: "",
      },
    ]);
  };

  const updateRecipeRow = (rowId, field, value) => {
    setRecipeRows((current) =>
      current.map((row) =>
        row.row_id === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  };

  const removeRecipeRow = (rowId) => {
    setRecipeRows((current) => current.filter((row) => row.row_id !== rowId));
  };

  const handleSaveRecipe = async () => {
    const validRows = recipeRows.filter(
      (row) => row.raw_material_id && Number(row.quantity_per_pair) > 0,
    );

    if (completionDepartmentId && validRows.length !== recipeRows.length) {
      toast.error("Har bir xomashyo va 1 par uchun sarf miqdorini to'g'ri kiriting.");

      return;
    }

    if (completionDepartmentId && !validRows.length) {
      toast.error("Kamida bitta xomashyo qo'shing.");

      return;
    }

    if (!completionDepartmentId && recipeRows.length) {
      toast.error("Yakunlovchi bo'limni tanlang yoki retsept qatorlarini o'chiring.");

      return;
    }

    const ids = validRows.map((row) => Number(row.raw_material_id));

    if (new Set(ids).size !== ids.length) {
      toast.error("Bitta xomashyoni retseptga ikki marta qo'shib bo'lmaydi.");

      return;
    }

    setRecipeSaving(true);

    try {
      const { data } = await saveProductRecipe(product.id, {
        completion_department_id: completionDepartmentId ? Number(completionDepartmentId) : null,

        items: validRows.map((row) => ({
          raw_material_id: Number(row.raw_material_id),

          quantity_per_pair: Number(row.quantity_per_pair),

          // Bo'sh bo'lsa server yakunlovchi bo'limni qo'yadi.
          department_id: row.department_id ? Number(row.department_id) : null,
        })),
      });

      setCompletionDepartmentId(data.recipe?.completion_department_id || "");

      setRecipeRows(
        (data.recipe?.materials || []).map((material) => ({
          row_id: material.id,

          raw_material_id: material.raw_material_id,

          quantity_per_pair: material.quantity_per_pair,

          department_id: material.department_id || "",
        })),
      );

      toast.success("Mahsulot retsepti saqlandi.");
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Retseptni saqlashda xatolik.");
    } finally {
      setRecipeSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 430,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            display: "grid",
            placeItems: "center",
            borderRadius: "22px",

            border: "1px solid rgba(110, 22, 34,.10)",

            backgroundColor: "rgba(110, 22, 34,.05)",
          }}
        >
          <CircularProgress
            size={34}
            thickness={4.5}
            sx={{
              color: "#6e1622",
            }}
          />
        </Box>

        <Typography
          sx={{
            color: "var(--aa-text-tertiary)",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          Mahsulot ma'lumotlari yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>

        <Button
          variant="outlined"
          onClick={() => navigate("/products")}
          sx={{
            mt: 2,
            borderRadius: "12px",
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          Mahsulotlarga qaytish
        </Button>
      </Box>
    );
  }

  if (!product) {
    return <Alert severity="warning">Mahsulot topilmadi.</Alert>;
  }

  return (
    <Box
      className="crm-page product-detail-page"
      sx={{
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        minHeight: 0,
        pr: 0.5,
        pb: 4,
        overflowY: "auto",
      }}
    >
      <style>{productPageStyles}</style>

      <Box
        component="section"
        className="crm-detail-hero product-profile-hero"
        sx={{
          position: "relative",
          isolation: "isolate",
          mb: 2.5,

          p: {
            xs: 2.5,
            md: 3,
          },

          overflow: "hidden",
          color: "#ffffff",
          borderRadius: "25px",

          border: "1px solid rgba(255,255,255,.075)",

          backgroundColor: "#151211 !important",

          backgroundImage:
            "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.34),transparent 30%),linear-gradient(145deg,#151211,#1e1a18 52%,#3a1219) !important",

          boxShadow: "0 24px 60px rgba(23, 17, 15,.20)",

          "&::before": {
            content: '""',
            position: "absolute",
            width: 390,
            height: 390,
            top: -275,
            right: -210,
            borderRadius: "50%",

            border: "1px solid rgba(201, 168, 117,.16)",

            boxShadow:
              "0 0 81px 22px rgba(201, 168, 117,.022),0 0 161px 43px rgba(201, 168, 117,.014)",

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
              xl: ".82fr 1.18fr",
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

                  background: "linear-gradient(90deg,#c9a875,#a3283a)",
                }}
              />

              <Typography
                sx={{
                  color: "#d9b782 !important",

                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".13em",
                  textTransform: "uppercase",
                }}
              >
                Mahsulot boshqaruvi
              </Typography>
            </Box>

            <Box
              sx={{
                mt: 1.6,
                display: "flex",

                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },

                flexDirection: {
                  xs: "column",
                  sm: "row",
                },

                gap: 1.8,
              }}
            >
              <Avatar
                src={getImageUrl(primaryImage?.image_url)}
                variant="rounded"
                sx={{
                  width: 76,
                  height: 76,
                  flexShrink: 0,
                  color: "#ffffff",
                  fontSize: 26,
                  fontWeight: 700,
                  borderRadius: "20px",

                  border: "4px solid rgba(255,255,255,.11)",

                  background: "linear-gradient(135deg,#4d0f18,#8c1d2b)",

                  boxShadow: "0 17px 38px rgba(77, 15, 24,.30)",
                }}
              >
                {getInitial(product.name)}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <StatusChip active={product.is_active} dark />

                  {product.sku && (
                    <Chip size="small" label={`SKU: ${product.sku}`} sx={darkChipSx} />
                  )}
                </Box>

                <Typography
                  component="h1"
                  sx={{
                    mt: 1.2,

                    color: "#ffffff !important",

                    fontSize: {
                      xs: 28,
                      md: 37,
                    },

                    lineHeight: 1.06,
                    fontFamily: "var(--aa-display)",
                    fontWeight: 400,
                    letterSpacing: "-.024em",
                    wordBreak: "break-word",
                  }}
                >
                  {product.name || "Nomsiz mahsulot"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.9,

                    color: "rgba(255,255,255,.45) !important",

                    fontSize: 11.5,
                    lineHeight: 1.65,
                  }}
                >
                  {product.category_name || "Kategoriyasiz"} · {product.unit || "par"}
                  {product.model ? ` · ${product.model}` : ""}
                </Typography>
              </Box>
            </Box>

            <Button
              onClick={() => navigate("/products")}
              sx={{
                mt: 2.4,
                minHeight: 41,
                px: 2,

                color: "#ffffff !important",

                borderRadius: "12px",

                border: "1px solid rgba(255,255,255,.10)",

                backgroundColor: "rgba(255,255,255,.055)",

                fontSize: 11,
                fontWeight: 700,
                textTransform: "none",

                "&:hover": {
                  backgroundColor: "rgba(255,255,255,.10)",
                },
              }}
            >
              ← Mahsulotlarga qaytish
            </Button>
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
            <HeroMetric
              label="Sotuv narxi"
              value={formatMoney(product.sale_price)}
              helper="Mijozga sotiladigan narx"
              tone="green"
            />

            {canManageProduct && unitCost !== null && (
              <HeroMetric
                label="Tannarx"
                value={formatMoney(unitCost)}
                helper="Sarflangan xomashyodan hisoblangan"
                tone="violet"
              />
            )}

            {/* Ruxsat bo'lmasa karta umuman chizilmaydi — nol qiymat bilan turishi
                ma'lumot yo'q degan noto'g'ri taassurot beradi. */}
            {canViewPrices && (
              <HeroMetric
                label="Bo‘limlar"
                value={formatNumber(priceRows.length)}
                helper="Narx biriktirilgan bo‘limlar"
                tone="amber"
              />
            )}

            {canViewRecipe && (
              <HeroMetric
                label="Retsept"
                value={`${formatNumber(recipeRows.length)} ta`}
                helper="Biriktirilgan xomashyolar"
                tone="red"
              />
            )}
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          mb: 2.5,
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            xl: "390px minmax(0,1fr)",
          },

          gap: 2,
          alignItems: "start",
        }}
      >
        <Surface sx={{ p: 2 }}>
          <SectionHeader
            title="Mahsulot rasmlari"
            subtitle={`${formatNumber(images.length)} ta rasm mavjud`}
          />

          <Box
            sx={{
              height: {
                xs: 285,
                sm: 345,
              },

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderRadius: "19px",

              border: "1px solid var(--aa-border)",

              background:
                "radial-gradient(circle at 100% 0%,rgba(110, 22, 34,.10),transparent 34%),linear-gradient(145deg,var(--aa-surface-muted),var(--aa-surface-solid))",
            }}
          >
            {activeImage ? (
              <Box
                component="img"
                src={getImageUrl(activeImage)}
                alt={product.name}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Avatar
                variant="rounded"
                sx={{
                  width: 112,
                  height: 112,
                  borderRadius: "28px",
                  color: "#ffffff",
                  fontSize: 42,
                  fontWeight: 700,

                  background: "linear-gradient(135deg,#4d0f18,#8c1d2b)",

                  boxShadow: "0 18px 40px rgba(77, 15, 24,.20)",
                }}
              >
                {getInitial(product.name)}
              </Avatar>
            )}
          </Box>

          {images.length ? (
            <Box
              sx={{
                mt: 1.3,
                display: "grid",

                gridTemplateColumns: "repeat(4,minmax(0,1fr))",

                gap: 1,
              }}
            >
              {images.slice(0, 8).map((image) => {
                const selected = activeImage === image.image_url;

                return (
                  <Button
                    key={image.id}
                    onClick={() => setSelectedImage(image.image_url)}
                    sx={{
                      height: 68,
                      minWidth: 0,
                      p: 0,
                      overflow: "hidden",
                      borderRadius: "14px",

                      border: selected ? "2px solid #6e1622" : "1px solid var(--aa-border)",

                      boxShadow: selected ? "0 9px 22px rgba(110, 22, 34,.14)" : "none",
                    }}
                  >
                    <Box
                      component="img"
                      src={getImageUrl(image.image_url)}
                      alt={product.name}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Button>
                );
              })}
            </Box>
          ) : (
            <Box
              sx={{
                mt: 1.3,
                p: 1.6,
                textAlign: "center",
                borderRadius: "15px",

                border: "1px dashed var(--aa-border-strong)",

                backgroundColor: "var(--aa-surface-muted)",
              }}
            >
              <Typography
                sx={{
                  color: "var(--aa-text-tertiary)",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Mahsulot rasmi yuklanmagan.
              </Typography>
            </Box>
          )}
        </Surface>

        <Surface sx={{ p: 2.4 }}>
          <SectionHeader
            title="Mahsulot ma’lumotlari"
            subtitle="Narx, kategoriya va tizimdagi asosiy ma’lumotlar"
            actions={<StatusChip active={product.is_active} />}
          />

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                // Tannarx va foyda faqat ishlab chiqarish bo'lgandagina
                // chiziladi — ustunlar soni ko'rinadiganlarga qarab.
                sm:
                  canManageProduct && unitCost !== null
                    ? "repeat(3,minmax(0,1fr))"
                    : "1fr",
              },

              gap: 1.3,
            }}
          >
            {canManageProduct && unitCost !== null && (
              <PricePanel
                label="Tannarx"
                value={formatMoney(unitCost)}
                helper="Sarflangan xomashyodan hisoblangan"
                tone="blue"
              />
            )}

            <PricePanel
              label="Sotuv narxi"
              value={formatMoney(product.sale_price)}
              helper="Mijozga sotish narxi"
              tone="green"
            />

            {canManageProduct && profitAmount !== null && (
              <PricePanel
                label="Bir pardagi foyda"
                value={formatMoney(profitAmount)}
                helper="Sotuv narxi minus hisoblangan tannarx"
                tone={profitAmount >= 0 ? "green" : "red"}
              />
            )}
          </Box>

          <Box
            sx={{
              mt: 1.6,
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,minmax(0,1fr))",
                lg: "repeat(3,minmax(0,1fr))",
              },

              gap: 1.2,
            }}
          >
            <InfoItem label="Mahsulot ID" value={`#${product.id}`} accent />

            <InfoItem label="SKU" value={product.sku} />

            <InfoItem label="Model" value={product.model} />

            <InfoItem label="Kategoriya" value={product.category_name} />

            <InfoItem label="Rang" value={product.color} />

            <InfoItem label="O‘lchov birligi" value={product.unit} />

            <InfoItem label="Yaratilgan" value={formatDate(product.created_at)} />

            <InfoItem label="Yangilangan" value={formatDate(product.updated_at)} />
          </Box>

          <Box
            sx={{
              mt: 1.6,
              p: 2,
              borderRadius: "18px",

              border: "1px solid var(--aa-border)",

              background:
                "radial-gradient(circle at 100% 0%,rgba(110, 22, 34,.08),transparent 32%),linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",
            }}
          >
            <Typography
              sx={{
                color: "var(--aa-text)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Mahsulot tavsifi
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: "var(--aa-text-secondary)",
                fontSize: 11,
                lineHeight: 1.75,
                wordBreak: "break-word",
              }}
            >
              {product.description || "Tavsif kiritilmagan."}
            </Typography>
          </Box>
        </Surface>
      </Box>

      {canViewPrices && (
        <Surface
          sx={{
            mb: 2.5,
            p: 2.4,
          }}
        >
          <SectionHeader
            title="Bo‘lim narxlari"
            subtitle="Har bir ishlab chiqarish bo‘limi uchun bir birlik mahsulot ish haqi"
            actions={
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
              >
                {canCreateDepartment && (
                  <Button variant="outlined" onClick={openDepartmentModal} sx={secondaryButtonSx}>
                    + Bo‘lim qo‘shish
                  </Button>
                )}

                <Button
                  variant="contained"
                  onClick={handleSavePrices}
                  disabled={priceSaving || !priceRows.length}
                  sx={primaryButtonSx}
                >
                  {priceSaving ? "Saqlanmoqda..." : "Narxlarni saqlash"}
                </Button>
              </Stack>
            }
          />

          {priceRows.length ? (
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,minmax(0,1fr))",
                  xl: "repeat(3,minmax(0,1fr))",
                },

                gap: 1.3,
              }}
            >
              {priceRows.map((row, index) => (
                <Box
                  key={row.department_id}
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    p: 1.8,
                    borderRadius: "18px",

                    border: "1px solid var(--aa-border)",

                    background:
                      "linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",

                    "&::after": {
                      content: '""',
                      position: "absolute",
                      width: 95,
                      height: 95,
                      top: -55,
                      right: -45,
                      borderRadius: "50%",

                      backgroundColor: "rgba(110, 22, 34,.045)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      mb: 1.4,
                      display: "flex",
                      alignItems: "flex-start",

                      justifyContent: "space-between",

                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        noWrap
                        sx={{
                          color: "var(--aa-text)",

                          fontSize: 12.5,

                          fontWeight: 700,
                        }}
                      >
                        {index + 1}. {row.department_name}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          mt: 0.4,
                          color: "var(--aa-text-tertiary)",

                          fontSize: 9.5,
                        }}
                      >
                        {row.department_code || "Kod kiritilmagan"}
                      </Typography>
                    </Box>

                    <StatusChip active={row.is_active} />
                  </Box>

                  <MoneyTextField
                    fullWidth
                    label="Bir birlik uchun ish haqi"
                    size="small"
                    value={row.price_per_unit}
                    onChange={(event) => handlePriceChange(row.department_id, event.target.value)}
                    helperText="Masalan: 5 000"
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <Alert
              severity="info"
              action={
                <Button color="info" size="small" onClick={openDepartmentModal}>
                  Bo‘lim qo‘shish
                </Button>
              }
              sx={{
                borderRadius: "15px",
              }}
            >
              Narx belgilash uchun avval ishlab chiqarish bo‘limlarini yarating.
            </Alert>
          )}
        </Surface>
      )}

      {canViewRecipe && (
        <Surface sx={{ p: 2.4 }}>
          <SectionHeader
            title="Ishlab chiqarish retsepti"
            subtitle="Bir par mahsulot uchun sarflanadigan xomashyolar va yakunlovchi bo‘lim"
            actions={
              <Button
                variant="contained"
                onClick={handleSaveRecipe}
                disabled={
                  recipeSaving ||
                  Boolean(
                    completionDepartmentId &&
                    recipeRows.some(
                      (row) => !row.raw_material_id || Number(row.quantity_per_pair || 0) <= 0,
                    ),
                  )
                }
                sx={primaryButtonSx}
              >
                {recipeSaving ? "Saqlanmoqda..." : "Retseptni saqlash"}
              </Button>
            }
          />

          <Alert
            severity="info"
            sx={{
              mb: 2,
              borderRadius: "15px",

              border: "1px solid rgba(31, 111, 139,.14)",
            }}
          >
            Ishchi yakunlovchi bo‘limda ish topshirganda tayyor mahsulot omboriga qo‘shiladi va
            retseptdagi xomashyolar avtomatik kamayadi.
          </Alert>

          <TextField
            select
            fullWidth
            label="Yakunlovchi bo‘lim"
            value={completionDepartmentId}
            onChange={(event) => setCompletionDepartmentId(event.target.value)}
            helperText="Mahsulot to‘liq tayyor bo‘lib omborga topshiriladigan bo‘lim."
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Avtomatik ombor hisobi o‘chirilgan</MenuItem>

            {priceRows.map((row) => (
              <MenuItem key={row.department_id} value={row.department_id}>
                {row.department_name}
              </MenuItem>
            ))}
          </TextField>

          <Stack spacing={1.3}>
            {recipeRows.map((row, index) => {
              const selectedMaterial = rawMaterials.find(
                (material) => Number(material.id) === Number(row.raw_material_id),
              );

              return (
                <Box
                  key={row.row_id}
                  sx={{
                    display: "grid",

                    gridTemplateColumns: {
                      xs: "1fr",

                      md: "minmax(200px,1fr) minmax(180px,220px) 180px auto",
                    },

                    gap: 1.2,
                    p: 1.5,
                    borderRadius: "17px",

                    border: "1px solid var(--aa-border)",

                    background:
                      "linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",
                  }}
                >
                  <TextField
                    select
                    size="small"
                    label={`Xomashyo ${index + 1}`}
                    value={row.raw_material_id}
                    onChange={(event) =>
                      updateRecipeRow(row.row_id, "raw_material_id", event.target.value)
                    }
                  >
                    <MenuItem value="">Tanlang</MenuItem>

                    {rawMaterials.map((material) => {
                      const selectedElsewhere = recipeRows.some(
                        (other) =>
                          other.row_id !== row.row_id &&
                          Number(other.raw_material_id) === Number(material.id),
                      );

                      return (
                        <MenuItem
                          key={material.id}
                          value={material.id}
                          disabled={selectedElsewhere}
                        >
                          {material.name} ({material.unit || "birlik"})
                        </MenuItem>
                      );
                    })}
                  </TextField>

                  <TextField
                    size="small"
                    type="number"
                    label={`1 par uchun (${selectedMaterial?.unit || "miqdor"})`}
                    value={row.quantity_per_pair}
                    onChange={(event) =>
                      updateRecipeRow(row.row_id, "quantity_per_pair", event.target.value)
                    }
                    inputProps={{
                      min: 0.001,
                      step: 0.001,
                    }}
                  />

                  {/* Qaysi bosqichda sarflanadi: teri kroyda, ip tikuvda. Bo'sh
                      qoldirilsa yakunlovchi bo'limda sarflanadi — eski xatti-harakat. */}
                  <TextField
                    select
                    size="small"
                    label="Qaysi bo‘limda"
                    value={row.department_id || ""}
                    onChange={(event) =>
                      updateRecipeRow(row.row_id, "department_id", event.target.value)
                    }
                    helperText={row.department_id ? " " : "Yakunlovchi bo‘lim"}
                  >
                    <MenuItem value="">Yakunlovchi bo‘lim</MenuItem>

                    {priceRows.map((department) => (
                      <MenuItem key={department.department_id} value={department.department_id}>
                        {department.department_name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => removeRecipeRow(row.row_id)}
                    sx={{
                      minWidth: 96,
                      borderRadius: "11px",

                      textTransform: "none",

                      fontWeight: 600,
                    }}
                  >
                    O‘chirish
                  </Button>
                </Box>
              );
            })}
          </Stack>

          <Box
            sx={{
              mt: 1.5,
              display: "flex",

              alignItems: {
                xs: "stretch",
                sm: "center",
              },

              justifyContent: "space-between",

              flexDirection: {
                xs: "column",
                sm: "row",
              },

              gap: 1.2,
            }}
          >
            <Button
              variant="outlined"
              onClick={addRecipeRow}
              disabled={!rawMaterials.length || recipeRows.length >= rawMaterials.length}
              sx={secondaryButtonSx}
            >
              + Xomashyo qo‘shish
            </Button>

            <Typography
              sx={{
                color: "var(--aa-text-tertiary)",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {formatNumber(recipeRows.length)} / {formatNumber(rawMaterials.length)} ta xomashyo
              tanlangan
            </Typography>
          </Box>

          {!rawMaterials.length && (
            <Alert
              severity="warning"
              sx={{
                mt: 1.5,
                borderRadius: "15px",
              }}
            >
              Retsept tuzish uchun avval xomashyo yarating.
            </Alert>
          )}
        </Surface>
      )}

      {/* Haqiqiy tannarx — ombor harakatlaridan yig'ilgan sarf va rejadan farqi. */}
      {canViewRecipe && costReport && costReport.produced_pairs > 0 && (
        <Surface sx={{ mt: 2.5, p: 2.4 }}>
          <SectionHeader
            title="Haqiqiy tannarx"
            subtitle={`${formatNumber(costReport.produced_pairs)} par ishlab chiqarilgan — qaysi xomashyodan qancha ketgani`}
          />

          <Box
            sx={{
              mb: 2,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3,minmax(0,1fr))" },
              gap: 1.3,
            }}
          >
            <PricePanel
              label="Bir par tannarxi"
              value={formatMoney(costReport.cost_per_pair)}
              helper="Faqat xomashyo sarfi"
              tone="blue"
            />

            <PricePanel
              label="Jami xomashyo"
              value={formatMoney(costReport.total_material_cost)}
              helper="Butun ishlab chiqarish bo‘yicha"
              tone="amber"
            />

            <PricePanel
              label="Sotuv narxi"
              value={formatMoney(costReport.sale_price)}
              helper={
                costReport.sale_price > 0
                  ? `Xomashyo ulushi: ${Math.round((costReport.cost_per_pair / costReport.sale_price) * 100)}%`
                  : "Sotuv narxi belgilanmagan"
              }
              tone={costReport.sale_price > costReport.cost_per_pair ? "green" : "red"}
            />
          </Box>

          <Stack spacing={1}>
            {costReport.materials.map((material) => {
              const over = material.variance > 0.001;
              const under = material.variance < -0.001;

              return (
                <Box
                  key={material.raw_material_id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 150px 150px 150px" },
                    alignItems: "center",
                    gap: 1.2,
                    p: 1.5,
                    borderRadius: "15px",
                    border: "1px solid var(--aa-border)",
                    backgroundColor: "var(--aa-surface-muted)",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: "var(--aa-text)", fontSize: 12.5, fontWeight: 700 }}>
                      {material.name}
                    </Typography>

                    <Typography sx={{ mt: 0.2, color: "var(--aa-text-tertiary)", fontSize: 10 }}>
                      {material.department_name || "Bo‘lim belgilanmagan"} · 1 par uchun{" "}
                      {material.quantity_per_pair} {material.unit}
                    </Typography>
                  </Box>

                  <InfoItem
                    label="Reja"
                    value={`${formatNumber(material.expected_quantity)} ${material.unit}`}
                  />

                  <InfoItem
                    label="Haqiqatda"
                    value={`${formatNumber(material.used_quantity)} ${material.unit}`}
                    valueColor={
                      over ? "var(--aa-danger)" : under ? "var(--aa-success)" : "var(--aa-text)"
                    }
                  />

                  <InfoItem
                    label="Summa"
                    value={formatMoney(material.total_cost)}
                    valueColor="var(--aa-text)"
                  />
                </Box>
              );
            })}
          </Stack>

          {costReport.materials.some((material) => Math.abs(material.variance) > 0.001) && (
            <Alert severity="warning" sx={{ mt: 1.6, borderRadius: "15px", fontSize: 11.5 }}>
              Ba’zi xomashyolarda reja va haqiqiy sarf farq qilyapti. Farq ish yozuvlarida
              kiritilgan haqiqiy miqdordan chiqadi — retseptni yangilash kerakmi yoki sexda isrof
              bormi, shuni tekshiring.
            </Alert>
          )}
        </Surface>
      )}

      <Dialog
        open={departmentOpen}
        onClose={closeDepartmentModal}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            overflow: "hidden",
            borderRadius: "23px",

            border: "1px solid rgba(138, 128, 122,.20)",

            boxShadow: "0 30px 80px rgba(23, 17, 15,.22)",
          },
        }}
      >
        <DialogTitle
          className="product-dialog-title"
          sx={{
            px: 3,
            py: 2.35,

            color: "#ffffff !important",

            backgroundColor: "#151211 !important",

            backgroundImage:
              "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.28),transparent 36%),linear-gradient(135deg,#151211,#2a1117) !important",
          }}
        >
          <Typography
            sx={{
              color: "#ffffff !important",

              fontSize: 19,
              fontWeight: 700,
            }}
          >
            Yangi bo‘lim qo‘shish
          </Typography>

          <Typography
            sx={{
              mt: 0.5,

              color: "rgba(255,255,255,.43) !important",

              fontSize: 10.5,
            }}
          >
            Ishlab chiqarish bo‘limi ma’lumotlarini kiriting
          </Typography>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            py: 2.7,
          }}
        >
          <Stack
            spacing={2}
            sx={{
              pt: 0.5,
            }}
          >
            <TextField
              autoFocus
              required
              label="Bo‘lim nomi"
              value={departmentForm.name}
              onChange={handleDepartmentChange("name")}
              placeholder="Masalan: Tikuv"
            />

            <TextField
              required
              label="Bo‘lim kodi"
              value={departmentForm.code}
              onChange={handleDepartmentChange("code")}
              helperText="Faqat lotin harflari, raqam va _ belgisi. Masalan: tikuv"
            />

            <TextField
              multiline
              minRows={3}
              label="Izoh"
              value={departmentForm.description}
              onChange={handleDepartmentChange("description")}
              placeholder="Ixtiyoriy"
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.1,

            borderTop: "1px solid #e8e1d8",

            backgroundColor: "var(--aa-surface-muted)",
          }}
        >
          <Button
            onClick={closeDepartmentModal}
            disabled={departmentSaving}
            sx={{
              color: "var(--aa-text-secondary)",
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            onClick={handleCreateDepartment}
            disabled={
              departmentSaving || !departmentForm.name.trim() || !departmentForm.code.trim()
            }
            sx={primaryButtonSx}
          >
            {departmentSaving ? "Saqlanmoqda..." : "Bo‘limni saqlash"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const darkChipSx = {
  height: 27,

  color: "rgba(255,255,255,.66) !important",

  fontSize: 9.5,
  fontWeight: 700,

  border: "1px solid rgba(255,255,255,.09)",

  backgroundColor: "rgba(255,255,255,.055) !important",
};

const secondaryButtonSx = {
  minHeight: 40,
  px: 1.8,
  color: "var(--aa-text-secondary)",
  borderRadius: "12px",
  borderColor: "#d8cec1",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",
  backgroundColor: "var(--aa-surface-solid)",

  "&:hover": {
    color: "#6e1622",

    borderColor: "rgba(110, 22, 34,.22)",

    backgroundColor: "rgba(110, 22, 34,.04)",
  },
};

const primaryButtonSx = {
  minHeight: 40,
  px: 2,
  color: "#ffffff",
  borderRadius: "12px",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",

  background: "linear-gradient(135deg,#4d0f18,#7a1826)",

  boxShadow: "0 10px 24px rgba(77, 15, 24,.18)",

  "&:hover": {
    background: "linear-gradient(135deg,#4d0f18,#6e1622)",
  },
};

const productPageStyles = `
  .crm-page .product-profile-hero {
    color: #ffffff !important;
    background-color: #151211 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(140, 29, 43,.34),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #151211,
        #1e1a18 52%,
        #3a1219
      ) !important;
  }

  .product-dialog-title {
    color: #ffffff !important;
    background-color: #151211 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(140, 29, 43,.28),
        transparent 36%
      ),
      linear-gradient(
        135deg,
        #151211,
        #2a1117
      ) !important;
  }
`;

export default Product;
