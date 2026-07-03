import api from "./axios";

export const getDepartments = (params) => api.get("/departments", { params });
