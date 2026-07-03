import {
  Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Drawer, List, ListItemButton, ListItemText,
  Stack, TextField, Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { updateMe, updateUserImage } from "../../api/getUsers";
import { clearSession } from "../../utils/auth";
import { toast } from "react-toastify";

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
  { label: "Mijoz savdo", path: "/client-sales", roles: ["super_admin", "admin"], feature: "client_accounting" },
  { label: "Homashyo xaridi", path: "/material-purchases", roles: ["super_admin", "admin"], feature: "supplier_accounting" },
  { label: "Moliya", path: "/finance", roles: ["super_admin", "admin"], feature: "finance" },
  { label: "Amallar tarixi", path: "/audit-logs", roles: ["super_admin", "admin"], feature: "audit_logs" },
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
  const [form, setForm] = useState({ first_name: "", last_name: "", username: "", phone: "", password: "" });

  const fullName = useMemo(() => {
    const name = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    return name || user?.username || "ZERR user";
  }, [user]);

  const role = roleLabels[user?.role] || user?.role || "Foydalanuvchi";

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
  };

  const saveProfile = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.username.trim()) {
      return toast.error("Ism, familiya va username majburiy.");
    }
    setSaving(true);
    try {
      const payload = {
        first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        username: form.username.trim(), phone: form.phone.trim() || null,
      };
      if (form.password) payload.password = form.password;
      const profileRes = await updateMe(payload);
      let updated = profileRes.data.updated_user || profileRes.data.user || {};
      if (imageFile) {
        const imageRes = await updateUserImage(imageFile);
        updated = { ...updated, ...(imageRes.data.user || imageRes.data.updated_user || {}) };
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
        minHeight: 76,
        px: { xs: 2, md: 3 },
        py: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        borderRadius: "0 0 8px 8px",
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(15, 23, 42, 0.06)",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        backdropFilter: "blur(14px)",
      }}
    >
      <Box className="flex items-center gap-3">
        <Button
          variant="outlined"
          size="small"
          onClick={() => setMenuOpen(true)}
          sx={{ display: { xs: "inline-flex", md: "none" }, minWidth: 72 }}
        >
          Menyu
        </Button>
        <Box>
        <Typography
          sx={{
            fontSize: { xs: 18, md: 22 },
            fontWeight: 900,
            color: "#111827",
            letterSpacing: 0,
            lineHeight: 1.1,
          }}
        >
          Xush kelibsiz, {user?.first_name || fullName}
        </Typography>

        <Typography
          sx={{
            mt: 0.6,
            fontSize: 13,
            color: "#6b7280",
            fontWeight: 600,
          }}
        >
          {user?.company_name || "ZERR CRM"} boshqaruv paneli
        </Typography>
        </Box>
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.7}
        sx={{
          px: 1.2,
          py: 1,
          borderRadius: "8px",
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(17, 24, 39, 0.08)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 900,
              color: "#111827",
              lineHeight: 1.15,
            }}
          >
            {fullName}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ mt: 0.7 }}
          >
            <Chip
              label={role}
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 800,
                color: "#8b0101",
                background: "rgba(139, 1, 1, 0.08)",
                border: "1px solid rgba(139, 1, 1, 0.14)",
              }}
            />

            {user?.username && (
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#6b7280",
                  fontWeight: 700,
                }}
              >
                @{user.username}
              </Typography>
            )}
          </Stack>
        </Box>

        <Divider
          orientation="vertical"
          flexItem
          sx={{
            display: { xs: "none", sm: "block" },
            borderColor: "rgba(17, 24, 39, 0.08)",
          }}
        />

        <Button onClick={openProfile} title="Profilni tahrirlash" sx={{ minWidth: 0, p: 0, borderRadius: "50%" }}>
          <Avatar
            src={imagePreview || getImageUrl(user?.user_image)}
            sx={{ width: 48, height: 48, fontSize: 16, fontWeight: 900, color: "#fff", bgcolor: "#7f1d1d" }}
          >
            {getInitials(user)}
          </Avatar>
        </Button>
      </Stack>
    </Box>

    <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>
      <Box className="flex h-full w-72 flex-col bg-white p-4">
        <Typography variant="h6" fontWeight={900} className="px-2 py-3">ZERR CRM</Typography>
        <List className="flex-1">
          {mobileLinks
            .filter((item) => (!item.roles || item.roles.includes(user?.role)) && (!item.feature || !user?.plan_code || user?.plan_features?.includes(item.feature)))
            .map((item) => (
              <ListItemButton key={item.path} component={NavLink} to={item.path} onClick={() => setMenuOpen(false)} sx={{ mb: 0.5, borderRadius: 2, "&.active": { bgcolor: "#7f1d1d", color: "#fff" } }}>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
        </List>
        <Button color="error" variant="outlined" onClick={() => { clearSession(); navigate("/login", { replace: true }); }}>Chiqish</Button>
      </Box>
    </Drawer>

    <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 900 }}>Profilni tahrirlash</DialogTitle>
      <DialogContent>
        <Stack spacing={2} className="pt-2">
          <Box className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <Avatar src={imagePreview || getImageUrl(user?.user_image)} sx={{ width: 72, height: 72, bgcolor: "#7f1d1d" }}>{form.first_name?.[0] || "U"}</Avatar>
            <Box>
              <Button component="label" variant="outlined">Rasm tanlash<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); } }} /></Button>
              <Typography variant="caption" display="block" className="mt-1 text-slate-500">JPEG, PNG yoki WebP, 5 MB gacha</Typography>
            </Box>
          </Box>
          {[["first_name", "Ism"], ["last_name", "Familiya"], ["username", "Username"], ["phone", "Telefon"]].map(([field, label]) => (
            <TextField key={field} label={label} value={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
          ))}
          <TextField type="password" label="Yangi parol" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} helperText="O'zgartirmasangiz bo'sh qoldiring" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setProfileOpen(false)}>Bekor qilish</Button>
        <Button variant="contained" onClick={saveProfile} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
