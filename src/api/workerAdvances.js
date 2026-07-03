import api from "./axios";

export const getWorkerAdvances = (params) => api.get("/worker-advances", { params });
export const getWorkerAdvanceBalance = (params) => api.get("/worker-advances/balance", { params });
export const createWorkerAdvance = (data) => api.post("/worker-advances", data);
export const updateWorkerAdvance = (id, data) => api.patch(`/worker-advances/${id}`, data);
export const deleteWorkerAdvance = (id) => api.delete(`/worker-advances/${id}`);
