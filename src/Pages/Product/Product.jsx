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
  if (imagePath.startsWith("http")) return imagePath;

  const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${baseUrl}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return `${new Intl.NumberFormat("uz-UZ").format(Number(value))} so'm`;
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

  if (departmentRows.length) return departmentRows;
  return normalizeDepartmentPrices(prices);
};

const getInitial = (value) =>
  String(value || "Z")
    .trim()
    .slice(0, 1)
    .toUpperCase();

const Card = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: "20px",
      border: "1px solid rgba(148, 163, 184, 0.22)",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
      boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const InfoItem = ({ label, value }) => (
  <Box
    sx={{
      p: 1.7,
      borderRadius: "16px",
      background: "#ffffff",
      border: "1px solid rgba(148, 163, 184, 0.22)",
      boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
    }}
  >
    <Typography sx={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>{label}</Typography>

    <Typography
      sx={{
        mt: 0.6,
        fontSize: 15,
        fontWeight: 900,
        color: "#0f172a",
        wordBreak: "break-word",
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const PriceCard = ({ label, value, tone = "blue" }) => {
  const tones = {
    blue: {
      bg: "rgba(37, 99, 235, 0.08)",
      color: "#2563eb",
      border: "rgba(37, 99, 235, 0.16)",
    },
    green: {
      bg: "rgba(34, 197, 94, 0.1)",
      color: "#15803d",
      border: "rgba(34, 197, 94, 0.22)",
    },
    red: {
      bg: "rgba(139, 1, 1, 0.08)",
      color: "#8b0101",
      border: "rgba(139, 1, 1, 0.18)",
    },
  };

  const current = tones[tone] || tones.blue;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "18px",
        background: current.bg,
        border: `1px solid ${current.border}`,
      }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 850, color: "#64748b" }}>{label}</Typography>

      <Typography
        sx={{
          mt: 0.7,
          fontSize: 22,
          fontWeight: 950,
          color: current.color,
          letterSpacing: "-0.04em",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

const StatusChip = ({ active }) => (
  <Chip
    size="small"
    label={active ? "Faol" : "Nofaol"}
    sx={{
      height: 27,
      px: 0.4,
      fontSize: 12,
      fontWeight: 950,
      color: active ? "#15803d" : "#64748b",
      background: active ? "rgba(34, 197, 94, 0.12)" : "#f1f5f9",
      border: active ? "1px solid rgba(34, 197, 94, 0.24)" : "1px solid rgba(148, 163, 184, 0.24)",
    }}
  />
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
          : Promise.resolve({ data: { departments: [] } }),
        canManagePrices
          ? getProductRecipe(id)
          : Promise.resolve({ data: { recipe: { materials: [] }, raw_materials: [] } }),
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
        (recipeRes.data?.recipe?.materials || []).map((material) => ({
          row_id: material.id || `${material.raw_material_id}-${Date.now()}`,
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
    setPriceRows((prev) =>
      prev.map((row) =>
        Number(row.department_id) === Number(departmentId)
          ? { ...row, price_per_unit: value }
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

    setDepartmentForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "name" && !prev.code ? { code: makeDepartmentCode(value) } : {}),
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

      setPriceRows((prev) => [
        ...prev,
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
    if (!product?.id || !priceRows.length) return;

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
        setProduct((prev) => ({ ...prev, department_prices: updatedPrices }));
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
      { row_id: `${Date.now()}-${Math.random()}`, raw_material_id: "", quantity_per_pair: "" },
    ]);
  };

  const updateRecipeRow = (rowId, field, value) => {
    setRecipeRows((current) =>
      current.map((row) => (row.row_id === rowId ? { ...row, [field]: value } : row)),
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
      <Box sx={{ minHeight: 380, display: "grid", placeItems: "center" }}>
        <CircularProgress size={34} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>

        <Button
          variant="outlined"
          sx={{ mt: 2, borderRadius: "12px", fontWeight: 900, textTransform: "none" }}
          onClick={() => navigate("/products")}
        >
          Mahsulotlarga qaytish
        </Button>
      </Box>
    );
  }

  if (!product) return <Alert severity="warning">Mahsulot topilmadi.</Alert>;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minHeight: 0,
        pb: 3,
      }}
    >
      <Card sx={{ p: { xs: 2, md: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Chip
              label="Al-amin CRM • mahsulot profili"
              size="small"
              sx={{
                mb: 1,
                height: 25,
                fontSize: 12,
                fontWeight: 950,
                color: "#2563eb",
                background: "rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(37, 99, 235, 0.16)",
              }}
            />

            <Typography
              sx={{
                fontSize: { xs: 25, md: 32 },
                fontWeight: 950,
                color: "#0f172a",
                letterSpacing: "-0.055em",
                lineHeight: 1.08,
                wordBreak: "break-word",
              }}
            >
              {product.name || "Nomsiz mahsulot"}
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 14,
                fontWeight: 700,
                color: "#64748b",
              }}
            >
              {product.category_name || "Kategoriyasiz"} / {product.unit || "par"}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={() => navigate("/products")}
            sx={{
              minWidth: 105,
              height: 40,
              borderRadius: "13px",
              borderColor: "rgba(37, 99, 235, 0.22)",
              color: "#0f172a",
              fontWeight: 900,
              textTransform: "none",
              background: "#fff",
              flexShrink: 0,
              "&:hover": {
                borderColor: "#2563eb",
                background: "rgba(37, 99, 235, 0.04)",
              },
            }}
          >
            Orqaga
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "340px 1fr" },
            gap: 2.3,
            alignItems: "start",
          }}
        >
          <Box>
            <Box
              sx={{
                height: { xs: 260, sm: 310, lg: 320 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: "20px",
                border: "1px solid rgba(148, 163, 184, 0.22)",
                background:
                  "linear-gradient(135deg, rgba(248,250,252,0.95), rgba(241,245,249,0.85))",
              }}
            >
              {activeImage ? (
                <img
                  src={getImageUrl(activeImage)}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 110,
                    height: 110,
                    borderRadius: "26px",
                    fontSize: 44,
                    fontWeight: 950,
                    bgcolor: "#8b0101",
                    color: "#fff",
                    boxShadow: "0 18px 38px rgba(139, 1, 1, 0.18)",
                  }}
                >
                  {getInitial(product.name)}
                </Avatar>
              )}
            </Box>

            {images.length > 0 ? (
              <Box
                sx={{
                  mt: 1.3,
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 1,
                }}
              >
                {images.slice(0, 8).map((image) => {
                  const selected = activeImage === image.image_url;

                  return (
                    <Button
                      key={image.id}
                      variant="outlined"
                      onClick={() => setSelectedImage(image.image_url)}
                      sx={{
                        height: 66,
                        minWidth: 0,
                        p: 0,
                        overflow: "hidden",
                        borderRadius: "14px",
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? "#2563eb" : "rgba(148, 163, 184, 0.28)",
                        boxShadow: selected ? "0 10px 22px rgba(37, 99, 235, 0.16)" : "none",
                      }}
                    >
                      <img
                        src={getImageUrl(image.image_url)}
                        alt={product.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
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
                  borderRadius: "16px",
                  background: "#f8fafc",
                  border: "1px dashed rgba(148, 163, 184, 0.42)",
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontSize: 13.5, fontWeight: 750, color: "#64748b" }}>
                  Mahsulot rasmi yuklanmagan.
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
                mb: 1.7,
              }}
            >
              <StatusChip active={product.is_active} />

              {product.sku && (
                <Chip
                  size="small"
                  label={`SKU: ${product.sku}`}
                  sx={{
                    height: 27,
                    px: 0.4,
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#334155",
                    background: "#f1f5f9",
                    border: "1px solid rgba(148, 163, 184, 0.24)",
                  }}
                />
              )}

              {product.model && (
                <Chip
                  size="small"
                  label={`Model: ${product.model}`}
                  sx={{
                    height: 27,
                    px: 0.4,
                    fontSize: 12,
                    fontWeight: 900,
                    color: "#334155",
                    background: "#f1f5f9",
                    border: "1px solid rgba(148, 163, 184, 0.24)",
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: canManagePrices ? "1fr 1fr" : "1fr",
                },
                gap: 1.4,
                mb: 1.8,
              }}
            >
              {canManagePrices && (
                <PriceCard
                  label="Xarid narxi"
                  value={formatMoney(product.purchase_price)}
                  tone="blue"
                />
              )}

              <PriceCard label="Sotuv narxi" value={formatMoney(product.sale_price)} tone="green" />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  xl: "repeat(4, 1fr)",
                },
                gap: 1.2,
              }}
            >
              <InfoItem label="ID" value={product.id} />
              <InfoItem label="Rang" value={product.color} />
              <InfoItem label="Kategoriya" value={product.category_name} />
              <InfoItem label="Birlik" value={product.unit} />
              <InfoItem label="Yaratilgan vaqt" value={formatDate(product.created_at)} />
              <InfoItem label="Yangilangan vaqt" value={formatDate(product.updated_at)} />
            </Box>

            <Box
              sx={{
                mt: 1.8,
                p: 2,
                borderRadius: "18px",
                background: "#f8fafc",
                border: "1px solid rgba(148, 163, 184, 0.18)",
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                Tavsif
              </Typography>

              <Typography
                sx={{
                  mt: 0.7,
                  fontSize: 14,
                  fontWeight: 650,
                  color: "#334155",
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                }}
              >
                {product.description || "Tavsif kiritilmagan."}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {canManagePrices && (
        <Card sx={{ mt: 2.5, p: { xs: 2, md: 2.5 } }}>
          <Box
            sx={{
              mb: 2,
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1.5,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
                Bo'lim narxlari
              </Typography>

              <Typography sx={{ mt: 0.5, fontSize: 13.5, fontWeight: 650, color: "#64748b" }}>
                Har bir bo'lim uchun bitta mahsulotga to'lanadigan ish haqi.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                onClick={openDepartmentModal}
                sx={{
                  minWidth: 135,
                  height: 40,
                  borderRadius: "13px",
                  textTransform: "none",
                  fontWeight: 900,
                }}
              >
                Bo'lim qo'shish
              </Button>

              <Button
                variant="contained"
                onClick={handleSavePrices}
                disabled={priceSaving || !priceRows.length}
                sx={{
                  minWidth: 165,
                  height: 40,
                  borderRadius: "13px",
                  textTransform: "none",
                  fontWeight: 950,
                  background: "linear-gradient(135deg, #8b0101, #b91c1c)",
                  boxShadow: "0 14px 28px rgba(139, 1, 1, 0.2)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #7f0101, #991b1b)",
                  },
                }}
              >
                {priceSaving ? "Saqlanmoqda..." : "Narxlarni saqlash"}
              </Button>
            </Stack>
          </Box>

          {priceRows.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  xl: "repeat(3, 1fr)",
                },
                gap: 1.3,
              }}
            >
              {priceRows.map((row) => (
                <Box
                  key={row.department_id}
                  sx={{
                    p: 1.6,
                    borderRadius: "18px",
                    background: "#ffffff",
                    border: "1px solid rgba(148, 163, 184, 0.22)",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
                  }}
                >
                  <Stack spacing={1.4}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1.5,
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 15, fontWeight: 950, color: "#0f172a" }}>
                          {row.department_name}
                        </Typography>

                        <Typography
                          sx={{ mt: 0.3, fontSize: 13, fontWeight: 650, color: "#64748b" }}
                        >
                          {row.department_code || "Kod kiritilmagan"}
                        </Typography>
                      </Box>

                      <StatusChip active={row.is_active} />
                    </Box>

                    <TextField
                      label="Ish haqi"
                      type="number"
                      size="small"
                      value={row.price_per_unit}
                      onChange={(event) => handlePriceChange(row.department_id, event.target.value)}
                      InputProps={{ inputProps: { min: 0, step: 100 } }}
                    />
                  </Stack>
                </Box>
              ))}
            </Box>
          ) : (
            <Alert
              severity="info"
              action={
                <Button color="info" size="small" onClick={openDepartmentModal}>
                  Bo'lim qo'shish
                </Button>
              }
            >
              Narx belgilash uchun avval ishlab chiqarish bo'limlarini yarating.
            </Alert>
          )}
        </Card>
      )}

      {canManagePrices && (
        <Card sx={{ mt: 2.5, p: { xs: 2, md: 2.5 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              flexDirection: { xs: "column", md: "row" },
              gap: 1.5,
              mb: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
                Ishlab chiqarish retsepti
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: 13.5, fontWeight: 650, color: "#64748b" }}>
                1 par mahsulot uchun ketadigan homashyolarni va yakunlovchi bo'limni belgilang.
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleSaveRecipe}
              disabled={recipeSaving}
              sx={{
                minWidth: 160,
                height: 40,
                borderRadius: "13px",
                textTransform: "none",
                fontWeight: 950,
                background: "linear-gradient(135deg, #8b0101, #b91c1c)",
                boxShadow: "0 14px 28px rgba(139, 1, 1, 0.2)",
                "&:hover": { background: "linear-gradient(135deg, #7f0101, #991b1b)" },
              }}
            >
              {recipeSaving ? "Saqlanmoqda..." : "Retseptni saqlash"}
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2, borderRadius: "14px" }}>
            Ishchi tanlangan yakunlovchi bo'limda ish topshirganda tayyor mahsulot omboriga par
            qo'shiladi va retseptdagi homashyolar avtomatik kamayadi. Boshqa bo'limlardagi ishlar
            ombor qoldig'ini o'zgartirmaydi.
          </Alert>

          <TextField
            select
            fullWidth
            label="Yakunlovchi bo'lim"
            value={completionDepartmentId}
            onChange={(event) => setCompletionDepartmentId(event.target.value)}
            helperText="Mahsulot to'liq tayyor bo'lib omborga topshiriladigan bo'lim."
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Avtomatik ombor hisobi o'chirilgan</MenuItem>
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
                    gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 1fr) 220px auto" },
                    gap: 1.2,
                    p: 1.5,
                    borderRadius: "16px",
                    border: "1px solid rgba(148, 163, 184, 0.22)",
                    background: "#fff",
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
                    inputProps={{ min: 0.001, step: 0.001 }}
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
                    O'chirish
                  </Button>
                </Box>
              );
            })}
          </Stack>

          <Button
            variant="outlined"
            onClick={addRecipeRow}
            disabled={!rawMaterials.length || recipeRows.length >= rawMaterials.length}
            sx={{ mt: 1.5, borderRadius: "12px", textTransform: "none", fontWeight: 900 }}
          >
            Homashyo qo'shish
          </Button>

          {!rawMaterials.length && (
            <Alert severity="warning" sx={{ mt: 1.5, borderRadius: "14px" }}>
              Retsept tuzish uchun avval homashyo yarating.
            </Alert>
          )}
        </Card>
      )}

      <Dialog open={departmentOpen} onClose={closeDepartmentModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>Bo'lim qo'shish</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              required
              label="Bo'lim nomi"
              value={departmentForm.name}
              onChange={handleDepartmentChange("name")}
              placeholder="Masalan: Tikuv"
            />

            <TextField
              required
              label="Bo'lim kodi"
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDepartmentModal} disabled={departmentSaving}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateDepartment}
            disabled={departmentSaving}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 900,
              background: "linear-gradient(135deg, #8b0101, #b91c1c)",
            }}
          >
            {departmentSaving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Product;
