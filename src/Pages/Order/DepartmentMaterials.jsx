import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { getMyDepartmentMaterials } from "../../api/inventory";

const nice = (value) =>
  Number(value || 0).toLocaleString("uz-UZ", { maximumFractionDigits: 3 });

/**
 * Ishchi o'z bo'limining xomashyosini shu yerda ko'radi.
 *
 * Ikki ustun bor va ikkalasi ham kerak: "menda" — ishchi hoziroq
 * ishlatishi mumkin bo'lgan miqdor, "omborda" — talab qilsa yana qancha
 * olishi mumkinligi. Faqat birinchisi ko'rsatilsa ishchi mol tugadi deb
 * to'xtab qolardi, holbuki asosiy omborda turgan bo'ladi.
 */
const DepartmentMaterials = () => {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let alive = true;
    getMyDepartmentMaterials()
      .then(({ data }) => {
        if (alive) setState(data);
      })
      // Xomashyo ro'yxati vazifalar sahifasiga qo'shimcha — u yuklanmasa
      // ham ishchi ishini davom ettira olishi kerak, shuning uchun toast yo'q.
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: "1px solid var(--aa-border)",
          borderRadius: 3,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={22} />
      </Paper>
    );
  }

  if (!state?.materials?.length) return null;

  const low = state.materials.filter((m) => Number(m.in_department) <= 0).length;

  return (
    <Paper
      elevation={0}
      sx={{ border: "1px solid var(--aa-border)", borderRadius: 3, overflow: "hidden" }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ px: 2, py: 1.5, cursor: "pointer" }}
        onClick={() => setOpen((current) => !current)}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
            Bo'limim xomashyosi
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: "var(--aa-text-tertiary)" }}>
            {state.department?.name || "Bo'lim"} · {state.materials.length} ta nom
            {state.warehouse?.name ? ` · ${state.warehouse.name}` : ""}
          </Typography>
        </Box>
        {low > 0 && (
          <Chip
            size="small"
            label={`${low} ta tugagan`}
            sx={{ bgcolor: "color-mix(in srgb, var(--aa-danger) 14%, transparent)", color: "var(--aa-danger)", fontWeight: 600 }}
          />
        )}
        <IconButton size="small" aria-label={open ? "Yopish" : "Ochish"}>
          <Box
            component="span"
            sx={{
              fontSize: 13,
              lineHeight: 1,
              transition: "transform .2s",
              transform: open ? "rotate(180deg)" : "none",
            }}
          >
            ▾
          </Box>
        </IconButton>
      </Stack>

      <Collapse in={open}>
        <Box sx={{ borderTop: "1px solid var(--aa-border)" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              gap: 1.5,
              px: 2,
              py: 1,
              bgcolor: "var(--aa-surface-muted)",
              fontSize: 12,
              color: "var(--aa-text-tertiary)",
              fontWeight: 600,
            }}
          >
            <span>Xomashyo</span>
            <Tooltip title="Bo'limingizga tushirilgan, hoziroq ishlatsa bo'ladigan miqdor">
              <span>Menda</span>
            </Tooltip>
            <Tooltip title={`Asosiy omborda turgan zaxira${state.main_warehouse?.name ? ` — ${state.main_warehouse.name}` : ""}`}>
              <span>Omborda</span>
            </Tooltip>
          </Box>

          {state.materials.map((material) => {
            const mine = Number(material.in_department);
            return (
              <Box
                key={material.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto",
                  gap: 1.5,
                  alignItems: "center",
                  px: 2,
                  py: 1.1,
                  borderTop: "1px solid var(--aa-border)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600 }} noWrap>
                    {material.name}
                  </Typography>
                  {!material.from_recipe && (
                    <Typography sx={{ fontSize: 11.5, color: "var(--aa-text-tertiary)" }}>
                      Omborga biriktirilgan
                    </Typography>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    minWidth: 84,
                    textAlign: "right",
                    color: mine > 0 ? "var(--aa-text)" : "var(--aa-danger)",
                  }}
                >
                  {nice(mine)} {material.unit}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 13.5,
                    minWidth: 84,
                    textAlign: "right",
                    color: "var(--aa-text-tertiary)",
                  }}
                >
                  {nice(material.in_main)} {material.unit}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default DepartmentMaterials;
