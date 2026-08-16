import { useState } from "react";
import { Box, Button, Chip, MenuItem, Stack, Typography } from "@mui/material";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";

/**
 * Zakaz qatorining bo'lim-bo'lim xomashyosi.
 *
 * Mahsulot tanlanganda retsept yuklanadi va bo'limlar shu bo'yicha
 * oldindan to'ldiriladi. Zakaz oluvchi noldan yozmaydi — faqat farq
 * qiladiganini almashtiradi: retsept "qora flutr" deb tursa, bu zakaz
 * uchun "qora zamsh" ga o'giradi.
 *
 * Bir bo'limda bir nechta xomashyo bo'lishi oddiy hol: kroy ham teri,
 * ham podkladka sarflaydi. Shuning uchun bo'lim boshiga bitta emas,
 * kerakligicha qator bo'ladi.
 */
const OrderItemMaterials = ({ departments, materials, value = [], onChange, disabled }) => {
  const [open, setOpen] = useState(true);

  const rowsOf = (departmentId) =>
    value
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => Number(row.department_id) === Number(departmentId));

  const patch = (index, changes) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...changes } : row)));

  const removeAt = (index) => onChange(value.filter((_, i) => i !== index));

  const addRow = (departmentId) =>
    onChange([
      ...value,
      { department_id: Number(departmentId), raw_material_id: "", quantity_per_pair: "", note: "" },
    ]);

  const filled = value.filter((row) => row.raw_material_id).length;

  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        border: "1px solid var(--aa-border)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 1.5, py: 1, cursor: "pointer", bgcolor: "var(--aa-surface-muted)" }}
        onClick={() => setOpen((current) => !current)}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
          Bo'limlar uchun xomashyo
        </Typography>
        {filled > 0 && (
          <Chip
            size="small"
            label={`${filled} ta belgilangan`}
            sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
          />
        )}
        <Box component="span" sx={{ fontSize: 12, transform: open ? "rotate(180deg)" : "none" }}>
          ▾
        </Box>
      </Stack>

      {open && (
        <Box sx={{ p: 1.5, display: "grid", gap: 1.5 }}>
          <Typography sx={{ fontSize: 12, color: "var(--aa-text-tertiary)" }}>
            Mahsulot retsepti bo'yicha to'ldirilgan. Bu zakaz uchun boshqacha bo'lsa —
            almashtiring.
          </Typography>

          {departments.map((department) => {
            const rows = rowsOf(department.id);
            return (
              <Box key={department.id} sx={{ display: "grid", gap: 0.75 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, minWidth: 110 }}>
                    {department.name}
                  </Typography>
                  {rows.length === 0 && (
                    <Typography sx={{ fontSize: 12, color: "var(--aa-text-tertiary)", flex: 1 }}>
                      retsept bo'yicha ishlaydi
                    </Typography>
                  )}
                  <Button
                    size="small"
                    disabled={disabled}
                    onClick={() => addRow(department.id)}
                    sx={{ textTransform: "none", fontSize: 12, minWidth: 0 }}
                  >
                    + xomashyo
                  </Button>
                </Stack>

                {rows.map(({ row, index }) => (
                  <Box
                    key={index}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 100px 1fr auto" },
                      gap: 1,
                      alignItems: "center",
                      pl: { md: 2 },
                    }}
                  >
                    <TextField
                      select
                      size="small"
                      label="Xomashyo"
                      disabled={disabled}
                      value={row.raw_material_id || ""}
                      onChange={(event) =>
                        patch(index, { raw_material_id: event.target.value })
                      }
                    >
                      {materials.map((material) => (
                        <MenuItem key={material.id} value={material.id}>
                          {material.name}
                          {material.unit ? ` · ${material.unit}` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      type="number"
                      label="1 juftga"
                      disabled={disabled}
                      value={row.quantity_per_pair ?? ""}
                      onChange={(event) =>
                        patch(index, { quantity_per_pair: event.target.value })
                      }
                      inputProps={{ min: 0.001, step: 0.001 }}
                    />
                    <TextField
                      size="small"
                      label="Izoh"
                      placeholder="masalan: 055 o'lcham"
                      disabled={disabled}
                      value={row.note || ""}
                      onChange={(event) => patch(index, { note: event.target.value })}
                      inputProps={{ maxLength: 200 }}
                    />
                    <Button
                      size="small"
                      disabled={disabled}
                      onClick={() => removeAt(index)}
                      sx={{ minWidth: 32, color: "var(--aa-danger)" }}
                    >
                      ×
                    </Button>
                  </Box>
                ))}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default OrderItemMaterials;
