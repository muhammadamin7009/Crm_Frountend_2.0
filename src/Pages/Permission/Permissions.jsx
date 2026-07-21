import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";

import { getPermissionSettings, updateUserPermissions } from "../../api/permissions";

const presets = [
  {
    label: "Omborchi",
    roles: ["worker"],

    description: "Ombor qoldig‘i, kirim-chiqim va inventarizatsiya bilan ishlaydi.",

    permissions: ["inventory.view", "inventory.movements", "inventory.count"],
  },

  {
    label: "Ishlab chiqarish admini",
    roles: ["admin"],

    description:
      "Hodim, mahsulot va ish hisobotlarini yuritadi. Moliyaviy ma’lumotlar yopiq qoladi.",

    permissions: [
      "dashboard.view",
      "users.view",
      "products.view",
      "production.view",
      "production.manage",
      "payroll.view",
    ],
  },

  {
    label: "Savdo admini",
    roles: ["admin"],

    description: "Mijoz savdosi va mijoz to‘lovlarini yuritadi.",

    permissions: ["dashboard.view", "products.view", "client_sales.view", "client_sales.manage"],
  },

  {
    label: "Homashyo admini",
    roles: ["admin"],

    description: "Ta’minotchi, homashyo xaridi va to‘lovlarini yuritadi.",

    permissions: ["dashboard.view", "material_purchases.view", "material_purchases.manage"],
  },

  {
    label: "Hisobchi",
    roles: ["admin"],

    description: "Oylik, kassa, xarajat va moliyaviy hisobotlarni ko‘radi va yuritadi.",

    permissions: [
      "dashboard.view",
      "dashboard.finance",
      "payroll.view",
      "payroll.manage",
      "client_sales.view",
      "material_purchases.view",
      "finance.view",
      "finance.manage",
    ],
  },
];

const roleNames = {
  super_admin: "Super administrator",
  admin: "Administrator",
  worker: "Omborchi",
};

