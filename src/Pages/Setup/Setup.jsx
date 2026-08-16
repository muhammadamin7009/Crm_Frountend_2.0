import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Box, Button, CircularProgress, Typography } from "@mui/material";

import Card from "../../Components/UI/AppCard";
import PageHeader from "../../Components/UI/PageHeader";
import { useAuth } from "../../Context/AuthContext";
import { getSetupStatus, runSetupBootstrap } from "../../api/setup";
import OpeningWip from "./OpeningWip";

/**
 * Boshlang'ich sozlash.
 *
 * Yangi korxona bo'm-bo'sh boshlanadi va foydalanuvchi qayerdan boshlashni
 * bilmay qoladi: mahsulot yaratmoqchi bo'lsa kategoriya so'raydi, ish yozuvi
 * kiritmoqchi bo'lsa bo'lim so'raydi. Bu sahifa poydevorni bir tugma bilan
 * yaratadi va keyingi qadamlarni tartib bilan ko'rsatadi.
 */

// Poydevordan keyingi qadamlar — ular har korxonada boshqacha, shuning uchun
// avtomatik yaratilmaydi, faqat yo'l ko'rsatiladi.
const NEXT_STEPS = [
  {
    key: "raw_materials",
    label: "Xomashyo nomlari",
    hint: "Koja, astar, padoj... O'lchov birligini bir xil yozing.",
    path: "/material-purchases",
    action: "Xomashyo qo'shish",
  },
  {
    key: "products",
    label: "Mahsulot va retsept",
    hint: "Mahsulot yarating, yakunlovchi bo'limni belgilang, retsept va bo'lim narxlarini kiriting.",
    path: "/products",
    action: "Mahsulotlarga o'tish",
  },
];

