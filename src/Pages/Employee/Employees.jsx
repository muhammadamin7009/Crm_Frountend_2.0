import { useCallback, useEffect, useMemo, useState } from "react";
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
import { toast } from "react-toastify";

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

const number = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const date = (value) => {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const typeLabels = {
  piece_rate: "Mahsulot bay",
  fixed_salary: "Doimiy maosh",
  daily_rate: "Kunlik",
  mixed: "Aralash",
  commission: "Foizli",
};

const periodLabels = {
  weekly: "Haftalik",
  monthly: "Oylik",
};

const roleLabels = {
  super_admin: "Super administrator",
  admin: "Administrator",
  worker: "Ishchi",
};

const emptyPosition = {
  name: "",
  department_id: "",
  description: "",
};

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

const getFullName = (employee) =>
  `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() ||
  employee?.username ||
  "Xodim";

const getInitials = (employee) => {
  const first = employee?.first_name?.[0] || "";

  const last = employee?.last_name?.[0] || "";

  const username = employee?.username?.[0] || "";

  return `${first}${last}`.toUpperCase() || username.toUpperCase() || "X";
};

const getAgreementValue = (agreement) => {
  if (!agreement) {
    return "-";
  }

  if (agreement.payment_type === "commission") {
    return `${number(agreement.commission_percent)}%`;
  }

  if (agreement.payment_type === "daily_rate") {
    return `${money(agreement.daily_rate)} / kun`;
  }

  if (agreement.payment_type === "mixed") {
    const values = [];

    if (Number(agreement.fixed_amount || 0) > 0) {
      values.push(money(agreement.fixed_amount));
    }

    if (Number(agreement.daily_rate || 0) > 0) {
      values.push(`${money(agreement.daily_rate)} / kun`);
    }

    if (Number(agreement.commission_percent || 0) > 0) {
      values.push(`${number(agreement.commission_percent)}%`);
    }

    return values.join(" + ") || "-";
  }

  if (agreement.payment_type === "piece_rate") {
    return "Mahsulot bo‘yicha";
  }

  return money(agreement.fixed_amount);
};

const Card = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid #e4e9ef",
      backgroundColor: "#ffffff",
      boxShadow: "0 14px 40px rgba(15,23,42,.045)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const HeroMetric = ({ label, value, helper, tone = "red" }) => {
  const tones = {
    red: ["#fecdd3", "rgba(220,38,38,.15)", "rgba(248,113,113,.15)"],

    green: ["#bbf7d0", "rgba(34,197,94,.14)", "rgba(74,222,128,.15)"],

    blue: ["#bfdbfe", "rgba(37,99,235,.15)", "rgba(96,165,250,.15)"],

    amber: ["#fde68a", "rgba(245,158,11,.15)", "rgba(251,191,36,.15)"],
  };

  const current = tones[tone] || tones.red;

  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: 126,
        p: 1.8,
        borderRadius: "18px",

        border: "1px solid rgba(255,255,255,.075)",

        background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",

        backdropFilter: "blur(16px)",
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          display: "grid",
          placeItems: "center",
          borderRadius: "11px",
          color: current[0],
          backgroundColor: current[1],
          border: `1px solid ${current[2]}`,
          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.35,
          color: "rgba(255,255,255,.44) !important",
          fontSize: 9.5,
          fontWeight: 750,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.6,
          color: "#ffffff !important",
          fontSize: 18,
          lineHeight: 1.2,
          fontWeight: 950,
          letterSpacing: "-.035em",
        }}
      >
        {value}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.55,
          color: "rgba(255,255,255,.28) !important",
          fontSize: 9,
        }}
      >
        {helper}
      </Typography>
    </Box>
  );
};

const RoleChip = ({ role }) => {
  const styles = {
    super_admin: {
      color: "#7c3aed",
      background: "rgba(139,92,246,.09)",
      border: "rgba(139,92,246,.18)",
    },

    admin: {
      color: "#1d4ed8",
      background: "rgba(37,99,235,.08)",
      border: "rgba(37,99,235,.17)",
    },

    worker: {
      color: "#b45309",
      background: "rgba(245,158,11,.10)",
      border: "rgba(245,158,11,.20)",
    },
  };

  const current = styles[role] || {
    color: "#64748b",
    background: "#f1f5f9",
    border: "#e2e8f0",
  };

  return (
    <Chip
      size="small"
      label={roleLabels[role] || role || "-"}
      sx={{
        height: 25,
        px: 0.3,
        color: current.color,
        fontSize: 9.5,
        fontWeight: 900,
        backgroundColor: current.background,
        border: `1px solid ${current.border}`,
      }}
    />
  );
};

const AgreementChip = ({ agreement }) => {
  const hasAgreement = Boolean(agreement);

  return (
    <Chip
      size="small"
      label={hasAgreement ? typeLabels[agreement.payment_type] || "Kelishuv" : "Kelishuv yo‘q"}
      sx={{
        height: 25,
        px: 0.3,

        color: hasAgreement ? "#15803d" : "#b91c1c",

        fontSize: 9.5,
        fontWeight: 900,

        backgroundColor: hasAgreement ? "rgba(34,197,94,.09)" : "rgba(220,38,38,.08)",

        border: hasAgreement ? "1px solid rgba(34,197,94,.18)" : "1px solid rgba(220,38,38,.18)",
      }}
    />
  );
};

const PremiumDialog = ({ open, onClose, title, subtitle, children, actions, maxWidth = "sm" }) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth={maxWidth}
    PaperProps={{
      sx: {
        overflow: "hidden",
        borderRadius: "23px",
        border: "1px solid rgba(148,163,184,.20)",
        boxShadow: "0 30px 80px rgba(15,23,42,.22)",
      },
    }}
  >
    <DialogTitle
      className="employees-dialog-title"
      sx={{
        px: 3,
        py: 2.35,
        color: "#ffffff !important",
        backgroundColor: "#0d1117 !important",

        backgroundImage:
          "radial-gradient(circle at 100% 0%,rgba(220,38,38,.28),transparent 36%),linear-gradient(135deg,#11151c,#321319) !important",
      }}
    >
      <Typography
        sx={{
          color: "#ffffff !important",
          fontSize: 19,
          fontWeight: 950,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,

          color: "rgba(255,255,255,.43) !important",

          fontSize: 10.5,
        }}
      >
        {subtitle}
      </Typography>
    </DialogTitle>

    <DialogContent
      sx={{
        px: 3,
        py: "24px !important",
      }}
    >
      {children}
    </DialogContent>

    {actions && (
      <DialogActions
        sx={{
          px: 3,
          py: 2.1,
          borderTop: "1px solid #edf0f3",
          backgroundColor: "#fafbfc",
        }}
      >
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

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

  const [saving, setSaving] = useState(false);

  const [positionOpen, setPositionOpen] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);

  const [agreementOpen, setAgreementOpen] = useState(false);

  const [positionForm, setPositionForm] = useState(emptyPosition);

  const [profileForm, setProfileForm] = useState(emptyProfile);

  const [agreementForm, setAgreementForm] = useState(emptyAgreement);

  const [query, setQuery] = useState("");

  const visibleEmployees = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("uz-UZ");

    if (!needle) {
      return employees;
    }

    return employees.filter((employee) =>
      [
        employee.first_name,
        employee.last_name,
        employee.username,
        employee.position_name,
        employee.department_name,

        typeLabels[employee.agreement?.payment_type],

        periodLabels[employee.agreement?.payment_period],
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("uz-UZ")
        .includes(needle),
    );
  }, [employees, query]);

  const availableUsers = useMemo(
    () =>
      users.filter(
        (user) => !employees.some((employee) => Number(employee.user_id) === Number(user.id)),
      ),
    [employees, users],
  );

  const employeeStats = useMemo(() => {
    const activeAgreements = employees.filter((employee) => Boolean(employee.agreement)).length;

    const monthlyAgreements = employees.filter(
      (employee) => employee.agreement?.payment_period === "monthly",
    ).length;

    const weeklyAgreements = employees.filter(
      (employee) => employee.agreement?.payment_period === "weekly",
    ).length;

    return {
      activeAgreements,
      monthlyAgreements,
      weeklyAgreements,
    };
  }, [employees]);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [positionsRes, employeesRes, usersRes, departmentsRes] = await Promise.all([
        getPositions({
          limit: 100,
        }),

        getEmployees({
          limit: 100,
        }),

        getUsers({
          limit: 100,
        }),

        getDepartments({
          limit: 100,
        }),
      ]);

      const positionsData = positionsRes?.data || positionsRes || {};

      const employeesData = employeesRes?.data || employeesRes || {};

      const usersData = usersRes?.data || usersRes || {};

      const departmentsData = departmentsRes?.data || departmentsRes || {};

      setPositions(positionsData.positions || []);

      setEmployees(employeesData.employees || []);

      setUsers(
        (usersData.users || usersData.list || []).filter((user) =>
          ["super_admin", "admin", "worker"].includes(user.role),
        ),
      );

      setDepartments(departmentsData.departments || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xodim ma’lumotlarini olishda xato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const close = () => {
    if (saving) return;

    setPositionOpen(false);
    setProfileOpen(false);
    setAgreementOpen(false);

    setPositionForm(emptyPosition);

    setProfileForm({
      ...emptyProfile,
      hired_at: today(),
    });

    setAgreementForm({
      ...emptyAgreement,
      effective_from: today(),
    });
  };

  const savePosition = async () => {
    if (!canManage) {
      toast.error("Sizda lavozimlarni boshqarish uchun ruxsat yo‘q.");

      return;
    }

    if (!positionForm.name.trim()) {
      toast.error("Lavozim nomini kiriting.");

      return;
    }

    setSaving(true);

    try {
      await createPosition({
        name: positionForm.name.trim(),

        department_id: positionForm.department_id ? Number(positionForm.department_id) : null,

        description: positionForm.description.trim() || null,
      });

      toast.success("Lavozim qo‘shildi.");

      close();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Lavozimni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!canManage) {
      toast.error("Sizda xodim profilini boshqarish uchun ruxsat yo‘q.");

      return;
    }

    if (!profileForm.user_id || !profileForm.position_id) {
      toast.error("Xodim va lavozimni tanlang.");

      return;
    }

    setSaving(true);

    try {
      await createEmployee({
        user_id: Number(profileForm.user_id),

        position_id: Number(profileForm.position_id),

        hired_at: profileForm.hired_at || undefined,

        note: profileForm.note.trim() || null,
      });

      toast.success("Xodim profili yaratildi.");

      close();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xodim profilini saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const saveAgreement = async () => {
    if (!canManage) {
      toast.error("Sizda kelishuvlarni boshqarish uchun ruxsat yo‘q.");

      return;
    }

    if (!agreementForm.employee_id) {
      toast.error("Xodimni tanlang.");

      return;
    }

    if (
      agreementForm.payment_type === "fixed_salary" &&
      Number(agreementForm.fixed_amount || 0) <= 0
    ) {
      toast.error("Doimiy maosh summasini kiriting.");

      return;
    }

    if (agreementForm.payment_type === "daily_rate" && Number(agreementForm.daily_rate || 0) <= 0) {
      toast.error("Kunlik stavkani kiriting.");

      return;
    }

    if (
      agreementForm.payment_type === "commission" &&
      Number(agreementForm.commission_percent || 0) <= 0
    ) {
      toast.error("Foiz miqdorini kiriting.");

      return;
    }

    setSaving(true);

    try {
      await createEmployeeAgreement({
        employee_id: Number(agreementForm.employee_id),

        payment_type: agreementForm.payment_type,

        fixed_amount: Number(agreementForm.fixed_amount || 0),

        daily_rate: Number(agreementForm.daily_rate || 0),

        commission_percent: Number(agreementForm.commission_percent || 0),

        payment_period: agreementForm.payment_period,

        effective_from: agreementForm.effective_from || undefined,

        note: agreementForm.note.trim() || null,
      });

      toast.success("Yangi maosh kelishuvi saqlandi.");

      close();
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Kelishuvni saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const openAgreement = (employee) => {
    setAgreementForm({
      ...emptyAgreement,
      employee_id: employee.id,
      effective_from: today(),
    });

    setAgreementOpen(true);
  };

  return (
    <Box
      className="crm-page employees-page"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2.5,
      }}
    >
      <style>{employeesPageStyles}</style>

      <Box
        component="section"
        className="employees-hero"
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

          backgroundColor: "#0d1117 !important",

          backgroundImage:
            "radial-gradient(circle at 100% 0%,rgba(220,38,38,.34),transparent 30%),linear-gradient(145deg,#0d1117,#171117 52%,#3a121a) !important",

          boxShadow: "0 24px 60px rgba(15,23,42,.20)",

          flexShrink: 0,

          "&::before": {
            content: '""',
            position: "absolute",
            width: 390,
            height: 390,
            top: -275,
            right: -210,
            borderRadius: "50%",

            border: "1px solid rgba(248,113,113,.16)",

            boxShadow: "0 0 0 62px rgba(248,113,113,.022),0 0 0 124px rgba(248,113,113,.014)",

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

                  background: "linear-gradient(90deg,#fb7185,#ef4444)",
                }}
              />

              <Typography
                sx={{
                  color: "#fecdd3 !important",

                  fontSize: 10,
                  fontWeight: 950,
                  letterSpacing: ".13em",
                  textTransform: "uppercase",
                }}
              >
                Xodimlar boshqaruvi
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
                fontWeight: 950,
                letterSpacing: "-.045em",
              }}
            >
              Xodimlar va kelishuvlar
            </Typography>

            <Typography
              sx={{
                maxWidth: 570,
                mt: 1.4,

                color: "rgba(255,255,255,.45) !important",

                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Xodimlar, lavozimlar, bo‘limlar va ish haqi shartlarini yagona boshqaruv markazida
              nazorat qiling.
            </Typography>

            {canManage && (
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
                useFlexGap
                sx={{
                  mt: 2.4,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  onClick={() => {
                    setPositionForm(emptyPosition);

                    setPositionOpen(true);
                  }}
                  sx={heroSecondaryButtonSx}
                >
                  Lavozim qo‘shish
                </Button>

                <Button
                  onClick={() => {
                    setProfileForm({
                      ...emptyProfile,
                      hired_at: today(),
                    });

                    setProfileOpen(true);
                  }}
                  sx={heroSecondaryButtonSx}
                >
                  Xodim biriktirish
                </Button>

                <Button
                  onClick={() => {
                    setAgreementForm({
                      ...emptyAgreement,

                      effective_from: today(),
                    });

                    setAgreementOpen(true);
                  }}
                  sx={heroPrimaryButtonSx}
                >
                  + Kelishuv qo‘shish
                </Button>
              </Stack>
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
              label="Xodimlar"
              value={`${number(employees.length)} ta`}
              helper="Korxona xodimlari"
              tone="blue"
            />

            <HeroMetric
              label="Lavozimlar"
              value={`${number(positions.length)} ta`}
              helper="Tizimdagi lavozimlar"
              tone="amber"
            />

            <HeroMetric
              label="Faol kelishuv"
              value={`${number(employeeStats.activeAgreements)} ta`}
              helper="Ish haqi kelishuvlari"
              tone="green"
            />

            <HeroMetric
              label="Bo‘limlar"
              value={`${number(departments.length)} ta`}
              helper={`${employeeStats.monthlyAgreements} oylik, ${employeeStats.weeklyAgreements} haftalik`}
              tone="red"
            />
          </Box>
        </Box>
      </Box>

      <Card
        sx={{
          mb: 2,
          p: 2,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",

            alignItems: {
              xs: "stretch",
              md: "center",
            },

            justifyContent: "space-between",

            flexDirection: {
              xs: "column",
              md: "row",
            },

            gap: 1.4,
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "#0f172a",
                fontSize: 14,
                fontWeight: 950,
              }}
            >
              Xodimlarni qidirish
            </Typography>

            <Typography
              sx={{
                mt: 0.4,
                color: "#94a3b8",
                fontSize: 9.5,
              }}
            >
              Ism, username, lavozim, bo‘lim yoki hisob turi bo‘yicha qidiring
            </Typography>
          </Box>

          <Stack
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
            <TextField
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Xodim, lavozim yoki bo‘lim..."
              inputProps={{
                "aria-label": "Xodimlarni qidirish",
              }}
              sx={{
                width: {
                  xs: "100%",
                  sm: 330,
                },
              }}
            />

            {query && (
              <Button variant="outlined" onClick={() => setQuery("")} sx={secondaryButtonSx}>
                Tozalash
              </Button>
            )}

            <Button variant="outlined" onClick={load} disabled={loading} sx={secondaryButtonSx}>
              Yangilash
            </Button>
          </Stack>
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
        <Box
          sx={{
            px: 2.4,
            py: 1.9,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            borderBottom: "1px solid #edf0f3",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "#0f172a",
                fontSize: 15,
                fontWeight: 950,
              }}
            >
              Xodimlar ro‘yxati
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "#94a3b8",
                fontSize: 10.5,
              }}
            >
              Xodim, lavozim, bo‘lim va ish haqi kelishuvi
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${number(visibleEmployees.length)} ta`}
            sx={{
              height: 25,
              color: "#991b1b",
              fontSize: 9.5,
              fontWeight: 900,

              backgroundColor: "rgba(153,27,27,.07)",
            }}
          />
        </Box>

        <Box
          sx={{
            minHeight: 0,
            flex: 1,
            overflow: "auto",
          }}
        >
          <Table
            stickyHeader
            sx={{
              minWidth: canManage ? 1160 : 1040,

              "& th": {
                py: 1.55,
                color: "#94a3b8",
                fontSize: 9.5,
                fontWeight: 900,
                letterSpacing: ".045em",
                textTransform: "uppercase",
                backgroundColor: "#fafbfc",
                borderColor: "#edf0f3",
              },

              "& td": {
                py: 1.4,
                color: "#64748b",
                fontSize: 10.5,
                borderColor: "#edf0f3",
              },

              "& tbody tr:hover": {
                backgroundColor: "rgba(153,27,27,.025)",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Xodim</TableCell>

                <TableCell>Tizim roli</TableCell>

                <TableCell>Lavozim</TableCell>

                <TableCell>Bo‘lim</TableCell>

                <TableCell>Ish haqi turi</TableCell>

                <TableCell>Kelishuv qiymati</TableCell>

                <TableCell>To‘lov davri</TableCell>

                <TableCell>Ishga kirgan</TableCell>

                {canManage && <TableCell align="right">Amal</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 9 : 8} align="center" sx={{ py: 8 }}>
                    <CircularProgress
                      size={30}
                      sx={{
                        color: "#991b1b",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : visibleEmployees.length ? (
                visibleEmployees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.4,
                        }}
                      >
                        <Avatar
                          src={getImageUrl(employee.user_image)}
                          sx={{
                            width: 48,
                            height: 48,
                            flexShrink: 0,
                            color: "#ffffff",
                            fontSize: 13,
                            fontWeight: 950,

                            background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",

                            border: "3px solid #ffffff",

                            boxShadow: "0 8px 20px rgba(127,29,29,.16)",
                          }}
                        >
                          {getInitials(employee)}
                        </Avatar>

                        <Box
                          sx={{
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            noWrap
                            sx={{
                              maxWidth: 210,
                              color: "#334155",
                              fontSize: 12.5,
                              fontWeight: 900,
                            }}
                          >
                            {getFullName(employee)}
                          </Typography>

                          <Typography
                            noWrap
                            sx={{
                              maxWidth: 210,
                              mt: 0.4,
                              color: "#94a3b8",
                              fontSize: 9.5,
                            }}
                          >
                            @{employee.username || "username"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <RoleChip role={employee.role} />
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "#334155",
                          fontSize: 10.5,
                          fontWeight: 900,
                        }}
                      >
                        {employee.position_name || "-"}
                      </Typography>

                      {employee.position_description && (
                        <Typography
                          sx={{
                            mt: 0.35,
                            maxWidth: 200,
                            color: "#94a3b8",
                            fontSize: 9,
                            lineHeight: 1.45,
                          }}
                        >
                          {employee.position_description}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={employee.department_name || "Bo‘limsiz"}
                        sx={{
                          height: 25,
                          color: "#1d4ed8",
                          fontSize: 9.5,
                          fontWeight: 900,

                          backgroundColor: "rgba(37,99,235,.08)",

                          border: "1px solid rgba(37,99,235,.16)",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <AgreementChip agreement={employee.agreement} />
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          maxWidth: 210,
                          color: employee.agreement ? "#15803d" : "#94a3b8",

                          fontSize: 10.5,
                          fontWeight: 950,
                          lineHeight: 1.55,
                        }}
                      >
                        {getAgreementValue(employee.agreement)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "#475569",
                          fontSize: 10.5,
                          fontWeight: 850,
                        }}
                      >
                        {employee.agreement
                          ? periodLabels[employee.agreement.payment_period] || "-"
                          : "-"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "#475569",
                          fontSize: 10.5,
                          fontWeight: 850,
                        }}
                      >
                        {date(employee.hired_at)}
                      </Typography>
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openAgreement(employee)}
                          sx={tableActionSx}
                        >
                          Yangi kelishuv
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 9 : 8}
                    align="center"
                    sx={{
                      py: 8,
                      color: "#94a3b8",
                      fontWeight: 850,
                    }}
                  >
                    {query
                      ? "Qidiruv bo‘yicha xodim topilmadi"
                      : "Xodim profillari hali yaratilmagan"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      <PremiumDialog
        open={positionOpen}
        onClose={close}
        title="Yangi lavozim"
        subtitle="Lavozim nomi, bo‘limi va tavsifini kiriting"
        actions={
          <>
            <Button onClick={close} disabled={saving} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              disabled={saving}
              onClick={savePosition}
              sx={dialogPrimarySx}
            >
              {saving ? "Saqlanmoqda..." : "Lavozimni saqlash"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            required
            label="Lavozim nomi"
            value={positionForm.name}
            onChange={(event) =>
              setPositionForm((previous) => ({
                ...previous,

                name: event.target.value,
              }))
            }
          />

          <TextField
            select
            label="Bo‘lim"
            value={positionForm.department_id}
            onChange={(event) =>
              setPositionForm((previous) => ({
                ...previous,

                department_id: event.target.value,
              }))
            }
          >
            <MenuItem value="">Bo‘limsiz</MenuItem>

            {departments.map((department) => (
              <MenuItem key={department.id} value={department.id}>
                {department.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            multiline
            minRows={3}
            label="Lavozim tavsifi"
            value={positionForm.description}
            onChange={(event) =>
              setPositionForm((previous) => ({
                ...previous,

                description: event.target.value,
              }))
            }
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={profileOpen}
        onClose={close}
        title="Xodimga lavozim biriktirish"
        subtitle="Tizim foydalanuvchisini korxona xodimi sifatida ro‘yxatdan o‘tkazing"
        actions={
          <>
            <Button onClick={close} disabled={saving} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              disabled={saving}
              onClick={saveProfile}
              sx={dialogPrimarySx}
            >
              {saving ? "Biriktirilmoqda..." : "Xodimni biriktirish"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            select
            required
            label="Xodim"
            value={profileForm.user_id}
            onChange={(event) =>
              setProfileForm((previous) => ({
                ...previous,

                user_id: event.target.value,
              }))
            }
            helperText={
              availableUsers.length
                ? "Korxona xodimi sifatida ro‘yxatdan o‘tmagan foydalanuvchilar"
                : "Biriktirilmagan foydalanuvchi topilmadi"
            }
          >
            {availableUsers.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.first_name} {user.last_name} — {roleLabels[user.role] || user.role}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            required
            label="Lavozim"
            value={profileForm.position_id}
            onChange={(event) =>
              setProfileForm((previous) => ({
                ...previous,

                position_id: event.target.value,
              }))
            }
          >
            {positions
              .filter((position) => position.is_active !== false)
              .map((position) => (
                <MenuItem key={position.id} value={position.id}>
                  {position.name}
                  {position.department_name ? ` — ${position.department_name}` : ""}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            type="date"
            label="Ishga kirgan sana"
            value={profileForm.hired_at}
            onChange={(event) =>
              setProfileForm((previous) => ({
                ...previous,

                hired_at: event.target.value,
              }))
            }
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <TextField
            multiline
            minRows={3}
            label="Izoh"
            value={profileForm.note}
            onChange={(event) =>
              setProfileForm((previous) => ({
                ...previous,

                note: event.target.value,
              }))
            }
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={agreementOpen}
        onClose={close}
        title="Ish haqi kelishuvi"
        subtitle="Xodimning maosh turi, stavkasi va to‘lov davrini belgilang"
        maxWidth="md"
        actions={
          <>
            <Button onClick={close} disabled={saving} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              variant="contained"
              disabled={saving}
              onClick={saveAgreement}
              sx={dialogPrimarySx}
            >
              {saving ? "Saqlanmoqda..." : "Kelishuvni saqlash"}
            </Button>
          </>
        }
      >
        <Stack spacing={2.1}>
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2,minmax(0,1fr))",
              },

              gap: 1.6,
            }}
          >
            <TextField
              select
              required
              label="Xodim"
              value={agreementForm.employee_id}
              onChange={(event) =>
                setAgreementForm((previous) => ({
                  ...previous,

                  employee_id: event.target.value,
                }))
              }
            >
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {getFullName(employee)} — {employee.position_name || "Lavozimsiz"}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              required
              label="Ish haqi turi"
              value={agreementForm.payment_type}
              onChange={(event) =>
                setAgreementForm((previous) => ({
                  ...previous,

                  payment_type: event.target.value,
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
              onChange={(event) =>
                setAgreementForm((previous) => ({
                  ...previous,

                  fixed_amount: event.target.value,
                }))
              }
              disabled={!["fixed_salary", "mixed"].includes(agreementForm.payment_type)}
              inputProps={{
                min: 0,
                step: 1000,
              }}
            />

            <TextField
              type="number"
              label="Kunlik stavka"
              value={agreementForm.daily_rate}
              onChange={(event) =>
                setAgreementForm((previous) => ({
                  ...previous,

                  daily_rate: event.target.value,
                }))
              }
              disabled={!["daily_rate", "mixed"].includes(agreementForm.payment_type)}
              inputProps={{
                min: 0,
                step: 1000,
              }}
            />

            <TextField
              type="number"
              label="Foiz"
              value={agreementForm.commission_percent}
              onChange={(event) =>
                setAgreementForm((previous) => ({
                  ...previous,

                  commission_percent: event.target.value,
                }))
              }
              disabled={!["commission", "mixed"].includes(agreementForm.payment_type)}
              inputProps={{
                min: 0,
                max: 100,
                step: 0.1,
              }}
              helperText="Foizli yoki aralash kelishuv uchun"
            />

            <TextField
              select
              label="To‘lov davri"
              value={agreementForm.payment_period}
              onChange={(event) =>
                setAgreementForm((previous) => ({
                  ...previous,

                  payment_period: event.target.value,
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
              onChange={(event) =>
                setAgreementForm((previous) => ({
                  ...previous,

                  effective_from: event.target.value,
                }))
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              p: 1.6,
              borderRadius: "17px",
              border: "1px solid #e7ebf0",
              backgroundColor: "#f8fafc",
            }}
          >
            <Typography
              sx={{
                color: "#94a3b8",
                fontSize: 9.5,
                fontWeight: 800,
              }}
            >
              KELISHUV KO‘RINISHI
            </Typography>

            <Typography
              sx={{
                mt: 0.6,
                color: "#334155",
                fontSize: 13,
                fontWeight: 950,
              }}
            >
              {typeLabels[agreementForm.payment_type] || "-"} ·{" "}
              {periodLabels[agreementForm.payment_period] || "-"}
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "#15803d",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {getAgreementValue(agreementForm)}
            </Typography>
          </Box>

          <TextField
            multiline
            minRows={3}
            label="Izoh"
            value={agreementForm.note}
            onChange={(event) =>
              setAgreementForm((previous) => ({
                ...previous,

                note: event.target.value,
              }))
            }
          />
        </Stack>
      </PremiumDialog>
    </Box>
  );
};

const heroPrimaryButtonSx = {
  minHeight: 43,
  px: 2.2,
  color: "#ffffff !important",
  borderRadius: "13px",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "none",

  background: "linear-gradient(135deg,#991b1b,#dc2626)",

  boxShadow: "0 12px 26px rgba(127,29,29,.30)",

  "&:hover": {
    background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
  },
};

const heroSecondaryButtonSx = {
  minHeight: 43,
  px: 1.9,

  color: "rgba(255,255,255,.72) !important",

  borderRadius: "13px",

  border: "1px solid rgba(255,255,255,.10)",

  backgroundColor: "rgba(255,255,255,.055)",

  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",

  "&:hover": {
    backgroundColor: "rgba(255,255,255,.10)",
  },
};

const secondaryButtonSx = {
  minHeight: 40,
  px: 1.8,
  color: "#64748b",
  borderRadius: "11px",
  borderColor: "#dce3ea",
  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",
  backgroundColor: "#ffffff",

  "&:hover": {
    color: "#991b1b",

    borderColor: "rgba(153,27,27,.22)",

    backgroundColor: "rgba(153,27,27,.04)",
  },
};

const tableActionSx = {
  borderRadius: "9px",
  fontSize: 9.5,
  fontWeight: 900,
  textTransform: "none",
};

const dialogCancelSx = {
  color: "#64748b",
  borderRadius: "11px",
  fontWeight: 850,
  textTransform: "none",
};

const dialogPrimarySx = {
  minWidth: 125,
  minHeight: 40,
  px: 2,
  color: "#ffffff",
  borderRadius: "11px",
  fontSize: 10.5,
  fontWeight: 900,
  textTransform: "none",

  background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",

  boxShadow: "0 10px 24px rgba(127,29,29,.18)",

  "&:hover": {
    background: "linear-gradient(135deg,#681818,#991b1b)",
  },
};

const employeesPageStyles = `
  .crm-page .employees-hero {
    color: #ffffff !important;
    background-color: #0d1117 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.34),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #0d1117,
        #171117 52%,
        #3a121a
      ) !important;
  }

  .employees-dialog-title {
    color: #ffffff !important;
    background-color: #0d1117 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.28),
        transparent 36%
      ),
      linear-gradient(
        135deg,
        #11151c,
        #321319
      ) !important;
  }
`;

export default Employees;
