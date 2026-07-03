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

const normalizeDepartmentPrices = (prices = []) =>
  prices.map((item) => ({
    id: item.id,
    department_id: item.department_id,
    department_name: item.department_name || item.name || "Bo'lim",
    department_code: item.department_code || item.code || "",
    price_per_unit: item.price_per_unit ?? "",
    is_active: item.is_active ?? true,
  }));

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
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Bo'lim narxlarini saqlashda xatolik.");
    } finally {
      setPriceSaving(false);
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
              label="ZERR CRM • mahsulot profili"
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
              {product.category_name || "Kategoriyasiz"} / {product.unit || "dona"}
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
            <Alert severity="info">Bu mahsulot uchun bo'lim narxlari hali topilmadi.</Alert>
          )}
        </Card>
      )}
    </Box>
  );
};

export default Product;
