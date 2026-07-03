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
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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

const menuGroups = [
  {
    label: "Asosiy",
    items: [{ icon: DashboardIcon, label: "Dashboard", path: "/", end: true }],
  },
  {
    label: "Boshqaruv",
    items: [
      {
        icon: UsersIcon,
        label: "Foydalanuvchilar",
        path: "/users",
        allowedRoles: ["super_admin", "admin", "worker"],
      },
      {
        icon: BriefcaseIcon,
        label: "Lavozimlar",
        path: "/employees",
        allowedRoles: ["super_admin", "admin"],
      },
      { icon: BoxIcon, label: "Mahsulotlar", path: "/products" },
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
      },
      {
        icon: WalletIcon,
        label: "Oyliklar",
        path: "/worker-payments",
        allowedRoles: ["super_admin", "admin"],
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
      },
      {
        icon: TrendDownIcon,
        label: "Homashyo xaridi",
        path: "/material-purchases",
        allowedRoles: ["super_admin", "admin"],
        requiredFeature: "supplier_accounting",
      },
      {
        icon: FinanceIcon,
        label: "Moliya",
        path: "/finance",
        allowedRoles: ["super_admin", "admin"],
        requiredFeature: "finance",
      },
      {
        icon: HistoryIcon,
        label: "Amallar tarixi",
        path: "/audit-logs",
        allowedRoles: ["super_admin", "admin"],
        requiredFeature: "audit_logs",
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
  const location = useLocation();
  const { user } = useAuth();
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
  const isZerrShoes = user?.company_slug === "zerrshoes" || !user?.company_slug;
  const companyName = user?.company_name || (isZerrShoes ? "ZERR CRM" : "Korxona CRM");

  return (
    <aside className="hidden h-screen w-[272px] shrink-0 p-3 md:block">
      <Box className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-950 text-white shadow-[0_18px_48px_rgba(15,23,42,0.22)]">
        <Box className="px-5 pb-5 pt-5">
          <Box className="flex items-center gap-3">
            <Box className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-lg">
              {isZerrShoes ? (
                <img width={34} src={SiteLogo} alt={companyName} />
              ) : (
                <Typography fontWeight={900} className="text-slate-950">
                  {companyName[0]?.toUpperCase() || "K"}
                </Typography>
              )}
            </Box>

            <Box className="min-w-0">
              <Typography fontWeight={900} className="truncate text-lg leading-tight text-white">
                {companyName}
              </Typography>
              <Typography variant="body2" className="text-slate-400">
                {user?.plan_name ? `${user.plan_name} reja` : "Korxona boshqaruvi"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) =>
                (!item.allowedRoles || item.allowedRoles.includes(user?.role)) &&
                (!user?.plan_code ||
                  !item.requiredFeature ||
                  user.plan_features?.includes(item.requiredFeature)),
            );

            if (!visibleItems.length) return null;

            const isCollapsible = group.label !== "Asosiy";
            const hasActiveItem = visibleItems.some((item) =>
              item.end ? location.pathname === item.path : location.pathname.startsWith(item.path),
            );
            const manuallyExpanded = expandedGroups[group.label];
            const isOpen =
              !isCollapsible ||
              (manuallyExpanded !== undefined
                ? manuallyExpanded
                : hasActiveItem || hoveredGroup === group.label);

            return (
              <Box key={group.label} className="mb-3" onMouseEnter={() => isCollapsible && setHoveredGroup(group.label)} onMouseLeave={() => isCollapsible && setHoveredGroup(null)}>
                <Box
                  component={isCollapsible ? "button" : "div"}
                  type={isCollapsible ? "button" : undefined}
                  onClick={() => {
                    if (!isCollapsible) return;
                    setExpandedGroups((previous) => ({
                      ...previous,
                      [group.label]: previous[group.label] === true ? false : true,
                    }));
                  }}
                  className="mb-1 flex min-h-8 w-full items-center justify-between rounded-md px-2 text-left"
                  sx={{
                    cursor: isCollapsible ? "pointer" : "default",
                    transition: "background-color 180ms ease, color 180ms ease",
                    "&:hover": isCollapsible ? { backgroundColor: "rgba(255,255,255,.05)" } : undefined,
                  }}
                >
                  <Typography variant="caption" className="font-black uppercase text-slate-500">{group.label}</Typography>
                  {isCollapsible && <Typography aria-hidden="true" className="text-slate-600" sx={{ fontSize: 16 }}>{isOpen ? "−" : "+"}</Typography>}
                </Box>
                <List
                  disablePadding
                  aria-hidden={!isOpen}
                  sx={{
                    maxHeight: isOpen ? `${visibleItems.length * 58}px` : 0,
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? "translateY(0)" : "translateY(-6px)",
                    overflow: "hidden",
                    pointerEvents: isOpen ? "auto" : "none",
                    transition:
                      "max-height 260ms ease, opacity 180ms ease, transform 220ms ease",
                  }}
                >
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
                        py: 1.25,
                        color: "#cbd5e1",
                        border: "1px solid transparent",
                        borderRadius: "8px",
                        transition: "all .18s ease",
                        "& .menu-icon": {
                          display: "grid",
                          placeItems: "center",
                          width: 30,
                          height: 30,
                          borderRadius: "6px",
                          backgroundColor: "rgba(255,255,255,.06)",
                        },
                        "& .menu-icon img": {
                          width: 17,
                          height: 17,
                          filter:
                            "brightness(0) saturate(100%) invert(87%) sepia(15%) saturate(764%) hue-rotate(188deg) brightness(104%) contrast(96%)",
                        },
                        "& .MuiListItemText-primary": {
                          fontWeight: 800,
                          color: "inherit",
                          fontSize: 14,
                        },
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,.08)",
                          color: "#fff",
                        },
                        "&.active": {
                          background: "#8f1d20",
                          color: "#FFFFFF",
                          boxShadow: "0 10px 24px rgba(143, 29, 32, 0.28)",
                        },
                        "&.active .menu-icon": {
                          backgroundColor: "rgba(255,255,255,.18)",
                        },
                        "&.active .menu-icon img": {
                          filter: "brightness(0) invert(1)",
                        },
                      }}
                    >
                      <span className="menu-icon"><img src={item.icon} alt="" /></span>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            );
          })}
        </Box>

        <Box className="px-4 pb-4">
          <Box className="mb-3 rounded-lg border border-white/10 bg-white/[0.06] p-3">
            <Box className="mb-3 flex items-center gap-3">
              <Avatar
                src={getImageUrl(user?.user_image)}
                sx={{ width: 42, height: 42, bgcolor: "#8f1d20" }}
              >
                {user?.first_name?.[0]?.toUpperCase() || "U"}
              </Avatar>

              <Box className="min-w-0 flex-1">
                <Typography className="truncate text-sm font-black text-white">
                  {fullName || user?.username || "Foydalanuvchi"}
                </Typography>
                <Typography variant="body2" className="truncate text-slate-400">
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
                color: "#fca5a5",
                borderColor: "rgba(248,113,113,.35)",
                backgroundColor: "rgba(248,113,113,.08)",
                "&:hover": {
                  borderColor: "rgba(248,113,113,.65)",
                  backgroundColor: "rgba(248,113,113,.14)",
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
