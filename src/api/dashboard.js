import api from "./axios";

// Bosh sahifadagi karta bosilganda "bu raqam nimadan yig'ilgan" degan savolga
// javob beradi. Turlar: sales, client_income, production, purchases,
// inventory, cash. Har biri o'z ruxsatini talab qiladi.
export const getDashboardBreakdown = (type, params) =>
  api.get(`/dashboard/breakdown/${type}`, { params });

// Kartalardagi jami raqamlar. Ochilish bilan bir xil so'rovdan chiqadi,
// shuning uchun karta va modal tepasidagi son doim bir xil bo'ladi.
export const getDashboardSummary = (params) => api.get("/dashboard/summary", { params });
