import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { clearSession, getToken, getUser } from "../utils/auth";
import { getMe } from "../api/getUsers";

const AuthContext = createContext();

// Ikki marta ketma-ket yangilamaslik uchun eng kam oraliq.
const REFRESH_INTERVAL_MS = 30_000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser);

  const [loading, setLoading] = useState(false);

  const lastRefreshAt = useRef(0);

  /**
   * Ruxsatlar ilgari `localStorage` da kirish paytidagi holatda muzlab qolardi:
   * admin panelda ruxsatni o'zgartirsa ham, xodim chiqib qayta kirmaguncha menyu
   * eskicha ko'rinaverardi (backend esa allaqachon 403 qaytarardi). Shuning uchun
   * saqlangan ma'lumotni serverdagi haqiqiy holat bilan yangilab turamiz.
   */
  const refreshUser = useCallback(async ({ force = false } = {}) => {
    if (!getToken() || !getUser()) return;

    const now = Date.now();
    if (!force && now - lastRefreshAt.current < REFRESH_INTERVAL_MS) return;
    lastRefreshAt.current = now;

    try {
      // `/users/me` tekis obyekt qaytaradi: foydalanuvchi maydonlari + `permissions`
      // + korxona va tarif ma'lumotlari (_controllers.js dagi getMe ga qarang).
      const { data: fresh } = await getMe();
      if (!fresh?.id) return;

      setUser((previous) => {
        // Kirish javobidagi qo'shimcha maydonlar yo'qolmasligi uchun almashtirmay,
        // ustiga yozamiz.
        const merged = { ...(previous || getUser()), ...fresh };
        localStorage.setItem("user", JSON.stringify(merged));
        return merged;
      });
    } catch {
      // Tarmoq xatosi foydalanuvchini tizimdan chiqarib yubormasin — saqlangan
      // ma'lumot bilan davom etadi. 401 holatini axios interceptori o'zi hal qiladi.
    }
  }, []);

  useEffect(() => {
    refreshUser({ force: true });

    // Boshqa oynada ruxsat o'zgartirilgan bo'lsa, shu oynaga qaytilganda yangilanadi.
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshUser();
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshUser]);

  const login = async (userData) => {
    setLoading(true);

    try {
      localStorage.setItem("user", JSON.stringify(userData));
      lastRefreshAt.current = Date.now();
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    lastRefreshAt.current = 0;
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        setLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
