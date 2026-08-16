import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  CompatDialog as Dialog,
  CompatStack as Stack,
  CompatTextField as TextField,
} from "../../Components/UI/MuiCompat";

import SharedHeroMetric from "../../Components/UI/HeroMetric";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import CrmPagination from "../../Components/Common/CrmPagination";
import { useAuth } from "../../Context/AuthContext";
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
import { hasPermission } from "../../utils/permissions";

const STAFF_ROLES = ["super_admin", "admin", "worker"];

const roleNames = {
  super_admin: "Super administrator",
  admin: "Administrator",
  worker: "Ishchi",
};

const emptyForm = {
  first_name: "",
  last_name: "",
  username: "",
  password: "",
  phone: "+998",
  role: "worker",
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const formatNameValue = (value = "") =>
  String(value)
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => {
      const lower = part.toLocaleLowerCase("uz-UZ");

      return lower ? `${lower[0].toLocaleUpperCase("uz-UZ")}${lower.slice(1)}` : "";
    })
    .join(" ");

const compactPhoneValue = (value = "") => {
  const text = String(value).trim();

  if (!text) return "";

  const digits = text.replace(/\D/g, "");

  return text.startsWith("+") ? `+${digits}` : digits;
};

const formatPhoneInput = (value = "") => {
  const text = String(value).trim();

  if (!text) return "";

  const digits = text.replace(/\D/g, "");

  const isUzbekPhone = text.startsWith("+998") || digits.startsWith("998") || text === "+998";

  if (!isUzbekPhone) {
    return text.startsWith("+") ? `+${digits}` : digits;
  }

  const local = digits.startsWith("998") ? digits.slice(3) : digits;

  let formatted = "+998";

  if (local.length > 0) {
    formatted += ` (${local.slice(0, 2)}`;
  }

  if (local.length >= 2) {
    formatted += ")";
  }

  if (local.length > 2) {
    formatted += ` ${local.slice(2, 5)}`;
  }

  if (local.length > 5) {
    formatted += `-${local.slice(5, 7)}`;
  }

  if (local.length > 7) {
    formatted += `-${local.slice(7, 9)}`;
  }

  return formatted;
};

const normalizePhoneForSubmit = (value = "") => {
  const phone = compactPhoneValue(value);

  if (!phone || phone === "+998") {
    return null;
  }

  if (!phone.startsWith("+")) {
    throw new Error("Telefon raqam + bilan boshlansin.");
  }

  if (phone.startsWith("+998") && !/^\+998\d{9}$/.test(phone)) {
    throw new Error("O‘zbekiston raqami +998 dan keyin 9 ta raqam bo‘lishi kerak.");
  }

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new Error("Telefon xalqaro formatda bo‘lishi kerak.");
  }

  return phone;
};

