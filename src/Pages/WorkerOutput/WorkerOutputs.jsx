import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Alert,
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
import { hasPermission } from "../../utils/permissions";
import { getUsers } from "../../api/getUsers";
import { getProducts } from "../../api/products";
import { getDepartments } from "../../api/departments";
import {
  createBulkWorkerOutputs,
  deleteWorkerOutput,
  getWorkerOutputs,
  updateWorkerOutput,
} from "../../api/workerOutputs";

const emptyForm = {
  worker_id: "",
  product_id: "",
  department_id: "",
  quantity: "",
  worked_at: new Date().toISOString().slice(0, 10),
  note: "",
};

const emptyBatchItem = {
  product_id: "",
  quantity: "",
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const formatMoney = (value) => {
  if (value === null || value === undefined || value === "") {
    return "0 so'm";
  }

  return `${new Intl.NumberFormat("uz-UZ").format(Number(value))} so'm`;
};

const formatNumber = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const formatProductName = (product) => [product?.name, product?.color].filter(Boolean).join(" — ");

const ProductOptionLabel = ({ product }) => (
  <Box sx={{ minWidth: 0, py: 0.25 }}>
    <Typography
      noWrap
      sx={{
        color: "#334155",
        fontSize: 14,
        fontWeight: 850,
      }}
    >
      {formatProductName(product)}
    </Typography>

    {product.sku && (
      <Typography
        noWrap
        sx={{
          mt: 0.15,
          color: "#94a3b8",
          fontSize: 11.5,
          fontWeight: 650,
        }}
      >
        SKU: {product.sku}
      </Typography>
    )}
  </Box>
);

const formatDate = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const getInitial = (value) =>
  String(value || "I")
    .trim()
    .slice(0, 1)
    .toUpperCase();

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
    red: {
      color: "#fecdd3",
      background: "rgba(220,38,38,.15)",
      border: "rgba(248,113,113,.15)",
    },

    green: {
      color: "#bbf7d0",
      background: "rgba(34,197,94,.14)",
      border: "rgba(74,222,128,.15)",
    },

    amber: {
      color: "#fde68a",
      background: "rgba(245,158,11,.15)",
      border: "rgba(251,191,36,.15)",
    },

    blue: {
      color: "#bfdbfe",
      background: "rgba(37,99,235,.15)",
      border: "rgba(96,165,250,.15)",
    },
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
          color: current.color,
          backgroundColor: current.background,
          border: `1px solid ${current.border}`,
          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.4,
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

const DepartmentChip = ({ label }) => (
  <Chip
    size="small"
    label={label || "-"}
    sx={{
      height: 25,
      px: 0.35,
      color: "#1d4ed8",
      fontSize: 9.5,
      fontWeight: 900,
      backgroundColor: "rgba(37,99,235,.09)",
      border: "1px solid rgba(37,99,235,.16)",
    }}
  />
);

const PremiumDialog = ({
  open,
  onClose,
  title,
  subtitle = "Ishlab chiqarish ma’lumotlarini boshqarish",
  children,
  actions,
  maxWidth = "md",
}) => (
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
      className="worker-output-dialog-title"
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

    <DialogContent sx={{ px: 3, py: 2.7 }}>{children}</DialogContent>

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

const WorkerOutputs = () => {
  const auth = useAuth();
  const currentUser = auth?.user || getLocalUser();

  const canManage =
    ["super_admin", "admin"].includes(currentUser?.role) &&
    hasPermission(currentUser, "production.manage");

  const [outputs, setOutputs] = useState([]);

  const [pageInfo, setPageInfo] = useState({
    total: 0,
    offset: 0,
    limit: 10,
  });

  const [totals, setTotals] = useState({
    total_quantity: 0,
    total_amount: 0,
  });

  const [loading, setLoading] = useState(false);

  const [workers, setWorkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    worker_id: "",
    product_id: "",
    department_id: "",
    date_from: "",
    date_to: "",
    sort_by: "worked_at",
    sort_order: "desc",
  });

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);

  const [batchItems, setBatchItems] = useState([{ ...emptyBatchItem }]);

  const [selectedOutput, setSelectedOutput] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const selectedProduct = useMemo(
    () => products.find((product) => Number(product.id) === Number(form.product_id)),
    [form.product_id, products],
  );

  const selectedDepartment = useMemo(
    () => departments.find((department) => Number(department.id) === Number(form.department_id)),
    [departments, form.department_id],
  );

  const selectedProductCompletesStock = Boolean(
    selectedProduct?.has_recipe &&
    selectedProduct?.completion_department_id &&
    Number(selectedProduct.completion_department_id) === Number(form.department_id),
  );

  const batchProductsCompletingStock = useMemo(
    () =>
      batchItems
        .map((item) => products.find((product) => Number(product.id) === Number(item.product_id)))
        .filter(
          (product) =>
            product?.has_recipe &&
            Number(product.completion_department_id) === Number(form.department_id),
        ),
    [batchItems, form.department_id, products],
  );

  const fetchSelectData = useCallback(async () => {
    try {
      const [usersRes, productsRes, departmentsRes] = await Promise.all([
        getUsers({
          offset: 0,
          limit: 100,
          sort_by: "created_at",
          sort_order: "desc",
        }),

        getProducts({
          offset: 0,
          limit: 100,
          sort_by: "name",
          sort_order: "asc",
          is_active: true,
        }),

        getDepartments({
          offset: 0,
          limit: 100,
          sort_by: "sort_order",
          sort_order: "asc",
          is_active: true,
        }),
      ]);

      setWorkers(
        (usersRes.data.users || usersRes.data.list || []).filter((user) => user.role === "worker"),
      );

      setProducts(productsRes.data.products || []);

      setDepartments(departmentsRes.data.departments || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Tanlov ma'lumotlarini olishda xato.");
    }
  }, []);

  const buildParams = useCallback(
    (offset = 0, limit = pageInfo.limit) => {
      const params = {
        offset,
        limit,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      };

      for (const key of ["q", "worker_id", "product_id", "department_id", "date_from", "date_to"]) {
        if (filters[key] !== "") {
          params[key] = filters[key];
        }
      }

      return params;
    },
    [filters, pageInfo.limit],
  );

  const fetchOutputs = useCallback(
    async (offset = 0, limit = pageInfo.limit) => {
      setLoading(true);

      try {
        const { data } = await getWorkerOutputs(buildParams(offset, limit));

        setOutputs(data.worker_outputs || []);

        setTotals(
          data.totals || {
            total_quantity: 0,
            total_amount: 0,
          },
        );

        setPageInfo(
          data.pageInfo || {
            total: 0,
            offset,
            limit,
          },
        );
      } catch (error) {
        toast.error(error?.response?.data?.message || "Ish yozuvlarini olishda xato.");
      } finally {
        setLoading(false);
      }
    },
    [buildParams, pageInfo.limit],
  );

  useEffect(() => {
    fetchSelectData();
  }, [fetchSelectData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOutputs(0, pageInfo.limit);
    }, 250);

    return () => clearTimeout(timer);
  }, [filters, pageInfo.limit, fetchOutputs]);

  const handleFilterChange = (field) => (event) => {
    setFilters((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const handleFormChange = (field) => (event) => {
    setForm((previous) => ({
      ...previous,
      [field]: event.target.value,
    }));
  };

  const refreshPage = () => {
    fetchOutputs(pageInfo.offset, pageInfo.limit);
  };

  const openCreateModal = () => {
    setSelectedOutput(null);
    setForm(emptyForm);
    setBatchItems([{ ...emptyBatchItem }]);
    setModalOpen(true);
  };

  const openEditModal = (output) => {
    setSelectedOutput(output);

    setForm({
      worker_id: output.worker_id || "",
      product_id: output.product_id || "",
      department_id: output.department_id || "",
      quantity: output.quantity ?? "",

      worked_at: output.worked_at ? String(output.worked_at).slice(0, 10) : emptyForm.worked_at,

      note: output.note || "",
    });

    setModalOpen(true);
  };

  const closeModals = () => {
    setModalOpen(false);
    setDeleteOpen(false);
    setSelectedOutput(null);
    setForm(emptyForm);
    setBatchItems([{ ...emptyBatchItem }]);
  };

  const changeBatchItem = (index, field) => (event) => {
    const value = event.target.value;

    setBatchItems((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const addBatchItem = () => {
    setBatchItems((previous) => [...previous, { ...emptyBatchItem }]);
  };

  const removeBatchItem = (index) => {
    setBatchItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const validateForm = () => {
    if (!form.worker_id) {
      toast.error("Ishchini tanlang.");
      return false;
    }

    if (!form.department_id) {
      toast.error("Bo'limni tanlang.");
      return false;
    }

    if (selectedOutput) {
      if (!form.product_id) {
        toast.error("Mahsulotni tanlang.");
        return false;
      }

      if (!form.quantity || Number(form.quantity) <= 0) {
        toast.error("Miqdorni to'g'ri kiriting.");
        return false;
      }
    } else {
      if (batchItems.some((item) => !item.product_id || Number(item.quantity) <= 0)) {
        toast.error("Har bir qatorda mahsulot va miqdorni to'g'ri kiriting.");

        return false;
      }

      const productIds = batchItems.map((item) => String(item.product_id));

      if (new Set(productIds).size !== productIds.length) {
        toast.error("Bir mahsulotni ikki marta tanlamang, miqdorini bitta qatorda jamlang.");

        return false;
      }
    }

    return true;
  };

  const buildPayload = () => ({
    worker_id: Number(form.worker_id),
    product_id: Number(form.product_id),
    department_id: Number(form.department_id),
    quantity: Number(form.quantity),
    worked_at: form.worked_at || undefined,
    note: form.note.trim() || null,
  });

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      if (selectedOutput) {
        await updateWorkerOutput(selectedOutput.id, buildPayload());

        toast.success("Ish yozuvi yangilandi.");
      } else {
        await createBulkWorkerOutputs({
          worker_id: Number(form.worker_id),

          department_id: Number(form.department_id),

          worked_at: form.worked_at || undefined,

          note: form.note.trim() || null,

          items: batchItems.map((item) => ({
            product_id: Number(item.product_id),
            quantity: Number(item.quantity),
          })),
        });

        toast.success(`${batchItems.length} ta ish yozuvi qo'shildi.`);
      }

      closeModals();
      refreshPage();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ish yozuvini saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOutput) return;

    setDeleting(true);

    try {
      await deleteWorkerOutput(selectedOutput.id);

      toast.success("Ish yozuvi o'chirildi.");

      closeModals();
      refreshPage();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ish yozuvini o'chirishda xato.");
    } finally {
      setDeleting(false);
    }
  };

  const applyFilters = () => {
    fetchOutputs(0, pageInfo.limit);
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      worker_id: "",
      product_id: "",
      department_id: "",
      date_from: "",
      date_to: "",
      sort_by: "worked_at",
      sort_order: "desc",
    });

    setFiltersOpen(false);
  };

  return (
    <Box
      className="crm-page worker-outputs-page"
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        pb: 2.5,
      }}
    >
      <style>{workerOutputsStyles}</style>

      <Box
        component="section"
        className="worker-outputs-hero"
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
              xl: ".8fr 1.2fr",
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
                Ishlab chiqarish markazi
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
              Ish hisoboti
            </Typography>

            <Typography
              sx={{
                maxWidth: 560,
                mt: 1.4,

                color: "rgba(255,255,255,.45) !important",

                fontSize: 12.5,
                lineHeight: 1.75,
              }}
            >
              Ishchilar bajargan mahsulotlar, bo‘limlar, ish haqi va omborga tayyor mahsulot
              kirimini bir joydan boshqaring.
            </Typography>

            {canManage && (
              <Button
                onClick={openCreateModal}
                sx={{
                  mt: 2.4,
                  minHeight: 43,
                  px: 2.2,

                  color: "#ffffff !important",

                  borderRadius: "13px",
                  fontSize: 11.5,
                  fontWeight: 900,
                  textTransform: "none",

                  background: "linear-gradient(135deg,#991b1b,#dc2626)",

                  boxShadow: "0 12px 26px rgba(127,29,29,.30)",

                  "&:hover": {
                    background: "linear-gradient(135deg,#7f1d1d,#b91c1c)",
                  },
                }}
              >
                + Ish yozuvi qo‘shish
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
              label="Ish yozuvlari"
              value={formatNumber(pageInfo.total)}
              helper="Tanlangan filtr bo‘yicha"
              tone="blue"
            />

            <HeroMetric
              label="Jami miqdor"
              value={`${formatNumber(totals.total_quantity)} par`}
              helper="Bajarilgan mahsulotlar"
              tone="green"
            />

            <HeroMetric
              label="Hisoblangan haq"
              value={formatMoney(totals.total_amount)}
              helper="Ishchilarga hisoblangan"
              tone="red"
            />

            <HeroMetric
              label="Bo‘limlar"
              value={formatNumber(departments.length)}
              helper="Faol ishlab chiqarish bo‘limlari"
              tone="amber"
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
            flexDirection: "column",
            gap: 1.6,
          }}
        >
          <Box
            sx={{
              display: "flex",

              alignItems: {
                xs: "stretch",
                xl: "center",
              },

              justifyContent: "space-between",

              flexDirection: {
                xs: "column",
                xl: "row",
              },

              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,1fr)",
                  lg: "repeat(4,1fr)",
                },

                gap: 1.4,
                flex: 1,
              }}
            >
              <TextField
                size="small"
                label="Qidirish"
                placeholder="Ishchi yoki mahsulot nomi"
                value={filters.q}
                onChange={handleFilterChange("q")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    applyFilters();
                  }
                }}
              />

              <TextField
                select
                size="small"
                label="Ishchi"
                value={filters.worker_id}
                onChange={handleFilterChange("worker_id")}
              >
                <MenuItem value="">Barchasi</MenuItem>

                {workers.map((worker) => (
                  <MenuItem key={worker.id} value={worker.id}>
                    {worker.first_name} {worker.last_name}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="outlined"
                onClick={() => setFiltersOpen((open) => !open)}
                sx={filterButtonSx}
              >
                {filtersOpen ? "Filtrlarni yopish" : "Batafsil filtrlar"}
              </Button>

              <Button variant="outlined" onClick={resetFilters} sx={filterButtonSx}>
                Tozalash
              </Button>
            </Box>
          </Box>

          {filtersOpen && (
            <Box
              sx={{
                pt: 1.6,
                display: "grid",

                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2,1fr)",
                  lg: "repeat(4,1fr)",
                },

                gap: 1.4,
                borderTop: "1px solid #edf0f3",
              }}
            >
              <TextField
                select
                size="small"
                label="Mahsulot"
                value={filters.product_id}
                onChange={handleFilterChange("product_id")}
                SelectProps={{
                  renderValue: (value) =>
                    value
                      ? formatProductName(
                          products.find((product) => Number(product.id) === Number(value)),
                        )
                      : "Barchasi",
                }}
              >
                <MenuItem value="">Barchasi</MenuItem>

                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    <ProductOptionLabel product={product} />
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Bo‘lim"
                value={filters.department_id}
                onChange={handleFilterChange("department_id")}
              >
                <MenuItem value="">Barchasi</MenuItem>

                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                type="date"
                label="Dan"
                value={filters.date_from}
                onChange={handleFilterChange("date_from")}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <TextField
                size="small"
                type="date"
                label="Gacha"
                value={filters.date_to}
                onChange={handleFilterChange("date_to")}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Box>
          )}
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
              Ish yozuvlari ro‘yxati
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: "#94a3b8",
                fontSize: 10.5,
              }}
            >
              Ishchi, mahsulot, bo‘lim va hisoblangan summa
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${formatNumber(pageInfo.total)} ta`}
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
            sx={{
              minWidth: canManage ? 1040 : 860,

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
                <TableCell>Ishchi</TableCell>
                <TableCell>Ish turi</TableCell>
                <TableCell>Hisob</TableCell>
                <TableCell>Sana</TableCell>

                {canManage && <TableCell align="right">Amallar</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={30} sx={{ color: "#991b1b" }} />
                  </TableCell>
                </TableRow>
              ) : outputs.length ? (
                outputs.map((output) => (
                  <TableRow key={output.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.6,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            color: "#ffffff",
                            fontSize: 13,
                            fontWeight: 950,

                            background: "linear-gradient(135deg,#7f1d1d,#c81e2a)",

                            border: "3px solid #ffffff",

                            boxShadow: "0 8px 20px rgba(127,29,29,.16)",
                          }}
                        >
                          {getInitial(output.worker_name)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: "#334155",
                              fontSize: 14.5,
                              fontWeight: 900,
                              lineHeight: 1.15,
                            }}
                          >
                            {output.worker_name || "-"}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              color: "#64748b",
                              fontSize: 12.5,
                              fontWeight: 700,
                            }}
                          >
                            @{output.worker_username || "worker"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "#334155",
                          fontSize: 14.5,
                          fontWeight: 900,
                        }}
                      >
                        {output.product_name || "-"}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          mb: 0.7,
                          color: "#64748b",
                          fontSize: 12.5,
                          fontWeight: 700,
                        }}
                      >
                        {output.product_sku || output.product_model || "-"}
                      </Typography>

                      <DepartmentChip label={output.department_name} />
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          color: "#334155",
                          fontSize: 14.5,
                          fontWeight: 950,
                        }}
                      >
                        {formatMoney(output.total_amount)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          color: "#64748b",
                          fontSize: 12.5,
                          fontWeight: 700,
                        }}
                      >
                        {formatNumber(output.quantity)} {output.product_unit || "par"} ×{" "}
                        {formatMoney(output.price_per_unit)}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        color: "#64748b",
                        fontWeight: 800,
                      }}
                    >
                      {formatDate(output.worked_at)}
                    </TableCell>

                    {canManage && (
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          sx={{
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                          }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openEditModal(output)}
                            sx={tableActionSx}
                          >
                            Tahrirlash
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => {
                              setSelectedOutput(output);
                              setDeleteOpen(true);
                            }}
                            sx={tableActionSx}
                          >
                            O‘chirish
                          </Button>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 5 : 4}
                    align="center"
                    sx={{
                      py: 7,
                      color: "#94a3b8",
                      fontWeight: 850,
                    }}
                  >
                    Ish yozuvlari topilmadi
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
            onPageChange={(nextPage) => fetchOutputs(nextPage * pageInfo.limit, pageInfo.limit)}
            onLimitChange={(limit) => fetchOutputs(0, limit)}
          />
        </Box>
      </Card>

      <PremiumDialog
        open={modalOpen}
        onClose={closeModals}
        title={selectedOutput ? "Ish yozuvini tahrirlash" : "Ish yozuvi qo‘shish"}
        actions={
          <>
            <Button onClick={closeModals} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button variant="contained" onClick={handleSave} disabled={saving} sx={dialogPrimarySx}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
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
              label="Ishchi"
              value={form.worker_id}
              onChange={handleFormChange("worker_id")}
            >
              {workers.map((worker) => (
                <MenuItem key={worker.id} value={worker.id}>
                  {worker.first_name} {worker.last_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              required
              label="Bo‘lim"
              value={form.department_id}
              onChange={handleFormChange("department_id")}
            >
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              label="Sana"
              value={form.worked_at}
              onChange={handleFormChange("worked_at")}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Box>

          {(selectedOutput
            ? selectedProductCompletesStock
            : batchProductsCompletingStock.length > 0) && (
            <Alert severity="success" sx={{ borderRadius: "14px" }}>
              Bu yakuniy ishlab chiqarish bosqichi. Saqlanganda tayyor mahsulot omboriga par
              qo‘shiladi va retsept bo‘yicha homashyolar avtomatik kamayadi.
            </Alert>
          )}

          {selectedOutput ? (
            <>
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
                  label="Mahsulot"
                  value={form.product_id}
                  onChange={handleFormChange("product_id")}
                  SelectProps={{
                    renderValue: (value) =>
                      formatProductName(
                        products.find((product) => Number(product.id) === Number(value)),
                      ),
                  }}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      <ProductOptionLabel product={product} />
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  required
                  type="number"
                  label="Miqdor (par)"
                  value={form.quantity}
                  onChange={handleFormChange("quantity")}
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: 1,
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: "18px",
                  border: "1px solid #e7ebf0",
                  background: "linear-gradient(145deg,#ffffff,#f8fafc)",
                }}
              >
                <Typography
                  sx={{
                    color: "#94a3b8",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  Tanlangan ish
                </Typography>

                <Typography
                  sx={{
                    mt: 0.6,
                    color: "#334155",
                    fontSize: 13,
                    fontWeight: 950,
                  }}
                >
                  {selectedProduct?.name || "Mahsulot tanlanmagan"} /{" "}
                  {selectedDepartment?.name || "Bo‘lim tanlanmagan"}
                </Typography>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: "18px",
                border: "1px solid #e7ebf0",
                background: "linear-gradient(145deg,#ffffff,#f8fafc)",
              }}
            >
              <Box
                sx={{
                  mb: 1.6,
                  display: "flex",

                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },

                  justifyContent: "space-between",

                  flexDirection: {
                    xs: "column",
                    sm: "row",
                  },

                  gap: 1.3,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#334155",
                      fontSize: 16,
                      fontWeight: 950,
                    }}
                  >
                    Mahsulot va miqdorlar
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.4,
                      color: "#64748b",
                      fontSize: 11,
                      lineHeight: 1.6,
                    }}
                  >
                    Narx va summa backendda avtomatik hisoblanadi.
                  </Typography>
                </Box>

                <Button variant="outlined" onClick={addBatchItem} sx={filterButtonSx}>
                  + Qator qo‘shish
                </Button>
              </Box>

              <Stack spacing={1.4}>
                {batchItems.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "grid",

                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 180px auto",
                      },

                      gap: 1.3,
                      p: 1.4,
                      borderRadius: "16px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e7ebf0",
                    }}
                  >
                    <TextField
                      select
                      required
                      label="Mahsulot"
                      value={item.product_id}
                      onChange={changeBatchItem(index, "product_id")}
                      SelectProps={{
                        renderValue: (value) =>
                          formatProductName(
                            products.find((product) => Number(product.id) === Number(value)),
                          ),
                      }}
                    >
                      {products.map((product) => (
                        <MenuItem
                          key={product.id}
                          value={product.id}
                          disabled={batchItems.some(
                            (row, rowIndex) =>
                              rowIndex !== index && Number(row.product_id) === Number(product.id),
                          )}
                        >
                          <ProductOptionLabel product={product} />
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      required
                      type="number"
                      label="Miqdor (par)"
                      value={item.quantity}
                      onChange={changeBatchItem(index, "quantity")}
                      slotProps={{
                        htmlInput: {
                          min: 0,
                          step: 1,
                        },
                      }}
                    />

                    <Button
                      color="error"
                      onClick={() => removeBatchItem(index)}
                      disabled={batchItems.length === 1}
                      sx={{
                        borderRadius: "11px",
                        fontSize: 10,
                        fontWeight: 850,
                        textTransform: "none",
                      }}
                    >
                      Olib tashlash
                    </Button>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Izoh"
            value={form.note}
            onChange={handleFormChange("note")}
          />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={deleteOpen}
        onClose={closeModals}
        title="Ish yozuvini o‘chirish"
        subtitle="Bu amal tanlangan ish yozuvini o‘chiradi"
        maxWidth="xs"
        actions={
          <>
            <Button onClick={closeModals} sx={dialogCancelSx}>
              Bekor qilish
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={handleDelete}
              disabled={deleting}
              sx={{
                borderRadius: "11px",
                fontWeight: 900,
                textTransform: "none",
              }}
            >
              {deleting ? "O‘chirilmoqda..." : "O‘chirish"}
            </Button>
          </>
        }
      >
        <Typography
          sx={{
            color: "#64748b",
            fontSize: 12.5,
            lineHeight: 1.7,
            fontWeight: 700,
          }}
        >
          <strong>{selectedOutput?.worker_name}</strong> foydalanuvchisining ish yozuvini
          o‘chirmoqchimisiz?
        </Typography>
      </PremiumDialog>
    </Box>
  );
};

const filterButtonSx = {
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
  minWidth: 120,
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

const workerOutputsStyles = `
  .crm-page .worker-outputs-hero {
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

  .worker-output-dialog-title {
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

export default WorkerOutputs;
