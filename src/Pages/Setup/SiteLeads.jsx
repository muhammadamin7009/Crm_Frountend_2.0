import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Box, Button, CircularProgress, Chip, Typography } from "@mui/material";

import Card from "../../Components/UI/AppCard";
import { getSiteLeads, updateSiteLead } from "../../api/setup";

/**
 * Saytdan kelgan narx so'rovlari.
 *
 * So'rov Telegramga ham boradi, lekin Telegram — xabar, bu — ro'yxat.
 * Xabar o'qilib ketadi va yo'qoladi; kimga qo'ng'iroq qilinganini esa
 * shu yerdan ko'rish kerak.
 *
 * Ro'yxat oxirgi 100 tasi bilan cheklangan: bu sotuv bo'limi emas,
 * kichik kuzatuv oynasi.
 */

const TABS = [
  { value: "new", label: "Yangi" },
  { value: "contacted", label: "Qo‘ng‘iroq qilingan" },
  { value: "closed", label: "Yopilgan" },
  { value: "", label: "Hammasi" },
];

/** Keyingi holat — bitta tugma bilan oldinga siljitiladi. */
const NEXT = {
  new: { value: "contacted", label: "Qo‘ng‘iroq qildim" },
  contacted: { value: "closed", label: "Yopish" },
};

/**
 * Belgilar rangi.
 *
 * Faqat mavzuga moslashadigan o'zgaruvchilar ishlatiladi. Qattiq yozilgan
 * rang qorong'i mavzuda o'qilmay qoladi: `--aa-brand-800` tugma foni
 * uchun, `--aa-brand-text` esa yuza ustidagi matn uchun mo'ljallangan.
 */
const STATUS_STYLE = {
  new: { color: "var(--aa-brand-text)", bg: "var(--aa-brand-50)" },
  contacted: { color: "var(--aa-warning)", bg: "var(--aa-surface-muted)" },
  closed: { color: "var(--aa-text-tertiary)", bg: "var(--aa-surface-muted)" },
};

const dateText = (value) =>
  new Date(value).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const SiteLeads = () => {
  const [tab, setTab] = useState("new");
  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async (status) => {
    setLoading(true);

    try {
      const response = await getSiteLeads(status ? { status } : {});
      setLeads(response.data?.leads || []);
      setCounts(response.data?.counts || {});
    } catch (error) {
      toast.error(error?.response?.data?.message || "So‘rovlarni olishda xato.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [load, tab]);

  const move = async (lead) => {
    const next = NEXT[lead.status];
    if (!next) return;

    setBusy(lead.id);

    try {
      await updateSiteLead(lead.id, { status: next.value });
      // Ro'yxat qaytadan o'qiladi: joriy varaqda bu so'rov endi
      // ko'rinmasligi mumkin va uni o'z holicha qoldirish chalg'itadi.
      await load(tab);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Holatni o‘zgartirishda xato.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card sx={{ mt: 2, p: { xs: 2.2, md: 3 } }}>
      <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
        <Typography sx={{ fontFamily: "var(--aa-display)", fontSize: 18, color: "var(--aa-text)" }}>
          Saytdan kelgan so‘rovlar
        </Typography>

        {counts.new > 0 && (
          <Chip
            size="small"
            label={`${counts.new} ta yangi`}
            sx={{
              height: 22,
              fontSize: 11,
              fontWeight: 700,
              color: "#ffffff !important",
              backgroundColor: "var(--aa-brand-800)",
            }}
          />
        )}
      </Box>

      <Typography sx={{ mt: 0.5, color: "var(--aa-text-secondary)", fontSize: 12.5 }}>
        Har bir so‘rov Telegramga ham yuboriladi. Bu yerda kimga qo‘ng‘iroq
        qilinganini belgilab borasiz.
      </Typography>

      <Box sx={{ mt: 1.8, display: "flex", flexWrap: "wrap", gap: 0.8 }}>
        {TABS.map((item) => {
          const active = tab === item.value;
          const count = item.value ? counts[item.value] : undefined;

          return (
            <Button
              key={item.value || "all"}
              onClick={() => setTab(item.value)}
              sx={{
                minHeight: 34,
                px: 1.6,
                borderRadius: "10px",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "none",
                // `!important`: MUI tugmasining o'z rangi aks holda ustun
                // keladi va oq matn to'q fonda ko'rinmay qoladi.
                color: active ? "#ffffff !important" : "var(--aa-text-secondary)",
                backgroundColor: active ? "var(--aa-brand-800)" : "var(--aa-surface-muted)",
                "&:hover": {
                  backgroundColor: active ? "var(--aa-brand-600)" : "var(--aa-surface-hover)",
                },
              }}
            >
              {item.label}
              {count ? ` (${count})` : ""}
            </Button>
          );
        })}
      </Box>

      {loading ? (
        <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
          <CircularProgress size={24} sx={{ color: "var(--aa-brand-800)" }} />
        </Box>
      ) : leads.length === 0 ? (
        <Typography sx={{ py: 4, textAlign: "center", color: "var(--aa-text-tertiary)", fontSize: 13 }}>
          {tab === "new" ? "Yangi so‘rov yo‘q." : "Bu ro‘yxat bo‘sh."}
        </Typography>
      ) : (
        <Box sx={{ mt: 2, display: "grid", gap: 1.2 }}>
          {leads.map((lead) => {
            const style = STATUS_STYLE[lead.status] || STATUS_STYLE.closed;
            const next = NEXT[lead.status];

            return (
              <Box
                key={lead.id}
                sx={{
                  p: 1.6,
                  border: "1px solid var(--aa-border)",
                  borderRadius: "12px",
                  backgroundColor: "var(--aa-surface)",
                }}
              >
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "var(--aa-text)" }}>
                    {lead.full_name}
                  </Typography>

                  {/* Bosiladigan raqam: so'rov kelganda tezlik hal qiladi. */}
                  <Typography
                    component="a"
                    href={`tel:${lead.phone}`}
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--aa-brand-text)",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {lead.phone_display}
                  </Typography>

                  <Box sx={{ flex: 1 }} />

                  <Typography sx={{ fontSize: 11, color: "var(--aa-text-tertiary)" }}>
                    {dateText(lead.created_at)}
                  </Typography>

                  <Chip
                    size="small"
                    label={TABS.find((item) => item.value === lead.status)?.label || lead.status}
                    sx={{
                      height: 20,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: style.color,
                      backgroundColor: style.bg,
                    }}
                  />
                </Box>

                <Typography sx={{ mt: 0.6, fontSize: 12.5, color: "var(--aa-text-secondary)" }}>
                  {[lead.company_name, lead.order_type, lead.volume].filter(Boolean).join(" · ") ||
                    "Qo‘shimcha ma’lumot yo‘q"}
                </Typography>

                {lead.note && (
                  <Typography
                    sx={{
                      mt: 0.8,
                      p: 1,
                      borderRadius: "8px",
                      backgroundColor: "var(--aa-surface-muted)",
                      fontSize: 12.5,
                      color: "var(--aa-text)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {lead.note}
                  </Typography>
                )}

                {next && (
                  <Button
                    onClick={() => move(lead)}
                    disabled={busy === lead.id}
                    sx={{
                      mt: 1.2,
                      minHeight: 32,
                      px: 1.6,
                      borderRadius: "9px",
                      border: "1px solid var(--aa-border)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      textTransform: "none",
                      color: "var(--aa-text-secondary)",
                      "&:hover": { backgroundColor: "var(--aa-surface-muted)" },
                    }}
                  >
                    {next.label}
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
};

export default SiteLeads;
