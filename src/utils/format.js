/**
 * Ekranga chiqadigan raqam va sanalarning yagona ko'rinishi.
 *
 * Bu funksiyalar 20 dan ortiq sahifada bir xil qilib qayta yozilgan edi.
 * Nusxalar asta-sekin bir-biridan uzoqlashadi: bir joyda "5 000 so'm",
 * boshqasida "5000 som" chiqib qoladi. Endi manba bitta.
 *
 * Sana uchun bo'sh qiymat "—" bo'ladi. Ilgari ba'zi sahifalarda "-" (defis),
 * ba'zilarida "—" (tire) turardi — bir jadvalda ikkalasi ham uchrardi.
 */

const numberFormat = new Intl.NumberFormat("uz-UZ");

/** Minglik ajratgich bilan raqam: 1234567 -> "1 234 567". */
export const formatNumber = (value) => numberFormat.format(Number(value || 0));

/** Summa: 1234567 -> "1 234 567 so'm". */
export const money = (value) => `${numberFormat.format(Number(value || 0))} so'm`;

/**
 * Summa, bo'sh qiymatni ham aniq ko'rsatadi.
 *
 * `money` dan farqi shunda: `null` yoki bo'sh satr kelganda ham "0 so'm"
 * qaytaradi. Jadvalda bo'sh katak "ma'lumot yo'q" degan taassurot beradi,
 * "0 so'm" esa haqiqatni aytadi.
 */
export const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") return "0 so'm";
  return money(value);
};

/** Miqdor: kasr qismi uchtagacha, ortiqcha nol yozilmaydi. */
export const quantity = (value) =>
  Number(value || 0).toLocaleString("uz-UZ", { maximumFractionDigits: 3 });

/** Sana: "15.08.2026". Bo'sh yoki noto'g'ri qiymatda "—". */
export const date = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("uz-UZ");
};

/** Sana va vaqt: "15 avg 2026, 14:30". Bo'sh qiymatda "—". */
export const dateTime = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};
