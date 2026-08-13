import { Box, Chip, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { getProductionBatch } from "../../api/productionBatches";
import { getWorkerOutputs } from "../../api/workerOutputs";
import { formatSize } from "./printLabels";

/**
 * Partiya kartasi — yopiq karobkani ochmasdan ichida nima borligini ko'rsatadi.
 *
 * Material va padoj qo'lda kiritilmaydi: ularni server ish yozuvlaridagi
 * haqiqiy sarfdan aniqlaydi. Shuning uchun hali hech kim ishlamagan partiyada
 * ular bo'sh turadi — bu xato emas, shunchaki sarf yo'q degani.
 */

const formatMoney = (value) =>
  `${new Intl.NumberFormat("uz-UZ").format(Math.round(Number(value || 0)))} so'm`;

const formatNumber = (value) => new Intl.NumberFormat("uz-UZ").format(Number(value || 0));

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(value))
    : "-";

const Field = ({ label, value, strong }) => (
  <Box>
    <Typography
      sx={{
        color: "var(--aa-text-tertiary)",
        fontSize: 9.5,
        fontWeight: 900,
        letterSpacing: ".05em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        mt: 0.3,
        color: value ? "var(--aa-text)" : "var(--aa-text-tertiary)",
        fontSize: strong ? 14 : 12.5,
        fontWeight: strong ? 950 : 800,
      }}
    >
      {value || "—"}
    </Typography>
  </Box>
);

