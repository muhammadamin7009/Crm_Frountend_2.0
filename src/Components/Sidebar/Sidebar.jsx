import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { NavLink, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../Context/AuthContext";
import SiteLogo from "../../images/zerr_02_logo.png";
import DashboardIcon from "../../images/ui-icons/dashboard.svg";
import UsersIcon from "../../images/ui-icons/users.svg";
import BriefcaseIcon from "../../images/ui-icons/briefcase.svg";
import BoxIcon from "../../images/ui-icons/box.svg";
import CheckIcon from "../../images/ui-icons/check.svg";
import WalletIcon from "../../images/ui-icons/wallet.svg";
import TrendUpIcon from "../../images/ui-icons/trend-up.svg";
import TrendDownIcon from "../../images/ui-icons/trend-down.svg";
import FinanceIcon from "../../images/ui-icons/finance.svg";
import HistoryIcon from "../../images/ui-icons/history.svg";
import { clearSession } from "../../utils/auth";
import { hasPermission } from "../../utils/permissions";
import { getCompanyLogoUrl } from "../../utils/company";
import { getWarehouses } from "../../api/inventory";

const menuGroups = [
  {
    label: "Asosiy",
    items: [{ icon: DashboardIcon, label: "Bosh sahifa", path: "/", end: true }],
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
        requiredPermission: "products.view",
      },
      {
        icon: HistoryIcon,
        label: "Ruxsatlar",
        path: "/permissions",
        allowedRoles: ["super_admin"],
      },
    ],
  },
  {
    label: "Ishlab chiqarish",
    items: [
      {
        icon: CheckIcon,
        label: "Ish hisoboti",
        path: "/worker-outputs",
        allowedRoles: ["super_admin", "admin", "worker"],
        requiredPermission: "production.view",
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
    label: "Hisob-kitob",
    items: [
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
        label: "Homashyo xaridi",
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

const roleNames = {
  super_admin: "Super admin",
  admin: "Admin",
  client: "Mijoz",
  customer: "Xaridor",
  worker: "Ishchi",
};

const getImageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;

  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const Sidebar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);

  const loadWarehouses = useCallback(async () => {
    if (
      !["super_admin", "admin", "worker"].includes(user?.role) ||
      !hasPermission(user, "inventory.view")
    ) {
      setWarehouses([]);
      return;
    }
    try {
      const { data } = await getWarehouses();
      setWarehouses((data.warehouses || []).filter((warehouse) => warehouse.is_active !== false));
    } catch {
      setWarehouses([]);
    }
  }, [user]);

  useEffect(() => {
    loadWarehouses();
    window.addEventListener("warehouses-updated", loadWarehouses);
    return () => window.removeEventListener("warehouses-updated", loadWarehouses);
  }, [loadWarehouses]);

  const resolvedMenuGroups = useMemo(() => {
    const canManageWarehouses =
      hasPermission(user, "inventory.warehouses") || hasPermission(user, "inventory.manage");
    const inventoryGroup = {
      label: "Omborlar",
      items: [
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
          requiredPermission: "inventory.view",
        },
      ].filter(Boolean),
    };

    const itemByPath = new Map(
      menuGroups.flatMap((group) => group.items).map((item) => [item.path, item]),
    );
    const group = (label, paths) => ({
      label,
      items: paths.map((path) => itemByPath.get(path)).filter(Boolean),
    });

    return [
      group("Asosiy", ["/"]),
      group("Savdo", ["/client-sales"]),
      group("Ishlab chiqarish", ["/products", "/worker-outputs"]),
      inventoryGroup,
      group("Xodimlar", ["/users", "/employees", "/worker-payments"]),
      group("Hisob-kitob", ["/material-purchases", "/expenses", "/finance"]),
      group("Tizim", ["/permissions", "/audit-logs"]),
    ];
  }, [user, warehouses]);

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  const isMainCompany = user?.company_slug === "zerrshoes" || !user?.company_slug;

  const companyName = user?.company_name || (isMainCompany ? "Al-amin CRM" : "Korxona CRM");
  const companyLogo = getCompanyLogoUrl(user?.company_logo_url);

  return (
    <aside className="hidden h-screen w-68 shrink-0 p-3 md:block">
      <Box className="flex h-full flex-col overflow-hidden rounded-xl bg-[#050817] text-white shadow-[0_18px_45px_rgba(15,23,42,0.22)]">
        <Box className="px-5 pb-5 pt-5">
          <Box className="flex items-center gap-3">
            <Box className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-lg">
              {companyLogo || isMainCompany ? (
                <img
                  width={34}
                  height={34}
                  className="h-8.5 w-8.5 object-contain"
                  src={companyLogo || SiteLogo}
                  alt={companyName}
                />
              ) : (
                <Typography fontWeight={900} className="text-slate-950">
                  {companyName[0]?.toUpperCase() || "K"}
                </Typography>
              )}
            </Box>

            <Box className="min-w-0">
              <Typography className="truncate text-base font-black leading-tight text-white">
                {companyName}
              </Typography>
              <Typography variant="body2" className="mt-1 text-slate-400">
                {user?.plan_name ? `${user.plan_name} reja` : "Korxona boshqaruvi"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          {resolvedMenuGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) =>
                (!item.allowedRoles || item.allowedRoles.includes(user?.role)) &&
                (!user?.plan_code ||
                  !item.requiredFeature ||
                  user.plan_features?.includes(item.requiredFeature)) &&
                hasPermission(user, item.requiredPermission),
            );

            if (!visibleItems.length) return null;

            return (
              <Box key={group.label} className="mb-5">
                <Typography
                  variant="caption"
                  className="mb-2 block px-2 font-black uppercase tracking-[0.08em] text-slate-500"
                >
                  {group.label}
                </Typography>

                <List disablePadding>
                  {visibleItems.map((item) => (
                    <ListItemButton
                      key={item.path}
                      component={NavLink}
                      to={item.path}
                      end={item.end}
                      className="mb-1.5"
                      sx={{
                        gap: 1.4,
                        px: 1.5,
                        py: 1.35,
                        minHeight: 52,
                        color: "#cbd5e1",
                        border: "1px solid transparent",
                        borderRadius: "8px",
                        transition:
                          "background-color .18s ease, color .18s ease, box-shadow .18s ease, transform .18s ease",
                        "& .menu-icon": {
                          display: "grid",
                          placeItems: "center",
                          width: 30,
                          height: 30,
                          flexShrink: 0,
                          borderRadius: "7px",
                          backgroundColor: "rgba(255,255,255,.06)",
                          transition: "background-color .18s ease",
                        },
                        "& .menu-icon img": {
                          width: 17,
                          height: 17,
                          filter:
                            "brightness(0) saturate(100%) invert(87%) sepia(15%) saturate(764%) hue-rotate(188deg) brightness(104%) contrast(96%)",
                        },
                        "& .MuiListItemText-root": {
                          minWidth: 0,
                        },
                        "& .MuiListItemText-primary": {
                          fontWeight: 800,
                          color: "inherit",
                          fontSize: 14,
                          lineHeight: "20px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,.07)",
                          color: "#fff",
                          transform: "translateX(2px)",
                        },
                        "&.active": {
                          background: "#a32024",
                          color: "#ffffff",
                          boxShadow: "0 12px 26px rgba(163, 32, 36, 0.30)",
                        },
                        "&.active .menu-icon": {
                          backgroundColor: "rgba(255,255,255,.18)",
                        },
                        "&.active .menu-icon img": {
                          filter: "brightness(0) invert(1)",
                        },
                      }}
                    >
                      <span className="menu-icon">
                        <img src={item.icon} alt="" />
                      </span>

                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            );
          })}
        </Box>

        <Box className="px-4 pb-4">
          <Box className="rounded-xl border border-white/10 bg-white/4 p-3">
            <Box className="mb-3 flex items-center gap-3">
              <Avatar
                src={getImageUrl(user?.user_image)}
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: "#a32024",
                  fontWeight: 900,
                }}
              >
                {user?.first_name?.[0]?.toUpperCase() || "U"}
              </Avatar>

              <Box className="min-w-0 flex-1">
                <Typography className="truncate text-sm font-black leading-tight text-white">
                  {fullName || user?.username || "Foydalanuvchi"}
                </Typography>
                <Typography variant="body2" className="mt-0.5 truncate text-slate-400">
                  {roleNames[user?.role] || user?.role || "Ruxsat turi"}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: "rgba(255,255,255,.09)", mb: 1.5 }} />

            <Button
              fullWidth
              variant="outlined"
              sx={{
                py: 1,
                fontWeight: 800,
                color: "#fecaca",
                borderColor: "rgba(248,113,113,.35)",
                backgroundColor: "rgba(248,113,113,.07)",
                textTransform: "none",
                borderRadius: "10px",
                "&:hover": {
                  borderColor: "rgba(248,113,113,.65)",
                  backgroundColor: "rgba(248,113,113,.13)",
                },
              }}
              onClick={handleLogout}
            >
              Chiqish
            </Button>
          </Box>
        </Box>
      </Box>
    </aside>
  );
};

export default Sidebar;