const Setup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canBootstrap = user?.role === "super_admin";

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await getSetupStatus();
      setStatus(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Holatni olishda xato.");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const bootstrap = async () => {
    setSaving(true);

    try {
      const { data } = await runSetupBootstrap();
      setStatus(data);

      const total = Object.values(data.created || {}).reduce((sum, n) => sum + Number(n), 0);
      toast.success(total ? `${total} ta yozuv yaratildi.` : "Hammasi allaqachon joyida.");

      // Yon menyu ombor ro'yxatini shu hodisadan yangilaydi.
      window.dispatchEvent(new Event("warehouses-updated"));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Yaratishda xato.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box className="crm-page" sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress size={30} sx={{ color: "var(--aa-brand-800)" }} />
      </Box>
    );
  }

  const steps = status?.steps || [];
  const doneCount = steps.filter((step) => step.done).length;

  const migration = status?.migration || [];
  const migrationDone = migration.filter((row) => Number(row.missing) === 0).length;

  return (
    <Box className="crm-page" sx={{ pb: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader
        eyebrow="Boshlash"
        title="Korxonani sozlash"
        description="Poydevor tayyor bo'lgach qolgan bo'limlar o'z-o'zidan ishlay boshlaydi."
      />

      <Card sx={{ p: { xs: 2.2, md: 3 } }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.6,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "var(--aa-display)",
                fontSize: 19,
                color: "var(--aa-text)",
              }}
            >
              {status?.ready ? "Poydevor tayyor" : "Poydevorni yaratamiz"}
            </Typography>

            <Typography sx={{ mt: 0.5, color: "var(--aa-text-secondary)", fontSize: 12.5 }}>
              {doneCount} / {steps.length} qadam bajarilgan
            </Typography>
          </Box>

          {canBootstrap && !status?.ready && (
            <Button variant="contained" disabled={saving} onClick={bootstrap} sx={primarySx}>
              {saving ? "Yaratilmoqda..." : "Yetishmaganini yaratish"}
            </Button>
          )}
        </Box>

        {!canBootstrap && !status?.ready && (
          <Typography sx={{ mt: 1.6, color: "var(--aa-warning)", fontSize: 12 }}>
            Poydevorni faqat super administrator yarata oladi.
          </Typography>
        )}

        <Box sx={{ mt: 2.4, display: "grid", gap: 1 }}>
          {steps.map((step) => (
            <Box
              key={step.key}
              sx={{
                display: "grid",
                gridTemplateColumns: "26px 1fr auto",
                alignItems: "center",
                gap: 1.4,
                p: 1.4,
                borderRadius: "13px",
                border: "1px solid var(--aa-border)",
                backgroundColor: step.done ? "var(--aa-surface-muted)" : "var(--aa-surface-solid)",
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  fontSize: 11,
                  fontWeight: 700,
                  color: step.done ? "#ffffff" : "var(--aa-text-tertiary)",
                  backgroundColor: step.done ? "var(--aa-success)" : "var(--aa-surface-hover)",
                  border: step.done ? "none" : "1px solid var(--aa-border-strong)",
                }}
              >
                {step.done ? "✓" : ""}
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: "var(--aa-text)", fontSize: 13, fontWeight: 600 }}>
                  {step.label}
                </Typography>

                <Typography sx={{ mt: 0.2, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
                  {step.hint}
                </Typography>

                {step.warning && (
                  <Typography
                    sx={{ mt: 0.5, color: "var(--aa-warning)", fontSize: 10.5, fontWeight: 600 }}
                  >
                    {step.warning}
                  </Typography>
                )}
              </Box>

              <Typography
                sx={{
                  color: "var(--aa-text-tertiary)",
                  fontFamily: "var(--aa-display)",
                  fontSize: 15,
                }}
              >
                {step.count}
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>

      <Card sx={{ p: { xs: 2.2, md: 3 } }}>
        <Typography sx={{ fontFamily: "var(--aa-display)", fontSize: 18, color: "var(--aa-text)" }}>
          Keyingi qadamlar
        </Typography>

        <Typography sx={{ mt: 0.5, color: "var(--aa-text-secondary)", fontSize: 12.5 }}>
          Bular har korxonada boshqacha, shuning uchun qo'lda kiritiladi.
        </Typography>

        <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
          {NEXT_STEPS.map((step) => {
            const count = Number(status?.next?.[step.key] || 0);

            return (
              <Box
                key={step.key}
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.4,
                  p: 1.5,
                  borderRadius: "13px",
                  border: "1px solid var(--aa-border)",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "var(--aa-text)", fontSize: 13, fontWeight: 600 }}>
                    {step.label}
                    {count > 0 && (
                      <Typography
                        component="span"
                        sx={{ ml: 1, color: "var(--aa-success)", fontSize: 11, fontWeight: 600 }}
                      >
                        {count} ta bor
                      </Typography>
                    )}
                  </Typography>

                  <Typography sx={{ mt: 0.3, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
                    {step.hint}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  onClick={() => navigate(step.path)}
                  disabled={!status?.ready}
                  sx={outlineSx}
                >
                  {step.action}
                </Button>
              </Box>
            );
          })}
        </Box>

        {!status?.ready && (
          <Typography sx={{ mt: 1.6, color: "var(--aa-text-tertiary)", fontSize: 11 }}>
            Avval yuqoridagi poydevorni yakunlang — keyin bu qadamlar ochiladi.
          </Typography>
        )}
      </Card>

      {/*
        Ishlab turgan sexni tizimga ko'chirish.

        Bu tekshiruvlar ilgari har xil sahifada yashiringan edi: bo'lim boshlig'i
        zakaz oynasida, retsept mahsulot sahifasida, qoldiq inventarizatsiya
        ichida. Egasi qaysi biri qolganini bilmasdi va tizim yarim to'ldirilgan
        holda ishlay boshlardi.
      */}
      {migration.length > 0 && (
        <Card sx={{ p: { xs: 2.2, md: 3 } }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.6,
            }}
          >
            <Box>
              <Typography
                sx={{ fontFamily: "var(--aa-display)", fontSize: 18, color: "var(--aa-text)" }}
              >
                Ishlab turgan sexni ko'chirish
              </Typography>

              <Typography sx={{ mt: 0.5, color: "var(--aa-text-secondary)", fontSize: 12.5 }}>
                {migrationDone} / {migration.length} bajarilgan — hammasi to'lguncha ayrim
                hisob-kitoblar nol chiqadi.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
            {migration.map((row) => {
              const done = Number(row.missing) === 0;

              return (
                <Box
                  key={row.key}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.4,
                    p: 1.5,
                    borderRadius: "13px",
                    border: "1px solid var(--aa-border)",
                    backgroundColor: done ? "var(--aa-surface-muted)" : "var(--aa-surface-solid)",
                  }}
                >
                  <Box sx={{ minWidth: 0, display: "flex", alignItems: "flex-start", gap: 1.3 }}>
                    <Box
                      sx={{
                        mt: 0.2,
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        fontSize: 11,
                        fontWeight: 700,
                        color: done ? "#ffffff" : "var(--aa-text-tertiary)",
                        backgroundColor: done ? "var(--aa-success)" : "var(--aa-surface-hover)",
                        border: done ? "none" : "1px solid var(--aa-border-strong)",
                      }}
                    >
                      {done ? "✓" : ""}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: "var(--aa-text)", fontSize: 13, fontWeight: 600 }}>
                        {row.label}

                        {!done && (
                          <Typography
                            component="span"
                            sx={{
                              ml: 1,
                              color: "var(--aa-warning)",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {/* Sexdagi ish soni emas, borligi tekshiriladi —
                                shuning uchun unga raqam yozilmaydi. */}
                            {row.key === "work_in_progress"
                              ? "kiritilmagan"
                              : `${row.missing} ta qoldi`}
                          </Typography>
                        )}
                      </Typography>

                      <Typography sx={{ mt: 0.3, color: "var(--aa-text-tertiary)", fontSize: 10.5 }}>
                        {row.hint}
                      </Typography>
                    </Box>
                  </Box>

                  <Button variant="outlined" onClick={() => navigate(row.path)} sx={outlineSx}>
                    {row.action}
                  </Button>
                </Box>
              );
            })}
          </Box>
        </Card>
      )}

      {/* Poydevor tayyor bo'lgandan keyin: sexda hozir yurgan ish.
          Undan oldin ko'rsatilsa bo'lim ham, mahsulot ham yo'q bo'ladi. */}
      {status?.ready && <OpeningWip />}
    </Box>
  );
};

const primarySx = {
  minHeight: 44,
  px: 2.4,
  color: "#ffffff !important",
  borderRadius: "12px",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "none",
  backgroundColor: "var(--aa-brand-800)",
  "&:hover": { backgroundColor: "var(--aa-brand-600)" },
};

const outlineSx = {
  minHeight: 40,
  px: 2,
  borderRadius: "11px",
  fontSize: 11.5,
  fontWeight: 600,
  textTransform: "none",
  borderColor: "var(--aa-border-strong)",
  color: "var(--aa-text-secondary)",
};

export default Setup;
