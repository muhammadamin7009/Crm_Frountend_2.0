import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Box, Button, CircularProgress, Typography } from "@mui/material";

import Card from "../../Components/UI/AppCard";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import { getSiteContent, saveSiteContent } from "../../api/setup";

/**
 * Korxona sayti matnlari.
 *
 * Bu yerga yozilgan har bir so'zni butun internet ko'radi — shuning
 * uchun maydonlar ro'yxati backendda qattiq belgilangan va uzun matn
 * kesiladi. Cheksiz matn saytning tuzilishini buzardi.
 *
 * Bo'sh qoldirilgan maydon o'chirilmaydi: sayt o'zidagi standart matnni
 * ko'rsatadi. Ya'ni "tozalash" — "standart holatga qaytarish" degani.
 */
const SiteContent = () => {
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getSiteContent();
      const content = response.data?.content || {};

      setFields(response.data?.fields || []);
      setValues(content);
      setSaved(content);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Matnlarni olishda xato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Guruhlar backenddan kelgan tartibda qoladi — u saytdagi tartib bilan
  // bir xil, shunda tahrirlayotgan odam qayerni o'zgartirayotganini biladi.
  const groups = useMemo(() => {
    const map = new Map();
    for (const field of fields) {
      if (!map.has(field.group)) map.set(field.group, []);
      map.get(field.group).push(field);
    }
    return [...map.entries()];
  }, [fields]);

  const changed = useMemo(
    () => fields.some((field) => (values[field.key] || "") !== (saved[field.key] || "")),
    [fields, values, saved],
  );

  const change = (key) => (event) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  const save = async () => {
    setSaving(true);

    try {
      // Faqat o'zgarganlari yuboriladi.
      const patch = {};
      for (const field of fields) {
        const next = values[field.key] || "";
        if (next !== (saved[field.key] || "")) patch[field.key] = next;
      }

      const response = await saveSiteContent(patch);
      const content = response.data?.content || {};

      setValues(content);
      setSaved(content);
      toast.success("Saqlandi — sayt bir soat ichida yangilanadi");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Saqlashda xato.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ py: 6, display: "grid", placeItems: "center" }}>
        <CircularProgress size={28} sx={{ color: "var(--aa-brand-800)" }} />
      </Card>
    );
  }

  return (
    <Card sx={{ p: { xs: 2.2, md: 3 } }}>
      <Typography sx={{ fontFamily: "var(--aa-display)", fontSize: 18, color: "var(--aa-text)" }}>
        Korxona sayti
      </Typography>

      <Typography sx={{ mt: 0.5, color: "var(--aa-text-secondary)", fontSize: 12.5 }}>
        Saytdagi matnlar. Mahsulotlar bu yerda emas — ular mahsulot bo&lsquo;limidan
        avtomatik chiqadi.
      </Typography>

      <Typography sx={{ mt: 0.6, color: "var(--aa-text-tertiary)", fontSize: 11 }}>
        Bo&lsquo;sh qoldirilgan maydon o&lsquo;rniga saytdagi standart matn ko&lsquo;rinadi.
        O&lsquo;zgarish saytda bir soat ichida paydo bo&lsquo;ladi.
      </Typography>

      {groups.map(([group, list]) => (
        <Box key={group} sx={{ mt: 2.6 }}>
          <Typography
            sx={{
              pb: 0.8,
              borderBottom: "1px solid var(--aa-border)",
              color: "var(--aa-text-tertiary)",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {group}
          </Typography>

          <Box
            sx={{
              mt: 1.4,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1.4,
            }}
          >
            {list.map((field) => {
              const value = values[field.key] || "";
              const left = field.max - value.length;

              return (
                <TextField
                  key={field.key}
                  size="small"
                  label={field.label}
                  value={value}
                  onChange={change(field.key)}
                  multiline={Boolean(field.multiline)}
                  minRows={field.multiline ? 3 : undefined}
                  sx={field.multiline ? { gridColumn: { md: "1 / -1" } } : undefined}
                  // Chegara backendda ham bor — bu yerda faqat oldindan
                  // ogohlantirish, kesib qo'yish uchun emas.
                  slotProps={{ htmlInput: { maxLength: field.max } }}
                  helperText={
                    left < 20
                      ? `${left} belgi qoldi`
                      : field.hint || `Ko‘pi bilan ${field.max} belgi`
                  }
                />
              );
            })}
          </Box>
        </Box>
      ))}

      <Button
        variant="contained"
        disabled={saving || !changed}
        onClick={save}
        sx={{
          mt: 2.6,
          minHeight: 42,
          px: 2.6,
          color: "#ffffff !important",
          borderRadius: "12px",
          fontSize: 12,
          fontWeight: 600,
          textTransform: "none",
          backgroundColor: "var(--aa-brand-800)",
          "&:hover": { backgroundColor: "var(--aa-brand-600)" },
        }}
      >
        {saving ? "Saqlanmoqda..." : changed ? "Saqlash" : "O‘zgarish yo‘q"}
      </Button>
    </Card>
  );
};

export default SiteContent;
