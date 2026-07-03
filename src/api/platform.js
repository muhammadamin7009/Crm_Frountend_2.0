import axios from "axios";

const platformApi = axios.create({
  baseURL: `${String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api/platform`,
});

platformApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("platform_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const platformLogin = (data) => platformApi.post("/login", data);
export const getCompanies = () => platformApi.get("/companies");
export const getSubscriptionPlans = () => platformApi.get("/plans");
export const createCompany = (data) => platformApi.post("/companies", data);
export const updateCompany = (id, data) => platformApi.patch(`/companies/${id}`, data);
export const getSubscriptionPayments = (params) => platformApi.get("/payments", { params });
export const createSubscriptionPayment = (data) => platformApi.post("/payments", data);
