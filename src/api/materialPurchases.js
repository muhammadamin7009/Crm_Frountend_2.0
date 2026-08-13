import api from "./axios";

export const getSuppliers = (params) => api.get("/suppliers", { params });
export const createSupplier = (data) => api.post("/suppliers", data);
export const updateSupplier = (id, data) => api.patch(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

export const getRawMaterials = (params) => api.get("/raw-materials", { params });
export const getRawMaterialStock = (params) => api.get("/raw-materials/stock", { params });
export const createRawMaterial = (data) => api.post("/raw-materials", data);

// Bir necha xomashyoni birdaniga. Hammasi bitta tranzaksiyada yaratiladi:
// nom yagona bo'lgani uchun o'rtadagi takror qolganini ham bekor qiladi.
export const createRawMaterials = (materials) => api.post("/raw-materials/bulk", { materials });
export const updateRawMaterial = (id, data) => api.patch(`/raw-materials/${id}`, data);
export const deleteRawMaterial = (id) => api.delete(`/raw-materials/${id}`);

export const getMaterialPurchases = (params) => api.get("/material-purchases", { params });
export const getSupplierBalance = (params) => api.get("/material-purchases/balance", { params });
export const createMaterialPurchase = (data) => api.post("/material-purchases", data);
export const updateMaterialPurchase = (id, data) => api.patch(`/material-purchases/${id}`, data);
export const deleteMaterialPurchase = (id) => api.delete(`/material-purchases/${id}`);

export const getSupplierPayments = (params) => api.get("/supplier-payments", { params });
export const createSupplierPayment = (data) => api.post("/supplier-payments", data);
