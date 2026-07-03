import api from "./axios";

export const getWorkerOutputs = (params) => api.get("/worker-outputs", { params });

export const getWorkerOutputsSummary = (params) => api.get("/worker-outputs/summary", { params });

export const getWorkerOutput = (id) => api.get(`/worker-outputs/${id}`);

export const createWorkerOutput = (data) => api.post("/worker-outputs", data);

export const createBulkWorkerOutputs = (data) => api.post("/worker-outputs/bulk", data);

export const updateWorkerOutput = (id, data) => api.patch(`/worker-outputs/${id}`, data);

export const deleteWorkerOutput = (id) => api.delete(`/worker-outputs/${id}`);
