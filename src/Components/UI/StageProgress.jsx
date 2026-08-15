import { Box, Tooltip, Typography } from "@mui/material";

/**
 * Ish qaysi bosqichda turibdi — bir qatorda.
 *
 * "Zakaz qayerda?" degan savolga javob berish uchun ilgari har bir
 * vazifani ochib ko'rish kerak edi. Endi bosqichlar yonma-yon turadi va
 * har birida qancha qilingani ko'rinadi.
 *
 * Ikki xil to'ldirish bor va ular ataylab farqlanadi:
 *   to'q  — tasdiqlangan, ya'ni omborga va oylikka tushgan
 *   yo'l-yo'l — ishchi qildim dedi, boshliq hali ko'rmagan
 *
 * Ikkalasini bir xil ko'rsatish "tayyor" degan noto'g'ri taassurot
 * berardi: tasdiqlanmagan ish hali qaytarilishi mumkin.
 */
const StageProgress = ({ stages = [], unit = "ta", compact = false }) => {
  if (!stages.length) return null;

  return (
    <Box sx={{ display: "flex", gap: 0.6, alignItems: "stretch" }}>
      {stages.map((stage) => {
        const planned = Number(stage.planned) || 0;
        const done = Number(stage.done) || 0;
        const waiting = Number(stage.waiting) || 0;
        const donePercent = planned ? Math.min(100, (done * 100) / planned) : 0;
        const waitingPercent = planned ? Math.min(100 - donePercent, (waiting * 100) / planned) : 0;
        const finished = planned > 0 && done >= planned;

        return (
          <Tooltip
            key={`${stage.stage_order}-${stage.department_id}`}
            arrow
            title={
              <Box sx={{ py: 0.3 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                  {stage.department_name}
                </Typography>
                <Typography sx={{ fontSize: 11.5 }}>
                  Tasdiqlangan: {done} / {planned} {unit}
                </Typography>
                {waiting > 0 && (
                  <Typography sx={{ fontSize: 11.5, color: "#e0c69a" }}>
                    Tasdiq kutmoqda: {waiting} {unit}
                  </Typography>
                )}
              </Box>
            }
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {(
                <Typography
                  noWrap
                  sx={{
                    mb: 0.4,
                    color: finished ? "var(--aa-success)" : "var(--aa-text-tertiary)",
                    fontSize: compact ? 9 : 9.5,
                    fontWeight: 600,
                    letterSpacing: ".02em",
                  }}
                >
                  {stage.department_name}
                </Typography>
              )}

              <Box
                sx={{
                  position: "relative",
                  height: compact ? 6 : 8,
                  borderRadius: 8,
                  overflow: "hidden",
                  backgroundColor: "var(--aa-surface-hover)",
                  border: "1px solid var(--aa-border)",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: `${donePercent}%`,
                    backgroundColor: "var(--aa-success)",
                  }}
                />

                {/* Tasdiq kutayotgani — yo'l-yo'l, "hali hisobga o'tmagan". */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${donePercent}%`,
                    width: `${waitingPercent}%`,
                    backgroundImage:
                      "repeating-linear-gradient(45deg, var(--aa-accent) 0 3px, transparent 3px 6px)",
                    backgroundColor: "var(--aa-accent-soft)",
                  }}
                />
              </Box>

            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};

/**
 * Bosqich chiziqlari va ular ostida bitta aniq qator.
 *
 * Ilgari har bosqich ostida "70 (+30) / 120" turardi va to'rt bosqichda
 * bu raqamlar joyga sig'may kesilardi. Endi raqam faqat hozir ishlanayotgan
 * bosqich uchun yoziladi — qolganini sichqoncha tekkizganda ko'rsatadi.
 */
const StageProgressWithSummary = ({ stages = [], unit = "ta" }) => {
  if (!stages.length) return null;

  // Hozirgi bosqich — tugamagan birinchisi. Hammasi tugagan bo'lsa oxirgisi.
  const current =
    stages.find((stage) => Number(stage.done) < Number(stage.planned)) || stages[stages.length - 1];
  const allDone = stages.every((stage) => Number(stage.done) >= Number(stage.planned));

  return (
    <Box>
      <StageProgress stages={stages} unit={unit} compact />

      <Typography sx={{ mt: 0.5, fontSize: 10, color: "var(--aa-text-secondary)" }}>
        {allDone ? (
          <Box component="span" sx={{ color: "var(--aa-success)", fontWeight: 700 }}>
            Barcha bosqich tugadi
          </Box>
        ) : (
          <>
            <Box component="span" sx={{ color: "var(--aa-text)", fontWeight: 700 }}>
              {current.department_name}
            </Box>
            {" — "}
            {current.done} / {current.planned} {unit}
            {current.waiting > 0 && (
              <Box component="span" sx={{ color: "var(--aa-accent-strong)", fontWeight: 600 }}>
                {" "}
                (+{current.waiting} tasdiqda)
              </Box>
            )}
          </>
        )}
      </Typography>
    </Box>
  );
};

export { StageProgressWithSummary };

export default StageProgress;
