import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Box, Button, CircularProgress, IconButton, MenuItem, Typography } from "@mui/material";

import PremiumDialog from "../../Components/UI/PremiumDialog";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import { getOrderTaskMaterials } from "../../api/orders";

/**
 * Ishni tugatishdan oldingi tasdiq.
 *
 * Ilgari "Tugatish" bosilishi bilan vazifa yopilardi va hech kim nima
 * sarflanganini so'ramasdi. Ikki narsa yo'qolardi:
 *
 * 1. Xomashyoning O'ZI. Zakaz "qora flutr" deb tushib, keyin "qora zamsh"
 *    ga o'zgargan bo'lishi mumkin. Ishchi qo'lidagi narsani yozishi kerak,
 *    retseptda nima turganini emas — chunki partiyaning materiali aynan
 *    shu sarfdan aniqlanadi va yorliqqa shu chiqadi.
 *
 * 2. MIQDOR. Retsept — reja, haqiqiy sarf undan farq qiladi. Farqni
 *    ko'rmasa, ombor qoldig'i sekin-asta haqiqatdan uzoqlashadi.
 */

const emptyRow = () => ({ raw_material_id: "", quantity: "", expected_quantity: null });

const TaskFinishDialog = ({ open, task, onClose, onConfirm, saving }) => {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [quantity, setQuantity] = useState(0);

  const load = useCallback(async () => {
    if (!task) return;

    setLoading(true);

    try {
      const { data } = await getOrderTaskMaterials(task.id);
      setInfo(data);

      // Bu tugatishda qancha qo'shilyapti — sarf shunga hisoblanadi.
      const added = Math.max(
        0,
        Number(task.completed_quantity || 0) - Number(data.task?.completed_quantity || 0),
      );
      const chargeable = added > 0 ? added : Number(data.task?.planned_quantity || 0);
      setQuantity(chargeable);

      setRows(
        (data.stage_materials || []).map((material) => {
          const expected = Number((material.quantity_per_pair * chargeable).toFixed(3));
          return {
            raw_material_id: material.raw_material_id,
            quantity: String(expected),
            expected_quantity: expected,
          };
        }),
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Xomashyo ro‘yxatini olib bo‘lmadi.");
      setInfo(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [task]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const setRow = (index, key, value) =>
    setRows((previous) =>
      previous.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    );

  const materials = info?.available_materials || [];
  const unitOf = (id) => materials.find((m) => Number(m.id) === Number(id))?.unit || "";

  const confirm = () => {
    const filled = rows.filter((row) => row.raw_material_id !== "");

    const duplicated = filled.some(
      (row, index) =>
        filled.findIndex((other) => Number(other.raw_material_id) === Number(row.raw_material_id)) !==
        index,
    );
    if (duplicated) {
      toast.warning("Bir xomashyo ikki marta yozilgan. Qatorlarni birlashtiring.");
      return;
    }

    if (filled.some((row) => row.quantity === "" || Number(row.quantity) < 0)) {
      toast.warning("Sarflangan miqdorni to‘g‘ri kiriting.");
      return;
    }

    onConfirm(
      filled.map((row) => ({
        raw_material_id: Number(row.raw_material_id),
        quantity: Number(row.quantity),
        expected_quantity: row.expected_quantity,
      })),
    );
  };

  return (
    <PremiumDialog
      open={open}
      onClose={saving ? undefined : onClose}
      title="Ishni tugatish"
      subtitle={
        info?.task
          ? `${info.task.product_name} · ${info.task.department_name}`
          : "Sarflangan xomashyoni tasdiqlang"
      }
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose} disabled={saving} sx={ghostSx}>
            Bekor qilish
          </Button>

          <Button onClick={confirm} disabled={saving || loading} sx={primarySx}>
            {saving ? "Saqlanmoqda..." : "Tasdiqlash va tugatish"}
          </Button>
        </>
      }
    >
      {loading ? (
        <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
          <CircularProgress size={26} sx={{ color: "var(--aa-brand-800)" }} />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 1.6 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: "13px",
              border: "1px solid var(--aa-border)",
              backgroundColor: "var(--aa-surface-muted)",
            }}
          >
            <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 12.5 }}>
              Yakunlanayotgan miqdor:{" "}
              <b style={{ color: "var(--aa-text)" }}>
                {quantity} {info?.task?.product_unit || "ta"}
              </b>
            </Typography>
          </Box>

          <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 12, lineHeight: 1.65 }}>
            Miqdorlar retsept bo‘yicha to‘ldirilgan. Boshqa xomashyo ishlatgan bo‘lsangiz —
            nomini almashtiring, ko‘p yoki kam ketgan bo‘lsa — sonini to‘g‘irlang.
          </Typography>

          {rows.map((row, index) => (
            <Box
              key={index}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 130px 40px" },
                alignItems: "start",
                gap: 1.2,
              }}
            >
              <TextField
                select
                size="small"
                label="Xomashyo"
                value={row.raw_material_id}
                onChange={(event) => setRow(index, "raw_material_id", event.target.value)}
                fullWidth
              >
                {materials.map((material) => (
                  <MenuItem key={material.id} value={material.id} sx={{ fontSize: 13 }}>
                    {material.name} ({material.unit})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                type="number"
                label={`Sarf${unitOf(row.raw_material_id) ? `, ${unitOf(row.raw_material_id)}` : ""}`}
                value={row.quantity}
                onChange={(event) => setRow(index, "quantity", event.target.value)}
                inputProps={{ min: 0, step: 0.001 }}
                helperText={
                  row.expected_quantity !== null && Number(row.quantity) !== row.expected_quantity
                    ? `Reja: ${row.expected_quantity}`
                    : " "
                }
              />

              <IconButton
                aria-label="Qatorni olib tashlash"
                onClick={() => setRows((previous) => previous.filter((_, i) => i !== index))}
                sx={{ mt: 0.4, color: "var(--aa-danger)" }}
              >
                ×
              </IconButton>
            </Box>
          ))}

          <Button
            onClick={() => setRows((previous) => [...previous, emptyRow()])}
            sx={addRowSx}
          >
            + Yana xomashyo
          </Button>

          {!rows.length && (
            <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 11.5, lineHeight: 1.6 }}>
              Bu bosqichga retseptda xomashyo biriktirilmagan. Nimadir sarflangan bo‘lsa
              qo‘shing, bo‘lmasa shundayligicha tasdiqlang.
            </Typography>
          )}
        </Box>
      )}
    </PremiumDialog>
  );
};

const primarySx = {
  minHeight: 44,
  px: 2.6,
  borderRadius: "12px",
  color: "#ffffff !important",
  fontSize: 12.5,
  fontWeight: 600,
  textTransform: "none",
  // Aniq to'q yashil, token emas: qorong'i mavzuda `--aa-success` och
  // yashilga aylanadi va ustidagi oq matn o'qilmay qoladi.
  backgroundColor: "#2f6b45",
  "&:hover": { backgroundColor: "#255738" },
  "&.Mui-disabled": { color: "rgba(255,255,255,.6) !important", opacity: 0.45 },
};

const ghostSx = {
  minHeight: 44,
  px: 2.2,
  borderRadius: "12px",
  color: "var(--aa-text-secondary)",
  fontSize: 12.5,
  fontWeight: 600,
  textTransform: "none",
};

const addRowSx = {
  width: "100%",
  minHeight: 44,
  borderRadius: "13px",
  border: "1px dashed var(--aa-accent)",
  backgroundColor: "var(--aa-accent-soft)",
  color: "var(--aa-accent-strong) !important",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "none",
};

export default TaskFinishDialog;
