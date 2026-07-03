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
import { useAuth } from "../../Context/AuthContext";
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
import { useNavigate } from "react-router-dom";

const getImageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;

  return `${import.meta.env.VITE_API_URL}${path}`;
};

const STAFF_ROLES = ["client", "customer", "worker"];
const SUPER_ADMIN_CREATE_ROLES = ["admin", ...STAFF_ROLES];

const roleNames = {
  super_admin: "Super admin",
  admin: "Admin",
  client: "Mijoz",
  customer: "Xaridor",
  worker: "Ishchi",
};

const getRoleColor = (role) => {
  if (role === "super_admin") return "error";
  if (role === "admin") return "warning";
  if (role === "client") return "success";
  return "default";
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const emptyForm = {
  first_name: "",
  last_name: "",
  username: "",
  password: "",
  phone: "",
  role: "customer",
};

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

  const canCreateUser = ["super_admin", "admin"].includes(currentUser?.role);
  const isWorkerView = currentUser?.role === "worker";
  const canOpenUserDetail = ["super_admin", "admin"].includes(currentUser?.role);
  const showingDeleted = deletedFilter === "true";

  const isCurrentUser = (user) => {
    return Number(currentUser?.id) === Number(user?.id);
  };

  const canEditUser = (user) => {
    if (!currentUser || !user) return false;
    if (user.is_deleted) return currentUser.role === "super_admin";

    if (isCurrentUser(user)) return true;

    if (currentUser.role === "super_admin") return true;

    if (currentUser.role === "admin") {
      return STAFF_ROLES.includes(user.role);
    }

    return false;
  };

  const canDeleteUser = (user) => {
    if (!currentUser || !user || user.is_deleted) return false;

    return currentUser.role === "super_admin" && !isCurrentUser(user);
  };

  const canEditRole = (user) => {
    if (!currentUser || !user) return false;
    if (user.is_deleted) return currentUser.role === "super_admin";

    if (currentUser.role === "super_admin") {
      return user.role !== "super_admin";
    }

    if (currentUser.role === "admin") {
      return STAFF_ROLES.includes(user.role);
    }

    return false;
  };

  const editRoleOptions = useMemo(() => {
    if (currentUser?.role === "super_admin") return SUPER_ADMIN_CREATE_ROLES;
    if (currentUser?.role === "admin") return STAFF_ROLES;
    return [];
  }, [currentUser?.role]);

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

      if (form.password) {
        payload.password = form.password;
      }

      if (canEditRole(selectedUser)) {
        payload.role = form.role;
      }

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

  return (
    <Box className="crm-page flex h-full min-h-0 flex-col">
      <Box className="mb-5 flex justify-between items-center shrink-0">
        <Box>
          <Typography variant="h5" fontWeight={800} className="text-slate-950">
            Foydalanuvchilar
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            {isWorkerView
              ? "Korxonadagi hamkasblaringiz, ularning lavozimi va bo'limi"
              : "Korxona hodimlari, ruxsatlari va tizimdagi ma'lumotlari"}
          </Typography>
        </Box>

        <Box className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Typography variant="body2" className="text-slate-500">
              Jami
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {pageInfo.total}
            </Typography>
          </Box>
          <Box className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Typography variant="body2" className="text-slate-500">
              Sahifada
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {users.length}
            </Typography>
          </Box>
          <Box className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:block">
            <Typography variant="body2" className="text-slate-500">
              Ruxsat turi
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {currentUser?.role === "super_admin" ? "Barcha" : "Cheklangan"}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Paper elevation={0} className="mb-4 shrink-0 rounded-2xl border border-slate-200 p-4">
        <Box className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
              <MenuItem value="">Barcha ruxsat turlari</MenuItem>
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

            <Button
              variant="outlined"
              color="warning"
              onClick={() => {
                setQuery("");
                setRoleFilter("");
                setDeletedFilter("false");
                setSortBy("created_at");
                setSortOrder("desc");
              }}
            >
              Tozalash
            </Button>
          </Box>

          {canCreateUser && (
            <Button
              variant="contained"
              onClick={openCreateModal}
              sx={{ borderRadius: 2, minHeight: 40, px: 3, minWidth: 247 }}
            >
              Foydalanuvchi qo'shish
            </Button>
          )}
        </Box>
      </Paper>

      <Paper
        elevation={0}
        className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white"
      >
        <Box className="min-h-0 flex-1 overflow-auto">
          <Table sx={{ minWidth: isWorkerView ? 650 : 900 }}>
            <TableHead>
              <TableRow className="bg-slate-50">
                <TableCell sx={{ fontWeight: 700 }}>Foydalanuvchi</TableCell>
                {isWorkerView ? (
                  <>
                    <TableCell sx={{ fontWeight: 700 }}>Lavozim</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bo'lim</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Telefon</TableCell>
                  </>
                )}
                <TableCell sx={{ fontWeight: 700 }}>Ruxsat turi</TableCell>
                {!isWorkerView && <TableCell sx={{ fontWeight: 700 }}>Yangilangan sana</TableCell>}
                {!isWorkerView && (
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Amallar
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isWorkerView ? 4 : 6} align="center">
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : users.length ? (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    hover
                    className={canOpenUserDetail && !user.is_deleted ? "cursor-pointer" : ""}
                    onClick={() => {
                      if (canOpenUserDetail && !user.is_deleted) navigate(`/users/${user.id}`);
                    }}
                    sx={{
                      "&:last-child td": { borderBottom: 0 },
                      "&:hover":
                        canOpenUserDetail && !user.is_deleted ? { backgroundColor: "#FFF7ED" } : {},
                      opacity: user.is_deleted ? 0.72 : 1,
                    }}
                  >
                    <TableCell>
                      <Box className="flex items-center gap-3">
                        <Avatar
                          src={getImageUrl(user.user_image)}
                          sx={{ width: 44, height: 44, bgcolor: "#7F1D1D" }}
                        >
                          {user.first_name?.[0]}
                        </Avatar>

                        <Box>
                          <Typography fontWeight={600}>
                            {user.first_name} {user.last_name}
                          </Typography>
                          {user.is_deleted && (
                            <Typography variant="caption" color="error">
                              O'chirilgan
                            </Typography>
                          )}
                          {!isWorkerView && (
                            <Typography variant="body2" color="text.secondary">
                              ID: {user.id}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {isWorkerView ? (
                      <>
                        <TableCell>{user.position_name || "Lavozim biriktirilmagan"}</TableCell>
                        <TableCell>{user.department_name || "Bo'lim biriktirilmagan"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <Chip
                        size="small"
                        label={roleNames[user.role] || user.role}
                        color={getRoleColor(user.role)}
                        variant={user.role === "customer" ? "outlined" : "filled"}
                      />
                    </TableCell>

                    {!isWorkerView && (
                      <TableCell>
                        {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : "-"}
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
                  <TableCell colSpan={isWorkerView ? 4 : 6} align="center">
                    Foydalanuvchilar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <CrmPagination total={pageInfo.total} page={page} limit={pageInfo.limit} onPageChange={(nextPage) => handleChangePage(null, nextPage)} onLimitChange={(limit) => fetchUsers(0, limit)} />
      </Paper>

      <Dialog open={createOpen} onClose={closeCreateModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Foydalanuvchi qo'shish</DialogTitle>

        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <TextField
              fullWidth
              label="Ism"
              value={form.first_name}
              onChange={handleFormChange("first_name")}
            />
            <TextField
              fullWidth
              label="Familiya"
              value={form.last_name}
              onChange={handleFormChange("last_name")}
            />
            <TextField
              fullWidth
              label="Username"
              value={form.username}
              onChange={handleFormChange("username")}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={form.password}
              onChange={handleFormChange("password")}
            />
            <TextField
              fullWidth
              label="Telefon"
              value={form.phone}
              onChange={handleFormChange("phone")}
            />

            <TextField
              select
              fullWidth
              label="Ruxsat turi"
              value={form.role}
              onChange={handleFormChange("role")}
            >
              {createRoleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {roleNames[role] || role}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeCreateModal}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleCreateUser} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Qo'shish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={closeEditModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Foydalanuvchini tahrirlash</DialogTitle>

        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <Box className="flex items-center gap-3">
              <Avatar
                src={imagePreview || getImageUrl(selectedUser?.user_image)}
                sx={{ width: 64, height: 64 }}
              >
                {form.first_name?.[0]}
              </Avatar>

              {selectedUser && isCurrentUser(selectedUser) && (
                <Button variant="outlined" component="label">
                  Rasm tanlash
                  <input hidden type="file" accept="image/*" onChange={handleImageChange} />
                </Button>
              )}
            </Box>

            <TextField
              fullWidth
              label="Ism"
              value={form.first_name}
              onChange={handleFormChange("first_name")}
            />
            <TextField
              fullWidth
              label="Familiya"
              value={form.last_name}
              onChange={handleFormChange("last_name")}
            />
            <TextField
              fullWidth
              label="Username"
              value={form.username}
              onChange={handleFormChange("username")}
            />
            <TextField
              fullWidth
              label="Yangi password"
              type="password"
              value={form.password}
              onChange={handleFormChange("password")}
            />
            <TextField
              fullWidth
              label="Telefon"
              value={form.phone}
              onChange={handleFormChange("phone")}
            />

            {selectedUser && canEditRole(selectedUser) && (
              <TextField
                select
                fullWidth
                label="Ruxsat turi"
                value={form.role}
                onChange={handleFormChange("role")}
              >
                {editRoleOptions.map((role) => (
                  <MenuItem key={role} value={role}>
                    {roleNames[role] || role}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeEditModal}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleUpdateUser} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={closeDeleteModal} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Foydalanuvchini o'chirish</DialogTitle>

        <DialogContent>
          <Typography>
            {selectedUser?.first_name} {selectedUser?.last_name} ni o'chirmoqchimisiz?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDeleteModal}>Bekor qilish</Button>
          <Button color="error" variant="contained" onClick={handleDeleteUser} disabled={deleting}>
            {deleting ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deletedAction)} onClose={closeDeletedAction} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {deletedAction === "restore"
            ? "Foydalanuvchini qayta tiklash"
            : "Foydalanuvchini butkul o'chirish"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {selectedUser?.first_name} {selectedUser?.last_name}
            {deletedAction === "restore"
              ? " qayta faol hodimlar ro'yxatiga o'tkazilsinmi?"
              : " bazadan butkul o'chirilsinmi? Bu amalni ortga qaytarib bo'lmaydi."}
          </Typography>
        </DialogContent>
        <DialogActions>
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
