import { Paper } from "@mui/material";

/**
 * Sahifa ichidagi oq maydon: karta, jadval yoki bo'lim uchun asos.
 *
 * Mahsulot va foydalanuvchi sahifalarida bir xil qilib ikki marta yozilgan
 * edi, farqi faqat soyada: biri qo'lda yozilgan rgba, ikkinchisi token.
 * Qo'lda yozilgani qorong'i mavzuda deyarli ko'rinmasdi — shuning uchun
 * token qoldirildi, u mavzu bilan birga o'zgaradi.
 */
const Surface = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid var(--aa-border)",
      backgroundColor: "var(--aa-surface-solid)",
      boxShadow: "var(--aa-shadow-md)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export default Surface;
