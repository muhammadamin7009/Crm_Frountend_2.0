import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import {
  CompatDialog as Dialog,
  CompatDrawer as Drawer,
  CompatTextField as TextField,
} from "../UI/MuiCompat";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../../Context/AuthContext";
import {
  getMySessions,
  revokeOtherSessions,
  revokeSession,
  updateMe,
  updateUserImage,
} from "../../api/getUsers";
import {
  deleteCompanyLogo,
  updateCompanyLogo,
} from "../../api/companyBranding";
import { getWarehouses } from "../../api/inventory";
import { clearSession } from "../../utils/auth";
import { hasPermission } from "../../utils/permissions";
import { getCompanyLogoUrl } from "../../utils/company";

const roleLabels = {
  super_admin: "Super administrator",
  admin: "Administrator",
  client: "Mijoz",
  customer: "Xaridor",
  worker: "Ishchi",
};

const mobileLinks = [
  {
    label: "Bosh sahifa",
    path: "/",
  },
  {
    label: "Foydalanuvchilar",
    path: "/users",
    roles: [
      "super_admin",
      "admin",
      "worker",
    ],
    permission: "users.view",
  },
  {
    label: "Mijozlar",
    path: "/clients",
    roles: [
      "super_admin",
      "admin",
    ],
    permission: "users.view",
  },
  {
    label: "Lavozimlar",
    path: "/employees",
    roles: [
      "super_admin",
      "admin",
    ],
    permission: "employees.view",
  },
  {
    label: "Mahsulotlar",
    path: "/products",
    permission: "products.view",
  },
  {
    label: "Ish hisoboti",
    path: "/worker-outputs",
    roles: [
      "super_admin",
      "admin",
      "worker",
    ],
    permission: "production.view",
  },
  {
    label: "Oyliklar",
    path: "/worker-payments",
    roles: [
      "super_admin",
      "admin",
    ],
    permission: "payroll.view",
  },
  {
    label: "Mijoz savdo",
    path: "/client-sales",
    roles: [
      "super_admin",
      "admin",
    ],
    feature: "client_accounting",
    permission: "client_sales.view",
  },
  {
    label: "Homashyo xaridi",
    path: "/material-purchases",
    roles: [
      "super_admin",
      "admin",
    ],
    feature: "supplier_accounting",
    permission: "material_purchases.view",
  },
  {
    label: "Xarajatlar",
    path: "/expenses",
    roles: [
      "super_admin",
      "admin",
    ],
    permission: "finance.view",
  },
  {
    label: "Moliya",
    path: "/finance",
    roles: [
      "super_admin",
      "admin",
    ],
    feature: "finance",
    permission: "finance.view",
  },
  {
    label: "Amallar tarixi",
    path: "/audit-logs",
    roles: [
      "super_admin",
      "admin",
    ],
    feature: "audit_logs",
    permission: "audit_logs.view",
  },
];

const quickActionItems = [
  {
    label: "Yangi mijoz",
    description:
      "Mijozlar ro‘yxatiga o‘tish",
    path: "/clients",
    roles: [
      "super_admin",
      "admin",
    ],
    permission: "users.manage",
  },
  {
    label: "Yangi savdo",
    description:
      "Mijoz savdosini kiritish",
    path: "/client-sales",
    roles: [
      "super_admin",
      "admin",
    ],
    feature: "client_accounting",
    permission: "client_sales.manage",
  },
  {
    label: "Mahsulot qo‘shish",
    description:
      "Mahsulotlar katalogiga o‘tish",
    path: "/products",
    roles: [
      "super_admin",
      "admin",
    ],
    permission: "products.manage",
  },
  {
    label: "Ishlab chiqarish",
    description:
      "Yangi ish yozuvini kiritish",
    path: "/worker-outputs",
    roles: [
      "super_admin",
      "admin",
      "worker",
    ],
    permission: "production.manage",
  },
  {
    label: "Xarajat kiritish",
    description:
      "Mayda va umumiy xarajatlar",
    path: "/expenses",
    roles: [
      "super_admin",
      "admin",
    ],
    permission: "finance.manage",
  },
  {
    label: "Homashyo xaridi",
    description:
      "Yangi xaridni kiritish",
    path: "/material-purchases",
    roles: [
      "super_admin",
      "admin",
    ],
    feature: "supplier_accounting",
    permission:
      "material_purchases.manage",
  },
];

const getImageUrl = (path) => {
  if (!path) return undefined;

  if (path.startsWith("http")) {
    return path;
  }

  const base = String(
    import.meta.env.VITE_API_URL || "",
  ).replace(/\/$/, "");

  return `${base}${
    path.startsWith("/")
      ? path
      : `/${path}`
  }`;
};

const getInitials = (user) => {
  const first =
    user?.first_name?.[0] || "";

  const last =
    user?.last_name?.[0] || "";

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return (
    user?.username
      ?.slice(0, 2)
      ?.toUpperCase() || "AA"
  );
};

