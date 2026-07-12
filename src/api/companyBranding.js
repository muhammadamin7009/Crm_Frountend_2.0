import axios from "axios";
import api from "./axios";
import { normalizeCompanySlug } from "../utils/company";

const apiBase = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const getCompanyBranding = (slug) =>
  axios.get(`${apiBase}/api/${normalizeCompanySlug(slug)}/company/branding`);

export const updateCompanyLogo = (file) => {
  const formData = new FormData();
  formData.append("company_logo", file);
  return api.patch("/company/logo", formData);
};

export const deleteCompanyLogo = () => api.delete("/company/logo");
