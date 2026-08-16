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
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SharedHeroMetric from "../../Components/UI/HeroMetric";
import { toast } from "react-toastify";

import Card from "../../Components/UI/AppCard";
import { getPermissionSettings, updateUserPermissions } from "../../api/permissions";
import { formatNumber as number } from "../../utils/format";

const roleNames = {
  super_admin: "Super administrator",
  admin: "Administrator",
  worker: "Ishchi",
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

const sanitizePermissions = (permissions, validKeys) =>
  normalizePermissions(permissions).filter((key) => validKeys.has(key));

const getInitials = (user) => {
  const first = user?.first_name?.[0] || "";

  const last = user?.last_name?.[0] || "";

  const username = user?.username?.[0] || "";

  return `${first}${last}`.toUpperCase() || username.toUpperCase() || "U";
};

const HeroMetric = (props) => <SharedHeroMetric {...props} />;
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
            ? "#e3c98f !important"
            : "#bcd9e2 !important"
          : worker
            ? "#a06a12"
            : "#1f6f8b",

        fontSize: 9.5,
        fontWeight: 700,

        backgroundColor: dark
          ? worker
            ? "rgba(160, 106, 18,.14) !important"
            : "rgba(31, 111, 139,.14) !important"
          : worker
            ? "rgba(160, 106, 18,.09)"
            : "rgba(31, 111, 139,.08)",

        border: dark
          ? worker
            ? "1px solid rgba(201, 168, 117,.15)"
            : "1px solid rgba(107, 179, 201,.15)"
          : worker
            ? "1px solid rgba(160, 106, 18,.18)"
            : "1px solid rgba(31, 111, 139,.16)",
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

      color: "var(--aa-text)",
      textAlign: "left",
      borderRadius: "17px",
      borderColor: "var(--aa-border)",
      textTransform: "none",

      background: "linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",

      transition: "transform .2s ease, border-color .2s ease, box-shadow .2s ease",

      "&:hover": {
        color: "#6e1622",

        transform: "translateY(-2px)",

        borderColor: "rgba(110, 22, 34,.20)",

        background: "linear-gradient(145deg,rgba(110, 22, 34,.045),var(--aa-surface-solid))",

        boxShadow: "0 14px 30px rgba(23, 17, 15,.07)",
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

          background: "linear-gradient(135deg,#4d0f18,#7a1826)",

          boxShadow: "0 8px 18px rgba(77, 15, 24,.18)",

          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {preset.label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.15,
          color: "inherit",
          fontSize: 11.5,
          fontWeight: 700,
        }}
      >
        {preset.label}
      </Typography>

      <Typography
        sx={{
          mt: 0.55,
          color: "var(--aa-text-tertiary)",
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

          boxShadow: "0 18px 40px rgba(23, 17, 15,.07)",
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
              color: "var(--aa-text)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {group.group}
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              color: "var(--aa-text-tertiary)",
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
            color: allSelected ? "#7a1826" : "#7d716a",

            borderColor: allSelected ? "rgba(140, 29, 43,.20)" : "var(--aa-border)",

            fontSize: 9.5,
            fontWeight: 700,
            textTransform: "none",

            "&:hover": {
              color: "#6e1622",

              borderColor: "rgba(110, 22, 34,.25)",

              backgroundColor: "rgba(110, 22, 34,.04)",
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
          backgroundColor: "var(--aa-surface-muted)",

          "& .MuiLinearProgress-bar": {
            borderRadius: 99,

            background:
              completion === 100
                ? "linear-gradient(90deg,#2f6b45,#4e9c6b)"
                : "linear-gradient(90deg,#4d0f18,#8c1d2b)",
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

                border: checked ? "1px solid rgba(110, 22, 34,.17)" : "1px solid var(--aa-border)",

                backgroundColor: checked ? "rgba(110, 22, 34,.075)" : "var(--aa-surface-muted)",

                transition: "background-color .2s ease, border-color .2s ease",

                "&:hover": {
                  borderColor: "rgba(110, 22, 34,.22)",

                  backgroundColor: "rgba(110, 22, 34,.04)",
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
                      color: "#d8cec1",

                      "&.Mui-checked": {
                        color: "#6e1622",
                      },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography
                      sx={{
                        color: checked ? "var(--aa-brand-600)" : "var(--aa-text)",

                        fontSize: 10.5,
                        fontWeight: 700,
                      }}
                    >
                      {permission.label}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,
                        color: "var(--aa-text-tertiary)",
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
                        fontWeight: 600,
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

  const [permissionPresets, setPermissionPresets] = useState([]);

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

  // Ishchiga ham barcha ruxsatlar ochiq: sexda unga qo'shimcha vazifa
  // topshirilishi mumkin. Ilgari faqat "Ombor" guruhi ko'rinardi.
  const visibleGroups = groups;

  const visiblePresets = useMemo(
    () =>
      permissionPresets.filter(
        (preset) => !preset.roles?.length || preset.roles.includes(selectedAdmin?.role),
      ),

    [permissionPresets, selectedAdmin],
  );

  const validPermissionKeys = useMemo(
    () => new Set(groups.flatMap((group) => group.permissions.map((permission) => permission.key))),
    [groups],
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
    () => sanitizePermissions(selectedAdmin?.permissions || [], validPermissionKeys).sort(),

    [selectedAdmin, validPermissionKeys],
  );

  const currentPermissions = useMemo(
    () => sanitizePermissions(selectedPermissions, validPermissionKeys).sort(),

    [selectedPermissions, validPermissionKeys],
  );

  const hasChanges = JSON.stringify(savedPermissions) !== JSON.stringify(currentPermissions);

  const fetchSettings = async () => {
    setLoading(true);

    try {
      const { data } = await getPermissionSettings();

      const users = data.users || data.admins || [];
      const nextGroups = data.groups || [];
      const nextValidKeys = new Set(
        nextGroups.flatMap((group) => group.permissions.map((permission) => permission.key)),
      );

      setAdmins(users);
      setGroups(nextGroups);
      setPermissionPresets(data.presets || []);

      const firstAdmin = users[0];

      setSelectedId(firstAdmin?.id || null);

      setSelectedPermissions(sanitizePermissions(firstAdmin?.permissions || [], nextValidKeys));
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

    setSelectedPermissions(sanitizePermissions(admin.permissions || [], validPermissionKeys));
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
    setSelectedPermissions(sanitizePermissions(preset.permissions, validPermissionKeys));

    toast.info(`“${preset.label}” shabloni tanlandi. Saqlashni unutmang.`);
  };

  const clearPermissions = () => {
    setSelectedPermissions([]);
  };

  const restorePermissions = () => {
    setSelectedPermissions(
      sanitizePermissions(selectedAdmin?.permissions || [], validPermissionKeys),
    );
  };

  const handleSave = async () => {
    if (!selectedAdmin) {
      return;
    }

    setSaving(true);

    try {
      const permissions = sanitizePermissions(selectedPermissions, validPermissionKeys);

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

      setSelectedPermissions(sanitizePermissions(saved, validPermissionKeys));
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

            border: "1px solid rgba(110, 22, 34,.10)",

            backgroundColor: "rgba(110, 22, 34,.05)",
          }}
        >
          <CircularProgress
            size={34}
            thickness={4.5}
            sx={{
              color: "#6e1622",
            }}
          />
        </Box>

        <Typography
          sx={{
            color: "var(--aa-text-tertiary)",
            fontSize: 12.5,
            fontWeight: 600,
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
        className="crm-page-hero permissions-hero"
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

          backgroundColor: "#151211 !important",

          backgroundImage:
            "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.34),transparent 30%),linear-gradient(145deg,#151211,#1e1a18 52%,#3a1219) !important",

          boxShadow: "0 24px 60px rgba(23, 17, 15,.20)",

          "&::before": {
            content: '""',
            position: "absolute",
            width: 390,
            height: 390,
            top: -275,
            right: -210,
            borderRadius: "50%",

            border: "1px solid rgba(201, 168, 117,.16)",

            boxShadow:
              "0 0 81px 22px rgba(201, 168, 117,.022),0 0 161px 43px rgba(201, 168, 117,.014)",

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

                  background: "linear-gradient(90deg,#c9a875,#a3283a)",
                }}
              />

              <Typography
                sx={{
                  color: "#d9b782 !important",

                  fontSize: 10,
                  fontWeight: 700,
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
                fontFamily: "var(--aa-display)",
                fontWeight: 400,
                letterSpacing: "-.024em",
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
                    fontWeight: 700,

                    background: "linear-gradient(135deg,#4d0f18,#8c1d2b)",

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
                      fontWeight: 700,
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
          className="crm-mobile-user-picker"
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
                color: "var(--aa-text)",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Foydalanuvchilar
            </Typography>

            <Typography
              sx={{
                mt: 0.4,
                color: "var(--aa-text-tertiary)",
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
            placeholder="Ism yoki foydalanuvchi nomi"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            sx={{ mb: 1.4 }}
          />

          <Stack
            className="crm-mobile-user-list"
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
                      color: "var(--aa-text)",
                      textAlign: "left",
                      borderRadius: "16px",
                      textTransform: "none",

                      border: active
                        ? "1px solid rgba(110, 22, 34,.23)"
                        : "1px solid var(--aa-border)",

                      background: active
                        ? "linear-gradient(145deg,rgba(110, 22, 34,.10),var(--aa-surface-solid))"
                        : "linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",

                      boxShadow: active ? "0 10px 24px rgba(110, 22, 34,.09)" : "none",

                      "&:hover": {
                        color: "#6e1622",

                        borderColor: "rgba(110, 22, 34,.23)",

                        background:
                          "linear-gradient(145deg,rgba(110, 22, 34,.055),var(--aa-surface-solid))",
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
                        fontWeight: 700,

                        background: active
                          ? "linear-gradient(135deg,#4d0f18,#8c1d2b)"
                          : "linear-gradient(135deg,#5c514b,#17110f)",

                        boxShadow: active
                          ? "0 8px 18px rgba(77, 15, 24,.20)"
                          : "0 6px 16px rgba(23, 17, 15,.12)",
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
                          fontWeight: 700,
                        }}
                      >
                        {getFullName(admin) || admin.username}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          mt: 0.35,
                          color: "var(--aa-text-tertiary)",
                          fontSize: 8.8,
                        }}
                      >
                        @{admin.username || "foydalanuvchi"} · {number(admin.permissions?.length)}{" "}
                        ta ruxsat
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

                  border: "1px dashed #d8cec1",

                  backgroundColor: "var(--aa-surface-muted)",
                }}
              >
                <Typography
                  sx={{
                    color: "var(--aa-text-tertiary)",
                    fontSize: 10,
                    fontWeight: 600,
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
                      fontWeight: 700,

                      background: "linear-gradient(135deg,#4d0f18,#8c1d2b)",

                      border: "4px solid var(--aa-surface-solid)",

                      boxShadow: "0 10px 26px rgba(77, 15, 24,.18)",
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
                          color: "var(--aa-text)",
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        {getFullName(selectedAdmin) || selectedAdmin.username}
                      </Typography>

                      <RoleChip role={selectedAdmin.role} />
                    </Box>

                    <Typography
                      sx={{
                        mt: 0.5,
                        color: "var(--aa-text-tertiary)",
                        fontSize: 9.5,
                      }}
                    >
                      @{selectedAdmin.username || "foydalanuvchi"} ·{" "}
                      {number(selectedPermissions.length)} ta ruxsat tanlangan
                    </Typography>
                  </Box>
                </Box>

                <Stack
                  className="crm-mobile-action-strip"
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
                    ? "1px solid rgba(160, 106, 18,.20)"
                    : "1px solid rgba(78, 156, 107,.17)",

                  backgroundColor: hasChanges
                    ? "rgba(160, 106, 18,.055)"
                    : "rgba(78, 156, 107,.045)",
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
                        color: hasChanges ? "#a06a12" : "#2f6b45",

                        fontSize: 10.5,
                        fontWeight: 700,
                      }}
                    >
                      {hasChanges
                        ? "Saqlanmagan o‘zgarishlar mavjud"
                        : "Barcha o‘zgarishlar saqlangan"}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,
                        color: "var(--aa-text-tertiary)",
                        fontSize: 9,
                      }}
                    >
                      {selectedVisiblePermissions} / {totalVisiblePermissions} ta ko‘rinadigan
                      ruxsat yoqilgan
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      color: hasChanges ? "#a06a12" : "#2f6b45",

                      fontSize: 18,
                      fontWeight: 700,
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
                    backgroundColor: "rgba(138, 128, 122,.14)",

                    "& .MuiLinearProgress-bar": {
                      borderRadius: 99,

                      background: hasChanges
                        ? "linear-gradient(90deg,#d97706,#f59e0b)"
                        : "linear-gradient(90deg,#2f6b45,#4e9c6b)",
                    },
                  }}
                />
              </Box>

              {visiblePresets.length > 0 && (
                <Box sx={{ mt: 2.3 }}>
                  <Typography
                    sx={{
                      color: "var(--aa-text)",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Tayyor ruxsat shablonlari
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,
                      color: "var(--aa-text-tertiary)",
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
                    color: "var(--aa-text)",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Ruxsat guruhlari
                </Typography>

                <Typography
                  sx={{
                    mt: 0.45,
                    color: "var(--aa-text-tertiary)",
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

                    border: "1px dashed #d8cec1",

                    backgroundColor: "var(--aa-surface-muted)",
                  }}
                >
                  <Typography
                    sx={{
                      color: "var(--aa-text-tertiary)",
                      fontSize: 11,
                      fontWeight: 600,
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
                    color: "#6e1622",
                    borderRadius: "20px",

                    border: "1px solid rgba(110, 22, 34,.13)",

                    backgroundColor: "rgba(110, 22, 34,.06)",

                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  R
                </Box>

                <Typography
                  sx={{
                    mt: 1.7,
                    color: "var(--aa-text)",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Foydalanuvchini tanlang
                </Typography>

                <Typography
                  sx={{
                    maxWidth: 340,
                    mt: 0.6,
                    color: "var(--aa-text-tertiary)",
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
  color: "var(--aa-text-secondary)",
  borderRadius: "11px",
  borderColor: "var(--aa-border)",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "none",
  backgroundColor: "var(--aa-surface-solid)",

  "&:hover": {
    color: "#6e1622",

    borderColor: "rgba(110, 22, 34,.22)",

    backgroundColor: "rgba(110, 22, 34,.04)",
  },
};

const primaryButtonSx = {
  minHeight: 40,
  px: 2,
  color: "#ffffff",
  borderRadius: "11px",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",

  background: "linear-gradient(135deg,#4d0f18,#7a1826)",

  boxShadow: "0 10px 24px rgba(77, 15, 24,.18)",

  "&:hover": {
    background: "linear-gradient(135deg,#4d0f18,#6e1622)",
  },
};

const permissionsPageStyles = `
  .crm-page .permissions-hero {
    color: #ffffff !important;
    background-color: #151211 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(140, 29, 43,.34),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #151211,
        #1e1a18 52%,
        #3a1219
      ) !important;
  }
`;

export default Permissions;
