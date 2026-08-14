import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";

import PremiumDialog from "../../Components/UI/PremiumDialog";
import PhoneTextField, { formatPhoneInput } from "../../Components/UI/PhoneTextField";
import { submitAuditLead } from "../../api/platform";

/**
 * "Bepul jarayon auditi" arizasi.
 *
 * ERPda "ro'yxatdan o'ting va o'zingiz sinab ko'ring" ishlamaydi: korxona
 * egasi bo'sh tizimga kirib, bo'lim va xomashyo kiritib o'tirmaydi. Shuning
 * uchun landing tugmasi akkaunt emas, qo'ng'iroq so'raydi.
 *
 * Forma qisqa: faqat telefon majburiy. Qolgani suhbatga tayyorgarlik uchun
 * — bilsak yaxshi, bilmasak ham qo'ng'iroq qilaveramiz.
 */

const INDUSTRIES = [
  ["food", "Oziq-ovqat"],
  ["furniture", "Mebel"],
  ["sewing", "Tikuvchilik"],
  ["construction", "Qurilish materiallari"],
  ["other", "Boshqa"],
];

const EMPLOYEE_RANGES = [
  ["lt10", "10 gacha"],
  ["10_50", "10–50"],
  ["50_200", "50–200"],
  ["gt200", "200+"],
];

const EMPTY = {
  full_name: "",
  phone: "",
  company_name: "",
  industry: "",
  employee_range: "",

  // Asalidish. Odam buni ko'rmaydi va hech qachon to'ldirmaydi.
  website: "",
};

/**
 * Asalidish maydonining uslubi.
 *
 * `type="hidden"` ataylab ishlatilmaydi: botlar yashirin maydonlarni
 * o'tkazib yuborishni bilishadi. CSS bilan ekrandan chiqarib qo'yilgan
 * oddiy matn maydonini esa ular haqiqiy deb to'ldiradi.
 *
 * `display:none` ham emas — ekran o'quvchi uni umuman ko'rmasligi uchun
 * `aria-hidden` bilan birga chetga surib qo'yiladi.
 */
const honeypotSx = {
  position: "absolute",
  left: "-9999px",
  width: 1,
  height: 1,
  overflow: "hidden",
  opacity: 0,
  pointerEvents: "none",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "var(--aa-surface-solid)",
    fontSize: 13.5,
  },
  "& .MuiInputLabel-root": { fontSize: 13 },
};