const getFullName = (user) => `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

const getImageUrl = (path) => {
  if (!path) return undefined;

  if (path.startsWith("http")) {
    return path;
  }

  const baseUrl = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const getRequiredViewPermission = (key) => {
  if (!key?.endsWith(".manage")) {
    return null;
  }

  return key.replace(".manage", ".view");
};

const getManagePermission = (key) => {
  if (!key?.endsWith(".view")) {
    return null;
  }

  return key.replace(".view", ".manage");
};

const normalizePermissions = (permissions = []) => {
  const current = new Set(permissions.filter(Boolean));

  [...current].forEach((key) => {
    const viewKey = getRequiredViewPermission(key);

    if (viewKey) {
      current.add(viewKey);
    }

    if (key.startsWith("inventory.") && key !== "inventory.view") {
      current.add("inventory.view");
    }
  });

  return [...current];
};

const getInitials = (user) => {
  const first = user?.first_name?.[0] || "";

  const last = user?.last_name?.[0] || "";

  const username = user?.username?.[0] || "";

  return `${first}${last}`.toUpperCase() || username.toUpperCase() || "U";
};

const Card = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid #e4e9ef",
      backgroundColor: "#ffffff",

      boxShadow: "0 14px 40px rgba(15,23,42,.045)",

      ...sx,
    }}
  >
    {children}
  </Paper>
);

const HeroMetric = ({ label, value, helper, tone = "red" }) => {
  const tones = {
    red: ["#fecdd3", "rgba(220,38,38,.15)", "rgba(248,113,113,.15)"],

    green: ["#bbf7d0", "rgba(34,197,94,.14)", "rgba(74,222,128,.15)"],

    blue: ["#bfdbfe", "rgba(37,99,235,.15)", "rgba(96,165,250,.15)"],

    amber: ["#fde68a", "rgba(245,158,11,.15)", "rgba(251,191,36,.15)"],
  };

  const current = tones[tone] || tones.red;

  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: 126,
        p: 1.8,
        borderRadius: "18px",

        border: "1px solid rgba(255,255,255,.075)",

        background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",

        backdropFilter: "blur(16px)",
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          display: "grid",
          placeItems: "center",
          borderRadius: "11px",
          color: current[0],

          backgroundColor: current[1],

          border: `1px solid ${current[2]}`,

          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.35,

          color: "rgba(255,255,255,.44) !important",

          fontSize: 9.5,
          fontWeight: 750,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.6,
          color: "#ffffff !important",
          fontSize: 18,
          lineHeight: 1.2,
          fontWeight: 950,
          letterSpacing: "-.035em",
        }}
      >
        {value}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.55,

          color: "rgba(255,255,255,.28) !important",

          fontSize: 9,
        }}
      >
        {helper}
      </Typography>
    </Box>
  );
};

const RoleChip = ({ role, dark = false }) => {
  const worker = role === "worker";

  return (
    <Chip
      size="small"
      label={roleNames[role] || role || "Foydalanuvchi"}
      sx={{
        height: 25,
        px: 0.3,

        color: dark
          ? worker
            ? "#fde68a !important"
            : "#bfdbfe !important"
          : worker
            ? "#b45309"
            : "#1d4ed8",

        fontSize: 9.5,
        fontWeight: 900,

        backgroundColor: dark
          ? worker
            ? "rgba(245,158,11,.14) !important"
            : "rgba(37,99,235,.14) !important"
          : worker
            ? "rgba(245,158,11,.09)"
            : "rgba(37,99,235,.08)",

        border: dark
          ? worker
            ? "1px solid rgba(251,191,36,.15)"
            : "1px solid rgba(96,165,250,.15)"
          : worker
            ? "1px solid rgba(245,158,11,.18)"
            : "1px solid rgba(37,99,235,.16)",
      }}
    />
  );
};

const PresetCard = ({ preset, onClick }) => (
  <Button
    fullWidth
    variant="outlined"
    onClick={onClick}
    sx={{
      minHeight: 116,
      p: 1.6,

      display: "flex",
      alignItems: "flex-start",
      justifyContent: "flex-start",

      color: "#334155",
      textAlign: "left",
      borderRadius: "17px",
      borderColor: "#e4e9ef",
      textTransform: "none",

      background: "linear-gradient(145deg,#ffffff,#f8fafc)",

      transition: "transform .2s ease, border-color .2s ease, box-shadow .2s ease",

      "&:hover": {
        color: "#991b1b",

        transform: "translateY(-2px)",

        borderColor: "rgba(153,27,27,.20)",

        background: "linear-gradient(145deg,rgba(153,27,27,.045),#ffffff)",

        boxShadow: "0 14px 30px rgba(15,23,42,.07)",
      },
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Box
        sx={{
          width: 34,
          height: 34,

          display: "grid",
          placeItems: "center",

          color: "#ffffff",
          borderRadius: "11px",

          background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",

          boxShadow: "0 8px 18px rgba(127,29,29,.18)",

          fontSize: 12,
          fontWeight: 950,
        }}
      >
        {preset.label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.15,
          color: "inherit",
          fontSize: 11.5,
          fontWeight: 950,
        }}
      >
        {preset.label}
      </Typography>

      <Typography
        sx={{
          mt: 0.55,
          color: "#94a3b8",
          fontSize: 9.5,
          lineHeight: 1.55,
        }}
      >
        {preset.description}
      </Typography>
    </Box>
  </Button>
);

const PermissionGroup = ({ group, selectedSet, togglePermission, toggleGroup }) => {
  const keys = group.permissions.map((permission) => permission.key);

  const checkedCount = keys.filter((key) => selectedSet.has(key)).length;

  const allSelected = keys.length > 0 && checkedCount === keys.length;

  const completion = keys.length > 0 ? Math.round((checkedCount / keys.length) * 100) : 0;

  return (
    <Card
      sx={{
        p: 2,

        transition: "transform .2s ease, box-shadow .2s ease",

        "&:hover": {
          transform: "translateY(-2px)",

          boxShadow: "0 18px 40px rgba(15,23,42,.07)",
        },
      }}
    >
      <Box
        sx={{
          mb: 1.7,
          display: "flex",
          alignItems: "flex-start",

          justifyContent: "space-between",

          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#0f172a",
              fontSize: 13,
              fontWeight: 950,
            }}
          >
            {group.group}
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              color: "#94a3b8",
              fontSize: 9.5,
            }}
          >
            {checkedCount} / {keys.length} ruxsat yoqilgan
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          onClick={() => toggleGroup(group)}
          sx={{
            minWidth: 88,
            borderRadius: "10px",
            color: allSelected ? "#b91c1c" : "#64748b",

            borderColor: allSelected ? "rgba(220,38,38,.20)" : "#dce3ea",

            fontSize: 9.5,
            fontWeight: 900,
            textTransform: "none",

            "&:hover": {
              color: "#991b1b",

              borderColor: "rgba(153,27,27,.25)",

              backgroundColor: "rgba(153,27,27,.04)",
            },
          }}
        >
          {allSelected ? "O‘chirish" : "Hammasi"}
        </Button>
      </Box>

      <LinearProgress
        variant="determinate"
        value={completion}
        sx={{
          mb: 1.8,
          height: 7,
          borderRadius: 99,
          backgroundColor: "#edf1f5",

          "& .MuiLinearProgress-bar": {
            borderRadius: 99,

            background:
              completion === 100
                ? "linear-gradient(90deg,#15803d,#22c55e)"
                : "linear-gradient(90deg,#7f1d1d,#dc2626)",
          },
        }}
      />

      <Stack spacing={1}>
        {group.permissions.map((permission) => {
          const checked = selectedSet.has(permission.key);

          return (
            <Box
              key={permission.key}
              onClick={() => togglePermission(permission.key)}
              sx={{
                p: 1.3,
                cursor: "pointer",
                borderRadius: "14px",

                border: checked ? "1px solid rgba(153,27,27,.17)" : "1px solid #e7ebf0",

                backgroundColor: checked ? "rgba(153,27,27,.045)" : "#f8fafc",

                transition: "background-color .2s ease, border-color .2s ease",

                "&:hover": {
                  borderColor: "rgba(153,27,27,.22)",

                  backgroundColor: "rgba(153,27,27,.04)",
                },
              }}
            >
              <FormControlLabel
                onClick={(event) => event.stopPropagation()}
                control={
                  <Checkbox
                    checked={checked}
                    onChange={() => togglePermission(permission.key)}
                    sx={{
                      mt: -0.4,
                      color: "#cbd5e1",

                      "&.Mui-checked": {
                        color: "#991b1b",
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography
                      sx={{
                        color: checked ? "#991b1b" : "#334155",

                        fontSize: 10.5,
                        fontWeight: 900,
                      }}
                    >
                      {permission.label}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,
                        color: "#94a3b8",
                        fontSize: 9.2,
                        lineHeight: 1.55,
                      }}
                    >
                      {permission.description}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.5,
                        color: "#c0cad6",
                        fontSize: 8.5,
                        fontWeight: 750,
                      }}
                    >
                      {permission.key}
                    </Typography>
                  </Box>
                }
                sx={{
                  m: 0,
                  width: "100%",
                  alignItems: "flex-start",

                  "& .MuiFormControlLabel-label": {
                    flex: 1,
                  },
                }}
              />
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
};

const Permissions = () => {
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [admins, setAdmins] = useState([]);

  const [groups, setGroups] = useState([]);

  const [selectedId, setSelectedId] = useState(null);

  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [query, setQuery] = useState("");

  const selectedAdmin = useMemo(
    () => admins.find((admin) => Number(admin.id) === Number(selectedId)),

    [admins, selectedId],
  );

  const selectedSet = useMemo(
    () => new Set(selectedPermissions),

    [selectedPermissions],
  );

  const visibleGroups = useMemo(() => {
    if (selectedAdmin?.role !== "worker") {
      return groups;
    }

    return groups
      .filter((group) => group.group === "Ombor")
      .map((group) => ({
        ...group,

        permissions: group.permissions.filter(
          (permission) => permission.key !== "inventory.manage",
        ),
      }));
  }, [groups, selectedAdmin]);

  const visiblePresets = useMemo(
    () => presets.filter((preset) => preset.roles.includes(selectedAdmin?.role)),

    [selectedAdmin],
  );

  const filteredAdmins = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return admins;
    }

    return admins.filter((admin) => {
      const text = [getFullName(admin), admin.username, admin.role, roleNames[admin.role]]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }, [admins, query]);

  const totalVisiblePermissions = useMemo(
    () =>
      visibleGroups.reduce(
        (sum, group) => sum + group.permissions.length,

        0,
      ),

    [visibleGroups],
  );

  const selectedVisiblePermissions = useMemo(() => {
    const visibleKeys = new Set(
      visibleGroups.flatMap((group) => group.permissions.map((permission) => permission.key)),
    );

    return selectedPermissions.filter((key) => visibleKeys.has(key)).length;
  }, [selectedPermissions, visibleGroups]);

  const permissionPercent =
    totalVisiblePermissions > 0
      ? Math.round((selectedVisiblePermissions / totalVisiblePermissions) * 100)
      : 0;

  const savedPermissions = useMemo(
    () => normalizePermissions(selectedAdmin?.permissions || []).sort(),

    [selectedAdmin],
  );

  const currentPermissions = useMemo(
    () => normalizePermissions(selectedPermissions).sort(),

    [selectedPermissions],
  );

  const hasChanges = JSON.stringify(savedPermissions) !== JSON.stringify(currentPermissions);

  const fetchSettings = async () => {
    setLoading(true);

    try {
      const { data } = await getPermissionSettings();

      const users = data.users || data.admins || [];

      setAdmins(users);
      setGroups(data.groups || []);

      const firstAdmin = users[0];

      setSelectedId(firstAdmin?.id || null);

      setSelectedPermissions(normalizePermissions(firstAdmin?.permissions || []));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ruxsatlarni olishda xato.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const selectAdmin = (admin) => {
    if (saving) return;

    setSelectedId(admin.id);

    setSelectedPermissions(normalizePermissions(admin.permissions || []));
  };

  const togglePermission = (key) => {
    setSelectedPermissions((previous) => {
      const current = new Set(previous);

      if (current.has(key)) {
        current.delete(key);

        const manageKey = getManagePermission(key);

        if (manageKey) {
          current.delete(manageKey);
        }

        if (key === "inventory.view") {
          [...current]
            .filter((permission) => permission.startsWith("inventory."))
            .forEach((permission) => current.delete(permission));
        }
      } else {
        current.add(key);

        const viewKey = getRequiredViewPermission(key);

        if (viewKey) {
          current.add(viewKey);
        }
      }

      return normalizePermissions([...current]);
    });
  };

  const toggleGroup = (group) => {
    const keys = group.permissions.map((permission) => permission.key);

    const allSelected = keys.every((key) => selectedSet.has(key));

    setSelectedPermissions((previous) => {
      const current = new Set(previous);

      keys.forEach((key) => {
        if (allSelected) {
          current.delete(key);

          const manageKey = getManagePermission(key);

          if (manageKey) {
            current.delete(manageKey);
          }
        } else {
          current.add(key);
        }
      });

      return normalizePermissions([...current]);
    });
  };

  const applyPreset = (preset) => {
    setSelectedPermissions(normalizePermissions(preset.permissions));

    toast.info(`“${preset.label}” shabloni tanlandi. Saqlashni unutmang.`);
  };

  const clearPermissions = () => {
    setSelectedPermissions([]);
  };

  const restorePermissions = () => {
    setSelectedPermissions(normalizePermissions(selectedAdmin?.permissions || []));
  };

  const handleSave = async () => {
    if (!selectedAdmin) {
      return;
    }

    setSaving(true);

    try {
      const permissions = normalizePermissions(selectedPermissions);

      const { data } = await updateUserPermissions(selectedAdmin.id, permissions);

      const saved = data.permissions || permissions;

      toast.success(data.message || "Ruxsatlar saqlandi.");

      setAdmins((previous) =>
        previous.map((admin) =>
          Number(admin.id) === Number(selectedAdmin.id)
            ? {
                ...admin,
                permissions: saved,
              }
            : admin,
        ),
      );

      setSelectedPermissions(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ruxsatlarni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 430,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            display: "grid",
            placeItems: "center",
            borderRadius: "22px",

            border: "1px solid rgba(153,27,27,.10)",

            backgroundColor: "rgba(153,27,27,.05)",
          }}
        >
          <CircularProgress
            size={34}
            thickness={4.5}
            sx={{
              color: "#991b1b",
            }}
          />
        </Box>

        <Typography
          sx={{
            color: "#94a3b8",
            fontSize: 12.5,
            fontWeight: 750,
          }}
        >
          Ruxsatlar yuklanmoqda...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      className="crm-page permissions-page"
      sx={{
        height: "100%",
        minHeight: 0,
        pb: 3,
        overflowY: "auto",
      }}
    >
      <style>{permissionsPageStyles}</style>

      <Box
        component="section"
        className="permissions-hero"
        sx={{
          position: "relative",
          isolation: "isolate",
          mb: 2,

          p: {
            xs: 2.5,
            md: 3,
          },

          overflow: "hidden",
          color: "#ffffff",
          borderRadius: "25px",

          border: "1px solid rgba(255,255,255,.075)",

          backgroundColor: "#0d1117 !important",

          backgroundImage:
            "radial-gradient(circle at 100% 0%,rgba(220,38,38,.34),transparent 30%),linear-gradient(145deg,#0d1117,#171117 52%,#3a121a) !important",

          boxShadow: "0 24px 60px rgba(15,23,42,.20)",

          "&::before": {
            content: '""',
            position: "absolute",
            width: 390,
            height: 390,
            top: -275,
            right: -210,
            borderRadius: "50%",

            border: "1px solid rgba(248,113,113,.16)",

            boxShadow: "0 0 0 62px rgba(248,113,113,.022),0 0 0 124px rgba(248,113,113,.014)",

            pointerEvents: "none",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              xl: ".78fr 1.22fr",
            },

            gap: 3,
            alignItems: "center",
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.1,
              }}
            >
              <Box
                sx={{
                  width: 25,
                  height: 2,
                  borderRadius: 99,

                  background: "linear-gradient(90deg,#fb7185,#ef4444)",
                }}
              />

              <Typography
                sx={{
                  color: "#fecdd3 !important",

                  fontSize: 10,
                  fontWeight: 950,
                  letterSpacing: ".13em",
                  textTransform: "uppercase",
                }}
              >
                Xavfsizlik va nazorat
              </Typography>
            </Box>

            <Typography
              component="h1"
              sx={{
                mt: 1.5,

                color: "#ffffff !important",

                fontSize: {
                  xs: 29,
                  md: 36,
                },

                lineHeight: 1.08,
                fontWeight: 950,
                letterSpacing: "-.045em",
              }}
            >
              Ruxsatlar
            </Typography>

            <Typography
              sx={{
                maxWidth: 555,
                mt: 1.4,

                color: "rgba(255,255,255,.45) !important",

                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Administrator va omborchilarning ko‘rish, yaratish, tahrirlash hamda boshqarish
              vakolatlarini bir joydan belgilang.
            </Typography>

            {selectedAdmin && (
              <Box
                sx={{
                  mt: 2.2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  flexWrap: "wrap",
                }}
              >
                <Avatar
                  src={getImageUrl(selectedAdmin.user_image)}
                  sx={{
                    width: 38,
                    height: 38,
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 950,

                    background: "linear-gradient(135deg,#7f1d1d,#dc2626)",

                    border: "3px solid rgba(255,255,255,.10)",
                  }}
                >
                  {getInitials(selectedAdmin)}
                </Avatar>

                <Box>
                  <Typography
                    sx={{
                      color: "#ffffff !important",

                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {getFullName(selectedAdmin) || selectedAdmin.username}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,

                      color: "rgba(255,255,255,.38) !important",

                      fontSize: 9,
                    }}
                  >
                    Hozir tanlangan foydalanuvchi
                  </Typography>
                </Box>

                <RoleChip role={selectedAdmin.role} dark />
              </Box>
            )}
          </Box>

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",

                sm: "repeat(2,minmax(0,1fr))",

                lg: "repeat(4,minmax(0,1fr))",
              },

              gap: 1.3,
            }}
          >
            <HeroMetric
              label="Foydalanuvchilar"
              value={`${number(admins.length)} ta`}
              helper="Boshqariladigan admin va ishchilar"
              tone="blue"
            />

            <HeroMetric
              label="Tanlangan ruxsat"
              value={`${number(selectedPermissions.length)} ta`}
              helper="Joriy foydalanuvchi vakolatlari"
              tone="green"
            />

            <HeroMetric
              label="Ruxsat guruhlari"
              value={`${number(visibleGroups.length)} ta`}
              helper="Faol bo‘limlar va modullar"
              tone="amber"
            />

            <HeroMetric
              label="Faollik darajasi"
              value={`${permissionPercent}%`}
              helper="Mavjud ruxsatlarga nisbatan"
              tone="red"
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          minHeight: 0,
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",

            lg: "320px minmax(0,1fr)",
          },

          gap: 2,
          alignItems: "start",
        }}
      >
        <Card
          sx={{
            p: 1.7,

            position: {
              lg: "sticky",
            },

            top: {
              lg: 0,
            },
          }}
        >
          <Box
            sx={{
              px: 0.5,
              pb: 1.5,
            }}
          >
            <Typography
              sx={{
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 950,
              }}
            >
              Foydalanuvchilar
            </Typography>

            <Typography
              sx={{
                mt: 0.4,
                color: "#94a3b8",
                fontSize: 9.5,
              }}
            >
              Ruxsatlarini o‘zgartirish uchun foydalanuvchini tanlang
            </Typography>
          </Box>

          <TextField
            fullWidth
            size="small"
            label="Qidirish"
            placeholder="Ism yoki username"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            sx={{ mb: 1.4 }}
          />

          <Stack
            spacing={1}
            sx={{
              maxHeight: {
                xs: 420,
                lg: "calc(100vh - 330px)",
              },

              minHeight: 130,
              overflowY: "auto",
              pr: 0.4,
            }}
          >
            {filteredAdmins.length ? (
              filteredAdmins.map((admin) => {
                const active = Number(admin.id) === Number(selectedId);

                return (
                  <Button
                    key={admin.id}
                    fullWidth
                    onClick={() => selectAdmin(admin)}
                    disabled={saving}
                    sx={{
                      minHeight: 72,
                      p: 1.2,

                      display: "flex",
                      alignItems: "center",

                      justifyContent: "flex-start",

                      gap: 1.2,
                      color: "#334155",
                      textAlign: "left",
                      borderRadius: "16px",
                      textTransform: "none",

                      border: active ? "1px solid rgba(153,27,27,.23)" : "1px solid #e7ebf0",

                      background: active
                        ? "linear-gradient(145deg,rgba(153,27,27,.075),#ffffff)"
                        : "linear-gradient(145deg,#ffffff,#f8fafc)",

                      boxShadow: active ? "0 10px 24px rgba(153,27,27,.09)" : "none",

                      "&:hover": {
                        color: "#991b1b",

                        borderColor: "rgba(153,27,27,.23)",

                        background: "linear-gradient(145deg,rgba(153,27,27,.055),#ffffff)",
                      },
                    }}
                  >
                    <Avatar
                      src={getImageUrl(admin.user_image)}
                      sx={{
                        width: 43,
                        height: 43,
                        flexShrink: 0,
                        color: "#ffffff",
                        fontSize: 12,
                        fontWeight: 950,

                        background: active
                          ? "linear-gradient(135deg,#7f1d1d,#dc2626)"
                          : "linear-gradient(135deg,#475569,#0f172a)",

                        boxShadow: active
                          ? "0 8px 18px rgba(127,29,29,.20)"
                          : "0 6px 16px rgba(15,23,42,.12)",
                      }}
                    >
                      {getInitials(admin)}
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
                          color: "inherit",

                          fontSize: 10.5,
                          fontWeight: 950,
                        }}
                      >
                        {getFullName(admin) || admin.username}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          mt: 0.35,
                          color: "#94a3b8",
                          fontSize: 8.8,
                        }}
                      >
                        @{admin.username || "username"} · {number(admin.permissions?.length)} ta
                        ruxsat
                      </Typography>

                      <Box sx={{ mt: 0.65 }}>
                        <RoleChip role={admin.role} />
                      </Box>
                    </Box>
                  </Button>
                );
              })
            ) : (
              <Box
                sx={{
                  minHeight: 130,
                  p: 2,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  borderRadius: "16px",

                  border: "1px dashed #cbd5e1",

                  backgroundColor: "#f8fafc",
                }}
              >
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  Foydalanuvchi topilmadi.
                </Typography>
              </Box>
            )}
          </Stack>
        </Card>

        <Card
          sx={{
            minHeight: 520,
            p: {
              xs: 1.7,
              md: 2.3,
            },
          }}
        >
          {selectedAdmin ? (
            <>
              <Box
                sx={{
                  display: "flex",

                  alignItems: {
                    xs: "flex-start",
                    md: "center",
                  },

                  justifyContent: "space-between",

                  flexDirection: {
                    xs: "column",
                    md: "row",
                  },

                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.4,
                  }}
                >
                  <Avatar
                    src={getImageUrl(selectedAdmin.user_image)}
                    sx={{
                      width: 55,
                      height: 55,
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: 950,

                      background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",

                      border: "4px solid #ffffff",

                      boxShadow: "0 10px 26px rgba(127,29,29,.18)",
                    }}
                  >
                    {getInitials(selectedAdmin)}
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#0f172a",
                          fontSize: 16,
                          fontWeight: 950,
                        }}
                      >
                        {getFullName(selectedAdmin) || selectedAdmin.username}
                      </Typography>

                      <RoleChip role={selectedAdmin.role} />
                    </Box>

                    <Typography
                      sx={{
                        mt: 0.5,
                        color: "#94a3b8",
                        fontSize: 9.5,
                      }}
                    >
                      @{selectedAdmin.username || "username"} · {number(selectedPermissions.length)}{" "}
                      ta ruxsat tanlangan
                    </Typography>
                  </Box>
                </Box>

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={1}
                  sx={{
                    width: {
                      xs: "100%",
                      md: "auto",
                    },
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={clearPermissions}
                    disabled={saving || !selectedPermissions.length}
                    sx={secondaryButtonSx}
                  >
                    Hammasini o‘chirish
                  </Button>

                  {hasChanges && (
                    <Button
                      variant="outlined"
                      onClick={restorePermissions}
                      disabled={saving}
                      sx={secondaryButtonSx}
                    >
                      Bekor qilish
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    sx={primaryButtonSx}
                  >
                    {saving ? "Saqlanmoqda..." : hasChanges ? "Ruxsatlarni saqlash" : "Saqlandi"}
                  </Button>
                </Stack>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: "17px",

                  border: hasChanges
                    ? "1px solid rgba(245,158,11,.20)"
                    : "1px solid rgba(34,197,94,.17)",

                  backgroundColor: hasChanges ? "rgba(245,158,11,.055)" : "rgba(34,197,94,.045)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",

                    justifyContent: "space-between",

                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: hasChanges ? "#b45309" : "#15803d",

                        fontSize: 10.5,
                        fontWeight: 950,
                      }}
                    >
                      {hasChanges
                        ? "Saqlanmagan o‘zgarishlar mavjud"
                        : "Barcha o‘zgarishlar saqlangan"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,
                        color: "#94a3b8",
                        fontSize: 9,
                      }}
                    >
                      {selectedVisiblePermissions} / {totalVisiblePermissions} ta ko‘rinadigan
                      ruxsat yoqilgan
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      color: hasChanges ? "#b45309" : "#15803d",

                      fontSize: 18,
                      fontWeight: 950,
                    }}
                  >
                    {permissionPercent}%
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={permissionPercent}
                  sx={{
                    mt: 1.2,
                    height: 8,
                    borderRadius: 99,
                    backgroundColor: "rgba(148,163,184,.14)",

                    "& .MuiLinearProgress-bar": {
                      borderRadius: 99,

                      background: hasChanges
                        ? "linear-gradient(90deg,#d97706,#f59e0b)"
                        : "linear-gradient(90deg,#15803d,#22c55e)",
                    },
                  }}
                />
              </Box>

              {visiblePresets.length > 0 && (
                <Box sx={{ mt: 2.3 }}>
                  <Typography
                    sx={{
                      color: "#0f172a",
                      fontSize: 13,
                      fontWeight: 950,
                    }}
                  >
                    Tayyor ruxsat shablonlari
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,
                      color: "#94a3b8",
                      fontSize: 9.5,
                    }}
                  >
                    Foydalanuvchining vazifasiga mos shablonni tanlang
                  </Typography>

                  <Box
                    sx={{
                      mt: 1.3,
                      display: "grid",

                      gridTemplateColumns: {
                        xs: "1fr",

                        sm: "repeat(2,minmax(0,1fr))",

                        xl: "repeat(4,minmax(0,1fr))",
                      },

                      gap: 1.2,
                    }}
                  >
                    {visiblePresets.map((preset) => (
                      <PresetCard
                        key={preset.label}
                        preset={preset}
                        onClick={() => applyPreset(preset)}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2.5 }} />

              <Box>
                <Typography
                  sx={{
                    color: "#0f172a",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  Ruxsat guruhlari
                </Typography>

                <Typography
                  sx={{
                    mt: 0.45,
                    color: "#94a3b8",
                    fontSize: 9.5,
                  }}
                >
                  Har bir modul uchun ko‘rish va boshqarish ruxsatlarini belgilang
                </Typography>
              </Box>

              {visibleGroups.length ? (
                <Box
                  sx={{
                    mt: 1.5,
                    display: "grid",

                    gridTemplateColumns: {
                      xs: "1fr",

                      xl: "repeat(2,minmax(0,1fr))",
                    },

                    gap: 1.4,
                  }}
                >
                  {visibleGroups.map((group) => (
                    <PermissionGroup
                      key={group.group}
                      group={group}
                      selectedSet={selectedSet}
                      togglePermission={togglePermission}
                      toggleGroup={toggleGroup}
                    />
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    minHeight: 190,
                    mt: 1.5,
                    p: 3,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    borderRadius: "18px",

                    border: "1px dashed #cbd5e1",

                    backgroundColor: "#f8fafc",
                  }}
                >
                  <Typography
                    sx={{
                      color: "#94a3b8",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    Ushbu foydalanuvchi uchun ruxsat guruhlari topilmadi.
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Box
              sx={{
                minHeight: 450,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
              }}
            >
              <Box>
                <Box
                  sx={{
                    width: 68,
                    height: 68,
                    mx: "auto",
                    display: "grid",
                    placeItems: "center",
                    color: "#991b1b",
                    borderRadius: "20px",

                    border: "1px solid rgba(153,27,27,.13)",

                    backgroundColor: "rgba(153,27,27,.06)",

                    fontSize: 20,
                    fontWeight: 950,
                  }}
                >
                  R
                </Box>

                <Typography
                  sx={{
                    mt: 1.7,
                    color: "#334155",
                    fontSize: 14,
                    fontWeight: 950,
                  }}
                >
                  Foydalanuvchini tanlang
                </Typography>

                <Typography
                  sx={{
                    maxWidth: 340,
                    mt: 0.6,
                    color: "#94a3b8",
                    fontSize: 10.5,
                    lineHeight: 1.65,
                  }}
                >
                  Ruxsatlarini o‘zgartirish uchun chap tomondagi ro‘yxatdan administrator yoki
                  omborchini tanlang.
                </Typography>
              </Box>
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
};

const secondaryButtonSx = {
  minHeight: 40,
  px: 1.7,
  color: "#64748b",
  borderRadius: "11px",
  borderColor: "#dce3ea",
  fontSize: 10,
  fontWeight: 900,
  textTransform: "none",
  backgroundColor: "#ffffff",

  "&:hover": {
    color: "#991b1b",

    borderColor: "rgba(153,27,27,.22)",

    backgroundColor: "rgba(153,27,27,.04)",
  },
};

const primaryButtonSx = {
  minHeight: 40,
  px: 2,
  color: "#ffffff",
  borderRadius: "11px",
  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",

  background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",

  boxShadow: "0 10px 24px rgba(127,29,29,.18)",

  "&:hover": {
    background: "linear-gradient(135deg,#681818,#991b1b)",
  },
};

const permissionsPageStyles = `
  .crm-page .permissions-hero {
    color: #ffffff !important;
    background-color: #0d1117 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.34),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #0d1117,
        #171117 52%,
        #3a121a
      ) !important;
  }
`;

export default Permissions;
