import {
  Avatar,
  Box,
  Button,
  InputBase,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../Context/AuthContext";
import AppLogo from "../../images/al-amin-crm-logo.png";

import { clearSession } from "../../utils/auth";
import { hasPermission } from "../../utils/permissions";
import { menuGroups, isMenuItemVisible, buildInventoryMenuItems } from "../../utils/navigation";
import { getCompanyLogoUrl } from "../../utils/company";
import { getWarehouses } from "../../api/inventory";

const roleNames = {
  super_admin: "Super administrator",
  admin: "Administrator",
  client: "Mijoz",
  customer: "Xaridor",
  worker: "Ishchi",
};

// Sidebar guruhlari va ularning tartibi. Bandlar `navigation.js` dan `path` bo'yicha
// olinadi — ruxsat qoidalari faqat o'sha faylda turadi. "Omborlar" guruhi dinamik:
// ombor ro'yxati serverdan keladi, shuning uchun unda tayyor `paths` yo'q.
const GROUP_LAYOUT = [
  { label: "Asosiy", paths: ["/"] },
  { label: "Savdo", paths: ["/clients", "/orders", "/client-sales"] },
  {
    label: "Ishlab chiqarish",
    paths: ["/products", "/my-order-tasks", "/worker-outputs", "/production-batches"],
  },
  { label: "Omborlar", dynamic: true },
  { label: "Xodimlar", paths: ["/users", "/employees", "/worker-payments"] },
  { label: "Hisob-kitob", paths: ["/material-purchases", "/expenses", "/finance"] },
  { label: "Tizim", paths: ["/setup", "/permissions", "/audit-logs"] },
];

// Birinchi kirishda faqat "Asosiy" ochiq turadi: super adminda menyu 19 tagacha
// bandga yetadi va hammasi ochiq bo'lsa kerakli bo'limga yetguncha varaqlashga
// to'g'ri keladi. Foydalanuvchi ochgan guruhlar keyin eslab qolinadi.
const DEFAULT_OPEN_GROUP = "Asosiy";

// `_v2` — standart holat o'zgardi (avval hammasi ochiq edi). Eski kalitni qoldirsak,
// ilgari bir marta bosgan foydalanuvchida yangi standart ishlamay qolardi.
const COLLAPSED_GROUPS_KEY = "sidebar_collapsed_groups_v2";

const defaultCollapsedGroups = () =>
  new Set(GROUP_LAYOUT.map((group) => group.label).filter((label) => label !== DEFAULT_OPEN_GROUP));

const readCollapsedGroups = () => {
  try {
    const raw = localStorage.getItem(COLLAPSED_GROUPS_KEY);

    // Hali hech narsa saqlanmagan — standart holatga tushamiz.
    if (raw === null) return defaultCollapsedGroups();

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? new Set(parsed) : defaultCollapsedGroups();
  } catch {
    return defaultCollapsedGroups();
  }
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
  const location = useLocation();
  const { user } = useAuth();

  const [warehouses, setWarehouses] = useState([]);

  const [menuQuery, setMenuQuery] = useState("");

  const [collapsedGroups, setCollapsedGroups] = useState(readCollapsedGroups);

  const toggleGroup = useCallback((label) => {
    setCollapsedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

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
    const inventoryItems = buildInventoryMenuItems(user, warehouses);

    const itemByPath = new Map(
      menuGroups.flatMap((group) => group.items).map((item) => [item.path, item]),
    );

    return GROUP_LAYOUT.map(({ label, paths, dynamic }) => ({
      label,
      items: dynamic ? inventoryItems : paths.map((path) => itemByPath.get(path)).filter(Boolean),
    }));
  }, [user, warehouses]);

  const searchActive = menuQuery.trim().length > 0;

  // Ishchida 3-4 ta band bo'ladi — unga qidiruv maydoni ortiqcha. Faqat ro'yxat
  // uzayganda ko'rsatamiz.
  const totalVisibleItems = useMemo(
    () =>
      resolvedMenuGroups.reduce(
        (count, group) =>
          count + group.items.filter((item) => isMenuItemVisible(user, item)).length,
        0,
      ),
    [resolvedMenuGroups, user],
  );

  const showMenuSearch = totalVisibleItems >= 8;

  // Guruhlarni bir marta hisoblab qo'yamiz: ruxsat filtri + qidiruv filtri.
  const renderedGroups = useMemo(() => {
    const needle = menuQuery.trim().toLowerCase();

    return resolvedMenuGroups
      .map((group) => {
        const visibleItems = group.items
          .filter((item) => isMenuItemVisible(user, item))
          .filter((item) => !needle || item.label.toLowerCase().includes(needle));

        return { group, visibleItems };
      })
      .filter((entry) => entry.visibleItems.length > 0);
  }, [resolvedMenuGroups, user, menuQuery]);

  // Joriy sahifa yopiq guruhda qolib ketmasin — u avtomatik ochiladi.
  useEffect(() => {
    const owner = resolvedMenuGroups.find((group) =>
      group.items.some(
        (item) =>
          item.path !== "/" &&
          isMenuItemVisible(user, item) &&
          location.pathname.startsWith(item.path),
      ),
    );

    if (!owner) return;

    setCollapsedGroups((previous) => {
      if (!previous.has(owner.label)) return previous;
      const next = new Set(previous);
      next.delete(owner.label);
      localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, [location.pathname, resolvedMenuGroups, user]);

  const handleLogout = () => {
    clearSession();

    navigate("/login", {
      replace: true,
    });
  };

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

  // Ilgari `zerrshoes` slugi uchun boshqa korxonaning (Zerr Collection) logosi
  // majburan chiqarilardi. Endi zaxira — loyihaning o'z logosi, ya'ni korxona
  // logo yuklamagan bo'lsa hech kimning brendi begona joyda ko'rinmaydi.
  const companyName = user?.company_name || "Al-amin ERP";

  const companyLogo = getCompanyLogoUrl(user?.company_logo_url);

  return (
    <aside className="hidden h-screen w-68 shrink-0 lg:block">
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#ffffff",
          background:
            "radial-gradient(circle at 100% 0%, rgba(110, 22, 34,.23), transparent 28%), linear-gradient(180deg,#151211 0%,#151211 45%,#100d0c 100%)",
          borderRight: "1px solid rgba(255,255,255,.07)",

          "&::before": {
            content: '""',
            position: "absolute",
            width: 280,
            height: 280,
            top: -175,
            right: -165,
            borderRadius: "50%",
            border: "1px solid rgba(163, 40, 58,.16)",
            boxShadow:
              "0 0 62px 17px rgba(163, 40, 58,.025), 0 0 125px 34px rgba(163, 40, 58,.018)",
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
              <img
                width={35}
                height={35}
                src={companyLogo || AppLogo}
                alt={companyName}
                className="h-8.75 w-8.75 object-contain"
              />
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
                  fontWeight: 700,
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

        {/* Menyu qidiruvi — super adminda 19 tagacha band bo'ladi, varaqlamasdan topish uchun */}

        {showMenuSearch && (
          <Box sx={{ position: "relative", zIndex: 2, px: 1.5, pb: 1.2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.3,
                height: 38,
                borderRadius: "11px",
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.04)",
                transition: "border-color .18s ease, background-color .18s ease",
                "&:focus-within": {
                  borderColor: "rgba(201, 168, 117,.35)",
                  background: "rgba(255,255,255,.06)",
                },
              }}
            >
              <Box
                component="span"
                aria-hidden="true"
                sx={{ color: "rgba(255,255,255,.35)", fontSize: 13, lineHeight: 1 }}
              >
                ⌕
              </Box>

              <InputBase
                value={menuQuery}
                onChange={(event) => setMenuQuery(event.target.value)}
                placeholder="Bo‘lim qidirish"
                inputProps={{ "aria-label": "Menyudan bo'lim qidirish" }}
                sx={{
                  flex: 1,
                  color: "#ffffff",
                  fontSize: 12.5,
                  fontWeight: 600,
                  "& input::placeholder": { color: "rgba(255,255,255,.32)", opacity: 1 },
                }}
              />

              {menuQuery && (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setMenuQuery("")}
                  aria-label="Qidiruvni tozalash"
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 20,
                    height: 20,
                    cursor: "pointer",
                    color: "rgba(255,255,255,.5)",
                    border: 0,
                    borderRadius: "6px",
                    background: "rgba(255,255,255,.08)",
                    fontSize: 11,
                    lineHeight: 1,
                    "&:hover": { color: "#ffffff" },
                  }}
                >
                  ×
                </Box>
              )}
            </Box>
          </Box>
        )}

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
          {searchActive && !renderedGroups.length && (
            <Typography
              sx={{
                px: 1.5,
                py: 2,
                color: "rgba(255,255,255,.4)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              «{menuQuery}» bo‘yicha bo‘lim topilmadi
            </Typography>
          )}

          {renderedGroups.map(({ group, visibleItems }) => {
            // Qidiruv paytida hamma guruh ochiq turadi — aks holda topilgan band yashirin qoladi.
            const collapsed = !searchActive && collapsedGroups.has(group.label);

            return (
              <Box
                key={group.label}
                sx={{
                  mb: collapsed ? 0.9 : 2.2,
                }}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={!collapsed}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    width: "100%",
                    // Yopiq holatda sarlavha asosiy navigatsiya bo'lib qoladi —
                    // shuning uchun u band kabi bosiladigan va o'qiladigan bo'lishi kerak.
                    minHeight: collapsed ? 42 : 28,
                    px: 1.5,
                    py: 0.6,
                    mb: collapsed ? 0 : 0.8,
                    cursor: "pointer",
                    border: "1px solid transparent",
                    borderRadius: collapsed ? "13px" : "9px",
                    background: collapsed ? "rgba(255,255,255,.035)" : "transparent",
                    textAlign: "left",
                    transition: "background-color .18s ease, border-color .18s ease",

                    "&:hover": {
                      background: "rgba(255,255,255,.075)",
                      borderColor: collapsed ? "rgba(255,255,255,.08)" : "transparent",
                    },
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      color: collapsed ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.3)",
                      fontSize: collapsed ? 12.5 : 9.5,
                      lineHeight: 1.4,
                      fontWeight: collapsed ? 750 : 900,
                      letterSpacing: collapsed ? "normal" : "0.14em",
                      textTransform: collapsed ? "none" : "uppercase",
                      transition: "color .18s ease, font-size .18s ease",
                    }}
                  >
                    {group.label}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    {/* Yopiq guruhda ichida nechta bo'lim borligi ko'rinib tursin. */}
                    {collapsed && (
                      <Typography
                        component="span"
                        sx={{
                          px: 0.8,
                          color: "rgba(255,255,255,.55)",
                          fontSize: 10,
                          fontWeight: 700,
                          lineHeight: "18px",
                          borderRadius: "7px",
                          background: "rgba(255,255,255,.08)",
                        }}
                      >
                        {visibleItems.length}
                      </Typography>
                    )}

                    <Box
                      component="span"
                      aria-hidden="true"
                      sx={{
                        color: collapsed ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.32)",
                        fontSize: 9,
                        lineHeight: 1,
                        transform: collapsed ? "rotate(-90deg)" : "none",
                        transition: "transform .18s ease",
                      }}
                    >
                      ▼
                    </Box>
                  </Box>
                </Box>

                <List disablePadding sx={{ display: collapsed ? "none" : "block" }}>
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
                          fontWeight: 600,
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
                          borderColor: "rgba(201, 168, 117,.22)",
                          background: "linear-gradient(135deg,#6e1622 0%,#8c1d2b 100%)",
                          boxShadow:
                            "0 10px 24px rgba(77, 15, 24,.34), inset 0 1px 0 rgba(255,255,255,.15)",
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
              border: "1px solid rgba(201, 168, 117,.12)",
              background: "linear-gradient(145deg,rgba(110, 22, 34,.18),rgba(255,255,255,.025))",
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
                  color: "#ecd9bd",
                  fontSize: 17,
                  background: "rgba(140, 29, 43,.18)",
                  border: "1px solid rgba(201, 168, 117,.12)",
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
                    fontWeight: 600,
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
                  fontWeight: 700,
                  bgcolor: "#6e1622",
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
                    fontWeight: 600,
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
                color: "#d9b782 !important",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "10px !important",
                backgroundColor: "rgba(140, 29, 43,.08)",

                "&:hover": {
                  color: "#ffffff !important",
                  backgroundColor: "rgba(140, 29, 43,.18) !important",
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
