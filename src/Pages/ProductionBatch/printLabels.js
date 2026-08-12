/**
 * Partiya yorlig'ini chop etish.
 *
 * Yorliq karobkaga yopishtiriladi va uning yagona vazifasi — yopiq karobkani
 * ochmasdan ichida nima borligini bilish. Shuning uchun unda partiya raqami
 * bor: omborchi raqamni tizimga kiritsa, to'liq kartani ko'radi.
 *
 * Chop etish alohida oynada bajariladi. Ilovaning o'z uslublari bilan
 * `@media print` orqali kurashgandan ko'ra, toza HTML yasab yuborish
 * ishonchliroq: bosma natija brauzer va mavzudan qat'i nazar bir xil chiqadi.
 */

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Bo'sh qiymatlar yorliqqa chiqmaydi — yarim to'ldirilgan qator chalkashtiradi. */
const labelRows = (batch) =>
  [
    ["Nomi", batch.product_name],
    ["Model", batch.product_model],
    ["Rangi", batch.product_color],
    ["Material", batch.material_name],
    ["Padoj", batch.sole_name],
    ["O‘lcham", formatSize(batch)],
    ["Zakaz", batch.order_number],
  ].filter(([, value]) => value);

export const formatSize = (batch) => {
  if (batch?.size_from && batch?.size_to) return `${batch.size_from} - ${batch.size_to}`;
  return batch?.size_from || batch?.size_to || "";
};

const labelHtml = (batch, pairsPerBox) => `
  <div class="label">
    <div class="head">
      <span class="model">${escapeHtml(batch.product_model || batch.product_name)}</span>
      <span class="size">${escapeHtml(formatSize(batch))}</span>
    </div>

    <table class="rows">
      ${labelRows(batch)
        .map(
          ([key, value]) =>
            `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(value)}</td></tr>`,
        )
        .join("")}
    </table>

    <div class="foot">
      <span class="number">${escapeHtml(batch.batch_number)}</span>
      ${pairsPerBox ? `<span class="pairs">${escapeHtml(pairsPerBox)} par</span>` : ""}
    </div>
  </div>
`;

const PAGE_STYLES = `
  @page { size: A4; margin: 8mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", Roboto, Arial, sans-serif;
    color: #000;
    background: #fff;
  }
  .sheet {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 4mm;
  }
  .label {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 52mm;
    padding: 3.5mm 4mm;
    border: 1px solid #000;
    border-radius: 2mm;
    /* Yorliq ikkiga bo'linib qolmasin. */
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 3mm;
    padding-bottom: 1.6mm;
    border-bottom: 1px solid #000;
  }
  .model { font-size: 13pt; font-weight: 800; text-transform: uppercase; letter-spacing: .02em; }
  .size { font-size: 11pt; font-weight: 700; white-space: nowrap; }
  .rows { width: 100%; border-collapse: collapse; margin: 1.5mm 0; }
  .rows th {
    width: 20mm;
    padding: .5mm 0;
    font-size: 8pt;
    font-weight: 600;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: #444;
    vertical-align: top;
  }
  .rows td { padding: .5mm 0; font-size: 9.5pt; font-weight: 700; }
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 1.6mm;
    border-top: 1px solid #000;
  }
  .number { font-size: 14pt; font-weight: 800; letter-spacing: .06em; }
  .pairs { font-size: 10pt; font-weight: 700; }
`;

/**
 * @param batch        partiya kartasi
 * @param copies       nechta yorliq (odatda karobkalar soni)
 * @param pairsPerBox  bitta karobkadagi par soni; har karobkada har xil
 *                     bo'lishi mumkin, shuning uchun saqlanmaydi
 * @returns {boolean}  oyna ochilganmi (blokerga tushsa false)
 */
export const printBatchLabels = (batch, { copies = 1, pairsPerBox = "" } = {}) => {
  const total = Math.max(1, Math.min(Number(copies) || 1, 200));
  const sheet = Array.from({ length: total }, () => labelHtml(batch, pairsPerBox)).join("");

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return false;

  // `onload` hujjatning o'zida: `document.write` dan keyin tashqaridan
  // tinglashga ulgurmay qolish mumkin, atributdagi handler esa hujjat bilan
  // birga o'qiladi va uslublar qo'llangandan keyin ishlaydi.
  printWindow.document.write(
    `<!doctype html><html lang="uz"><head><meta charset="utf-8">` +
      `<title>${escapeHtml(batch.batch_number)}</title>` +
      `<style>${PAGE_STYLES}</style></head>` +
      `<body onload="window.print()"><div class="sheet">${sheet}</div></body></html>`,
  );
  printWindow.document.close();
  printWindow.focus();

  return true;
};