const Section = ({ title, hint, children }) => (
  <Box>
    <Typography sx={{ color: "var(--aa-text)", fontSize: 12.5, fontWeight: 950 }}>
      {title}
    </Typography>

    {hint && (
      <Typography sx={{ mt: 0.3, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
        {hint}
      </Typography>
    )}

    <Box sx={{ mt: 1.4 }}>{children}</Box>
  </Box>
);

const BatchDetail = ({ batchId, canSeeOutputs, onLoaded }) => {
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(null);
  const [outputs, setOutputs] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const { data } = await getProductionBatch(batchId);
        if (cancelled) return;

        setBatch(data.production_batch);
        onLoaded?.(data.production_batch);
      } catch {
        if (!cancelled) setBatch(null);
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Ish yozuvlari alohida: ombor xodimida `production.view` bo'lmasligi mumkin,
      // lekin partiyani ko'rish huquqi bor. Bo'lim yuklanmasa karta baribir ochiladi.
      if (!canSeeOutputs) return;

      try {
        const { data } = await getWorkerOutputs({ batch_id: batchId, limit: 100 });
        if (!cancelled) setOutputs(data.worker_outputs || []);
      } catch {
        if (!cancelled) setOutputs([]);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [batchId, canSeeOutputs, onLoaded]);

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 220 }}>
        <CircularProgress size={28} sx={{ color: "#991b1b" }} />
      </Box>
    );
  }

  if (!batch) {
    return (
      <Typography sx={{ py: 5, textAlign: "center", color: "var(--aa-text-tertiary)" }}>
        Partiya ma'lumotini olishda xato.
      </Typography>
    );
  }

  const isCompleted = batch.status === "completed";

  return (
    <Stack spacing={2.4}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          flexWrap: "wrap",
          borderRadius: "16px",
          border: "1px solid var(--aa-border)",
          backgroundColor: "var(--aa-surface-muted)",
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "var(--aa-text)",
              fontSize: 24,
              fontWeight: 950,
              letterSpacing: ".05em",
            }}
          >
            {batch.batch_number}
          </Typography>

          <Typography sx={{ mt: 0.3, color: "var(--aa-text-secondary)", fontSize: 12 }}>
            {batch.product_name}
            {batch.product_color ? ` · ${batch.product_color}` : ""}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            label={`${formatNumber(batch.quantity)} par`}
            sx={{ height: 26, fontSize: 10.5, fontWeight: 900 }}
          />

          <Chip
            size="small"
            label={isCompleted ? "Yopilgan" : "Jarayonda"}
            sx={{
              height: 26,
              fontSize: 10.5,
              fontWeight: 900,
              color: isCompleted ? "#065f46" : "#92400e",
              backgroundColor: isCompleted ? "rgba(5,150,105,.12)" : "rgba(217,119,6,.12)",
            }}
          />
        </Stack>
      </Box>

      <Section
        title="Yorliqdagi ma'lumot"
        hint="Material va padojni tizim ish yozuvlaridagi haqiqiy sarfdan aniqlaydi."
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", sm: "repeat(3,minmax(0,1fr))" },
            gap: 1.8,
          }}
        >
          <Field label="Model" value={batch.product_model} />
          <Field label="Rangi" value={batch.product_color} />
          <Field label="O‘lcham" value={formatSize(batch)} />
          <Field label="Material (kroy)" value={batch.material_name} strong />
          <Field label="Padoj (kosib)" value={batch.sole_name} strong />
          <Field label="Zakaz" value={batch.order_number} />
        </Box>
      </Section>

      <Divider />

      <Section title="Sarflangan xomashyo" hint="Bosqichma-bosqich, haqiqiy sarf bo'yicha.">
        {batch.stages?.length ? (
          <Stack spacing={0.8}>
            {batch.stages.map((stage) => (
              <Box
                key={`${stage.department_name}:${stage.material_name}`}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr auto", sm: "150px 1fr auto auto" },
                  alignItems: "center",
                  gap: 1.4,
                  p: 1.2,
                  borderRadius: "12px",
                  border: "1px solid var(--aa-border)",
                  backgroundColor: "var(--aa-surface-solid)",
                }}
              >
                <Typography
                  noWrap
                  sx={{ color: "var(--aa-text-secondary)", fontSize: 11, fontWeight: 900 }}
                >
                  {stage.department_name}
                </Typography>

                <Typography
                  noWrap
                  sx={{
                    display: { xs: "none", sm: "block" },
                    color: "var(--aa-text)",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {stage.material_name}
                </Typography>

                <Typography
                  sx={{
                    color: "var(--aa-text)",
                    fontSize: 12,
                    fontWeight: 900,
                    textAlign: "right",
                  }}
                >
                  {formatNumber(stage.quantity)} {stage.unit || ""}
                </Typography>

                <Typography
                  sx={{
                    minWidth: 96,
                    color: "var(--aa-text-secondary)",
                    fontSize: 11,
                    fontWeight: 800,
                    textAlign: "right",
                  }}
                >
                  {formatMoney(stage.total_cost)}
                </Typography>
              </Box>
            ))}

            <Box
              sx={{
                mt: 0.6,
                px: 1.2,
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 11, fontWeight: 900 }}>
                Xomashyo tannarxi
                {Number(batch.quantity) > 0 && (
                  <Typography
                    component="span"
                    sx={{
                      ml: 0.8,
                      color: "var(--aa-text-tertiary)",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    ({formatMoney(Number(batch.total_material_cost) / Number(batch.quantity))} /
                    par)
                  </Typography>
                )}
              </Typography>

              <Typography sx={{ color: "var(--aa-text)", fontSize: 15, fontWeight: 950 }}>
                {formatMoney(batch.total_material_cost)}
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 11.5, fontWeight: 700 }}>
            Bu partiyaga hali ish yozilmagan — sarf ham yo‘q.
          </Typography>
        )}
      </Section>

      {canSeeOutputs && outputs.length > 0 && (
        <>
          <Divider />

          <Section title="Ish yozuvlari" hint="Partiya ustida kim, qaysi bosqichda ishlagan.">
            <Stack spacing={0.7}>
              {outputs.map((output) => (
                <Box
                  key={output.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.4,
                    px: 1.2,
                    py: 0.9,
                    borderRadius: "11px",
                    backgroundColor: "var(--aa-surface-muted)",
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      noWrap
                      sx={{ color: "var(--aa-text)", fontSize: 12, fontWeight: 850 }}
                    >
                      {output.worker_name}
                    </Typography>

                    <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 10 }}>
                      {output.department_name} · {formatDate(output.worked_at)}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{ color: "var(--aa-text)", fontSize: 12, fontWeight: 900, flexShrink: 0 }}
                  >
                    {formatNumber(output.quantity)} par
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Section>
        </>
      )}

      {batch.note && (
        <>
          <Divider />
          <Section title="Izoh">
            <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 12 }}>
              {batch.note}
            </Typography>
          </Section>
        </>
      )}
    </Stack>
  );
};

export default BatchDetail;
