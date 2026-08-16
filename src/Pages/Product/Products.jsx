import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";

import SharedHeroMetric from "../../Components/UI/HeroMetric";
import ActiveStatusChip from "../../Components/UI/ActiveStatusChip";
import SharedPremiumDialog from "../../Components/UI/PremiumDialog";
import MoneyTextField from "../../Components/UI/MoneyTextField";

import Card from "../../Components/UI/AppCard";
import { useAuth } from "../../Context/AuthContext";
import CrmPagination from "../../Components/Common/CrmPagination";
import { hasPermission } from "../../utils/permissions";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  deleteProductImage,
  deleteProductOption,
  getCategories,
  getProduct,
  getProductOptions,
  getProducts,
  setPrimaryProductImage,
  updateCategory,
  updateProduct,
  updateProductOption,
  uploadProductImage,
} from "../../api/products";
import { formatNumber } from "../../utils/format";

const emptyProductForm = {
  category_name: "",
  name: "",
  model: "",
  color: "",
  unit: "par",
  description: "",
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
  if (value === null || value === undefined || value === "") {
    return "-";
  }

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

const getInitial = (value) =>
  String(value || "M")
    .trim()
    .slice(0, 1)
    .toUpperCase();

const HeroMetric = (props) => <SharedHeroMetric {...props} labelSx={{ mt: 1.4 }} />;
const StatusChip = (props) => <ActiveStatusChip {...props} />;
const PremiumDialog = (props) => (
  <SharedPremiumDialog
    maxWidth="md"
    subtitle="Mahsulot ma’lumotlarini boshqarish"
    titleClassName="products-dialog-title"
    {...props}
  />
);
const Products = () => {
  const navigate = useNavigate();

  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();

  const canManage = hasPermission(currentUser, "products.manage");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [productOptions, setProductOptions] = useState({
    models: [],
    colors: [],
  });

  const [pageInfo, setPageInfo] = useState({
    total: 0,
    offset: 0,
    limit: 10,
  });

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
  const [settingsTab, setSettingsTab] = useState(0);

  const [optionEdit, setOptionEdit] = useState({
    type: "",
    currentValue: "",
    value: "",
  });

  const [optionSaving, setOptionSaving] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const productStats = useMemo(() => {
    const active = products.filter((product) => product.is_active).length;

    return {
      active,
      categories: categories.length,
      options: productOptions.models.length + productOptions.colors.length,
    };
  }, [categories.length, productOptions.colors.length, productOptions.models.length, products]);

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

  const fetchProductOptions = useCallback(async () => {
    try {
      const { data } = await getProductOptions();

      setProductOptions({
        models: data.models || [],
        colors: data.colors || [],
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Model va ranglarni olishda xato.");
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
          if (filters[key] !== "") {
            params[key] = filters[key];
          }
        }

        const { data } = await getProducts(params);

        setProducts(data.products || []);

        setPageInfo(
          data.pageInfo || {
            total: 0,
            offset,
            limit,
          },
        );
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

      const foundProduct = data?.product || data?.found_product || data;

      setProductImages(foundProduct?.images || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Rasmlarni olishda xato.");
    } finally {
      setImageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchProductOptions();
  }, [fetchCategories, fetchProductOptions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(0, pageInfo.limit);
    }, 250);

    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit, fetchProducts]);

  useEffect(() => {
    return () => {
      if (productImagePreview) {
        URL.revokeObjectURL(productImagePreview);
      }
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
    if (productImagePreview) {
      URL.revokeObjectURL(productImagePreview);
    }

    setProductImageFile(null);
    setProductImagePreview("");
  };

  const handleProductImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (productImagePreview) {
      URL.revokeObjectURL(productImagePreview);
    }

    setProductImageFile(file);

    setProductImagePreview(file ? URL.createObjectURL(file) : "");

    event.target.value = "";
  };

  const buildProductPayload = () => ({
    category_name: productForm.category_name.trim() || null,
    name: productForm.name.trim(),
    model: productForm.model.trim() || null,
    color: productForm.color.trim() || null,
    unit: "par",
    description: productForm.description.trim() || null,
    // `purchase_price` yuborilmaydi — backend uni qabul qilmaydi.
    sale_price: Number(productForm.sale_price),
    is_active: productForm.is_active,
  });

  const validateProduct = () => {
    if (!productForm.name.trim()) {
      toast.error("Mahsulot nomini kiriting.");
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
      category_name: product.category_name || "",
      name: product.name || "",
      model: product.model || "",
      color: product.color || "",
      unit: "par",
      description: product.description || "",
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

      const newProduct = data?.new_product || data?.product || data;

      const newProductId = newProduct?.id;

      if (productImageFile && newProductId) {
        await uploadProductImage(newProductId, productImageFile);
      }

      toast.success("Mahsulot qo'shildi.");

      closeProductModals();
      fetchCategories();
      fetchProductOptions();
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
      fetchCategories();
      fetchProductOptions();

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

      if (selectedCategory?.id === category.id) {
        resetCategoryForm();
      }

      fetchCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Kategoriyani o'chirishda xato.");
    }
  };

  const startOptionEdit = (type, value) => {
    setOptionEdit({
      type,
      currentValue: value,
      value,
    });
  };

  const resetOptionEdit = () => {
    setOptionEdit({
      type: "",
      currentValue: "",
      value: "",
    });
  };

  const handleSaveOption = async () => {
    const value = optionEdit.value.trim();

    if (!value) {
      toast.error("Yangi nomni kiriting.");
      return;
    }

    setOptionSaving(true);

    try {
      await updateProductOption(optionEdit.type, optionEdit.currentValue, value);

      toast.success(optionEdit.type === "model" ? "Model yangilandi." : "Rang yangilandi.");

      resetOptionEdit();
      fetchProductOptions();

      fetchProducts(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Qiymatni yangilashda xato.");
    } finally {
      setOptionSaving(false);
    }
  };

  const handleDeleteOption = async (type, value) => {
    const label = type === "model" ? "model" : "rang";

    const confirmed = window.confirm(`“${value}” ${label}ini mahsulotlardan olib tashlaysizmi?`);

    if (!confirmed) return;

    setOptionSaving(true);

    try {
      await deleteProductOption(type, value);

      toast.success(type === "model" ? "Model o'chirildi." : "Rang o'chirildi.");

      resetOptionEdit();
      fetchProductOptions();

      fetchProducts(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Qiymatni o'chirishda xato.");
    } finally {
      setOptionSaving(false);
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
        border: "1px solid #e8e1d8",
        background: "linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",
      }}
    >
      <Typography
        sx={{
          mb: 1.5,
          color: "var(--aa-text)",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        Mahsulot rasmi
      </Typography>

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={1.2}
      >
        <Button variant="outlined" component="label" sx={secondaryButtonSx}>
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
            sx={primaryButtonSx}
          >
            {imageSaving ? "Yuklanmoqda..." : "Rasmni yuklash"}
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
            border: "1px solid #e8e1d8",
            backgroundColor: "var(--aa-surface-solid)",
          }}
        >
          <Avatar
            variant="rounded"
            src={productImagePreview}
            sx={{
              width: 74,
              height: 74,
              borderRadius: "14px",
            }}
          />

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "var(--aa-text)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Yangi rasm tanlandi
            </Typography>

            <Typography
              noWrap
              sx={{
                mt: 0.4,
                color: "var(--aa-text-tertiary)",
                fontSize: 10,
              }}
            >
              {productImageFile.name}
            </Typography>
          </Box>
        </Box>
      )}

      {createOpen && (
        <Typography
          sx={{
            mt: 1.4,
            color: "var(--aa-text-tertiary)",
            fontSize: 10,
          }}
        >
          Rasm mahsulot saqlangandan keyin avtomatik yuklanadi.
        </Typography>
      )}

      {editOpen && (
        <Box sx={{ mt: 2 }}>
          {imageLoading ? (
            <Box
              sx={{
                minHeight: 100,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CircularProgress size={24} sx={{ color: "#6e1622" }} />
            </Box>
          ) : productImages.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,minmax(0,1fr))",
                },
                gap: 1.3,
              }}
            >
              {productImages.map((image) => (
                <Box
                  key={image.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.3,
                    p: 1.3,
                    borderRadius: "16px",
                    border: image.is_primary
                      ? "1px solid rgba(110, 22, 34,.18)"
                      : "1px solid #e8e1d8",
                    backgroundColor: "var(--aa-surface-solid)",
                  }}
                >
                  <Avatar
                    variant="rounded"
                    src={getImageUrl(image.image_url)}
                    sx={{
                      width: 66,
                      height: 66,
                      borderRadius: "14px",
                    }}
                  />

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        color: "var(--aa-text)",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {image.is_primary ? "Asosiy rasm" : "Qo'shimcha rasm"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.3,
                        color: "var(--aa-text-tertiary)",
                        fontSize: 9.5,
                      }}
                    >
                      ID: {image.id}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={0.8}
                      useFlexGap
                      sx={{
                        mt: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      {!image.is_primary && (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={imageSaving}
                          onClick={() => handleSetPrimaryImage(image.id)}
                          sx={tableActionSx}
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
                        sx={tableActionSx}
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
                textAlign: "center",
                borderRadius: "15px",
                border: "1px dashed #d8cec1",
                backgroundColor: "var(--aa-surface-muted)",
              }}
            >
              <Typography
                sx={{
                  color: "var(--aa-text-tertiary)",
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              >
                Hozircha rasm yuklanmagan.
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  const renderProductOptionSettings = (type) => {
    const values = type === "model" ? productOptions.models : productOptions.colors;

    const title = type === "model" ? "Modellar" : "Ranglar";

    return (
      <Box>
        <Typography
          sx={{
            mb: 0.5,
            color: "var(--aa-text)",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mb: 2,
            color: "var(--aa-text-secondary)",
            fontSize: 11,
            lineHeight: 1.7,
          }}
        >
          Yangi qiymat mahsulot qo‘shish oynasida yozilganda avtomatik ro‘yxatga tushadi.
        </Typography>

        <Stack spacing={1}>
          {values.length ? (
            values.map((value) => {
              const editing = optionEdit.type === type && optionEdit.currentValue === value;

              return (
                <Box
                  key={value}
                  sx={{
                    p: 1.2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderRadius: "14px",
                    border: "1px solid #e8e1d8",
                    backgroundColor: "var(--aa-surface-muted)",
                  }}
                >
                  {editing ? (
                    <TextField
                      autoFocus
                      size="small"
                      fullWidth
                      value={optionEdit.value}
                      onChange={(event) =>
                        setOptionEdit((previous) => ({
                          ...previous,
                          value: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleSaveOption();
                        }
                      }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        flex: 1,
                        color: "var(--aa-text)",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {value}
                    </Typography>
                  )}

                  {editing ? (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={optionSaving}
                        onClick={handleSaveOption}
                        sx={tableActionSx}
                      >
                        Saqlash
                      </Button>

                      <Button size="small" onClick={resetOptionEdit} sx={tableActionSx}>
                        Bekor
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => startOptionEdit(type, value)}
                        sx={tableActionSx}
                      >
                        Tahrirlash
                      </Button>

                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={optionSaving}
                        onClick={() => handleDeleteOption(type, value)}
                        sx={tableActionSx}
                      >
                        O'chirish
                      </Button>
                    </>
                  )}
                </Box>
              );
            })
          ) : (
            <Typography
              sx={{
                py: 5,
                color: "var(--aa-text-tertiary)",
                textAlign: "center",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Hozircha {type === "model" ? "model" : "rang"} yo'q
            </Typography>
          )}
        </Stack>
      </Box>
    );
  };

  const renderProductFields = () => (
    <Stack spacing={2.1} sx={{ pt: 0.5 }}>
      <Autocomplete
        freeSolo
        fullWidth
        options={activeCategories.map((category) => category.name)}
        value={productForm.category_name}
        onChange={(_event, value) =>
          setProductForm((previous) => ({
            ...previous,
            category_name: value || "",
          }))
        }
        onInputChange={(_event, value) =>
          setProductForm((previous) => ({
            ...previous,
            category_name: value,
          }))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Kategoriya"
            helperText="Ro'yxatdan tanlang yoki yangi kategoriya nomini yozing"
          />
        )}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2,minmax(0,1fr))",
          },
          gap: 2,
        }}
      >
        <TextField
          required
          label="Mahsulot nomi"
          value={productForm.name}
          onChange={handleProductChange("name")}
        />

        <Autocomplete
          freeSolo
          options={productOptions.models}
          value={productForm.model}
          onChange={(_event, value) =>
            setProductForm((previous) => ({
              ...previous,
              model: value || "",
            }))
          }
          onInputChange={(_event, value) =>
            setProductForm((previous) => ({
              ...previous,
              model: value,
            }))
          }
          renderInput={(params) => <TextField {...params} label="Model" />}
        />

        <Autocomplete
          freeSolo
          options={productOptions.colors}
          value={productForm.color}
          onChange={(_event, value) =>
            setProductForm((previous) => ({
              ...previous,
              color: value || "",
            }))
          }
          onInputChange={(_event, value) =>
            setProductForm((previous) => ({
              ...previous,
              color: value,
            }))
          }
          renderInput={(params) => <TextField {...params} label="Rang" />}
        />

        <TextField
          label="Hisob birligi"
          value="par"
          disabled
          helperText="Tayyor mahsulot omborda par hisobida yuritiladi."
        />

        {/*
          "Xarid narxi" maydoni olib tashlandi. Tannarx qo'lda yozilmaydi —
          u sarflangan xomashyo va bo'lim ish haqidan hisoblanadi va
          mahsulot sahifasida "Tannarx" bo'limida ko'rinadi. Qo'lda yozilgan
          raqam hisoblangani bilan zid tushib, foyda yolg'on chiqardi.
        */}
        <MoneyTextField
          required
          label="Sotuv narxi"
          value={productForm.sale_price}
          onChange={handleProductChange("sale_price")}
        />
      </Box>

      <Button
        variant="outlined"
        onClick={() => setCategoryOpen(true)}
        sx={{
          alignSelf: "flex-start",
          ...secondaryButtonSx,
        }}
      >
        Kategoriya, model va ranglarni boshqarish
      </Button>

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
          py: 0.6,
          borderRadius: "13px",
          border: "1px solid #e8e1d8",
          backgroundColor: "var(--aa-surface-muted)",
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
      className="crm-page products-page"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2.5,
      }}
    >
      <style>{productsPageStyles}</style>

      <Box
        component="section"
        className="crm-page-hero products-hero"
        sx={{
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
          backgroundColor: "#151211 !important",
          backgroundImage:
            "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.34),transparent 30%),linear-gradient(145deg,#151211,#1e1a18 52%,#3a1219) !important",
          boxShadow: "0 24px 60px rgba(23, 17, 15,.20)",
          flexShrink: 0,

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
                Mahsulot katalogi
              </Typography>
            </Box>

            <Typography
              component="h1"
              sx={{
                mt: 1.5,
                color: "#ffffff !important",
                fontSize: {
                  xs: 29,
                  md: 36,
                },
                lineHeight: 1.08,
                fontFamily: "var(--aa-display)",
                fontWeight: 400,
                letterSpacing: "-.024em",
              }}
            >
              Mahsulotlar
            </Typography>

            <Typography
              sx={{
                maxWidth: 540,
                mt: 1.4,
                color: "rgba(255,255,255,.45) !important",
                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Mahsulotlar, narxlar, kategoriyalar, modellar va rasmlarni yagona katalogda
              boshqaring.
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
                  onClick={openCreateModal}
                  sx={{
                    minHeight: 43,
                    px: 2.2,
                    color: "#ffffff !important",
                    borderRadius: "13px",
                    fontSize: 11.5,
                    fontWeight: 700,
                    textTransform: "none",
                    background: "linear-gradient(135deg,#6e1622,#8c1d2b)",
                    boxShadow: "0 12px 26px rgba(77, 15, 24,.30)",

                    "&:hover": {
                      background: "linear-gradient(135deg,#4d0f18,#7a1826)",
                    },
                  }}
                >
                  + Mahsulot qo‘shish
                </Button>

                <Button
                  onClick={() => setCategoryOpen(true)}
                  sx={{
                    minHeight: 43,
                    px: 2,
                    color: "rgba(255,255,255,.72) !important",
                    borderRadius: "13px",
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
                  Katalog sozlamalari
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
                lg: "repeat(4,minmax(0,1fr))",
              },
              gap: 1.3,
            }}
          >
            <HeroMetric
              label="Jami mahsulot"
              value={formatNumber(pageInfo.total)}
              helper="Katalogdagi barcha mahsulotlar"
              tone="red"
            />

            <HeroMetric
              label="Faol mahsulot"
              value={formatNumber(productStats.active)}
              helper="Joriy sahifadagi faol mahsulotlar"
              tone="green"
            />

            <HeroMetric
              label="Kategoriyalar"
              value={formatNumber(productStats.categories)}
              helper="Mahsulot guruhlari"
              tone="amber"
            />

            <HeroMetric
              label="Model va rang"
              value={formatNumber(productStats.options)}
              helper="Katalog variantlari"
              tone="blue"
            />
          </Box>
        </Box>
      </Box>

      <Card
        className="crm-sticky-filters"
        sx={{
          mb: 2,
          p: 2,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.6,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,minmax(0,1fr))",
                lg: "2fr 1fr auto auto",
              },
              gap: 1.3,
            }}
          >
            <TextField
              size="small"
              label="Mahsulotni qidirish"
              placeholder="Nomi, model, rang yoki SKU"
              value={filters.q}
              onChange={handleFilterChange("q")}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  fetchProducts(0, pageInfo.limit);
                }
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
              sx={filterButtonSx}
            >
              {filtersOpen ? "Filtrlarni yopish" : "Batafsil filtrlar"}
            </Button>

            <Button variant="outlined" onClick={resetFilters} sx={filterButtonSx}>
              Tozalash
            </Button>
          </Box>

          {filtersOpen && (
            <Box
              sx={{
                pt: 1.6,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,minmax(0,1fr))",
                  lg: "repeat(5,minmax(0,1fr))",
                },
                gap: 1.3,
                borderTop: "1px solid #e8e1d8",
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

              <MoneyTextField
                size="small"
                label="Eng past narx"
                value={filters.min_price}
                onChange={handleFilterChange("min_price")}
              />

              <MoneyTextField
                size="small"
                label="Eng yuqori narx"
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
                <MenuItem value="created_at">Yaratilgan sana</MenuItem>

                <MenuItem value="updated_at">Yangilangan sana</MenuItem>

                <MenuItem value="name">Mahsulot nomi</MenuItem>

                <MenuItem value="sale_price">Sotuv narxi</MenuItem>

                {/* "Xarid narxi" bo'yicha saralash olib tashlandi — u endi
                    to'ldirilmaydigan eski maydon, yangi mahsulotlarda doim nol. */}
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
        <Box
          sx={{
            px: 2.4,
            py: 1.9,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            borderBottom: "1px solid #e8e1d8",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "var(--aa-text)",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Mahsulotlar ro‘yxati
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "var(--aa-text-tertiary)",
                fontSize: 10.5,
              }}
            >
              Mahsulot ustiga bosib to‘liq profilini ko‘ring
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${formatNumber(pageInfo.total)} ta`}
            sx={{
              height: 25,
              color: "#6e1622",
              fontSize: 9.5,
              fontWeight: 700,
              backgroundColor: "rgba(110, 22, 34,.07)",
            }}
          />
        </Box>

        <Box
          className="aa-mobile-records aa-products-table"
          sx={{
            minHeight: 0,
            flex: 1,
            overflow: "auto",
          }}
        >
          <Table
            sx={{
              minWidth: canManage ? 1120 : 930,

              "& th": {
                py: 1.55,
                color: "var(--aa-text-tertiary)",
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: ".045em",
                textTransform: "uppercase",
                backgroundColor: "var(--aa-surface-muted)",
                borderColor: "#e8e1d8",
              },

              "& td": {
                py: 1.4,
                color: "var(--aa-text-secondary)",
                fontSize: 10.5,
                borderColor: "#e8e1d8",
              },

              "& tbody tr:hover": {
                backgroundColor: "rgba(110, 22, 34,.025)",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Mahsulot</TableCell>
                <TableCell>Kategoriya</TableCell>
                <TableCell>Model va rang</TableCell>
                <TableCell>Narxlar</TableCell>
                <TableCell>Holati</TableCell>

                {canManage && <TableCell align="right">Amallar</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 6 : 5} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={30} sx={{ color: "#6e1622" }} />
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.4,
                        }}
                      >
                        <Avatar
                          variant="rounded"
                          src={getImageUrl(product.product_image)}
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "15px",
                            color: "#ffffff",
                            fontSize: 13,
                            fontWeight: 700,
                            background: "linear-gradient(135deg,#4d0f18,#8c1d2b)",
                            border: "3px solid #ffffff",
                            boxShadow: "0 8px 20px rgba(77, 15, 24,.16)",
                          }}
                        >
                          {getInitial(product.name)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            noWrap
                            sx={{
                              color: "var(--aa-text)",
                              fontSize: 12.5,
                              fontWeight: 700,
                            }}
                          >
                            {product.name || "-"}
                          </Typography>

                          <Typography
                            noWrap
                            sx={{
                              mt: 0.4,
                              color: "var(--aa-text-tertiary)",
                              fontSize: 9.5,
                            }}
                          >
                            {product.sku ? `SKU: ${product.sku}` : `ID: ${product.id}`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={product.category_name || "Kategoriyasiz"}
                        sx={{
                          height: 25,
                          color: "#6d28d9",
                          fontSize: 9.5,
                          fontWeight: 700,
                          backgroundColor: "rgba(139,92,246,.09)",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "var(--aa-text)",
                          fontSize: 10.5,
                          fontWeight: 600,
                        }}
                      >
                        {product.model || "Model yo‘q"}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.4,
                          color: "var(--aa-text-tertiary)",
                          fontSize: 9.5,
                        }}
                      >
                        {product.color || "Rang ko‘rsatilmagan"} · {product.unit || "par"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "#2f6b45",
                          fontSize: 10.5,
                          fontWeight: 700,
                        }}
                      >
                        Sotuv: {formatMoney(product.sale_price)}
                      </Typography>

                      {/* Tannarx ro'yxatda ko'rsatilmaydi: u har bir mahsulot
                          uchun ombor harakatlaridan hisoblanadi va mahsulot
                          sahifasidagi "Tannarx" bo'limida chiqadi. */}
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.7} sx={{ alignItems: "flex-start" }}>
                        <StatusChip active={product.is_active} />

                        <Typography
                          sx={{
                            color: "var(--aa-text-tertiary)",
                            fontSize: 9.5,
                          }}
                        >
                          {formatDate(product.updated_at)}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.8}
                          useFlexGap
                          sx={{
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                          }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(product);
                            }}
                            sx={tableActionSx}
                          >
                            Tahrirlash
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
                            sx={tableActionSx}
                          >
                            O‘chirish
                          </Button>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 6 : 5}
                    align="center"
                    sx={{
                      py: 8,
                      color: "var(--aa-text-tertiary)",
                      fontWeight: 600,
                    }}
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
            borderTop: "1px solid #e8e1d8",
            backgroundColor: "var(--aa-surface-muted)",
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
        title="Yangi mahsulot qo‘shish"
        actions={
          <>
            <Button onClick={closeProductModals} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              onClick={handleCreateProduct}
              disabled={
                saving ||
                !productForm.name.trim() ||
                productForm.sale_price === "" ||
                Number(productForm.sale_price) < 0
              }
              sx={dialogPrimarySx}
            >
              {saving ? "Saqlanmoqda..." : "Mahsulotni qo‘shish"}
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
            <Button onClick={closeProductModals} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              onClick={handleUpdateProduct}
              disabled={
                saving ||
                !productForm.name.trim() ||
                productForm.sale_price === "" ||
                Number(productForm.sale_price) < 0
              }
              sx={dialogPrimarySx}
            >
              {saving ? "Saqlanmoqda..." : "O‘zgarishlarni saqlash"}
            </Button>
          </>
        }
      >
        {renderProductFields()}
      </PremiumDialog>

      <PremiumDialog
        open={deleteOpen}
        onClose={closeProductModals}
        title="Mahsulotni o‘chirish"
        subtitle="Bu amal mahsulotni faol ro‘yxatdan olib tashlaydi"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={closeProductModals} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={handleDeleteProduct}
              disabled={deleting}
              sx={{
                borderRadius: "11px",
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              {deleting ? "O‘chirilmoqda..." : "O‘chirish"}
            </Button>
          </>
        }
      >
        <Typography
          sx={{
            color: "var(--aa-text-secondary)",
            fontSize: 12.5,
            lineHeight: 1.7,
            fontWeight: 700,
          }}
        >
          <strong>{selectedProduct?.name}</strong> mahsulotini o‘chirmoqchimisiz?
        </Typography>
      </PremiumDialog>

      <PremiumDialog
        open={categoryOpen}
        onClose={() => {
          setCategoryOpen(false);
          resetCategoryForm();
          resetOptionEdit();
        }}
        title="Mahsulot katalogi sozlamalari"
        subtitle="Kategoriyalar, modellar va ranglarni boshqarish"
        actions={
          <>
            {selectedCategory && (
              <Button onClick={resetCategoryForm} sx={dialogCancelSx}>
                Formani tozalash
              </Button>
            )}

            <Button
              onClick={() => {
                setCategoryOpen(false);
                resetCategoryForm();
                resetOptionEdit();
              }}
              sx={dialogCancelSx}
            >
              Yopish
            </Button>
          </>
        }
      >
        <Tabs
          value={settingsTab}
          onChange={(_event, value) => {
            setSettingsTab(value);
            resetCategoryForm();
            resetOptionEdit();
          }}
          variant="fullWidth"
          sx={{
            mb: 2.5,
            minHeight: 42,
            borderBottom: "1px solid #e8e1d8",

            "& .MuiTab-root": {
              minHeight: 42,
              color: "var(--aa-text-secondary)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "none",
            },

            "& .Mui-selected": {
              color: "#6e1622 !important",
            },

            "& .MuiTabs-indicator": {
              height: 3,
              backgroundColor: "#6e1622",
            },
          }}
        >
          <Tab label="Kategoriyalar" />
          <Tab label="Modellar" />
          <Tab label="Ranglar" />
        </Tabs>

        {settingsTab === 0 && (
          <>
            <Box
              sx={{
                mb: 1.4,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1.5fr auto",
                },
                gap: 1.3,
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
                sx={dialogPrimarySx}
              >
                {selectedCategory ? "Saqlash" : "Qo‘shish"}
              </Button>
            </Box>

            <Box
              sx={{
                mb: 2,
                px: 1.2,
                py: 0.6,
                borderRadius: "13px",
                border: "1px solid #e8e1d8",
                backgroundColor: "var(--aa-surface-muted)",
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
                      py: 1.45,
                      color: "var(--aa-text-tertiary)",
                      fontSize: 9.5,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      backgroundColor: "var(--aa-surface-muted)",
                    },

                    "& td": {
                      py: 1.35,
                      borderColor: "#e8e1d8",
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
                          <TableCell
                            sx={{
                              color: "var(--aa-text)",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {category.name}
                          </TableCell>

                          <TableCell
                            sx={{
                              color: "var(--aa-text-secondary)",
                              fontSize: 10.5,
                            }}
                          >
                            {category.description || "-"}
                          </TableCell>

                          <TableCell>
                            <StatusChip active={category.is_active} />
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
                                onClick={() => startCategoryEdit(category)}
                                sx={tableActionSx}
                              >
                                Tahrirlash
                              </Button>

                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={() => handleDeleteCategory(category)}
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
                          colSpan={4}
                          align="center"
                          sx={{
                            py: 6,
                            color: "var(--aa-text-tertiary)",
                          }}
                        >
                          Kategoriyalar topilmadi
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </>
        )}

        {settingsTab === 1 && renderProductOptionSettings("model")}

        {settingsTab === 2 && renderProductOptionSettings("color")}
      </PremiumDialog>
    </Box>
  );
};

const filterButtonSx = {
  minHeight: 40,
  px: 1.8,
  color: "var(--aa-text-secondary)",
  borderRadius: "11px",
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

const secondaryButtonSx = {
  minHeight: 40,
  px: 1.8,
  color: "var(--aa-text-secondary)",
  borderRadius: "11px",
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
  borderRadius: "11px",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",
  background: "linear-gradient(135deg,#4d0f18,#7a1826)",
  boxShadow: "0 10px 24px rgba(77, 15, 24,.18)",

  "&:hover": {
    background: "linear-gradient(135deg,#4d0f18,#6e1622)",
  },
};

const tableActionSx = {
  borderRadius: "9px",
  fontSize: 9.5,
  fontWeight: 700,
  textTransform: "none",
};

const dialogCancelSx = {
  color: "var(--aa-text-secondary)",
  borderRadius: "11px",
  fontWeight: 600,
  textTransform: "none",
};

const dialogPrimarySx = {
  minHeight: 40,
  px: 2,
  color: "#ffffff",
  borderRadius: "11px",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",
  background: "linear-gradient(135deg,#4d0f18,#7a1826)",
  boxShadow: "0 10px 24px rgba(77, 15, 24,.18)",

  "&:hover": {
    background: "linear-gradient(135deg,#4d0f18,#6e1622)",
  },
};

const productsPageStyles = `
  .crm-page .products-hero {
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

  .products-dialog-title {
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

export default Products;
