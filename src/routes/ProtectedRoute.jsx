import { Navigate, Outlet } from "react-router-dom";
import { getToken, isTokenExpired, clearSession } from "../utils/auth";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ allowedRoles, allowedFeatures }) => {
  const token = getToken();

  if (!token || isTokenExpired(token)) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  const user = getUser();
  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  if (
    user?.plan_code &&
    allowedFeatures?.length &&
    !allowedFeatures.every((feature) => user.plan_features?.includes(feature))
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
