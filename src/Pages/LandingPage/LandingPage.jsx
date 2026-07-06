import { Box, Button, Container, Grid, Paper, Typography } from "@mui/material";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";

const brand = {
  red: "#8b0101",
  red2: "#b42327",
  dark: "#050505",
  cream: "#f6f2df",
  text: "#111827",
  muted: "#64748b",
};

const fadeUp = {
  hidden: { opacity: 0, y: 70 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -70 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeRight = {
  hidden: { opacity: 0, x: 70 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardIn = {
  hidden: { opacity: 0, y: 55, scale: 0.94 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.75,
      delay: index * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const stats = [
  {
    label: "Savdo",
    value: "0 so'm",
    desc: "Kunlik, haftalik va oylik savdo",
  },
  {
    label: "Mijoz qarzi",
    value: "0 so'm",
    desc: "Kim qancha qarz ekanini ko‘rsatadi",
  },
  {
    label: "Ombor",
    value: "0 ta",
    desc: "Xomashyo va tayyor mahsulot qoldig‘i",
  },
  {
    label: "Ish haqi",
    value: "0 so'm",
    desc: "Ishchilar oyligi va avanslari",
  },
];

const features = [
  {
    number: "01",
    title: "Savdo va mijoz qarzlari",
    text: "Mijozga mahsulot sotiladi, tizim avtomatik ravishda umumiy summa, tushgan to‘lov va qolgan qarzni hisoblaydi.",
    result: "Savdo / To‘lov / Qarz",
  },
  {
    number: "02",
    title: "Ombor nazorati",
    text: "Xomashyo, tayyor mahsulot, kirim, chiqim va transferlar bitta joyda yuritiladi. Qaysi omborda nima borligi aniq ko‘rinadi.",
    result: "Kirim / Chiqim / Qoldiq",
  },
  {
    number: "03",
    title: "Ishlab chiqarish",
    text: "Har bir ishchi qaysi modeldan qancha ishlab chiqargani yoziladi. Tizim ishchi mehnatini avtomatik hisoblab boradi.",
    result: "Ishchi / Model / Miqdor",
  },
  {
    number: "04",
    title: "Ish haqi va avans",
    text: "Ishchi qancha ish qilgani, qancha oylik olishi, qancha avans olgani va qancha qoldiq borligi ko‘rinadi.",
    result: "Oylik / Avans / Qoldiq",
  },
  {
    number: "05",
    title: "Moliya va foyda",
    text: "Kirim, chiqim, xarid, savdo va to‘lovlar asosida umumiy moliyaviy holat ko‘rsatiladi.",
    result: "Kirim / Chiqim / Foyda",
  },
  {
    number: "06",
    title: "Audit loglar",
    text: "Kim, qachon, qaysi amalni bajargani tizimda saqlanadi. Rahbar uchun nazorat kuchayadi.",
    result: "Kim / Qachon / Nima qildi",
  },
];

const steps = [
  {
    title: "Mahsulot yoki xomashyo qo‘shiladi",
    text: "Admin mahsulot nomi, turi, narxi va o‘lchov birligini kiritadi.",
  },
  {
    title: "Omborga kirim qilinadi",
    text: "Kirimdan keyin ombor qoldig‘i avtomatik yangilanadi.",
  },
  {
    title: "Ishchilar ish hisobotini kiritadi",
    text: "Har bir ishchi ishlab chiqargan model va miqdor bo‘yicha yoziladi.",
  },
  {
    title: "Mijozga savdo qilinadi",
    text: "Sotilgan mahsulot, to‘lov va qarz tizimda saqlanadi.",
  },
  {
    title: "Hisobot avtomatik chiqadi",
    text: "Rahbar dashboardda savdo, ombor, qarz, oylik va foydani ko‘radi.",
  },
];

function MiniStat({ item, index }) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Box
        component={motion.div}
        custom={index}
        variants={cardIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        whileHover={{ y: -7, scale: 1.02 }}
        sx={{
          p: 2.5,
          minHeight: 150,
          borderRadius: "24px",
          bgcolor: index === 0 ? brand.red : "#fff",
          color: index === 0 ? "#fff" : brand.text,
          boxShadow:
            index === 0 ? "0 24px 60px rgba(139,1,1,.28)" : "0 18px 44px rgba(15,23,42,.08)",
          border: index === 0 ? "none" : "1px solid rgba(15,23,42,.06)",
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 900, opacity: 0.72 }}>{item.label}</Typography>

        <Typography sx={{ mt: 1, fontSize: 30, fontWeight: 950 }}>{item.value}</Typography>

        <Typography
          sx={{
            mt: 1,
            fontSize: 12.5,
            lineHeight: "20px",
            color: index === 0 ? "rgba(255,255,255,.72)" : brand.muted,
            fontWeight: 650,
          }}
        >
          {item.desc}
        </Typography>
      </Box>
    </Grid>
  );
}

function FeatureCard({ item, index }) {
  const dark = index === 0 || index === 3;

  return (
    <Grid item xs={12} md={4}>
      <Paper
        component={motion.div}
        custom={index}
        variants={cardIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        whileHover={{ y: -10 }}
        elevation={0}
        sx={{
          height: "100%",
          minHeight: 330,
          p: 4,
          borderRadius: "36px",
          bgcolor: dark ? "#101010" : "#f5f5f5",
          color: dark ? "#fff" : brand.text,
          position: "relative",
          overflow: "hidden",
          border: dark ? "1px solid rgba(255,255,255,.08)" : "1px solid rgba(15,23,42,.06)",
          boxShadow: dark ? "0 30px 90px rgba(0,0,0,.20)" : "0 24px 70px rgba(15,23,42,.07)",
        }}
      >
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.12, 1],
            opacity: dark ? [0.12, 0.22, 0.12] : [0.08, 0.14, 0.08],
          }}
          transition={{ duration: 5, repeat: Infinity, delay: index * 0.2 }}
          sx={{
            position: "absolute",
            width: 190,
            height: 190,
            right: -70,
            top: -70,
            borderRadius: "50%",
            bgcolor: dark ? "#fff" : brand.red,
          }}
        />

        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 950,
            color: dark ? "#fca5a5" : brand.red,
            position: "relative",
          }}
        >
          {item.number}
        </Typography>

        <Typography
          sx={{
            mt: 3,
            fontSize: { xs: 24, md: 29 },
            lineHeight: "35px",
            fontWeight: 950,
            letterSpacing: "-.045em",
            position: "relative",
          }}
        >
          {item.title}
        </Typography>

        <Typography
          sx={{
            mt: 2,
            fontSize: 15.5,
            lineHeight: "28px",
            color: dark ? "rgba(255,255,255,.62)" : brand.muted,
            fontWeight: 650,
            position: "relative",
          }}
        >
          {item.text}
        </Typography>

        <Box
          sx={{
            mt: 3,
            display: "inline-flex",
            px: 1.7,
            py: 0.9,
            borderRadius: "999px",
            bgcolor: dark ? "rgba(255,255,255,.1)" : "rgba(139,1,1,.08)",
            color: dark ? "#fff" : brand.red,
            fontSize: 12,
            fontWeight: 950,
            position: "relative",
          }}
        >
          {item.result}
        </Box>
      </Paper>
    </Grid>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();

  const heroY = useTransform(scrollYProgress, [0, 0.22], [0, -85]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.28]);
  const mockupY = useTransform(scrollYProgress, [0, 0.22], [0, -45]);
  const mockupScale = useTransform(scrollYProgress, [0, 0.22], [1, 1.04]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: brand.dark,
        color: "#fff",
        overflowX: "hidden",
        overflowY: "visible",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          backdropFilter: "blur(24px)",
          background: "rgba(5,5,5,.70)",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              height: 66,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 20, letterSpacing: "-.03em" }}>
                Zerr CRM
              </Typography>
              <Typography
                sx={{
                  display: { xs: "none", sm: "block" },
                  mt: 0.2,
                  fontSize: 11,
                  color: "rgba(255,255,255,.48)",
                  fontWeight: 750,
                }}
              >
                ishlab chiqarish boshqaruv tizimi
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button
                onClick={() =>
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{
                  color: "rgba(255,255,255,.76)",
                  textTransform: "none",
                  fontWeight: 850,
                  display: { xs: "none", md: "inline-flex" },
                }}
              >
                Imkoniyatlar
              </Button>

              <Button
                onClick={() =>
                  document.getElementById("process")?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{
                  color: "rgba(255,255,255,.76)",
                  textTransform: "none",
                  fontWeight: 850,
                  display: { xs: "none", md: "inline-flex" },
                }}
              >
                Jarayon
              </Button>

              <Button
                onClick={() => navigate("/login")}
                sx={{
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 850,
                  display: { xs: "none", sm: "inline-flex" },
                }}
              >
                Kirish
              </Button>

              <Button
                variant="contained"
                onClick={() => navigate("/login")}
                sx={{
                  bgcolor: "#fff",
                  color: "#111",
                  borderRadius: "999px",
                  px: 2.8,
                  py: 1,
                  textTransform: "none",
                  fontWeight: 950,
                  "&:hover": { bgcolor: "#f3f4f6" },
                }}
              >
                Boshlash
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box
        sx={{
          minHeight: "112vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          pt: 12,
          pb: { xs: 10, md: 18 },
          background:
            "radial-gradient(circle at 50% 22%, rgba(139,1,1,.48), transparent 30%), radial-gradient(circle at 82% 74%, rgba(255,180,80,.18), transparent 28%), radial-gradient(circle at 18% 80%, rgba(255,255,255,.07), transparent 24%), #050505",
        }}
      >
        <Container maxWidth="xl">
          <Box
            component={motion.div}
            style={{ y: heroY, opacity: heroOpacity }}
            sx={{ textAlign: "center", mx: "auto", position: "relative" }}
          >
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75 }}
              sx={{
                display: "inline-flex",
                mb: 3,
                px: 2,
                py: 0.9,
                borderRadius: "999px",
                bgcolor: "rgba(255,255,255,.09)",
                border: "1px solid rgba(255,255,255,.12)",
                color: "rgba(255,255,255,.76)",
                fontSize: 13,
                fontWeight: 900,
              }}
            >
              Test rejimida • Premium CRM landing page
            </Box>

            <Typography
              component={motion.h1}
              initial={{ opacity: 0, y: 65, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              sx={{
                fontSize: { xs: 62, sm: 92, md: 142 },
                lineHeight: { xs: "64px", sm: "94px", md: "138px" },
                fontWeight: 950,
                letterSpacing: "-0.085em",
                mb: 3,
              }}
            >
              Zerr CRM
            </Typography>

            <Typography
              component={motion.p}
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.25 }}
              sx={{
                maxWidth: 930,
                mx: "auto",
                fontSize: { xs: 27, md: 47 },
                lineHeight: { xs: "36px", md: "56px" },
                fontWeight: 900,
                letterSpacing: "-0.052em",
                color: "rgba(255,255,255,.90)",
              }}
            >
              Savdo, ombor va ishlab chiqarish endi bitta joyda.
            </Typography>

            <Typography
              component={motion.p}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.45 }}
              sx={{
                mt: 2.8,
                maxWidth: 760,
                mx: "auto",
                fontSize: { xs: 16, md: 20 },
                lineHeight: "33px",
                color: "rgba(255,255,255,.58)",
                fontWeight: 650,
              }}
            >
              Zerr CRM korxonadagi mahsulot, xomashyo, ishchi, mijoz, qarz, to‘lov va foydani
              avtomatik hisoblaydi.
            </Typography>

            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.65 }}
              sx={{
                mt: 5,
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                onClick={() => navigate("/login")}
                sx={{
                  bgcolor: "#fff",
                  color: "#111",
                  borderRadius: "999px",
                  px: 4.5,
                  py: 1.55,
                  textTransform: "none",
                  fontWeight: 950,
                  fontSize: 16,
                  "&:hover": { bgcolor: "#f3f4f6" },
                }}
              >
                Tizimga kirish
              </Button>

              <Button
                onClick={() =>
                  document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{
                  color: "#fff",
                  borderRadius: "999px",
                  px: 4.5,
                  py: 1.55,
                  textTransform: "none",
                  fontWeight: 950,
                  fontSize: 16,
                  background: "rgba(255,255,255,.10)",
                  border: "1px solid rgba(255,255,255,.15)",
                  "&:hover": { background: "rgba(255,255,255,.16)" },
                }}
              >
                Loyiha haqida
              </Button>
            </Box>
          </Box>

          <Box
            component={motion.div}
            style={{ y: mockupY, scale: mockupScale }}
            initial={{ opacity: 0, y: 90 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.15, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              mt: { xs: 8, md: 11 },
              mx: "auto",
              maxWidth: 1160,
              borderRadius: { xs: "30px", md: "46px" },
              p: { xs: 1.2, md: 1.8 },
              background: "linear-gradient(135deg, rgba(255,255,255,.32), rgba(255,255,255,.04))",
              border: "1px solid rgba(255,255,255,.18)",
              boxShadow: "0 60px 150px rgba(139,1,1,.38)",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                overflow: "hidden",
                borderRadius: { xs: "24px", md: "38px" },
                bgcolor: brand.cream,
                color: brand.text,
              }}
            >
              <Box
                sx={{
                  height: 60,
                  px: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid rgba(15,23,42,.08)",
                  bgcolor: "#fff",
                }}
              >
                <Typography sx={{ fontWeight: 950 }}>Zerr CRM Dashboard</Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#ef4444" }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#f59e0b" }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#10b981" }} />
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ p: { xs: 2, md: 3 } }}>
                {stats.map((item, index) => (
                  <MiniStat key={item.label} item={item} index={index} />
                ))}

                <Grid item xs={12} md={8}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: "30px",
                      bgcolor: "#fff",
                      minHeight: 300,
                      boxShadow: "0 18px 44px rgba(15,23,42,.07)",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                          Savdo dinamikasi
                        </Typography>
                        <Typography
                          sx={{ mt: 0.5, color: brand.muted, fontWeight: 650, fontSize: 13 }}
                        >
                          Haftalik savdo o‘sishi
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.8,
                          borderRadius: "999px",
                          bgcolor: "rgba(16,185,129,.10)",
                          color: "#059669",
                          fontWeight: 950,
                          fontSize: 12,
                          height: "fit-content",
                        }}
                      >
                        +24%
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        mt: 5,
                        height: 180,
                        display: "flex",
                        alignItems: "end",
                        gap: { xs: 1, sm: 2 },
                      }}
                    >
                      {[72, 125, 96, 162, 138, 188, 150].map((height, index) => (
                        <Box
                          key={index}
                          component={motion.div}
                          initial={{ height: 0 }}
                          whileInView={{ height }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: index * 0.08 }}
                          sx={{
                            flex: 1,
                            borderRadius: "999px 999px 0 0",
                            background:
                              index === 5
                                ? "linear-gradient(180deg,#8b0101,#ef4444)"
                                : "linear-gradient(180deg,#facc15,#fb923c)",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: "30px",
                      bgcolor: "#fff",
                      minHeight: 300,
                      boxShadow: "0 18px 44px rgba(15,23,42,.07)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 950, fontSize: 18 }}>Bugungi jarayon</Typography>

                    {steps.slice(0, 4).map((step, index) => (
                      <Box key={step.title} sx={{ display: "flex", gap: 1.5, mt: 2.3 }}>
                        <Box
                          component={motion.div}
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.45, delay: index * 0.1 }}
                          sx={{
                            width: 31,
                            height: 31,
                            flexShrink: 0,
                            borderRadius: "11px",
                            bgcolor: index === 0 ? brand.red : "rgba(139,1,1,.08)",
                            color: index === 0 ? "#fff" : brand.red,
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 950,
                            fontSize: 13,
                          }}
                        >
                          {index + 1}
                        </Box>

                        <Typography sx={{ fontWeight: 850, color: "#475569", fontSize: 14 }}>
                          {step.title}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Box
        id="overview"
        sx={{
          bgcolor: "#fff",
          color: brand.text,
          py: { xs: 10, md: 17 },
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                component={motion.div}
                variants={fadeLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: 42, md: 86 },
                    lineHeight: { xs: "48px", md: "88px" },
                    fontWeight: 950,
                    letterSpacing: "-0.075em",
                  }}
                >
                  Nima qiladi?
                </Typography>

                <Typography
                  sx={{
                    mt: 3,
                    fontSize: { xs: 18, md: 24 },
                    lineHeight: { xs: "31px", md: "39px" },
                    color: brand.muted,
                    fontWeight: 700,
                  }}
                >
                  Zerr CRM korxona ichidagi asosiy hisob-kitoblarni bitta joyga jamlaydi: savdo,
                  ombor, ishchi, qarz, oylik va foyda.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                component={motion.div}
                variants={fadeRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: "38px",
                  bgcolor: "#f6f6f6",
                  border: "1px solid rgba(15,23,42,.06)",
                }}
              >
                {[
                  ["Daftar kerak emas", "Har bir amal tizimda saqlanadi."],
                  [
                    "Excel chalkashligi kamayadi",
                    "Formulalar o‘rniga avtomatik hisob-kitob ishlaydi.",
                  ],
                  ["Rahbar nazorati kuchayadi", "Kim nima qilgani audit logda ko‘rinadi."],
                  ["Hisobot tez chiqadi", "Kunlik, haftalik va oylik natijalar tayyor bo‘ladi."],
                ].map(([title, text], index) => (
                  <Box
                    key={title}
                    component={motion.div}
                    initial={{ opacity: 0, y: 35 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.65, delay: index * 0.12 }}
                    sx={{
                      display: "flex",
                      gap: 2,
                      py: 2.2,
                      borderBottom: index === 3 ? "none" : "1px solid rgba(15,23,42,.08)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        flexShrink: 0,
                        borderRadius: "15px",
                        bgcolor: index === 0 ? brand.red : "#fff",
                        color: index === 0 ? "#fff" : brand.red,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 950,
                      }}
                    >
                      ✓
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 950, fontSize: 18 }}>{title}</Typography>
                      <Typography sx={{ mt: 0.5, color: brand.muted, fontWeight: 650 }}>
                        {text}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box
        id="features"
        sx={{
          bgcolor: "#fff",
          color: brand.text,
          pb: { xs: 10, md: 17 },
        }}
      >
        <Container maxWidth="xl">
          <Box
            component={motion.div}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.28 }}
            sx={{ textAlign: "center", maxWidth: 960, mx: "auto" }}
          >
            <Typography
              sx={{
                fontSize: { xs: 42, md: 86 },
                lineHeight: { xs: "48px", md: "88px" },
                fontWeight: 950,
                letterSpacing: "-0.075em",
              }}
            >
              CRM nimalarni hisoblaydi?
            </Typography>

            <Typography
              sx={{
                mt: 3,
                fontSize: { xs: 17, md: 23 },
                lineHeight: { xs: "30px", md: "38px" },
                color: brand.muted,
                fontWeight: 700,
              }}
            >
              Foydalanuvchi landing page’ni ko‘rgan zahoti loyiha nima foyda berishini tushunishi
              kerak.
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mt: 8 }}>
            {features.map((item, index) => (
              <FeatureCard key={item.title} item={item} index={index} />
            ))}
          </Grid>
        </Container>
      </Box>

      <Box
        id="process"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          bgcolor: brand.dark,
          color: "#fff",
          py: { xs: 10, md: 17 },
          background:
            "radial-gradient(circle at 18% 20%, rgba(139,1,1,.34), transparent 34%), radial-gradient(circle at 90% 80%, rgba(255,255,255,.08), transparent 26%), #050505",
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={7} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                component={motion.div}
                variants={fadeLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: 42, md: 84 },
                    lineHeight: { xs: "48px", md: "86px" },
                    fontWeight: 950,
                    letterSpacing: "-0.075em",
                  }}
                >
                  Qanday ishlaydi?
                </Typography>

                <Typography
                  sx={{
                    mt: 3,
                    fontSize: { xs: 17, md: 22 },
                    lineHeight: "35px",
                    color: "rgba(255,255,255,.62)",
                    fontWeight: 650,
                  }}
                >
                  Tizimning ishlash tartibi oddiy: ma’lumot kiritiladi, CRM esa qoldiq, qarz, oylik
                  va hisobotlarni o‘zi yangilab boradi.
                </Typography>

                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.25 }}
                  sx={{
                    mt: 5,
                    p: 3,
                    borderRadius: "28px",
                    bgcolor: "rgba(255,255,255,.08)",
                    border: "1px solid rgba(255,255,255,.10)",
                  }}
                >
                  <Typography sx={{ color: "#fca5a5", fontWeight: 950 }}>Natija:</Typography>
                  <Typography sx={{ mt: 1, fontSize: 20, fontWeight: 900 }}>
                    Rahbar istalgan vaqtda korxona holatini ko‘ra oladi.
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                component={motion.div}
                variants={fadeRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: "42px",
                  bgcolor: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.12)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {steps.map((step, index) => (
                  <Box
                    key={step.title}
                    component={motion.div}
                    initial={{ opacity: 0, x: 45 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.65, delay: index * 0.13 }}
                    sx={{
                      display: "flex",
                      gap: 2,
                      py: 2.7,
                      borderBottom:
                        index === steps.length - 1 ? "none" : "1px solid rgba(255,255,255,.1)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        borderRadius: "17px",
                        bgcolor: index === 0 ? "#fff" : "rgba(255,255,255,.1)",
                        color: index === 0 ? brand.red : "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 950,
                      }}
                    >
                      {index + 1}
                    </Box>

                    <Box>
                      <Typography sx={{ fontSize: 18, fontWeight: 950 }}>{step.title}</Typography>
                      <Typography
                        sx={{
                          mt: 0.8,
                          color: "rgba(255,255,255,.56)",
                          fontWeight: 600,
                          lineHeight: "25px",
                        }}
                      >
                        {step.text}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ bgcolor: "#fff", color: brand.text, py: { xs: 10, md: 17 } }}>
        <Container maxWidth="xl">
          <Paper
            component={motion.div}
            variants={cardIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.28 }}
            elevation={0}
            sx={{
              minHeight: 560,
              p: { xs: 4, md: 8 },
              borderRadius: { xs: "38px", md: "62px" },
              bgcolor: brand.red,
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 50px 130px rgba(139,1,1,.28)",
            }}
          >
            <Box
              component={motion.div}
              animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.22, 0.12] }}
              transition={{ duration: 5, repeat: Infinity }}
              sx={{
                position: "absolute",
                right: -120,
                top: -120,
                width: 380,
                height: 380,
                borderRadius: "50%",
                bgcolor: "#fff",
              }}
            />

            <Typography
              sx={{
                maxWidth: 960,
                fontSize: { xs: 43, md: 88 },
                lineHeight: { xs: "49px", md: "90px" },
                fontWeight: 950,
                letterSpacing: "-0.075em",
                position: "relative",
              }}
            >
              Korxonangizni bugundan raqamli boshqaring.
            </Typography>

            <Typography
              sx={{
                mt: 3,
                maxWidth: 740,
                fontSize: { xs: 17, md: 22 },
                lineHeight: "35px",
                color: "rgba(255,255,255,.76)",
                fontWeight: 650,
                position: "relative",
              }}
            >
              Zerr CRM test rejimida. Landing page foydalanuvchini jalb qiladi, tizim
              imkoniyatlarini tushuntiradi va login qilishga undaydi.
            </Typography>

            <Box sx={{ mt: 5, display: "flex", gap: 2, flexWrap: "wrap", position: "relative" }}>
              <Button
                variant="contained"
                onClick={() => navigate("/login")}
                sx={{
                  bgcolor: "#fff",
                  color: brand.red,
                  borderRadius: "999px",
                  px: 4.5,
                  py: 1.6,
                  textTransform: "none",
                  fontWeight: 950,
                  fontSize: 16,
                  "&:hover": { bgcolor: "#fff7ed" },
                }}
              >
                Login qilish
              </Button>

              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                sx={{
                  color: "#fff",
                  borderRadius: "999px",
                  px: 4.5,
                  py: 1.6,
                  textTransform: "none",
                  fontWeight: 950,
                  fontSize: 16,
                  background: "rgba(255,255,255,.12)",
                  border: "1px solid rgba(255,255,255,.18)",
                  "&:hover": { background: "rgba(255,255,255,.18)" },
                }}
              >
                Yuqoriga qaytish
              </Button>
            </Box>
          </Paper>

          <Typography
            sx={{
              py: 5,
              textAlign: "center",
              color: brand.muted,
              fontWeight: 750,
            }}
          >
            © 2026 Zerr CRM — ishlab chiqarish va savdo boshqaruv tizimi.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
