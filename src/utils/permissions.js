export const hasPermission = (user, permission) => {
  if (!permission) return true;
  if (user?.role === "super_admin") return true;
  if (user?.role !== "admin") return true;
  if (user?.permissions?.includes("*")) return true;
  return user?.permissions?.includes(permission);
};

export const hasAnyPermission = (user, permissions = []) => {
  if (!permissions.length) return true;
  return permissions.some((permission) => hasPermission(user, permission));
};
