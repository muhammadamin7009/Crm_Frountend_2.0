/**
 * Korxona kodi (slug).
 *
 * Manzilda turadi: `erp.al-amin.uz/hayat/products`. Ilgari u faqat
 * `localStorage` da edi va shundan ikki muammo chiqardi:
 *
 *   1. Ishchi har kirishda "korxona kodi" ni yozishi kerak edi
 *   2. Bitta kompyuterda ikki korxona ishlasa, ikkinchisi birinchining
 *      kodi bilan qolib ketardi
 *
 * Shuning uchun MANZIL USTUN: `localStorage` faqat manzilda kod
 * bo'lmaganda ishlatiladi.
 */

const DEFAULT_COMPANY_SLUG = import.meta.env.VITE_COMPANY_SLUG || "zerrshoes";

/**
 * Korxona kodi bo'la olmaydigan yo'llar.
 *
 * `/platform` va `/landing` — tizimning o'z sahifalari. Ular kod deb
 * o'qilsa butun ilova noto'g'ri korxonaga ulanardi.
 */
const RESERVED = new Set([
  "landing",
  "platform",
  "login",
  "register",
  "assets",
  "uploads",
  "api",
]);

export const normalizeCompanySlug = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

/** Manzildagi birinchi bo'lak — korxona kodi bo'lsa. */
export const getSlugFromPath = (pathname = window.location.pathname) => {
  const first = normalizeCompanySlug(String(pathname).split("/")[1] || "");

  if (!first || RESERVED.has(first)) return "";

  return first;
};

export const getCompanySlug = () =>
  getSlugFromPath() ||
  normalizeCompanySlug(localStorage.getItem("company_slug")) ||
  DEFAULT_COMPANY_SLUG;

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
