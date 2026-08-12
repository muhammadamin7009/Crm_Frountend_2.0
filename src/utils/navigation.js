// Ilovaning yagona menyu ta'rifi. Sidebar ham, bosh sahifadagi "sizga ochiq bo'limlar"
// ro'yxati ham shu yerdan oladi — aks holda ikkalasi bir-biridan uzilib qoladi va
// yon menyuda bo'lim ko'rinib turgani holda bosh sahifa "ruxsatingiz yo'q" deyishi mumkin.

import DashboardIcon from "../images/ui-icons/dashboard.svg";
import UsersIcon from "../images/ui-icons/users.svg";
import BriefcaseIcon from "../images/ui-icons/briefcase.svg";
import BoxIcon from "../images/ui-icons/box.svg";
import CheckIcon from "../images/ui-icons/check.svg";
import WalletIcon from "../images/ui-icons/wallet.svg";
import TrendUpIcon from "../images/ui-icons/trend-up.svg";
import TrendDownIcon from "../images/ui-icons/trend-down.svg";
import FinanceIcon from "../images/ui-icons/finance.svg";
import HistoryIcon from "../images/ui-icons/history.svg";

import { hasAnyPermission, hasPermission } from "./permissions";

export const menuGroups = [
  {
    label: "Asosiy",
    items: [
      {
        icon: DashboardIcon,
        label: "Bosh sahifa",
        path: "/",
        end: true,
      },
    ],
  },
  {
    label: "Boshqaruv",
    items: [
      {
        icon: UsersIcon,
        label: "Foydalanuvchilar",
        path: "/users",
        allowedRoles: ["super_admin", "admin", "worker"],
        requiredPermission: "users.view",
      },
      {
        icon: UsersIcon,
        label: "Mijozlar",
        path: "/clients",
        allowedRoles: ["super_admin", "admin"],
        requiredPermission: "clients.view",
      },
      {
        icon: BriefcaseIcon,
        label: "Lavozimlar",
        path: "/employees",
        allowedRoles: ["super_admin", "admin"],
        requiredPermission: "employees.view",
      },
      {
        icon: BoxIcon,
        label: "Mahsulotlar",
        path: "/products",
        allowedRoles: ["super_admin", "admin", "worker"],
        requiredPermission: "products.view",
      },
      {
        icon: HistoryIcon,
        label: "Ruxsatlar",
        path: "/permissions",
        allowedRoles: ["super_admin", "admin"],
        requiredPermission: "permissions.manage",
      },
    ],
  },
  {
    label: "Ishlab chiqarish",
    items: [
      {
        icon: CheckIcon,
        label: "Zakaz ishlarim",
        path: "/my-order-tasks",
        allowedRoles: ["worker"],
      },
      {
        icon: CheckIcon,
        label: "Ish hisoboti",
        path: "/worker-outputs",
        allowedRoles: ["super_admin", "admin", "worker"],
        requiredPermission: "production.view",
      },
      {
        icon: BoxIcon,
        label: "Partiyalar",
        path: "/production-batches",
        allowedRoles: ["super_admin", "admin", "worker"],
        // Omborchi ham ko'radi: yopiq karobka ichida nima borligini u tekshiradi.
        requiredPermission: ["production.view", "inventory.view"],
      },
      {
        icon: WalletIcon,
        label: "Oyliklar",
        path: "/worker-payments",
        allowedRoles: ["super_admin", "admin"],
        requiredPermission: "payroll.view",
      },
    ],
  },
  {
    label: "Omborlar",
    items: [
      // Sidebar bu bo'limni har bir ombor uchun alohida bandga yoyadi, lekin umumiy
      // ro'yxatda bitta kirish nuqtasi turishi kerak — aks holda bosh sahifa ombor
      // ruxsati bor foydalanuvchiga "bo'lim yo'q" deb ko'rsatadi.
      {
        icon: BoxIcon,
        label: "Ombor",
        path: "/inventory",
        allowedRoles: ["super_admin", "admin", "worker"],
        requiredPermission: "inventory.view",
      },
      {
        icon: HistoryIcon,
        label: "Inventarizatsiya",
        path: "/inventory/counts",
        allowedRoles: ["super_admin", "admin", "worker"],
        // `inventory.view` emas: u faqat qoldiq va harakatlar tarixini ochadi.
        // O'tkazilgan inventarizatsiyalar `inventory.count` ga tegishli — AppRouter
        // va backend `/inventory/counts` marshrutlari ham shuni talab qiladi.
        requiredPermission: "inventory.count",
      },
    ],
  },
  {
    label: "Hisob-kitob",
    items: [
      {
        icon: TrendUpIcon,
        label: "Zakazlar",
        path: "/orders",
        allowedRoles: ["super_admin", "admin"],
        requiredPermission: "orders.view",
      },
      {
        icon: TrendUpIcon,
        label: "Mijoz savdo",
        path: "/client-sales",
        allowedRoles: ["super_admin", "admin"],
        requiredFeature: "client_accounting",
        requiredPermission: "client_sales.view",
      },
      {
        icon: TrendDownIcon,
        label: "Xomashyo xaridi",
        path: "/material-purchases",
        allowedRoles: ["super_admin", "admin"],
        requiredFeature: "supplier_accounting",
        requiredPermission: "material_purchases.view",
      },
      {
        icon: FinanceIcon,
        label: "Xarajatlar",
        path: "/expenses",
        allowedRoles: ["super_admin", "admin"],
        requiredPermission: "finance.view",
      },
      {
        icon: FinanceIcon,
        label: "Moliya",
        path: "/finance",
        allowedRoles: ["super_admin", "admin"],
        requiredFeature: "finance",
        requiredPermission: "finance.view",
      },
      {
        icon: HistoryIcon,
        label: "Amallar tarixi",
        path: "/audit-logs",
        allowedRoles: ["super_admin", "admin"],
        requiredFeature: "audit_logs",
        requiredPermission: "audit_logs.view",
      },
    ],
  },
];

