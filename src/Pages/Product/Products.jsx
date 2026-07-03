import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { useAuth } from "../../Context/AuthContext";
import CrmPagination from "../../Components/Common/CrmPagination";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  deleteProductImage,
  getCategories,
  getProduct,
  getProducts,
  setPrimaryProductImage,
  updateCategory,
  updateProduct,
  uploadProductImage,
} from "../../api/products";

const emptyProductForm = {
  category_id: "",
  name: "",
  model: "",
  sku: "",
  color: "",
  unit: "dona",
  description: "",
  purchase_price: "",
  sale_price: "",
  is_active: true,
};

const emptyCategoryForm = {
  name: "",
  description: "",
  is_active: true,
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getImageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;

  const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "-";

  return `${new Intl.NumberFormat("uz-UZ").format(Number(value))} so'm`;
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const getInitial = (value) => {
  return String(value || "Z")
    .trim()
    .slice(0, 1)
    .toUpperCase();
};

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

const MiniStat = ({ label, value }) => (
  <Box
    sx={{
      minWidth: 105,
      px: 2,
      py: 1.4,
      borderRadius: "16px",
      background: "#ffffff",
      border: "1px solid rgba(148, 163, 184, 0.24)",
      boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
    }}
  >
    <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{label}</Typography>

    <Typography
      sx={{
        mt: 0.3,
        fontSize: 20,
        fontWeight: 900,
        color: "#0f172a",
        letterSpacing: "-0.04em",
      }}
    >
      {value}
    </Typography>
  </Box>
);

const StatusChip = ({ active }) => (
  <Chip
    size="small"
    label={active ? "Faol" : "Nofaol"}
    sx={{
      height: 26,
      px: 0.35,
      fontSize: 12,
      fontWeight: 900,
      color: active ? "#15803d" : "#64748b",
      background: active ? "rgba(34, 197, 94, 0.12)" : "#f1f5f9",
      border: active ? "1px solid rgba(34, 197, 94, 0.24)" : "1px solid rgba(148, 163, 184, 0.24)",
    }}
  />
);

const PremiumDialog = ({ open, onClose, title, children, actions, maxWidth = "md" }) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth={maxWidth}
    PaperProps={{
      sx: {
        borderRadius: "22px",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        boxShadow: "0 30px 80px rgba(15, 23, 42, 0.22)",
        overflow: "hidden",
      },
    }}
  >
    <DialogTitle
      sx={{
        px: 3,
        py: 2.2,
        fontSize: 22,
        fontWeight: 950,
        color: "#0f172a",
        borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
        background: "linear-gradient(135deg, #ffffff, #f8fafc)",
      }}
    >
      {title}
    </DialogTitle>

    <DialogContent sx={{ px: 3, py: 2.5 }}>{children}</DialogContent>

    {actions && (
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: "1px solid rgba(148, 163, 184, 0.18)",
          background: "rgba(248, 250, 252, 0.72)",
        }}
      >
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

const Products = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const canManage = ["super_admin", "admin"].includes(currentUser?.role);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pageInfo, setPageInfo] = useState({ total: 0, offset: 0, limit: 10 });
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    q: "",
    category_id: "",
    is_active: "",
    min_price: "",
    max_price: "",
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState("");
  const [imageSaving, setImageSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySaving, setCategorySaving] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.is_active),
    [categories],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await getCategories({
        offset: 0,
        limit: 100,
        sort_by: "name",
        sort_order: "asc",
      });

      setCategories(data.categories || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Kategoriyalarni olishda xato.");
    }
  }, []);

  const fetchProducts = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        const params = {
          q: filters.q,
          offset,
          limit,
          sort_by: filters.sort_by,
          sort_order: filters.sort_order,
        };

        for (const key of ["category_id", "is_active", "min_price", "max_price"]) {
          if (filters[key] !== "") params[key] = filters[key];
        }

        const { data } = await getProducts(params);

        setProducts(data.products || []);
        setPageInfo(data.pageInfo || { total: 0, offset, limit });
      } catch (error) {
        toast.error(error?.response?.data?.message || "Mahsulotlarni olishda xato.");
      } finally {
        setLoading(false);
      }
    },
    [filters, pageInfo.limit],
  );

  const fetchProductImages = useCallback(async (productId) => {
    if (!productId) return;

    setImageLoading(true);

    try {
      const { data } = await getProduct(productId);
      setProductImages(data.product?.images || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Rasmlarni olishda xato.");
    } finally {
      setImageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(0, pageInfo.limit), 250);

    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit, fetchProducts]);

  useEffect(() => {
    return () => {
      if (productImagePreview) URL.revokeObjectURL(productImagePreview);
    };
  }, [productImagePreview]);

  const handleFilterChange = (field) => (event) => {
    setFilters((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleProductChange = (field) => (event) => {
    setProductForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const resetSelectedImage = () => {
    if (productImagePreview) URL.revokeObjectURL(productImagePreview);

    setProductImageFile(null);
    setProductImagePreview("");
  };

  const handleProductImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (productImagePreview) URL.revokeObjectURL(productImagePreview);

    setProductImageFile(file);
    setProductImagePreview(file ? URL.createObjectURL(file) : "");
    event.target.value = "";
  };

  const buildProductPayload = () => ({
    category_id: productForm.category_id ? Number(productForm.category_id) : null,
    name: productForm.name.trim(),
    model: productForm.model.trim() || null,
    sku: productForm.sku.trim(),
    color: productForm.color.trim() || null,
    unit: productForm.unit.trim() || "dona",
    description: productForm.description.trim() || null,
    purchase_price: Number(productForm.purchase_price || 0),
    sale_price: Number(productForm.sale_price),
    is_active: productForm.is_active,
  });

  const validateProduct = () => {
    if (!productForm.name.trim()) {
      toast.error("Mahsulot nomini kiriting.");
      return false;
    }

    if (!productForm.sku.trim()) {
      toast.error("SKU kiriting.");
      return false;
    }

    if (productForm.sale_price === "" || Number(productForm.sale_price) < 0) {
      toast.error("Sotuv narxini to'g'ri kiriting.");
      return false;
    }

    return true;
  };

  const openCreateModal = () => {
    setProductForm(emptyProductForm);
    resetSelectedImage();
    setProductImages([]);
    setCreateOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      category_id: product.category_id || "",
      name: product.name || "",
      model: product.model || "",
      sku: product.sku || "",
      color: product.color || "",
      unit: product.unit || "dona",
      description: product.description || "",
      purchase_price: product.purchase_price ?? "",
      sale_price: product.sale_price ?? "",
      is_active: product.is_active ?? true,
    });
    resetSelectedImage();
    setProductImages([]);
    setEditOpen(true);
    fetchProductImages(product.id);
  };

  const closeProductModals = () => {
    setCreateOpen(false);
    setEditOpen(false);
    setDeleteOpen(false);
    setSelectedProduct(null);
    setProductForm(emptyProductForm);
    resetSelectedImage();
    setProductImages([]);
  };

  const handleCreateProduct = async () => {
    if (!validateProduct()) return;

    setSaving(true);

    try {
      const { data } = await createProduct(buildProductPayload());
      const newProductId = data.new_product?.id;

      if (productImageFile && newProductId) {
        await uploadProductImage(newProductId, productImageFile);
      }

      toast.success("Mahsulot qo'shildi.");
      closeProductModals();
      fetchProducts(0, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Mahsulot qo'shishda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct || !validateProduct()) return;

    setSaving(true);

    try {
      await updateProduct(selectedProduct.id, buildProductPayload());

      toast.success("Mahsulot yangilandi.");
      closeProductModals();
      fetchProducts(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Mahsulotni yangilashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadSelectedImage = async () => {
    if (!selectedProduct || !productImageFile) return;

    setImageSaving(true);

    try {
      await uploadProductImage(selectedProduct.id, productImageFile);

      toast.success("Rasm yuklandi.");
      resetSelectedImage();
      fetchProductImages(selectedProduct.id);
      fetchProducts(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Rasm yuklashda xato.");
    } finally {
      setImageSaving(false);
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    if (!selectedProduct) return;

    setImageSaving(true);

    try {
      await setPrimaryProductImage(selectedProduct.id, imageId);

      toast.success("Asosiy rasm yangilandi.");
      fetchProductImages(selectedProduct.id);
      fetchProducts(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Rasmni yangilashda xato.");
    } finally {
      setImageSaving(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!selectedProduct) return;

    setImageSaving(true);

    try {
      await deleteProductImage(selectedProduct.id, imageId);

      toast.success("Rasm o'chirildi.");
      fetchProductImages(selectedProduct.id);
      fetchProducts(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Rasmni o'chirishda xato.");
    } finally {
      setImageSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setDeleting(true);

    try {
      await deleteProduct(selectedProduct.id);

      toast.success("Mahsulot o'chirildi.");
      closeProductModals();
      fetchProducts(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Mahsulotni o'chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const startCategoryEdit = (category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name || "",
      description: category.description || "",
      is_active: category.is_active ?? true,
    });
  };

  const resetCategoryForm = () => {
    setSelectedCategory(null);
    setCategoryForm(emptyCategoryForm);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Kategoriya nomini kiriting.");
      return;
    }

    setCategorySaving(true);

    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || null,
        is_active: categoryForm.is_active,
      };

      if (selectedCategory) {
        await updateCategory(selectedCategory.id, payload);
        toast.success("Kategoriya yangilandi.");
      } else {
        await createCategory(payload);
        toast.success("Kategoriya qo'shildi.");
      }

      resetCategoryForm();
      fetchCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Kategoriyani saqlashda xato.");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      await deleteCategory(category.id);

      toast.success("Kategoriya o'chirildi.");
      if (selectedCategory?.id === category.id) resetCategoryForm();
      fetchCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Kategoriyani o'chirishda xato.");
    }
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      category_id: "",
      is_active: "",
      min_price: "",
      max_price: "",
      sort_by: "created_at",
      sort_order: "desc",
    });
    setFiltersOpen(false);
  };

  const renderImageUpload = () => (
    <Box
      sx={{
        p: 2,
        borderRadius: "18px",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        background: "linear-gradient(135deg, #ffffff, #f8fafc)",
      }}
    >
      <Typography sx={{ mb: 1.5, fontSize: 15, fontWeight: 950, color: "#0f172a" }}>
        Mahsulot rasmi
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
        <Button
          variant="outlined"
          component="label"
          sx={{
            height: 40,
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 900,
            color: "#0f172a",
            borderColor: "rgba(37, 99, 235, 0.24)",
          }}
        >
          Rasm tanlash
          <input
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleProductImageChange}
          />
        </Button>

        {editOpen && (
          <Button
            variant="contained"
            disabled={!productImageFile || imageSaving}
            onClick={handleUploadSelectedImage}
            sx={{
              height: 40,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 900,
              background: "linear-gradient(135deg, #2563eb, #4f7df3)",
              boxShadow: "0 12px 25px rgba(37, 99, 235, 0.18)",
            }}
          >
            {imageSaving ? "Yuklanmoqda..." : "Yuklash"}
          </Button>
        )}
      </Stack>

      {productImageFile && (
        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.4,
            borderRadius: "16px",
            background: "#f8fafc",
            border: "1px solid rgba(148, 163, 184, 0.18)",
          }}
        >
          <Avatar
            variant="rounded"
            src={productImagePreview}
            sx={{ width: 74, height: 74, borderRadius: "14px" }}
          />

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Yangi rasm tanlandi</Typography>
            <Typography sx={{ mt: 0.3, fontSize: 13, fontWeight: 650, color: "#64748b" }}>
              {productImageFile.name}
            </Typography>
          </Box>
        </Box>
      )}

      {createOpen && (
        <Typography sx={{ mt: 1.4, fontSize: 13, fontWeight: 650, color: "#64748b" }}>
          Rasm mahsulot saqlangandan keyin avtomatik yuklanadi.
        </Typography>
      )}

      {editOpen && (
        <Box sx={{ mt: 2 }}>
          {imageLoading ? (
            <CircularProgress size={24} />
          ) : productImages.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.4,
              }}
            >
              {productImages.map((image) => (
                <Box
                  key={image.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.4,
                    p: 1.3,
                    borderRadius: "16px",
                    border: "1px solid rgba(148, 163, 184, 0.22)",
                    background: "#fff",
                  }}
                >
                  <Avatar
                    variant="rounded"
                    src={getImageUrl(image.image_url)}
                    sx={{ width: 66, height: 66, borderRadius: "14px" }}
                  />

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                      {image.is_primary ? "Asosiy rasm" : "Qo'shimcha rasm"}
                    </Typography>

                    <Typography sx={{ mt: 0.2, fontSize: 12, fontWeight: 650, color: "#64748b" }}>
                      ID: {image.id}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                      {!image.is_primary && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={imageSaving}
                          onClick={() => handleSetPrimaryImage(image.id)}
                          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 850 }}
                        >
                          Asosiy qilish
                        </Button>
                      )}

                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={imageSaving}
                        onClick={() => handleDeleteImage(image.id)}
                        sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 850 }}
                      >
                        O'chirish
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: "16px",
                border: "1px dashed rgba(148, 163, 184, 0.42)",
                background: "#f8fafc",
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 750, color: "#64748b" }}>
                Hozircha rasm yuklanmagan.
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  const renderProductFields = () => (
    <Stack spacing={2.1} sx={{ pt: 0.5 }}>
      <TextField
        select
        fullWidth
        label="Kategoriya"
        value={productForm.category_id}
        onChange={handleProductChange("category_id")}
      >
        <MenuItem value="">Kategoriyasiz</MenuItem>
        {activeCategories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
      </TextField>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        <TextField
          required
          label="Mahsulot nomi"
          value={productForm.name}
          onChange={handleProductChange("name")}
        />

        <TextField
          required
          label="SKU"
          value={productForm.sku}
          onChange={handleProductChange("sku")}
        />

        <TextField
          label="Model"
          value={productForm.model}
          onChange={handleProductChange("model")}
        />

        <TextField label="Rang" value={productForm.color} onChange={handleProductChange("color")} />

        <TextField label="Birlik" value={productForm.unit} onChange={handleProductChange("unit")} />

        <TextField
          type="number"
          label="Xarid narxi"
          value={productForm.purchase_price}
          onChange={handleProductChange("purchase_price")}
          slotProps={{ htmlInput: { min: 0 } }}
        />

        <TextField
          required
          type="number"
          label="Sotuv narxi"
          value={productForm.sale_price}
          onChange={handleProductChange("sale_price")}
          slotProps={{ htmlInput: { min: 0 } }}
        />
      </Box>

      <TextField
        fullWidth
        multiline
        minRows={3}
        label="Tavsif"
        value={productForm.description}
        onChange={handleProductChange("description")}
      />

      <Box
        sx={{
          px: 1.2,
          py: 0.7,
          borderRadius: "14px",
          background: "#f8fafc",
          border: "1px solid rgba(148, 163, 184, 0.18)",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={productForm.is_active}
              onChange={(event) =>
                setProductForm((previous) => ({
                  ...previous,
                  is_active: event.target.checked,
                }))
              }
            />
          }
          label="Faol mahsulot"
        />
      </Box>

      {renderImageUpload()}
    </Stack>
  );

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2,
      }}
    >
      <Card sx={{ mb: 2.5, px: { xs: 2, md: 2.5 }, py: 2.2, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Chip
              label="ZERR CRM • mahsulotlar"
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
                fontSize: { xs: 27, md: 33 },
                fontWeight: 950,
                color: "#0f172a",
                letterSpacing: "-0.055em",
                lineHeight: 1.05,
              }}
            >
              Mahsulotlar
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 14,
                fontWeight: 650,
                color: "#64748b",
              }}
            >
              Korxona mahsulotlari katalogi, narxlari va kategoriyalari.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, auto)" },
              gap: 1.4,
              width: { xs: "100%", md: "auto" },
            }}
          >
            <MiniStat label="Jami" value={pageInfo.total} />
            <MiniStat label="Sahifada" value={products.length} />
            <MiniStat label="Kategoriya" value={categories.length} />
          </Box>
        </Box>
      </Card>

      <Card sx={{ mb: 2.5, p: 2, flexShrink: 0 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.6 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "stretch", xl: "center" },
              justifyContent: "space-between",
              flexDirection: { xs: "column", xl: "row" },
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                gap: 1.4,
                flex: 1,
              }}
            >
              <TextField
                size="small"
                label="Qidirish"
                value={filters.q}
                onChange={handleFilterChange("q")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") fetchProducts(0, pageInfo.limit);
                }}
              />

              <TextField
                select
                size="small"
                label="Kategoriya"
                value={filters.category_id}
                onChange={handleFilterChange("category_id")}
              >
                <MenuItem value="">Barchasi</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="outlined"
                onClick={() => setFiltersOpen((open) => !open)}
                sx={{
                  height: 42,
                  borderRadius: "13px",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "#0f172a",
                  borderColor: "rgba(37, 99, 235, 0.22)",
                  background: "#fff",
                }}
              >
                {filtersOpen ? "Filtrlarni yopish" : "Batafsil filtrlar"}
              </Button>

              <Button
                variant="outlined"
                onClick={resetFilters}
                sx={{
                  height: 42,
                  borderRadius: "13px",
                  textTransform: "none",
                  fontWeight: 900,
                  color: "#0f172a",
                  borderColor: "rgba(37, 99, 235, 0.22)",
                  background: "#fff",
                }}
              >
                Tozalash
              </Button>
            </Box>

            {canManage && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4}>
                <Button
                  variant="outlined"
                  onClick={() => setCategoryOpen(true)}
                  sx={{
                    minWidth: 150,
                    height: 42,
                    borderRadius: "13px",
                    textTransform: "none",
                    fontWeight: 900,
                    color: "#0f172a",
                    borderColor: "rgba(37, 99, 235, 0.22)",
                    background: "#fff",
                  }}
                >
                  Kategoriyalar
                </Button>

                <Button
                  variant="contained"
                  onClick={openCreateModal}
                  sx={{
                    minWidth: 190,
                    height: 42,
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
                  Mahsulot qo'shish
                </Button>
              </Stack>
            )}
          </Box>

          {filtersOpen && (
            <Box
              sx={{
                pt: 1.6,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" },
                gap: 1.4,
                borderTop: "1px solid rgba(148, 163, 184, 0.18)",
              }}
            >
              <TextField
                select
                size="small"
                label="Holati"
                value={filters.is_active}
                onChange={handleFilterChange("is_active")}
              >
                <MenuItem value="">Barchasi</MenuItem>
                <MenuItem value="true">Faol</MenuItem>
                <MenuItem value="false">Nofaol</MenuItem>
              </TextField>

              <TextField
                size="small"
                type="number"
                label="Min narx"
                value={filters.min_price}
                onChange={handleFilterChange("min_price")}
              />

              <TextField
                size="small"
                type="number"
                label="Max narx"
                value={filters.max_price}
                onChange={handleFilterChange("max_price")}
              />

              <TextField
                select
                size="small"
                label="Saralash"
                value={filters.sort_by}
                onChange={handleFilterChange("sort_by")}
              >
                <MenuItem value="created_at">Yaratilgan</MenuItem>
                <MenuItem value="updated_at">Yangilangan</MenuItem>
                <MenuItem value="name">Nomi</MenuItem>
                <MenuItem value="sale_price">Sotuv narxi</MenuItem>
                {canManage && <MenuItem value="purchase_price">Xarid narxi</MenuItem>}
              </TextField>

              <TextField
                select
                size="small"
                label="Tartib"
                value={filters.sort_order}
                onChange={handleFilterChange("sort_order")}
              >
                <MenuItem value="desc">Yangidan eskiga</MenuItem>
                <MenuItem value="asc">Eskidan yangiga</MenuItem>
              </TextField>
            </Box>
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
        <Box sx={{ minHeight: 0, flex: 1, overflow: "auto" }}>
          <Table
            sx={{
              minWidth: canManage ? 980 : 820,
              "& th": {
                py: 1.7,
                fontSize: 12,
                fontWeight: 950,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                background: "rgba(248, 250, 252, 0.95)",
                borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
              },
              "& td": {
                py: 1.55,
                borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
              },
              "& tbody tr:hover": {
                background: "rgba(37, 99, 235, 0.035)",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Mahsulot</TableCell>
                <TableCell>Kod va model</TableCell>
                <TableCell>Narxlar</TableCell>
                <TableCell>Holati</TableCell>
                {canManage && <TableCell align="right">Amallar</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : products.length ? (
                products.map((product) => (
                  <TableRow
                    key={product.id}
                    hover
                    onClick={() => navigate(`/products/${product.id}`)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.6 }}>
                        <Avatar
                          variant="rounded"
                          src={getImageUrl(product.product_image)}
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: "15px",
                            bgcolor: "#8b0101",
                            color: "#fff",
                            fontWeight: 950,
                            border: "3px solid #fff",
                            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
                          }}
                        >
                          {getInitial(product.name)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 14.5,
                              fontWeight: 900,
                              color: "#0f172a",
                              lineHeight: 1.15,
                            }}
                          >
                            {product.name || "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: "#64748b",
                            }}
                          >
                            {product.color || "Rang ko'rsatilmagan"} · {product.unit || "dona"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 900, color: "#334155" }}>
                        {product.sku || "-"}
                      </Typography>

                      <Typography
                        sx={{ mt: 0.35, fontSize: 12.5, fontWeight: 700, color: "#64748b" }}
                      >
                        {product.model || "Model yo'q"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>
                        Sotuv: {formatMoney(product.sale_price)}
                      </Typography>

                      {canManage && (
                        <Typography
                          sx={{
                            mt: 0.35,
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "#64748b",
                          }}
                        >
                          Xarid: {formatMoney(product.purchase_price)}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.7} alignItems="flex-start">
                        <StatusChip active={product.is_active} />

                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#64748b" }}>
                          {formatDate(product.updated_at)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(product);
                            }}
                            sx={{
                              borderRadius: "10px",
                              textTransform: "none",
                              fontWeight: 900,
                            }}
                          >
                            O'zgartirish
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedProduct(product);
                              setDeleteOpen(true);
                            }}
                            sx={{
                              borderRadius: "10px",
                              textTransform: "none",
                              fontWeight: 900,
                            }}
                          >
                            O'chirish
                          </Button>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    align="center"
                    sx={{ py: 7, color: "#64748b", fontWeight: 850 }}
                  >
                    Mahsulotlar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid rgba(148, 163, 184, 0.18)",
            background: "rgba(248, 250, 252, 0.65)",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) => fetchProducts(nextPage * pageInfo.limit, pageInfo.limit)}
            onLimitChange={(limit) => fetchProducts(0, limit)}
          />
        </Box>
      </Card>

      <PremiumDialog
        open={createOpen}
        onClose={closeProductModals}
        title="Mahsulot qo'shish"
        actions={
          <>
            <Button
              onClick={closeProductModals}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 850 }}
            >
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              onClick={handleCreateProduct}
              disabled={saving}
              sx={{
                minWidth: 120,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                background: "linear-gradient(135deg, #8b0101, #b91c1c)",
                boxShadow: "0 12px 25px rgba(139, 1, 1, 0.2)",
              }}
            >
              {saving ? "Saqlanmoqda..." : "Qo'shish"}
            </Button>
          </>
        }
      >
        {renderProductFields()}
      </PremiumDialog>

      <PremiumDialog
        open={editOpen}
        onClose={closeProductModals}
        title="Mahsulotni tahrirlash"
        actions={
          <>
            <Button
              onClick={closeProductModals}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 850 }}
            >
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              onClick={handleUpdateProduct}
              disabled={saving}
              sx={{
                minWidth: 120,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 900,
                background: "linear-gradient(135deg, #8b0101, #b91c1c)",
                boxShadow: "0 12px 25px rgba(139, 1, 1, 0.2)",
              }}
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </>
        }
      >
        {renderProductFields()}
      </PremiumDialog>

      <PremiumDialog
        open={deleteOpen}
        onClose={closeProductModals}
        title="Mahsulotni o'chirish"
        maxWidth="xs"
        actions={
          <>
            <Button
              onClick={closeProductModals}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 850 }}
            >
              Bekor qilish
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={handleDeleteProduct}
              disabled={deleting}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 900 }}
            >
              {deleting ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </>
        }
      >
        <Typography sx={{ color: "#334155", fontWeight: 700 }}>
          {selectedProduct?.name} mahsulotini o'chirmoqchimisiz?
        </Typography>
      </PremiumDialog>

      <PremiumDialog
        open={categoryOpen}
        onClose={() => {
          setCategoryOpen(false);
          resetCategoryForm();
        }}
        title="Kategoriyalar"
        actions={
          <>
            {selectedCategory && (
              <Button
                onClick={resetCategoryForm}
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 850 }}
              >
                Tozalash
              </Button>
            )}

            <Button
              onClick={() => {
                setCategoryOpen(false);
                resetCategoryForm();
              }}
              sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 850 }}
            >
              Yopish
            </Button>
          </>
        }
      >
        <Box
          sx={{
            mb: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1.5fr auto" },
            gap: 1.4,
          }}
        >
          <TextField
            size="small"
            label="Kategoriya nomi"
            value={categoryForm.name}
            onChange={(event) =>
              setCategoryForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
          />

          <TextField
            size="small"
            label="Tavsif"
            value={categoryForm.description}
            onChange={(event) =>
              setCategoryForm((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
          />

          <Button
            variant="contained"
            onClick={handleSaveCategory}
            disabled={categorySaving}
            sx={{
              height: 40,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 900,
              background: "linear-gradient(135deg, #8b0101, #b91c1c)",
            }}
          >
            {selectedCategory ? "Saqlash" : "Qo'shish"}
          </Button>
        </Box>

        <Box
          sx={{
            mb: 2,
            px: 1.2,
            py: 0.7,
            borderRadius: "14px",
            background: "#f8fafc",
            border: "1px solid rgba(148, 163, 184, 0.18)",
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={categoryForm.is_active}
                onChange={(event) =>
                  setCategoryForm((previous) => ({
                    ...previous,
                    is_active: event.target.checked,
                  }))
                }
              />
            }
            label="Faol kategoriya"
          />
        </Box>

        <Card sx={{ boxShadow: "none" }}>
          <Box sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{
                minWidth: 680,
                "& th": {
                  py: 1.5,
                  fontSize: 12,
                  fontWeight: 950,
                  color: "#64748b",
                  textTransform: "uppercase",
                  background: "#f8fafc",
                },
                "& td": {
                  py: 1.4,
                  borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Nomi</TableCell>
                  <TableCell>Tavsif</TableCell>
                  <TableCell>Holati</TableCell>
                  <TableCell align="right">Amallar</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {categories.length ? (
                  categories.map((category) => (
                    <TableRow key={category.id} hover>
                      <TableCell sx={{ fontWeight: 900, color: "#0f172a" }}>
                        {category.name}
                      </TableCell>

                      <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>
                        {category.description || "-"}
                      </TableCell>

                      <TableCell>
                        <StatusChip active={category.is_active} />
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => startCategoryEdit(category)}
                            sx={{
                              borderRadius: "10px",
                              textTransform: "none",
                              fontWeight: 900,
                            }}
                          >
                            O'zgartirish
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleDeleteCategory(category)}
                            sx={{
                              borderRadius: "10px",
                              textTransform: "none",
                              fontWeight: 900,
                            }}
                          >
                            O'chirish
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 6, color: "#64748b", fontWeight: 850 }}
                    >
                      Kategoriyalar topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </PremiumDialog>
    </Box>
  );
};

export default Products;
