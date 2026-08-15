import { useState } from "react";
import { Box, Button, Chip, MenuItem, Stack, Typography } from "@mui/material";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";

/**
 * Zakaz qatorining bo'lim-bo'lim xomashyosi.
 *
 * Retsept mahsulotning umumiy tarkibini biladi ("Loro Piano teri
 * sarflaydi"), lekin bu zakaz qora zamshdanmi yoki qora flutrdanmi —
 * buni faqat zakaz oluvchi biladi. Ilgari bu og'zaki uzatilardi va
 * kroychi adashib flutr kesib qo'yardi.
 *
 * Har bo'lim uchun bittadan qator: bo'lim → xomashyo → me'yor → izoh.
 * Bo'sh qoldirilgan bo'lim retseptdagicha ishlaydi.
 */
const OrderItemMaterials = ({ departments, materials, value = [], onChange, disabled }) => {
  const [open, setOpen] = useState(value.length > 0);

  const byDepartment = new Map(value.map((row) => [Number(row.department_id), row]));

  const setFor = (departmentId, patch) => {
    const current = byDepartment.get(Number(departmentId)) || { department_id: Number(departmentId) };
    const next = { ...current, ...patch };

    // Xomashyo tanlanmagan bo'lsa qator umuman yozilmaydi.
    const cleaned = value.filter((row) => Number(row.department_id) !== Number(departmentId));
    if (next.raw_material_id) cleaned.push(next);
    onChange(cleaned);
  };

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
        <Box sx={{ p: 1.5, display: "grid", gap: 1 }}>
          <Typography sx={{ fontSize: 12, color: "var(--aa-text-tertiary)" }}>
            Belgilanmagan bo'lim mahsulot retsepti bo'yicha ishlaydi.
          </Typography>

          {departments.map((department) => {
            const row = byDepartment.get(Number(department.id)) || {};
            return (
              <Box
                key={department.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "120px 1fr 90px 1fr auto" },
                  gap: 1,
                  alignItems: "center",
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{department.name}</Typography>
                <TextField
                  select
                  size="small"
                  label="Xomashyo"
                  disabled={disabled}
                  value={row.raw_material_id || ""}
                  onChange={(event) =>
                    setFor(department.id, { raw_material_id: event.target.value || null })
                  }
                >
                  <MenuItem value="">— belgilanmagan —</MenuItem>
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
                  disabled={disabled || !row.raw_material_id}
                  value={row.quantity_per_pair ?? ""}
                  onChange={(event) =>
                    setFor(department.id, { quantity_per_pair: event.target.value })
                  }
                  inputProps={{ min: 0.001, step: 0.001 }}
                />
                <TextField
                  size="small"
                  label="Izoh"
                  placeholder="masalan: 055 o'lcham"
                  disabled={disabled || !row.raw_material_id}
                  value={row.note || ""}
                  onChange={(event) => setFor(department.id, { note: event.target.value })}
                  inputProps={{ maxLength: 200 }}
                />
                <Button
                  size="small"
                  disabled={disabled || !row.raw_material_id}
                  onClick={() => setFor(department.id, { raw_material_id: null })}
                  sx={{ minWidth: 32, color: "var(--aa-danger)" }}
                >
                  ×
                </Button>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default OrderItemMaterials;