/**
 * "Omborlar" guruhi dinamik — bandlar serverdan kelgan ombor ro'yxatidan yasaladi.
 * Sidebar ham, mobil menyu ham shu funksiyadan oladi: ilgari ikkalasi o'z nusxasini
 * saqlagani uchun ruxsat qoidalari bir-biridan uzilib qolgandi.
 */
export const buildInventoryMenuItems = (user, warehouses = []) => {
  const canManageWarehouses =
    hasPermission(user, "inventory.warehouses") || hasPermission(user, "inventory.manage");

  return [
    canManageWarehouses && {
      icon: BoxIcon,
      label: "Omborlar boshqaruvi",
      path: "/inventory/warehouses",
      end: true,
      allowedRoles: ["super_admin", "admin", "worker"],
      requiredPermission: "inventory.warehouses",
    },

    ...warehouses.map((warehouse) => ({
      icon: BoxIcon,
      label: warehouse.name,
      path: `/inventory/warehouses/${warehouse.id}`,
      end: true,
      allowedRoles: ["super_admin", "admin", "worker"],
      requiredPermission: "inventory.view",
    })),

    {
      icon: HistoryIcon,
      label: "Inventarizatsiya",
      path: "/inventory/counts",
      allowedRoles: ["super_admin", "admin", "worker"],
      requiredPermission: "inventory.count",
    },
  ].filter(Boolean);
};

/** Bitta menyu bandi shu foydalanuvchiga ochiqmi. */
export const isMenuItemVisible = (user, item) => {
  if (item.allowedRoles && !item.allowedRoles.includes(user?.role)) return false;
  if (user?.plan_code && item.requiredFeature) {
    if (!user.plan_features?.includes(item.requiredFeature)) return false;
  }

  // `requiredPermission` bitta kalit ham, ro'yxat ham bo'lishi mumkin. Ayrim
  // bo'limlar bir nechta ruxsatning istalgan biri bilan ochiladi: partiyani
  // ishlab chiqarish ruxsati bor ham, ombor ruxsati bor ham ko'radi.
  return hasAnyPermission(user, [item.requiredPermission].flat().filter(Boolean));
};

