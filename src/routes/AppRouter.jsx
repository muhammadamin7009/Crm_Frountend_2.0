import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../Pages/Login/Login";
import Register from "../Pages/Register/Register";
import Layout from "../Layouts/Layout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import Dashboard from "../Pages/Dashboard/Dashboard";
import Users from "../Pages/User/Users";
import User from "../Pages/User/User";
import Products from "../Pages/Product/Products";
import Product from "../Pages/Product/Product";
import WorkerOutputs from "../Pages/WorkerOutput/WorkerOutputs";
import WorkerPayments from "../Pages/WorkerPayment/WorkerPayments";
import ClientSales from "../Pages/ClientSale/ClientSales";
import MaterialPurchases from "../Pages/MaterialPurchase/MaterialPurchases";
import Employees from "../Pages/Employee/Employees";
import Finance from "../Pages/Finance/Finance";
import PlatformLogin from "../Pages/Platform/PlatformLogin";
import PlatformDashboard from "../Pages/Platform/PlatformDashboard";
import AuditLogs from "../Pages/AuditLog/AuditLogs";
import LandingPage from "../Pages/LandingPage/LandingPage";
import Permissions from "../Pages/Permission/Permissions";
import Inventory from "../Pages/Inventory/Inventory";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/platform/login" element={<PlatformLogin />} />
      <Route path="/platform" element={<PlatformDashboard />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route
            element={<ProtectedRoute allowedPermissions={["products.view"]} />}
          >
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<Product />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "worker"]}
                allowedPermissions={["users.view"]}
              />
            }
          >
            <Route path="/users" element={<Users />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "worker"]}
                allowedPermissions={["production.view"]}
              />
            }
          >
            <Route path="/worker-outputs" element={<WorkerOutputs />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedPermissions={["payroll.view"]}
              />
            }
          >
            <Route path="/worker-payments" element={<WorkerPayments />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedPermissions={["employees.view"]}
              />
            }
          >
            <Route path="/employees" element={<Employees />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedPermissions={["users.view"]}
              />
            }
          >
            <Route path="/users/:id" element={<User />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
            <Route path="/permissions" element={<Permissions />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedFeatures={["client_accounting"]}
                allowedPermissions={["client_sales.view"]}
              />
            }
          >
            <Route path="/client-sales" element={<ClientSales />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedFeatures={["supplier_accounting"]}
                allowedPermissions={["material_purchases.view"]}
              />
            }
          >
            <Route path="/material-purchases" element={<MaterialPurchases />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedPermissions={["inventory.view"]}
              />
            }
          >
            <Route path="/inventory" element={<Inventory />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedFeatures={["finance"]}
                allowedPermissions={["finance.view"]}
              />
            }
          >
            <Route path="/finance" element={<Finance />} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedFeatures={["audit_logs"]}
                allowedPermissions={["audit_logs.view"]}
              />
            }
          >
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