const getImageUrl = (path) => {
  if (!path) return undefined;

  if (path.startsWith("http")) {
    return path;
  }

  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

const formatDate = (value) => {
  if (!value) return "-";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
};

const getInitials = (user) => {
  const first = user?.first_name?.[0] || "";
  const last = user?.last_name?.[0] || "";

  return `${first}${last}`.toUpperCase() || user?.username?.slice(0, 2)?.toUpperCase() || "U";
};

const RoleChip = ({ role }) => {
  const styles = {
    super_admin: {
      color: "#6e1622",
      background: "rgba(110, 22, 34,.09)",
    },
    admin: {
      color: "#1f6f8b",
      background: "rgba(31, 111, 139,.09)",
    },
    worker: {
      color: "#a06a12",
      background: "rgba(160, 106, 18,.12)",
    },
  };

  const style = styles[role] || {
    color: "var(--aa-text-secondary)",
    background: "var(--aa-surface-muted)",
  };

  return (
    <Chip
      size="small"
      label={roleNames[role] || role || "-"}
      sx={{
        height: 25,
        color: style.color,
        fontSize: 9.5,
        fontWeight: 700,
        backgroundColor: style.background,
      }}
    />
  );
};

const HeroMetric = (props) => <SharedHeroMetric {...props} />;
const Users = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const setCurrentUser = auth?.setUser;
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);

  const [roleCounts, setRoleCounts] = useState({
    super_admin: 0,
    admin: 0,
    worker: 0,
  });

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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [selectedUser, setSelectedUser] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedAction, setDeletedAction] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const showingDeleted = deletedFilter === "true";

  const isWorkerView = currentUser?.role === "worker";

  const canManageUsers = hasPermission(currentUser, "users.manage");

  const canCreateUser = canManageUsers;

  const createRoleOptions = useMemo(() => {
    if (currentUser?.role === "super_admin") {
      return ["admin", "worker"];
    }

    if (currentUser?.role === "admin") {
      return ["worker"];
    }

    return [];
  }, [currentUser?.role]);

  const isCurrentUser = (user) => Number(currentUser?.id) === Number(user?.id);

  const canEditUser = (user) => {
    if (!user || !currentUser) return false;

    if (user.is_deleted) {
      return currentUser.role === "super_admin";
    }

    if (isCurrentUser(user)) return true;

    if (!canManageUsers) return false;

    if (currentUser.role === "super_admin") {
      return true;
    }

    return currentUser.role === "admin" && user.role === "worker";
  };

  const canDeleteUser = (user) =>
    currentUser?.role === "super_admin" && !user?.is_deleted && !isCurrentUser(user);

  const canEditRole = (user) => {
    if (!user || !currentUser) return false;

    if (!canManageUsers) return false;

    if (currentUser.role === "super_admin") {
      return user.role !== "super_admin";
    }

    return currentUser.role === "admin" && user.role === "worker";
  };

  const loadUsers = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        const countRequests = STAFF_ROLES.map((role) =>
          getUsers({
            scope: "staff",
            role,
            offset: 0,
            limit: 1,
            is_deleted: false,
          }),
        );

        const [usersResult, ...countResults] = await Promise.allSettled([
          getUsers({
            q: query,
            scope: "staff",
            role: roleFilter || undefined,
            is_deleted: currentUser?.role === "super_admin" ? showingDeleted : false,
            offset,
            limit,
            sort_by: sortBy,
            sort_order: sortOrder,
          }),

          ...countRequests,
        ]);

        if (usersResult.status === "rejected") {
          throw usersResult.reason;
        }

        const response = usersResult.value.data || usersResult.value;

        setUsers(response.users || []);

        setPageInfo(
          response.pageInfo || {
            total: 0,
            offset,
            limit,
          },
        );

        const nextCounts = {
          super_admin: 0,
          admin: 0,
          worker: 0,
        };

        countResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const role = STAFF_ROLES[index];
            const countData = result.value?.data || result.value || {};

            nextCounts[role] = countData.pageInfo?.total || 0;
          }
        });

        setRoleCounts(nextCounts);
      } catch (error) {
        toast.error(error?.response?.data?.message || "Foydalanuvchilarni olishda xato.");
      } finally {
        setLoading(false);
      }
    },
    [currentUser?.role, pageInfo.limit, query, roleFilter, showingDeleted, sortBy, sortOrder],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(0, pageInfo.limit);
    }, 250);

    return () => clearTimeout(timer);
  }, [loadUsers, pageInfo.limit]);

  const handleFormChange = (field) => (event) => {
    const value = field === "phone" ? formatPhoneInput(event.target.value) : event.target.value;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openCreateModal = () => {
    setForm({
      ...emptyForm,
      role: createRoleOptions[0] || "worker",
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
      phone: formatPhoneInput(user.phone || ""),
      role: user.role || "worker",
    });

    setImageFile(null);
    setImagePreview(getImageUrl(user.user_image) || "");

    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setSelectedUser(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Ism va familiyani kiriting.");
      return;
    }

    if (!form.username.trim()) {
      toast.error("Foydalanuvchi nomini kiriting.");
      return;
    }

    if (!form.password || form.password.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo‘lsin.");
      return;
    }

    if (!form.role) {
      toast.error("Ruxsat turini tanlang.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        first_name: formatNameValue(form.first_name),
        last_name: formatNameValue(form.last_name),
        username: form.username.trim(),
        password: form.password,
        phone: normalizePhoneForSubmit(form.phone),
        role: form.role,
      };

      if (currentUser?.role === "super_admin") {
        await createUserByAdmin(payload);
      } else {
        await createUserByStaff(payload);
      }

      toast.success("Foydalanuvchi qo‘shildi.");

      closeCreateModal();
      loadUsers(0, pageInfo.limit);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Foydalanuvchi qo‘shishda xato.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Ism va familiyani kiriting.");
      return;
    }

    if (!form.username.trim()) {
      toast.error("Foydalanuvchi nomini kiriting.");
      return;
    }

    if (form.password && form.password.length < 6) {
      toast.error("Yangi parol kamida 6 ta belgidan iborat bo‘lsin.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        first_name: formatNameValue(form.first_name),
        last_name: formatNameValue(form.last_name),
        username: form.username.trim(),
        phone: normalizePhoneForSubmit(form.phone),
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (canEditRole(selectedUser)) {
        payload.role = form.role;
      }

      const response = await updateUser(selectedUser.id, payload);

      let imageUser = null;

      if (imageFile && isCurrentUser(selectedUser)) {
        const imageResponse = await updateUserImage(imageFile);

        imageUser = imageResponse.data?.user || imageResponse.data?.updated_user || null;
      }

      if (isCurrentUser(selectedUser)) {
        const updatedUser =
          response.data?.user || response.data?.updated_user || response.data || {};

        const nextUser = {
          ...currentUser,
          ...payload,
          ...updatedUser,
          ...(imageUser || {}),
        };

        localStorage.setItem("user", JSON.stringify(nextUser));
        setCurrentUser?.(nextUser);
      }

      toast.success("Foydalanuvchi yangilandi.");

      closeEditModal();
      loadUsers(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Foydalanuvchini yangilashda xato.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setDeleting(true);

    try {
      await deleteUser(selectedUser.id);

      toast.success("Foydalanuvchi o‘chirildi.");

      setDeleteOpen(false);
      setSelectedUser(null);

      loadUsers(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Foydalanuvchini o‘chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletedAction = async () => {
    if (!selectedUser || !deletedAction) {
      return;
    }

    setDeleting(true);

    try {
      if (deletedAction === "restore") {
        await restoreUser(selectedUser.id);
        toast.success("Foydalanuvchi qayta tiklandi.");
      } else {
        await permanentlyDeleteUser(selectedUser.id);
        toast.success("Foydalanuvchi butkul o‘chirildi.");
      }

      setDeletedAction("");
      setSelectedUser(null);

      loadUsers(0, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Amalni bajarishda xato.");
    } finally {
      setDeleting(false);
    }
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
      className="crm-page users-page"
      sx={{
        height: "100%",
        minHeight: 0,
        pb: 2.5,
        overflowY: "auto",
      }}
    >
      <style>{usersPageStyles}</style>

      <Box
        className="crm-page-hero users-hero"
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
              xl: ".85fr 1.15fr",
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
                Jamoa boshqaruvi
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
              Foydalanuvchilar
            </Typography>

            <Typography
              sx={{
                maxWidth: 530,
                mt: 1.4,
                color: "rgba(255,255,255,.45) !important",
                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Korxona xodimlari, administratorlar, lavozimlar va tizim ruxsatlarini boshqaring.
            </Typography>

            {canCreateUser && (
              <Button
                onClick={openCreateModal}
                sx={{
                  mt: 2.5,
                  minHeight: 44,
                  px: 2.2,
                  color: "#ffffff",
                  borderRadius: "13px",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "none",
                  background: "linear-gradient(135deg,#4d0f18,#7a1826)",
                  boxShadow: "0 12px 26px rgba(77, 15, 24,.20)",

                  "&:hover": {
                    background: "linear-gradient(135deg,#4d0f18,#6e1622)",
                  },
                }}
              >
                + Foydalanuvchi qo‘shish
              </Button>
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
              label="Jami foydalanuvchi"
              value={number(pageInfo.total)}
              helper="Tizim foydalanuvchilari"
              tone="red"
            />

            <HeroMetric
              label="Super administrator"
              value={number(roleCounts.super_admin)}
              helper="To‘liq boshqaruv"
              tone="blue"
            />

            <HeroMetric
              label="Administrator"
              value={number(roleCounts.admin)}
              helper="Boshqaruv xodimlari"
              tone="green"
            />

            <HeroMetric
              label="Ishchilar"
              value={number(roleCounts.worker)}
              helper="Ishlab chiqarish jamoasi"
              tone="amber"
            />
          </Box>
        </Box>
      </Box>

      <Paper
        className="crm-sticky-filters"
        elevation={0}
        sx={{
          mb: 2,
          p: 2,
          borderRadius: "21px",
          border: "1px solid #e8e1d8",
          backgroundColor: "var(--aa-surface-solid)",
          boxShadow: "0 12px 35px rgba(23, 17, 15,.045)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,minmax(0,1fr))",
              xl:
                currentUser?.role === "super_admin"
                  ? "2fr repeat(4,1fr) auto"
                  : "2fr repeat(3,1fr) auto",
            },
            gap: 1.3,
          }}
        >
          <TextField
            size="small"
            label="Foydalanuvchini qidirish"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <TextField
            select
            size="small"
            label="Ruxsat turi"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <MenuItem value="">Barchasi</MenuItem>

            {STAFF_ROLES.map((role) => (
              <MenuItem key={role} value={role}>
                {roleNames[role]}
              </MenuItem>
            ))}
          </TextField>

          {currentUser?.role === "super_admin" && (
            <TextField
              select
              size="small"
              label="Holati"
              value={deletedFilter}
              onChange={(event) => setDeletedFilter(event.target.value)}
            >
              <MenuItem value="false">Faol foydalanuvchilar</MenuItem>

              <MenuItem value="true">O‘chirilganlar</MenuItem>
            </TextField>
          )}

          <TextField
            select
            size="small"
            label="Saralash"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <MenuItem value="created_at">Yaratilgan sana</MenuItem>

            <MenuItem value="updated_at">Yangilangan sana</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Tartib"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <MenuItem value="desc">Yangidan eskiga</MenuItem>

            <MenuItem value="asc">Eskidan yangiga</MenuItem>
          </TextField>

          <Button
            onClick={resetFilters}
            sx={{
              minHeight: 40,
              px: 2,
              color: "var(--aa-text-secondary)",
              borderRadius: "11px",
              border: "1px solid #d8cec1",
              fontWeight: 600,
              textTransform: "none",

              "&:hover": {
                color: "#6e1622",
                borderColor: "rgba(110, 22, 34,.22)",
                backgroundColor: "rgba(110, 22, 34,.04)",
              },
            }}
          >
            Tozalash
          </Button>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          overflow: "hidden",
          borderRadius: "22px",
          border: "1px solid #e8e1d8",
          backgroundColor: "var(--aa-surface-solid)",
          boxShadow: "0 14px 40px rgba(23, 17, 15,.045)",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: "1px solid #e8e1d8",
          }}
        >
          <Typography
            sx={{
              color: "var(--aa-text)",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            Korxona jamoasi
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              color: "var(--aa-text-tertiary)",
              fontSize: 10.5,
            }}
          >
            Foydalanuvchi, lavozim va ruxsat ma’lumotlari
          </Typography>
        </Box>

        <Box
          className={`aa-mobile-records aa-users-table ${isWorkerView ? "worker-view" : "admin-view"}`}
          sx={{ overflowX: "auto" }}
        >
          <Table
            sx={{
              minWidth: isWorkerView ? 800 : 1080,

              "& th": {
                py: 1.6,
                color: "var(--aa-text-tertiary)",
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: ".045em",
                textTransform: "uppercase",
                backgroundColor: "var(--aa-surface-muted)",
                borderColor: "#e8e1d8",
              },

              "& td": {
                py: 1.45,
                color: "var(--aa-text-secondary)",
                fontSize: 10.5,
                borderColor: "#e8e1d8",
              },

              "& tbody tr:hover": {
                backgroundColor: "rgba(110, 22, 34,.025)",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Foydalanuvchi</TableCell>

                {isWorkerView ? (
                  <>
                    <TableCell>Lavozim</TableCell>

                    <TableCell>Bo‘lim</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>Foydalanuvchi nomi</TableCell>

                    <TableCell>Telefon</TableCell>
                  </>
                )}

                <TableCell>Ruxsat turi</TableCell>

                {!isWorkerView && <TableCell>Yangilangan</TableCell>}

                {!isWorkerView && <TableCell align="right">Amallar</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isWorkerView ? 4 : 6} align="center" sx={{ py: 8 }}>
                    <CircularProgress
                      size={30}
                      sx={{
                        color: "#6e1622",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : users.length ? (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    onClick={() => {
                      if (!isWorkerView && !user.is_deleted) {
                        navigate(`/users/${user.id}`);
                      }
                    }}
                    sx={{
                      cursor: !isWorkerView && !user.is_deleted ? "pointer" : "default",

                      opacity: user.is_deleted ? 0.62 : 1,
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.4,
                        }}
                      >
                        <Avatar
                          src={getImageUrl(user.user_image)}
                          sx={{
                            width: 45,
                            height: 45,
                            color: "#ffffff",
                            fontSize: 12,
                            fontWeight: 700,

                            background: "linear-gradient(135deg,#4b413c,#17110f)",

                            border: "3px solid #ffffff",

                            boxShadow: "0 8px 20px rgba(23, 17, 15,.15)",
                          }}
                        >
                          {getInitials(user)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            noWrap
                            sx={{
                              color: "var(--aa-text)",
                              fontSize: 12.5,
                              fontWeight: 700,
                            }}
                          >
                            {user.first_name} {user.last_name}
                          </Typography>

                          <Typography
                            noWrap
                            sx={{
                              mt: 0.4,

                              color: user.is_deleted ? "#8c1d2b" : "#8a807a",

                              fontSize: 9.5,
                            }}
                          >
                            {user.is_deleted ? "O‘chirilgan" : `ID: ${user.id}`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {isWorkerView ? (
                      <>
                        <TableCell>{user.position_name || "Lavozim biriktirilmagan"}</TableCell>

                        <TableCell>{user.department_name || "Bo‘lim biriktirilmagan"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <Typography
                            sx={{
                              color: "var(--aa-text)",
                              fontSize: 10.5,
                              fontWeight: 600,
                            }}
                          >
                            {user.username || "-"}
                          </Typography>
                        </TableCell>

                        <TableCell>{formatPhoneInput(user.phone || "") || "-"}</TableCell>
                      </>
                    )}

                    <TableCell>
                      <RoleChip role={user.role} />
                    </TableCell>

                    {!isWorkerView && <TableCell>{formatDate(user.updated_at)}</TableCell>}

                    {!isWorkerView && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.8} sx={{ justifyContent: "flex-end" }}>
                          {user.is_deleted && currentUser?.role === "super_admin" ? (
                            <>
                              <Button
                                size="small"
                                color="success"
                                variant="outlined"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedUser(user);
                                  setDeletedAction("restore");
                                }}
                                sx={tableActionSx}
                              >
                                Tiklash
                              </Button>

                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedUser(user);
                                  setDeletedAction("permanent");
                                }}
                                sx={tableActionSx}
                              >
                                Butkul o‘chirish
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
                                  sx={tableActionSx}
                                >
                                  Tahrirlash
                                </Button>
                              )}

                              {canDeleteUser(user) && (
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedUser(user);
                                    setDeleteOpen(true);
                                  }}
                                  sx={tableActionSx}
                                >
                                  O‘chirish
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
                      py: 8,
                      color: "var(--aa-text-tertiary)",
                      fontWeight: 600,
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
            borderTop: "1px solid #e8e1d8",
            backgroundColor: "var(--aa-surface-muted)",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) => loadUsers(nextPage * pageInfo.limit, pageInfo.limit)}
            onLimitChange={(limit) => loadUsers(0, limit)}
          />
        </Box>
      </Paper>

      <UserFormDialog
        open={createOpen}
        title="Foydalanuvchi qo‘shish"
        form={form}
        saving={saving}
        submitDisabled={
          !form.first_name.trim() ||
          !form.last_name.trim() ||
          !form.username.trim() ||
          form.password.length < 6
        }
        roleOptions={createRoleOptions}
        onClose={closeCreateModal}
        onSave={handleCreate}
        onFormChange={handleFormChange}
        submitText="Foydalanuvchini qo‘shish"
      />

      <UserFormDialog
        open={editOpen}
        title="Foydalanuvchini tahrirlash"
        form={form}
        saving={saving}
        submitDisabled={
          !form.first_name.trim() ||
          !form.last_name.trim() ||
          !form.username.trim() ||
          Boolean(form.password && form.password.length < 6)
        }
        roleOptions={createRoleOptions}
        selectedUser={selectedUser}
        canEditRole={selectedUser && canEditRole(selectedUser)}
        imagePreview={imagePreview}
        imageAllowed={selectedUser && isCurrentUser(selectedUser)}
        onImageChange={handleImageChange}
        onClose={closeEditModal}
        onSave={handleUpdate}
        onFormChange={handleFormChange}
        submitText="O‘zgarishlarni saqlash"
      />

      <UserConfirmDialog
        open={deleteOpen}
        title="Foydalanuvchini o‘chirish"
        description="Tanlangan foydalanuvchini o‘chirmoqchimisiz?"
        loading={deleting}
        confirmText="O‘chirish"
        color="error"
        onClose={() => {
          setDeleteOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDelete}
      />

      <UserConfirmDialog
        open={Boolean(deletedAction)}
        title={
          deletedAction === "restore"
            ? "Foydalanuvchini qayta tiklash"
            : "Foydalanuvchini butkul o‘chirish"
        }
        description={
          deletedAction === "restore"
            ? "Foydalanuvchi faol ro‘yxatga qaytarilsinmi?"
            : "Bu amalni ortga qaytarib bo‘lmaydi."
        }
        loading={deleting}
        confirmText={deletedAction === "restore" ? "Qayta tiklash" : "Butkul o‘chirish"}
        color={deletedAction === "restore" ? "success" : "error"}
        onClose={() => {
          setDeletedAction("");
          setSelectedUser(null);
        }}
        onConfirm={handleDeletedAction}
      />
    </Box>
  );
};

const UserFormDialog = ({
  open,
  title,
  form,
  saving,
  submitDisabled,
  roleOptions,
  selectedUser,
  canEditRole,
  imagePreview,
  imageAllowed,
  onImageChange,
  onClose,
  onSave,
  onFormChange,
  submitText,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="sm"
    PaperProps={{
      sx: {
        overflow: "hidden",
        borderRadius: "23px",
        border: "1px solid rgba(138, 128, 122,.20)",
        boxShadow: "0 30px 80px rgba(23, 17, 15,.22)",
      },
    }}
  >
    <DialogTitle
      sx={{
        px: 3,
        py: 2.4,
        color: "#ffffff",
        background:
          "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.23),transparent 35%),linear-gradient(135deg,#151211,#23151a)",
      }}
    >
      <Typography
        sx={{
          color: "#ffffff !important",
          fontSize: 19,
          fontWeight: 700,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "rgba(255,255,255,.46) !important",
          fontSize: 10.5,
        }}
      >
        Xodimning tizim va shaxsiy ma’lumotlari
      </Typography>
    </DialogTitle>

    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <DialogContent
        sx={{
          px: 3,
          pt: "24px !important",
        }}
      >
        {selectedUser && (
          <Box
            sx={{
              mb: 2.5,
              p: 1.7,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderRadius: "16px",
              border: "1px solid #e8e1d8",
              backgroundColor: "var(--aa-surface-muted)",
            }}
          >
            <Avatar
              src={imagePreview}
              sx={{
                width: 58,
                height: 58,
                color: "#ffffff",
                background: "linear-gradient(135deg,#4b413c,#17110f)",
                fontWeight: 700,
              }}
            >
              {getInitials(selectedUser)}
            </Avatar>

            <Box>
              <Typography
                sx={{
                  color: "var(--aa-text)",
                  fontSize: 13.5,
                  fontWeight: 700,
                }}
              >
                {selectedUser.first_name} {selectedUser.last_name}
              </Typography>

              {imageAllowed && (
                <Button
                  component="label"
                  size="small"
                  variant="outlined"
                  sx={{
                    mt: 0.8,
                    borderRadius: "9px",
                    fontSize: 9.5,
                    fontWeight: 600,
                    textTransform: "none",
                  }}
                >
                  Rasm tanlash
                  <input hidden type="file" accept="image/*" onChange={onImageChange} />
                </Button>
              )}
            </Box>
          </Box>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,minmax(0,1fr))",
            },
            gap: 1.7,
          }}
        >
          <TextField
            fullWidth
            required
            label="Ism"
            value={form.first_name}
            onChange={onFormChange("first_name")}
          />

          <TextField
            fullWidth
            required
            label="Familiya"
            value={form.last_name}
            onChange={onFormChange("last_name")}
          />

          <TextField
            fullWidth
            required
            label="Foydalanuvchi nomi"
            value={form.username}
            onChange={onFormChange("username")}
          />

          <TextField
            fullWidth
            required={!selectedUser}
            label={selectedUser ? "Yangi parol" : "Parol"}
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={onFormChange("password")}
          />

          <TextField
            fullWidth
            label="Telefon"
            value={form.phone}
            onChange={onFormChange("phone")}
            placeholder="+998 (96) 500-10-01"
          />

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
                  {roleNames[role]}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2.3,
          borderTop: "1px solid #e8e1d8",
          backgroundColor: "var(--aa-surface-muted)",
        }}
      >
        <Button type="button" onClick={onClose} disabled={saving} sx={dialogCancelSx}>
          Bekor qilish
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={saving || submitDisabled}
          sx={dialogPrimarySx}
        >
          {saving ? "Saqlanmoqda..." : submitText}
        </Button>
      </DialogActions>
    </Box>
  </Dialog>
);

const UserConfirmDialog = ({
  open,
  title,
  description,
  loading,
  confirmText,
  color,
  onClose,
  onConfirm,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="xs"
    PaperProps={{
      sx: {
        overflow: "hidden",
        borderRadius: "21px",
        border: "1px solid rgba(138, 128, 122,.20)",
        boxShadow: "0 30px 80px rgba(23, 17, 15,.22)",
      },
    }}
  >
    <DialogTitle
      className="users-confirm-dialog-title"
      sx={{
        px: 3,
        py: 2.25,
        color: "#ffffff !important",
        fontSize: 18,
        fontWeight: 700,
        backgroundColor: "#151211 !important",
        backgroundImage:
          "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.28),transparent 36%),linear-gradient(135deg,#151211,#2a1117) !important",
      }}
    >
      {title}
    </DialogTitle>

    <DialogContent
      sx={{
        px: 3,
        pt: "24px !important",
      }}
    >
      <Typography
        sx={{
          color: "var(--aa-text-secondary)",
          fontSize: 12.5,
          lineHeight: 1.7,
        }}
      >
        {description}
      </Typography>
    </DialogContent>

    <DialogActions
      sx={{
        px: 3,
        py: 2.1,
        borderTop: "1px solid #e8e1d8",
        backgroundColor: "var(--aa-surface-muted)",
      }}
    >
      <Button onClick={onClose} disabled={loading} sx={dialogCancelSx}>
        Bekor qilish
      </Button>

      <Button
        color={color}
        variant="contained"
        onClick={onConfirm}
        disabled={loading}
        sx={{
          minWidth: 120,
          minHeight: 40,
          borderRadius: "11px",
          fontWeight: 700,
          textTransform: "none",
        }}
      >
        {loading ? "Bajarilmoqda..." : confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

const tableActionSx = {
  borderRadius: "9px",
  fontSize: 9.5,
  fontWeight: 700,
  textTransform: "none",
};

const dialogCancelSx = {
  color: "var(--aa-text-secondary)",
  borderRadius: "11px",
  fontWeight: 600,
  textTransform: "none",
};

const dialogPrimarySx = {
  minWidth: 180,
  minHeight: 42,
  px: 2,
  color: "#ffffff",
  borderRadius: "12px",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",

  background: "linear-gradient(135deg,#4d0f18,#7a1826)",

  boxShadow: "0 10px 24px rgba(77, 15, 24,.18)",

  "&:hover": {
    background: "linear-gradient(135deg,#4d0f18,#6e1622)",
  },
};

const usersPageStyles = `
  .crm-page .users-hero {
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

  .users-confirm-dialog-title {
    color: #ffffff !important;
    background-color: #151211 !important;
  }
`;

export default Users;
