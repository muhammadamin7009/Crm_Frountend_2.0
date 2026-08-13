import { Box, Button, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

import PremiumDialog from "../../Components/UI/PremiumDialog";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import { formatSize, printBatchLabels } from "./printLabels";

/**
 * Yorliq chop etish.
 *
 * Karobkadagi par soni partiyada saqlanmaydi: bitta partiyaning karobkalari
 * har xil to'ldirilishi mumkin (5 par, 3 par). Shuning uchun u chop etish
 * paytida so'raladi.
 */

const previewRows = (batch) =>
  [
    ["Nomi", batch.product_name],
    ["Model", batch.product_model],
    ["Rangi", batch.product_color],
    ["Material", batch.material_name],
    ["Padoj", batch.sole_name],
    ["O‘lcham", formatSize(batch)],
    ["Zakaz", batch.order_number],
  ].filter(([, value]) => value);

const BatchLabelDialog = ({ open, batch, onClose }) => {
  const [pairsPerBox, setPairsPerBox] = useState("");
  const [copies, setCopies] = useState("1");

  // Miqdor va karobka sig'imi ma'lum bo'lsa, nechta yorliq kerakligi o'zi chiqadi.
  const suggestedCopies = useMemo(() => {
    const perBox = Number(pairsPerBox);
    const quantity = Number(batch?.quantity || 0);
    if (!perBox || perBox <= 0 || quantity <= 0) return null;
    return Math.ceil(quantity / perBox);
  }, [batch?.quantity, pairsPerBox]);

  if (!batch) return null;

  const handlePrint = () => {
    const opened = printBatchLabels(batch, { copies, pairsPerBox: pairsPerBox.trim() });

    if (!opened) {
      toast.error("Brauzer yangi oynani bloklab qo'ydi. Ruxsat bering va qaytadan urinib ko'ring.");
      return;
    }

    onClose();
  };

  return (
    <PremiumDialog
      open={open}
      onClose={onClose}
      title="Yorliq chop etish"
      subtitle="Karobkaga yopishtiriladigan qog'oz yorliq"
      actions={
        <>
          <Button onClick={onClose} sx={cancelSx}>
            Bekor qilish
          </Button>

          <Button variant="contained" onClick={handlePrint} sx={primarySx}>
            Chop etish
          </Button>
        </>
      }
    >
      <Stack spacing={2.2}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" },
            gap: 1.6,
          }}
        >
          <TextField
            type="number"
            label="Karobkadagi par soni"
            value={pairsPerBox}
            onChange={(event) => setPairsPerBox(event.target.value)}
            helperText={
              suggestedCopies ? `${batch.quantity} par uchun ${suggestedCopies} ta karobka` : " "
            }
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />

          <TextField
            type="number"
            label="Nechta yorliq"
            value={copies}
            onChange={(event) => setCopies(event.target.value)}
            helperText={
              suggestedCopies && Number(copies) !== suggestedCopies ? (
                <Box
                  component="span"
                  onClick={() => setCopies(String(suggestedCopies))}
                  sx={{ cursor: "pointer", fontWeight: 900, color: "var(--aa-brand-text)" }}
                >
                  {suggestedCopies} ta qilib qo‘yish
                </Box>
              ) : (
                " "
              )
            }
            slotProps={{ htmlInput: { min: 1, max: 200, step: 1 } }}
          />
        </Box>

        <Box>
          <Typography
            sx={{
              mb: 1,
              color: "var(--aa-text-tertiary)",
              fontSize: 9.5,
              fontWeight: 900,
              letterSpacing: ".05em",
              textTransform: "uppercase",
            }}
          >
            Ko‘rinishi
          </Typography>

          <Box
            sx={{
              maxWidth: 340,
              p: 1.8,
              borderRadius: "10px",
              border: "1.5px solid var(--aa-text)",
              backgroundColor: "var(--aa-surface-solid)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 1.5,
                pb: 0.8,
                borderBottom: "1.5px solid var(--aa-text)",
              }}
            >
              <Typography
                sx={{
                  color: "var(--aa-text)",
                  fontSize: 15,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                {batch.product_model || batch.product_name}
              </Typography>

              <Typography
                sx={{
                  color: "var(--aa-text)",
                  fontSize: 13,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                {formatSize(batch)}
              </Typography>
            </Box>

            <Box sx={{ py: 1, display: "grid", gap: 0.35 }}>
              {previewRows(batch).map(([key, value]) => (
                <Box key={key} sx={{ display: "flex", gap: 1.2 }}>
                  <Typography
                    sx={{
                      minWidth: 66,
                      color: "var(--aa-text-tertiary)",
                      fontSize: 9.5,
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {key}
                  </Typography>

                  <Typography sx={{ color: "var(--aa-text)", fontSize: 11, fontWeight: 800 }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                pt: 0.8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1.5px solid var(--aa-text)",
              }}
            >
              <Typography
                sx={{
                  color: "var(--aa-text)",
                  fontSize: 16,
                  fontWeight: 900,
                  letterSpacing: ".07em",
                }}
              >
                {batch.batch_number}
              </Typography>

              {pairsPerBox.trim() && (
                <Typography sx={{ color: "var(--aa-text)", fontSize: 12, fontWeight: 800 }}>
                  {pairsPerBox.trim()} par
                </Typography>
              )}
            </Box>
          </Box>

          <Typography sx={{ mt: 1.2, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
            A4 varaqqa ikki ustundan chiqadi. Keyinchalik shu raqam QR kod ichiga tushadi.
          </Typography>
        </Box>
      </Stack>
    </PremiumDialog>
  );
};

const cancelSx = {
  minHeight: 42,
  px: 2.2,
  color: "var(--aa-text-secondary)",
  borderRadius: "12px",
  fontSize: 11.5,
  fontWeight: 850,
  textTransform: "none",
};

const primarySx = {
  minHeight: 42,
  px: 2.6,
  color: "#ffffff !important",
  borderRadius: "12px",
  fontSize: 11.5,
  fontWeight: 900,
  textTransform: "none",
  background: "linear-gradient(135deg,#991b1b,#dc2626)",
  boxShadow: "0 12px 26px rgba(127,29,29,.28)",
  "&:hover": { background: "linear-gradient(135deg,#7f1d1d,#b91c1c)" },
};

export default BatchLabelDialog;
