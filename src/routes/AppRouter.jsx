import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "../Layouts/Layout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

const Login = lazy(() => import("../Pages/Login/Login"));
const Register = lazy(() => import("../Pages/Register/Register"));
const Dashboard = lazy(() => import("../Pages/Dashboard/Dashboard"));
const Users = lazy(() => import("../Pages/User/Users"));
const User = lazy(() => import("../Pages/User/User"));
const Products = lazy(() => import("../Pages/Product/Products"));
const Product = lazy(() => import("../Pages/Product/Product"));
const WorkerOutputs = lazy(() => import("../Pages/WorkerOutput/WorkerOutputs"));
const WorkerPayments = lazy(() => import("../Pages/WorkerPayment/WorkerPayments"));
const ClientSales = lazy(() => import("../Pages/ClientSale/ClientSales"));
const MaterialPurchases = lazy(() => import("../Pages/MaterialPurchase/MaterialPurchases"));
const Employees = lazy(() => import("../Pages/Employee/Employees"));
const Finance = lazy(() => import("../Pages/Finance/Finance"));
const PlatformLogin = lazy(() => import("../Pages/Platform/PlatformLogin"));
const PlatformDashboard = lazy(() => import("../Pages/Platform/PlatformDashboard"));
const AuditLogs = lazy(() => import("../Pages/AuditLog/AuditLogs"));
const LandingPage = lazy(() => import("../Pages/LandingPage/LandingPage"));
const Permissions = lazy(() => import("../Pages/Permission/Permissions"));
const Inventory = lazy(() => import("../Pages/Inventory/Inventory"));
const Expenses = lazy(() => import("../Pages/Expense/Expenses"));
const Clients = lazy(() => import("../Pages/Client/Clients"));

const page = (Component, props = {}) => (
  <Suspense fallback={null}>
    <Component {...props} />
  </Suspense>
);

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/landing" element={page(LandingPage)} />
      <Route path="/platform/login" element={page(PlatformLogin)} />
      <Route path="/platform" element={page(PlatformDashboard)} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={page(Login)} />
        <Route path="/register" element={page(Register)} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={page(Dashboard)} />
          <Route element={<ProtectedRoute allowedPermissions={["products.view"]} />}>
            <Route path="/products" element={page(Products)} />
            <Route path="/products/:id" element={page(Product)} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "worker"]}
                allowedPermissions={["users.view"]}
              />
            }
          >
            <Route path="/users" element={page(Users)} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedPermissions={["users.view"]}
              />
            }
          >
            <Route path="/clients" element={page(Clients)} />
            <Route path="/clients/:id" element={page(User, { backTo: "/clients" })} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "worker"]}
                allowedPermissions={["production.view"]}
              />
            }
          >
            <Route path="/worker-outputs" element={page(WorkerOutputs)} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedPermissions={["payroll.view"]}
              />
            }
          >
            <Route path="/worker-payments" element={page(WorkerPayments)} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedPermissions={["employees.view"]}
              />
            }
          >
            <Route path="/employees" element={page(Employees)} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedPermissions={["users.view"]}
              />
            }
          >
            <Route path="/users/:id" element={page(User)} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
            <Route path="/permissions" element={page(Permissions)} />
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
            <Route path="/client-sales" element={page(ClientSales)} />
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
            <Route path="/material-purchases" element={page(MaterialPurchases)} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "worker"]}
                allowedPermissions={["inventory.view"]}
              />
            }
          >
            <Route path="/inventory" element={page(Inventory)} />
            <Route path="/inventory/warehouses/:warehouseId" element={page(Inventory)} />
            <Route path="/inventory/counts" element={page(Inventory)} />
          </Route>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin", "worker"]}
                allowedPermissions={["inventory.warehouses", "inventory.manage"]}
              />
            }
          >
            <Route path="/inventory/warehouses" element={page(Inventory)} />
          </Route>

          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedPermissions={["finance.view"]}
              />
            }
          >
            <Route path="/expenses" element={page(Expenses)} />
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
            <Route path="/finance" element={page(Finance)} />
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
            <Route path="/audit-logs" element={page(AuditLogs)} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
