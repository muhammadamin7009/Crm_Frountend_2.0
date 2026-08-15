/**
 * Landing sahifasini Node ichida HTML ga aylantirish uchun kirish nuqtasi.
 *
 * Brauzer bu faylni hech qachon ko'rmaydi — u faqat `npm run build` paytida,
 * `scripts/prerender.mjs` tomonidan chaqiriladi. Natijasi `dist/landing.html`
 * ga yoziladi, ya'ni Google va Telegram sahifani JavaScriptsiz o'qiy oladi.
 *
 * Bu hidratatsiya emas: brauzerda React `#root` ni tozalab qaytadan chizadi.
 * Shu sababli mos kelmagan atribut yoki tasodifiy farq xatoga olib kelmaydi —
 * oldindan chizilgan HTML faqat robotlar va birinchi kadr uchun.
 */
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";

import PremiumLandingPage from "./Pages/LandingPage/PremiumLandingPage";

export const render = () =>
  renderToString(
    <StaticRouter location="/landing">
      <PremiumLandingPage />
    </StaticRouter>,
  );
