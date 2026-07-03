import api from "./axios";

export const getClientPayments = (params) => api.get("/client-payments", { params });

export const getClientPaymentsSummary = (params) => api.get("/client-payments/summary", { params });

export const getClientPayment = (id) => api.get(`/client-payments/${id}`);

export const createClientPayment = (data) => api.post("/client-payments", data);

export const updateClientPayment = (id, data) => api.patch(`/client-payments/${id}`, data);

export const deleteClientPayment = (id) => api.delete(`/client-payments/${id}`);
