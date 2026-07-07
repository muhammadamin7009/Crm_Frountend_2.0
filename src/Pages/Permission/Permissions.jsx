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
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { getPermissionSettings, updateUserPermissions } from "../../api/permissions";

const presets = [
  {
    label: "Ishlab chiqarish admini",
    description: "Hodim, mahsulot va ish hisobotlarini yuritadi. Moliyaviy sirlar yopiq qoladi.",
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
    description: "Mijoz savdosi va mijoz to'lovlarini yuritadi.",
    permissions: [
      "dashboard.view",
      "products.view",
      "client_sales.view",
      "client_sales.manage",
    ],
  },
  {
    label: "Homashyo admini",
    description: "Ta'minotchi, homashyo xaridi va to'lovlarini yuritadi.",
    permissions: [
      "dashboard.view",
      "material_purchases.view",
      "material_purchases.manage",
    ],
  },
  {
    label: "Hisobchi",
    description: "Oylik, kassa, xarajat va moliyaviy hisobotlarni ko'radi va yuritadi.",
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

const getFullName = (user) => `${user?.first_name || ""} ${user?.last_name || ""}`.trim();

const getImageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const Permissions = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const selectedAdmin = useMemo(
    () => admins.find((admin) => Number(admin.id) === Number(selectedId)),
    [admins, selectedId],
  );

  const selectedSet = useMemo(() => new Set(selectedPermissions), [selectedPermissions]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await getPermissionSettings();
      setAdmins(data.admins || []);
      setGroups(data.groups || []);
      const firstAdmin = data.admins?.[0];
      setSelectedId(firstAdmin?.id || null);
      setSelectedPermissions(firstAdmin?.permissions || []);
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
    setSelectedId(admin.id);
    setSelectedPermissions(admin.permissions || []);
  };

  const togglePermission = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const toggleGroup = (group) => {
    const keys = group.permissions.map((permission) => permission.key);
    const allSelected = keys.every((key) => selectedSet.has(key));

    setSelectedPermissions((prev) => {
      const current = new Set(prev);
      keys.forEach((key) => {
        if (allSelected) current.delete(key);
        else current.add(key);
      });
      return [...current];
    });
  };

  const applyPreset = (preset) => {
    setSelectedPermissions(preset.permissions);
  };

  const handleSave = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    try {
      const { data } = await updateUserPermissions(selectedAdmin.id, selectedPermissions);
      toast.success(data.message || "Ruxsatlar saqlandi.");
      setAdmins((prev) =>
        prev.map((admin) =>
          Number(admin.id) === Number(selectedAdmin.id)
            ? { ...admin, permissions: data.permissions || selectedPermissions }
            : admin,
        ),
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ruxsatlarni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="flex h-full items-center justify-center">
        <CircularProgress size={34} />
      </Box>
    );
  }

  return (
    <Box className="crm-page flex h-full flex-col overflow-hidden">
      <Box className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <Box>
          <Typography variant="h5" fontWeight={950} className="text-slate-950">
            Ruxsatlar va nazorat
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            Admin qaysi bo'limga kirishi va qaysi amalni bajarishini super admin belgilaydi.
          </Typography>
        </Box>
        <Chip
          label={`${admins.length} ta admin`}
          sx={{ bgcolor: "#fff", border: "1px solid #e6edf7", fontWeight: 900 }}
        />
      </Box>

      <Box className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[330px_1fr]">
        <Paper elevation={0} className="crm-card min-h-0 overflow-hidden p-3">
          <Typography fontWeight={950} className="px-2 pb-3 text-slate-950">
            Adminlar
          </Typography>
          <Box className="max-h-full space-y-2 overflow-auto pr-1">
            {admins.length ? (
              admins.map((admin) => {
                const active = Number(admin.id) === Number(selectedId);
                return (
                  <Button
                    key={admin.id}
                    fullWidth
                    onClick={() => selectAdmin(admin)}
                    sx={{
                      justifyContent: "flex-start",
                      gap: 1.4,
                      p: 1.3,
                      border: "1px solid",
                      borderColor: active ? "#8f1d20" : "#e6edf7",
                      bgcolor: active ? "rgba(143,29,32,.08)" : "#fff",
                      color: "#0f172a",
                      textAlign: "left",
                    }}
                  >
                    <Avatar src={getImageUrl(admin.user_image)} sx={{ width: 42, height: 42, bgcolor: "#8f1d20" }}>
                      {admin.first_name?.[0]?.toUpperCase() || "A"}
                    </Avatar>
                    <Box className="min-w-0 flex-1">
                      <Typography className="truncate" fontWeight={950}>
                        {getFullName(admin) || admin.username}
                      </Typography>
                      <Typography variant="body2" className="truncate text-slate-500">
                        {admin.permissions?.length || 0} ta ruxsat
                      </Typography>
                    </Box>
                  </Button>
                );
              })
            ) : (
              <Box className="rounded-lg border border-dashed border-slate-300 p-4 text-center">
                <Typography className="text-slate-500">Admin topilmadi.</Typography>
              </Box>
            )}
          </Box>
        </Paper>

        <Paper elevation={0} className="crm-card min-h-0 overflow-hidden p-4">
          {selectedAdmin ? (
            <Box className="flex h-full flex-col overflow-hidden">
              <Box className="flex flex-wrap items-start justify-between gap-3 pb-4">
                <Box>
                  <Typography fontWeight={950} className="text-slate-950">
                    {getFullName(selectedAdmin) || selectedAdmin.username}
                  </Typography>
                  <Typography variant="body2" className="mt-1 text-slate-500">
                    Tanlangan ruxsatlar: {selectedPermissions.length} ta
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={() => setSelectedPermissions([])} disabled={saving}>
                    Hammasini o'chirish
                  </Button>
                  <Button variant="contained" onClick={handleSave} disabled={saving}>
                    {saving ? "Saqlanmoqda..." : "Saqlash"}
                  </Button>
                </Stack>
              </Box>

              <Box className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outlined"
                    onClick={() => applyPreset(preset)}
                    sx={{ justifyContent: "flex-start", p: 1.4, textAlign: "left", alignItems: "flex-start" }}
                  >
                    <Box>
                      <Typography fontWeight={950}>{preset.label}</Typography>
                      <Typography variant="body2" className="mt-1 text-slate-500">
                        {preset.description}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Box>

              <Divider />

              <Box className="min-h-0 flex-1 overflow-auto pr-1 pt-4">
                <Box className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {groups.map((group) => {
                    const keys = group.permissions.map((permission) => permission.key);
                    const checkedCount = keys.filter((key) => selectedSet.has(key)).length;
                    const allSelected = checkedCount === keys.length;

                    return (
                      <Paper key={group.group} elevation={0} className="border border-slate-200 p-4">
                        <Box className="mb-2 flex items-center justify-between gap-3">
                          <Box>
                            <Typography fontWeight={950}>{group.group}</Typography>
                            <Typography variant="body2" className="text-slate-500">
                              {checkedCount} / {keys.length} ruxsat yoqilgan
                            </Typography>
                          </Box>
                          <Button size="small" variant="outlined" onClick={() => toggleGroup(group)}>
                            {allSelected ? "O'chirish" : "Hammasi"}
                          </Button>
                        </Box>

                        <Stack spacing={1.2}>
                          {group.permissions.map((permission) => (
                            <Box
                              key={permission.key}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedSet.has(permission.key)}
                                    onChange={() => togglePermission(permission.key)}
                                  />
                                }
                                label={
                                  <Box>
                                    <Typography fontWeight={900}>{permission.label}</Typography>
                                    <Typography variant="body2" className="text-slate-500">
                                      {permission.description}
                                    </Typography>
                                  </Box>
                                }
                                sx={{ m: 0, alignItems: "flex-start" }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box className="flex h-full items-center justify-center">
              <Typography className="text-slate-500">Ruxsat berish uchun admin tanlang.</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Permissions;
