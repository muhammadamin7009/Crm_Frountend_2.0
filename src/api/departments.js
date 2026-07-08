import api from "./axios";

export const getDepartments = (params) => api.get("/departments", { params });

export const createDepartment = (data) => api.post("/departments", data);
