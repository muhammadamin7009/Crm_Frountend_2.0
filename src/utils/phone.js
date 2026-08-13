// O'zbekiston telefon raqami: ekranda "+998 (95) 600-10-06", bazada
// "+998956001006". Mantiq komponentdan ajratilgan — React'siz sinaladi.

const COUNTRY = "998";
const NATIONAL_LENGTH = 9;

/** Faqat milliy 9 ta raqam: "+998 (95) 600-10-06" -> "956001006". */
export const parsePhoneInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");

  // Foydalanuvchi 998 bilan ham, 0 bilan ham, faqat operator kodidan ham
  // boshlashi mumkin — hammasi bir xil milliy raqamga keltiriladi.
  const national = digits.startsWith(COUNTRY) ? digits.slice(COUNTRY.length) : digits;

  return national.replace(/^0+/, "").slice(0, NATIONAL_LENGTH);
};

/** Saqlanadigan qiymat: "+998956001006" yoki bo'sh. */
export const toStoredPhone = (value) => {
  const national = parsePhoneInput(value);
  return national ? `+${COUNTRY}${national}` : "";
};

/** Ko'rinadigan qiymat. Yozilayotgan yarim raqam ham chiroyli chiqadi. */
export const formatPhoneInput = (value) => {
  const national = parsePhoneInput(value);
  if (!national) return "";

  let text = `+${COUNTRY} (${national.slice(0, 2)}`;
  if (national.length >= 2) text += ")";
  if (national.length > 2) text += ` ${national.slice(2, 5)}`;
  if (national.length > 5) text += `-${national.slice(5, 7)}`;
  if (national.length > 7) text += `-${national.slice(7, 9)}`;

  return text;
};
