import { Box, Button, Menu, MenuItem, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";
import { hasPermission } from "../../utils/permissions";

import DashboardIcon from "../../images/ui-icons/dashboard.svg";
import BoxIcon from "../../images/ui-icons/box.svg";
import BriefcaseIcon from "../../images/ui-icons/briefcase.svg";
import TrendUpIcon from "../../images/ui-icons/trend-up.svg";
import FinanceIcon from "../../images/ui-icons/finance.svg";

const mobileQuickActions = [
  {
    label: "Yangi zakaz",
    description: "Mijoz zakazini kiritish",
    path: "/orders",
    roles: ["super_admin", "admin"],
    permission: "orders.manage",
  },
  {
    label: "Yangi mijoz",
    description: "Mijozlar ro‘yxatiga o‘tish",
    path: "/clients",
    roles: ["super_admin", "admin"],
    permission: "users.manage",
  },
  {
    label: "Yangi savdo",
    description: "Mijoz savdosini kiritish",
    path: "/client-sales",
    roles: ["super_admin", "admin"],
    feature: "client_accounting",
    permission: "client_sales.manage",
  },
  {
    label: "Mahsulot qo‘shish",
    description: "Mahsulotlar katalogiga o‘tish",
    path: "/products",
    roles: ["super_admin", "admin"],
    permission: "products.manage",
  },
  {
    label: "Ishlab chiqarish",
    description: "Yangi ish yozuvini kiritish",
    path: "/worker-outputs",
    roles: ["super_admin", "admin"],
    permission: "production.manage",
  },
  {
    label: "Vazifalarim",
    description: "Jarayondagi vazifalarni ko‘rish",
    path: "/my-order-tasks",
    roles: ["worker"],
  },
  {
    label: "Xarajat kiritish",
    description: "Mayda va umumiy xarajatlar",
    path: "/expenses",
    roles: ["super_admin", "admin"],
    permission: "finance.manage",
  },
];

const MobileNavigation = () => {
  const { user } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const [quickActionsAnchor, setQuickActionsAnchor] = useState(null);

  const navigationItems = useMemo(() => {
    const inventoryPath = hasPermission(user, "inventory.view")
      ? "/inventory"
      : hasPermission(user, "products.view")
        ? "/products"
        : null;

    const salesPath =
      user?.role === "worker"
        ? hasPermission(user, "production.view")
          ? "/worker-outputs"
          : "/my-order-tasks"
        : hasPermission(user, "client_sales.view")
          ? "/client-sales"
          : hasPermission(user, "orders.view")
            ? "/orders"
            : null;

    const reportPath =
      user?.role === "worker"
        ? null
        : hasPermission(user, "finance.view")
          ? "/finance"
          : hasPermission(user, "production.view")
            ? "/worker-outputs"
            : null;

    const ordersPath =
      user?.role === "worker"
        ? "/my-order-tasks"
        : hasPermission(user, "orders.view") || hasPermission(user, "orders.manage")
          ? "/orders"
          : null;

    return [
      {
        label: "Bosh sahifa",
        path: "/",
        icon: DashboardIcon,
        exact: true,
      },
      {
        label: inventoryPath === "/products" ? "Mahsulot" : "Ombor",
        path: inventoryPath,
        icon: BoxIcon,
      },
      {
        label: user?.role === "worker" ? "Ishlar" : "Savdo",
        path: salesPath,
        icon: TrendUpIcon,
      },
      {
        label: "Hisobot",
        path: reportPath,
        icon: FinanceIcon,
      },
      {
        label: "Zakazlar",
        path: ordersPath,
        icon: BriefcaseIcon,
      },
    ].filter((item) => item.exact || item.path);
  }, [user]);

  const availableQuickActions = useMemo(() => {
    return mobileQuickActions.filter(
      (item) =>
        (!item.roles || item.roles.includes(user?.role)) &&
        (!item.feature || !user?.plan_code || user?.plan_features?.includes(item.feature)) &&
        hasPermission(user, item.permission),
    );
  }, [user]);

  const isActive = (item) => {
    if (!item.path) {
      return false;
    }

    if (item.exact) {
      return location.pathname === item.path;
    }

    if (item.path === "/inventory") {
      return (
        location.pathname.startsWith("/inventory") || location.pathname.startsWith("/products")
      );
    }

    return location.pathname.startsWith(item.path);
  };

  const handleNavigation = (item, event) => {
    event.currentTarget.blur();

    if (!item.path) {
      return;
    }

    navigate(item.path);
  };

  return (
    <>
      <Button
        className="aa-mobile-fab"
        disabled={!availableQuickActions.length}
        onClick={(event) => {
          const anchor = event.currentTarget;
          anchor.blur();
          setQuickActionsAnchor(anchor);
        }}
        aria-label="Tezkor amal"
        aria-haspopup="menu"
        aria-expanded={Boolean(quickActionsAnchor)}
      >
        <Box component="span" aria-hidden="true">
          +
        </Box>
      </Button>

      <Menu
        anchorEl={quickActionsAnchor}
        open={Boolean(quickActionsAnchor)}
        onClose={() => setQuickActionsAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{
          paper: {
            className: "aa-mobile-quick-menu",
            sx: {
              width: "min(340px, calc(100vw - 28px))",
              maxHeight: "min(520px, calc(100vh - 150px))",
              mb: 1.5,
              p: 1,
              overflowY: "auto",
              borderRadius: "20px !important",
              color: "var(--aa-text)",
              border: "1px solid var(--aa-border)",
              background: "var(--aa-surface-solid)",
              boxShadow: "var(--aa-shadow-lg)",
            },
          },
        }}
      >
        <Box sx={{ px: 1.25, pt: 0.75, pb: 1.25 }}>
          <Typography sx={{ color: "var(--aa-text)", fontSize: 14, fontWeight: 950 }}>
            Tezkor amallar
          </Typography>
          <Typography sx={{ mt: 0.35, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
            Kerakli amalni tanlang
          </Typography>
        </Box>

        {availableQuickActions.map((item, index) => (
          <MenuItem
            key={`${item.path}-${item.label}`}
            className="aa-mobile-quick-menu-item"
            onClick={(event) => {
              event.currentTarget.blur();
              setQuickActionsAnchor(null);
              requestAnimationFrame(() => navigate(item.path));
            }}
            sx={{
              minHeight: 58,
              px: 1.25,
              gap: 1.25,
              borderRadius: "14px",
              "& + &": { mt: 0.35 },
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color: "var(--aa-brand-700)",
                fontSize: 10,
                fontWeight: 950,
                borderRadius: "11px",
                backgroundColor: "rgba(153,27,27,.08)",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ color: "var(--aa-text)", fontSize: 12, fontWeight: 900 }}>
                {item.label}
              </Typography>
              <Typography noWrap sx={{ mt: 0.3, color: "var(--aa-text-tertiary)", fontSize: 9.5 }}>
                {item.description}
              </Typography>
            </Box>

            <Typography aria-hidden="true" sx={{ color: "#b91c1c", fontWeight: 900 }}>
              →
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      <Box
        component="nav"
        className="aa-mobile-bottom-nav"
        aria-label="Asosiy mobil menyu"
        sx={{ gridTemplateColumns: `repeat(${navigationItems.length}, minmax(0, 1fr))` }}
      >
        {navigationItems.map((item) => {
          const active = isActive(item);

          return (
            <Button
              key={item.label}
              type="button"
              onClick={(event) => handleNavigation(item, event)}
              className={`aa-mobile-bottom-item ${active ? "active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Box className="aa-mobile-item-icon">
                <Box component="img" src={item.icon} alt="" aria-hidden="true" />

                {active && <Box component="span" className="aa-mobile-active-dot" />}
              </Box>

              <Typography component="span">{item.label}</Typography>
            </Button>
          );
        })}
      </Box>
    </>
  );
};

export default MobileNavigation;
