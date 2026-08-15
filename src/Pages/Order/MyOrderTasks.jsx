import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PageHeader from "../../Components/UI/PageHeader";
import CrmPagination from "../../Components/Common/CrmPagination";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import { claimOrderTask, getMyOrderTasks, updateOrderTaskProgress } from "../../api/orders";
import TaskFinishDialog from "./TaskFinishDialog";

const labels = {
  pending: "Navbatda",
  in_progress: "Jarayonda",
  // Ishchi tugatdim dedi, bo'lim boshlig'i hali ko'rgani yo'q.
  submitted: "Tasdiq kutilmoqda",
  completed: "Tasdiqlandi",
};
const colors = {
  pending: "#7d716a",
  in_progress: "#d97706",
  submitted: "#a9814b",
  completed: "#2f6b45",
};

const MyOrderTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [pageInfo, setPageInfo] = useState({ total: 0, limit: 10, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [claimQuantities, setClaimQuantities] = useState({});
  const [department, setDepartment] = useState(null);

  // "Tugatish" darhol yopmaydi — avval nima sarflanganini so'raymiz.
  const [finishTask, setFinishTask] = useState(null);
  const page = Math.floor(pageInfo.offset / pageInfo.limit);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getMyOrderTasks({
        ...filters,
        limit: pageInfo.limit,
        offset: pageInfo.offset,
      });
      setTasks(data.tasks || []);
      setDepartment(data.department || null);
      setPageInfo((current) => ({ ...current, ...(data.pageInfo || {}) }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Vazifalarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [filters, pageInfo.limit, pageInfo.offset]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  const update = async (task, values) => {
    setSavingId(task.id);
    try {
      await updateOrderTaskProgress(task.id, values);
      toast.success("Vazifa yangilandi");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Vazifani yangilab bo'lmadi");
    } finally {
      setSavingId(null);
    }
  };

  const finish = async (materials) => {
    if (!finishTask) return;

    setSavingId(finishTask.id);

    try {
      await updateOrderTaskProgress(finishTask.id, {
        status: "completed",
        completed_quantity: Number(finishTask.completed_quantity),
        worker_note: finishTask.worker_note || "",
        materials,
      });
      toast.success("Ish yakunlandi va hisobga o‘tdi");
      setFinishTask(null);
      load();
    } catch (error) {
      // Oyna ochiq qoladi: kiritilgan sarf yo'qolmasin, xatoni tuzatib
      // qayta yuborsin. Ko'p uchraydigan sabab — bo'lim narxi yo'qligi.
      toast.error(error.response?.data?.message || "Vazifani yakunlab bo'lmadi");
    } finally {
      setSavingId(null);
    }
  };

  const claim = async (task) => {
    const availableQuantity = Number(task.available_quantity || 0);
    const quantity = Number(claimQuantities[task.id] ?? availableQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > availableQuantity) {
      toast.warning(`Miqdor 0 dan katta va ${availableQuantity} dan oshmasin`);
      return;
    }
    setSavingId(task.id);
    try {
      await claimOrderTask(task.id, quantity);
      toast.success(`${quantity} ${task.product_unit || "ta"} ish olindi`);
      setClaimQuantities((current) => {
        const next = { ...current };
        delete next[task.id];
        return next;
      });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Vazifani olib bo'lmadi");
    } finally {
      setSavingId(null);
    }
  };

  const setCompleted = (task, value) => {
    const quantity = Math.max(0, Math.min(Number(value || 0), Number(task.planned_quantity)));
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, completed_quantity: quantity } : item,
      ),
    );
  };
  const setWorkerNote = (task, value) => {
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, worker_note: value } : item)),
    );
  };

  return (
    <Stack className="crm-page my-order-tasks-page" spacing={3} sx={{ p: { xs: 2, md: 3.5 } }}>
      <PageHeader
        eyebrow={department?.name || "Ishlab chiqarish"}
        title="Bo'lim navbati"
        description="Zakaz ham, omborga ishlab chiqariladigan partiya ham shu yerda. Shoshilinchlari navbat boshida. Ishni oling, bajarganingizni yozing — ish hisoboti o'zi tushadi."
      />
      <Paper
        className="crm-sticky-filters"
        elevation={0}
        sx={{
          p: 2,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" },
          gap: 1.5,
          border: "1px solid var(--aa-border)",
          borderRadius: 3,
        }}
      >
        <TextField
          size="small"
          label="Zakaz, partiya yoki mahsulot"
          value={filters.q}
          onChange={(event) => {
            setFilters((current) => ({ ...current, q: event.target.value }));
            setPageInfo((current) => ({ ...current, offset: 0 }));
          }}
        />
        <TextField
          select
          size="small"
          label="Holat"
          value={filters.status}
          onChange={(event) => {
            setFilters((current) => ({ ...current, status: event.target.value }));
            setPageInfo((current) => ({ ...current, offset: 0 }));
          }}
        >
          <MenuItem value="">Barchasi</MenuItem>
          {Object.entries(labels).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Paper>
      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : tasks.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ py: 8, textAlign: "center", border: "1px solid var(--aa-border)", borderRadius: 3 }}
        >
          <Typography color="text.secondary">Bo'lim navbatida hozircha ish yo'q</Typography>
        </Paper>
      ) : (
        <Stack className="aa-task-list" spacing={1.5}>
          {tasks.map((task) => {
            const availableQuantity = Number(task.available_quantity || task.planned_quantity || 0);
            const percent = Math.round(
              (Number(task.completed_quantity || 0) * 100) / Number(task.planned_quantity || 1),
            );
            return (
              <Paper
                className="aa-task-card"
                key={task.id}
                elevation={0}
                sx={{ p: 2.2, border: "1px solid var(--aa-border)", borderRadius: 3 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box>
                    {/* Ish ikki manbadan keladi. Ishchi qaysi biri ekanini
                        darrov ko'rishi kerak: partiya omborga ishlanadi,
                        zakaz esa aniq mijozga ketadi. */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <Typography
                        sx={{ fontSize: 12, color: "var(--aa-brand-text)", fontWeight: 700 }}
                      >
                        {task.source_label || task.order_number}
                      </Typography>

                      <Chip
                        size="small"
                        label={task.source_type === "batch" ? "Partiya" : "Zakaz"}
                        sx={{
                          height: 20,
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: ".04em",
                          // Qorong'i mavzuda ham o'qiladigan juftliklar:
                          // --aa-brand-100 va --aa-accent-soft ikkalasida
                          // ham fon, matn ranglari esa ikkalasida ham to'q.
                          color:
                            task.source_type === "batch"
                              ? "var(--aa-accent-strong)"
                              : "var(--aa-brand-text)",
                          bgcolor:
                            task.source_type === "batch"
                              ? "var(--aa-accent-soft)"
                              : "var(--aa-brand-100)",
                        }}
                      />
                    </Box>
                    {task.priority === "urgent" && (
                      <Chip
                        size="small"
                        label="Shoshilinch"
                        sx={{
                          mt: 0.5,
                          height: 22,
                          color: "#7a1826",
                          bgcolor: "#faf5ef",
                          fontWeight: 600,
                        }}
                      />
                    )}
                    <Typography sx={{ mt: 0.3, fontSize: 18, fontWeight: 700 }}>
                      {task.product_name}
                    </Typography>
                    <Typography sx={{ mt: 0.3, color: "var(--aa-text-secondary)", fontSize: 13 }}>
                      {task.department_name} · Muddat:{" "}
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString("uz-UZ")
                        : "Belgilanmagan"}
                    </Typography>
                  </Box>
                  <Chip
                    label={labels[task.status]}
                    sx={{ color: colors[task.status], fontWeight: 600 }}
                  />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ mb: 0.7, display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                      {task.status === "pending" ? (
                        <>
                          Keyingi ishga tayyor: {availableQuantity} {task.product_unit || "ta"}
                        </>
                      ) : (
                        <>
                          Bajarildi: {task.completed_quantity} / {task.planned_quantity}{" "}
                          {task.product_unit || "ta"}
                        </>
                      )}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{percent}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{
                      height: 8,
                      borderRadius: 8,
                      "& .MuiLinearProgress-bar": { bgcolor: colors[task.status] },
                    }}
                  />
                </Box>
                {task.status === "submitted" && (
                  <Typography
                    sx={{
                      mt: 1.5,
                      p: 1.2,
                      borderRadius: 2,
                      fontSize: 12.5,
                      color: "var(--aa-accent-strong)",
                      bgcolor: "var(--aa-accent-soft)",
                      border: "1px solid var(--aa-accent)",
                    }}
                  >
                    {task.submitted_quantity} {task.product_unit || "ta"} topshirildi. Bo‘lim
                    boshlig‘i tasdiqlagach ish hisobingizga o‘tadi.
                  </Typography>
                )}
                {task.rejection_reason && task.status !== "completed" && (
                  <Typography
                    sx={{
                      mt: 1.5,
                      p: 1.2,
                      borderRadius: 2,
                      fontSize: 12.5,
                      color: "var(--aa-danger)",
                      bgcolor: "var(--aa-danger-soft, rgba(160,32,44,.08))",
                      border: "1px solid var(--aa-danger)",
                    }}
                  >
                    Qaytarildi: {task.rejection_reason}
                  </Typography>
                )}
                {task.note && (
                  <Typography
                    sx={{
                      mt: 1.5,
                      p: 1.2,
                      bgcolor: "var(--aa-surface-muted)",
                      borderRadius: 2,
                      fontSize: 12.5,
                    }}
                  >
                    Administrator izohi: {task.note}
                  </Typography>
                )}
                <Box
                  className="aa-task-actions"
                  sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}
                >
                  {task.status === "pending" && (
                    <>
                      <TextField
                        size="small"
                        type="number"
                        label="Olinadigan miqdor"
                        value={claimQuantities[task.id] ?? availableQuantity}
                        onChange={(event) =>
                          setClaimQuantities((current) => ({
                            ...current,
                            [task.id]: event.target.value,
                          }))
                        }
                        inputProps={{ min: 0.01, max: availableQuantity, step: 0.01 }}
                        helperText={`Hozir tayyor: ${availableQuantity} ${task.product_unit || "ta"}`}
                        sx={{ width: 190 }}
                      />
                      <Button
                        variant="contained"
                        disabled={savingId === task.id}
                        onClick={() => claim(task)}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Shu miqdorni olish
                      </Button>
                    </>
                  )}
                  {task.status === "in_progress" && (
                    <>
                      <TextField
                        size="small"
                        type="number"
                        label="Bajarilgan miqdor"
                        value={task.completed_quantity}
                        onChange={(event) => setCompleted(task, event.target.value)}
                        inputProps={{ min: 0, max: task.planned_quantity }}
                        sx={{ width: 180 }}
                      />
                      <TextField
                        size="small"
                        label="Ish bo'yicha izoh"
                        value={task.worker_note || ""}
                        onChange={(event) => setWorkerNote(task, event.target.value)}
                        sx={{ minWidth: 220, flex: 1 }}
                      />
                      <Button
                        variant="outlined"
                        disabled={savingId === task.id}
                        onClick={() =>
                          update(task, {
                            completed_quantity: Number(task.completed_quantity),
                            worker_note: task.worker_note || "",
                          })
                        }
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Saqlash
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        disabled={savingId === task.id}
                        onClick={() => setFinishTask(task)}
                        sx={{ textTransform: "none", fontWeight: 600 }}
                      >
                        Tugatish
                      </Button>
                    </>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}
      <TaskFinishDialog
        open={Boolean(finishTask)}
        task={finishTask}
        saving={savingId === finishTask?.id}
        onClose={() => setFinishTask(null)}
        onConfirm={finish}
      />

      <CrmPagination
        total={pageInfo.total}
        page={page}
        limit={pageInfo.limit}
        onPageChange={(next) =>
          setPageInfo((current) => ({ ...current, offset: next * current.limit }))
        }
        onLimitChange={(limit) => setPageInfo((current) => ({ ...current, limit, offset: 0 }))}
      />
    </Stack>
  );
};

export default MyOrderTasks;
