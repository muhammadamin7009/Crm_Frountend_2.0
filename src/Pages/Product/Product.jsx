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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SharedHeroMetric from "../../Components/UI/HeroMetric";
import ActiveStatusChip from "../../Components/UI/ActiveStatusChip";

import {
  getProduct,
  getProductRecipe,
  saveProductDepartmentPrices,
  saveProductRecipe,
} from "../../api/products";
import { createDepartment, getDepartments } from "../../api/departments";
import { useAuth } from "../../Context/AuthContext";
import { hasPermission } from "../../utils/permissions";

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

const formatNumber = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

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

const Surface = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid #e4e9ef",
      backgroundColor: "#ffffff",
      boxShadow: "0 14px 40px rgba(15,23,42,.045)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const HeroMetric = (props) => (
  <SharedHeroMetric {...props} labelSx={{ mt: 1.4 }} />
);
const InfoItem = ({ label, value, accent = false }) => (
  <Box
    sx={{
      minWidth: 0,
      p: 1.65,
      borderRadius: "16px",

      border: accent ? "1px solid rgba(153,27,27,.14)" : "1px solid #e7ebf0",

      background: accent
        ? "linear-gradient(145deg,rgba(153,27,27,.055),#ffffff)"
        : "linear-gradient(145deg,#ffffff,#f8fafc)",
    }}
  >
    <Typography
      sx={{
        color: "#94a3b8",
        fontSize: 9.5,
        fontWeight: 750,
      }}
    >
      {label}
    </Typography>

    <Typography
      noWrap
      sx={{
        mt: 0.65,

        color: accent ? "#991b1b" : "#334155",

        fontSize: 12,
        fontWeight: 900,
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const PricePanel = ({ label, value, tone = "green", helper }) => {
  const tones = {
    green: {
      color: "#15803d",
      background: "rgba(34,197,94,.08)",
      border: "rgba(34,197,94,.18)",
    },

    blue: {
      color: "#1d4ed8",
      background: "rgba(37,99,235,.07)",
      border: "rgba(37,99,235,.17)",
    },

    red: {
      color: "#991b1b",
      background: "rgba(153,27,27,.07)",
      border: "rgba(153,27,27,.16)",
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
          color: "#64748b",
          fontSize: 10,
          fontWeight: 800,
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
          fontWeight: 950,
          letterSpacing: "-.04em",
        }}
      >
        {value}
      </Typography>

      {helper && (
        <Typography
          sx={{
            mt: 0.6,
            color: "#94a3b8",
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
          color: "#0f172a",
          fontSize: 16,
          fontWeight: 950,
          letterSpacing: "-.02em",
        }}
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography
          sx={{
            mt: 0.55,
            color: "#94a3b8",
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

  const canManagePrices =
    MANAGER_ROLES.includes(currentUser?.role) && hasPermission(currentUser, "products.manage");

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

  const images = useMemo(() => product?.images || [], [product?.images]);

  const primaryImage = useMemo(
    () => images.find((image) => image.is_primary) || images[0],
    [images],
  );

  const activeImage = selectedImage || primaryImage?.image_url || "";

  const profitAmount = useMemo(
    () => Number(product?.sale_price || 0) - Number(product?.purchase_price || 0),
    [product?.purchase_price, product?.sale_price],
  );

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [{ data }, departmentsRes, recipeRes] = await Promise.all([
        getProduct(id),

        canManagePrices
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

        canManagePrices
          ? getProductRecipe(id)
          : Promise.resolve({
              data: {
                recipe: {
                  materials: [],
                },
                raw_materials: [],
              },
            }),
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
        })),
      );

      setRawMaterials(recipeRes.data?.raw_materials || []);
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
  }, [canManagePrices, id]);

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
      toast.error("Har bir homashyo va 1 par uchun sarf miqdorini to'g'ri kiriting.");

      return;
    }

    if (completionDepartmentId && !validRows.length) {
      toast.error("Kamida bitta homashyo qo'shing.");

      return;
    }

    if (!completionDepartmentId && recipeRows.length) {
      toast.error("Yakunlovchi bo'limni tanlang yoki retsept qatorlarini o'chiring.");

      return;
    }

    const ids = validRows.map((row) => Number(row.raw_material_id));

    if (new Set(ids).size !== ids.length) {
      toast.error("Bitta homashyoni retseptga ikki marta qo'shib bo'lmaydi.");

      return;
    }

    setRecipeSaving(true);

    try {
      const { data } = await saveProductRecipe(product.id, {
        completion_department_id: completionDepartmentId ? Number(completionDepartmentId) : null,

        items: validRows.map((row) => ({
          raw_material_id: Number(row.raw_material_id),

          quantity_per_pair: Number(row.quantity_per_pair),
        })),
      });

      setCompletionDepartmentId(data.recipe?.completion_department_id || "");

      setRecipeRows(
        (data.recipe?.materials || []).map((material) => ({
          row_id: material.id,

          raw_material_id: material.raw_material_id,

          quantity_per_pair: material.quantity_per_pair,
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

            border: "1px solid rgba(153,27,27,.10)",

            backgroundColor: "rgba(153,27,27,.05)",
          }}
        >
          <CircularProgress
            size={34}
            thickness={4.5}
            sx={{
              color: "#991b1b",
            }}
          />
        </Box>

        <Typography
          sx={{
            color: "#94a3b8",
            fontSize: 12.5,
            fontWeight: 750,
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
            fontWeight: 900,
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
        className="product-profile-hero"
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
                  fontWeight: 950,
                  borderRadius: "20px",

                  border: "4px solid rgba(255,255,255,.11)",

                  background: "linear-gradient(135deg,#7f1d1d,#dc2626)",

                  boxShadow: "0 17px 38px rgba(127,29,29,.30)",
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
                    fontWeight: 950,
                    letterSpacing: "-.05em",
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
                fontWeight: 900,
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

            {canManagePrices && (
              <HeroMetric
                label="Xarid narxi"
                value={formatMoney(product.purchase_price)}
                helper="Mahsulot tannarxi"
                tone="violet"
              />
            )}

            <HeroMetric
              label="Bo‘limlar"
              value={formatNumber(priceRows.length)}
              helper="Narx biriktirilgan bo‘limlar"
              tone="amber"
            />

            <HeroMetric
              label="Retsept"
              value={`${formatNumber(recipeRows.length)} ta`}
              helper="Biriktirilgan homashyolar"
              tone="red"
            />
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

              border: "1px solid #e7ebf0",

              background:
                "radial-gradient(circle at 100% 0%,rgba(153,27,27,.06),transparent 34%),linear-gradient(145deg,#f8fafc,#ffffff)",
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
                  fontWeight: 950,

                  background: "linear-gradient(135deg,#7f1d1d,#dc2626)",

                  boxShadow: "0 18px 40px rgba(127,29,29,.20)",
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

                      border: selected ? "2px solid #991b1b" : "1px solid #e4e9ef",

                      boxShadow: selected ? "0 9px 22px rgba(153,27,27,.14)" : "none",
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

                border: "1px dashed #cbd5e1",

                backgroundColor: "#f8fafc",
              }}
            >
              <Typography
                sx={{
                  color: "#94a3b8",
                  fontSize: 11,
                  fontWeight: 750,
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

                sm: canManagePrices ? "repeat(3,minmax(0,1fr))" : "1fr",
              },

              gap: 1.3,
            }}
          >
            {canManagePrices && (
              <PricePanel
                label="Xarid narxi"
                value={formatMoney(product.purchase_price)}
                helper="Mahsulot tannarxi"
                tone="blue"
              />
            )}

            <PricePanel
              label="Sotuv narxi"
              value={formatMoney(product.sale_price)}
              helper="Mijozga sotish narxi"
              tone="green"
            />

            {canManagePrices && (
              <PricePanel
                label="Narx farqi"
                value={formatMoney(profitAmount)}
                helper="Sotuv va xarid narxi farqi"
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

              border: "1px solid #e7ebf0",

              background:
                "radial-gradient(circle at 100% 0%,rgba(153,27,27,.055),transparent 32%),linear-gradient(145deg,#ffffff,#f8fafc)",
            }}
          >
            <Typography
              sx={{
                color: "#334155",
                fontSize: 12,
                fontWeight: 950,
              }}
            >
              Mahsulot tavsifi
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: "#64748b",
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

      {canManagePrices && (
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
                <Button variant="outlined" onClick={openDepartmentModal} sx={secondaryButtonSx}>
                  + Bo‘lim qo‘shish
                </Button>

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

                    border: "1px solid #e7ebf0",

                    background: "linear-gradient(145deg,#ffffff,#f8fafc)",

                    "&::after": {
                      content: '""',
                      position: "absolute",
                      width: 95,
                      height: 95,
                      top: -55,
                      right: -45,
                      borderRadius: "50%",

                      backgroundColor: "rgba(153,27,27,.045)",
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
                          color: "#334155",

                          fontSize: 12.5,

                          fontWeight: 950,
                        }}
                      >
                        {index + 1}. {row.department_name}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          mt: 0.4,
                          color: "#94a3b8",

                          fontSize: 9.5,
                        }}
                      >
                        {row.department_code || "Kod kiritilmagan"}
                      </Typography>
                    </Box>

                    <StatusChip active={row.is_active} />
                  </Box>

                  <TextField
                    fullWidth
                    label="Bir birlik uchun ish haqi"
                    type="number"
                    size="small"
                    value={row.price_per_unit}
                    onChange={(event) => handlePriceChange(row.department_id, event.target.value)}
                    inputProps={{
                      min: 0,
                      step: 100,
                    }}
                    helperText="Masalan: 5000"
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

      {canManagePrices && (
        <Surface sx={{ p: 2.4 }}>
          <SectionHeader
            title="Ishlab chiqarish retsepti"
            subtitle="Bir par mahsulot uchun sarflanadigan homashyolar va yakunlovchi bo‘lim"
            actions={
              <Button
                variant="contained"
                onClick={handleSaveRecipe}
                disabled={recipeSaving}
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

              border: "1px solid rgba(37,99,235,.14)",
            }}
          >
            Ishchi yakunlovchi bo‘limda ish topshirganda tayyor mahsulot omboriga qo‘shiladi va
            retseptdagi homashyolar avtomatik kamayadi.
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

                      md: "minmax(220px,1fr) 220px auto",
                    },

                    gap: 1.2,
                    p: 1.5,
                    borderRadius: "17px",

                    border: "1px solid #e7ebf0",

                    background: "linear-gradient(145deg,#ffffff,#f8fafc)",
                  }}
                >
                  <TextField
                    select
                    size="small"
                    label={`Homashyo ${index + 1}`}
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

                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => removeRecipeRow(row.row_id)}
                    sx={{
                      minWidth: 96,
                      borderRadius: "11px",

                      textTransform: "none",

                      fontWeight: 850,
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
              + Homashyo qo‘shish
            </Button>

            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 10,
                fontWeight: 750,
              }}
            >
              {formatNumber(recipeRows.length)} / {formatNumber(rawMaterials.length)} ta homashyo
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
              Retsept tuzish uchun avval homashyo yarating.
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

            border: "1px solid rgba(148,163,184,.20)",

            boxShadow: "0 30px 80px rgba(15,23,42,.22)",
          },
        }}
      >
        <DialogTitle
          className="product-dialog-title"
          sx={{
            px: 3,
            py: 2.35,

            color: "#ffffff !important",

            backgroundColor: "#0d1117 !important",

            backgroundImage:
              "radial-gradient(circle at 100% 0%,rgba(220,38,38,.28),transparent 36%),linear-gradient(135deg,#11151c,#321319) !important",
          }}
        >
          <Typography
            sx={{
              color: "#ffffff !important",

              fontSize: 19,
              fontWeight: 950,
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

            borderTop: "1px solid #edf0f3",

            backgroundColor: "#fafbfc",
          }}
        >
          <Button
            onClick={closeDepartmentModal}
            disabled={departmentSaving}
            sx={{
              color: "#64748b",
              fontWeight: 850,
              textTransform: "none",
            }}
          >
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            onClick={handleCreateDepartment}
            disabled={departmentSaving}
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
  fontWeight: 900,

  border: "1px solid rgba(255,255,255,.09)",

  backgroundColor: "rgba(255,255,255,.055) !important",
};

const secondaryButtonSx = {
  minHeight: 40,
  px: 1.8,
  color: "#64748b",
  borderRadius: "12px",
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
  borderRadius: "12px",
  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",

  background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",

  boxShadow: "0 10px 24px rgba(127,29,29,.18)",

  "&:hover": {
    background: "linear-gradient(135deg,#681818,#991b1b)",
  },
};

const productPageStyles = `
  .crm-page .product-profile-hero {
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

  .product-dialog-title {
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

export default Product;
