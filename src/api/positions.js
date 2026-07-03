import api from "./axios";

export const getPositions = (params) => api.get("/positions", { params });
export const createPosition = (data) => api.post("/positions", data);
export const updatePosition = (id, data) => api.patch(`/positions/${id}`, data);
export const getEmployees = (params) => api.get("/employees", { params });
export const createEmployee = (data) => api.post("/employees", data);
export const updateEmployee = (id, data) => api.patch(`/employees/${id}`, data);
export const getEmployeeAgreements = (id) => api.get(`/employees/${id}/agreements`);
export const createEmployeeAgreement = (data) => api.post("/employee-agreements", data);
