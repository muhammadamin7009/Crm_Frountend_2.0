// Bu fayl backend'dagi src/shared/auth/has-permission.js bilan bir xil mantiqda ishlashi shart.
// Frontend faqat interfeysni yashiradi — haqiqiy himoya backendda. Ikkalasi bir xil bo'lmasa,
// foydalanuvchi ochiq ko'ringan tugmani bosib 403 oladi (yoki teskarisi — bo'sh karta ko'radi).

// Ichki ruxsat tizimi faqat shu rollar uchun ishlaydi.
const PERMISSION_ROLES = ["admin", "worker"];

export const hasPermission = (user, permission) => {
  if (!permission) return true;

  const role = user?.role;
  if (role === "super_admin") return true;

  // Fail-closed: notanish rol (client, customer) hech qanday bo'limni ko'rmaydi.
  if (!PERMISSION_ROLES.includes(role)) return false;

  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;

  return permission.startsWith("inventory.") && permissions.includes("inventory.manage");
};

export const hasAnyPermission = (user, permissions = []) => {
  if (!permissions.length) return true;
  return permissions.some((permission) => hasPermission(user, permission));
};