/** Faqat ochiq bandlari qolgan guruhlar. Bo'sh guruhlar tashlab yuboriladi. */
export const getVisibleMenuGroups = (user, groups = menuGroups) =>
  groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isMenuItemVisible(user, item)),
    }))
    .filter((group) => group.items.length > 0);

/**
 * Bosh sahifadan tashqari, foydalanuvchiga haqiqatan ochiq bo'lgan bo'limlar.
 * Bosh sahifa hammaga ochiq, shuning uchun u "bo'lim bor" degani emas.
 */
export const getAccessibleSections = (user, groups = menuGroups) =>
  getVisibleMenuGroups(user, groups)
    .flatMap((group) => group.items)
    .filter((item) => item.path !== "/");

// --------------------------------------------------------------------------
// Tezkor amallar
// --------------------------------------------------------------------------

// `permission` — amalni bajarish uchun kerakli ruxsat (masalan yozuv qo'shish).
// `path` — qaysi sahifaga olib boradi. Sahifaning o'z ruxsati menyu ta'rifidan olinadi.
export const quickActions = [
  {
    label: "Yangi zakaz",
    description: "Mijoz zakazini kiritish",
    path: "/orders",
    permission: "orders.manage",
  },
  {
    label: "Yangi mijoz",
    description: "Mijozlar ro‘yxatiga o‘tish",
    path: "/clients",
    permission: "clients.manage",
  },
  {
    label: "Yangi savdo",
    description: "Mijoz savdosini kiritish",
    path: "/client-sales",
    permission: "client_sales.manage",
  },
  {
    label: "Mahsulot qo‘shish",
    description: "Mahsulotlar katalogiga o‘tish",
    path: "/products",
    permission: "products.manage",
  },
  {
    label: "Ishlab chiqarish",
    description: "Yangi ish yozuvini kiritish",
    path: "/worker-outputs",
    permission: "production.manage",
  },
  {
    label: "Vazifalarim",
    description: "Jarayondagi vazifalarni ko‘rish",
    path: "/my-order-tasks",
  },
  {
    label: "Xarajat kiritish",
    description: "Mayda va umumiy xarajatlar",
    path: "/expenses",
    permission: "finance.manage",
  },
  {
    label: "Xomashyo xaridi",
    description: "Yangi xaridni kiritish",
    path: "/material-purchases",
    permission: "material_purchases.manage",
  },
];

const menuItemByPath = new Map(
  menuGroups.flatMap((group) => group.items).map((item) => [item.path, item]),
);

/**
 * Tezkor amal ko'rinishi uchun IKKI shart ham bajarilishi kerak:
 *   1) amalning o'z ruxsati bor,
 *   2) u olib boradigan sahifa ham shu foydalanuvchiga ochiq.
 *
 * Ikkinchi shartsiz foydalanuvchi tugmani ko'rib, bosgach ProtectedRoute uni bosh
 * sahifaga qaytarib yuboradi — aynan shu xato bo'lgan: "Yangi mijoz" `users.manage`
 * bilan ko'rinardi, lekin `/clients` sahifasi `clients.view` talab qiladi.
 */
export const getAvailableQuickActions = (user, actions = quickActions) =>
  actions.filter((action) => {
    if (!hasPermission(user, action.permission)) return false;

    const destination = menuItemByPath.get(action.path);
    // Menyuda yo'q sahifa (masalan /my-order-tasks) — faqat amal ruxsati bo'yicha.
    if (!destination) return true;

    return isMenuItemVisible(user, destination);
  });
