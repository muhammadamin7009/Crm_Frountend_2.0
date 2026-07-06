import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext";
import { getMySessions, revokeOtherSessions, revokeSession, updateMe, updateUserImage } from "../../api/getUsers";
import { clearSession } from "../../utils/auth";

const roleLabels = {
  super_admin: "Super Admin",
  admin: "Admin",
  client: "Mijoz",
  customer: "Xaridor",
  worker: "Ishchi",
};

const mobileLinks = [
  { label: "Bosh sahifa", path: "/" },
  { label: "Foydalanuvchilar", path: "/users", roles: ["super_admin", "admin", "worker"] },
  { label: "Lavozimlar", path: "/employees", roles: ["super_admin", "admin"] },
  { label: "Mahsulotlar", path: "/products" },
  { label: "Ish hisoboti", path: "/worker-outputs", roles: ["super_admin", "admin", "worker"] },
  { label: "Oyliklar", path: "/worker-payments", roles: ["super_admin", "admin"] },
  {
    label: "Mijoz savdo",
    path: "/client-sales",
    roles: ["super_admin", "admin"],
    feature: "client_accounting",
  },
  {
    label: "Homashyo xaridi",
    path: "/material-purchases",
    roles: ["super_admin", "admin"],
    feature: "supplier_accounting",
  },
  { label: "Moliya", path: "/finance", roles: ["super_admin", "admin"], feature: "finance" },
  {
    label: "Amallar tarixi",
    path: "/audit-logs",
    roles: ["super_admin", "admin"],
    feature: "audit_logs",
  },
];

const getImageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;

  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const getInitials = (user) => {
  const first = user?.first_name?.[0] || "";
  const last = user?.last_name?.[0] || "";

  if (first || last) return `${first}${last}`.toUpperCase();

  return user?.username?.slice(0, 2)?.toUpperCase() || "ZR";
};

