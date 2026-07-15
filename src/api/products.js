import api from "./axios";

export const getProducts = (params) => api.get("/products", { params });

export const getProduct = (id) => api.get(`/products/${id}`);
export const getProductRecipe = (id) => api.get(`/products/${id}/recipe`);
export const saveProductRecipe = (id, data) => api.put(`/products/${id}/recipe`, data);

export const getProductDepartmentPrices = (id) => api.get(`/products/${id}/department-prices`);

export const saveProductDepartmentPrices = (id, prices) =>
  api.put(`/products/${id}/department-prices`, { prices });

export const updateProductDepartmentPrice = (id, departmentId, data) =>
  api.patch(`/products/${id}/department-prices/${departmentId}`, data);

export const createProduct = (data) => api.post("/products", data);

export const updateProduct = (id, data) => api.patch(`/products/${id}`, data);

export const deleteProduct = (id) => api.delete(`/products/${id}`);

export const getProductOptions = () => api.get("/product-options");

export const updateProductOption = (type, currentValue, newValue) =>
  api.patch(`/product-options/${type}`, {
    current_value: currentValue,
    new_value: newValue,
  });

export const deleteProductOption = (type, value) =>
  api.delete(`/product-options/${type}`, { data: { value } });

export const uploadProductImage = (id, file) => {
  const formData = new FormData();
  formData.append("product_image", file);

  return api.post(`/products/${id}/images`, formData);
};

export const setPrimaryProductImage = (id, imageId) =>
  api.patch(`/products/${id}/images/${imageId}/primary`);

export const deleteProductImage = (id, imageId) => api.delete(`/products/${id}/images/${imageId}`);

export const getCategories = (params) => api.get("/categories", { params });

export const createCategory = (data) => api.post("/categories", data);

export const updateCategory = (id, data) => api.patch(`/categories/${id}`, data);

export const deleteCategory = (id) => api.delete(`/categories/${id}`);
