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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import CrmPagination from "../../Components/Common/CrmPagination";
import { useAuth } from "../../Context/AuthContext";
import { getClientBalance, getClientSalesSummary } from "../../api/clientSales";
import {
  createUserByAdmin,
  createUserByStaff,
  deleteUser,
  getUsers,
  permanentlyDeleteUser,
  restoreUser,
  updateUser,
} from "../../api/getUsers";
import { hasPermission } from "../../utils/permissions";

const CLIENT_ROLES = ["client", "customer"];

const roleNames = {
  client: "Mijoz",
  customer: "Xaridor",
};

const emptyForm = {
  first_name: "",
  last_name: "",
  username: "",
  password: "",
  phone: "+998",
  role: "client",
  client_debt_amount: "0",
  client_debt_original: "0",
};

const money = (value) => `${new Intl.NumberFormat("uz-UZ").format(Number(value || 0))} so'm`;

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

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const getInitials = (client) => {
  const first = client?.first_name?.[0] || "";
  const last = client?.last_name?.[0] || "";

  return `${first}${last}`.toUpperCase() || client?.username?.slice(0, 2)?.toUpperCase() || "M";
};

const ClientMetric = ({ label, value, helper, tone = "red" }) => {
  const tones = {
    red: {
      color: "#fecdd3",
      background: "rgba(220,38,38,.14)",
    },
    green: {
      color: "#bbf7d0",
      background: "rgba(34,197,94,.13)",
    },
    amber: {
      color: "#fde68a",
      background: "rgba(245,158,11,.14)",
    },
    violet: {
      color: "#ddd6fe",
      background: "rgba(139,92,246,.15)",
    },
  };

  const currentTone = tones[tone] || tones.red;

  return (
    <Box
      sx={{
        minWidth: 0,
        minHeight: 122,
        p: 2,
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,.08)",
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
          color: currentTone.color,
          backgroundColor: currentTone.background,
          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.5,
          color: "rgba(255,255,255,.46) !important",
          fontSize: 10,
          fontWeight: 750,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.65,
          color: "#ffffff !important",
          fontSize: 19,
          fontWeight: 950,
          letterSpacing: "-.035em",
        }}
      >
        {value}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.6,
          color: "rgba(255,255,255,.3) !important",
          fontSize: 9.5,
        }}
      >
        {helper}
      </Typography>
    </Box>
  );
};

const ClientRoleChip = ({ role }) => {
  const isClient = role === "client";

  return (
    <Chip
      size="small"
      label={roleNames[role] || role || "-"}
      sx={{
        height: 25,
        color: isClient ? "#15803d" : "#6d28d9",
        fontSize: 10,
        fontWeight: 900,
        border: `1px solid ${isClient ? "rgba(34,197,94,.20)" : "rgba(139,92,246,.20)"}`,
        backgroundColor: isClient ? "rgba(34,197,94,.10)" : "rgba(139,92,246,.10)",
      }}
    />
  );
};

