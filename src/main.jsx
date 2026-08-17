import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ToastContainer } from "react-toastify";

// Router
import { BrowserRouter as Router } from "react-router-dom";

// Styles
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { AuthProvider } from "./Context/AuthContext.jsx";
import { ThemeModeProvider } from "./Context/ThemeContext.jsx";
import ErrorBoundary from "./Components/ErrorBoundary/ErrorBoundary.jsx";
import { getSlugFromPath, normalizeCompanySlug } from "./utils/company.js";

/**
 * Korxona kodi manzilning boshida turadi: `/hayat/products`.
 *
 * `basename` orqali beriladi — shunda ilova ichidagi barcha yo'llar
 * (`/products`, `/orders`, qirqtadan ortiq havola) o'zgarishsiz qoladi
 * va faqat brauzerdagi manzil kod bilan ko'rinadi.
 *
 * Kod bo'lmasa (`/login`, `/platform`) `basename` berilmaydi va hamma
 * narsa avvalgidek ishlaydi.
 */
const slug = getSlugFromPath();

/**
 * Eski havolalar.
 *
 * Ishchilarning bookmarki `erp.al-amin.uz/` ga ishora qiladi. Ular
 * ishlashda davom etsin, lekin manzil kodli holga o'tsin — shunda
 * keyingi safar to'g'ri manzil saqlanadi.
 *
 * Faqat ildizda: `/platform` va `/login` ga tegilmaydi.
 */
if (window.location.pathname === "/") {
  const stored = normalizeCompanySlug(localStorage.getItem("company_slug"));
  if (stored && localStorage.getItem("token")) window.location.replace(`/${stored}/`);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <Router
      basename={slug ? `/${slug}` : undefined}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeModeProvider>
        <AuthProvider>
          <App />
          <ToastContainer theme="colored" />
        </AuthProvider>
      </ThemeModeProvider>
    </Router>
  </ErrorBoundary>,
);
