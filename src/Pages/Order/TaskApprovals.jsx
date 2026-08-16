import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

import Card from "../../Components/UI/AppCard";
import PageHeader from "../../Components/UI/PageHeader";
import CountTabs from "../../Components/UI/CountTabs";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import {
  approveOrderTask,
  assignOrderTask,
  getDepartmentQueue,
  getPendingApprovalTasks,
  rejectOrderTask,
} from "../../api/orders";

/**
 * Bo'lim boshlig'ining tasdiq navbati.
 *
 * Ishchi "tugatdim" degani — da'vo. Shu sahifada u tekshiriladi va
 * faqat tasdiqdan keyin ish hisobotiga, oylikka va ombor harakatiga
 * aylanadi. Qaytarilsa hech narsa yozilmaydi, ish ishchiga sabab bilan
 * qaytadi.
 */
const TaskApprovals = () => {
  const [tasks, setTasks] = useState([]);
  const [queue, setQueue] = useState({ tasks: [], workers: [] });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [reasons, setReasons] = useState({});
  const [picks, setPicks] = useState({});

  /**
   * Ikki ish ustma-ust turardi: avval butun tarqatilmagan navbat, undan
   * keyin tasdiqlar. Navbat o'sgani sari boshliq tasdiqqa yetish uchun
   * hammasini aylanib o'tardi — kunlik ish shu bilan sekinlashardi.
   *
   * Endi ular alohida. Boshlang'ich ko'rinish "tasdiq": kutib turgan ish
   * boshqa odamni to'xtatib qo'yadi, tarqatish esa kuta oladi.
   */
  const [tab, setTab] = useState("approve");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [approvals, department] = await Promise.all([
        getPendingApprovalTasks({ limit: 50 }),
        getDepartmentQueue(),
      ]);
      setTasks(approvals.data.tasks || []);
      setQueue(department.data || { tasks: [], workers: [] });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Bo‘lim ma’lumotini olib bo‘lmadi.");
      setTasks([]);
      setQueue({ tasks: [], workers: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async (task) => {
    const pick = picks[task.id] || {};
    const workerId = Number(pick.worker_id);

    if (!workerId) {
      toast.warning("Avval xodimni tanlang.");
      return;
    }

    const quantity =
      pick.quantity === "" || pick.quantity === undefined
        ? Number(task.available_quantity)
        : Number(pick.quantity);

    setBusyId(task.id);

    try {
      await assignOrderTask(task.id, workerId, quantity);
      toast.success("Ish biriktirildi");
      setPicks((current) => ({ ...current, [task.id]: {} }));
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Biriktirib bo‘lmadi");
    } finally {
      setBusyId(null);
    }
  };

  const approve = async (task) => {
    setBusyId(task.id);

    try {
      await approveOrderTask(task.id);
      toast.success("Tasdiqlandi — ish hisobotiga o‘tdi");
      load();
    } catch (error) {
      // Eng ko'p uchraydigan sabab: bo'lim narxi kiritilmagan.
      toast.error(error?.response?.data?.message || "Tasdiqlab bo‘lmadi");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (task) => {
    const reason = (reasons[task.id] || "").trim();

    if (!reason) {
      toast.warning("Qaytarish sababini yozing — ishchi nimani tuzatishini bilishi kerak.");
      return;
    }

    setBusyId(task.id);

    try {
      await rejectOrderTask(task.id, reason);
      toast.success("Ish ishchiga qaytarildi");
      setReasons((current) => ({ ...current, [task.id]: "" }));
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Qaytarib bo‘lmadi");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box className="crm-page" sx={{ pb: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader
        eyebrow="Nazorat"
        title="Bo‘lim nazorati"
        description="Ishni xodimlarga taqsimlang va bajarilganini tasdiqlang. Tasdiqdan keyin ish hisobotiga tushadi, oylik hisoblanadi va xomashyo ombordan yechiladi."
      />

      {!loading && (
        <CountTabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "approve", label: "Tasdiq kutmoqda", count: tasks.length },
            { value: "assign", label: "Tarqatilmagan ish", count: queue.tasks.length },
          ]}
        />
      )}

      {!loading && tab === "assign" && queue.tasks.length > 0 && (
        <Card sx={{ p: { xs: 2, md: 2.6 } }}>
          <Typography
            sx={{ fontFamily: "var(--aa-display)", fontSize: 18, color: "var(--aa-text)" }}
          >
            Tarqatilmagan ish
          </Typography>

          <Typography sx={{ mt: 0.4, mb: 1.6, color: "var(--aa-text-tertiary)", fontSize: 11.5 }}>
            Kimga berishni siz belgilaysiz. Miqdorni bo‘lib, bitta ishni bir necha xodimga
            taqsimlash mumkin.
          </Typography>

          <Stack spacing={1.2}>
            {queue.tasks.map((task) => {
              const pick = picks[task.id] || {};
              const workers = queue.workers.filter(
                (worker) => Number(worker.department_id) === Number(task.department_id),
              );

              return (
                <Box
                  key={task.id}
                  sx={{
                    p: 1.6,
                    borderRadius: "14px",
                    border: "1px solid var(--aa-border)",
                    backgroundColor: "var(--aa-surface-muted)",
                    opacity: busyId === task.id ? 0.6 : 1,
                  }}
                >
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                    <Typography
                      sx={{ color: "var(--aa-brand-text)", fontSize: 12, fontWeight: 700 }}
                    >
                      {task.source_label}
                    </Typography>

                    <Chip
                      size="small"
                      label={task.source_type === "batch" ? "Partiya" : "Zakaz"}
                      sx={{
                        height: 20,
                        fontSize: 9.5,
                        fontWeight: 700,
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

                    {task.priority === "urgent" && (
                      <Chip
                        size="small"
                        label="Shoshilinch"
                        sx={{
                          height: 20,
                          fontSize: 9.5,
                          fontWeight: 700,
                          color: "#7a1826",
                          bgcolor: "#faf5ef",
                        }}
                      />
                    )}
                  </Box>

                  <Typography
                    sx={{ mt: 0.4, color: "var(--aa-text)", fontSize: 14, fontWeight: 600 }}
                  >
                    {task.product_name} · {task.available_quantity} {task.product_unit || "ta"} ·{" "}
                    {task.department_name}
                  </Typography>

                  <Box
                    sx={{
                      mt: 1.2,
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 120px auto" },
                      gap: 1.2,
                    }}
                  >
                    <TextField
                      select
                      size="small"
                      label="Xodim"
                      value={pick.worker_id || ""}
                      onChange={(event) =>
                        setPicks((current) => ({
                          ...current,
                          [task.id]: { ...pick, worker_id: event.target.value },
                        }))
                      }
                    >
                      {workers.length ? (
                        workers.map((worker) => (
                          <MenuItem key={worker.id} value={worker.id}>
                            {worker.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value="">
                          Bu bo‘limda xodim yo‘q
                        </MenuItem>
                      )}
                    </TextField>

                    <TextField
                      size="small"
                      type="number"
                      label="Miqdor"
                      value={pick.quantity ?? task.available_quantity}
                      onChange={(event) =>
                        setPicks((current) => ({
                          ...current,
                          [task.id]: { ...pick, quantity: event.target.value },
                        }))
                      }
                      inputProps={{ min: 0.01, max: task.available_quantity, step: 0.01 }}
                    />

                    <Button
                      disabled={busyId === task.id}
                      onClick={() => assign(task)}
                      sx={assignSx}
                    >
                      Biriktirish
                    </Button>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Card>
      )}

      {loading ? (
        <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
          <CircularProgress size={30} sx={{ color: "var(--aa-brand-800)" }} />
        </Box>
      ) : tab === "assign" ? (
        queue.tasks.length ? null : (
          <Card sx={{ py: 6, textAlign: "center" }}>
            <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 13 }}>
              Tarqatilmagan ish yo‘q — hammasi xodimlarga biriktirilgan.
            </Typography>
          </Card>
        )
      ) : !tasks.length ? (
        <Card sx={{ py: 6, textAlign: "center" }}>
          <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 13 }}>
            Tasdiq kutayotgan ish yo‘q.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {tasks.map((task) => (
            <Card key={task.id} sx={{ p: { xs: 2, md: 2.6 }, opacity: busyId === task.id ? 0.6 : 1 }}>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.2,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Typography
                      sx={{ color: "var(--aa-brand-text)", fontSize: 12, fontWeight: 700 }}
                    >
                      {task.source_label}
                    </Typography>

                    <Chip
                      size="small"
                      label={task.source_type === "batch" ? "Partiya" : "Zakaz"}
                      sx={{
                        height: 20,
                        fontSize: 9.5,
                        fontWeight: 700,
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

                  <Typography
                    sx={{ mt: 0.3, color: "var(--aa-text)", fontFamily: "var(--aa-display)", fontSize: 18 }}
                  >
                    {task.product_name}
                  </Typography>

                  <Typography sx={{ mt: 0.3, color: "var(--aa-text-secondary)", fontSize: 12.5 }}>
                    {task.worker_name} · {task.department_name}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    sx={{ color: "var(--aa-text)", fontFamily: "var(--aa-display)", fontSize: 22 }}
                  >
                    {task.submitted_quantity} {task.product_unit || "ta"}
                  </Typography>

                  <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
                    rejada {task.planned_quantity}
                  </Typography>
                </Box>
              </Box>

              {task.worker_note && (
                <Typography
                  sx={{
                    mt: 1.4,
                    p: 1.2,
                    borderRadius: 2,
                    fontSize: 12,
                    color: "var(--aa-text-secondary)",
                    bgcolor: "var(--aa-surface-muted)",
                  }}
                >
                  Ishchi izohi: {task.worker_note}
                </Typography>
              )}

              <Box
                sx={{
                  mt: 1.6,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                  gap: 1.2,
                }}
              >
                <Button disabled={busyId === task.id} onClick={() => approve(task)} sx={approveSx}>
                  Tasdiqlash
                </Button>

                <TextField
                  size="small"
                  label="Qaytarish sababi"
                  value={reasons[task.id] || ""}
                  onChange={(event) =>
                    setReasons((current) => ({ ...current, [task.id]: event.target.value }))
                  }
                  sx={{ minWidth: 200, flex: 1 }}
                />

                <Button disabled={busyId === task.id} onClick={() => reject(task)} sx={rejectSx}>
                  Qaytarish
                </Button>
              </Box>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

const assignSx = {
  minHeight: 40,
  px: 2.2,
  borderRadius: "12px",
  color: "#ffffff !important",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "none",
  backgroundColor: "var(--aa-brand-800)",
  "&:hover": { backgroundColor: "var(--aa-brand-600)" },
};

const approveSx = {
  minHeight: 42,
  px: 2.4,
  borderRadius: "12px",
  color: "#ffffff !important",
  fontSize: 12.5,
  fontWeight: 600,
  textTransform: "none",
  backgroundColor: "#2f6b45",
  "&:hover": { backgroundColor: "#255738" },
};

const rejectSx = {
  minHeight: 42,
  px: 2.2,
  borderRadius: "12px",
  border: "1px solid var(--aa-border-strong)",
  color: "var(--aa-danger)",
  fontSize: 12.5,
  fontWeight: 600,
  textTransform: "none",
};

export default TaskApprovals;
