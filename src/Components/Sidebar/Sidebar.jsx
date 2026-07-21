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
  super_admin: "Super administrator",
  admin: "Administrator",
  client: "Mijoz",
  customer: "Xaridor",
  worker: "Ishchi",
};

const getImageUrl = (path) => {
  if (!path) return undefined;

  if (path.startsWith("http")) {
    return path;
  }

  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const Sidebar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [warehouses, setWarehouses] = useState([]);

  const loadWarehouses = useCallback(async () => {
    const roleAllowed = ["super_admin", "admin", "worker"].includes(user?.role);

    const permissionAllowed = hasPermission(user, "inventory.view");

    if (!roleAllowed || !permissionAllowed) {
      setWarehouses([]);
      return;
    }

    try {
      const { data } = await getWarehouses();

      const activeWarehouses = (data.warehouses || []).filter(
        (warehouse) => warehouse.is_active !== false,
      );

      setWarehouses(activeWarehouses);
    } catch {
      setWarehouses([]);
    }
  }, [user]);

  useEffect(() => {
    loadWarehouses();

    window.addEventListener("warehouses-updated", loadWarehouses);

    return () => {
      window.removeEventListener("warehouses-updated", loadWarehouses);
    };
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

    navigate("/login", {
      replace: true,
    });
  };

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  const isMainCompany = user?.company_slug === "zerrshoes" || !user?.company_slug;

  const companyName = user?.company_name || (isMainCompany ? "Al-Amin CRM" : "Korxona CRM");

  const companyLogo = getCompanyLogoUrl(user?.company_logo_url);

  return (
    <aside className="hidden h-screen w-68 shrink-0 md:block">
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#ffffff",
          background:
            "radial-gradient(circle at 100% 0%, rgba(185,28,28,.23), transparent 28%), linear-gradient(180deg,#11151c 0%,#0d1117 45%,#090c11 100%)",
          borderRight: "1px solid rgba(255,255,255,.07)",

          "&::before": {
            content: '""',
            position: "absolute",
            width: 280,
            height: 280,
            top: -175,
            right: -165,
            borderRadius: "50%",
            border: "1px solid rgba(239,68,68,.16)",
            boxShadow: "0 0 0 48px rgba(239,68,68,.025), 0 0 0 96px rgba(239,68,68,.018)",
            pointerEvents: "none",
          },

          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            opacity: 0.055,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            maskImage: "linear-gradient(to bottom, black, transparent 45%)",
          },
        }}
      >
        {/* Kompaniya logosi */}

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            px: 2.5,
            pt: 2.5,
            pb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                borderRadius: "15px",
                backgroundColor: "#ffffff",
                border: "1px solid rgba(255,255,255,.16)",
                boxShadow: "0 12px 26px rgba(0,0,0,.3)",
              }}
            >
              {companyLogo || isMainCompany ? (
                <img
                  width={35}
                  height={35}
                  src={companyLogo || SiteLogo}
                  alt={companyName}
                  className="h-8.75 w-8.75 object-contain"
                />
              ) : (
                <Typography
                  sx={{
                    color: "#991b1b",
                    fontSize: 19,
                    fontWeight: 950,
                  }}
                >
                  {companyName?.charAt(0)?.toUpperCase() || "K"}
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                noWrap
                sx={{
                  color: "#ffffff",
                  fontSize: 16,
                  lineHeight: 1.15,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                }}
              >
                {companyName}
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.6,
                  color: "rgba(255,255,255,.43)",
                  fontSize: 11.5,
                  fontWeight: 600,
                }}
              >
                Korxona boshqaruv tizimi
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Menyular */}

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            minHeight: 0,
            flex: 1,
            overflowY: "auto",
            px: 1.5,
            pb: 1.5,

            "&::-webkit-scrollbar": {
              width: 4,
            },

            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },

            "&::-webkit-scrollbar-thumb": {
              borderRadius: 10,
              background: "rgba(255,255,255,.12)",
            },
          }}
        >
          {resolvedMenuGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) =>
                (!item.allowedRoles || item.allowedRoles.includes(user?.role)) &&
                (!user?.plan_code ||
                  !item.requiredFeature ||
                  user.plan_features?.includes(item.requiredFeature)) &&
                hasPermission(user, item.requiredPermission),
            );

            if (!visibleItems.length) {
              return null;
            }

            return (
              <Box
                key={group.label}
                sx={{
                  mb: 2.2,
                }}
              >
                <Typography
                  sx={{
                    display: "block",
                    px: 1.5,
                    mb: 0.8,
                    color: "rgba(255,255,255,.3)",
                    fontSize: 9.5,
                    lineHeight: 1.4,
                    fontWeight: 900,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
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
                      sx={{
                        position: "relative",
                        minHeight: 45,
                        mb: 0.55,
                        px: 1.2,
                        py: 0.9,
                        gap: 1.15,
                        overflow: "hidden",
                        color: "rgba(255,255,255,.6)",
                        border: "1px solid transparent",
                        borderRadius: "13px",
                        transition:
                          "transform .18s ease, color .18s ease, background-color .18s ease, box-shadow .18s ease",

                        "& .sidebar-icon": {
                          width: 29,
                          height: 29,
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: "9px",
                          background: "rgba(255,255,255,.035)",
                          transition: "background-color .18s ease, transform .18s ease",
                        },

                        "& .sidebar-icon img": {
                          width: 16,
                          height: 16,
                          opacity: 0.72,
                          filter: "brightness(0) invert(1)",
                          transition: "opacity .18s ease",
                        },

                        "& .MuiListItemText-root": {
                          minWidth: 0,
                          my: 0,
                        },

                        "& .MuiListItemText-primary": {
                          color: "inherit",
                          fontSize: 13.5,
                          lineHeight: "20px",
                          fontWeight: 720,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },

                        "& .sidebar-indicator": {
                          position: "absolute",
                          right: 12,
                          width: 5,
                          height: 5,
                          opacity: 0,
                          borderRadius: "50%",
                          background: "#ffffff",
                          boxShadow: "0 0 0 4px rgba(255,255,255,.08)",
                          transition: "opacity .18s ease",
                        },

                        "&:hover": {
                          color: "#ffffff",
                          transform: "translateX(2px)",
                          background: "rgba(255,255,255,.055)",
                        },

                        "&:hover .sidebar-icon": {
                          background: "rgba(255,255,255,.07)",
                        },

                        "&:hover .sidebar-icon img": {
                          opacity: 1,
                        },

                        "&.active": {
                          color: "#ffffff",
                          borderColor: "rgba(248,113,113,.22)",
                          background: "linear-gradient(135deg,#991b1b 0%,#c81e2a 100%)",
                          boxShadow:
                            "0 10px 24px rgba(127,29,29,.34), inset 0 1px 0 rgba(255,255,255,.15)",
                        },

                        "&.active .sidebar-icon": {
                          background: "rgba(255,255,255,.14)",
                          transform: "scale(1.03)",
                        },

                        "&.active .sidebar-icon img": {
                          opacity: 1,
                        },

                        "&.active .sidebar-indicator": {
                          opacity: 1,
                        },
                      }}
                    >
                      <span className="sidebar-icon">
                        <img src={item.icon} alt="" />
                      </span>

                      <ListItemText primary={item.label} />

                      <span className="sidebar-indicator" />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            );
          })}
        </Box>

        {/* Tarif va profil */}

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            px: 1.5,
            pb: 1.5,
          }}
        >
          <Box
            sx={{
              mb: 1.2,
              p: 1.7,
              borderRadius: "17px",
              border: "1px solid rgba(248,113,113,.12)",
              background: "linear-gradient(145deg,rgba(153,27,27,.18),rgba(255,255,255,.025))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.1,
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "11px",
                  color: "#fecaca",
                  fontSize: 17,
                  background: "rgba(220,38,38,.18)",
                  border: "1px solid rgba(248,113,113,.12)",
                }}
              >
                ◆
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    color: "#ffffff",
                    fontSize: 12.5,
                    fontWeight: 850,
                  }}
                >
                  {user?.plan_name ? `${user.plan_name} rejasi` : "Faol tarif"}
                </Typography>

                <Typography
                  noWrap
                  sx={{
                    mt: 0.3,
                    color: "rgba(255,255,255,.4)",
                    fontSize: 10.5,
                  }}
                >
                  Korxona imkoniyatlari
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              p: 1.3,
              borderRadius: "17px",
              border: "1px solid rgba(255,255,255,.075)",
              background: "rgba(255,255,255,.035)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.035)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
              }}
            >
              <Avatar
                src={getImageUrl(user?.user_image)}
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 900,
                  bgcolor: "#991b1b",
                  border: "2px solid rgba(255,255,255,.1)",
                  boxShadow: "0 8px 18px rgba(0,0,0,.24)",
                }}
              >
                {user?.first_name?.[0]?.toUpperCase() || "U"}
              </Avatar>

              <Box
                sx={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <Typography
                  noWrap
                  sx={{
                    color: "#ffffff",
                    fontSize: 13.5,
                    lineHeight: 1.2,
                    fontWeight: 850,
                  }}
                >
                  {fullName || user?.username || "Foydalanuvchi"}
                </Typography>

                <Typography
                  noWrap
                  sx={{
                    mt: 0.45,
                    color: "rgba(255,255,255,.4)",
                    fontSize: 10.8,
                  }}
                >
                  {roleNames[user?.role] || user?.role || "Ruxsat turi"}
                </Typography>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="text"
              onClick={handleLogout}
              sx={{
                mt: 1.1,
                minHeight: 35,
                py: 0.5,
                color: "#fca5a5 !important",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "none",
                borderRadius: "10px !important",
                backgroundColor: "rgba(220,38,38,.08)",

                "&:hover": {
                  color: "#ffffff !important",
                  backgroundColor: "rgba(220,38,38,.18) !important",
                },
              }}
            >
              Tizimdan chiqish
            </Button>
          </Box>
        </Box>
      </Box>
    </aside>
  );
};

export default Sidebar;
