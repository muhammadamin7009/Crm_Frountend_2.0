import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";

import PremiumDialog from "../../Components/UI/PremiumDialog";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import { getPlatformSettings, testPlatformTelegram, updatePlatformSettings } from "../../api/platform";

/**
 * Platforma sozlamalari — hozircha Telegram.
 *
 * Bot tokeni oldin faqat serverdagi `.env` faylida edi: uni almashtirish
 * uchun SSH, fayl tahriri va xizmatni qayta ishga tushirish kerak bo'lardi.
 * Bot bloklansa yoki guruh o'zgarsa arizalar jimgina kelmay qolardi va
 * buni bilishning yagona yo'li — kutish edi.
 *
 * Shuning uchun bu yerda ikki narsa bor: qiymatni almashtirish va sinov
 * xabari. Sinovsiz sozlamaning to'g'riligini haqiqiy ariza kelgunicha
 * tekshirib bo'lmasdi.
 */
const PlatformSettings = ({ open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [state, setState] = useState(null);
  const [token, setToken] = useState("");
  const [chatId, setChatId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getPlatformSettings();
      setState(response.data);
      setChatId(response.data?.telegram?.chat_id || "");
      setToken("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Sozlamani olishda xato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const save = async () => {
    setSaving(true);

    try {
      // Token bo'sh bo'lsa yuborilmaydi — bu "eskisi qolsin" degani.
      const telegram = { chat_id: chatId.trim() };
      if (token.trim()) telegram.bot_token = token.trim();

      const response = await updatePlatformSettings({ telegram });
      setState(response.data);
      setToken("");
      toast.success("Saqlandi");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);

    try {
      const response = await testPlatformTelegram();

      if (response.data?.sent) toast.success(response.data.message);
      else toast.warning(response.data?.message || "Xabar yuborilmadi.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Sinovda xato.");
    } finally {
      setTesting(false);
    }
  };

  const telegram = state?.telegram;

  return (
    <PremiumDialog
      open={open}
      onClose={saving || testing ? undefined : onClose}
      title="Platforma sozlamalari"
      subtitle="Landing arizasi haqidagi Telegram xabari"
      maxWidth="sm"
      titleClassName="platform-dashboard-dialog-title"
      contentSx={{ py: "24px !important" }}
      actions={
        <>
          <Button
            onClick={onClose}
            disabled={saving || testing}
            sx={{
              color: "var(--aa-text-secondary)",
              borderRadius: "11px",
              fontWeight: 600,
              textTransform: "none",
            }}
          >
            Yopish
          </Button>

          <Button
            onClick={save}
            disabled={loading || saving || testing}
            sx={{
              minWidth: 120,
              minHeight: 40,
              px: 2,
              color: "#ffffff",
              borderRadius: "11px",
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: "none",
              background: "linear-gradient(135deg,#4d0f18,#7a1826)",
              boxShadow: "0 10px 24px rgba(77, 15, 24,.18)",
              "&:hover": { background: "linear-gradient(135deg,#4d0f18,#6e1622)" },
            }}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </>
      }
    >
      {loading ? (
        <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
          <CircularProgress size={26} sx={{ color: "#7a1826" }} />
        </Box>
      ) : (
        <Stack spacing={1.8}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={telegram?.configured ? "Sozlangan" : "Sozlanmagan"}
              sx={{
                height: 22,
                fontSize: 9.5,
                fontWeight: 700,
                color: telegram?.configured ? "#2f6b45" : "#8c1d2b",
                bgcolor: telegram?.configured ? "rgba(47, 107, 69,.10)" : "rgba(140, 29, 43,.10)",
              }}
            />

            {telegram?.source === "env" && (
              <Typography sx={{ color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
                Hozir server faylidan olinyapti — bu yerga yozsangiz undan ustun turadi.
              </Typography>
            )}
          </Box>

          <TextField
            size="small"
            label="Bot tokeni"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder={telegram?.bot_token_masked || "BotFather bergan token"}
            helperText={
              telegram?.bot_token_masked
                ? `Hozirgi: ${telegram.bot_token_masked} · almashtirmoqchi bo'lsangizgina yozing`
                : "@BotFather dan olinadi"
            }
            slotProps={{ htmlInput: { autoComplete: "off", spellCheck: false } }}
          />

          <TextField
            size="small"
            label="Chat ID"
            value={chatId}
            onChange={(event) => setChatId(event.target.value)}
            helperText="Guruh ID si manfiy bo'ladi, masalan -1001234567890"
            slotProps={{ htmlInput: { autoComplete: "off", spellCheck: false } }}
          />

          <Box>
            <Button
              onClick={test}
              disabled={saving || testing}
              sx={{
                minHeight: 38,
                px: 2,
                borderRadius: "11px",
                border: "1px solid var(--aa-border-strong)",
                color: "var(--aa-text)",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              {testing ? "Yuborilmoqda..." : "Sinov xabarini yuborish"}
            </Button>

            <Typography sx={{ mt: 0.6, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
              Avval saqlang — sinov saqlangan qiymat bilan yuboriladi.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ borderRadius: "14px", fontSize: 11 }}>
            Xabar yuborilmasa ariza baribir bazaga yoziladi va Lidlar ro‘yxatida ko‘rinadi —
            Telegram faqat ogohlantirish uchun.
          </Alert>
        </Stack>
      )}
    </PremiumDialog>
  );
};

export default PlatformSettings;
