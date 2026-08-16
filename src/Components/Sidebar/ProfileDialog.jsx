import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Stack,
  Typography,
} from "@mui/material";
import { CompatDialog as Dialog, CompatTextField as TextField } from "../UI/MuiCompat";
import { toast } from "react-toastify";

import { useAuth } from "../../Context/AuthContext";
import {
  getMySessions,
  revokeOtherSessions,
  revokeSession,
  updateMe,
  updateUserImage,
} from "../../api/getUsers";
import { deleteCompanyLogo, updateCompanyLogo } from "../../api/companyBranding";
import { clearSession } from "../../utils/auth";
import { getCompanyLogoUrl } from "../../utils/company";
import { getImageUrl } from "../../utils/imageUrl";

/**
 * Profil sozlamalari oynasi.
 *
 * TopBar'dan ajratildi. Sababi o'lchangan: TopBar har sahifada yuklanadi va
 * bu oyna MUI'ning TextField hamda Dialog bo'laklarini o'ziga tortadi —
 * foydalanuvchi profilni ochmasa ham 60 KB dan ortiq kod yuklanardi.
 * Endi u faqat oyna ochilganda so'raladi.
 *
 * Holat ham shu yerda: TopBar faqat "ochiq/yopiq" ni biladi.
 */
const ProfileDialog = ({ open, onClose }) => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [sessions, setSessions] = useState([]);

  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [companyLogoFile, setCompanyLogoFile] = useState(null);

  const [companyLogoPreview, setCompanyLogoPreview] = useState("");

  const [companyLogoSaving, setCompanyLogoSaving] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    password: "",
  });

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

  const patchStoredUser = (patch) => {
    const nextUser = {
      ...user,
      ...patch,
    };

    localStorage.setItem("user", JSON.stringify(nextUser));

    setUser(nextUser);
  };

  const saveCompanyLogo = async () => {
    if (!companyLogoFile) {
      toast.error("Avval logo faylini tanlang.");

      return;
    }

    setCompanyLogoSaving(true);

    try {
      const { data } = await updateCompanyLogo(companyLogoFile);

      patchStoredUser({
        company_logo_url: data.company?.logo_url || null,
      });

      setCompanyLogoFile(null);
      setCompanyLogoPreview("");

      toast.success("Korxona logosi yangilandi.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Logoni yuklashda xato.");
    } finally {
      setCompanyLogoSaving(false);
    }
  };

  const removeCompanyLogo = async () => {
    if (!window.confirm("Korxona logosini o‘chirasizmi?")) {
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

      toast.success("Korxona logosi o‘chirildi.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Logoni o‘chirishda xato.");
    } finally {
      setCompanyLogoSaving(false);
    }
  };

  const removeSession = async (session) => {
    try {
      const { data } = await revokeSession(session.id);

      if (data.current_session_revoked) {
        clearSession();

        navigate("/login", {
          replace: true,
        });

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
      toast.error("Ism, familiya va foydalanuvchi nomi majburiy.");

      return;
    }

    setSaving(true);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        phone: form.phone.trim() || null,
      };

      if (form.password) {
        payload.password = form.password;
      }

      const profileRes = await updateMe(payload);

      let updated = profileRes.data.updated_user || profileRes.data.user || {};

      if (imageFile) {
        const imageRes = await updateUserImage(imageFile);

        updated = {
          ...updated,
          ...(imageRes.data.user || imageRes.data.updated_user || {}),
        };
      }

      const nextUser = {
        ...user,
        ...updated,
      };

      localStorage.setItem("user", JSON.stringify(nextUser));

      setUser(nextUser);
      onClose();

      toast.success("Profil yangilandi.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Profilni yangilashda xato.");
    } finally {
      setSaving(false);
    }
  };

  // Oyna ochilganda maydonlar joriy ma'lumot bilan to'ldiriladi va qurilmalar
  // ro'yxati yuklanadi. Yopilib qayta ochilsa — yangisi keladi.
  useEffect(() => {
    if (!open) return;

    setForm({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      username: user?.username || "",
      phone: user?.phone || "",
      password: "",
    });

    setImageFile(null);
    setImagePreview("");
    setCompanyLogoFile(null);
    setCompanyLogoPreview("");

    loadSessions();
    // Faqat ochilish payti muhim — user o'zgarganda maydonni qayta
    // to'ldirish foydalanuvchi yozayotganini o'chirib yuboradi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          className: "aa-profile-dialog",
        }}
      >
        <DialogTitle className="aa-dialog-title">
          <Box>
            <Typography component="h2">Profil sozlamalari</Typography>

            <Typography>Shaxsiy ma’lumotlar va xavfsizlik sozlamalari</Typography>
          </Box>

          <Button
            onClick={onClose}
            className="aa-dialog-close"
            aria-label="Profil oynasini yopish"
          >
            ×
          </Button>
        </DialogTitle>

        <Box
          component="form"
          className="aa-profile-form"
          onSubmit={(event) => {
            event.preventDefault();
            saveProfile();
          }}
        >
          <DialogContent className="aa-dialog-content">
            <Stack spacing={2.2}>
              {user?.role === "super_admin" && (
                <Box className="aa-settings-card">
                  <Box className="aa-settings-heading">
                    <Box>
                      <Typography>Korxona logosi</Typography>

                      <Typography>Logo Sidebar va korxona sahifalarida ko‘rinadi.</Typography>
                    </Box>

                    <Chip label="Branding" size="small" className="aa-branding-chip" />
                  </Box>

                  <Box className="aa-logo-settings">
                    <Avatar
                      variant="rounded"
                      src={
                        companyLogoPreview || getCompanyLogoUrl(user?.company_logo_url) || undefined
                      }
                      className="aa-company-logo-preview"
                    >
                      {user?.company_name?.[0]?.toUpperCase() || "K"}
                    </Avatar>

                    <Box className="aa-logo-actions">
                      <Button
                        component="label"
                        variant="outlined"
                        disabled={companyLogoSaving}
                        className="aa-outline-button"
                      >
                        Logo tanlash
                        <input
                          hidden
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => {
                            const file = event.target.files?.[0];

                            if (!file) {
                              return;
                            }

                            if (file.size > 2 * 1024 * 1024) {
                              toast.error("Logo hajmi 2 MB dan oshmasligi kerak.");

                              return;
                            }

                            setCompanyLogoFile(file);

                            setCompanyLogoPreview(URL.createObjectURL(file));
                          }}
                        />
                      </Button>

                      <Button
                        variant="contained"
                        disabled={!companyLogoFile || companyLogoSaving}
                        onClick={saveCompanyLogo}
                        className="aa-primary-button"
                      >
                        {companyLogoSaving ? "Saqlanmoqda..." : "Logoni saqlash"}
                      </Button>

                      {user?.company_logo_url && (
                        <Button
                          disabled={companyLogoSaving}
                          onClick={removeCompanyLogo}
                          className="aa-delete-button"
                        >
                          O‘chirish
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Typography className="aa-file-hint">JPEG, PNG yoki WebP, 2 MB gacha</Typography>
                </Box>
              )}

              <Box className="aa-profile-main-card">
                <Avatar
                  src={imagePreview || getImageUrl(user?.user_image)}
                  className="aa-profile-large-avatar"
                >
                  {form.first_name?.[0] || "U"}
                </Avatar>

                <Box className="aa-profile-main-copy">
                  <Typography>Profil rasmi</Typography>

                  <Typography>Profilingiz uchun aniq va sifatli rasm tanlang.</Typography>

                  <Button component="label" variant="outlined" className="aa-outline-button">
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
                </Box>

                <Typography className="aa-profile-image-hint">
                  JPEG, PNG yoki WebP
                  <br />5 MB gacha
                </Typography>
              </Box>

              <Box className="aa-form-grid">
                {[
                  ["first_name", "Ism", "given-name"],
                  ["last_name", "Familiya", "family-name"],
                  ["username", "Foydalanuvchi nomi", "username"],
                  ["phone", "Telefon", "tel"],
                ].map(([field, label, autoComplete]) => (
                  <TextField
                    key={field}
                    name={field}
                    label={label}
                    autoComplete={autoComplete}
                    value={form[field]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [field]: event.target.value,
                      }))
                    }
                    className="aa-profile-field"
                  />
                ))}
              </Box>

              <TextField
                name="new_password"
                type="password"
                autoComplete="new-password"
                label="Yangi parol"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                helperText="Parolni o‘zgartirmasangiz, bo‘sh qoldiring"
                className="aa-profile-field"
              />

              <Divider className="aa-profile-divider" />

              <Box className="aa-session-heading">
                <Box>
                  <Typography>Faol qurilmalar</Typography>

                  <Typography>Profilingiz ochiq turgan brauzer va qurilmalar</Typography>
                </Box>

                <Button
                  onClick={removeOtherSessions}
                  disabled={sessionsLoading || sessions.length < 2}
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
                      color: "#6e1622",
                    }}
                  />
                </Box>
              ) : sessions.length ? (
                <Box className="aa-sessions-list">
                  {sessions.map((session) => (
                    <Box key={session.id} className="aa-session-item">
                      <Box className="aa-session-icon">
                        {session.device_name?.charAt(0)?.toUpperCase() || "D"}
                      </Box>

                      <Box className="aa-session-copy">
                        <Box className="aa-session-name-row">
                          <Typography>{session.device_name || "Noma’lum qurilma"}</Typography>

                          {session.is_current && (
                            <Chip size="small" label="Hozirgi" className="aa-current-chip" />
                          )}
                        </Box>

                        <Typography>
                          IP: {session.ip_address || "-"}
                          {" • "}
                          Oxirgi faollik: {new Date(session.last_used_at).toLocaleString("uz-UZ")}
                        </Typography>
                      </Box>

                      <Button onClick={() => removeSession(session)} className="aa-session-logout">
                        Chiqish
                      </Button>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box className="aa-empty-sessions">
                  <Typography>Faol sessiya topilmadi.</Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>

          <DialogActions className="aa-dialog-actions">
            <Button
              type="button"
              onClick={onClose}
              className="aa-cancel-button"
            >
              Bekor qilish
            </Button>

            <Button type="submit" disabled={saving} className="aa-save-button">
              {saving ? "Saqlanmoqda..." : "O‘zgarishlarni saqlash"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
  );
};

export default ProfileDialog;