const AuditRequestDialog = ({ open, onClose }) => {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [sentMessage, setSentMessage] = useState("");

  // Oyna yopilib qayta ochilganda eski javob ko'rinib qolmasin.
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setError("");
    setSent(false);
    setSentMessage("");
    setSaving(false);
  }, [open]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  // PhoneTextField tashqariga "+998901234567" beradi, ya'ni to'liq raqam
  // 13 belgidan iborat. Yarim yozilgan raqamda tugma o'chiq turadi.
  const phoneReady = /^\+998\d{9}$/.test(form.phone);
  const nameReady = form.full_name.trim().length >= 2;

  const submit = async (event) => {
    event.preventDefault();
    if (!phoneReady || !nameReady || saving) return;

    setSaving(true);
    setError("");

    try {
      const { data } = await submitAuditLead({
        name: form.full_name.trim(),
        phone: form.phone,
        company: form.company_name.trim() || undefined,
        industry: form.industry || undefined,
        employees: form.employee_range || undefined,
        website: form.website,
      });

      // Xato bo'lsa forma o'z holicha qoladi — kiritilgan ma'lumot
      // yo'qolmaydi, chunki `form` tozalanmaydi.
      setSentMessage(data?.message || "Arizangiz qabul qilindi. 1 ish kuni ichida bog‘lanamiz.");
      setSent(true);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Ariza yuborilmadi. Internetni tekshirib qayta urinib ko‘ring yoki +998 91 571 70 09 raqamiga qo‘ng‘iroq qiling.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (sent) {
    return (
      <PremiumDialog
        open={open}
        onClose={onClose}
        title="Ariza qabul qilindi"
        subtitle="Shu raqamga qo‘ng‘iroq qilamiz"
        maxWidth="xs"
        actions={
          <Button onClick={onClose} sx={primarySx}>
            Yopish
          </Button>
        }
      >
        <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 13.5, lineHeight: 1.75 }}>
          Rahmat, <b>{form.full_name.trim()}</b>. {sentMessage}
        </Typography>

        <Typography
          sx={{
            mt: 1.6,
            fontFamily: "var(--aa-display)",
            fontSize: 18,
            color: "var(--aa-brand-800)",
          }}
        >
          {formatPhoneInput(form.phone)}
        </Typography>
      </PremiumDialog>
    );
  }

  return (
    <PremiumDialog
      open={open}
      onClose={saving ? undefined : onClose}
      title="Bepul jarayon auditi"
      subtitle="Qisqa ariza — qolganini suhbatda aniqlaymiz"
      actions={
        <>
          <Button onClick={onClose} disabled={saving} sx={ghostSx}>
            Bekor qilish
          </Button>

          <Button
            type="submit"
            form="audit-request-form"
            disabled={saving || !phoneReady || !nameReady}
            startIcon={
              saving ? <CircularProgress size={14} thickness={5} sx={{ color: "inherit" }} /> : null
            }
            sx={primarySx}
          >
            {saving ? "Yuborilmoqda..." : "Arizani yuborish"}
          </Button>
        </>
      }
    >
      <Box
        component="form"
        id="audit-request-form"
        onSubmit={submit}
        sx={{ display: "grid", gap: 1.8 }}
      >
        <TextField
          label="Ism"
          value={form.full_name}
          onChange={set("full_name")}
          required
          autoFocus
          fullWidth
          size="small"
          sx={fieldSx}
        />

        {/* Asalidish: ekranda ko'rinmaydi, klaviatura bilan ham tushib
            bo'lmaydi. To'ldirilgan bo'lsa — bu odam emas. */}
        <TextField
          label="Website"
          value={form.website}
          onChange={set("website")}
          aria-hidden="true"
          sx={honeypotSx}
          slotProps={{
            htmlInput: { tabIndex: -1, autoComplete: "off" },
            inputLabel: { shrink: true },
          }}
        />

        <PhoneTextField
          label="Telefon raqami"
          value={form.phone}
          onChange={set("phone")}
          required
          fullWidth
          size="small"
          sx={fieldSx}
        />

        <TextField
          label="Korxona nomi"
          value={form.company_name}
          onChange={set("company_name")}
          fullWidth
          size="small"
          sx={fieldSx}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.8 }}>
          <TextField
            select
            label="Faoliyat turi"
            value={form.industry}
            onChange={set("industry")}
            fullWidth
            size="small"
            sx={fieldSx}
          >
            {INDUSTRIES.map(([value, label]) => (
              <MenuItem key={value} value={value} sx={{ fontSize: 13 }}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Xodimlar soni"
            value={form.employee_range}
            onChange={set("employee_range")}
            fullWidth
            size="small"
            sx={fieldSx}
          >
            {EMPLOYEE_RANGES.map(([value, label]) => (
              <MenuItem key={value} value={value} sx={{ fontSize: 13 }}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {error && (
          <Typography sx={{ color: "var(--aa-danger)", fontSize: 12, lineHeight: 1.6 }}>
            {error}
          </Typography>
        )}

        <Box
          sx={{
            mt: 0.4,
            p: 1.7,
            borderRadius: "13px",
            border: "1px solid var(--aa-accent)",
            backgroundColor: "var(--aa-accent-soft)",
          }}
        >
          <Typography sx={{ color: "var(--aa-text-secondary)", fontSize: 12, lineHeight: 1.7 }}>
            2 soatlik bepul audit — jarayoningizni xaritalab, qayerda vaqt va pul yo‘qolayotganini
            raqamlar bilan ko‘rsatamiz.
          </Typography>
        </Box>
      </Box>
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
  backgroundColor: "var(--aa-brand-800)",
  "&:hover": { backgroundColor: "var(--aa-brand-600)" },
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

export default AuditRequestDialog;
