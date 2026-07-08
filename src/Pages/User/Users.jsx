import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
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
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../Context/AuthContext";
import { hasPermission } from "../../utils/permissions";
import CrmPagination from "../../Components/Common/CrmPagination";
import {
  createUserByAdmin,
  createUserByStaff,
  deleteUser,
  getUsers,
  permanentlyDeleteUser,
  restoreUser,
  updateUser,
  updateUserImage,
} from "../../api/getUsers";

const STAFF_ROLES = ["client", "customer", "worker"];
const SUPER_ADMIN_CREATE_ROLES = ["admin", ...STAFF_ROLES];

const roleNames = {
  super_admin: "Super admin",
  admin: "Admin",
  client: "Mijoz",
  customer: "Xaridor",
  worker: "Ishchi",
};

const roleStyles = {
  super_admin: {
    color: "#8b0101",
    bg: "rgba(139, 1, 1, 0.09)",
    border: "rgba(139, 1, 1, 0.18)",
  },
  admin: {
    color: "#1d4ed8",
    bg: "rgba(37, 99, 235, 0.09)",
    border: "rgba(37, 99, 235, 0.18)",
  },
  client: {
    color: "#15803d",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.24)",
  },
  customer: {
    color: "#6d28d9",
    bg: "rgba(139, 92, 246, 0.11)",
    border: "rgba(139, 92, 246, 0.22)",
  },
  worker: {
    color: "#92400e",
    bg: "rgba(245, 158, 11, 0.13)",
    border: "rgba(245, 158, 11, 0.26)",
  },
  default: {
    color: "#475569",
    bg: "#f1f5f9",
    border: "rgba(148, 163, 184, 0.24)",
  },
};

const emptyForm = {
  first_name: "",
  last_name: "",
  username: "",
  password: "",
  phone: "",
  role: "customer",
};

const getImageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;

  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getInitial = (user) => {
  const first = user?.first_name?.[0];
  const last = user?.last_name?.[0];
  const username = user?.username?.[0];

  return (first || last || username || "Z").toUpperCase();
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const Card = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: "20px",
      border: "1px solid rgba(148, 163, 184, 0.22)",
      background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))",
      boxShadow: "0 18px 50px rgba(15, 23, 42, 0.07)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const MiniStat = ({ label, value }) => (
  <Box
    sx={{
      minWidth: 105,
      px: 2,
      py: 1.4,
      borderRadius: "16px",
      background: "#ffffff",
      border: "1px solid rgba(148, 163, 184, 0.24)",
      boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
    }}
  >
    <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{label}</Typography>
    <Typography
      sx={{
        mt: 0.3,
        fontSize: 20,
        fontWeight: 900,
        color: "#0f172a",
        letterSpacing: "-0.04em",
      }}
    >
      {value}
    </Typography>
  </Box>
);