export default function TopBar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    password: "",
  });

  const fullName = useMemo(() => {
    const name = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    return name || user?.username || "ZERR foydalanuvchisi";
  }, [user]);

  const role = roleLabels[user?.role] || user?.role || "Foydalanuvchi";

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const { data } = await getMySessions();
      setSessions(data.sessions || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Qurilmalarni olishda xato.");
    } finally {
      setSessionsLoading(false);
    }
  };

  const openProfile = () => {
    setForm({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      username: user?.username || "",
      phone: user?.phone || "",
      password: "",
    });
    setImageFile(null);
    setImagePreview("");
    setProfileOpen(true);
    loadSessions();
  };

  const removeSession = async (session) => {
    try {
      const { data } = await revokeSession(session.id);
      if (data.current_session_revoked) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }
      await loadSessions();
      toast.success("Qurilmadan chiqildi.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Sessiyani yopishda xato.");
    }
  };

  const removeOtherSessions = async () => {
    try {
      await revokeOtherSessions();
      await loadSessions();
      toast.success("Boshqa barcha qurilmalardan chiqildi.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Sessiyalarni yopishda xato.");
    }
  };

  const saveProfile = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.username.trim()) {
      return toast.error("Ism, familiya va username majburiy.");
    }

    setSaving(true);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        phone: form.phone.trim() || null,
      };

      if (form.password) payload.password = form.password;

      const profileRes = await updateMe(payload);
      let updated = profileRes.data.updated_user || profileRes.data.user || {};

      if (imageFile) {
        const imageRes = await updateUserImage(imageFile);
        updated = {
          ...updated,
          ...(imageRes.data.user || imageRes.data.updated_user || {}),
        };
      }

      const nextUser = { ...user, ...updated };

      localStorage.setItem("user", JSON.stringify(nextUser));
      setUser(nextUser);
      setProfileOpen(false);
      toast.success("Profil yangilandi.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Profilni yangilashda xato.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
          minHeight: 80,
          px: { xs: 2, md: 3 },
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          borderRadius: "0 0 14px 14px",
          background: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(15, 23, 42, 0.06)",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
          backdropFilter: "blur(14px)",
        }}
      >
        <Box className="flex min-w-0 items-center gap-3">
          <Button
            variant="outlined"
            size="small"
            onClick={() => setMenuOpen(true)}
            sx={{
              display: { xs: "inline-flex", md: "none" },
              minWidth: 44,
              height: 40,
              borderRadius: "10px",
              color: "#8b0101",
              borderColor: "rgba(139,1,1,.2)",
              fontWeight: 900,
              textTransform: "none",
            }}
          >
            Menu
          </Button>

          <Box className="min-w-0">
            <Typography
              sx={{
                fontSize: { xs: 18, md: 23 },
                fontWeight: 950,
                color: "#111827",
                lineHeight: 1.1,
              }}
            >
              Xush kelibsiz, {user?.first_name || fullName}
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 13,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              {user?.company_name || "Zerr Collection"} boshqaruv paneli
            </Typography>
          </Box>
        </Box>

        <Button
          onClick={openProfile}
          title="Profilni tahrirlash"
          sx={{
            minWidth: 0,
            p: 0,
            borderRadius: "14px",
            textTransform: "none",
            color: "inherit",
          }}
        >
          <Stack
            direction="row"
            spacing={1.4}
            sx={{
              alignItems: "center",
              px: { xs: 0.6, sm: 1 },
              py: 0.8,
              borderRadius: "14px",
              transition: "background-color .18s ease",
              "&:hover": {
                backgroundColor: "rgba(139,1,1,.04)",
              },
            }}
          >
            <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
              <Typography
                sx={{
                  maxWidth: 190,
                  fontSize: 14,
                  fontWeight: 950,
                  color: "#111827",
                  lineHeight: 1.15,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fullName}
              </Typography>

              <Stack
                direction="row"
                spacing={0.8}
                sx={{
                  mt: 0.7,
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Chip
                  label={role}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#8b0101",
                    background: "rgba(139, 1, 1, 0.08)",
                    border: "1px solid rgba(139, 1, 1, 0.14)",
                  }}
                />

                {user?.username && (
                  <Typography
                    sx={{
                      maxWidth: 95,
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 800,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    @{user.username}
                  </Typography>
                )}
              </Stack>
            </Box>

            <Avatar
              src={imagePreview || getImageUrl(user?.user_image)}
              sx={{
                width: 48,
                height: 48,
                fontSize: 16,
                fontWeight: 950,
                color: "#fff",
                bgcolor: "#9f1d21",
                boxShadow: "0 10px 22px rgba(139, 1, 1, 0.20)",
              }}
            >
              {getInitials(user)}
            </Avatar>
          </Stack>
        </Button>
      </Box>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Box className="flex h-full w-72 flex-col bg-[#050817] p-4 text-white">
          <Typography variant="h6" fontWeight={950} className="px-2 py-3">
            Zerr Collection
          </Typography>

          <List className="flex-1">
            {mobileLinks
              .filter(
                (item) =>
                  (!item.roles || item.roles.includes(user?.role)) &&
                  (!item.feature ||
                    !user?.plan_code ||
                    user?.plan_features?.includes(item.feature)),
              )
              .map((item) => (
                <ListItemButton
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  sx={{
                    mb: 0.6,
                    borderRadius: "10px",
                    color: "#cbd5e1",
                    "&.active": {
                      bgcolor: "#a32024",
                      color: "#fff",
                    },
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,.08)",
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: 850,
                      fontSize: 14,
                    }}
                  />
                </ListItemButton>
              ))}
          </List>

          <Button
            variant="outlined"
            onClick={() => {
              clearSession();
              navigate("/login", { replace: true });
            }}
            sx={{
              color: "#fecaca",
              borderColor: "rgba(248,113,113,.35)",
              backgroundColor: "rgba(248,113,113,.07)",
              textTransform: "none",
              fontWeight: 900,
              borderRadius: "10px",
            }}
          >
            Chiqish
          </Button>
        </Box>
      </Drawer>

      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 950 }}>Profilni tahrirlash</DialogTitle>

        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <Box className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Avatar
                src={imagePreview || getImageUrl(user?.user_image)}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "#9f1d21",
                  fontWeight: 950,
                }}
              >
                {form.first_name?.[0] || "U"}
              </Avatar>

              <Box className="flex items-center gap-2">
                <Button
                  component="label"
                  variant="outlined"
                  sx={{
                    textTransform: "none",
                    fontWeight: 850,
                    borderRadius: "10px",
                    color: "#8b0101",
                    borderColor: "rgba(139,1,1,.24)",
                  }}
                >
                  Rasm tanlash
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </Button>

                <Typography variant="caption" display="block" className="mt-1 text-slate-500">
                  JPEG, PNG yoki WebP, 5 MB gacha
                </Typography>
              </Box>
            </Box>

            {[
              ["first_name", "Ism"],
              ["last_name", "Familiya"],
              ["username", "Foydalanuvchi nomi"],
              ["phone", "Telefon"],
            ].map(([field, label]) => (
              <TextField
                key={field}
                label={label}
                value={form[field]}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [field]: event.target.value,
                  }))
                }
              />
            ))}

            <TextField
              type="password"
              label="Yangi parol"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              helperText="O'zgartirmasangiz bo'sh qoldiring"
            />

            <Divider />
            <Box className="flex items-center justify-between gap-3">
              <Box>
                <Typography fontWeight={900}>Faol qurilmalar</Typography>
                <Typography variant="body2" color="text.secondary">
                  Profilingiz ochiq turgan brauzer va qurilmalar
                </Typography>
              </Box>
              <Button size="small" color="error" variant="outlined" onClick={removeOtherSessions} disabled={sessionsLoading || sessions.length < 2}>
                Boshqalaridan chiqish
              </Button>
            </Box>
            {sessionsLoading ? (
              <Box className="flex justify-center py-5"><CircularProgress size={24} /></Box>
            ) : sessions.length ? (
              <Box className="space-y-2">
                {sessions.map((session) => (
                  <Box key={session.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <Box>
                      <Typography fontWeight={850}>
                        {session.device_name || "Noma'lum qurilma"} {session.is_current && <Chip size="small" color="success" label="Hozirgi" />}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        IP: {session.ip_address || "-"} • Oxirgi faollik: {new Date(session.last_used_at).toLocaleString("uz-UZ")}
                      </Typography>
                    </Box>
                    <Button size="small" color="error" onClick={() => removeSession(session)}>
                      Chiqish
                    </Button>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">Faol sessiya topilmadi.</Typography>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setProfileOpen(false)}
            sx={{ textTransform: "none", fontWeight: 800 }}
          >
            Bekor qilish
          </Button>

          <Button
            variant="contained"
            onClick={saveProfile}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 900,
              borderRadius: "10px",
              bgcolor: "#8b0101",
              "&:hover": {
                bgcolor: "#a32024",
              },
            }}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
