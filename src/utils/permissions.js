export const hasPermission = (user, permission) => {
  if (!permission) return true;
  if (user?.role === "super_admin") return true;
  if (user?.role === "worker" && !permission.startsWith("inventory.")) return true;
  if (!["admin", "worker"].includes(user?.role)) return true;
  if (user?.permissions?.includes("*")) return true;
  if (user?.permissions?.includes(permission)) return true;
  return permission.startsWith("inventory.") && user?.permissions?.includes("inventory.manage");
};

export const hasAnyPermission = (user, permissions = []) => {
  if (!permissions.length) return true;
  return permissions.some((permission) => hasPermission(user, permission));
};
