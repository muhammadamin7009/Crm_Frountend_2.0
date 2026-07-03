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

  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "-";

  return `${new Intl.NumberFormat("uz-UZ").format(Number(value))} so'm`;
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("uz-UZ");
};

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
  }, [filters, pageInfo.limit]);

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
    setProductImageFile(null);
    setProductImagePreview("");
  };

  const handleProductImageChange = (event) => {
    const file = event.target.files?.[0] || null;
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

  const renderImageUpload = () => (
    <Box className="rounded border border-slate-200 p-3">
      <Typography fontWeight={700} className="mb-2">
        Mahsulot rasmi
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button variant="outlined" component="label">
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
          >
            {imageSaving ? "Yuklanmoqda..." : "Yuklash"}
          </Button>
        )}
      </Stack>

      {productImageFile && (
        <Box className="mt-3 flex items-center gap-3">
          <Avatar variant="rounded" src={productImagePreview} sx={{ width: 72, height: 72 }} />
          <Box>
            <Typography fontWeight={600}>Yangi rasm tanlandi</Typography>
            <Typography variant="body2" color="text.secondary">
              {productImageFile.name}
            </Typography>
          </Box>
        </Box>
      )}

      {createOpen && (
        <Typography variant="body2" color="text.secondary" className="mt-2">
          Rasm mahsulot saqlangandan keyin avtomatik yuklanadi.
        </Typography>
      )}

      {editOpen && (
        <Box className="mt-4">
          {imageLoading ? (
            <CircularProgress size={24} />
          ) : productImages.length ? (
            <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {productImages.map((image) => (
                <Box
                  key={image.id}
                  className="flex items-center gap-3 rounded border border-slate-200 p-2"
                >
                  <Avatar
                    variant="rounded"
                    src={getImageUrl(image.image_url)}
                    sx={{ width: 64, height: 64 }}
                  />
                  <Box className="min-w-0 flex-1">
                    <Typography fontWeight={600}>
                      {image.is_primary ? "Asosiy rasm" : "Qo'shimcha rasm"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {image.id}
                    </Typography>
                    <Stack direction="row" spacing={1} className="mt-1">
                      {!image.is_primary && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={imageSaving}
                          onClick={() => handleSetPrimaryImage(image.id)}
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
                      >
                        O'chirish
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Hozircha rasm yuklanmagan.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );

  const renderProductFields = () => (
    <Stack spacing={2} className="pt-2">
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

      <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      {renderImageUpload()}
    </Stack>
  );

  return (
    <Box className="crm-page flex h-full min-h-0 flex-col">
      <Box className="mb-5 flex shrink-0 items-center justify-between">
        <Box>
          <Typography variant="h5" fontWeight={800} className="text-slate-950">
            Mahsulotlar
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            Korxona mahsulotlari katalogi, narxlari va kategoriyalari
          </Typography>
        </Box>

        <Box className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Typography variant="body2" className="text-slate-500">
              Jami
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {pageInfo.total}
            </Typography>
          </Box>
          <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Typography variant="body2" className="text-slate-500">
              Sahifada
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {products.length}
            </Typography>
          </Box>
          <Box className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:block">
            <Typography variant="body2" className="text-slate-500">
              Kategoriya
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {categories.length}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Paper elevation={0} className="mb-4 shrink-0 rounded-2xl border border-slate-200 p-4">
        <Box className="flex flex-col gap-3">
          <Box className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Box className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
              <Button variant="text" onClick={() => setFiltersOpen((open) => !open)}>
                {filtersOpen ? "Filtrlarni yopish" : "Batafsil filtrlar"}
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => {
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
                }}
              >
                Tozalash
              </Button>
            </Box>

            {canManage && (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => setCategoryOpen(true)}>
                  Kategoriyalar
                </Button>
                <Button variant="contained" onClick={openCreateModal}>
                  Mahsulot qo'shish
                </Button>
              </Stack>
            )}
          </Box>

          {filtersOpen && (
            <Box className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:grid-cols-5">
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
      </Paper>

      <Paper
        elevation={0}
        className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white"
      >
        <Box className="min-h-0 flex-1 overflow-auto">
          <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell width="30%" sx={{ fontWeight: 700 }}>
                  Mahsulot
                </TableCell>
                <TableCell width="20%" sx={{ fontWeight: 700 }}>
                  Kod va model
                </TableCell>
                <TableCell width="20%" sx={{ fontWeight: 700 }}>
                  Narxlar
                </TableCell>
                <TableCell width="14%" sx={{ fontWeight: 700 }}>
                  Holati
                </TableCell>
                {canManage && (
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Amallar
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} align="center">
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : products.length ? (
                products.map((product) => (
                  <TableRow
                    key={product.id}
                    hover
                    onClick={() => navigate(`/products/${product.id}`)}
                    sx={{
                      cursor: "pointer",
                      "&:last-child td": { borderBottom: 0 },
                      "&:hover": { backgroundColor: "#FFF7ED" },
                    }}
                  >
                    <TableCell>
                      <Box className="flex items-center gap-3">
                        <Avatar
                          variant="rounded"
                          src={getImageUrl(product.product_image)}
                          sx={{ width: 44, height: 44 }}
                        >
                          {product.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600}>{product.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {product.color || "Rang ko'rsatilmagan"} · {product.unit}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {product.sku}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.model || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>
                        Sotuv: {formatMoney(product.sale_price)}
                      </Typography>
                      {canManage && (
                        <Typography variant="body2" color="text.secondary">
                          Xarid: {formatMoney(product.purchase_price)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box className="flex flex-col items-start gap-1">
                        <Chip
                          size="small"
                          label={product.is_active ? "Faol" : "Nofaol"}
                          color={product.is_active ? "success" : "default"}
                          variant={product.is_active ? "filled" : "outlined"}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(product.updated_at)}
                        </Typography>
                      </Box>
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Stack direction="column" spacing={0.5} sx={{ alignItems: "stretch" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(product);
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
                  <TableCell colSpan={canManage ? 5 : 4} align="center">
                    Mahsulotlar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <CrmPagination total={pageInfo.total} page={page} limit={pageInfo.limit} onPageChange={(nextPage) => fetchProducts(nextPage * pageInfo.limit, pageInfo.limit)} onLimitChange={(limit) => fetchProducts(0, limit)} />
      </Paper>

      <Dialog open={createOpen} onClose={closeProductModals} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>Mahsulot qo'shish</DialogTitle>
        <DialogContent>{renderProductFields()}</DialogContent>
        <DialogActions>
          <Button onClick={closeProductModals}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleCreateProduct} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Qo'shish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={closeProductModals} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>Mahsulotni tahrirlash</DialogTitle>
        <DialogContent>{renderProductFields()}</DialogContent>
        <DialogActions>
          <Button onClick={closeProductModals}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleUpdateProduct} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={closeProductModals} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Mahsulotni o'chirish</DialogTitle>
        <DialogContent>
          <Typography>{selectedProduct?.name} mahsulotini o'chirmoqchimisiz?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeProductModals}>Bekor qilish</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteProduct}
            disabled={deleting}
          >
            {deleting ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={categoryOpen}
        onClose={() => {
          setCategoryOpen(false);
          resetCategoryForm();
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Kategoriyalar</DialogTitle>
        <DialogContent dividers>
          <Box className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
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
            <Button variant="contained" onClick={handleSaveCategory} disabled={categorySaving}>
              {selectedCategory ? "Saqlash" : "Qo'shish"}
            </Button>
          </Box>

          <FormControlLabel
            className="mb-3"
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

          <Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nomi</TableCell>
                  <TableCell>Tavsif</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Holati</TableCell>
                  <TableCell align="right">Amallar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length ? (
                  categories.map((category) => (
                    <TableRow key={category.id} hover>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description || "-"}</TableCell>
                      <TableCell>{category.is_active ? "Faol" : "Nofaol"}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => startCategoryEdit(category)}
                          >
                            O'zgartirish
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            O'chirish
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Kategoriyalar topilmadi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
        <DialogActions>
          {selectedCategory && <Button onClick={resetCategoryForm}>Tozalash</Button>}
          <Button
            onClick={() => {
              setCategoryOpen(false);
              resetCategoryForm();
            }}
          >
            Yopish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
