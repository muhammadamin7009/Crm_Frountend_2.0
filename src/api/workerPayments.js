import api from "./axios";

export const getWorkerPayments = (params) => api.get("/worker-payments", { params });

export const getWorkerPaymentsSummary = (params) => api.get("/worker-payments/summary", { params });

export const getWorkerBalance = (params) => api.get("/worker-payments/balance", { params });

export const getWorkerDues = () => api.get("/worker-payments/due");

export const getWorkerPayment = (id) => api.get(`/worker-payments/${id}`);

export const createWorkerPayment = (data) => api.post("/worker-payments", data);

export const updateWorkerPayment = (id, data) => api.patch(`/worker-payments/${id}`, data);

export const deleteWorkerPayment = (id) => api.delete(`/worker-payments/${id}`);
