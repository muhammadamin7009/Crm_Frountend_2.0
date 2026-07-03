import React from "react";
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

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/platform/login" element={<PlatformLogin />} />
      <Route path="/platform" element={<PlatformDashboard />} />
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<Product />} />
          <Route element={<ProtectedRoute allowedRoles={["super_admin", "admin", "worker"]} />}>
            <Route path="/worker-outputs" element={<WorkerOutputs />} />
            <Route path="/users" element={<Users />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["super_admin", "admin"]} />}>
            <Route path="/worker-payments" element={<WorkerPayments />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/users/:id" element={<User />} />
          </Route>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedFeatures={["client_accounting"]}
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
              />
            }
          >
            <Route path="/material-purchases" element={<MaterialPurchases />} />
          </Route>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["super_admin", "admin"]}
                allowedFeatures={["finance"]}
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
