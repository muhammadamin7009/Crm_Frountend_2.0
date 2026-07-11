import { Box, Button, Container, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import mrLogo from "../../images/mr-logo.png";

const brand = {
  red: "#971d21",
  redDark: "#761518",
  ink: "#07070b",
  panel: "#0f172a",
  text: "#0f172a",
  muted: "#64748b",
  line: "#e6edf5",
  soft: "#f7f9fc",
  soft2: "#eef4fb",
  gold: "#d8a23a",
  green: "#10b981",
  blue: "#2563eb",
  violet: "#7c3aed",
  white: "#ffffff",
};

const smooth = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 46 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: smooth },
  },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: smooth },
  },
};

const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: smooth },
  },
};

const zoomIn = {
  hidden: { opacity: 0, scale: 0.94, y: 34 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.8, ease: smooth },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const summaryCards = [
  {
    label: "Jami savdo",
    value: "7,700,000 so'm",
    caption: "3 ta savdo",
    color: brand.blue,
  },
  {
    label: "Mijozlardan tushum",
    value: "5,500,000 so'm",
    caption: "Qarz: 2,200,000 so'm",
    color: brand.green,
  },
  {
    label: "Tayyor mahsulot",
    value: "1,000 ta",
    caption: "Bu oy tayyorlangan",
    color: brand.violet,
  },
  {
    label: "Kutilayotgan to'lov",
    value: "2,200,000 so'm",
    caption: "Mijozlar qarzi",
    color: brand.gold,
  },
];

const modules = [
  {
    title: "Mijoz savdosi",
    text: "Mijoz bir vaqtda bir nechta mahsulot oladi. Tizim jami summa, to'langan pul va qolgan qarzni avtomatik chiqaradi.",
    metric: "Qarz nazorati",
  },
  {
    title: "Ishlab chiqarish",
    text: "Kroy, tikuv, kosib va qadoqlash bo'limlarida qaysi ishchi qancha mahsulot qilgani aniq yoziladi.",
    metric: "Bo'lim kesimi",
  },
  {
    title: "Ish haqi va avans",
    text: "Payshanba oylik berishda yangi ish haqi, oldingi qoldiq, avans va beriladigan summa ko'rinadi.",
    metric: "Haftalik hisob",
  },
  {
    title: "Homashyo xaridi",
    text: "Ta'minotchidan nima keldi, nechta keldi, nech puldan keldi va qancha qarz qoldi, hammasi saqlanadi.",
    metric: "Xarid va qarz",
  },
  {
    title: "Korxonalar boshqaruvi",
    text: "Bir nechta korxona alohida yuradi. Har birida alohida foydalanuvchi, obuna va ma'lumotlar bo'ladi.",
    metric: "Korxona nazorati",
  },
  {
    title: "Xavfsizlik",
    text: "Tasdiqlash, faol qurilmalar va amallar tarixi orqali rahbar nazorati kuchayadi.",
    metric: "Ikki bosqichli kirish",
  },
];

const plans = [
  { name: "Boshlang'ich", price: "299,000", users: "15 foydalanuvchi" },
  { name: "Kengaytirilgan", price: "399,000", users: "30 foydalanuvchi", featured: true },
  { name: "Korxona", price: "499,000", users: "60 foydalanuvchi" },
  { name: "Maxsus", price: "Kelishiladi", users: "100+ foydalanuvchi" },
];

const process = [
  "Mahsulot, bo'lim narxi va hodimlar kiritiladi",
  "Ishchi bajargan ishlar hisobotga yoziladi",
  "Mijozga bir nechta mahsulot sotiladi",
  "Homashyo xaridi va ta'minotchi qarzi qayd qilinadi",
  "Rahbar bosh sahifada umumiy holatni ko'radi",
];

const adPoints = [
  "Mijozga qancha sotildi, qancha pul tushdi va qancha qarz qoldi",
  "Ishchi qaysi bo'limda qancha mahsulot qildi va qancha ish haqi oldi",
  "Homashyo kimdan olindi, qancha to'landi va ta'minotchiga qancha qarz bor",
  "Adminlar faqat rahbar ruxsat bergan bo'limlarni boshqaradi",
];

function LogoMark({ dark = false, size = 48 }) {
  return (
    <Box
      component={motion.div}
      whileHover={{ rotate: -4, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      sx={{
        width: size,
        height: size,
        borderRadius: "16px",
        border: dark ? "1px solid rgba(255,255,255,.16)" : `1px solid ${brand.line}`,
        bgcolor: dark ? "rgba(255,255,255,.96)" : "#fff",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        boxShadow: dark ? "0 16px 40px rgba(255,255,255,.08)" : "0 14px 34px rgba(15,23,42,.07)",
      }}
    >
      <Box
        component="img"
        src={mrLogo}
        alt="MR belgisi"
        sx={{ width: "76%", height: "76%", objectFit: "contain" }}
      />
    </Box>
  );
}

function SectionTitle({ label, title, text, center = false }) {
  return (
    <Box
      component={motion.div}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      sx={{
        maxWidth: center ? 860 : 760,
        mx: center ? "auto" : 0,
        textAlign: center ? "center" : "left",
      }}
    >
      <Typography sx={{ color: brand.red, fontWeight: 950 }}>{label}</Typography>

      <Typography
        sx={{
          mt: 1,
          fontSize: { xs: 34, md: 56 },
          lineHeight: { xs: "42px", md: "64px" },
          fontWeight: 950,
          letterSpacing: "-.05em",
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 1.5,
          color: brand.muted,
          fontSize: 18,
          lineHeight: "30px",
          fontWeight: 650,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

function MetricCard({ item, index }) {
  return (
    <Paper
      component={motion.div}
      variants={zoomIn}
      whileHover={{ y: -8, scale: 1.02 }}
      elevation={0}
      sx={{
        p: 2.4,
        border: index === 0 ? "1px solid rgba(151,29,33,.26)" : `1px solid ${brand.line}`,
        borderRadius: "24px !important",
        bgcolor: index === 0 ? brand.red : "#fff",
        color: index === 0 ? "#fff" : brand.text,
        height: "100%",
        boxShadow:
          index === 0 ? "0 24px 60px rgba(151,29,33,.22)" : "0 16px 42px rgba(15,23,42,.06)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography
            sx={{
              color: index === 0 ? "rgba(255,255,255,.72)" : brand.muted,
              fontSize: 13,
              fontWeight: 850,
            }}
          >
            {item.label}
          </Typography>

          <Typography
            sx={{
              mt: 0.8,
              fontSize: { xs: 22, md: 25 },
              fontWeight: 950,
              letterSpacing: "-.03em",
            }}
          >
            {item.value}
          </Typography>

          <Typography
            sx={{
              mt: 0.4,
              color: index === 0 ? "rgba(255,255,255,.68)" : brand.muted,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {item.caption}
          </Typography>
        </Box>

        <Box
          component={motion.div}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.2 }}
          sx={{
            width: 42,
            height: 42,
            borderRadius: "14px",
            bgcolor: index === 0 ? "rgba(255,255,255,.16)" : item.color,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontWeight: 950,
            boxShadow: index === 0 ? "none" : `0 14px 28px ${item.color}33`,
          }}
        >
          {item.label[0]}
        </Box>
      </Stack>
    </Paper>
  );
}

function DashboardMockup() {
  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 70, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.4, ease: smooth }}
      elevation={0}
      sx={{
        borderRadius: "36px !important",
        overflow: "hidden",
        bgcolor: "#f8fafc",
        border: "1px solid rgba(255,255,255,.24)",
        boxShadow: "0 50px 130px rgba(0,0,0,.38)",
      }}
    >
      <Box
        sx={{
          px: { xs: 2, md: 2.8 },
          py: 2,
          bgcolor: "#fff",
          borderBottom: `1px solid ${brand.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.4} alignItems="center">
          <LogoMark size={42} />
          <Box>
            <Typography sx={{ color: brand.text, fontWeight: 950 }}>Al-amin CRM bosh sahifa</Typography>
            <Typography sx={{ color: brand.muted, fontSize: 12, fontWeight: 700 }}>
              Rahbar uchun asosiy ko'rsatkichlar
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
          {["Bu oy", "O'tgan oy", "Ko'rish"].map((item, index) => (
            <Box
              key={item}
              sx={{
                px: 1.4,
                py: 0.8,
                borderRadius: "999px",
                border: `1px solid ${brand.line}`,
                color: index === 2 ? "#fff" : brand.text,
                bgcolor: index === 2 ? brand.red : "#fff",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {item}
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Grid
          component={motion.div}
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          container
          spacing={2}
        >
          {summaryCards.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <MetricCard item={item} index={index} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} lg={5}>
            <Paper
              component={motion.div}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              elevation={0}
              sx={{
                p: 2.5,
                height: 290,
                border: `1px solid ${brand.line}`,
                borderRadius: "24px !important",
                bgcolor: "#fff",
                boxShadow: "0 16px 40px rgba(15,23,42,.05)",
              }}
            >
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: brand.text, fontWeight: 950 }}>
                  Savdo va ishlab chiqarish
                </Typography>

                <Typography
                  sx={{
                    px: 1.2,
                    py: 0.4,
                    borderRadius: 999,
                    bgcolor: "#eef2ff",
                    color: brand.text,
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  Oy kesimi
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="end" spacing={2.5} sx={{ height: 202, mt: 2 }}>
                {[
                  ["Savdo", "7.7 mln", 154, brand.blue],
                  ["Xarid", "750 ming", 66, brand.gold],
                  ["Tayyor", "1,000 ta", 112, brand.green],
                ].map(([label, value, height, color], index) => (
                  <Box key={label} sx={{ flex: 1, textAlign: "center" }}>
                    <Box
                      component={motion.div}
                      initial={{ height: 0 }}
                      whileInView={{ height }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.85, delay: index * 0.12, ease: smooth }}
                      sx={{
                        width: "58%",
                        mx: "auto",
                        borderRadius: "18px 18px 0 0",
                        bgcolor: color,
                      }}
                    />
                    <Typography sx={{ mt: 1, color: brand.text, fontWeight: 900 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ color: brand.muted, fontSize: 13, fontWeight: 800 }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Paper
              component={motion.div}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              elevation={0}
              sx={{
                p: 2.5,
                height: 290,
                border: `1px solid ${brand.line}`,
                borderRadius: "24px !important",
                bgcolor: "#fff",
                boxShadow: "0 16px 40px rgba(15,23,42,.05)",
              }}
            >
              <Typography sx={{ color: brand.text, fontWeight: 950 }}>Bo'limlar kesimi</Typography>

              {[
                ["Kosib", 100, 18],
                ["Tikuv", 435, 48],
                ["Qadoqlash", 1000, 100],
              ].map(([label, value, width], index) => (
                <Box key={label} sx={{ mt: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: brand.text, fontWeight: 850 }}>{label}</Typography>
                    <Typography sx={{ color: brand.muted, fontWeight: 850 }}>{value}</Typography>
                  </Stack>

                  <Box sx={{ mt: 0.8, height: 8, borderRadius: 999, bgcolor: "#edf2f7" }}>
                    <Box
                      component={motion.div}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${width}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.15, ease: smooth }}
                      sx={{
                        height: "100%",
                        borderRadius: 999,
                        bgcolor: index === 2 ? brand.red : brand.violet,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Paper
              component={motion.div}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              elevation={0}
              sx={{
                p: 2.5,
                height: 290,
                border: `1px solid ${brand.line}`,
                borderRadius: "24px !important",
                bgcolor: "#fff",
                boxShadow: "0 16px 40px rgba(15,23,42,.05)",
              }}
            >
              <Typography sx={{ color: brand.text, fontWeight: 950 }}>Muhim nazorat</Typography>

              {[
                ["Mijozlardan olinadi", "2,200,000 so'm"],
                ["Ta'minotchiga qarz", "1,250,000 so'm"],
                ["Berilmagan ish haqi", "225,000 so'm"],
              ].map(([label, value], index) => (
                <Box
                  key={label}
                  component={motion.div}
                  initial={{ opacity: 0, x: 26 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: index * 0.12 }}
                  sx={{
                    mt: 1.5,
                    p: 1.4,
                    borderRadius: "16px",
                    bgcolor: "#f8fafc",
                    border: `1px solid ${brand.line}`,
                  }}
                >
                  <Typography sx={{ color: brand.text, fontSize: 13, fontWeight: 850 }}>
                    {label}
                  </Typography>
                  <Typography sx={{ mt: 0.3, color: brand.red, fontSize: 13, fontWeight: 950 }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

function ModuleCard({ item, index }) {
  const dark = index === 1 || index === 4;

  return (
    <Grid item xs={12} md={6} xl={4} sx={{ display: "flex" }}>
      <Paper
        component={motion.div}
        variants={zoomIn}
        whileHover={{ y: -10, scale: 1.015 }}
        elevation={0}
        sx={{
          p: 3.2,
          flex: 1,
          minHeight: 290,
          borderRadius: "30px !important",
          border: dark ? "1px solid rgba(255,255,255,.10)" : `1px solid ${brand.line}`,
          bgcolor: dark ? brand.panel : "#fff",
          color: dark ? "#fff" : brand.text,
          boxShadow: dark ? "0 28px 80px rgba(15,23,42,.22)" : "0 18px 50px rgba(15,23,42,.06)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.14, 1],
            opacity: dark ? [0.08, 0.16, 0.08] : [0.06, 0.12, 0.06],
          }}
          transition={{ duration: 4.8, repeat: Infinity, delay: index * 0.2 }}
          sx={{
            position: "absolute",
            width: 180,
            height: 180,
            right: -72,
            top: -72,
            borderRadius: "50%",
            bgcolor: dark ? "#fff" : brand.red,
          }}
        />

        <Box sx={{ position: "relative" }}>
          <Typography sx={{ color: dark ? "#fca5a5" : brand.red, fontSize: 13, fontWeight: 950 }}>
            {String(index + 1).padStart(2, "0")}
          </Typography>

          <Typography
            sx={{
              mt: 1.8,
              fontSize: 23,
              fontWeight: 950,
              letterSpacing: "-.03em",
            }}
          >
            {item.title}
          </Typography>

          <Typography
            sx={{
              mt: 1.3,
              color: dark ? "rgba(255,255,255,.64)" : brand.muted,
              lineHeight: "27px",
              fontWeight: 650,
            }}
          >
            {item.text}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 2.8,
            display: "inline-flex",
            width: "fit-content",
            px: 1.4,
            py: 0.8,
            borderRadius: 999,
            bgcolor: dark ? "rgba(255,255,255,.10)" : "#f8fafc",
            border: dark ? "1px solid rgba(255,255,255,.12)" : `1px solid ${brand.line}`,
            color: dark ? "#fff" : brand.text,
            fontSize: 12,
            fontWeight: 900,
            position: "relative",
          }}
        >
          {item.metric}
        </Box>
      </Paper>
    </Grid>
  );
}

function PlanCard({ plan }) {
  return (
    <Grid item xs={12} sm={6} lg={3} sx={{ display: "flex" }}>
      <Paper
        component={motion.div}
        variants={zoomIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        whileHover={{ y: -10, scale: 1.015 }}
        elevation={0}
        sx={{
          p: 3,
          flex: 1,
          borderRadius: "30px !important",
          border: plan.featured ? `2px solid ${brand.red}` : `1px solid ${brand.line}`,
          bgcolor: "#fff",
          boxShadow: plan.featured
            ? "0 28px 80px rgba(151,29,33,.16)"
            : "0 18px 50px rgba(15,23,42,.06)",
        }}
      >
        <Typography
          sx={{ color: plan.featured ? brand.red : brand.text, fontSize: 20, fontWeight: 950 }}
        >
          {plan.name}
        </Typography>

        <Typography
          sx={{
            mt: 1.5,
            fontSize: 34,
            fontWeight: 950,
            letterSpacing: "-.04em",
          }}
        >
          {plan.price}
        </Typography>

        <Typography sx={{ color: brand.muted, fontWeight: 800 }}>
          {plan.price === "Kelishiladi" ? "maxsus reja" : "so'm / oy"}
        </Typography>

        <Divider sx={{ my: 2.2 }} />

        <Typography sx={{ fontWeight: 900 }}>{plan.users}</Typography>

        <Typography
          sx={{
            mt: 1,
            color: brand.muted,
            lineHeight: "25px",
            fontWeight: 650,
          }}
        >
          Savdo, oylik, qarzlar, xavfsizlik, amallar tarixi va platforma nazorati.
        </Typography>
      </Paper>
    </Grid>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();

  const heroY = useTransform(scrollYProgress, [0, 0.24], [0, -70]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.24], [1, 0.28]);
  const logoY = useTransform(scrollYProgress, [0, 0.28], [0, 80]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: brand.soft,
        color: brand.text,
        overflowX: "hidden",
        overflowY: "visible",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          bgcolor: "rgba(255,255,255,.82)",
          backdropFilter: "blur(18px)",
          borderBottom: `1px solid ${brand.line}`,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              minHeight: 76,
              display: "grid",
              gridTemplateColumns: { xs: "1fr auto", md: "240px 1fr 260px" },
              alignItems: "center",
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={1.4} alignItems="center">
              <LogoMark size={44} />
              <Box>
                <Typography sx={{ color: brand.text, fontWeight: 950, fontSize: 20 }}>
                  Al-amin CRM
                </Typography>
                <Typography sx={{ color: brand.muted, fontSize: 12, fontWeight: 750 }}>
                  Asoschi MR
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={4}
              justifyContent="center"
              alignItems="center"
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              <Button
                onClick={() =>
                  document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{ color: brand.text, fontWeight: 900, textTransform: "none" }}
              >
                Imkoniyatlar
              </Button>

              <Button
                onClick={() =>
                  document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{ color: brand.text, fontWeight: 900, textTransform: "none" }}
              >
                Narxlar
              </Button>

              <Button
                onClick={() =>
                  document.getElementById("telegram-ad")?.scrollIntoView({ behavior: "smooth" })
                }
                sx={{ color: brand.text, fontWeight: 900, textTransform: "none" }}
              >
                Reklama
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              justifyContent={{ xs: "flex-end", md: "flex-end" }}
              alignItems="center"
            >
              <Button
                variant="outlined"
                onClick={() => navigate("/login")}
                sx={{
                  borderColor: brand.line,
                  color: brand.text,
                  borderRadius: "16px",
                  px: 2.7,
                  py: 1.2,
                  fontWeight: 900,
                  textTransform: "none",
                  minWidth: 92,
                }}
              >
                Kirish
              </Button>

              <Button
                variant="contained"
                onClick={() => navigate("/register")}
                sx={{
                  bgcolor: brand.red,
                  borderRadius: "16px",
                  px: 2.8,
                  py: 1.2,
                  fontWeight: 950,
                  textTransform: "none",
                  minWidth: 148,
                  boxShadow: "0 16px 38px rgba(151,29,33,.24)",
                  "&:hover": { bgcolor: brand.redDark },
                }}
              >
                Sinab ko'rish
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Box
        sx={{
          position: "relative",
          minHeight: "calc(100vh - 76px)",
          py: { xs: 8, md: 10 },
          bgcolor: brand.ink,
          color: "#fff",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 18% 18%, rgba(151,29,33,.36), transparent 28%), radial-gradient(circle at 88% 70%, rgba(216,162,58,.14), transparent 30%), linear-gradient(135deg,#050507 0%,#09090b 52%,#111827 100%)",
        }}
      >
        <Box
          component={motion.img}
          src={mrLogo}
          alt="MR belgisi"
          style={{ y: logoY }}
          animate={{ rotate: [0, 2, 0], scale: [1, 1.04, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            position: "absolute",
            right: { xs: -150, md: -45 },
            top: { xs: 120, md: 45 },
            width: { xs: 380, md: 650 },
            opacity: 0.055,
            filter: "invert(1)",
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="xl" sx={{ position: "relative" }}>
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                component={motion.div}
                style={{ y: heroY, opacity: heroOpacity }}
                variants={stagger}
                initial="hidden"
                animate="visible"
              >
                <Stack
                  component={motion.div}
                  variants={fadeUp}
                  direction="row"
                  spacing={1.4}
                  alignItems="center"
                  sx={{ mb: 3 }}
                >
                  <LogoMark dark size={58} />
                  <Box>
                    <Typography sx={{ color: "#fff", fontSize: 24, fontWeight: 950 }}>
                      Al-amin CRM
                    </Typography>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,.6)",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      MR asos solgan boshqaruv tizimi
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  component={motion.h1}
                  variants={fadeUp}
                  sx={{
                    maxWidth: 790,
                    fontSize: { xs: 46, sm: 62, md: 78 },
                    lineHeight: { xs: "54px", sm: "70px", md: "86px" },
                    fontWeight: 950,
                    letterSpacing: "-.055em",
                  }}
                >
                  Poyabzal korxonasi hisobini premium darajada boshqaring
                </Typography>

                <Typography
                  component={motion.p}
                  variants={fadeUp}
                  sx={{
                    mt: 2.5,
                    maxWidth: 700,
                    color: "rgba(255,255,255,.68)",
                    fontSize: { xs: 16, md: 20 },
                    lineHeight: "32px",
                    fontWeight: 650,
                  }}
                >
                  Savdo, mijoz qarzi, ishchi mehnati, oylik, avans, homashyo xaridi va rahbar
                  nazorati bitta chiroyli bosh sahifada jamlanadi.
                </Typography>

                <Stack
                  component={motion.div}
                  variants={fadeUp}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ mt: 4 }}
                >
                  <Button
                    variant="contained"
                    onClick={() => navigate("/register")}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: "999px",
                      bgcolor: brand.red,
                      fontWeight: 950,
                      textTransform: "none",
                      "&:hover": { bgcolor: brand.redDark },
                    }}
                  >
                    Korxona uchun boshlash
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() =>
                      document.getElementById("logo-sample")?.scrollIntoView({ behavior: "smooth" })
                    }
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: "999px",
                      color: "#fff",
                      borderColor: "rgba(255,255,255,.24)",
                      fontWeight: 950,
                      textTransform: "none",
                      "&:hover": {
                        borderColor: "#fff",
                        bgcolor: "rgba(255,255,255,.08)",
                      },
                    }}
                  >
                    Belgi namunasi
                  </Button>
                </Stack>

                <Stack
                  component={motion.div}
                  variants={fadeUp}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ mt: 4, color: "rgba(255,255,255,.72)" }}
                >
                  {["Tasdiqlash", "Amallar tarixi", "Obuna nazorati"].map((item) => (
                    <Typography key={item} sx={{ fontSize: 13, fontWeight: 900 }}>
                      {item}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <DashboardMockup />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box id="logo-sample" sx={{ py: { xs: 8, md: 11 }, bgcolor: "#fff" }}>
        <Container maxWidth="xl">
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={5}>
              <Paper
                component={motion.div}
                variants={fadeLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                elevation={0}
                sx={{
                  height: "100%",
                  p: { xs: 3, md: 4 },
                  borderRadius: "34px !important",
                  border: `1px solid ${brand.line}`,
                  bgcolor: brand.ink,
                  color: "#fff",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0 28px 80px rgba(15,23,42,.18)",
                }}
              >
                <Box
                  component={motion.img}
                  src={mrLogo}
                  alt="MR belgisi"
                  animate={{ y: [0, -12, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  sx={{
                    width: "72%",
                    maxWidth: 360,
                    display: "block",
                    mx: "auto",
                    mt: 2,
                    filter: "invert(1)",
                  }}
                />
                <Typography
                  sx={{
                    mt: 3,
                    textAlign: "center",
                    color: "rgba(255,255,255,.72)",
                    fontWeight: 850,
                  }}
                >
                  Asoschi belgisi: MR
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper
                component={motion.div}
                variants={fadeRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                elevation={0}
                sx={{
                  height: "100%",
                  p: { xs: 3, md: 4 },
                  borderRadius: "34px !important",
                  border: `1px solid ${brand.line}`,
                  bgcolor: "#fff",
                  boxShadow: "0 22px 70px rgba(15,23,42,.08)",
                }}
              >
                <Typography sx={{ color: brand.red, fontWeight: 950 }}>Brend namunasi</Typography>

                <Typography
                  sx={{
                    mt: 1,
                    fontSize: { xs: 36, md: 60 },
                    lineHeight: { xs: "44px", md: "68px" },
                    fontWeight: 950,
                    letterSpacing: "-.05em",
                  }}
                >
                  Al-amin CRM
                </Typography>

                <Typography
                  sx={{
                    mt: 1.5,
                    maxWidth: 700,
                    color: brand.muted,
                    fontSize: 18,
                    lineHeight: "30px",
                    fontWeight: 650,
                  }}
                >
                  Asosiy signal shu bo'ladi: MR belgisi, Al-amin CRM nomi va poyabzal korxonasining real
                  hisob-kitobini boshqaradigan premium tizim.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4} sx={{ mt: 3 }}>
                  {["Al-amin CRM", "Poyabzal tizimi", "Korxona nazorati"].map((item) => (
                    <Box
                      key={item}
                      component={motion.div}
                      whileHover={{ y: -5 }}
                      sx={{
                        px: 1.7,
                        py: 1,
                        borderRadius: "999px",
                        border: `1px solid ${brand.line}`,
                        fontWeight: 900,
                        width: "fit-content",
                      }}
                    >
                      {item}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box id="modules" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.soft }}>
        <Container maxWidth="xl">
          <SectionTitle
            label="Tizim imkoniyatlari"
            title="Rahbar bitta qarashda korxona pulini, ishini va qarzini ko'radi"
            text="Sahifalar ko'p bo'lishi mumkin, lekin maqsad bitta: hisob-kitob adashmasin va qaror tez chiqsin."
          />

          <Grid
            component={motion.div}
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            container
            spacing={3}
            sx={{ mt: 4 }}
          >
            {modules.map((item, index) => (
              <ModuleCard key={item.title} item={item} index={index} />
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 8, md: 11 }, bgcolor: "#fff" }}>
        <Container maxWidth="xl">
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={4}>
              <Paper
                component={motion.div}
                variants={fadeLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                elevation={0}
                sx={{
                  p: 3.5,
                  height: "100%",
                  borderRadius: "34px !important",
                  border: `1px solid ${brand.line}`,
                  bgcolor: brand.panel,
                  color: "#fff",
                  boxShadow: "0 28px 80px rgba(15,23,42,.18)",
                }}
              >
                <Typography sx={{ color: "rgba(255,255,255,.58)", fontWeight: 900 }}>
                  Ish jarayoni
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    fontSize: { xs: 32, md: 44 },
                    lineHeight: { xs: "40px", md: "52px" },
                    fontWeight: 950,
                    letterSpacing: "-.045em",
                  }}
                >
                  Kiritasiz, tizim hisoblaydi
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    color: "rgba(255,255,255,.64)",
                    lineHeight: "28px",
                    fontWeight: 650,
                  }}
                >
                  Al-amin CRM har bir yozuvni bosh sahifa, qarzdorlik, ish haqi va amallar tarixi bilan
                  bog'laydi.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper
                component={motion.div}
                variants={fadeRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: "34px !important",
                  border: `1px solid ${brand.line}`,
                  bgcolor: "#fff",
                  boxShadow: "0 22px 70px rgba(15,23,42,.07)",
                }}
              >
                {process.map((item, index, arr) => (
                  <Box key={item}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 2.2 }}>
                      <Box
                        component={motion.div}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1, ease: smooth }}
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: "15px",
                          bgcolor: index === 0 ? brand.red : "#f1f5f9",
                          color: index === 0 ? "#fff" : brand.red,
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 950,
                        }}
                      >
                        {index + 1}
                      </Box>

                      <Typography sx={{ fontSize: 17, fontWeight: 900 }}>{item}</Typography>
                    </Stack>

                    {index !== arr.length - 1 && <Divider />}
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box id="plans" sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.soft2 }}>
        <Container maxWidth="xl">
          <SectionTitle
            label="Obuna rejalari"
            title="Korxona hajmiga qarab tanlanadi"
            text="Katta korxonalar uchun 100+ foydalanuvchili alohida taklif qilinadi."
            center
          />

          <Grid container spacing={3} sx={{ mt: 4 }}>
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </Grid>
        </Container>
      </Box>

      <Box id="telegram-ad" sx={{ py: { xs: 8, md: 11 }, bgcolor: "#fff" }}>
        <Container maxWidth="xl">
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={5}>
              <Paper
                component={motion.div}
                variants={fadeLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                elevation={0}
                sx={{
                  height: "100%",
                  p: { xs: 3, md: 4 },
                  borderRadius: "34px !important",
                  border: `1px solid ${brand.line}`,
                  bgcolor: brand.red,
                  color: "#fff",
                  boxShadow: "0 28px 80px rgba(151,29,33,.20)",
                }}
              >
                <Typography sx={{ color: "rgba(255,255,255,.72)", fontWeight: 900 }}>
                  Telegram reklama
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    fontSize: { xs: 32, md: 48 },
                    lineHeight: { xs: "40px", md: "56px" },
                    fontWeight: 950,
                    letterSpacing: "-.045em",
                  }}
                >
                  Poyabzal rahbariga bittada tushadigan taklif
                </Typography>

                <Typography
                  sx={{
                    mt: 2,
                    color: "rgba(255,255,255,.72)",
                    lineHeight: "28px",
                    fontWeight: 650,
                  }}
                >
                  Reklama matni hisob-kitobdagi og'riqni ko'rsatadi: savdo, qarz, ish haqi,
                  homashyo va admin nazorati bitta joyda.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper
                component={motion.div}
                variants={fadeRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                elevation={0}
                sx={{
                  height: "100%",
                  p: { xs: 3, md: 4 },
                  borderRadius: "34px !important",
                  border: `1px solid ${brand.line}`,
                  bgcolor: "#fff",
                  boxShadow: "0 22px 70px rgba(15,23,42,.08)",
                }}
              >
                <Typography sx={{ color: brand.red, fontWeight: 950 }}>
                  Qo'qon charm poyabzal guruhi uchun
                </Typography>

                <Typography
                  sx={{
                    mt: 1.4,
                    color: brand.text,
                    fontSize: { xs: 24, md: 32 },
                    lineHeight: { xs: "32px", md: "42px" },
                    fontWeight: 950,
                    letterSpacing: "-.035em",
                  }}
                >
                  Al-amin CRM - poyabzal korxonalarida savdo, ishlab chiqarish, oylik va
                  qarzdorlikni tartibga soladigan tizim.
                </Typography>

                <Grid container spacing={1.5} sx={{ mt: 3 }}>
                  {adPoints.map((item) => (
                    <Grid item xs={12} sm={6} key={item}>
                      <Box
                        component={motion.div}
                        whileHover={{ y: -4 }}
                        sx={{
                          p: 1.7,
                          minHeight: 92,
                          borderRadius: "18px",
                          border: `1px solid ${brand.line}`,
                          bgcolor: "#f8fafc",
                          fontWeight: 850,
                          lineHeight: "24px",
                        }}
                      >
                        {item}
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.4}
                  sx={{ mt: 3 }}
                >
                  <Button
                    variant="contained"
                    onClick={() => navigate("/register")}
                    sx={{
                      px: 3.4,
                      py: 1.4,
                      borderRadius: "999px",
                      bgcolor: brand.red,
                      fontWeight: 950,
                      textTransform: "none",
                      "&:hover": { bgcolor: brand.redDark },
                    }}
                  >
                    Korxonani ulash
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => navigate("/login")}
                    sx={{
                      px: 3.4,
                      py: 1.4,
                      borderRadius: "999px",
                      borderColor: brand.line,
                      color: brand.text,
                      fontWeight: 950,
                      textTransform: "none",
                    }}
                  >
                    Demo ko'rish
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 8, md: 11 }, bgcolor: brand.ink, color: "#fff" }}>
        <Container maxWidth="xl">
          <Paper
            component={motion.div}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              borderRadius: "42px !important",
              bgcolor: "#fff",
              color: brand.text,
              border: `1px solid ${brand.line}`,
              boxShadow: "0 40px 120px rgba(0,0,0,.30)",
              textAlign: "center",
            }}
          >
            <Box sx={{ maxWidth: 980, mx: "auto" }}>
              <Typography
                sx={{
                  fontSize: { xs: 34, md: 62 },
                  lineHeight: { xs: "42px", md: "70px" },
                  fontWeight: 950,
                  letterSpacing: "-.055em",
                }}
              >
                Al-amin CRM bilan korxonangiz hisobini tartibga keltiring
              </Typography>

              <Typography
                sx={{
                  mt: 1.8,
                  color: brand.muted,
                  fontSize: 18,
                  lineHeight: "31px",
                  fontWeight: 650,
                }}
              >
                Poyabzal ishlab chiqarishdagi real ish jarayoni: ishchi, mahsulot, homashyo, mijoz,
                qarz va oylik bir tizimda boshqariladi.
              </Typography>

              <Stack
                direction={{ xs: "column" , sm: "row" }}
                spacing={1.4}
                justifyContent="center"
                sx={{ mt: 4 }}
              >
                <Button
                  variant="contained"
                  onClick={() => navigate("/register")}
                  sx={{
                    px: 4.2,
                    py: 1.6,
                    borderRadius: "999px",
                    bgcolor: brand.red,
                    fontWeight: 950,
                    textTransform: "none",
                    boxShadow: "0 16px 34px rgba(151,29,33,.22)",
                    "&:hover": { bgcolor: brand.redDark },
                  }}
                >
                  Ro'yxatdan o'tish
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate("/login")}
                  sx={{
                    px: 4.2,
                    py: 1.6,
                    borderRadius: "999px",
                    borderColor: brand.line,
                    color: brand.text,
                    fontWeight: 950,
                    textTransform: "none",
                  }}
                >
                  Kirish
                </Button>
              </Stack>
            </Box>
          </Paper>

          <Typography
            sx={{
              mt: 4,
              textAlign: "center",
              color: "rgba(255,255,255,.58)",
              fontWeight: 750,
            }}
          >
            2026 Al-amin CRM. Asoschi MR. Poyabzal korxonalari uchun boshqaruv tizimi.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