const RoleChip = ({ role }) => {
  const style = roleStyles[role] || roleStyles.default;

  return (
    <Chip
      size="small"
      label={roleNames[role] || role || "-"}
      sx={{
        height: 26,
        px: 0.35,
        fontSize: 12,
        fontWeight: 900,
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.border}`,
      }}
    />
  );
};

const FormDialog = ({
  open,
  title,
  form,
  selectedUser,
  saving,
  imagePreview,
  imageFileAllowed,
  roleOptions,
  canEditRole,
  onClose,
  onSave,
  onFormChange,
  onImageChange,
  submitText,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="sm"
    PaperProps={{
      sx: {
        borderRadius: "22px",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        boxShadow: "0 30px 80px rgba(15, 23, 42, 0.22)",
      },
    }}
  >
    <DialogTitle sx={{ pb: 1, fontSize: 22, fontWeight: 950, color: "#0f172a" }}>
      {title}
    </DialogTitle>

    <DialogContent>
      <Stack spacing={2} sx={{ pt: 1 }}>
        {selectedUser && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 1.5,
              borderRadius: "16px",
              background: "#f8fafc",
              border: "1px solid rgba(148, 163, 184, 0.18)",
            }}
          >
            <Avatar
              src={imagePreview || getImageUrl(selectedUser?.user_image)}
              sx={{
                width: 64,
                height: 64,
                bgcolor: "#8b0101",
                fontWeight: 900,
                border: "4px solid #fff",
              }}
            >
              {form.first_name?.[0]}
            </Avatar>

            <Box>
              <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>
                {form.first_name || "Foydalanuvchi"} {form.last_name}
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 650, color: "#64748b" }}>
                Profil ma'lumotlarini yangilash
              </Typography>

              {imageFileAllowed && (
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                  sx={{
                    mt: 1,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 850,
                  }}
                >
                  Rasm tanlash
                  <input hidden type="file" accept="image/*" onChange={onImageChange} />
                </Button>
              )}
            </Box>
          </Box>
        )}

        <TextField
          fullWidth
          label="Ism"
          value={form.first_name}
          onChange={onFormChange("first_name")}
        />
        <TextField
          fullWidth
          label="Familiya"
          value={form.last_name}
          onChange={onFormChange("last_name")}
        />
        <TextField
          fullWidth
          label="Foydalanuvchi nomi"
          value={form.username}
          onChange={onFormChange("username")}
        />
        <TextField
          fullWidth
          label={selectedUser ? "Yangi password" : "Password"}
          type="password"
          value={form.password}
          onChange={onFormChange("password")}
        />
        <TextField fullWidth label="Telefon" value={form.phone} onChange={onFormChange("phone")} />

        {(!selectedUser || canEditRole) && (
          <TextField
            select
            fullWidth
            label="Ruxsat turi"
            value={form.role}
            onChange={onFormChange("role")}
          >
            {roleOptions.map((role) => (
              <MenuItem key={role} value={role}>
                {roleNames[role] || role}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button
        onClick={onClose}
        sx={{
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 850,
          color: "#475569",
        }}
      >
        Bekor qilish
      </Button>

      <Button
        variant="contained"
        onClick={onSave}
        disabled={saving}
        sx={{
          minWidth: 120,
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 900,
          background: "linear-gradient(135deg, #8b0101, #b91c1c)",
          boxShadow: "0 12px 25px rgba(139, 1, 1, 0.2)",
          "&:hover": {
            background: "linear-gradient(135deg, #7f0101, #991b1b)",
          },
        }}
      >
        {saving ? "Saqlanmoqda..." : submitText}
      </Button>
    </DialogActions>
  </Dialog>
);

const Users = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const setCurrentUser = auth?.setUser;
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    total: 0,
    offset: 0,
    limit: 10,
  });

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [deletedFilter, setDeletedFilter] = useState("false");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [selectedUser, setSelectedUser] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedAction, setDeletedAction] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const createRoleOptions = useMemo(() => {
    if (currentUser?.role === "super_admin") return SUPER_ADMIN_CREATE_ROLES;
    if (currentUser?.role === "admin") return STAFF_ROLES;
    return [];
  }, [currentUser?.role]);

  const editRoleOptions = useMemo(() => {
    if (currentUser?.role === "super_admin") return SUPER_ADMIN_CREATE_ROLES;
    if (currentUser?.role === "admin") return STAFF_ROLES;
    return [];
  }, [currentUser?.role]);

  const canManageUsers = hasPermission(currentUser, "users.manage");
  const canCreateUser = ["super_admin", "admin"].includes(currentUser?.role) && canManageUsers;
  const isWorkerView = currentUser?.role === "worker";
  const canOpenUserDetail = ["super_admin", "admin"].includes(currentUser?.role);
  const showingDeleted = deletedFilter === "true";

  const isCurrentUser = (user) => Number(currentUser?.id) === Number(user?.id);

  const canEditUser = (user) => {
    if (!currentUser || !user) return false;
    if (user.is_deleted) return currentUser.role === "super_admin";
    if (isCurrentUser(user)) return true;
    if (!canManageUsers) return false;
    if (currentUser.role === "super_admin") return true;
    if (currentUser.role === "admin") return STAFF_ROLES.includes(user.role);

    return false;
  };

  const canDeleteUser = (user) => {
    if (!currentUser || !user || user.is_deleted) return false;

    return currentUser.role === "super_admin" && !isCurrentUser(user);
  };

  const canEditRole = (user) => {
    if (!currentUser || !user) return false;
    if (user.is_deleted) return currentUser.role === "super_admin";

    if (!canManageUsers) return false;
    if (currentUser.role === "super_admin") return user.role !== "super_admin";
    if (currentUser.role === "admin") return STAFF_ROLES.includes(user.role);

    return false;
  };

  const fetchUsers = async (offset = 0, limit = pageInfo.limit) => {
    setLoading(true);

    try {
      const res = await getUsers({
        q: query,
        role: roleFilter || undefined,
        is_deleted: currentUser?.role === "super_admin" ? showingDeleted : false,
        offset,
        limit,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const data = res.data || res;

      setUsers(data.users || []);
      setPageInfo(data.pageInfo || { total: 0, offset, limit });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Foydalanuvchilarni olishda xato.");
    } finally {
      setLoading(false);
    }
  };

  // fetchUsers is intentionally recreated with the active filter values.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(0, pageInfo.limit), 250);

    return () => clearTimeout(timer);
  }, [query, sortBy, sortOrder, roleFilter, deletedFilter, pageInfo.limit]);

  const handleSearch = () => {
    fetchUsers(0, pageInfo.limit);
  };

  const handleFormChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const openCreateModal = () => {
    setForm({
      ...emptyForm,
      role: createRoleOptions[0] || "customer",
    });
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setForm(emptyForm);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      username: user.username || "",
      password: "",
      phone: user.phone || "",
      role: user.role || "customer",
    });
    setImageFile(null);
    setImagePreview(user.user_image || "");
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setSelectedUser(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteOpen(false);
    setSelectedUser(null);
  };

  const openDeletedAction = (user, action) => {
    setSelectedUser(user);
    setDeletedAction(action);
  };

  const closeDeletedAction = () => {
    setDeletedAction("");
    setSelectedUser(null);
  };

  const handleCreateUser = async () => {
    setSaving(true);

    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        password: form.password,
        phone: form.phone || null,
        role: form.role,
      };

      if (currentUser?.role === "super_admin") {
        await createUserByAdmin(payload);
      } else {
        await createUserByStaff(payload);
      }

      toast.success("Foydalanuvchi qo'shildi.");
      closeCreateModal();
      fetchUsers(0, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Foydalanuvchi qo'shishda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setSaving(true);

    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        phone: form.phone || null,
      };

      if (form.password) payload.password = form.password;
      if (canEditRole(selectedUser)) payload.role = form.role;

      const res = await updateUser(selectedUser.id, payload);
      const updatedUser = res.data?.user || res.data?.updated_user || res.data || {};
      let updatedImageUser = null;

      if (imageFile && isCurrentUser(selectedUser)) {
        const imageRes = await updateUserImage(imageFile);
        updatedImageUser =
          imageRes.data?.user || imageRes.data?.updated_user || imageRes.data?.updatedUser || null;
      }

      if (isCurrentUser(selectedUser)) {
        const nextUser = {
          ...currentUser,
          ...payload,
          ...updatedUser,
          ...(updatedImageUser || {}),
        };

        localStorage.setItem("user", JSON.stringify(nextUser));
        setCurrentUser?.(nextUser);
      }

      toast.success("Foydalanuvchi ma'lumotlari yangilandi.");
      closeEditModal();
      fetchUsers(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Foydalanuvchini yangilashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setDeleting(true);

    try {
      await deleteUser(selectedUser.id);

      toast.success("Hodim o'chirildi.");
      closeDeleteModal();
      fetchUsers(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Foydalanuvchini o'chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletedAction = async () => {
    if (!selectedUser || !deletedAction) return;

    setDeleting(true);

    try {
      if (deletedAction === "restore") {
        await restoreUser(selectedUser.id);
        toast.success("Hodim qayta tiklandi.");
      } else {
        await permanentlyDeleteUser(selectedUser.id);
        toast.success("Hodim butkul o'chirildi.");
      }

      closeDeletedAction();
      fetchUsers(0, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Amalni bajarishda xatolik yuz berdi.");
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePage = (_, newPage) => {
    fetchUsers(newPage * pageInfo.limit, pageInfo.limit);
  };

  const resetFilters = () => {
    setQuery("");
    setRoleFilter("");
    setDeletedFilter("false");
    setSortBy("created_at");
    setSortOrder("desc");
  };

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2,
      }}
    >
      <Card sx={{ mb: 2.5, px: { xs: 2, md: 2.5 }, py: 2.2, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Box>
            <Chip
              label="Al-amin CRM - foydalanuvchilar"
              size="small"
              sx={{
                mb: 1,
                height: 25,
                fontSize: 12,
                fontWeight: 950,
                color: "#2563eb",
                background: "rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(37, 99, 235, 0.16)",
              }}
            />

            <Typography
              sx={{
                fontSize: { xs: 27, md: 33 },
                fontWeight: 950,
                color: "#0f172a",
                letterSpacing: "-0.055em",
                lineHeight: 1.05,
              }}
            >
              Foydalanuvchilar
            </Typography>

            <Typography
              sx={{
                mt: 0.7,
                fontSize: 14,
                fontWeight: 650,
                color: "#64748b",
              }}
            >
              {isWorkerView
                ? "Korxonadagi hamkasblar, lavozim va bo'lim ma'lumotlari."
                : "Korxona hodimlari, ruxsatlari va tizimdagi ma'lumotlari."}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, auto)" },
              gap: 1.4,
              width: { xs: "100%", md: "auto" },
            }}
          >
            <MiniStat label="Jami" value={pageInfo.total} />
            <MiniStat label="Sahifada" value={users.length} />
            <MiniStat
              label="Ruxsat turi"
              value={currentUser?.role === "super_admin" ? "Barcha" : "Cheklangan"}
            />
          </Box>
        </Box>
      </Card>

      <Card sx={{ mb: 2.5, p: 2, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "stretch", xl: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", xl: "row" },
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: currentUser?.role === "super_admin" ? "repeat(5, 1fr)" : "repeat(4, 1fr)",
              },
              gap: 1.4,
              flex: 1,
            }}
          >
            <TextField
              size="small"
              label="Qidirish"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />

            <TextField
              select
              size="small"
              label="Ruxsat turi"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">Barchasi</MenuItem>
              <MenuItem value="super_admin">Super admin</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              {!isWorkerView && <MenuItem value="client">Mijoz</MenuItem>}
              {!isWorkerView && <MenuItem value="customer">Xaridor</MenuItem>}
              <MenuItem value="worker">Ishchi</MenuItem>
            </TextField>

            {currentUser?.role === "super_admin" && (
              <TextField
                select
                size="small"
                label="Holati"
                value={deletedFilter}
                onChange={(e) => setDeletedFilter(e.target.value)}
              >
                <MenuItem value="false">Faol hodimlar</MenuItem>
                <MenuItem value="true">O'chirilgan hodimlar</MenuItem>
              </TextField>
            )}

            <TextField
              select
              size="small"
              label="Saralash"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="created_at">Yaratilgan</MenuItem>
              <MenuItem value="updated_at">Yangilangan</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Tartib"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <MenuItem value="desc">Yangidan eskiga</MenuItem>
              <MenuItem value="asc">Eskidan yangiga</MenuItem>
            </TextField>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1.4,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Button
              variant="outlined"
              onClick={resetFilters}
              sx={{
                minWidth: 135,
                height: 42,
                borderRadius: "13px",
                textTransform: "none",
                fontWeight: 900,
                color: "#0f172a",
                borderColor: "rgba(37, 99, 235, 0.2)",
                background: "#fff",
              }}
            >
              Tozalash
            </Button>

            {canCreateUser && (
              <Button
                variant="contained"
                onClick={openCreateModal}
                sx={{
                  minWidth: 215,
                  height: 42,
                  borderRadius: "13px",
                  textTransform: "none",
                  fontWeight: 950,
                  background: "linear-gradient(135deg, #8b0101, #b91c1c)",
                  boxShadow: "0 14px 28px rgba(139, 1, 1, 0.2)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #7f0101, #991b1b)",
                  },
                }}
              >
                Foydalanuvchi qo'shish
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      <Card
        sx={{
          minHeight: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ minHeight: 0, flex: 1, overflow: "auto" }}>
          <Table
            sx={{
              minWidth: isWorkerView ? 720 : 980,
              "& th": {
                py: 1.7,
                fontSize: 12,
                fontWeight: 950,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                background: "rgba(248, 250, 252, 0.95)",
                borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
              },
              "& td": {
                py: 1.55,
                borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
              },
              "& tbody tr:hover": {
                background: canOpenUserDetail ? "rgba(37, 99, 235, 0.035)" : "inherit",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Foydalanuvchi</TableCell>
                {isWorkerView ? (
                  <>
                    <TableCell>Lavozim</TableCell>
                    <TableCell>Bo'lim</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>Foydalanuvchi nomi</TableCell>
                    <TableCell>Telefon</TableCell>
                  </>
                )}
                <TableCell>Ruxsat turi</TableCell>
                {!isWorkerView && <TableCell>Yangilangan sana</TableCell>}
                {!isWorkerView && <TableCell align="right">Amallar</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isWorkerView ? 4 : 6} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : users.length ? (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    onClick={() => {
                      if (canOpenUserDetail && !user.is_deleted) navigate(`/users/${user.id}`);
                    }}
                    sx={{
                      cursor: canOpenUserDetail && !user.is_deleted ? "pointer" : "default",
                      opacity: user.is_deleted ? 0.65 : 1,
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.6 }}>
                        <Avatar
                          src={getImageUrl(user.user_image)}
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: "#8b0101",
                            color: "#fff",
                            fontWeight: 950,
                            border: "3px solid #fff",
                            boxShadow: "0 10px 24px rgba(139, 1, 1, 0.14)",
                          }}
                        >
                          {getInitial(user)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: 14.5,
                              fontWeight: 900,
                              color: "#0f172a",
                              lineHeight: 1.15,
                            }}
                          >
                            {user.first_name} {user.last_name}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              fontSize: 12.5,
                              fontWeight: 700,
                              color: user.is_deleted ? "#dc2626" : "#64748b",
                            }}
                          >
                            {user.is_deleted ? "O'chirilgan" : `ID: ${user.id}`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {isWorkerView ? (
                      <>
                        <TableCell sx={{ fontWeight: 750, color: "#334155" }}>
                          {user.position_name || "Lavozim biriktirilmagan"}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 750, color: "#334155" }}>
                          {user.department_name || "Bo'lim biriktirilmagan"}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={{ fontWeight: 800, color: "#334155" }}>
                          {user.username || "-"}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#334155" }}>
                          {user.phone || "-"}
                        </TableCell>
                      </>
                    )}

                    <TableCell>
                      <RoleChip role={user.role} />
                    </TableCell>

                    {!isWorkerView && (
                      <TableCell sx={{ fontWeight: 750, color: "#334155" }}>
                        {formatDate(user.updated_at)}
                      </TableCell>
                    )}

                    {!isWorkerView && (
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
                        >
                          {user.is_deleted && currentUser?.role === "super_admin" ? (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditModal(user);
                                }}
                              >
                                Tahrirlash
                              </Button>

                              <Button
                                size="small"
                                color="success"
                                variant="outlined"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openDeletedAction(user, "restore");
                                }}
                              >
                                Qayta tiklash
                              </Button>

                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openDeletedAction(user, "permanent");
                                }}
                              >
                                Butkul o'chirish
                              </Button>
                            </>
                          ) : (
                            <>
                              {canEditUser(user) && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEditModal(user);
                                  }}
                                  sx={{
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontWeight: 900,
                                  }}
                                >
                                  O'zgartirish
                                </Button>
                              )}

                              {canDeleteUser(user) && (
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openDeleteModal(user);
                                  }}
                                  sx={{
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    fontWeight: 900,
                                  }}
                                >
                                  O'chirish
                                </Button>
                              )}
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={isWorkerView ? 4 : 6}
                    align="center"
                    sx={{
                      py: 7,
                      color: "#64748b",
                      fontWeight: 850,
                    }}
                  >
                    Foydalanuvchilar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid rgba(148, 163, 184, 0.18)",
            background: "rgba(248, 250, 252, 0.65)",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) => handleChangePage(null, nextPage)}
            onLimitChange={(limit) => fetchUsers(0, limit)}
          />
        </Box>
      </Card>

      <FormDialog
        open={createOpen}
        title="Foydalanuvchi qo'shish"
        form={form}
        saving={saving}
        roleOptions={createRoleOptions}
        onClose={closeCreateModal}
        onSave={handleCreateUser}
        onFormChange={handleFormChange}
        submitText="Qo'shish"
      />

      <FormDialog
        open={editOpen}
        title="Foydalanuvchini tahrirlash"
        form={form}
        selectedUser={selectedUser}
        saving={saving}
        imagePreview={imagePreview}
        imageFileAllowed={selectedUser && isCurrentUser(selectedUser)}
        roleOptions={editRoleOptions}
        canEditRole={selectedUser && canEditRole(selectedUser)}
        onClose={closeEditModal}
        onSave={handleUpdateUser}
        onFormChange={handleFormChange}
        onImageChange={handleImageChange}
        submitText="Saqlash"
      />

      <Dialog
        open={deleteOpen}
        onClose={closeDeleteModal}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "22px",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>Foydalanuvchini o'chirish</DialogTitle>

        <DialogContent>
          <Typography sx={{ color: "#334155", fontWeight: 650 }}>
            {selectedUser?.first_name} {selectedUser?.last_name} ni o'chirmoqchimisiz?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDeleteModal}>Bekor qilish</Button>
          <Button color="error" variant="contained" onClick={handleDeleteUser} disabled={deleting}>
            {deleting ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deletedAction)}
        onClose={closeDeletedAction}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "22px",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>
          {deletedAction === "restore"
            ? "Foydalanuvchini qayta tiklash"
            : "Foydalanuvchini butkul o'chirish"}
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ color: "#334155", fontWeight: 650 }}>
            {selectedUser?.first_name} {selectedUser?.last_name}
            {deletedAction === "restore"
              ? " qayta faol hodimlar ro'yxatiga o'tkazilsinmi?"
              : " bazadan butkul o'chirilsinmi? Bu amalni ortga qaytarib bo'lmaydi."}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeDeletedAction}>Bekor qilish</Button>
          <Button
            color={deletedAction === "restore" ? "success" : "error"}
            variant="contained"
            onClick={handleDeletedAction}
            disabled={deleting}
          >
            {deleting
              ? "Bajarilmoqda..."
              : deletedAction === "restore"
                ? "Qayta tiklash"
                : "Butkul o'chirish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;

