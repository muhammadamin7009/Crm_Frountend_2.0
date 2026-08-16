import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Kutubxonalarni alohida bo'laklarga ajratamiz.
 *
 * Sababi: bitta bo'lakda hammasi turganda har deploydan keyin foydalanuvchi
 * 500 KB ni qaytadan yuklaydi — biz o'zgartirgan narsa bir qator bo'lsa ham.
 * React va MUI oyiga bir marta yangilanadi, bizning kodimiz esa kuniga.
 * Ajratilgandan keyin brauzer kutubxonalarni keshda saqlab qoladi.
 *
 * `framer-motion` faqat landing sahifasida ishlatiladi — u tizimga kirgan
 * foydalanuvchiga umuman yuklanmasligi kerak.
 */
const vendorChunk = (id) => {
  if (!id.includes("node_modules")) return undefined;

  if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id))
    return "vendor-react";
  if (/[\\/]node_modules[\\/]@emotion[\\/]/.test(id)) return "vendor-emotion";
  if (/[\\/]node_modules[\\/]axios[\\/]/.test(id)) return "vendor-axios";

  // Qolgani Vite ixtiyorida. MUI'ni bir bo'lakka yig'ib qo'ysak, hozir
  // faqat kerakli sahifada yuklanadigan Dialog, Tabs, TextField ham
  // birinchi ochilishda tushadi — o'lchovda boshlang'ich yuk 596 KB dan
  // 824 KB ga chiqdi. Shuning uchun tegmaymiz.
  return undefined;
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
});
