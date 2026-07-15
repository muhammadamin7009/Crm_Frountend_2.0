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
export const getCompanyManagement = (id) => platformApi.get(`/companies/${id}/management`);
export const updateCompanyManagement = (id, data) =>
  platformApi.patch(`/companies/${id}/management`, data);
export const resetCompanyAuthenticator = (id) =>
  platformApi.delete(`/companies/${id}/management/authenticator`);
export const deleteCompany = (id, confirmSlug) =>
  platformApi.delete(`/companies/${id}`, { data: { confirm_slug: confirmSlug } });
export const getSubscriptionPayments = (params) => platformApi.get("/payments", { params });
export const createSubscriptionPayment = (data) => platformApi.post("/payments", data);
