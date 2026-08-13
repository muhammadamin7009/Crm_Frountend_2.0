// Summa maydonlarining yagona qoidasi: ekranda minglik ajratgich bilan,
// tashqariga esa toza raqam. Mantiq komponentdan ajratilgan — u React'siz
// sinaladi va boshqa joyda ham ishlatiladi.

/** Formatlangan matndan toza raqam: "5 555 555" -> "5555555". */
export const parseMoneyInput = (value) => {
  const normalized = String(value ?? "")
    .replace(/so['‘’`]?m/gi, "")
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const [integer = "", ...decimalParts] = normalized.split(".");
  const decimal = decimalParts.join("").slice(0, 2);

  if (!integer && !decimal) return "";

  return decimalParts.length ? `${integer || "0"}.${decimal}` : integer;
};

/** Ko'rinadigan matn: "5555555" -> "5 555 555". */
export const formatMoneyInput = (value) => {
  const raw = parseMoneyInput(value);
  if (!raw) return "";

  const [integer, decimal] = raw.split(".");
  const grouped = integer.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return decimal === undefined ? grouped : `${grouped}.${decimal}`;
};
