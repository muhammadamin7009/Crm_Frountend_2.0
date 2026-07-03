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
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getProduct, saveProductDepartmentPrices } from "../../api/products";
import { useAuth } from "../../Context/AuthContext";

const MANAGER_ROLES = ["super_admin", "admin"];

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

  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
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

const normalizeDepartmentPrices = (prices = []) =>
  prices.map((item) => ({
    id: item.id,
    department_id: item.department_id,
    department_name: item.department_name || item.name || "Bo'lim",
    department_code: item.department_code || item.code || "",
    price_per_unit: item.price_per_unit ?? "",
    is_active: item.is_active ?? true,
  }));

const InfoItem = ({ label, value }) => (
  <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <Typography variant="body2" className="text-slate-500">
      {label}
    </Typography>
    <Typography className="mt-1 wrap-break-word text-slate-950" fontWeight={700}>
      {value || "-"}
    </Typography>
  </Box>
);

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUser = user || getLocalUser();
  const canManagePrices = MANAGER_ROLES.includes(currentUser?.role);

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [priceRows, setPriceRows] = useState([]);
  const [priceSaving, setPriceSaving] = useState(false);

  const images = product?.images || [];
  const primaryImage = useMemo(
    () => images.find((image) => image.is_primary) || images[0],
    [images],
  );
  const activeImage = selectedImage || primaryImage?.image_url || "";

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await getProduct(id);
      const receivedProduct = data?.product || data?.found_product || data;

      setProduct(receivedProduct);
      setPriceRows(normalizeDepartmentPrices(receivedProduct?.department_prices || []));
      setSelectedImage(
        receivedProduct?.images?.find((image) => image.is_primary)?.image_url ||
          receivedProduct?.images?.[0]?.image_url ||
          "",
      );
    } catch (error) {
      const status = error?.response?.status;

      if (status === 404) setError("Mahsulot topilmadi.");
      else if (status === 403) setError("Bu mahsulot ma'lumotlarini ko'rishga ruxsatingiz yo'q.");
      else {
        setError(
          error?.response?.data?.message || "Mahsulot ma'lumotlarini olishda xatolik yuz berdi.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

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
    } catch (error) {
      toast.error(error?.response?.data?.message || "Bo'lim narxlarini saqlashda xatolik.");
    } finally {
      setPriceSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex min-h-72 items-center justify-center">
        <CircularProgress size={34} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" className="mt-4" onClick={() => navigate("/products")}>
          Mahsulotlarga qaytish
        </Button>
      </Box>
    );
  }

  if (!product) return <Alert severity="warning">Mahsulot topilmadi.</Alert>;

  return (
    <Box className="crm-page h-full overflow-auto pr-1">
      <Box className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <Box>
          <Typography variant="h5" fontWeight={800} className="text-slate-950">
            Mahsulot ma'lumotlari
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            Katalogdagi mahsulot, narx va rasm ma'lumotlari
          </Typography>
        </Box>

        <Button variant="outlined" onClick={() => navigate("/products")} sx={{ borderRadius: 2 }}>
          Orqaga
        </Button>
      </Box>

      <Box className="grid grid-cols-1 gap-5 xl:grid-cols-[440px_1fr]">
        <Paper
          elevation={0}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4"
        >
          <Box className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {activeImage ? (
              <img
                src={getImageUrl(activeImage)}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Avatar
                variant="rounded"
                sx={{ width: 110, height: 110, fontSize: 42, bgcolor: "#7F1D1D" }}
              >
                {product.name?.[0]?.toUpperCase()}
              </Avatar>
            )}
          </Box>

          <Box className="mt-3 grid grid-cols-4 gap-2">
            {images.map((image) => (
              <Button
                key={image.id}
                variant={activeImage === image.image_url ? "contained" : "outlined"}
                className="h-20 min-w-0 overflow-hidden p-0"
                sx={{ borderRadius: 2 }}
                onClick={() => setSelectedImage(image.image_url)}
              >
                <img
                  src={getImageUrl(image.image_url)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </Button>
            ))}
          </Box>
        </Paper>

        <Paper elevation={0} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <Box className="flex flex-wrap items-start justify-between gap-4">
            <Box>
              <Typography variant="h4" fontWeight={800} className="text-slate-950">
                {product.name || "Nomsiz mahsulot"}
              </Typography>
              <Typography className="mt-1 text-slate-500">
                {product.category_name || "Kategoriyasiz"} / {product.unit || "dona"}
              </Typography>
            </Box>

            <Chip
              label={product.is_active ? "Faol" : "Nofaol"}
              color={product.is_active ? "success" : "default"}
              variant={product.is_active ? "filled" : "outlined"}
            />
          </Box>

          <Box
            className={`mt-5 mb-3 grid grid-cols-1 gap-3 ${canManagePrices ? "sm:grid-cols-2" : ""}`}
          >
            {canManagePrices && (
              <Box className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Typography variant="body2" className="text-slate-500">
                  Xarid narxi
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {formatMoney(product.purchase_price)}
                </Typography>
              </Box>
            )}
            <Box className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Typography variant="body2" className="text-slate-500">
                Sotuv narxi
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {formatMoney(product.sale_price)}
              </Typography>
            </Box>
          </Box>

          <Divider />

          <Box className="my-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="ID" value={product.id} />
            <InfoItem label="SKU" value={product.sku} />
            <InfoItem label="Model" value={product.model} />
            <InfoItem label="Rang" value={product.color} />
            <InfoItem label="Kategoriya" value={product.category_name} />
            <InfoItem label="Birlik" value={product.unit} />
            <InfoItem label="Yaratilgan vaqt" value={formatDate(product.created_at)} />
            <InfoItem label="Yangilangan vaqt" value={formatDate(product.updated_at)} />
          </Box>

          {canManagePrices && (
            <>
              <Divider />

              <Box className="my-4">
                <Box className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Box>
                    <Typography fontWeight={800} className="text-slate-950">
                      Bo'lim narxlari
                    </Typography>
                    <Typography variant="body2" className="text-slate-500">
                      Har bir bo'lim uchun bitta mahsulotga to'lanadigan ish haqi
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    onClick={handleSavePrices}
                    disabled={priceSaving || !priceRows.length}
                    sx={{ borderRadius: 2 }}
                  >
                    {priceSaving ? "Saqlanmoqda..." : "Narxlarni saqlash"}
                  </Button>
                </Box>

                {priceRows.length ? (
                  <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {priceRows.map((row) => (
                      <Box
                        key={row.department_id}
                        className="auth-info-card rounded-2xl border p-4"
                      >
                        <Stack spacing={1.5}>
                          <Box className="flex items-center justify-between gap-3">
                            <Box>
                              <Typography fontWeight={800} className="text-slate-950">
                                {row.department_name}
                              </Typography>
                              <Typography variant="body2" className="text-slate-500">
                                {row.department_code || "Kod kiritilmagan"}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label={row.is_active ? "Faol" : "Nofaol"}
                              color={row.is_active ? "success" : "default"}
                              variant="outlined"
                            />
                          </Box>

                          <TextField
                            label="Ish haqi"
                            type="number"
                            size="small"
                            value={row.price_per_unit}
                            onChange={(event) =>
                              handlePriceChange(row.department_id, event.target.value)
                            }
                            InputProps={{ inputProps: { min: 0, step: 100 } }}
                          />
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">Bu mahsulot uchun bo'lim narxlari hali topilmadi.</Alert>
                )}
              </Box>

              <Divider />
            </>
          )}

          <Box className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <Typography variant="body2" className="text-slate-500">
              Tavsif
            </Typography>
            <Typography className="mt-2 wrap-break-word text-slate-950" fontWeight={600}>
              {product.description || "Tavsif kiritilmagan."}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Product;
