import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Box, Button, CircularProgress, Typography } from "@mui/material";

import Card from "../../Components/UI/AppCard";
import {
  deleteSiteGalleryImage,
  getSiteGallery,
  uploadSiteGalleryImage,
} from "../../api/setup";

/**
 * Sayt galereyasi.
 *
 * Har uyacha — fotografga topshiriq: qanday kadr kerakligi yozib
 * qo'yilgan. Erkin "rasm qo'shish" emas, chunki kadrlarning nisbati va
 * joyi saytda oldindan belgilangan; ixtiyoriy sondagi rasm yuklansa
 * sahifa tuzilishi buziladi.
 *
 * Bo'sh uyacha xato emas: saytda uning o'rnida topshiriq matni bilan
 * chizma turadi. Ya'ni yarim to'ldirilgan galereya ham yaxshi ko'rinadi.
 */

const imageUrl = (path) => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;

  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

/** Kartochka balandligi nisbatga qarab — panelda ham kadr shakli ko'rinsin. */
const RATIO_PADDING = {
  "1:1": "100%",
  "4:5": "125%",
  "4:3": "75%",
  "3:2": "66.6%",
  "16:9": "56.25%",
};

const SiteGallery = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const inputs = useRef({});

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getSiteGallery();
      setSlots(response.data?.slots || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Galereyani olishda xato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pick = (slot) => (event) => {
    const file = event.target.files?.[0];
    // Fayl tanlanmasdan oyna yopilishi oddiy hol.
    if (!file) return;

    upload(slot, file);
    // Bir xil faylni qayta tanlash ham ishlashi kerak.
    event.target.value = "";
  };

  const upload = async (slot, file) => {
    setBusy(slot);

    try {
      const response = await uploadSiteGalleryImage(slot, file);
      setSlots(response.data?.slots || []);
      toast.success("Rasm yuklandi — sayt bir soat ichida yangilanadi");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Rasm yuklanmadi.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (slot) => {
    setBusy(slot);

    try {
      const response = await deleteSiteGalleryImage(slot);
      setSlots(response.data?.slots || []);
      toast.success("Rasm olib tashlandi");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Rasmni olib tashlashda xato.");
    } finally {
      setBusy(null);
    }
  };

  const filled = slots.filter((item) => item.image_url).length;

  return (
    <Card sx={{ mt: 2, p: { xs: 2.2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
        <Typography sx={{ fontFamily: "var(--aa-display)", fontSize: 18, color: "var(--aa-text)" }}>
          Sayt galereyasi
        </Typography>

        {slots.length > 0 && (
          <Typography sx={{ fontSize: 12, color: "var(--aa-text-tertiary)" }}>
            {filled} / {slots.length} kadr
          </Typography>
        )}
      </Box>

      <Typography sx={{ mt: 0.5, color: "var(--aa-text-secondary)", fontSize: 12.5 }}>
        Har kartochkada qanday kadr kerakligi yozilgan. Rasm qo&lsquo;yilmagan
        uyacha o&lsquo;rnida saytda shu topshiriq matni turadi — ya&rsquo;ni
        yarim to&lsquo;ldirilgan galereya ham chiroyli ko&lsquo;rinadi.
      </Typography>

      <Typography sx={{ mt: 0.6, color: "var(--aa-text-tertiary)", fontSize: 11 }}>
        JPEG, PNG yoki WebP; ko&lsquo;pi bilan 5 MB.
      </Typography>

      {loading ? (
        <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
          <CircularProgress size={24} sx={{ color: "var(--aa-brand-800)" }} />
        </Box>
      ) : (
        <Box
          sx={{
            mt: 2.2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
            gap: 1.6,
          }}
        >
          {slots.map((item) => {
            const url = imageUrl(item.image_url);
            const working = busy === item.slot;

            return (
              <Box
                key={item.slot}
                sx={{
                  p: 1.4,
                  border: "1px solid var(--aa-border)",
                  borderRadius: "12px",
                  backgroundColor: "var(--aa-surface)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 1 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "var(--aa-text)" }}>
                    {item.slot}
                  </Typography>

                  <Typography sx={{ fontSize: 10.5, color: "var(--aa-text-tertiary)" }}>
                    {item.group_label} · {item.ratio}
                  </Typography>
                </Box>

                {/* Nisbat oldindan band qilinadi: rasm yuklanganda
                    kartochka sakramaydi. */}
                <Box
                  sx={{
                    mt: 1,
                    position: "relative",
                    width: "100%",
                    paddingTop: RATIO_PADDING[item.ratio] || "75%",
                    borderRadius: "9px",
                    overflow: "hidden",
                    backgroundColor: "var(--aa-surface-muted)",
                    border: url ? "none" : "1px dashed var(--aa-border-strong)",
                  }}
                >
                  {url ? (
                    <Box
                      component="img"
                      src={url}
                      alt={item.brief}
                      loading="lazy"
                      sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        position: "absolute",
                        inset: 0,
                        p: 1.4,
                        display: "grid",
                        placeItems: "center",
                        textAlign: "center",
                        fontSize: 11.5,
                        lineHeight: 1.5,
                        color: "var(--aa-text-secondary)",
                      }}
                    >
                      {item.brief}
                    </Typography>
                  )}
                </Box>

                {url && (
                  <Typography sx={{ mt: 1, fontSize: 11, lineHeight: 1.5, color: "var(--aa-text-tertiary)" }}>
                    {item.brief}
                  </Typography>
                )}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  ref={(node) => {
                    inputs.current[item.slot] = node;
                  }}
                  onChange={pick(item.slot)}
                />

                <Box sx={{ mt: 1.2, display: "flex", gap: 0.8 }}>
                  <Button
                    disabled={working}
                    onClick={() => inputs.current[item.slot]?.click()}
                    sx={{
                      minHeight: 32,
                      px: 1.6,
                      borderRadius: "9px",
                      border: "1px solid var(--aa-border)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      textTransform: "none",
                      color: "var(--aa-text-secondary)",
                      "&:hover": { backgroundColor: "var(--aa-surface-hover)" },
                    }}
                  >
                    {working ? "Yuklanmoqda..." : url ? "Almashtirish" : "Rasm yuklash"}
                  </Button>

                  {url && (
                    <Button
                      disabled={working}
                      onClick={() => remove(item.slot)}
                      sx={{
                        minHeight: 32,
                        px: 1.4,
                        borderRadius: "9px",
                        fontSize: 11.5,
                        fontWeight: 600,
                        textTransform: "none",
                        color: "var(--aa-danger)",
                        "&:hover": { backgroundColor: "var(--aa-surface-hover)" },
                      }}
                    >
                      O&lsquo;chirish
                    </Button>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
};

export default SiteGallery;
