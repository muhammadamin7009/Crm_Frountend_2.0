/**
 * Yuklangan fayl manzilini to'liq URL ga aylantiradi.
 *
 * Bazada `/uploads/xxx` ko'rinishida saqlanadi. Productionda frontend
 * `al-amin.uz` dan, fayllar esa `api.al-amin.uz` dan beriladi — shuning
 * uchun nisbiy yo'lni to'g'ridan-to'g'ri `<img src>` ga qo'ysak brauzer
 * uni frontend domenidan qidiradi va 404 oladi. Rasm jimgina sinadi:
 * xato ham chiqmaydi, o'rniga bo'sh quti turadi.
 */
export const getImageUrl = (path) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;

  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

export default getImageUrl;
