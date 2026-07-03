import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession, getToken, getUser, isTokenExpired } from "../utils/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(getUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token || isTokenExpired(token)) {
      clearSession();
      setUser(null);
      navigate("/login", { replace: true });
    }

    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
