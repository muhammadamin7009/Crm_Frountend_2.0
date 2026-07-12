const DEFAULT_COMPANY_SLUG = import.meta.env.VITE_COMPANY_SLUG || "zerrshoes";

export const normalizeCompanySlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

export const getCompanySlug = () =>
  normalizeCompanySlug(localStorage.getItem("company_slug")) || DEFAULT_COMPANY_SLUG;

export const setCompanySlug = (slug) => {
  const normalized = normalizeCompanySlug(slug);
  if (normalized) localStorage.setItem("company_slug", normalized);
  return normalized;
};

export const getCompanyLogoUrl = (logoUrl) => {
  if (!logoUrl) return "";
  if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
  const apiBase = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${apiBase}${logoUrl.startsWith("/") ? logoUrl : `/${logoUrl}`}`;
};
