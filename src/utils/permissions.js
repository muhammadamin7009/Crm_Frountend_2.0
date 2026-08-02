const WORKER_DEFAULT_VIEW_PERMISSIONS = new Set([
  "dashboard.view",
  "payroll.view",
  "products.view",
  "production.view",
  "users.view",
]);

export const hasPermission = (user, permission) => {
  if (!permission) return true;
  if (user?.role === "super_admin") return true;
  if (user?.role === "worker" && WORKER_DEFAULT_VIEW_PERMISSIONS.has(permission)) return true;
  if (!["admin", "worker"].includes(user?.role)) return true;
  if (user?.permissions?.includes("*")) return true;
  if (user?.permissions?.includes(permission)) return true;
  return permission.startsWith("inventory.") && user?.permissions?.includes("inventory.manage");
};

export const hasAnyPermission = (user, permissions = []) => {
  if (!permissions.length) return true;
  return permissions.some((permission) => hasPermission(user, permission));
};
