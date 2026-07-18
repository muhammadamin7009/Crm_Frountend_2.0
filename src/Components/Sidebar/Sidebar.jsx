import { Avatar, Box, Button, List, ListItemButton, ListItemText, Typography } from "@mui/material";
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
        icon: UsersIcon,
        label: "Mijozlar",
        path: "/clients",
        allowedRoles: ["super_admin", "admin"],
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
      group("Savdo", ["/clients", "/client-sales"]),
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
    <aside className="hidden h-screen w-[252px] shrink-0 border-r border-[var(--aa-border)] bg-white/90 md:block">
      <Box className="flex h-full flex-col overflow-hidden bg-white/82 backdrop-blur-2xl">
        <Box className="px-5 pb-4 pt-5">
          <Box className="flex items-center gap-3">
            <Box className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[var(--aa-border)] bg-white shadow-[var(--aa-shadow-xs)]">
              {companyLogo || isMainCompany ? (
                <img
                  width={34}
                  height={34}
                  className="h-8 w-8 object-contain"
                  src={companyLogo || SiteLogo}
                  alt={companyName}
                />
              ) : (
                <Typography fontWeight={900} className="text-[var(--aa-brand-800)]">
                  {companyName[0]?.toUpperCase() || "K"}
                </Typography>
              )}
            </Box>

            <Box className="min-w-0">
              <Typography className="truncate text-[15px] font-black leading-tight text-[var(--aa-text)]">
                {companyName}
              </Typography>
              <Typography
                variant="body2"
                className="mt-1 text-xs font-semibold text-[var(--aa-text-tertiary)]"
              >
                {user?.plan_name ? `${user.plan_name} reja` : "Korxona boshqaruvi"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
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
              <Box key={group.label} className="mb-4">
                <Typography
                  variant="caption"
                  className="mb-1.5 block px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--aa-text-tertiary)]"
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
                      className="mb-1"
                      sx={{
                        gap: 1.25,
                        px: 1.4,
                        py: 1.05,
                        minHeight: 44,
                        color: "var(--aa-text-secondary)",
                        border: "1px solid transparent",
                        borderRadius: "12px",
                        transition:
                          "background-color .18s ease, color .18s ease, box-shadow .18s ease, transform .18s ease",
                        "& .menu-icon": {
                          display: "grid",
                          placeItems: "center",
                          width: 28,
                          height: 28,
                          flexShrink: 0,
                          borderRadius: "9px",
                          backgroundColor: "transparent",
                          transition: "background-color .18s ease",
                        },
                        "& .menu-icon img": {
                          width: 16,
                          height: 16,
                          filter:
                            "brightness(0) saturate(100%) invert(38%) sepia(7%) saturate(694%) hue-rotate(202deg) brightness(92%) contrast(88%)",
                        },
                        "& .MuiListItemText-root": {
                          minWidth: 0,
                        },
                        "& .MuiListItemText-primary": {
                          fontWeight: 750,
                          color: "inherit",
                          fontSize: 13.5,
                          lineHeight: "20px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                        "&:hover": {
                          backgroundColor: "var(--aa-surface-hover)",
                          color: "var(--aa-text)",
                          transform: "translateX(2px)",
                        },
                        "&.active": {
                          background: "var(--aa-brand-50)",
                          color: "var(--aa-brand-800)",
                          borderColor: "rgba(143,29,32,.10)",
                          boxShadow: "inset 3px 0 0 var(--aa-brand-800)",
                        },
                        "&.active .menu-icon": {
                          backgroundColor: "var(--aa-brand-100)",
                        },
                        "&.active .menu-icon img": {
                          filter:
                            "brightness(0) saturate(100%) invert(15%) sepia(64%) saturate(2255%) hue-rotate(340deg) brightness(86%) contrast(92%)",
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

        <Box className="px-3 pb-3">
          <Box className="rounded-[16px] border border-[var(--aa-border)] bg-white p-3 shadow-[var(--aa-shadow-xs)]">
            <Box className="flex items-center gap-3">
              <Avatar
                src={getImageUrl(user?.user_image)}
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: "var(--aa-brand-800)",
                  fontWeight: 900,
                }}
              >
                {user?.first_name?.[0]?.toUpperCase() || "U"}
              </Avatar>

              <Box className="min-w-0 flex-1">
                <Typography className="truncate text-sm font-black leading-tight text-[var(--aa-text)]">
                  {fullName || user?.username || "Foydalanuvchi"}
                </Typography>
                <Typography
                  variant="body2"
                  className="mt-0.5 truncate text-xs text-[var(--aa-text-tertiary)]"
                >
                  {roleNames[user?.role] || user?.role || "Ruxsat turi"}
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="text"
              sx={{
                mt: 1,
                minHeight: 34,
                py: 0.5,
                fontWeight: 800,
                color: "var(--aa-danger) !important",
                backgroundColor: "rgba(217,48,37,.05)",
                textTransform: "none",
                borderRadius: "10px !important",
                "&:hover": {
                  backgroundColor: "rgba(217,48,37,.09) !important",
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
