import { Navigate, Outlet } from "react-router-dom";
import { getToken, isTokenExpired } from "../utils/auth";

const PublicRoute = () => {
  const token = getToken();

  if (token && !isTokenExpired(token)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
