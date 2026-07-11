import { useCallback, useEffect, useState } from "react";
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
const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [positionsRes, employeesRes, usersRes, departmentsRes] = await Promise.all([
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
      toast.error(error?.response?.data?.message || "Hodim ma'lumotlarini olishda xato.");
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
    if (!canManage) return toast.error("Sizda lavozimlarni boshqarish uchun ruxsat yo'q.");
    if (!positionForm.name.trim()) return toast.error("Lavozim nomini kiriting.");
    setSaving(true);
    try {
      await createPosition({
        ...positionForm,
        department_id: positionForm.department_id ? Number(positionForm.department_id) : null,
      });
      toast.success("Lavozim qo'shildi.");
      close();
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Lavozimni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };
  const saveProfile = async () => {
    if (!canManage) return toast.error("Sizda hodim profilini boshqarish uchun ruxsat yo'q.");
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
      toast.error(error?.response?.data?.message || "Hodim profilini saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };
  const saveAgreement = async () => {
    if (!canManage) return toast.error("Sizda kelishuvlarni boshqarish uchun ruxsat yo'q.");
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
      toast.error(error?.response?.data?.message || "Kelishuvni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="crm-page flex h-full min-h-0 flex-col">
      <Box className="mb-5 flex shrink-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Lavozim va kelishuvlar
          </Typography>
          <Typography variant="body2" className="mt-1 text-slate-500">
            Tizim ruxsati, korxona lavozimi va ish haqi kelishuvini boshqarish
          </Typography>
        </Box>
        {canManage && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="outlined" onClick={() => setPositionOpen(true)}>
              Lavozim qo'shish
            </Button>
            <Button variant="outlined" onClick={() => setProfileOpen(true)}>
              Hodim biriktirish
            </Button>
            <Button variant="contained" onClick={() => setAgreementOpen(true)}>
              Kelishuv qo'shish
            </Button>
          </Stack>
        )}
      </Box>
      <Box className="mb-4 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <Paper elevation={0} className="rounded-xl border border-slate-200 p-4">
          <Typography variant="body2" className="text-slate-500">
            Lavozimlar
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {positions.length}
          </Typography>
        </Paper>
        <Paper elevation={0} className="rounded-xl border border-slate-200 p-4">
          <Typography variant="body2" className="text-slate-500">
            Korxona hodimlari
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {employees.length}
          </Typography>
        </Paper>
        <Paper elevation={0} className="rounded-xl border border-slate-200 p-4">
          <Typography variant="body2" className="text-slate-500">
            Aktiv kelishuvlar
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {employees.filter((e) => e.agreement).length}
          </Typography>
        </Paper>
      </Box>
      <Paper
        elevation={0}
        className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200"
      >
        {loading ? (
          <Box className="flex h-full items-center justify-center">
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 950 }}>
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
              {employees.length ? (
                employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Box className="flex items-center gap-3">
                        <Avatar sx={{ bgcolor: "#7F1D1D" }}>{employee.first_name?.[0]}</Avatar>
                        <Box>
                          <Typography fontWeight={700}>
                            {employee.first_name} {employee.last_name}
                          </Typography>
                          <Typography variant="body2" className="text-slate-500">
                            @{employee.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={employee.role} />
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
                        ? money(employee.agreement.fixed_amount || employee.agreement.daily_rate)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {employee.agreement ? periodLabels[employee.agreement.payment_period] : "-"}
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
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
                    Hodim profillari hali yaratilmagan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={positionOpen} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Lavozim qo'shish</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <TextField
              label="Lavozim nomi"
              value={positionForm.name}
              onChange={(e) => setPositionForm((p) => ({ ...p, name: e.target.value }))}
            />
            <TextField
              select
              label="Bo'lim"
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
              value={positionForm.description}
              onChange={(e) => setPositionForm((p) => ({ ...p, description: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Bekor qilish</Button>
          <Button variant="contained" disabled={saving} onClick={savePosition}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={profileOpen} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Hodimga lavozim biriktirish</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <TextField
              select
              label="Hodim"
              value={profileForm.user_id}
              onChange={(e) => setProfileForm((p) => ({ ...p, user_id: e.target.value }))}
            >
              {users
                .filter((u) => !employees.some((e) => Number(e.user_id) === Number(u.id)))
                .map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.role})
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              label="Lavozim"
              value={profileForm.position_id}
              onChange={(e) => setProfileForm((p) => ({ ...p, position_id: e.target.value }))}
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
              value={profileForm.hired_at}
              onChange={(e) => setProfileForm((p) => ({ ...p, hired_at: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Bekor qilish</Button>
          <Button variant="contained" disabled={saving} onClick={saveProfile}>
            Biriktirish
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={agreementOpen} onClose={close} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>Ish haqi kelishuvi</DialogTitle>
        <DialogContent>
          <Stack spacing={2} className="pt-2">
            <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                select
                label="Hodim"
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
              value={agreementForm.note}
              onChange={(e) => setAgreementForm((p) => ({ ...p, note: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Bekor qilish</Button>
          <Button variant="contained" disabled={saving} onClick={saveAgreement}>
            Kelishuvni saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
