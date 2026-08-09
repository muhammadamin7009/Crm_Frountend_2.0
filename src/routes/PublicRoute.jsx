import { Navigate, Outlet } from "react-router-dom";
import PublicThemeToggle from "../Components/UI/PublicThemeToggle";
import { getToken, isTokenExpired } from "../utils/auth";

const PublicRoute = () => {
  const token = getToken();

  if (token && !isTokenExpired(token)) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <PublicThemeToggle />
      <Outlet />
    </>
  );
};

export default PublicRoute;
