import axios from "axios";
import { clearSession, getToken } from "../utils/auth";
import { getCompanySlug } from "../utils/company";

const getDeviceId = () => {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  const apiBase = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  config.baseURL = `${apiBase}/api/${getCompanySlug()}`;
  config.headers["X-Device-Id"] = getDeviceId();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearSession();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
