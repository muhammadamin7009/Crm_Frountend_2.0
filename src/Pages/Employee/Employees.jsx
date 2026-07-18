import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getUsers } from "../../api/getUsers";
import { getDepartments } from "../../api/departments";
import { hasPermission } from "../../utils/permissions";
import {
  createEmployee,
  createEmployeeAgreement,
  createPosition,
  getEmployees,
  getPositions,
} from "../../api/positions";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) =>
  `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
const typeLabels = {
  piece_rate: "Mahsulot bay",
  fixed_salary: "Doimiy maosh",
  daily_rate: "Kunlik",
  mixed: "Aralash",
  commission: "Foizli",
};
const periodLabels = { weekly: "Haftalik", monthly: "Oylik" };
const emptyPosition = { name: "", department_id: "", description: "" };
const emptyProfile = {
  user_id: "",
  position_id: "",
  hired_at: today(),
  note: "",
};
const emptyAgreement = {
  employee_id: "",
  payment_type: "fixed_salary",
  fixed_amount: "",
  daily_rate: "",
  commission_percent: "",
  payment_period: "monthly",
  effective_from: today(),
  note: "",
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const Employees = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();
  const canManage =
    ["super_admin", "admin"].includes(currentUser?.role) &&
    hasPermission(currentUser, "employees.manage");

  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [positionOpen, setPositionOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [positionForm, setPositionForm] = useState(emptyPosition);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [agreementForm, setAgreementForm] = useState(emptyAgreement);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const visibleEmployees = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("uz-UZ");
    if (!needle) return employees;
    return employees.filter((employee) =>
      [
        employee.first_name,
        employee.last_name,
        employee.username,
        employee.position_name,
        employee.department_name,
        typeLabels[employee.agreement?.payment_type],
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("uz-UZ")
        .includes(needle),
    );
  }, [employees, query]);

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "var(--aa-radius-md)",
      backgroundColor: "var(--aa-surface-solid)",
    },
  };

  const dialogProps = {
    PaperProps: {
      sx: {
        borderRadius: "var(--aa-radius-xl)",
        border: "1px solid var(--aa-border)",
        boxShadow: "var(--aa-shadow-lg)",
        backgroundImage: "none",
      },
    },
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [positionsRes, employeesRes, usersRes, departmentsRes] =
        await Promise.all([
          getPositions({ limit: 100 }),
          getEmployees({ limit: 100 }),
          getUsers({ limit: 100 }),
          getDepartments({ limit: 100 }),
        ]);
      setPositions(positionsRes.data.positions || []);
      setEmployees(employeesRes.data.employees || []);
      setUsers(
        (usersRes.data.users || usersRes.data.list || []).filter((user) =>
          ["super_admin", "admin", "worker"].includes(user.role),
        ),
      );
      setDepartments(departmentsRes.data.departments || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Hodim ma'lumotlarini olishda xato.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const close = () => {
    setPositionOpen(false);
    setProfileOpen(false);
    setAgreementOpen(false);
    setPositionForm(emptyPosition);
    setProfileForm(emptyProfile);
    setAgreementForm(emptyAgreement);
  };
  const savePosition = async () => {
    if (!canManage)
      return toast.error("Sizda lavozimlarni boshqarish uchun ruxsat yo'q.");
    if (!positionForm.name.trim())
      return toast.error("Lavozim nomini kiriting.");
    setSaving(true);
    try {
      await createPosition({
        ...positionForm,
        department_id: positionForm.department_id
          ? Number(positionForm.department_id)
          : null,
      });
      toast.success("Lavozim qo'shildi.");
      close();
      load();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Lavozimni saqlashda xato.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveProfile = async () => {
    if (!canManage)
      return toast.error("Sizda hodim profilini boshqarish uchun ruxsat yo'q.");
    if (!profileForm.user_id || !profileForm.position_id)
      return toast.error("Hodim va lavozimni tanlang.");
    setSaving(true);
    try {
      await createEmployee({
        ...profileForm,
        user_id: Number(profileForm.user_id),
        position_id: Number(profileForm.position_id),
      });
      toast.success("Hodim profili yaratildi.");
      close();
      load();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Hodim profilini saqlashda xato.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveAgreement = async () => {
    if (!canManage)
      return toast.error("Sizda kelishuvlarni boshqarish uchun ruxsat yo'q.");
    if (!agreementForm.employee_id) return toast.error("Hodimni tanlang.");
    setSaving(true);
    try {
      await createEmployeeAgreement({
        ...agreementForm,
        employee_id: Number(agreementForm.employee_id),
        fixed_amount: Number(agreementForm.fixed_amount || 0),
        daily_rate: Number(agreementForm.daily_rate || 0),
        commission_percent: Number(agreementForm.commission_percent || 0),
      });
      toast.success("Yangi maosh kelishuvi saqlandi.");
      close();
      load();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Kelishuvni saqlashda xato.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      className="crm-page flex h-full min-h-0 flex-col"
      sx={{ color: "var(--aa-text)" }}
    >
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          px: { xs: 2, md: 2.75 },
          py: { xs: 2, md: 2.4 },
          borderRadius: "var(--aa-radius-xl)",
          border: "1px solid var(--aa-border)",
          background: "var(--aa-surface)",
          boxShadow: "var(--aa-shadow-xs)",
        }}
        className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <Box>
          <Chip
            size="small"
            label="Al-amin CRM • xodimlar boshqaruvi"
            sx={{
              mb: 1,
              height: 25,
              borderRadius: "var(--aa-radius-pill)",
              bgcolor: "var(--aa-brand-50)",
              color: "var(--aa-brand-700)",
              fontWeight: 800,
              fontSize: 11.5,
            }}
          />
          <Typography
            sx={{
              fontSize: { xs: 27, md: 33 },
              lineHeight: 1.12,
              fontWeight: 900,
            }}
          >
            Xodimlar va kelishuvlar
          </Typography>
          <Typography
            sx={{
              mt: 0.75,
              color: "var(--aa-text-secondary)",
              fontWeight: 600,
            }}
          >
            Lavozim, bo‘lim va ish haqi shartlarini bitta joydan boshqaring.
          </Typography>
        </Box>
        {canManage && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              onClick={() => setPositionOpen(true)}
              sx={{
                borderRadius: "var(--aa-radius-md)",
                px: 2,
                py: 1.15,
                fontWeight: 800,
              }}
            >
              Lavozim qo'shish
            </Button>
            <Button
              variant="outlined"
              onClick={() => setProfileOpen(true)}
              sx={{
                borderRadius: "var(--aa-radius-md)",
                px: 2,
                py: 1.15,
                fontWeight: 800,
              }}
            >
              Hodim biriktirish
            </Button>
            <Button
              variant="contained"
              onClick={() => setAgreementOpen(true)}
              sx={{
                borderRadius: "var(--aa-radius-md)",
                px: 2.2,
                py: 1.15,
                bgcolor: "var(--aa-brand-700)",
                fontWeight: 850,
                boxShadow: "var(--aa-shadow-sm)",
                "&:hover": { bgcolor: "var(--aa-brand-800)" },
              }}
            >
              Kelishuv qo'shish
            </Button>
          </Stack>
        )}
      </Paper>
      <Box className="mb-4 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <Paper
          elevation={0}
          sx={{
            p: 2.1,
            borderRadius: "var(--aa-radius-lg)",
            border: "1px solid var(--aa-border)",
            boxShadow: "var(--aa-shadow-xs)",
          }}
        >
          <Typography
            sx={{
              color: "var(--aa-text-secondary)",
              fontSize: 13,
              fontWeight: 750,
            }}
          >
            Lavozimlar
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: 27, fontWeight: 900 }}>
            {positions.length}
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 2.1,
            borderRadius: "var(--aa-radius-lg)",
            border: "1px solid var(--aa-border)",
            boxShadow: "var(--aa-shadow-xs)",
          }}
        >
          <Typography
            sx={{
              color: "var(--aa-text-secondary)",
              fontSize: 13,
              fontWeight: 750,
            }}
          >
            Korxona hodimlari
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: 27, fontWeight: 900 }}>
            {employees.length}
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 2.1,
            borderRadius: "var(--aa-radius-lg)",
            border: "1px solid var(--aa-border)",
            boxShadow: "var(--aa-shadow-xs)",
          }}
        >
          <Typography
            sx={{
              color: "var(--aa-text-secondary)",
              fontSize: 13,
              fontWeight: 750,
            }}
          >
            Aktiv kelishuvlar
          </Typography>
          <Typography
            sx={{
              mt: 0.4,
              fontSize: 27,
              fontWeight: 900,
              color: "var(--aa-success)",
            }}
          >
            {employees.filter((e) => e.agreement).length}
          </Typography>
        </Paper>
      </Box>
      <Paper
        elevation={0}
        sx={{
          minHeight: 0,
          flex: 1,
          overflow: "hidden",
          borderRadius: "var(--aa-radius-xl)",
          border: "1px solid var(--aa-border)",
          boxShadow: "var(--aa-shadow-xs)",
          backgroundImage: "none",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, md: 2.5 },
            py: 1.8,
            display: "flex",
            gap: 1.5,
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            borderBottom: "1px solid var(--aa-border)",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 900 }}>
              Xodimlar ro'yxati
            </Typography>
            <Typography
              sx={{
                mt: 0.25,
                color: "var(--aa-text-secondary)",
                fontSize: 12.5,
                fontWeight: 650,
              }}
            >
              {visibleEmployees.length} ta xodim ko'rsatilmoqda
            </Typography>
          </Box>
          <TextField
            size="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Xodim, lavozim yoki bo'lim..."
            inputProps={{ "aria-label": "Xodimlarni qidirish" }}
            sx={{ ...fieldSx, width: { xs: "100%", sm: 310 } }}
          />
        </Box>
        {loading ? (
          <Box className="flex h-full items-center justify-center">
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ minHeight: 0, height: "100%", overflow: "auto" }}>
            <Table
              stickyHeader
              sx={{
                minWidth: 950,
                "& .MuiTableCell-root": { borderColor: "var(--aa-border)" },
                "& .MuiTableHead-root .MuiTableCell-root": {
                  bgcolor: "var(--aa-surface-muted)",
                  color: "var(--aa-text-secondary)",
                  fontSize: 11.5,
                  fontWeight: 850,
                  textTransform: "uppercase",
                  letterSpacing: "0.045em",
                  py: 1.35,
                },
                "& .MuiTableBody-root .MuiTableRow-root:hover": {
                  bgcolor: "var(--aa-surface-hover)",
                },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Hodim</TableCell>
                  <TableCell>Tizim ruxsati</TableCell>
                  <TableCell>Lavozim</TableCell>
                  <TableCell>Bo'lim</TableCell>
                  <TableCell>Hisob turi</TableCell>
                  <TableCell>Kelishuv summasi</TableCell>
                  <TableCell>Davr</TableCell>
                  {canManage && <TableCell align="right">Amal</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleEmployees.length ? (
                  visibleEmployees.map((employee) => (
                    <TableRow key={employee.id} hover>
                      <TableCell>
                        <Box className="flex items-center gap-3">
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                              bgcolor: "var(--aa-brand-50)",
                              color: "var(--aa-brand-700)",
                              border: "1px solid var(--aa-brand-100)",
                              fontWeight: 900,
                            }}
                          >
                            {employee.first_name?.[0]}
                          </Avatar>
                          <Box>
                            <Typography
                              sx={{ fontWeight: 850, color: "var(--aa-text)" }}
                            >
                              {employee.first_name} {employee.last_name}
                            </Typography>
                            <Typography
                              sx={{
                                mt: 0.15,
                                color: "var(--aa-text-secondary)",
                                fontSize: 12.5,
                                fontWeight: 650,
                              }}
                            >
                              @{employee.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={employee.role}
                          sx={{
                            borderRadius: "var(--aa-radius-pill)",
                            bgcolor: "var(--aa-surface-muted)",
                            color: "var(--aa-text-secondary)",
                            fontWeight: 800,
                          }}
                        />
                      </TableCell>
                      <TableCell>{employee.position_name}</TableCell>
                      <TableCell>{employee.department_name || "-"}</TableCell>
                      <TableCell>
                        {employee.agreement
                          ? typeLabels[employee.agreement.payment_type]
                          : "Kelishuv yo'q"}
                      </TableCell>
                      <TableCell>
                        {employee.agreement
                          ? money(
                              employee.agreement.fixed_amount ||
                                employee.agreement.daily_rate,
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {employee.agreement
                          ? periodLabels[employee.agreement.payment_period]
                          : "-"}
                      </TableCell>
                      {canManage && (
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              borderRadius: "var(--aa-radius-sm)",
                              fontWeight: 800,
                            }}
                            onClick={() => {
                              setAgreementForm({
                                ...emptyAgreement,
                                employee_id: employee.id,
                              });
                              setAgreementOpen(true);
                            }}
                          >
                            Yangi kelishuv
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canManage ? 8 : 7} align="center">
                      {query
                        ? "Qidiruv bo'yicha xodim topilmadi"
                        : "Hodim profillari hali yaratilmagan"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <Dialog
        open={positionOpen}
        onClose={close}
        fullWidth
        maxWidth="sm"
        {...dialogProps}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2.2,
            fontSize: 21,
            fontWeight: 900,
            borderBottom: "1px solid var(--aa-border)",
          }}
        >
          Lavozim qo'shish
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2} className="pt-2">
            <TextField
              label="Lavozim nomi"
              sx={fieldSx}
              value={positionForm.name}
              onChange={(e) =>
                setPositionForm((p) => ({ ...p, name: e.target.value }))
              }
            />
            <TextField
              select
              label="Bo'lim"
              sx={fieldSx}
              value={positionForm.department_id}
              onChange={(e) =>
                setPositionForm((p) => ({
                  ...p,
                  department_id: e.target.value,
                }))
              }
            >
              <MenuItem value="">Bo'limsiz</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              multiline
              minRows={2}
              label="Tavsif"
              sx={fieldSx}
              value={positionForm.description}
              onChange={(e) =>
                setPositionForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{ px: 3, py: 2, borderTop: "1px solid var(--aa-border)" }}
        >
          <Button onClick={close} sx={{ fontWeight: 800 }}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={savePosition}
            sx={{
              borderRadius: "var(--aa-radius-md)",
              bgcolor: "var(--aa-brand-700)",
              fontWeight: 850,
            }}
          >
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={profileOpen}
        onClose={close}
        fullWidth
        maxWidth="sm"
        {...dialogProps}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2.2,
            fontSize: 21,
            fontWeight: 900,
            borderBottom: "1px solid var(--aa-border)",
          }}
        >
          Hodimga lavozim biriktirish
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2} className="pt-2">
            <TextField
              select
              label="Hodim"
              sx={fieldSx}
              value={profileForm.user_id}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, user_id: e.target.value }))
              }
            >
              {users
                .filter(
                  (u) =>
                    !employees.some((e) => Number(e.user_id) === Number(u.id)),
                )
                .map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.role})
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              label="Lavozim"
              sx={fieldSx}
              value={profileForm.position_id}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, position_id: e.target.value }))
              }
            >
              {positions
                .filter((p) => p.is_active)
                .map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              type="date"
              label="Ishga kirgan sana"
              sx={fieldSx}
              value={profileForm.hired_at}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, hired_at: e.target.value }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{ px: 3, py: 2, borderTop: "1px solid var(--aa-border)" }}
        >
          <Button onClick={close} sx={{ fontWeight: 800 }}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={saveProfile}
            sx={{
              borderRadius: "var(--aa-radius-md)",
              bgcolor: "var(--aa-brand-700)",
              fontWeight: 850,
            }}
          >
            Biriktirish
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={agreementOpen}
        onClose={close}
        fullWidth
        maxWidth="md"
        {...dialogProps}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2.2,
            fontSize: 21,
            fontWeight: 900,
            borderBottom: "1px solid var(--aa-border)",
          }}
        >
          Ish haqi kelishuvi
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Stack spacing={2} className="pt-2">
            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                select
                label="Hodim"
                sx={fieldSx}
                value={agreementForm.employee_id}
                onChange={(e) =>
                  setAgreementForm((p) => ({
                    ...p,
                    employee_id: e.target.value,
                  }))
                }
              >
                {employees.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.first_name} {e.last_name} — {e.position_name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Hisob turi"
                sx={fieldSx}
                value={agreementForm.payment_type}
                onChange={(e) =>
                  setAgreementForm((p) => ({
                    ...p,
                    payment_type: e.target.value,
                  }))
                }
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="number"
                label="Doimiy summa"
                sx={fieldSx}
                value={agreementForm.fixed_amount}
                onChange={(e) =>
                  setAgreementForm((p) => ({
                    ...p,
                    fixed_amount: e.target.value,
                  }))
                }
              />
              <TextField
                type="number"
                label="Kunlik stavka"
                sx={fieldSx}
                value={agreementForm.daily_rate}
                onChange={(e) =>
                  setAgreementForm((p) => ({
                    ...p,
                    daily_rate: e.target.value,
                  }))
                }
              />
              <TextField
                type="number"
                label="Foiz"
                sx={fieldSx}
                value={agreementForm.commission_percent}
                onChange={(e) =>
                  setAgreementForm((p) => ({
                    ...p,
                    commission_percent: e.target.value,
                  }))
                }
              />
              <TextField
                select
                label="To'lov davri"
                sx={fieldSx}
                value={agreementForm.payment_period}
                onChange={(e) =>
                  setAgreementForm((p) => ({
                    ...p,
                    payment_period: e.target.value,
                  }))
                }
              >
                <MenuItem value="weekly">Haftalik</MenuItem>
                <MenuItem value="monthly">Oylik</MenuItem>
              </TextField>
              <TextField
                type="date"
                label="Amal qilish sanasi"
                sx={fieldSx}
                value={agreementForm.effective_from}
                onChange={(e) =>
                  setAgreementForm((p) => ({
                    ...p,
                    effective_from: e.target.value,
                  }))
                }
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <TextField
              multiline
              minRows={2}
              label="Izoh"
              sx={fieldSx}
              value={agreementForm.note}
              onChange={(e) =>
                setAgreementForm((p) => ({ ...p, note: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{ px: 3, py: 2, borderTop: "1px solid var(--aa-border)" }}
        >
          <Button onClick={close} sx={{ fontWeight: 800 }}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            disabled={saving}
            onClick={saveAgreement}
            sx={{
              borderRadius: "var(--aa-radius-md)",
              bgcolor: "var(--aa-brand-700)",
              fontWeight: 850,
            }}
          >
            Kelishuvni saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