const headerDate = () =>
  new Intl.DateTimeFormat("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

const DAY_MS =
  24 * 60 * 60 * 1000;

const utcDateOnly = (value) => {
  if (!value) return null;

  const match = String(value)
    .slice(0, 10)
    .match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  if (!match) return null;

  const [year, month, day] = match
    .slice(1)
    .map(Number);

  return Date.UTC(
    year,
    month - 1,
    day,
  );
};

const getSubscriptionNotice = (
  user,
  now,
) => {
  if (
    ![
      "super_admin",
      "admin",
    ].includes(user?.role) ||
    !user?.subscription_ends_at
  ) {
    return null;
  }

  const endsAt = utcDateOnly(
    user.subscription_ends_at,
  );

  const today = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  if (endsAt === null) {
    return null;
  }

  const remainingDays = Math.round(
    (endsAt - today) / DAY_MS,
  );

  const graceDays = Number(
    user.subscription_grace_days || 7,
  );

  if (
    remainingDays >= 0 &&
    remainingDays <= 7
  ) {
    return {
      tone: "warning",
      message:
        remainingDays === 0
          ? "Obunangiz bugun tugaydi. To‘lovni yangilang."
          : `Obunangiz tugashiga ${remainingDays} kun qoldi. To‘lovni yangilang.`,
    };
  }

  if (
    remainingDays < 0 &&
    remainingDays >= -graceDays
  ) {
    const graceRemaining =
      graceDays + remainingDays;

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
  const {
    user,
    setUser,
  } = useAuth();

  const navigate = useNavigate();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    imageFile,
    setImageFile,
  ] = useState(null);

  const [
    imagePreview,
    setImagePreview,
  ] = useState("");

  const [
    sessions,
    setSessions,
  ] = useState([]);

  const [
    sessionsLoading,
    setSessionsLoading,
  ] = useState(false);

  const [
    companyLogoFile,
    setCompanyLogoFile,
  ] = useState(null);

  const [
    companyLogoPreview,
    setCompanyLogoPreview,
  ] = useState("");

  const [
    companyLogoSaving,
    setCompanyLogoSaving,
  ] = useState(false);

  const [
    warehouses,
    setWarehouses,
  ] = useState([]);

  const [
    subscriptionNow,
    setSubscriptionNow,
  ] = useState(() => new Date());

  const [
    quickActionsAnchor,
    setQuickActionsAnchor,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (
      ![
        "super_admin",
        "admin",
      ].includes(user?.role)
    ) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () =>
          setSubscriptionNow(
            new Date(),
          ),
        60 * 60 * 1000,
      );

    return () =>
      window.clearInterval(timer);
  }, [user?.role]);

  const subscriptionNotice =
    useMemo(
      () =>
        getSubscriptionNotice(
          user,
          subscriptionNow,
        ),
      [
        user,
        subscriptionNow,
      ],
    );

  const loadWarehouses =
    useCallback(async () => {
      const roleAllowed = [
        "super_admin",
        "admin",
        "worker",
      ].includes(user?.role);

      const permissionAllowed =
        hasPermission(
          user,
          "inventory.view",
        );

      if (
        !roleAllowed ||
        !permissionAllowed
      ) {
        setWarehouses([]);
        return;
      }

      try {
        const { data } =
          await getWarehouses();

        setWarehouses(
          (
            data.warehouses || []
          ).filter(
            (warehouse) =>
              warehouse.is_active !==
              false,
          ),
        );
      } catch {
        setWarehouses([]);
      }
    }, [user]);

  useEffect(() => {
    loadWarehouses();

    window.addEventListener(
      "warehouses-updated",
      loadWarehouses,
    );

    return () => {
      window.removeEventListener(
        "warehouses-updated",
        loadWarehouses,
      );
    };
  }, [loadWarehouses]);

  const resolvedMobileLinks =
    useMemo(() => {
      const canManageWarehouses =
        hasPermission(
          user,
          "inventory.warehouses",
        ) ||
        hasPermission(
          user,
          "inventory.manage",
        );

      const inventoryLinks = [
        canManageWarehouses && {
          label:
            "Omborlar boshqaruvi",
          path:
            "/inventory/warehouses",
          roles: [
            "super_admin",
            "admin",
            "worker",
          ],
          permission:
            "inventory.warehouses",
        },

        ...warehouses.map(
          (warehouse) => ({
            label: warehouse.name,
            path: `/inventory/warehouses/${warehouse.id}`,
            roles: [
              "super_admin",
              "admin",
              "worker",
            ],
            permission:
              "inventory.view",
          }),
        ),

        {
          label: "Inventarizatsiya",
          path: "/inventory/counts",
          roles: [
            "super_admin",
            "admin",
            "worker",
          ],
          permission:
            "inventory.view",
        },
      ].filter(Boolean);

      return mobileLinks.flatMap(
        (item) =>
          item.path === "/expenses"
            ? [
                ...inventoryLinks,
                item,
              ]
            : [item],
      );
    }, [
      user,
      warehouses,
    ]);

  const availableQuickActions =
    useMemo(
      () =>
        quickActionItems.filter(
          (item) =>
            (!item.roles ||
              item.roles.includes(
                user?.role,
              )) &&
            (!item.feature ||
              !user?.plan_code ||
              user?.plan_features?.includes(
                item.feature,
              )) &&
            hasPermission(
              user,
              item.permission,
            ),
        ),
      [user],
    );

  const fullName = useMemo(() => {
    const name = `${
      user?.first_name || ""
    } ${
      user?.last_name || ""
    }`.trim();

    return (
      name ||
      user?.username ||
      "Al-Amin foydalanuvchisi"
    );
  }, [user]);

  const role =
    roleLabels[user?.role] ||
    user?.role ||
    "Foydalanuvchi";

  const companyHeaderLogo =
    getCompanyLogoUrl(
      user?.company_logo_url,
    );

  const openQuickAction = (
    path,
  ) => {
    setQuickActionsAnchor(null);
    navigate(path);
  };

  const loadSessions = async () => {
    setSessionsLoading(true);

    try {
      const { data } =
        await getMySessions();

      setSessions(
        data.sessions || [],
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Qurilmalarni olishda xato.",
      );
    } finally {
      setSessionsLoading(false);
    }
  };

  const openProfile = () => {
    setForm({
      first_name:
        user?.first_name || "",
      last_name:
        user?.last_name || "",
      username:
        user?.username || "",
      phone:
        user?.phone || "",
      password: "",
    });

    setImageFile(null);
    setImagePreview("");
    setCompanyLogoFile(null);
    setCompanyLogoPreview("");
    setProfileOpen(true);

    loadSessions();
  };

  const patchStoredUser = (
    patch,
  ) => {
    const nextUser = {
      ...user,
      ...patch,
    };

    localStorage.setItem(
      "user",
      JSON.stringify(nextUser),
    );

    setUser(nextUser);
  };

  const saveCompanyLogo =
    async () => {
      if (!companyLogoFile) {
        toast.error(
          "Avval logo faylini tanlang.",
        );

        return;
      }

      setCompanyLogoSaving(true);

      try {
        const { data } =
          await updateCompanyLogo(
            companyLogoFile,
          );

        patchStoredUser({
          company_logo_url:
            data.company?.logo_url ||
            null,
        });

        setCompanyLogoFile(null);
        setCompanyLogoPreview("");

        toast.success(
          "Korxona logosi yangilandi.",
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Logoni yuklashda xato.",
        );
      } finally {
        setCompanyLogoSaving(false);
      }
    };

  const removeCompanyLogo =
    async () => {
      if (
        !window.confirm(
          "Korxona logosini o‘chirasizmi?",
        )
      ) {
        return;
      }

      setCompanyLogoSaving(true);

      try {
        await deleteCompanyLogo();

        patchStoredUser({
          company_logo_url: null,
        });

        setCompanyLogoFile(null);
        setCompanyLogoPreview("");

        toast.success(
          "Korxona logosi o‘chirildi.",
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Logoni o‘chirishda xato.",
        );
      } finally {
        setCompanyLogoSaving(false);
      }
    };

  const removeSession =
    async (session) => {
      try {
        const { data } =
          await revokeSession(
            session.id,
          );

        if (
          data.current_session_revoked
        ) {
          clearSession();

          navigate("/login", {
            replace: true,
          });

          return;
        }

        await loadSessions();

        toast.success(
          "Qurilmadan chiqildi.",
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Sessiyani yopishda xato.",
        );
      }
    };

  const removeOtherSessions =
    async () => {
      try {
        await revokeOtherSessions();
        await loadSessions();

        toast.success(
          "Boshqa barcha qurilmalardan chiqildi.",
        );
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Sessiyalarni yopishda xato.",
        );
      }
    };

  const saveProfile = async () => {
    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.username.trim()
    ) {
      toast.error(
        "Ism, familiya va username majburiy.",
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        first_name:
          form.first_name.trim(),
        last_name:
          form.last_name.trim(),
        username:
          form.username.trim(),
        phone:
          form.phone.trim() || null,
      };

      if (form.password) {
        payload.password =
          form.password;
      }

      const profileRes =
        await updateMe(payload);

      let updated =
        profileRes.data
          .updated_user ||
        profileRes.data.user ||
        {};

      if (imageFile) {
        const imageRes =
          await updateUserImage(
            imageFile,
          );

        updated = {
          ...updated,
          ...(imageRes.data.user ||
            imageRes.data
              .updated_user ||
            {}),
        };
      }

      const nextUser = {
        ...user,
        ...updated,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(nextUser),
      );

      setUser(nextUser);
      setProfileOpen(false);

      toast.success(
        "Profil yangilandi.",
      );
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Profilni yangilashda xato.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{topBarStyles}</style>

      <Box
        component="header"
        className="aa-topbar"
      >
        <Box className="aa-topbar-left">
          <Button
            onClick={() =>
              setMenuOpen(true)
            }
            className="aa-mobile-menu-button"
            aria-label="Mobil menyuni ochish"
          >
            <span />
            <span />
            <span />
          </Button>

          {companyHeaderLogo && (
            <Box
              className="aa-mobile-company-logo"
            >
              <img
                src={companyHeaderLogo}
                alt={
                  user?.company_name ||
                  "Korxona logosi"
                }
              />
            </Box>
          )}

          <Box className="aa-welcome">
            <Typography
              component="h1"
              className="aa-welcome-title"
            >
              Xush kelibsiz,{" "}
              <span>
                {user?.first_name ||
                  fullName}
              </span>
              ! 👋
            </Typography>

            <Box className="aa-welcome-meta">
              <span className="aa-online-dot" />

              <Typography>
                {headerDate()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {subscriptionNotice && (
          <Box
            role="status"
            className={`aa-subscription-notice ${
              subscriptionNotice.tone ===
              "expired"
                ? "expired"
                : "warning"
            }`}
          >
            <Box className="aa-subscription-icon">
              !
            </Box>

            <Typography>
              {subscriptionNotice.message}
            </Typography>
          </Box>
        )}

        <Box className="aa-topbar-actions">
          <Button
            disabled={
              !availableQuickActions.length
            }
            onClick={(event) =>
              setQuickActionsAnchor(
                event.currentTarget,
              )
            }
            className="aa-quick-action-button"
            aria-haspopup="menu"
            aria-expanded={Boolean(
              quickActionsAnchor,
            )}
          >
            <span className="aa-plus">
              +
            </span>

            <span>Tezkor amal</span>

            <span className="aa-arrow">
              ↓
            </span>
          </Button>

          <Menu
            anchorEl={
              quickActionsAnchor
            }
            open={Boolean(
              quickActionsAnchor,
            )}
            onClose={() =>
              setQuickActionsAnchor(
                null,
              )
            }
            slotProps={{
              paper: {
                className:
                  "aa-quick-menu",
              },
            }}
          >
            <Box className="aa-quick-menu-header">
              <Typography>
                Tezkor amallar
              </Typography>

              <Typography>
                Kerakli bo‘limga tez
                o‘ting
              </Typography>
            </Box>

            {availableQuickActions.map(
              (item, index) => (
                <MenuItem
                  key={item.path}
                  onClick={() =>
                    openQuickAction(
                      item.path,
                    )
                  }
                  className="aa-quick-menu-item"
                >
                  <Box className="aa-quick-number">
                    {String(
                      index + 1,
                    ).padStart(2, "0")}
                  </Box>

                  <Box className="aa-quick-copy">
                    <Typography>
                      {item.label}
                    </Typography>

                    <Typography>
                      {item.description}
                    </Typography>
                  </Box>

                  <span className="aa-menu-arrow">
                    →
                  </span>
                </MenuItem>
              ),
            )}
          </Menu>

          <Button
            onClick={openProfile}
            title="Profilni tahrirlash"
            className="aa-profile-button"
          >
            <Box className="aa-profile-copy">
              <Typography className="aa-profile-name">
                {fullName}
              </Typography>

              <Box className="aa-profile-role-row">
                <span className="aa-profile-status" />

                <Typography>
                  {role}
                </Typography>
              </Box>
            </Box>

            <Avatar
              src={
                imagePreview ||
                getImageUrl(
                  user?.user_image,
                )
              }
              className="aa-topbar-avatar"
            >
              {getInitials(user)}
            </Avatar>

            <span className="aa-profile-chevron">
              ⌄
            </span>
          </Button>
        </Box>
      </Box>

      <Drawer
        open={menuOpen}
        onClose={() =>
          setMenuOpen(false)
        }
        PaperProps={{
          className:
            "aa-mobile-drawer",
        }}
      >
        <Box className="aa-mobile-drawer-content">
          <Box className="aa-mobile-drawer-header">
            <Box className="aa-drawer-brand">
              {companyHeaderLogo ? (
                <img
                  src={
                    companyHeaderLogo
                  }
                  alt={
                    user?.company_name ||
                    "Korxona logosi"
                  }
                />
              ) : (
                <span>
                  {user?.company_name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "A"}
                </span>
              )}
            </Box>

            <Box className="aa-drawer-brand-copy">
              <Typography>
                {user?.company_name ||
                  "Al-Amin CRM"}
              </Typography>

              <Typography>
                Korxona boshqaruv tizimi
              </Typography>
            </Box>

            <Button
              onClick={() =>
                setMenuOpen(false)
              }
              className="aa-drawer-close"
            >
              ×
            </Button>
          </Box>

          <Divider className="aa-drawer-divider" />

          <Typography className="aa-drawer-section-title">
            Navigatsiya
          </Typography>

          <List className="aa-mobile-links">
            {resolvedMobileLinks
              .filter(
                (item) =>
                  (!item.roles ||
                    item.roles.includes(
                      user?.role,
                    )) &&
                  (!item.feature ||
                    !user?.plan_code ||
                    user?.plan_features?.includes(
                      item.feature,
                    )) &&
                  hasPermission(
                    user,
                    item.permission,
                  ),
              )
              .map(
                (
                  item,
                  index,
                ) => (
                  <ListItemButton
                    key={item.path}
                    component={NavLink}
                    to={item.path}
                    onClick={() =>
                      setMenuOpen(
                        false,
                      )
                    }
                    className="aa-mobile-link"
                  >
                    <span className="aa-mobile-link-number">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <ListItemText
                      primary={
                        item.label
                      }
                    />

                    <span className="aa-mobile-link-arrow">
                      →
                    </span>
                  </ListItemButton>
                ),
              )}
          </List>

          <Box className="aa-mobile-drawer-footer">
            <Box className="aa-mobile-user">
              <Avatar
                src={getImageUrl(
                  user?.user_image,
                )}
              >
                {getInitials(user)}
              </Avatar>

              <Box>
                <Typography>
                  {fullName}
                </Typography>

                <Typography>
                  {role}
                </Typography>
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

      <Dialog
        open={profileOpen}
        onClose={() =>
          setProfileOpen(false)
        }
        fullWidth
        maxWidth="md"
        PaperProps={{
          className:
            "aa-profile-dialog",
        }}
      >
        <DialogTitle className="aa-dialog-title">
          <Box>
            <Typography component="h2">
              Profil sozlamalari
            </Typography>

            <Typography>
              Shaxsiy ma’lumotlar va
              xavfsizlik sozlamalari
            </Typography>
          </Box>

          <Button
            onClick={() =>
              setProfileOpen(false)
            }
            className="aa-dialog-close"
          >
            ×
          </Button>
        </DialogTitle>

        <DialogContent className="aa-dialog-content">
          <Stack spacing={2.2}>
            {user?.role ===
              "super_admin" && (
              <Box className="aa-settings-card">
                <Box className="aa-settings-heading">
                  <Box>
                    <Typography>
                      Korxona logosi
                    </Typography>

                    <Typography>
                      Logo Sidebar va
                      korxona sahifalarida
                      ko‘rinadi.
                    </Typography>
                  </Box>

                  <Chip
                    label="Branding"
                    size="small"
                    className="aa-branding-chip"
                  />
                </Box>

                <Box className="aa-logo-settings">
                  <Avatar
                    variant="rounded"
                    src={
                      companyLogoPreview ||
                      getCompanyLogoUrl(
                        user?.company_logo_url,
                      ) ||
                      undefined
                    }
                    className="aa-company-logo-preview"
                  >
                    {user?.company_name
                      ?.[0]
                      ?.toUpperCase() ||
                      "K"}
                  </Avatar>

                  <Box className="aa-logo-actions">
                    <Button
                      component="label"
                      variant="outlined"
                      disabled={
                        companyLogoSaving
                      }
                      className="aa-outline-button"
                    >
                      Logo tanlash

                      <input
                        hidden
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(
                          event,
                        ) => {
                          const file =
                            event.target
                              .files?.[0];

                          if (!file) {
                            return;
                          }

                          if (
                            file.size >
                            2 *
                              1024 *
                              1024
                          ) {
                            toast.error(
                              "Logo hajmi 2 MB dan oshmasligi kerak.",
                            );

                            return;
                          }

                          setCompanyLogoFile(
                            file,
                          );

                          setCompanyLogoPreview(
                            URL.createObjectURL(
                              file,
                            ),
                          );
                        }}
                      />
                    </Button>

                    <Button
                      variant="contained"
                      disabled={
                        !companyLogoFile ||
                        companyLogoSaving
                      }
                      onClick={
                        saveCompanyLogo
                      }
                      className="aa-primary-button"
                    >
                      {companyLogoSaving
                        ? "Saqlanmoqda..."
                        : "Logoni saqlash"}
                    </Button>

                    {user?.company_logo_url && (
                      <Button
                        disabled={
                          companyLogoSaving
                        }
                        onClick={
                          removeCompanyLogo
                        }
                        className="aa-delete-button"
                      >
                        O‘chirish
                      </Button>
                    )}
                  </Box>
                </Box>

                <Typography className="aa-file-hint">
                  JPEG, PNG yoki WebP, 2
                  MB gacha
                </Typography>
              </Box>
            )}

            <Box className="aa-profile-main-card">
              <Avatar
                src={
                  imagePreview ||
                  getImageUrl(
                    user?.user_image,
                  )
                }
                className="aa-profile-large-avatar"
              >
                {form.first_name?.[0] ||
                  "U"}
              </Avatar>

              <Box className="aa-profile-main-copy">
                <Typography>
                  Profil rasmi
                </Typography>

                <Typography>
                  Profilingiz uchun aniq
                  va sifatli rasm tanlang.
                </Typography>

                <Button
                  component="label"
                  variant="outlined"
                  className="aa-outline-button"
                >
                  Rasm tanlash

                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(
                      event,
                    ) => {
                      const file =
                        event.target
                          .files?.[0];

                      if (file) {
                        setImageFile(file);

                        setImagePreview(
                          URL.createObjectURL(
                            file,
                          ),
                        );
                      }
                    }}
                  />
                </Button>
              </Box>

              <Typography className="aa-profile-image-hint">
                JPEG, PNG yoki WebP
                <br />
                5 MB gacha
              </Typography>
            </Box>

            <Box className="aa-form-grid">
              {[
                [
                  "first_name",
                  "Ism",
                ],
                [
                  "last_name",
                  "Familiya",
                ],
                [
                  "username",
                  "Foydalanuvchi nomi",
                ],
                [
                  "phone",
                  "Telefon",
                ],
              ].map(
                ([
                  field,
                  label,
                ]) => (
                  <TextField
                    key={field}
                    label={label}
                    value={
                      form[field]
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm(
                        (
                          current,
                        ) => ({
                          ...current,
                          [field]:
                            event
                              .target
                              .value,
                        }),
                      )
                    }
                    className="aa-profile-field"
                  />
                ),
              )}
            </Box>

            <TextField
              type="password"
              label="Yangi parol"
              value={form.password}
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,
                    password:
                      event.target
                        .value,
                  }),
                )
              }
              helperText="Parolni o‘zgartirmasangiz, bo‘sh qoldiring"
              className="aa-profile-field"
            />

            <Divider className="aa-profile-divider" />

            <Box className="aa-session-heading">
              <Box>
                <Typography>
                  Faol qurilmalar
                </Typography>

                <Typography>
                  Profilingiz ochiq turgan
                  brauzer va qurilmalar
                </Typography>
              </Box>

              <Button
                onClick={
                  removeOtherSessions
                }
                disabled={
                  sessionsLoading ||
                  sessions.length < 2
                }
                className="aa-delete-outline-button"
              >
                Boshqalaridan chiqish
              </Button>
            </Box>

            {sessionsLoading ? (
              <Box className="aa-sessions-loading">
                <CircularProgress
                  size={26}
                  sx={{
                    color: "#991b1b",
                  }}
                />
              </Box>
            ) : sessions.length ? (
              <Box className="aa-sessions-list">
                {sessions.map(
                  (session) => (
                    <Box
                      key={session.id}
                      className="aa-session-item"
                    >
                      <Box className="aa-session-icon">
                        {session
                          .device_name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "D"}
                      </Box>

                      <Box className="aa-session-copy">
                        <Box className="aa-session-name-row">
                          <Typography>
                            {session.device_name ||
                              "Noma’lum qurilma"}
                          </Typography>

                          {session.is_current && (
                            <Chip
                              size="small"
                              label="Hozirgi"
                              className="aa-current-chip"
                            />
                          )}
                        </Box>

                        <Typography>
                          IP:{" "}
                          {session.ip_address ||
                            "-"}
                          {" • "}
                          Oxirgi faollik:{" "}
                          {new Date(
                            session.last_used_at,
                          ).toLocaleString(
                            "uz-UZ",
                          )}
                        </Typography>
                      </Box>

                      <Button
                        onClick={() =>
                          removeSession(
                            session,
                          )
                        }
                        className="aa-session-logout"
                      >
                        Chiqish
                      </Button>
                    </Box>
                  ),
                )}
              </Box>
            ) : (
              <Box className="aa-empty-sessions">
                <Typography>
                  Faol sessiya topilmadi.
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions className="aa-dialog-actions">
          <Button
            onClick={() =>
              setProfileOpen(false)
            }
            className="aa-cancel-button"
          >
            Bekor qilish
          </Button>

          <Button
            onClick={saveProfile}
            disabled={saving}
            className="aa-save-button"
          >
            {saving
              ? "Saqlanmoqda..."
              : "O‘zgarishlarni saqlash"}
          </Button>
        </DialogActions>
      </Dialog>
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
    border: 1px solid rgba(15, 23, 42, 0.075);
    border-radius: 22px;
    background:
      radial-gradient(
        circle at 92% 0%,
        rgba(153, 27, 27, 0.055),
        transparent 24%
      ),
      rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(22px);
    box-shadow:
      0 12px 34px rgba(15, 23, 42, 0.055),
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
        #7f1d1d,
        #dc2626
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
      1px solid rgba(153, 27, 27, 0.13) !important;
    background:
      rgba(153, 27, 27, 0.055) !important;
  }

  .aa-mobile-menu-button span {
    width: 17px;
    height: 2px;
    border-radius: 8px;
    background: #991b1b;
  }

  .aa-mobile-company-logo {
    display: none;
    width: 44px;
    height: 44px;
    padding: 5px;
    overflow: hidden;
    border:
      1px solid #e2e8f0;
    border-radius: 13px;
    background: #ffffff;
  }

  .aa-mobile-company-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .aa-welcome {
    min-width: 0;
  }

  .aa-welcome-title {
    margin: 0 !important;
    color: #111827;
    font-size: 21px !important;
    line-height: 1.15 !important;
    font-weight: 900 !important;
    letter-spacing: -0.025em !important;
    white-space: nowrap;
  }

  .aa-welcome-title span {
    color: #7f1d1d;
  }

  .aa-welcome-meta {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .aa-welcome-meta p {
    color: #7b8494;
    font-size: 12px;
    line-height: 1;
    font-weight: 650;
    text-transform: capitalize;
  }

  .aa-online-dot {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #22c55e;
    box-shadow:
      0 0 0 4px rgba(34, 197, 94, 0.1);
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
      1px solid rgba(217, 119, 6, 0.21);
    background:
      rgba(255, 251, 235, 0.93);
  }

  .aa-subscription-notice.expired {
    border:
      1px solid rgba(220, 38, 38, 0.2);
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
    font-weight: 950;
  }

  .aa-subscription-notice.warning
  .aa-subscription-icon {
    color: #92400e;
    background:
      rgba(245, 158, 11, 0.13);
  }

  .aa-subscription-notice.expired
  .aa-subscription-icon {
    color: #b91c1c;
    background:
      rgba(220, 38, 38, 0.1);
  }

  .aa-subscription-notice p {
    font-size: 12px;
    line-height: 1.4;
    font-weight: 800;
  }

  .aa-subscription-notice.warning p {
    color: #92400e;
  }

  .aa-subscription-notice.expired p {
    color: #b91c1c;
  }

  .aa-topbar-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 11px;
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
    font-weight: 850 !important;
    background:
      linear-gradient(
        135deg,
        #7f1d1d 0%,
        #b91c1c 100%
      ) !important;
    box-shadow:
      0 11px 24px rgba(127, 29, 29, 0.22) !important;
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease !important;
  }

  .aa-quick-action-button:hover {
    transform: translateY(-1px);
    box-shadow:
      0 15px 29px rgba(127, 29, 29, 0.27) !important;
  }

  .aa-quick-action-button.Mui-disabled {
    color:
      rgba(255, 255, 255, 0.65) !important;
    background: #cbd5e1 !important;
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
      1px solid rgba(15, 23, 42, 0.085);
    border-radius: 18px !important;
    background:
      rgba(255, 255, 255, 0.97) !important;
    backdrop-filter: blur(20px);
    box-shadow:
      0 22px 60px rgba(15, 23, 42, 0.15) !important;
  }

  .aa-quick-menu-header {
    margin-bottom: 5px;
    padding: 11px 12px 12px;
    border-bottom:
      1px solid rgba(15, 23, 42, 0.07);
  }

  .aa-quick-menu-header p:first-child {
    color: #111827;
    font-size: 14px;
    font-weight: 900;
  }

  .aa-quick-menu-header p:last-child {
    margin-top: 4px;
    color: #8a94a3;
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
    background:
      rgba(153, 27, 27, 0.055) !important;
  }

  .aa-quick-number {
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    border-radius: 10px;
    color: #991b1b;
    font-size: 10px;
    font-weight: 900;
    background:
      rgba(153, 27, 27, 0.075);
  }

  .aa-quick-copy {
    min-width: 0;
    flex: 1;
  }

  .aa-quick-copy p:first-child {
    color: #111827;
    font-size: 13px;
    font-weight: 850;
  }

  .aa-quick-copy p:last-child {
    margin-top: 3px;
    color: #8a94a3;
    font-size: 11px;
  }

  .aa-menu-arrow {
    color: #a4acb8;
    font-size: 16px;
  }

  .aa-profile-button {
    min-width: 0 !important;
    height: 54px;
    padding: 5px 7px 5px 12px !important;
    gap: 11px;
    border:
      1px solid rgba(15, 23, 42, 0.075) !important;
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
      rgba(153, 27, 27, 0.12) !important;
    background:
      rgba(153, 27, 27, 0.045) !important;
  }

  .aa-profile-copy {
    min-width: 0;
    max-width: 165px;
    text-align: right;
  }

  .aa-profile-name {
    overflow: hidden;
    color: #111827;
    font-size: 12.5px !important;
    line-height: 1.2 !important;
    font-weight: 900 !important;
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
    color: #7b8494;
    font-size: 10.5px;
    line-height: 1;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aa-profile-status {
    width: 6px;
    height: 6px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #22c55e;
  }

  .aa-topbar-avatar {
    width: 42px !important;
    height: 42px !important;
    flex: 0 0 auto;
    color: #ffffff !important;
    font-size: 14px !important;
    font-weight: 900 !important;
    background:
      linear-gradient(
        135deg,
        #7f1d1d,
        #c81e2a
      ) !important;
    border:
      2px solid rgba(255, 255, 255, 0.9);
    box-shadow:
      0 8px 17px rgba(127, 29, 29, 0.17);
  }

  .aa-profile-chevron {
    margin: 0 4px 0 -3px;
    color: #8a94a3;
    font-size: 15px;
  }

  .aa-mobile-drawer {
    width: 300px !important;
    color: #ffffff !important;
    background:
      radial-gradient(
        circle at 100% 0%,
        rgba(185, 28, 28, 0.24),
        transparent 27%
      ),
      linear-gradient(
        180deg,
        #11151c,
        #090c11
      ) !important;
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
    color: #991b1b;
    border-radius: 14px;
    background: #ffffff;
    font-size: 18px;
    font-weight: 950;
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
    color: #ffffff;
    font-size: 14px;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aa-drawer-brand-copy p:last-child {
    margin-top: 4px;
    color:
      rgba(255, 255, 255, 0.4);
    font-size: 10.5px;
  }

  .aa-drawer-close,
  .aa-dialog-close {
    min-width: 37px !important;
    width: 37px;
    height: 37px;
    padding: 0 !important;
    border-radius: 11px !important;
    color:
      rgba(255, 255, 255, 0.65) !important;
    font-size: 24px !important;
    background:
      rgba(255, 255, 255, 0.055) !important;
  }

  .aa-drawer-divider {
    margin: 18px 0 !important;
    border-color:
      rgba(255, 255, 255, 0.075) !important;
  }

  .aa-drawer-section-title {
    padding: 0 10px;
    color:
      rgba(255, 255, 255, 0.3);
    font-size: 9px !important;
    font-weight: 900 !important;
    letter-spacing: 0.14em !important;
    text-transform: uppercase;
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
    color:
      rgba(255, 255, 255, 0.62) !important;
    border-radius: 12px !important;
  }

  .aa-mobile-link:hover {
    color: #ffffff !important;
    background:
      rgba(255, 255, 255, 0.055) !important;
  }

  .aa-mobile-link.active {
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #991b1b,
        #c81e2a
      ) !important;
  }

  .aa-mobile-link-number {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    color:
      rgba(255, 255, 255, 0.45);
    font-size: 9px;
    font-weight: 900;
    background:
      rgba(255, 255, 255, 0.05);
  }

  .aa-mobile-link
  .MuiListItemText-primary {
    color: inherit;
    font-size: 13px;
    font-weight: 750;
  }

  .aa-mobile-link-arrow {
    color:
      rgba(255, 255, 255, 0.28);
  }

  .aa-mobile-drawer-footer {
    margin-top: 20px;
    padding: 13px;
    border:
      1px solid rgba(255, 255, 255, 0.075);
    border-radius: 16px;
    background:
      rgba(255, 255, 255, 0.035);
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
    font-weight: 900;
    background: #991b1b;
  }

  .aa-mobile-user p:first-child {
    color: #ffffff;
    font-size: 12.5px;
    font-weight: 850;
  }

  .aa-mobile-user p:last-child {
    margin-top: 4px;
    color:
      rgba(255, 255, 255, 0.4);
    font-size: 10px;
  }

  .aa-mobile-logout {
    width: 100%;
    min-height: 37px !important;
    margin-top: 11px !important;
    color: #fca5a5 !important;
    border-radius: 10px !important;
    text-transform: none !important;
    font-size: 12px !important;
    font-weight: 800 !important;
    background:
      rgba(220, 38, 38, 0.09) !important;
  }

  .aa-profile-dialog {
    overflow: hidden;
    border:
      1px solid rgba(15, 23, 42, 0.08);
    border-radius: 23px !important;
    background: #f7f8fa !important;
    box-shadow:
      0 28px 80px rgba(15, 23, 42, 0.2) !important;
  }

  .aa-dialog-title {
    padding: 21px 24px !important;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #ffffff;
    background:
      radial-gradient(
        circle at 100% 0%,
        rgba(239, 68, 68, 0.25),
        transparent 32%
      ),
      linear-gradient(
        135deg,
        #11151c,
        #321319
      );
  }

  .aa-dialog-title h2 {
    color: #ffffff;
    font-size: 19px;
    line-height: 1.2;
    font-weight: 900;
  }

  .aa-dialog-title p {
    margin-top: 6px;
    color:
      rgba(255, 255, 255, 0.48);
    font-size: 11.5px;
  }

  .aa-dialog-content {
    padding: 22px !important;
  }

  .aa-settings-card {
    padding: 18px;
    border:
      1px solid rgba(15, 23, 42, 0.075);
    border-radius: 17px;
    background: #ffffff;
    box-shadow:
      0 8px 24px rgba(15, 23, 42, 0.035);
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
    color: #111827;
    font-size: 14px;
    font-weight: 900;
  }

  .aa-settings-heading
  > div
  > p:last-child {
    margin-top: 5px;
    color: #7b8494;
    font-size: 11.5px;
  }

  .aa-branding-chip {
    height: 24px !important;
    color: #991b1b !important;
    font-size: 10px !important;
    font-weight: 850 !important;
    background:
      rgba(153, 27, 27, 0.07) !important;
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
    color: #991b1b !important;
    font-size: 20px !important;
    font-weight: 900 !important;
    border:
      1px solid #e2e8f0;
    border-radius: 17px !important;
    background: #f8fafc !important;
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
    font-weight: 850 !important;
  }

  .aa-outline-button {
    color: #991b1b !important;
    border-color:
      rgba(153, 27, 27, 0.2) !important;
  }

  .aa-primary-button,
  .aa-save-button {
    color: #ffffff !important;
    background:
      linear-gradient(
        135deg,
        #7f1d1d,
        #b91c1c
      ) !important;
    box-shadow:
      0 9px 20px rgba(127, 29, 29, 0.18) !important;
  }

  .aa-delete-button {
    color: #dc2626 !important;
    background:
      rgba(220, 38, 38, 0.055) !important;
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
      1px solid rgba(15, 23, 42, 0.075);
    border-radius: 17px;
    background:
      linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.98),
        rgba(248, 250, 252, 0.94)
      );
  }

  .aa-profile-large-avatar {
    width: 70px !important;
    height: 70px !important;
    flex: 0 0 auto;
    color: #ffffff !important;
    font-size: 21px !important;
    font-weight: 900 !important;
    background:
      linear-gradient(
        135deg,
        #7f1d1d,
        #c81e2a
      ) !important;
    box-shadow:
      0 11px 25px rgba(127, 29, 29, 0.18);
  }

  .aa-profile-main-copy {
    min-width: 0;
    flex: 1;
  }

  .aa-profile-main-copy
  > p:first-child {
    color: #111827;
    font-size: 14px;
    font-weight: 900;
  }

  .aa-profile-main-copy
  > p:nth-child(2) {
    margin: 5px 0 10px;
    color: #7b8494;
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
    background: #ffffff;
  }

  .aa-profile-field
  .MuiOutlinedInput-notchedOutline {
    border-color: #dde3ea;
  }

  .aa-profile-field
  .MuiOutlinedInput-root:hover
  .MuiOutlinedInput-notchedOutline {
    border-color: #aab2be;
  }

  .aa-profile-field
  .MuiOutlinedInput-root.Mui-focused {
    box-shadow:
      0 0 0 4px rgba(153, 27, 27, 0.07);
  }

  .aa-profile-field
  .MuiOutlinedInput-root.Mui-focused
  .MuiOutlinedInput-notchedOutline {
    border-color: #991b1b;
    border-width: 1px;
  }

  .aa-profile-field
  .MuiInputLabel-root.Mui-focused {
    color: #991b1b;
  }

  .aa-profile-divider {
    border-color:
      rgba(15, 23, 42, 0.075) !important;
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
    color: #111827;
    font-size: 14px;
    font-weight: 900;
  }

  .aa-session-heading
  > div
  > p:last-child {
    margin-top: 4px;
    color: #7b8494;
    font-size: 11.5px;
  }

  .aa-delete-outline-button {
    color: #dc2626 !important;
    border:
      1px solid rgba(220, 38, 38, 0.17) !important;
    background:
      rgba(220, 38, 38, 0.035) !important;
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
      1px solid rgba(15, 23, 42, 0.075);
    border-radius: 14px;
    background: #ffffff;
  }

  .aa-session-icon {
    width: 37px;
    height: 37px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    color: #991b1b;
    border-radius: 11px;
    font-size: 12px;
    font-weight: 900;
    background:
      rgba(153, 27, 27, 0.07);
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
    color: #111827;
    font-size: 12.5px;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .aa-current-chip {
    height: 21px !important;
    color: #15803d !important;
    font-size: 9px !important;
    font-weight: 850 !important;
    background:
      rgba(34, 197, 94, 0.1) !important;
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
    color: #dc2626 !important;
    border-radius: 9px !important;
    text-transform: none !important;
    font-size: 11px !important;
    font-weight: 800 !important;
    background:
      rgba(220, 38, 38, 0.045) !important;
  }

  .aa-empty-sessions {
    padding: 25px;
    text-align: center;
    border:
      1px dashed #d8dee7;
    border-radius: 14px;
    background:
      rgba(255, 255, 255, 0.55);
  }

  .aa-empty-sessions p {
    color: #8a94a3;
    font-size: 12px;
  }

  .aa-dialog-actions {
    padding: 16px 22px 20px !important;
    gap: 9px;
    border-top:
      1px solid rgba(15, 23, 42, 0.065);
    background: #ffffff;
  }

  .aa-cancel-button {
    color: #64748b !important;
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

  @media (max-width: 900px) {
    .aa-topbar {
      width: calc(100% - 20px);
      min-height: 76px;
      margin: 10px 10px 0;
      padding: 11px 12px;
      gap: 10px;
      border-radius: 18px;
    }

    .aa-mobile-menu-button {
      display: flex !important;
    }

    .aa-mobile-company-logo {
      display: block;
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
      min-width: 45px !important;
      width: 45px;
      padding: 0 !important;
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

    .aa-profile-chevron {
      display: none;
    }
  }

  @media (max-width: 640px) {
    .aa-mobile-company-logo {
      display: none;
    }

    .aa-welcome-title {
      max-width: 180px;
      overflow: hidden;
      font-size: 15px !important;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .aa-welcome-meta p {
      max-width: 170px;
      overflow: hidden;
      font-size: 10px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

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
      flex-direction: column-reverse;
    }

    .aa-cancel-button,
    .aa-save-button {
      width: 100%;
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

    .aa-quick-action-button {
      min-width: 40px !important;
      width: 40px;
      height: 40px;
    }

    .aa-profile-button {
      height: 42px;
    }

    .aa-topbar-avatar {
      width: 38px !important;
      height: 38px !important;
    }
  }
`;
