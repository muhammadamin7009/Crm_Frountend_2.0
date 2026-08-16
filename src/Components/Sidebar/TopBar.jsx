import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Drawer,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";
import { useThemeMode } from "../../Context/ThemeContext";
import { getWarehouses } from "../../api/inventory";

import { hasPermission } from "../../utils/permissions";
import {
  buildInventoryMenuItems,
  getAvailableQuickActions,
  isMenuItemVisible,
  menuGroups,
} from "../../utils/navigation";
import { getCompanyLogoUrl } from "../../utils/company";

// Profil oynasi alohida bo'lakda. U MUI'ning TextField va Dialog kodini
// o'ziga tortadi — har sahifada yuklanadigan TopBar bilan birga kelsa,
// foydalanuvchi profilni umuman ochmasa ham shuncha kod tushardi.
const ProfileDialog = lazy(() => import("./ProfileDialog"));

const roleLabels = {
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

  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const getInitials = (user) => {
  const first = user?.first_name?.[0] || "";

  const last = user?.last_name?.[0] || "";

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return user?.username?.slice(0, 2)?.toUpperCase() || "AA";
};

const headerDate = () =>
  new Intl.DateTimeFormat("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

const DAY_MS = 24 * 60 * 60 * 1000;

const utcDateOnly = (value) => {
  if (!value) return null;

  const match = String(value)
    .slice(0, 10)
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const [year, month, day] = match.slice(1).map(Number);

  return Date.UTC(year, month - 1, day);
};

const getSubscriptionNotice = (user, now) => {
  if (!["super_admin", "admin"].includes(user?.role) || !user?.subscription_ends_at) {
    return null;
  }

  const endsAt = utcDateOnly(user.subscription_ends_at);

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  if (endsAt === null) {
    return null;
  }

  const remainingDays = Math.round((endsAt - today) / DAY_MS);

  const graceDays = Number(user.subscription_grace_days || 7);

  if (remainingDays >= 0 && remainingDays <= 7) {
    return {
      tone: "warning",
      message:
        remainingDays === 0
          ? "Obunangiz bugun tugaydi. To‘lovni yangilang."
          : `Obunangiz tugashiga ${remainingDays} kun qoldi. To‘lovni yangilang.`,
    };
  }

  if (remainingDays < 0 && remainingDays >= -graceDays) {
    const graceRemaining = graceDays + remainingDays;

    return {
      tone: "expired",
      message:
        graceRemaining === 0
          ? "Obuna muddati tugadi. Imtiyoz davri bugun tugaydi."
          : `Obuna muddati tugadi. Korxona to‘xtatilishiga ${graceRemaining} kun qoldi.`,
    };
  }

  return null;
};

export default function TopBar() {
  const { user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);

  // Profil oynasi bir marta ochilgach DOM'da qoladi — yopib-ochganda
  // bo'lak qayta so'ralmaydi.
  const [profileMounted, setProfileMounted] = useState(false);

  const [warehouses, setWarehouses] = useState([]);

  const [subscriptionNow, setSubscriptionNow] = useState(() => new Date());

  const [quickActionsAnchor, setQuickActionsAnchor] = useState(null);


  useEffect(() => {
    if (!["super_admin", "admin"].includes(user?.role)) {
      return undefined;
    }

    const timer = window.setInterval(() => setSubscriptionNow(new Date()), 60 * 60 * 1000);

    return () => window.clearInterval(timer);
  }, [user?.role]);

  const subscriptionNotice = useMemo(
    () => getSubscriptionNotice(user, subscriptionNow),
    [user, subscriptionNow],
  );

  const loadWarehouses = useCallback(async () => {
    const roleAllowed = ["super_admin", "admin", "worker"].includes(user?.role);

    const permissionAllowed = hasPermission(user, "inventory.view");

    if (!roleAllowed || !permissionAllowed) {
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

    return () => {
      window.removeEventListener("warehouses-updated", loadWarehouses);
    };
  }, [loadWarehouses]);

  // Menyu ta'rifi `navigation.js` da — ilgari bu yerda uning to'liq nusxasi turgan va
  // ruxsatlar sidebar'dagidan ayrilib qolgandi (masalan inventarizatsiya `inventory.view`
  // bilan ochilardi). Endi bitta manbadan olinadi.
  const resolvedMobileLinks = useMemo(() => {
    const inventoryItems = buildInventoryMenuItems(user, warehouses);

    return menuGroups
      .flatMap((group) => group.items)
      .flatMap((item) => {
        // Statik "Ombor" bandi o'rniga har bir ombor alohida ko'rsatiladi.
        if (item.path === "/inventory") return inventoryItems;
        // Inventarizatsiya dinamik ro'yxatda bor — takrorlanmasin.
        if (item.path === "/inventory/counts") return [];
        return [item];
      })
      .filter((item) => isMenuItemVisible(user, item));
  }, [user, warehouses]);

  const availableQuickActions = useMemo(() => getAvailableQuickActions(user), [user]);

  const fullName = useMemo(() => {
    const name = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

    return name || user?.username || "Al-Amin foydalanuvchisi";
  }, [user]);

  const role = roleLabels[user?.role] || user?.role || "Foydalanuvchi";

  const companyHeaderLogo = getCompanyLogoUrl(user?.company_logo_url);

  const openQuickAction = (event, path) => {
    event.currentTarget.blur();
    setQuickActionsAnchor(null);
    requestAnimationFrame(() => navigate(path));
  };

  // Oynani ochish: birinchi marta bosilganda bo'lak yuklanadi va shundan
  // keyin DOM'da qolaveradi — qayta ochish tez bo'ladi.
  const openProfile = () => {
    setProfileMounted(true);
    setProfileOpen(true);
  };

  useEffect(() => {
    window.addEventListener("open-user-profile", openProfile);
    return () => window.removeEventListener("open-user-profile", openProfile);
  }, []);


  return (
    <>
      <style>{topBarStyles}</style>

      <Box component="header" className="aa-topbar">
        <Box className="aa-topbar-left">
          <Button
            onClick={(event) => {
              event.currentTarget.blur();
              setMenuOpen(true);
            }}
            className="aa-mobile-menu-button"
            aria-label="Mobil menyuni ochish"
          >
            <span />
            <span />
            <span />
          </Button>

          {companyHeaderLogo && (
            <Box className="aa-mobile-company-logo">
              <img src={companyHeaderLogo} alt={user?.company_name || "Korxona logosi"} />
            </Box>
          )}

          <Box className="aa-mobile-brand-copy">
            <Typography>{user?.company_name || "AL AMIN"}</Typography>
            <Typography>ERP</Typography>
          </Box>

          <Box className="aa-welcome">
            <Typography component="h1" className="aa-welcome-title">
              Xush kelibsiz, <span>{user?.first_name || fullName}</span>! 👋
            </Typography>

            <Box className="aa-welcome-meta">
              <span className="aa-online-dot" />

              <Typography>{headerDate()}</Typography>
            </Box>
          </Box>
        </Box>

        {subscriptionNotice && (
          <Box
            role="status"
            className={`aa-subscription-notice ${
              subscriptionNotice.tone === "expired" ? "expired" : "warning"
            }`}
          >
            <Box className="aa-subscription-icon">!</Box>

            <Typography>{subscriptionNotice.message}</Typography>
          </Box>
        )}

        <Box className="aa-topbar-actions">
          <Button
            type="button"
            onClick={(event) => {
              event.currentTarget.blur();
              toggleTheme();
            }}
            className="aa-theme-toggle"
            aria-label={mode === "dark" ? "Yorug‘ rejimni yoqish" : "Qorong‘i rejimni yoqish"}
            title={mode === "dark" ? "Yorug‘ rejim" : "Qorong‘i rejim"}
          >
            <span aria-hidden="true">{mode === "dark" ? "☀" : "☾"}</span>
          </Button>

          {/* Ruxsati bo'yicha birorta tezkor amal chiqmasa, tugma umuman chizilmaydi.
              Ilgari u o'chirilgan holatda turardi — bosib bo'lmaydigan tugma
              foydalanuvchini nima yetishmayotganini o'ylashga majbur qiladi. */}
          {availableQuickActions.length > 0 && (
            <Button
              onClick={(event) => {
                const anchor = event.currentTarget;
                anchor.blur();
                setQuickActionsAnchor(anchor);
              }}
              className="aa-quick-action-button"
              aria-haspopup="menu"
              aria-expanded={Boolean(quickActionsAnchor)}
            >
              <span className="aa-plus">+</span>

              <span>Tezkor amal</span>

              <span className="aa-arrow">↓</span>
            </Button>
          )}

          <Menu
            anchorEl={quickActionsAnchor}
            open={Boolean(quickActionsAnchor)}
            onClose={() => setQuickActionsAnchor(null)}
            slotProps={{
              paper: {
                className: "aa-quick-menu",
              },
            }}
          >
            <Box className="aa-quick-menu-header">
              <Typography>Tezkor amallar</Typography>

              <Typography>Kerakli bo‘limga tez o‘ting</Typography>
            </Box>

            {availableQuickActions.map((item, index) => (
              <MenuItem
                key={item.path}
                onClick={(event) => openQuickAction(event, item.path)}
                className="aa-quick-menu-item"
              >
                <Box className="aa-quick-number">{String(index + 1).padStart(2, "0")}</Box>

                <Box className="aa-quick-copy">
                  <Typography>{item.label}</Typography>

                  <Typography>{item.description}</Typography>
                </Box>

                <span className="aa-menu-arrow">→</span>
              </MenuItem>
            ))}
          </Menu>

          <Button
            onClick={(event) => {
              event.currentTarget.blur();
              openProfile();
            }}
            title="Profilni tahrirlash"
            className="aa-profile-button"
          >
            <Box className="aa-profile-copy">
              <Typography className="aa-profile-name">{fullName}</Typography>

              <Box className="aa-profile-role-row">
                <span className="aa-profile-status" />

                <Typography>{role}</Typography>
              </Box>
            </Box>

            {/* Oldindan ko'rish endi profil oynasining ichida — saqlangandan
                keyin `user.user_image` yangilanadi va rasm shu yerda ham
                o'zgaradi. */}
            <Avatar src={getImageUrl(user?.user_image)} className="aa-topbar-avatar">
              {getInitials(user)}
            </Avatar>

            <span className="aa-profile-chevron">⌄</span>
          </Button>
        </Box>
      </Box>

      {/* MUI'ning Drawer'i to'g'ridan-to'g'ri olinadi. MuiCompat orqali
          olinsa, o'sha modul TextField va Dialog'ni ham import qiladi va
          ular har sahifaning birinchi yuklanishiga tushib qolardi. */}
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        slotProps={{ paper: { className: "aa-mobile-drawer" } }}
      >
        <Box className="aa-mobile-drawer-content">
          <Box className="aa-mobile-drawer-header">
            <Box className="aa-drawer-brand">
              {companyHeaderLogo ? (
                <img src={companyHeaderLogo} alt={user?.company_name || "Korxona logosi"} />
              ) : (
                <span>{user?.company_name?.charAt(0)?.toUpperCase() || "A"}</span>
              )}
            </Box>

            <Box className="aa-drawer-brand-copy">
              <Typography>{user?.company_name || "Al-amin ERP"}</Typography>

              <Typography>Korxona boshqaruv tizimi</Typography>
            </Box>

            <Button
              onClick={() => setMenuOpen(false)}
              className="aa-drawer-close"
              aria-label="Mobil menyuni yopish"
            >
              ×
            </Button>
          </Box>

          <Divider className="aa-drawer-divider" />

          <Button type="button" onClick={toggleTheme} className="aa-drawer-theme-switch">
            <span className="aa-drawer-theme-icon" aria-hidden="true">
              {mode === "dark" ? "☀" : "☾"}
            </span>

            <Box>
              <Typography>{mode === "dark" ? "Yorug‘ rejim" : "Qorong‘i rejim"}</Typography>
              <Typography>Ko‘rinishni almashtirish</Typography>
            </Box>

            <span className={`aa-theme-track ${mode === "dark" ? "active" : ""}`}>
              <span />
            </span>
          </Button>

          <Typography className="aa-drawer-section-title">Navigatsiya</Typography>

          <List className="aa-mobile-links">
            {resolvedMobileLinks.map((item, index) => (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className="aa-mobile-link"
              >
                <span className="aa-mobile-link-number">{String(index + 1).padStart(2, "0")}</span>

                <ListItemText primary={item.label} />

                <span className="aa-mobile-link-arrow">→</span>
              </ListItemButton>
            ))}
          </List>

          <Box className="aa-mobile-drawer-footer">
            <Box className="aa-mobile-user">
              <Avatar src={getImageUrl(user?.user_image)}>{getInitials(user)}</Avatar>

              <Box>
                <Typography>{fullName}</Typography>

                <Typography>{role}</Typography>
              </Box>
            </Box>

            <Button
              onClick={() => {
                clearSession();

                navigate("/login", {
                  replace: true,
                });
              }}
              className="aa-mobile-logout"
            >
              Tizimdan chiqish
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Profil oynasi alohida bo'lakda: ochilmaguncha yuklanmaydi. */}
      {profileMounted && (
        <Suspense fallback={null}>
          <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

const topBarStyles = `
  .aa-topbar {
    position: relative;
    width: calc(100% - 32px);
    min-height: 86px;
    margin: 16px 16px 0;
    padding: 14px 16px 14px 22px;
    display: flex;
    align-items: center;
    gap: 20px;
    border: 1px solid rgba(23, 17, 15, 0.075);
    border-radius: 22px;
    background:
      radial-gradient(
        circle at 92% 0%,
        rgba(110, 22, 34, 0.055),
        transparent 24%
      ),
      rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(22px);
    box-shadow:
      0 12px 34px rgba(23, 17, 15, 0.055),
      inset 0 1px 0 rgba(255, 255, 255, 0.85);
    z-index: 20;
  }

  .aa-topbar::after {
    content: "";
    position: absolute;
    left: 23px;
    bottom: -1px;
    width: 48px;
    height: 2px;
    border-radius: 20px;
    background:
      linear-gradient(
        90deg,
        #4d0f18,
        #8c1d2b
      );
  }

  .aa-topbar-left {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 13px;
  }

  .aa-mobile-menu-button {
    display: none !important;
    min-width: 44px !important;
    width: 44px;
    height: 44px;
    padding: 0 !important;
    flex-direction: column;
    gap: 4px;
    border-radius: 13px !important;
    border:
      1px solid rgba(110, 22, 34, 0.13) !important;
    background:
      rgba(110, 22, 34, 0.055) !important;
  }

  .aa-mobile-menu-button span {
    width: 17px;
    height: 2px;
    border-radius: 8px;
    background: #6e1622;
  }

  .aa-mobile-company-logo {
    display: none;
    width: 44px;
    height: 44px;
    padding: 5px;
    overflow: hidden;
    border:
      1px solid #e8e1d8;
    border-radius: 13px;
    background: #ffffff;
  }

  .aa-mobile-company-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .aa-mobile-brand-copy {
    display: none;
    min-width: 0;
  }

  .aa-mobile-brand-copy p:first-child {
    overflow: hidden;
    color: #6e1622;
    font-size: 18px;
    line-height: 1.05;
    font-weight: 700;
    letter-spacing: -.035em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aa-mobile-brand-copy p:last-child {
    margin-top: 3px;
    color: #b5873b;
    font-size: 9px;
    line-height: 1;
    font-weight: 600;
    letter-spacing: .18em;
  }

  .aa-welcome {
    min-width: 0;
  }

  .aa-welcome-title {
    margin: 0 !important;
    color: #17110f;
    font-size: 21px !important;
    line-height: 1.15 !important;
    font-weight: 700 !important;
    letter-spacing: -0.025em !important;
    white-space: nowrap;
  }

  .aa-welcome-title span {
    color: #4d0f18;
  }

  .aa-welcome-meta {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .aa-welcome-meta p {
    color: #7d716a;
    font-size: 12px;
    line-height: 1;
    font-weight: 600;
    text-transform: capitalize;
  }

  .aa-online-dot {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #4e9c6b;
    box-shadow:
      0 0 0 4px rgba(78, 156, 107, 0.1);
  }

  .aa-subscription-notice {
    min-width: 240px;
    max-width: 480px;
    margin-left: auto;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 14px;
  }

  .aa-subscription-notice.warning {
    border:
      1px solid rgba(160, 106, 18, 0.21);
    background:
      rgba(255, 251, 235, 0.93);
  }

  .aa-subscription-notice.expired {
    border:
      1px solid rgba(140, 29, 43, 0.2);
    background:
      rgba(254, 242, 242, 0.94);
  }

  .aa-subscription-icon {
    width: 27px;
    height: 27px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 700;
  }

  .aa-subscription-notice.warning
  .aa-subscription-icon {
    color: #7d5210;
    background:
      rgba(160, 106, 18, 0.13);
  }

  .aa-subscription-notice.expired
  .aa-subscription-icon {
    color: #7a1826;
    background:
      rgba(140, 29, 43, 0.1);
  }

  .aa-subscription-notice p {
    font-size: 12px;
    line-height: 1.4;
    font-weight: 600;
  }

  .aa-subscription-notice.warning p {
    color: #7d5210;
  }

  .aa-subscription-notice.expired p {
    color: #7a1826;
  }

  .aa-topbar-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .aa-theme-toggle {
    display: grid !important;
    min-width: 46px !important;
    width: 46px;
    height: 46px;
    padding: 0 !important;
    color: var(--aa-text-secondary) !important;
    border: 1px solid var(--aa-border) !important;
    border-radius: 14px !important;
    background: var(--aa-surface-muted) !important;
  }

  .aa-theme-toggle span {
    font-size: 21px;
    line-height: 1;
  }

  .aa-theme-toggle:hover {
    color: var(--aa-brand-500) !important;
    border-color: var(--aa-brand-200) !important;
    background: var(--aa-brand-50) !important;
  }

  .aa-quick-action-button {
    min-width: 155px !important;
    height: 46px;
    padding: 0 15px !important;
    gap: 9px;
    color: #ffffff !important;
    border-radius: 14px !important;
    text-transform: none !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    background:
      linear-gradient(
        135deg,
        #4d0f18 0%,
        #7a1826 100%
      ) !important;
    box-shadow:
      0 11px 24px rgba(77, 15, 24, 0.22) !important;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease !important;
  }

  .aa-quick-action-button:hover {
    transform: translateY(-1px);
    box-shadow:
      0 15px 29px rgba(77, 15, 24, 0.27) !important;
  }

  .aa-quick-action-button.Mui-disabled {
    color:
      rgba(255, 255, 255, 0.65) !important;
    background: #d8cec1 !important;
    box-shadow: none !important;
  }

  .aa-plus {
    width: 23px;
    height: 23px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    font-size: 20px;
    line-height: 1;
    background:
      rgba(255, 255, 255, 0.13);
  }

  .aa-arrow {
    margin-left: 2px;
    opacity: 0.72;
    font-size: 12px;
  }

  .aa-quick-menu {
    min-width: 310px !important;
    margin-top: 9px;
    padding: 7px !important;
    overflow: hidden;
    border:
      1px solid var(--aa-border);
    border-radius: 18px !important;
    background: var(--aa-surface-solid) !important;
    backdrop-filter: blur(20px);
    box-shadow:
      0 22px 60px rgba(23, 17, 15, 0.15) !important;
  }

  .aa-quick-menu-header {
    margin-bottom: 5px;
    padding: 11px 12px 12px;
    border-bottom:
      1px solid var(--aa-border);
  }

  .aa-quick-menu-header p:first-child {
    color: var(--aa-text);
    font-size: 14px;
    font-weight: 700;
  }

  .aa-quick-menu-header p:last-child {
    margin-top: 4px;
    color: var(--aa-text-secondary);
    font-size: 11.5px;
  }

  .aa-quick-menu-item {
    min-height: 61px !important;
    margin: 2px 0 !important;
    padding: 9px 10px !important;
    display: flex !important;
    gap: 11px !important;
    border-radius: 12px !important;
  }

  .aa-quick-menu-item:hover {
    background: var(--aa-surface-hover) !important;
  }

  .aa-quick-number {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 10px;
    color: #6e1622;
    font-size: 10px;
    font-weight: 700;
    background:
      rgba(110, 22, 34, 0.075);
  }

  .aa-quick-copy {
    min-width: 0;
    flex: 1;
  }

  .aa-quick-copy p:first-child {
    color: var(--aa-text);
    font-size: 13px;
    font-weight: 600;
  }

  .aa-quick-copy p:last-child {
    margin-top: 3px;
    color: var(--aa-text-secondary);
    font-size: 11px;
  }

  .aa-menu-arrow {
    color: var(--aa-text-secondary);
    font-size: 16px;
  }

  .aa-profile-button {
    min-width: 0 !important;
    height: 54px;
    padding: 5px 7px 5px 12px !important;
    gap: 11px;
    border:
      1px solid rgba(23, 17, 15, 0.075) !important;
    border-radius: 17px !important;
    color: inherit !important;
    text-transform: none !important;
    background:
      rgba(248, 250, 252, 0.78) !important;
    transition:
      border-color 0.18s ease,
      background-color 0.18s ease,
      transform 0.18s ease !important;
  }

  .aa-profile-button:hover {
    transform: translateY(-1px);
    border-color:
      rgba(110, 22, 34, 0.12) !important;
    background:
      rgba(110, 22, 34, 0.045) !important;
  }

  .aa-profile-copy {
    min-width: 0;
    max-width: 165px;
    text-align: right;
  }

  .aa-profile-name {
    overflow: hidden;
    color: #17110f;
    font-size: 12.5px !important;
    line-height: 1.2 !important;
    font-weight: 700 !important;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aa-profile-role-row {
    margin-top: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }

  .aa-profile-role-row p {
    overflow: hidden;
    color: #7d716a;
    font-size: 10.5px;
    line-height: 1;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aa-profile-status {
    width: 6px;
    height: 6px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #4e9c6b;
  }

  .aa-topbar-avatar {
    width: 42px !important;
    height: 42px !important;
    flex: 0 0 auto;
    color: #ffffff !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    background:
      linear-gradient(
        135deg,
        #4d0f18,
        #8c1d2b
      ) !important;
    border:
      2px solid rgba(255, 255, 255, 0.9);
    box-shadow:
      0 8px 17px rgba(77, 15, 24, 0.17);
  }

  .aa-profile-chevron {
    margin: 0 4px 0 -3px;
    color: #8a94a3;
    font-size: 15px;
  }

  .aa-mobile-drawer {
    width: 300px !important;
    color: var(--aa-text) !important;
    background:
      radial-gradient(
        circle at 100% 0%,
        rgba(110, 22, 34, 0.07),
        transparent 27%
      ),
      var(--aa-surface-solid) !important;
  }

  .aa-mobile-drawer-content {
    min-height: 100%;
    padding: 17px;
    display: flex;
    flex-direction: column;
  }

  .aa-mobile-drawer-header {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .aa-drawer-brand {
    width: 45px;
    height: 45px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    overflow: hidden;
    color: #6e1622;
    border-radius: 14px;
    background: #ffffff;
    font-size: 18px;
    font-weight: 700;
  }

  .aa-drawer-brand img {
    width: 34px;
    height: 34px;
    object-fit: contain;
  }

  .aa-drawer-brand-copy {
    min-width: 0;
    flex: 1;
  }

  .aa-drawer-brand-copy p:first-child {
    overflow: hidden;
    color: var(--aa-text);
    font-size: 14px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aa-drawer-brand-copy p:last-child {
    margin-top: 4px;
    color: var(--aa-text-tertiary);
    font-size: 10.5px;
  }

  .aa-drawer-close,
  .aa-dialog-close {
    min-width: 37px !important;
    width: 37px;
    height: 37px;
    padding: 0 !important;
    border-radius: 11px !important;
    color: var(--aa-text-secondary) !important;
    font-size: 24px !important;
    background: var(--aa-surface-muted) !important;
  }

  .aa-drawer-divider {
    margin: 18px 0 !important;
    border-color: var(--aa-border) !important;
  }

  .aa-drawer-section-title {
    padding: 0 10px;
    color: var(--aa-text-tertiary);
    font-size: 9px !important;
    font-weight: 700 !important;
    letter-spacing: 0.14em !important;
    text-transform: uppercase;
  }

  .aa-drawer-theme-switch {
    width: 100%;
    min-height: 58px !important;
    margin-bottom: 14px !important;
    padding: 8px 10px !important;
    display: flex !important;
    justify-content: flex-start !important;
    gap: 11px !important;
    color: var(--aa-text) !important;
    border: 1px solid var(--aa-border) !important;
    border-radius: 14px !important;
    text-align: left;
    background: var(--aa-surface-muted) !important;
  }

  .aa-drawer-theme-icon {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 11px;
    color: #f9c766;
    background: rgba(249,199,102,.1);
    font-size: 18px;
  }

  .aa-drawer-theme-switch > div {
    min-width: 0;
    flex: 1;
  }

  .aa-drawer-theme-switch > div p:first-child {
    color: var(--aa-text);
    font-size: 12px;
    font-weight: 600;
  }

  .aa-drawer-theme-switch > div p:last-child {
    margin-top: 3px;
    color: var(--aa-text-tertiary);
    font-size: 9.5px;
  }

  .aa-theme-track {
    position: relative;
    width: 36px;
    height: 22px;
    flex: 0 0 auto;
    border-radius: 999px;
    background: var(--aa-border-strong);
    transition: background-color .2s ease;
  }

  .aa-theme-track > span {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    transition: transform .2s ease;
  }

  .aa-theme-track.active {
    background: #a61717;
  }

  .aa-theme-track.active > span {
    transform: translateX(14px);
  }

  .aa-mobile-links {
    margin-top: 8px !important;
    flex: 1;
  }

  .aa-mobile-link {
    min-height: 48px !important;
    margin-bottom: 4px !important;
    padding: 8px 10px !important;
    gap: 10px;
    color: var(--aa-text-secondary) !important;
    border-radius: 12px !important;
  }

  .aa-mobile-link:hover {
    color: var(--aa-text) !important;
    background: var(--aa-surface-muted) !important;
  }

  .aa-mobile-link.active {
    color: var(--aa-brand-800) !important;
    background: linear-gradient(135deg, var(--aa-brand-100), var(--aa-brand-50)) !important;
  }

  .aa-mobile-link-number {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    color: var(--aa-text-tertiary);
    font-size: 9px;
    font-weight: 700;
    background: var(--aa-surface-muted);
  }

  .aa-mobile-link
  .MuiListItemText-primary {
    color: inherit;
    font-size: 13px;
    font-weight: 600;
  }

  .aa-mobile-link-arrow {
    color: var(--aa-text-tertiary);
  }

  .aa-mobile-drawer-footer {
    margin-top: 20px;
    padding: 13px;
    border: 1px solid var(--aa-border);
    border-radius: 16px;
    background: var(--aa-surface-muted);
  }

  .aa-mobile-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .aa-mobile-user
  .MuiAvatar-root {
    width: 39px;
    height: 39px;
    font-size: 13px;
    font-weight: 700;
    background: #6e1622;
  }

  .aa-mobile-user p:first-child {
    color: var(--aa-text);
    font-size: 12.5px;
    font-weight: 600;
  }

  .aa-mobile-user p:last-child {
    margin-top: 4px;
    color: var(--aa-text-tertiary);
    font-size: 10px;
  }

  .aa-mobile-logout {
    width: 100%;
    min-height: 37px !important;
    margin-top: 11px !important;
    color: #d9b782 !important;
    border-radius: 10px !important;
    text-transform: none !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    background:
      rgba(140, 29, 43, 0.09) !important;
  }

  .aa-profile-dialog {
    max-height: min(900px, calc(100dvh - 32px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border:
      1px solid rgba(23, 17, 15, 0.08);
    border-radius: 23px !important;
    background: var(--aa-bg) !important;
    box-shadow:
      0 28px 80px rgba(23, 17, 15, 0.2) !important;
  }

  .aa-dialog-title {
    flex: 0 0 auto;
    padding: 21px 24px !important;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #ffffff;
    background:
      radial-gradient(
        circle at 100% 0%,
        rgba(163, 40, 58, 0.25),
        transparent 32%
      ),
      linear-gradient(
        135deg,
        #151211,
        #2a1117
      );
  }

  .aa-dialog-title h2 {
    color: #ffffff;
    font-size: 19px;
    line-height: 1.2;
    font-weight: 700;
  }

  .aa-dialog-title p {
    margin-top: 6px;
    color:
      rgba(255, 255, 255, 0.48);
    font-size: 11.5px;
  }

  .aa-dialog-content {
    min-height: 0;
    overflow-y: auto !important;
    overscroll-behavior: contain;
    padding: 22px !important;
  }

  .aa-profile-form {
    min-height: 0;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    overflow: hidden;
  }

  .aa-settings-card {
    padding: 18px;
    border:
      1px solid var(--aa-border);
    border-radius: 17px;
    background: var(--aa-surface-solid);
    box-shadow:
      0 8px 24px rgba(23, 17, 15, 0.035);
  }

  .aa-settings-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .aa-settings-heading
  > div
  > p:first-child {
    color: var(--aa-text);
    font-size: 14px;
    font-weight: 700;
  }

  .aa-settings-heading
  > div
  > p:last-child {
    margin-top: 5px;
    color: var(--aa-text-secondary);
    font-size: 11.5px;
  }

  .aa-branding-chip {
    height: 24px !important;
    color: #6e1622 !important;
    font-size: 10px !important;
    font-weight: 600 !important;
    background:
      rgba(110, 22, 34, 0.07) !important;
  }

  .aa-logo-settings {
    margin-top: 17px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .aa-company-logo-preview {
    width: 75px !important;
    height: 75px !important;
    flex: 0 0 auto;
    color: #6e1622 !important;
    font-size: 20px !important;
    font-weight: 700 !important;
    border:
      1px solid var(--aa-border);
    border-radius: 17px !important;
    background: var(--aa-surface-muted) !important;
  }

  .aa-company-logo-preview img {
    padding: 7px;
    object-fit: contain !important;
  }

  .aa-logo-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .aa-outline-button,
  .aa-primary-button,
  .aa-delete-button,
  .aa-delete-outline-button,
  .aa-cancel-button,
  .aa-save-button {
    min-height: 39px !important;
    padding: 0 14px !important;
    border-radius: 11px !important;
    text-transform: none !important;
    font-size: 12px !important;
    font-weight: 600 !important;
  }

  .aa-outline-button {
    color: #6e1622 !important;
    border-color:
      rgba(110, 22, 34, 0.2) !important;
  }

  .aa-primary-button,
  .aa-save-button {
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #4d0f18,
        #7a1826
      ) !important;
    box-shadow:
      0 9px 20px rgba(77, 15, 24, 0.18) !important;
  }

  .aa-delete-button {
    color: #8c1d2b !important;
    background:
      rgba(140, 29, 43, 0.055) !important;
  }

  .aa-file-hint {
    margin-top: 11px !important;
    color: #a0a7b2;
    font-size: 10.5px !important;
  }

  .aa-profile-main-card {
    padding: 17px;
    display: flex;
    align-items: center;
    gap: 15px;
    border:
      1px solid var(--aa-border);
    border-radius: 17px;
    background:
      linear-gradient(
        135deg,
        var(--aa-surface-solid),
        var(--aa-surface-muted)
      );
  }

  .aa-profile-large-avatar {
    width: 70px !important;
    height: 70px !important;
    flex: 0 0 auto;
    color: #ffffff !important;
    font-size: 21px !important;
    font-weight: 700 !important;
    background:
      linear-gradient(
        135deg,
        #4d0f18,
        #8c1d2b
      ) !important;
    box-shadow:
      0 11px 25px rgba(77, 15, 24, 0.18);
  }

  .aa-profile-main-copy {
    min-width: 0;
    flex: 1;
  }

  .aa-profile-main-copy
  > p:first-child {
    color: var(--aa-text);
    font-size: 14px;
    font-weight: 700;
  }

  .aa-profile-main-copy
  > p:nth-child(2) {
    margin: 5px 0 10px;
    color: var(--aa-text-secondary);
    font-size: 11.5px;
  }

  .aa-profile-image-hint {
    flex: 0 0 auto;
    color: #9aa2ad;
    font-size: 10px !important;
    line-height: 1.5 !important;
    text-align: right;
  }

  .aa-form-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .aa-profile-field
  .MuiOutlinedInput-root {
    min-height: 54px;
    border-radius: 13px;
    background: var(--aa-surface-solid);
  }

  .aa-profile-field
  .MuiOutlinedInput-notchedOutline {
    border-color: var(--aa-border);
  }

  .aa-profile-field
  .MuiOutlinedInput-root:hover
  .MuiOutlinedInput-notchedOutline {
    border-color: #aab2be;
  }

  .aa-profile-field
  .MuiOutlinedInput-root.Mui-focused {
    box-shadow:
      0 0 0 4px rgba(110, 22, 34, 0.07);
  }

  .aa-profile-field
  .MuiOutlinedInput-root.Mui-focused
  .MuiOutlinedInput-notchedOutline {
    border-color: #6e1622;
    border-width: 1px;
  }

  .aa-profile-field
  .MuiInputLabel-root.Mui-focused {
    color: #6e1622;
  }

  .aa-profile-divider {
    border-color:
      rgba(23, 17, 15, 0.075) !important;
  }

  .aa-session-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .aa-session-heading
  > div
  > p:first-child {
    color: var(--aa-text);
    font-size: 14px;
    font-weight: 700;
  }

  .aa-session-heading
  > div
  > p:last-child {
    margin-top: 4px;
    color: var(--aa-text-secondary);
    font-size: 11.5px;
  }

  .aa-delete-outline-button {
    color: #8c1d2b !important;
    border:
      1px solid rgba(140, 29, 43, 0.17) !important;
    background:
      rgba(140, 29, 43, 0.035) !important;
  }

  .aa-sessions-loading {
    padding: 27px;
    display: flex;
    justify-content: center;
  }

  .aa-sessions-list {
    display: grid;
    gap: 9px;
  }

  .aa-session-item {
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 11px;
    border:
      1px solid var(--aa-border);
    border-radius: 14px;
    background: var(--aa-surface-solid);
  }

  .aa-session-icon {
    width: 37px;
    height: 37px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    color: #6e1622;
    border-radius: 11px;
    font-size: 12px;
    font-weight: 700;
    background:
      rgba(110, 22, 34, 0.07);
  }

  .aa-session-copy {
    min-width: 0;
    flex: 1;
  }

  .aa-session-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .aa-session-name-row
  > p {
    overflow: hidden;
    color: var(--aa-text);
    font-size: 12.5px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aa-current-chip {
    height: 21px !important;
    color: #2f6b45 !important;
    font-size: 9px !important;
    font-weight: 600 !important;
    background:
      rgba(78, 156, 107, 0.1) !important;
  }

  .aa-session-copy
  > p:last-child {
    margin-top: 5px;
    color: #8a94a3;
    font-size: 10.5px;
  }

  .aa-session-logout {
    min-width: 67px !important;
    min-height: 34px !important;
    color: #8c1d2b !important;
    border-radius: 9px !important;
    text-transform: none !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    background:
      rgba(140, 29, 43, 0.045) !important;
  }

  .aa-empty-sessions {
    padding: 25px;
    text-align: center;
    border:
      1px dashed var(--aa-border-strong);
    border-radius: 14px;
    background:
      var(--aa-surface-muted);
  }

  .aa-empty-sessions p {
    color: #8a94a3;
    font-size: 12px;
  }

  .aa-dialog-actions {
    flex: 0 0 auto;
    padding: 16px 22px 20px !important;
    gap: 9px;
    border-top:
      1px solid var(--aa-border);
    background: var(--aa-surface-solid);
  }

  .aa-cancel-button {
    color: #7d716a !important;
  }

  .aa-save-button {
    min-width: 175px !important;
  }

  @media (max-width: 1200px) {
    .aa-subscription-notice {
      display: none;
    }

    .aa-profile-copy {
      display: none;
    }

    .aa-profile-button {
      padding-left: 6px !important;
    }
  }

  @media (max-width: 1023px) {
    .aa-topbar {
      width: calc(100% - 16px);
      min-height: 72px;
      margin: 8px 8px 0;
      padding: 10px 12px;
      gap: 10px;
      border-radius: 20px;
    }

    .aa-mobile-menu-button {
      display: flex !important;
    }

    .aa-mobile-company-logo {
      display: none;
    }

    .aa-mobile-brand-copy {
      display: block;
      max-width: 190px;
    }

    .aa-welcome {
      display: none;
    }

    .aa-welcome-title {
      font-size: 17px !important;
    }

    .aa-welcome-meta {
      margin-top: 6px;
    }

    .aa-topbar-actions {
      gap: 7px;
    }

    .aa-quick-action-button {
      display: none !important;
    }

    .aa-quick-action-button
    > span:nth-child(2),
    .aa-quick-action-button
    .aa-arrow {
      display: none;
    }

    .aa-plus {
      background: transparent;
    }

    .aa-profile-button {
      height: 47px;
      padding: 3px !important;
      border: 0 !important;
      background:
        transparent !important;
    }

    .aa-topbar-avatar {
      width: 41px !important;
      height: 41px !important;
    }

    .aa-theme-toggle {
      display: grid !important;
      width: 42px;
      min-width: 42px !important;
      height: 42px;
      border-radius: 13px !important;
    }

    .aa-profile-chevron {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .aa-form-grid {
      grid-template-columns: 1fr;
    }

    .aa-logo-settings,
    .aa-profile-main-card,
    .aa-session-item,
    .aa-session-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .aa-logo-actions {
      width: 100%;
    }

    .aa-profile-image-hint {
      text-align: left;
    }

    .aa-session-logout {
      width: 100%;
    }

    .aa-dialog-actions {
      flex-direction: row;
      flex-wrap: nowrap;
      padding: 12px 16px 16px !important;
    }

    .aa-cancel-button,
    .aa-save-button {
      width: auto;
      min-width: 0 !important;
      min-height: 44px !important;
      height: 44px;
      flex: 1 1 0 !important;
    }
  }

  @media (max-width: 430px) {
    .aa-topbar {
      padding: 9px;
    }

    .aa-mobile-menu-button {
      min-width: 40px !important;
      width: 40px;
      height: 40px;
    }

    .aa-topbar-actions {
      margin-left: auto;
    }

    .aa-profile-button {
      height: 42px;
    }

    .aa-topbar-avatar {
      width: 38px !important;
      height: 38px !important;
    }

    .aa-theme-toggle {
      width: 38px;
      min-width: 38px !important;
      height: 38px;
    }
  }

  [data-theme="dark"] .aa-topbar {
    border-color: var(--aa-border);
    background:
      radial-gradient(circle at 92% 0%, rgba(217,75,80,.08), transparent 26%),
      var(--aa-mobile-header);
    box-shadow: var(--aa-shadow-sm);
  }

  [data-theme="dark"] .aa-mobile-menu-button {
    border-color: rgba(217,75,80,.2) !important;
    background: rgba(217,75,80,.08) !important;
  }

  [data-theme="dark"] .aa-mobile-menu-button span {
    background: #ef777b;
  }

  [data-theme="dark"] .aa-mobile-brand-copy p:first-child,
  [data-theme="dark"] .aa-welcome-title,
  [data-theme="dark"] .aa-profile-name {
    color: var(--aa-text);
  }

  [data-theme="dark"] .aa-profile-button {
    border-color: var(--aa-border) !important;
    background: var(--aa-surface-muted) !important;
  }

  [data-theme="dark"] .aa-mobile-drawer {
    background:
      radial-gradient(circle at 100% 0%, rgba(110, 22, 34,.2), transparent 29%),
      linear-gradient(180deg, #1a1615, #090a0c) !important;
  }

  [data-theme="dark"] .aa-mobile-link.active {
    color: #fff !important;
    background: linear-gradient(135deg, #6e1622, #b7242a) !important;
  }

  [data-theme="dark"] .aa-quick-menu,
  [data-theme="dark"] .aa-profile-dialog,
  [data-theme="dark"] .aa-dialog-actions {
    border-color: var(--aa-border) !important;
    background: var(--aa-surface-solid) !important;
  }

  [data-theme="dark"] .aa-quick-menu .aa-quick-number {
    color: #f87171;
    background: rgba(217, 75, 80, 0.12);
  }

  [data-theme="dark"] .aa-quick-menu .aa-quick-menu-item:hover,
  [data-theme="dark"] .aa-quick-menu .aa-quick-menu-item.Mui-focusVisible {
    background: var(--aa-surface-hover) !important;
  }

  [data-theme="dark"] .aa-profile-dialog .aa-settings-card,
  [data-theme="dark"] .aa-profile-dialog .aa-profile-main-card,
  [data-theme="dark"] .aa-profile-dialog .aa-session-item,
  [data-theme="dark"] .aa-profile-dialog .aa-profile-field .MuiOutlinedInput-root,
  [data-theme="dark"] .aa-profile-dialog .aa-empty-sessions {
    color: var(--aa-text) !important;
    border-color: var(--aa-border) !important;
    background: var(--aa-surface-muted) !important;
  }
`;