const Clients = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [financials, setFinancials] = useState({});

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
  const [debtLoading, setDebtLoading] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [selectedClient, setSelectedClient] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedAction, setDeletedAction] = useState("");

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const showingDeleted = deletedFilter === "true";

  const canManageUsers = hasPermission(currentUser, "users.manage");

  const canManageDebt = hasPermission(currentUser, "client_sales.manage");

  const canCreateClient = ["super_admin", "admin"].includes(currentUser?.role) && canManageUsers;

  const canEditClient = (client) => {
    if (!client || !currentUser) return false;

    if (client.is_deleted) {
      return currentUser.role === "super_admin";
    }

    if (!canManageUsers) return false;

    return ["super_admin", "admin"].includes(currentUser.role);
  };

  const canDeleteClient = (client) => currentUser?.role === "super_admin" && !client?.is_deleted;

  const loadClients = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        const [clientsResult, summaryResult] = await Promise.allSettled([
          getUsers({
            q: query,
            scope: "clients",
            role: roleFilter || undefined,
            is_deleted: currentUser?.role === "super_admin" ? showingDeleted : false,
            offset,
            limit,
            sort_by: sortBy,
            sort_order: sortOrder,
          }),

          getClientSalesSummary({
            group_by: "client",
          }),
        ]);

        if (clientsResult.status === "rejected") {
          throw clientsResult.reason;
        }

        const response = clientsResult.value.data || clientsResult.value;

        setClients(response.users || []);

        setPageInfo(
          response.pageInfo || {
            total: 0,
            offset,
            limit,
          },
        );

        if (summaryResult.status === "fulfilled") {
          const summary = summaryResult.value.data?.summary || [];

          const nextFinancials = summary.reduce((acc, item) => {
            const id = item.group_id || item.client_id;

            if (id) {
              acc[String(id)] = {
                total_amount: Number(item.total_amount || 0),
                paid_amount: Number(item.paid_amount || 0),
                debt_amount: Number(item.debt_amount || 0),
              };
            }

            return acc;
          }, {});

          setFinancials(nextFinancials);
        } else {
          setFinancials({});
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Mijozlarni olishda xato.");
      } finally {
        setLoading(false);
      }
    },
    [currentUser?.role, pageInfo.limit, query, roleFilter, showingDeleted, sortBy, sortOrder],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients(0, pageInfo.limit);
    }, 250);

    return () => clearTimeout(timer);
  }, [loadClients, pageInfo.limit]);

  const totals = useMemo(() => {
    const values = Object.values(financials);

    const totalSales = values.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);

    const totalPaid = values.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);

    const totalDebt = values.reduce((sum, item) => sum + Number(item.debt_amount || 0), 0);

    const debtors = values.filter((item) => Number(item.debt_amount || 0) > 0).length;

    const paymentPercent =
      totalSales > 0 ? Math.min(100, Math.round((totalPaid / totalSales) * 100)) : 0;

    return {
      totalSales,
      totalPaid,
      totalDebt,
      debtors,
      paymentPercent,
    };
  }, [financials]);

  const handleFormChange = (field) => (event) => {
    const value = field === "phone" ? formatPhoneInput(event.target.value) : event.target.value;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setForm(emptyForm);
  };

  const openEditModal = async (client) => {
    setSelectedClient(client);

    setForm({
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      username: client.username || "",
      password: "",
      phone: formatPhoneInput(client.phone || ""),
      role: client.role || "client",
      client_debt_amount: "0",
      client_debt_original: "0",
    });

    setEditOpen(true);

    if (canManageDebt && client.role === "client") {
      setDebtLoading(true);

      try {
        const response = await getClientBalance({
          client_id: client.id,
        });

        const debtAmount = String(Math.max(0, Number(response.data?.balance?.debt_amount || 0)));

        setForm((current) => ({
          ...current,
          client_debt_amount: debtAmount,
          client_debt_original: debtAmount,
        }));
      } catch (error) {
        toast.error(error?.response?.data?.message || "Mijoz qarzini olishda xato.");

        setEditOpen(false);
        setSelectedClient(null);
      } finally {
        setDebtLoading(false);
      }
    }
  };

  const closeEditModal = () => {
    setEditOpen(false);
    setSelectedClient(null);
    setForm(emptyForm);
    setDebtLoading(false);
  };

  const handleCreate = async () => {
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

      if (canManageDebt && form.role === "client") {
        payload.client_debt_amount = Number(form.client_debt_amount || 0);
      }

      if (currentUser?.role === "super_admin") {
        await createUserByAdmin(payload);
      } else {
        await createUserByStaff(payload);
      }

      toast.success("Mijoz qo‘shildi.");

      closeCreateModal();
      loadClients(0, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Mijoz qo‘shishda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedClient) return;

    setSaving(true);

    try {
      const payload = {
        first_name: formatNameValue(form.first_name),
        last_name: formatNameValue(form.last_name),
        username: form.username.trim(),
        phone: normalizePhoneForSubmit(form.phone),
        role: form.role,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (
        canManageDebt &&
        form.role === "client" &&
        Number(form.client_debt_amount || 0) !== Number(form.client_debt_original || 0)
      ) {
        payload.client_debt_amount = Number(form.client_debt_amount || 0);
      }

      await updateUser(selectedClient.id, payload);

      toast.success("Mijoz ma’lumotlari yangilandi.");

      closeEditModal();

      loadClients(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Mijozni yangilashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;

    setDeleting(true);

    try {
      await deleteUser(selectedClient.id);

      toast.success("Mijoz o‘chirildi.");

      setDeleteOpen(false);
      setSelectedClient(null);

      loadClients(pageInfo.offset, pageInfo.limit);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Mijozni o‘chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletedAction = async () => {
    if (!selectedClient || !deletedAction) {
      return;
    }

    setDeleting(true);

    try {
      if (deletedAction === "restore") {
        await restoreUser(selectedClient.id);

        toast.success("Mijoz qayta tiklandi.");
      } else {
        await permanentlyDeleteUser(selectedClient.id);

        toast.success("Mijoz butkul o‘chirildi.");
      }

      setDeletedAction("");
      setSelectedClient(null);

      loadClients(0, pageInfo.limit);
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
      sx={{
        height: "100%",
        minHeight: 0,
        pb: 2.5,
        overflowY: "auto",
      }}
    >
      {/* Premium mijozlar sarlavhasi */}

      <Box
        component="section"
        sx={{
          position: "relative",
          isolation: "isolate",
          mb: 2,
          p: {
            xs: 2.5,
            md: 3,
          },
          overflow: "hidden",
          borderRadius: "25px",
          color: "#ffffff",
          background:
            "radial-gradient(circle at 100% 0%,rgba(220,38,38,.32),transparent 30%),linear-gradient(145deg,#0d1117,#171117 52%,#3a121a)",
          boxShadow: "0 22px 58px rgba(15,23,42,.18)",

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
                Mijozlar markazi
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
              Mijozlar va hisob-kitoblar
            </Typography>

            <Typography
              sx={{
                maxWidth: 520,
                mt: 1.4,
                color: "rgba(255,255,255,.46) !important",
                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Mijozlar, xaridlar, to‘lovlar va qarzdorliklarni yagona sahifada boshqaring.
            </Typography>

            {canCreateClient && (
              <Button
                onClick={openCreateModal}
                sx={{
                  mt: 2.5,
                  minHeight: 44,
                  px: 2.2,
                  color: "#ffffff !important",
                  borderRadius: "13px",
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: "none",
                  background: "linear-gradient(135deg,#991b1b,#dc2626)",
                  boxShadow: "0 12px 26px rgba(127,29,29,.30)",

                  "&:hover": {
                    background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
                  },
                }}
              >
                + Yangi mijoz qo‘shish
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
            <ClientMetric
              label="Jami mijoz"
              value={number(pageInfo.total)}
              helper="Tizimdagi mijozlar"
              tone="red"
            />

            <ClientMetric
              label="Qarzdor mijoz"
              value={number(totals.debtors)}
              helper="Qarzi mavjud mijozlar"
              tone="amber"
            />

            <ClientMetric
              label="Umumiy qarz"
              value={money(totals.totalDebt)}
              helper="Olinishi kerak summa"
              tone="violet"
            />

            <ClientMetric
              label="To‘lov darajasi"
              value={`${totals.paymentPercent}%`}
              helper="Savdoga nisbatan"
              tone="green"
            />
          </Box>
        </Box>
      </Box>

      {/* Filtrlar */}

      <Paper
        elevation={0}
        sx={{
          mb: 2,
          p: 2,
          borderRadius: "21px",
          border: "1px solid #e4e9ef",
          backgroundColor: "#ffffff",
          boxShadow: "0 12px 35px rgba(15,23,42,.045)",
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
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            label="Mijozni qidirish"
            placeholder="Ism, telefon yoki username"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <TextField
            select
            size="small"
            label="Mijoz turi"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <MenuItem value="">Barchasi</MenuItem>

            {CLIENT_ROLES.map((role) => (
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
              <MenuItem value="false">Faol mijozlar</MenuItem>

              <MenuItem value="true">O‘chirilgan mijozlar</MenuItem>
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
              color: "#64748b",
              borderRadius: "11px",
              border: "1px solid #dce3ea",
              fontSize: 11.5,
              fontWeight: 850,
              textTransform: "none",

              "&:hover": {
                color: "#991b1b",
                borderColor: "rgba(153,27,27,.22)",
                backgroundColor: "rgba(153,27,27,.04)",
              },
            }}
          >
            Tozalash
          </Button>
        </Box>
      </Paper>

      {/* Mijozlar jadvali */}

      <Paper
        elevation={0}
        sx={{
          overflow: "hidden",
          borderRadius: "22px",
          border: "1px solid #e4e9ef",
          backgroundColor: "#ffffff",
          boxShadow: "0 14px 40px rgba(15,23,42,.045)",
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 2,
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
              Mijozlar ro‘yxati
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                color: "#94a3b8",
                fontSize: 10.5,
              }}
            >
              Savdo va to‘lov holati bilan birga
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${number(pageInfo.total)} ta mijoz`}
            sx={{
              height: 25,
              color: "#991b1b",
              fontSize: 9.5,
              fontWeight: 900,
              backgroundColor: "rgba(153,27,27,.07)",
            }}
          />
        </Box>

        <Box sx={{ overflowX: "auto" }}>
          <Table
            sx={{
              minWidth: 1180,

              "& th": {
                py: 1.6,
                color: "#94a3b8",
                fontSize: 9.5,
                fontWeight: 900,
                letterSpacing: ".045em",
                textTransform: "uppercase",
                backgroundColor: "#fafbfc",
                borderColor: "#edf0f3",
              },

              "& td": {
                py: 1.45,
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
                <TableCell>Mijoz</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>Turi</TableCell>
                <TableCell>Jami xarid</TableCell>
                <TableCell>To‘langan</TableCell>
                <TableCell>Qarz</TableCell>
                <TableCell>Yangilangan</TableCell>
                <TableCell align="right">Amallar</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <CircularProgress
                      size={30}
                      sx={{
                        color: "#991b1b",
                      }}
                    />
                  </TableCell>
                </TableRow>
              ) : clients.length ? (
                clients.map((client) => {
                  const finance = financials[String(client.id)] || {
                    total_amount: 0,
                    paid_amount: 0,
                    debt_amount: 0,
                  };

                  const debt = Number(finance.debt_amount || 0);

                  return (
                    <TableRow
                      key={client.id}
                      hover
                      onClick={() => {
                        if (!client.is_deleted) {
                          navigate(`/clients/${client.id}`);
                        }
                      }}
                      sx={{
                        cursor: client.is_deleted ? "default" : "pointer",
                        opacity: client.is_deleted ? 0.62 : 1,
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
                            src={getImageUrl(client.user_image)}
                            sx={{
                              width: 45,
                              height: 45,
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 900,
                              background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",
                              border: "3px solid #ffffff",
                              boxShadow: "0 8px 20px rgba(127,29,29,.16)",
                            }}
                          >
                            {getInitials(client)}
                          </Avatar>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              noWrap
                              sx={{
                                color: "#334155",
                                fontSize: 12.5,
                                fontWeight: 900,
                              }}
                            >
                              {client.first_name} {client.last_name}
                            </Typography>

                            <Typography
                              noWrap
                              sx={{
                                mt: 0.4,
                                color: client.is_deleted ? "#dc2626" : "#94a3b8",
                                fontSize: 9.5,
                              }}
                            >
                              {client.is_deleted
                                ? "O‘chirilgan"
                                : `@${client.username || "username"}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>{formatPhoneInput(client.phone || "") || "-"}</TableCell>

                      <TableCell>
                        <ClientRoleChip role={client.role} />
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            color: "#334155",
                            fontSize: 10.5,
                            fontWeight: 850,
                          }}
                        >
                          {money(finance.total_amount)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            color: "#15803d",
                            fontSize: 10.5,
                            fontWeight: 850,
                          }}
                        >
                          {money(finance.paid_amount)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={money(debt)}
                          sx={{
                            height: 24,
                            color: debt > 0 ? "#b45309" : "#15803d",
                            fontSize: 9,
                            fontWeight: 900,
                            backgroundColor:
                              debt > 0 ? "rgba(245,158,11,.12)" : "rgba(34,197,94,.10)",
                          }}
                        />
                      </TableCell>

                      <TableCell>{formatDate(client.updated_at)}</TableCell>

                      <TableCell align="right">
                        <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                          {client.is_deleted && currentUser?.role === "super_admin" ? (
                            <>
                              <Button
                                size="small"
                                color="success"
                                variant="outlined"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedClient(client);
                                  setDeletedAction("restore");
                                }}
                              >
                                Tiklash
                              </Button>

                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedClient(client);
                                  setDeletedAction("permanent");
                                }}
                              >
                                Butkul o‘chirish
                              </Button>
                            </>
                          ) : (
                            <>
                              {canEditClient(client) && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEditModal(client);
                                  }}
                                  sx={{
                                    borderRadius: "9px",
                                    color: "#991b1b",
                                    borderColor: "rgba(153,27,27,.20)",
                                    fontSize: 9.5,
                                    fontWeight: 900,
                                    textTransform: "none",
                                  }}
                                >
                                  Tahrirlash
                                </Button>
                              )}

                              {canDeleteClient(client) && (
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedClient(client);
                                    setDeleteOpen(true);
                                  }}
                                  sx={{
                                    borderRadius: "9px",
                                    fontSize: 9.5,
                                    fontWeight: 900,
                                    textTransform: "none",
                                  }}
                                >
                                  O‘chirish
                                </Button>
                              )}
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{
                      py: 8,
                      color: "#94a3b8",
                      fontWeight: 850,
                    }}
                  >
                    Mijozlar topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid #edf0f3",
            backgroundColor: "#fafbfc",
          }}
        >
          <CrmPagination
            total={pageInfo.total}
            page={page}
            limit={pageInfo.limit}
            onPageChange={(nextPage) => loadClients(nextPage * pageInfo.limit, pageInfo.limit)}
            onLimitChange={(limit) => loadClients(0, limit)}
          />
        </Box>
      </Paper>

      {/* Yaratish va tahrirlash */}

      <ClientFormDialog
        open={createOpen}
        title="Yangi mijoz qo‘shish"
        form={form}
        saving={saving}
        debtLoading={debtLoading}
        canManageDebt={canManageDebt}
        onClose={closeCreateModal}
        onSave={handleCreate}
        onFormChange={handleFormChange}
        submitText="Mijozni qo‘shish"
      />

      <ClientFormDialog
        open={editOpen}
        title="Mijozni tahrirlash"
        form={form}
        saving={saving}
        debtLoading={debtLoading}
        canManageDebt={canManageDebt}
        selectedClient={selectedClient}
        onClose={closeEditModal}
        onSave={handleUpdate}
        onFormChange={handleFormChange}
        submitText="O‘zgarishlarni saqlash"
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Mijozni o‘chirish"
        description={`${selectedClient?.first_name || ""} ${
          selectedClient?.last_name || ""
        } mijozini o‘chirmoqchimisiz?`}
        loading={deleting}
        confirmText="O‘chirish"
        color="error"
        onClose={() => {
          setDeleteOpen(false);
          setSelectedClient(null);
        }}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={Boolean(deletedAction)}
        title={deletedAction === "restore" ? "Mijozni qayta tiklash" : "Mijozni butkul o‘chirish"}
        description={
          deletedAction === "restore"
            ? "Mijoz faol mijozlar ro‘yxatiga qaytarilsinmi?"
            : "Mijoz bazadan butkul o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi."
        }
        loading={deleting}
        confirmText={deletedAction === "restore" ? "Qayta tiklash" : "Butkul o‘chirish"}
        color={deletedAction === "restore" ? "success" : "error"}
        onClose={() => {
          setDeletedAction("");
          setSelectedClient(null);
        }}
        onConfirm={handleDeletedAction}
      />
    </Box>
  );
};

const ClientFormDialog = ({
  open,
  title,
  form,
  saving,
  debtLoading,
  canManageDebt,
  selectedClient,
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
      },
    }}
  >
    <DialogTitle
      sx={{
        px: 3,
        py: 2.4,
        color: "#ffffff",
        background:
          "radial-gradient(circle at 100% 0%,rgba(220,38,38,.26),transparent 35%),linear-gradient(135deg,#11151c,#321319)",
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
          color: "rgba(255,255,255,.46) !important",
          fontSize: 10.5,
        }}
      >
        Mijozning shaxsiy va hisob ma’lumotlari
      </Typography>
    </DialogTitle>

    <DialogContent sx={{ pt: 3 }}>
      {selectedClient && (
        <Box
          sx={{
            mb: 2.5,
            p: 1.7,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            borderRadius: "16px",
            border: "1px solid #e7ebf0",
            backgroundColor: "#f8fafc",
          }}
        >
          <Avatar
            src={getImageUrl(selectedClient.user_image)}
            sx={{
              width: 54,
              height: 54,
              backgroundColor: "#991b1b",
              fontWeight: 900,
            }}
          >
            {getInitials(selectedClient)}
          </Avatar>

          <Box>
            <Typography
              sx={{
                color: "#334155",
                fontSize: 13.5,
                fontWeight: 900,
              }}
            >
              {selectedClient.first_name} {selectedClient.last_name}
            </Typography>

            <Typography
              sx={{
                mt: 0.4,
                color: "#94a3b8",
                fontSize: 10.5,
              }}
            >
              ID: {selectedClient.id}
            </Typography>
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
          label={selectedClient ? "Yangi parol" : "Parol"}
          type="password"
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

        <TextField
          select
          fullWidth
          label="Mijoz turi"
          value={form.role}
          onChange={onFormChange("role")}
        >
          {CLIENT_ROLES.map((role) => (
            <MenuItem key={role} value={role}>
              {roleNames[role]}
            </MenuItem>
          ))}
        </TextField>

        {canManageDebt && form.role === "client" && (
          <TextField
            fullWidth
            type="number"
            label={selectedClient ? "Joriy qarzdorlik" : "Boshlang‘ich qarz"}
            value={form.client_debt_amount}
            onChange={onFormChange("client_debt_amount")}
            disabled={debtLoading}
            inputProps={{
              min: 0,
              step: 1000,
            }}
            sx={{
              gridColumn: {
                sm: "1 / -1",
              },
            }}
            helperText={debtLoading ? "Qarzdorlik olinmoqda..." : "Qarz bo‘lmasa 0 qoldiring."}
          />
        )}
      </Box>
    </DialogContent>

    <DialogActions
      sx={{
        px: 3,
        py: 2.3,
        borderTop: "1px solid #edf0f3",
      }}
    >
      <Button
        onClick={onClose}
        sx={{
          color: "#64748b",
          fontWeight: 850,
          textTransform: "none",
        }}
      >
        Bekor qilish
      </Button>

      <Button
        variant="contained"
        onClick={onSave}
        disabled={saving || debtLoading}
        sx={{
          minWidth: 170,
          minHeight: 42,
          borderRadius: "12px",
          fontWeight: 900,
          textTransform: "none",
          background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
        }}
      >
        {saving ? "Saqlanmoqda..." : submitText}
      </Button>
    </DialogActions>
  </Dialog>
);

const ConfirmDialog = ({
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
        borderRadius: "21px",
      },
    }}
  >
    <DialogTitle
      sx={{
        fontSize: 18,
        fontWeight: 950,
      }}
    >
      {title}
    </DialogTitle>

    <DialogContent>
      <Typography
        sx={{
          color: "#64748b",
          fontSize: 12.5,
          lineHeight: 1.7,
        }}
      >
        {description}
      </Typography>
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button
        onClick={onClose}
        sx={{
          color: "#64748b",
          fontWeight: 850,
          textTransform: "none",
        }}
      >
        Bekor qilish
      </Button>

      <Button
        color={color}
        variant="contained"
        onClick={onConfirm}
        disabled={loading}
        sx={{
          borderRadius: "11px",
          fontWeight: 900,
          textTransform: "none",
        }}
      >
        {loading ? "Bajarilmoqda..." : confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

export default Clients;
