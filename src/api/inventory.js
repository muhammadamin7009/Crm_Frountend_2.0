import api from "./axios";

export const getWarehouses = (params) => api.get("/warehouses", { params });
export const getInventorySummary = () => api.get("/inventory/summary");
export const createWarehouse = (data) => api.post("/warehouses", data);
export const updateWarehouse = (id, data) => api.patch(`/warehouses/${id}`, data);
export const archiveWarehouse = (id) => api.delete(`/warehouses/${id}`);

export const getInventoryStock = (params) => api.get("/inventory/stock", { params });
export const getLowInventoryStock = (params) => api.get("/inventory/low-stock", { params });
export const getInventoryItems = (params) => api.get("/inventory/items", { params });
export const updateInventoryThreshold = (id, minimum_quantity) =>
  api.patch(`/inventory/stock/${id}`, { minimum_quantity });

export const getInventoryMovements = (params) => api.get("/inventory/movements", { params });
export const createInventoryMovement = (data) => api.post("/inventory/movements", data);
export const createProductionReceipt = (data) => api.post("/inventory/production-receipts", data);
export const createInventoryTransfer = (data) => api.post("/inventory/transfers", data);

export const getInventoryCounts = (params) => api.get("/inventory/counts", { params });
export const getInventoryCount = (id) => api.get(`/inventory/counts/${id}`);
export const createInventoryCount = (data) => api.post("/inventory/counts", data);
