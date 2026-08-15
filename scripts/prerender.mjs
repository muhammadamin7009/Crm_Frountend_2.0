/**
 * Landing sahifasini build paytida HTML ga chizadi.
 *
 * Muammo: ilova SPA. Server bo'sh `<div id="root">` qaytaradi, matnni
 * brauzerdagi JavaScript chizadi. Google saytni indekslay olmaydi, Telegramga
 * havola tashlansa preview bo'sh chiqadi — chunki ularning hech biri JS
 * ishlatmaydi.
 *
 * Yechim: build oxirida landing sahifasini Node ichida bir marta chizib,
 * `dist/landing.html` ga yozamiz. Butun ilovani SSR ga o'tkazish shart emas —
 * faqat bitta sahifa robotlarga ochiq bo'lsa yetadi, qolgani SPA bo'lib
 * qolaveradi.
 *
 * Brauzerda React `#root` ni tozalab qaytadan chizadi, shuning uchun bu yerda
 * chizilgan HTML bilan brauzernikining farqi muammo tug'dirmaydi.
 */
import { build } from "vite";
import { readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ssrDir = resolve(root, ".prerender");

console.log("Landing sahifasi uchun server bundle yig'ilmoqda...");
await build({
  root,
  logLevel: "warn",
  build: {
    ssr: resolve(root, "src/entry-landing.jsx"),
    outDir: ssrDir,
    emptyOutDir: true,
    // Bu bundle serverda ham, brauzerda ham ishlamaydi — u faqat shu
    // skript uchun. Minifikatsiya vaqt yeydi, foydasi yo'q.
    minify: false,
  },
});

// Windowsda `import("c:/...")` ishlamaydi — ESM loader file:// URL talab qiladi.
const { render } = await import(pathToFileURL(resolve(ssrDir, "entry-landing.js")).href);
const html = render();

if (!html || html.length < 2000) {
  throw new Error(`Chizilgan HTML juda kalta (${html?.length || 0} belgi) — nimadir noto'g'ri`);
}

const shell = await readFile(resolve(root, "dist/index.html"), "utf8");
if (!shell.includes('<div id="root">')) {
  throw new Error("dist/index.html ichida <div id=\"root\"> topilmadi");
}

const page = shell.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
await writeFile(resolve(root, "dist/landing.html"), page, "utf8");
await rm(ssrDir, { recursive: true, force: true });

// Qabul mezoni: hero sarlavhasi HTML manbasida bo'lishi kerak.
const kutilgan = ["Xomashyodan tayyor mahsulotgacha", "Bepul jarayon auditi"];
const yoq = kutilgan.filter((matn) => !page.includes(matn));
if (yoq.length) throw new Error(`dist/landing.html ichida topilmadi: ${yoq.join(", ")}`);

console.log(`dist/landing.html tayyor — ${Math.round(page.length / 1024)} KB, matn bilan.`);
