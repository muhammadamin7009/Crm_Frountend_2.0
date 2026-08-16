import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PageHeader from "../../Components/UI/PageHeader";
import StarRating from "../../Components/UI/StarRating";
import { CompatTextField as TextField } from "../../Components/UI/MuiCompat";
import { getRateablePeople, getMyRating, saveRating } from "../../api/ratings";

const STAR_LABELS = {
  1: "Juda yomon",
  2: "Yomon",
  3: "O'rtacha",
  4: "Yaxshi",
  5: "A'lo",
};

const initials = (person) =>
  `${person.first_name?.[0] || ""}${person.last_name?.[0] || ""}`.toUpperCase();

const Ratings = () => {
  const [state, setState] = useState(null);
  const [mine, setMine] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [people, own] = await Promise.all([
        getRateablePeople(),
        getMyRating().catch(() => ({ data: null })),
      ]);
      setState(people.data);
      setMine(own.data);
      // Qo'yilgan bahoni tahrirlash uchun boshlang'ich holatga solamiz.
      setDrafts(
        Object.fromEntries(
          (people.data.people || [])
            .filter((p) => p.my_rating)
            .map((p) => [p.id, { ...p.my_rating }]),
        ),
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Reytingni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStar = (personId, key, value) =>
    setDrafts((current) => ({
      ...current,
      [personId]: { ...(current[personId] || {}), [key]: value },
    }));

  const submit = async (person) => {
    const draft = drafts[person.id] || {};
    const missing = ["discipline", "quality", "deadline"].filter((key) => !draft[key]);
    if (missing.length) {
      toast.warn("Uchala mezonga ham ball qo'ying");
      return;
    }

    setSavingId(person.id);
    try {
      await saveRating({ worker_id: person.id, ...draft });
      toast.success(`${person.first_name} baholandi`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Bahoni saqlab bo'lmadi");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const week = state?.week;
  const criteria = state?.criteria || {};

  return (
    <Stack className="crm-page" spacing={3} sx={{ p: { xs: 2, md: 3.5 } }}>
      <PageHeader
        eyebrow="Xodimlar"
        title="Baholash"
        description="Ishini qabul qilgan hamkasblaringizni baholaysiz. Kim nechchi qo'yganini hech kim ko'rmaydi — faqat o'rtacha ball ko'rinadi."
      />

      {mine?.score !== undefined && (
        <Paper
          elevation={0}
          sx={{ p: 2.5, border: "1px solid var(--aa-border)", borderRadius: 3 }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1.5 }}>
            Mening reytingim
          </Typography>
          {mine.score === null ? (
            <Typography sx={{ fontSize: 13.5, color: "var(--aa-text-tertiary)" }}>
              Hozircha sizni hech kim baholamagan.
            </Typography>
          ) : (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={3}
              sx={{ alignItems: "flex-start" }}
            >
              <Box>
                <Typography sx={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}>
                  {mine.score.toFixed(2)}
                </Typography>
                <StarRating value={mine.score} size={18} />
                <Typography sx={{ fontSize: 12, color: "var(--aa-text-tertiary)", mt: 0.5 }}>
                  {mine.raters} kishi baholadi
                </Typography>
              </Box>
              <Box sx={{ display: "grid", gap: 0.75 }}>
                {Object.entries(mine.criteria || {}).map(([key, label]) => (
                  <Stack key={key} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Typography sx={{ fontSize: 13, minWidth: 118 }}>{label}</Typography>
                    <StarRating value={mine[key] || 0} size={15} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      {mine[key] === null ? "—" : mine[key].toFixed(2)}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Stack>
          )}
        </Paper>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: "1px solid var(--aa-border)",
          borderRadius: 3,
          bgcolor: week?.is_open ? undefined : "var(--aa-surface-muted)",
        }}
      >
        <Typography sx={{ fontSize: 13.5 }}>
          {week?.is_open ? (
            <>
              Baho oynasi <b>ochiq</b> — yakshanbagacha qo'yishingiz va o'zgartirishingiz
              mumkin. Yopilgach shu haftaning bali qotadi.
            </>
          ) : (
            <>
              Baho oynasi <b>yopiq</b>. U har hafta <b>payshanba</b> kuni ochiladi va
              yakshanba yopiladi.
            </>
          )}
        </Typography>
      </Paper>

      {!state?.people?.length ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            textAlign: "center",
            border: "1px solid var(--aa-border)",
            borderRadius: 3,
            color: "var(--aa-text-tertiary)",
          }}
        >
          Baholaydigan hamkasb yo'q. Siz faqat ishini qabul qiladigan bo'limlarni
          baholaysiz.
        </Paper>
      ) : (
        <Stack spacing={2}>
          {state.people.map((person) => {
            const draft = drafts[person.id] || {};
            const saved = !!person.my_rating;
            return (
              <Paper
                key={person.id}
                elevation={0}
                sx={{ p: 2.5, border: "1px solid var(--aa-border)", borderRadius: 3 }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 2 }}>
                  <Avatar src={person.user_image || undefined} sx={{ width: 44, height: 44 }}>
                    {initials(person)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }} noWrap>
                      {person.first_name} {person.last_name}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: "var(--aa-text-tertiary)" }}>
                      {person.department_name}
                    </Typography>
                  </Box>
                  {saved && (
                    <Chip
                      size="small"
                      label="Baholangan"
                      sx={{
                        bgcolor: "color-mix(in srgb, var(--aa-success, #2f6b45) 14%, transparent)",
                        color: "var(--aa-success, #2f6b45)",
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Stack>

                <Box sx={{ display: "grid", gap: 1.25 }}>
                  {Object.entries(criteria).map(([key, label]) => (
                    <Stack
                      key={key}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={{ xs: 0.5, sm: 2 }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Typography sx={{ fontSize: 13.5, minWidth: 130 }}>{label}</Typography>
                      <StarRating
                        value={draft[key] || 0}
                        labels={STAR_LABELS}
                        onChange={week?.is_open ? (v) => setStar(person.id, key, v) : undefined}
                      />
                    </Stack>
                  ))}
                </Box>

                {week?.is_open && (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ mt: 2 }}
                    alignItems={{ sm: "center" }}
                  >
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Izoh (ixtiyoriy) — faqat bo'lim boshlig'i ko'radi"
                      value={draft.note || ""}
                      onChange={(e) => setStar(person.id, "note", e.target.value)}
                      inputProps={{ maxLength: 300 }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => submit(person)}
                      disabled={savingId === person.id}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {savingId === person.id ? "..." : saved ? "Yangilash" : "Saqlash"}
                    </Button>
                  </Stack>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};

export default Ratings;
