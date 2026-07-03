import { createContext, useContext, useState } from "react";
import { clearSession, getUser } from "../utils/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser);

  const [loading, setLoading] = useState(false);

  const login = async (userData) => {
    setLoading(true);

    try {
      // bu yerga API request yoki boshqa loading paytidagi ish yoziladi
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
