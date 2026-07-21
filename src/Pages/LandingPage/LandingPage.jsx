import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";

import mrLogo from "../../images/mr-logo.png";

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const metrics = [
  ["Jami savdo", "7,7 mln", "3 ta savdo", "blue"],
  ["Tushum", "5,5 mln", "Mijozlardan", "green"],
  ["Tayyor mahsulot", "1 000 ta", "Joriy oy", "violet"],
  ["Mijozlar qarzi", "2,2 mln", "Kutilayotgan to‘lov", "amber"],
];

const features = [
  {
    no: "01",
    title: "Mijoz savdosi",
    text: "Bir savdoda bir nechta mahsulot kiriting. Jami summa, to‘langan pul va qolgan qarz avtomatik hisoblanadi.",
    tag: "Savdo va qarzdorlik",
  },
  {
    no: "02",
    title: "Ishlab chiqarish",
    text: "Kroy, tikuv, kosib va qadoqlash bo‘limlarida har bir ishchining bajargan ishini aniq kuzating.",
    tag: "Bo‘lim va ishchi kesimi",
    dark: true,
  },
  {
    no: "03",
    title: "Ish haqi va avans",
    text: "Yangi ish haqi, avans, oldingi qoldiq va xodimga beriladigan yakuniy summani bitta joyda ko‘ring.",
    tag: "Haftalik hisob",
  },
  {
    no: "04",
    title: "Homashyo xaridi",
    text: "Ta’minotchidan kelgan homashyo, tannarx, to‘langan summa va qolgan qarzni nazorat qiling.",
    tag: "Xarid va ta’minotchi",
  },
  {
    no: "05",
    title: "Ombor nazorati",
    text: "Homashyo va tayyor mahsulot qoldig‘i, minimal miqdor, kirim-chiqim hamda inventarizatsiyani boshqaring.",
    tag: "Qoldiq va harakat",
    dark: true,
  },
  {
    no: "06",
    title: "Ruxsat va xavfsizlik",
    text: "Administratorlar faqat rahbar ruxsat bergan bo‘limlarni ko‘radi. Muhim amallar tarixda saqlanadi.",
    tag: "Nazorat va audit",
  },
];

const process = [
  ["Tizimni sozlang", "Mahsulotlar, bo‘lim narxlari, xodimlar va omborlarni kiriting."],
  [
    "Kundalik ishni yozing",
    "Savdo, ishlab chiqarish, xarid, to‘lov va qoldiq harakatlarini kiriting.",
  ],
  [
    "Hisobni tizimga topshiring",
    "Qarz, oylik, avans, tannarx va moliyaviy natija avtomatik hisoblanadi.",
  ],
  [
    "Rahbar sifatida nazorat qiling",
    "Bosh sahifada asosiy ko‘rsatkichlar va muhim ogohlantirishlarni ko‘ring.",
  ],
];

const plans = [
  ["Plus", "299 000", 15, 20, 2, "Kichik ishlab chiqarish jamoalari uchun."],
  ["Pro", "399 000", 30, 40, 4, "O‘sayotgan korxonalar uchun eng maqbul reja.", true],
  ["Business", "499 000", 60, 80, 10, "Bir nechta bo‘limi bor yirik korxonalar uchun."],
  [
    "Enterprise",
    "699 000",
    100,
    150,
    20,
    "Katta jamoa va keng nazorat talab qiladigan bizneslar uchun.",
  ],
];

const proof = [
  "Savdo va mijoz qarzi",
  "Ishchi mehnati va oylik",
  "Homashyo va ta’minotchi qarzi",
  "Ombor va inventarizatsiya",
];

const adPoints = [
  "Mijozga qancha sotildi, qancha pul tushdi va qancha qarz qoldi.",
  "Ishchi qaysi bo‘limda qancha mahsulot qildi va qancha ish haqi oldi.",
  "Homashyo kimdan olindi, qancha to‘landi va ta’minotchiga qancha qarz bor.",
  "Adminlar faqat rahbar ruxsat bergan bo‘limlarni boshqaradi.",
];

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

function Logo({ size = 42 }) {
  return (
    <Box
      component={motion.div}
      whileHover={{
        rotate: -4,
        scale: 1.05,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 18,
      }}
      className="lp-logo"
      sx={{
        width: size,
        height: size,
      }}
    >
      <Box component="img" src={mrLogo} alt="MR belgisi" />
    </Box>
  );
}

function Eyebrow({ children, center = false, dark = false }) {
  return (
    <Box className={`lp-eyebrow ${center ? "center" : ""} ${dark ? "dark" : ""}`}>
      <span />

      <Typography>{children}</Typography>
    </Box>
  );
}

function SectionHead({ eyebrow, title, text, center = false }) {
  return (
    <Box
      component={motion.div}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: true,
        amount: 0.25,
      }}
      className={`lp-section-head ${center ? "center" : ""}`}
    >
      <Eyebrow center={center}>{eyebrow}</Eyebrow>

      <Typography component="h2">{title}</Typography>

      <Typography component="p">{text}</Typography>
    </Box>
  );
}

function PreviewMetric({ item }) {
  const [label, value, helper, tone] = item;

  return (
    <Box className={`lp-preview-metric ${tone}`}>
      <Box className="lp-preview-metric-icon">{label.charAt(0)}</Box>

      <Typography className="lp-preview-metric-label">{label}</Typography>

      <Typography className="lp-preview-metric-value">{value}</Typography>

      <Typography className="lp-preview-metric-helper">{helper}</Typography>
    </Box>
  );
}

function DashboardPreview() {
  const bars = [
    ["Yan", 28],
    ["Fev", 42],
    ["Mar", 38],
    ["Apr", 61],
    ["May", 73],
    ["Iyun", 92],
  ];

  return (
    <Paper
      component={motion.div}
      initial={{
        opacity: 0,
        y: 60,
        scale: 0.96,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.9,
        delay: 0.28,
        ease,
      }}
      elevation={0}
      className="lp-preview"
    >
      <Box className="lp-preview-top">
        <Stack direction="row" spacing={1.1} alignItems="center">
          <Logo size={36} />

          <Box>
            <Typography className="lp-preview-title">Al Amin CRM</Typography>

            <Typography className="lp-preview-subtitle">Rahbar bosh sahifasi</Typography>
          </Box>
        </Stack>

        <Chip size="small" label="Joriy oy" className="lp-period-chip" />
      </Box>

      <Box className="lp-preview-content">
        <Box className="lp-preview-metrics">
          {metrics.map((item) => (
            <PreviewMetric key={item[0]} item={item} />
          ))}
        </Box>

        <Grid container spacing={1.2} sx={{ mt: 0.2 }}>
          <Grid item xs={12} md={7}>
            <Paper elevation={0} className="lp-preview-card">
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography className="lp-preview-card-title">Savdo dinamikasi</Typography>

                  <Typography className="lp-preview-card-helper">So‘nggi 6 oy</Typography>
                </Box>

                <Typography className="lp-growth">+18.4%</Typography>
              </Stack>

              <Stack direction="row" alignItems="flex-end" spacing={1.2} className="lp-bars">
                {bars.map(([label, height], index) => (
                  <Box key={label} className="lp-bar-column">
                    <Box
                      component={motion.div}
                      initial={{ height: 0 }}
                      whileInView={{ height }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.8,
                        delay: index * 0.08,
                        ease,
                      }}
                      className={`lp-bar ${index === bars.length - 1 ? "active" : ""}`}
                    />

                    <Typography>{label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper elevation={0} className="lp-preview-card">
              <Typography className="lp-preview-card-title">Muhim nazorat</Typography>

              <Stack spacing={0.9} sx={{ mt: 1.3 }}>
                {[
                  ["Mijozlardan olinadi", "2,2 mln so‘m", "red"],
                  ["Ta’minotchiga qarz", "1,25 mln so‘m", "amber"],
                  ["Berilmagan oylik", "225 ming so‘m", "blue"],
                ].map(([label, value, tone]) => (
                  <Box key={label} className={`lp-debt-row ${tone}`}>
                    <Typography>{label}</Typography>

                    <Typography>{value}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

function FeatureCard({ item }) {
  return (
    <Grid item xs={12} md={6} xl={4} sx={{ display: "flex" }}>
      <Paper
        component={motion.div}
        variants={fadeUp}
        whileHover={{
          y: -8,
          scale: 1.012,
        }}
        elevation={0}
        className={`lp-feature ${item.dark ? "dark" : ""}`}
      >
        <Box>
          <Typography className="lp-feature-number">{item.no}</Typography>

          <Typography className="lp-feature-title">{item.title}</Typography>

          <Typography className="lp-feature-text">{item.text}</Typography>
        </Box>

        <Chip size="small" label={item.tag} className="lp-feature-chip" />
      </Paper>
    </Grid>
  );
}

function PlanCard({ item, onStart }) {
  const [name, price, workers, clients, admins, text, featured] = item;

  return (
    <Grid item xs={12} sm={6} lg={3} sx={{ display: "flex" }}>
      <Paper
        component={motion.div}
        variants={fadeUp}
        whileHover={{
          y: -8,
          scale: 1.012,
        }}
        elevation={0}
        className={`lp-plan ${featured ? "featured" : ""}`}
      >
        {featured && <Chip size="small" label="Eng maqbul" className="lp-plan-badge" />}

        <Typography className="lp-plan-name">{name}</Typography>

        <Stack direction="row" alignItems="baseline" spacing={0.7} sx={{ mt: 1.4 }}>
          <Typography className="lp-plan-price">{price}</Typography>

          <Typography className="lp-plan-period">so‘m / oy</Typography>
        </Stack>

        <Typography className="lp-plan-text">{text}</Typography>

        <Divider sx={{ my: 1.8 }} />

        <Stack spacing={0.9}>
          {[
            `${workers} ta ishchi`,
            `${clients} ta mijoz`,
            `${admins} ta administrator`,
            "Savdo va qarzdorlik",
            "Ombor va moliya",
          ].map((value) => (
            <Stack key={value} direction="row" spacing={1} alignItems="center">
              <span className="lp-check" />

              <Typography className="lp-plan-feature">{value}</Typography>
            </Stack>
          ))}
        </Stack>

        <Button
          fullWidth
          variant={featured ? "contained" : "outlined"}
          onClick={onStart}
          className={`lp-plan-button ${featured ? "featured" : ""}`}
        >
          Boshlash
        </Button>
      </Paper>
    </Grid>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll();

  const heroY = useTransform(scrollYProgress, [0, 0.22], [0, -50]);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.44]);

  const logoY = useTransform(scrollYProgress, [0, 0.28], [0, 80]);

  return (
    <Box className="landing-page">
      <style>{landingStyles}</style>

      <Box component="header" className="lp-header">
        <Container maxWidth="xl">
          <Box className="lp-header-inner">
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Logo size={40} />

              <Box>
                <Typography className="lp-brand-name">AL AMIN CRM</Typography>

                <Typography className="lp-brand-subtitle">POYABZAL BOSHQARUVI</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2.5} className="lp-nav">
              {[
                ["Imkoniyatlar", "modules"],
                ["Ishlash tartibi", "process"],
                ["Narxlar", "plans"],
                ["Bog‘lanish", "telegram-ad"],
              ].map(([label, id]) => (
                <Button key={id} onClick={() => scrollTo(id)}>
                  {label}
                </Button>
              ))}
            </Stack>

            <Stack direction="row" spacing={0.8} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => navigate("/login")} className="lp-login">
                Kirish
              </Button>

              <Button
                variant="contained"
                onClick={() => navigate("/register")}
                className="lp-start"
              >
                Boshlash
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Box component="main">
        <Box component="section" className="lp-hero">
          <Box
            component={motion.img}
            src={mrLogo}
            alt=""
            aria-hidden="true"
            style={{ y: logoY }}
            animate={{
              rotate: [0, 2, 0],
              scale: [1, 1.035, 1],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="lp-hero-watermark"
          />

          <Container maxWidth="xl" className="lp-hero-container">
            <Grid
              container
              spacing={{
                xs: 5,
                lg: 7,
              }}
              alignItems="center"
            >
              <Grid item xs={12} lg={6}>
                <Box
                  component={motion.div}
                  style={{
                    y: heroY,
                    opacity: heroOpacity,
                  }}
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                >
                  <Box component={motion.div} variants={fadeUp}>
                    <Eyebrow dark>Poyabzal korxonalari uchun</Eyebrow>
                  </Box>

                  <Typography component={motion.h1} variants={fadeUp} className="lp-hero-title">
                    Korxona hisobini <span>tartibli</span>, nazoratni esa aniq qiling.
                  </Typography>

                  <Typography component={motion.p} variants={fadeUp} className="lp-hero-text">
                    Savdo, mijoz qarzi, ishlab chiqarish, ish haqi, avans, homashyo, ombor va moliya
                    — barchasi Al Amin CRM ichida.
                  </Typography>

                  <Stack
                    component={motion.div}
                    variants={fadeUp}
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={1.2}
                    sx={{ mt: 3.2 }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => navigate("/register")}
                      className="lp-primary"
                    >
                      Korxonani ulash
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => scrollTo("modules")}
                      className="lp-light"
                    >
                      Imkoniyatlarni ko‘rish
                    </Button>
                  </Stack>

                  <Box component={motion.div} variants={fadeUp} className="lp-proof">
                    {proof.map((item) => (
                      <Stack key={item} direction="row" spacing={1} alignItems="center">
                        <span />

                        <Typography>{item}</Typography>
                      </Stack>
                    ))}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} lg={6}>
                <DashboardPreview />
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Box className="lp-trust-strip">
          <Container maxWidth="xl">
            <Box className="lp-trust-grid">
              {[
                ["Savdo", "Bir nechta mahsulotli savdo"],
                ["Ishlab chiqarish", "Bo‘lim va ishchi kesimi"],
                ["Moliya", "Qarz, oylik va xarajat"],
                ["Xavfsizlik", "Ruxsat va amallar tarixi"],
              ].map(([title, text]) => (
                <Box key={title}>
                  <Typography>{title}</Typography>

                  <Typography>{text}</Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>

        <Box id="modules" component="section" className="lp-section lp-soft">
          <Container maxWidth="xl">
            <SectionHead
              eyebrow="Tizim imkoniyatlari"
              title="Korxona pulini, ishini va qarzini bitta joyda ko‘ring."
              text="Ko‘p daftar, alohida Excel va eslab qolishga tayanadigan hisob o‘rniga barcha jarayonlar o‘zaro bog‘langan tizimda yuradi."
            />

            <Grid
              component={motion.div}
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.1,
              }}
              container
              spacing={2.2}
              sx={{ mt: 3.5 }}
            >
              {features.map((item) => (
                <FeatureCard key={item.title} item={item} />
              ))}
            </Grid>
          </Container>
        </Box>

        <Box id="process" component="section" className="lp-section lp-white">
          <Container maxWidth="xl">
            <Grid container spacing={2.5} alignItems="stretch">
              <Grid item xs={12} md={5}>
                <Paper
                  component={motion.div}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{
                    once: true,
                    amount: 0.25,
                  }}
                  elevation={0}
                  className="lp-process-intro"
                >
                  <Eyebrow dark>Ishlash tartibi</Eyebrow>

                  <Typography component="h2">Siz ma’lumot kiritasiz, tizim hisoblaydi.</Typography>

                  <Typography component="p">
                    Har bir savdo, ish hisoboti, xarid va to‘lov boshqa ko‘rsatkichlar bilan
                    avtomatik bog‘lanadi.
                  </Typography>

                  <Box>
                    <Typography>Natija</Typography>

                    <Typography>
                      Rahbar kamroq vaqt hisob tekshiradi va ko‘proq vaqt qaror qabul qiladi.
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={7}>
                <Paper
                  component={motion.div}
                  variants={stagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  elevation={0}
                  className="lp-process-list"
                >
                  {process.map(([title, text], index) => (
                    <Box
                      component={motion.div}
                      variants={fadeUp}
                      className="lp-process-row"
                      key={title}
                    >
                      <Box className={index === 0 ? "active" : ""}>
                        {String(index + 1).padStart(2, "0")}
                      </Box>

                      <Box>
                        <Typography>{title}</Typography>

                        <Typography>{text}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Box id="plans" component="section" className="lp-section lp-plans-section">
          <Container maxWidth="xl">
            <SectionHead
              eyebrow="Obuna rejalari"
              title="Korxona hajmiga mos rejani tanlang."
              text="Har bir tarif ishchi, mijoz va administratorlar uchun alohida limit beradi. Korxona egasi — super administrator limitga kirmaydi."
              center
            />

            <Grid
              component={motion.div}
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.12,
              }}
              container
              spacing={2.2}
              sx={{ mt: 3.5 }}
            >
              {plans.map((item) => (
                <PlanCard key={item[0]} item={item} onStart={() => navigate("/register")} />
              ))}
            </Grid>
          </Container>
        </Box>

        <Box id="telegram-ad" component="section" className="lp-section lp-white">
          <Container maxWidth="xl">
            <Grid container spacing={2.5} alignItems="stretch">
              <Grid item xs={12} md={5}>
                <Paper
                  component={motion.div}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{
                    once: true,
                    amount: 0.25,
                  }}
                  elevation={0}
                  className="lp-ad-dark"
                >
                  <Box>
                    <Typography className="lp-ad-label">Poyabzal biznesi uchun</Typography>

                    <Typography component="h2">
                      Hisobdagi chalkashlikni bitta tizim bilan tugating.
                    </Typography>

                    <Typography component="p">
                      Savdo, qarz, oylik, homashyo va omborni bir joyda boshqaring.
                    </Typography>
                  </Box>

                  <Box id="logo-sample">
                    <Box component="img" src={mrLogo} alt="MR belgisi" />

                    <Typography>Asoschi belgisi • MR</Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={7}>
                <Paper
                  component={motion.div}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{
                    once: true,
                    amount: 0.25,
                  }}
                  elevation={0}
                  className="lp-ad-light"
                >
                  <Eyebrow>Qo‘qon poyabzal korxonalari uchun</Eyebrow>

                  <Typography component="h2">
                    Al Amin CRM — savdo, ishlab chiqarish, oylik va qarzdorlikni tartibga soladigan
                    tizim.
                  </Typography>

                  <Grid container spacing={1.2} sx={{ mt: 2.2 }}>
                    {adPoints.map((item, index) => (
                      <Grid item xs={12} sm={6} key={item}>
                        <Box className="lp-ad-point">
                          <Box>{String(index + 1).padStart(2, "0")}</Box>

                          <Typography>{item}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={1}
                    sx={{ mt: 2.5 }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => navigate("/register")}
                      className="lp-primary"
                    >
                      Ro‘yxatdan o‘tish
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => navigate("/login")}
                      className="lp-outline"
                    >
                      Tizimga kirish
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Box component="section" className="lp-final-section">
          <Container maxWidth="xl">
            <Paper
              component={motion.div}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.25,
              }}
              elevation={0}
              className="lp-final-card"
            >
              <Eyebrow dark center>
                Ishni bugun boshlang
              </Eyebrow>

              <Typography component="h2">Korxonangiz hisobini tartibga keltiring.</Typography>

              <Typography component="p">
                Ishchi, mahsulot, homashyo, mijoz, qarz, oylik va ombor bitta boshqaruv tizimida
                ishlasin.
              </Typography>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1.1}
                justifyContent="center"
                sx={{ mt: 3.2 }}
              >
                <Button
                  variant="contained"
                  onClick={() => navigate("/register")}
                  className="lp-primary"
                >
                  Korxonani ulash
                </Button>

                <Button variant="outlined" onClick={() => navigate("/login")} className="lp-light">
                  Tizimga kirish
                </Button>
              </Stack>
            </Paper>
          </Container>
        </Box>
      </Box>

      <Box component="footer" className="lp-footer">
        <Container maxWidth="xl">
          <Box className="lp-footer-inner">
            <Stack direction="row" spacing={1.1} alignItems="center">
              <Logo size={38} />

              <Box>
                <Typography>AL AMIN CRM</Typography>

                <Typography>Poyabzal korxonalari uchun boshqaruv tizimi</Typography>
              </Box>
            </Stack>

            <Typography>© {new Date().getFullYear()} Al Amin CRM. Asoschi MR.</Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

const landingStyles = `
  .landing-page {
    min-height: 100vh;
    overflow-x: hidden;
    color: #0f172a;
    background: #f5f7fa;
    scroll-behavior: smooth;
  }

  .landing-page * {
    box-sizing: border-box;
  }

  .landing-page .MuiButton-root,
  .landing-page .MuiChip-root {
    font-family: inherit;
  }

  .lp-logo {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    overflow: hidden;
    border: 1px solid #e4e9ef;
    border-radius: 14px;
    background: #fff;
    box-shadow:
      0 12px 30px rgba(15,23,42,.08);
  }

  .lp-logo img {
    width: 76%;
    height: 76%;
    object-fit: contain;
  }

  .lp-header {
    position: sticky;
    top: 0;
    z-index: 30;
    border-bottom:
      1px solid rgba(226,232,240,.82);
    background:
      rgba(255,255,255,.88);
    backdrop-filter: blur(18px);
  }

  .lp-header-inner {
    min-height: 72px;
    display: grid;
    grid-template-columns:
      240px 1fr 270px;
    align-items: center;
    gap: 16px;
  }

  .lp-brand-name {
    color: #0f172a;
    font-size: 14px !important;
    font-weight: 950 !important;
  }

  .lp-brand-subtitle {
    margin-top: 1px !important;
    color: #94a3b8;
    font-size: 8px !important;
    font-weight: 800 !important;
    letter-spacing: .08em;
  }

  .lp-nav {
    justify-content: center;
  }

  .lp-nav .MuiButton-root {
    color: #475569;
    font-size: 10.5px;
    font-weight: 900;
    text-transform: none;
  }

  .lp-nav .MuiButton-root:hover {
    color: #991b1b;
    background: transparent;
  }

  .lp-login,
  .lp-outline {
    min-height: 44px;
    padding: 0 22px !important;
    color: #334155 !important;
    border-color: #dce3ea !important;
    border-radius: 13px !important;
    background: #fff !important;
    font-size: 10.5px !important;
    font-weight: 900 !important;
    text-transform: none !important;
  }

  .lp-login:hover,
  .lp-outline:hover {
    color: #991b1b !important;
    border-color:
      rgba(153,27,27,.24) !important;
    background:
      rgba(153,27,27,.04) !important;
  }

  .lp-start,
  .lp-primary {
    min-height: 48px;
    padding: 0 30px !important;
    color: #fff !important;
    border-radius: 14px !important;
    background:
      linear-gradient(
        135deg,
        #7f1d1d,
        #b91c1c 58%,
        #dc2626
      ) !important;
    box-shadow:
      0 14px 30px
      rgba(127,29,29,.22) !important;
    font-size: 11.5px !important;
    font-weight: 950 !important;
    text-transform: none !important;
  }

  .lp-start {
    min-height: 44px;
  }

  .lp-start:hover,
  .lp-primary:hover {
    background:
      linear-gradient(
        135deg,
        #681818,
        #991b1b 58%,
        #b91c1c
      ) !important;
  }

  .lp-light {
    min-height: 48px;
    padding: 0 30px !important;
    color: #fff !important;
    border:
      1px solid
      rgba(255,255,255,.13) !important;
    border-radius: 14px !important;
    background:
      rgba(255,255,255,.055) !important;
    font-size: 11.5px !important;
    font-weight: 950 !important;
    text-transform: none !important;
  }

  .lp-light:hover {
    border-color:
      rgba(255,255,255,.25) !important;
    background:
      rgba(255,255,255,.10) !important;
  }

  .lp-eyebrow {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .lp-eyebrow.center {
    justify-content: center;
  }

  .lp-eyebrow > span {
    width: 26px;
    height: 2px;
    border-radius: 99px;
    background:
      linear-gradient(
        90deg,
        #fb7185,
        #ef4444
      );
  }

  .lp-eyebrow .MuiTypography-root {
    color: #991b1b;
    font-size: 9.5px;
    font-weight: 950;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  .lp-eyebrow.dark
    .MuiTypography-root {
    color: #fecdd3 !important;
  }

  .lp-hero {
    position: relative;
    min-height:
      calc(100vh - 72px);
    padding: 72px 0;
    display: flex;
    align-items: center;
    overflow: hidden;
    color: #fff;
    background:
      radial-gradient(
        circle at 15% 12%,
        rgba(220,38,38,.31),
        transparent 29%
      ),
      radial-gradient(
        circle at 88% 78%,
        rgba(127,29,29,.18),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #080c12,
        #111117 53%,
        #351218
      );
  }

  .lp-hero-watermark {
    position: absolute;
    right: -70px;
    top: 18px;
    width: 700px;
    opacity: .035;
    filter: invert(1);
    pointer-events: none;
  }

  .lp-hero-container {
    position: relative;
    z-index: 1;
  }

  .lp-hero-title {
    max-width: 760px;
    margin-top: 20px !important;
    color: #fff !important;
    font-size:
      clamp(
        42px,
        5.1vw,
        67px
      ) !important;
    line-height: 1.03 !important;
    font-weight: 950 !important;
    letter-spacing: -.06em !important;
  }

  .lp-hero-title span {
    color: #fca5a5;
  }

  .lp-hero-text {
    max-width: 650px;
    margin-top: 22px !important;
    color:
      rgba(255,255,255,.48) !important;
    font-size: 16px !important;
    line-height: 1.85 !important;
  }

  .lp-proof {
    max-width: 620px;
    margin-top: 32px;
    display: grid;
    grid-template-columns:
      repeat(2,minmax(0,1fr));
    gap: 10px;
  }

  .lp-proof span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow:
      0 0 0 5px
      rgba(74,222,128,.08);
  }

  .lp-proof .MuiTypography-root {
    color:
      rgba(255,255,255,.55) !important;
    font-size: 9.5px;
    font-weight: 850;
  }

  .lp-preview {
    overflow: hidden;
    border:
      1px solid
      rgba(255,255,255,.11);
    border-radius: 27px !important;
    background: #f8fafc !important;
    box-shadow:
      0 45px 120px
      rgba(0,0,0,.40) !important;
  }

  .lp-preview-top {
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content:
      space-between;
    gap: 16px;
    background: #fff;
    border-bottom:
      1px solid #e4e9ef;
  }

  .lp-preview-title {
    color: #0f172a;
    font-size: 10.5px !important;
    font-weight: 950 !important;
  }

  .lp-preview-subtitle {
    color: #94a3b8;
    font-size: 8px !important;
  }

  .lp-period-chip {
    height: 24px !important;
    color: #991b1b !important;
    background:
      rgba(153,27,27,.07) !important;
    font-size: 8.5px !important;
    font-weight: 900 !important;
  }

  .lp-preview-content {
    padding: 20px;
  }

  .lp-preview-metrics {
    padding: 10px;
    display: grid;
    grid-template-columns:
      repeat(4,minmax(0,1fr));
    gap: 10px;
    border-radius: 18px;
    background:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.24),
        transparent 35%
      ),
      linear-gradient(
        145deg,
        #0d1117,
        #221218
      );
  }

  .lp-preview-metric {
    min-width: 0;
    padding: 14px;
    border:
      1px solid
      rgba(255,255,255,.075);
    border-radius: 15px;
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.065),
        rgba(255,255,255,.025)
      );
  }

  .lp-preview-metric-icon {
    width: 29px;
    height: 29px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    font-size: 10px;
    font-weight: 950;
  }

  .lp-preview-metric.blue
    .lp-preview-metric-icon {
    color: #bfdbfe;
    border:
      1px solid
      rgba(96,165,250,.16);
    background:
      rgba(37,99,235,.15);
  }

  .lp-preview-metric.green
    .lp-preview-metric-icon {
    color: #bbf7d0;
    border:
      1px solid
      rgba(74,222,128,.16);
    background:
      rgba(34,197,94,.14);
  }

  .lp-preview-metric.violet
    .lp-preview-metric-icon {
    color: #ddd6fe;
    border:
      1px solid
      rgba(167,139,250,.16);
    background:
      rgba(139,92,246,.15);
  }

  .lp-preview-metric.amber
    .lp-preview-metric-icon {
    color: #fde68a;
    border:
      1px solid
      rgba(251,191,36,.16);
    background:
      rgba(245,158,11,.15);
  }

  .lp-preview-metric-label {
    margin-top: 10px !important;
    color:
      rgba(255,255,255,.42) !important;
    font-size: 8.5px !important;
    font-weight: 800 !important;
  }

  .lp-preview-metric-value {
    margin-top: 4px !important;
    color: #fff !important;
    font-size: 15px !important;
    font-weight: 950 !important;
  }

  .lp-preview-metric-helper {
    margin-top: 3px !important;
    color:
      rgba(255,255,255,.27) !important;
    font-size: 8px !important;
  }

  .lp-preview-card {
    height: 220px;
    padding: 17px;
    border:
      1px solid #e4e9ef;
    border-radius: 17px !important;
    background: #fff !important;
  }

  .lp-preview-card-title {
    color: #0f172a;
    font-size: 10px !important;
    font-weight: 950 !important;
  }

  .lp-preview-card-helper {
    margin-top: 2px !important;
    color: #94a3b8;
    font-size: 8px !important;
  }

  .lp-growth {
    color: #15803d;
    font-size: 9px !important;
    font-weight: 950 !important;
  }

  .lp-bars {
    height: 142px;
    margin-top: 15px;
  }

  .lp-bar-column {
    flex: 1;
    text-align: center;
  }

  .lp-bar {
    width: 62%;
    margin: 0 auto;
    border-radius:
      8px 8px 2px 2px;
    background:
      linear-gradient(
        180deg,
        #cbd5e1,
        #94a3b8
      );
  }

  .lp-bar.active {
    background:
      linear-gradient(
        180deg,
        #dc2626,
        #991b1b
      );
  }

  .lp-bar-column
    .MuiTypography-root {
    margin-top: 6px;
    color: #94a3b8;
    font-size: 7.5px;
  }

  .lp-debt-row {
    padding: 11px;
    border:
      1px solid #e4e9ef;
    border-radius: 12px;
    background: #f8fafc;
  }

  .lp-debt-row
    .MuiTypography-root:first-child {
    color: #64748b;
    font-size: 8.2px;
    font-weight: 800;
  }

  .lp-debt-row
    .MuiTypography-root:last-child {
    margin-top: 3px;
    font-size: 10px;
    font-weight: 950;
  }

  .lp-debt-row.red
    .MuiTypography-root:last-child {
    color: #991b1b;
  }

  .lp-debt-row.amber
    .MuiTypography-root:last-child {
    color: #b45309;
  }

  .lp-debt-row.blue
    .MuiTypography-root:last-child {
    color: #1d4ed8;
  }

  .lp-trust-strip {
    padding: 22px 0;
    border-bottom:
      1px solid #e4e9ef;
    background: #fff;
  }

  .lp-trust-grid {
    display: grid;
    grid-template-columns:
      repeat(4,minmax(0,1fr));
    gap: 10px;
  }

  .lp-trust-grid > div {
    padding: 11px 15px;
    text-align: center;
  }

  .lp-trust-grid
    .MuiTypography-root:first-child {
    color: #0f172a;
    font-size: 10.5px;
    font-weight: 950;
  }

  .lp-trust-grid
    .MuiTypography-root:last-child {
    margin-top: 2px;
    color: #94a3b8;
    font-size: 8.5px;
  }

  .lp-section {
    padding: 88px 0;
  }

  .lp-soft {
    background: #f5f7fa;
  }

  .lp-white {
    background: #fff;
  }

  .lp-plans-section {
    background: #f3f5f8;
  }

  .lp-section-head {
    max-width: 760px;
  }

  .lp-section-head.center {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
  }

  .lp-section-head h2 {
    margin-top: 16px;
    color: #0f172a;
    font-size:
      clamp(
        34px,
        4vw,
        52px
      );
    line-height: 1.08;
    font-weight: 950;
    letter-spacing: -.05em;
  }

  .lp-section-head p {
    margin-top: 16px;
    color: #64748b;
    font-size: 16px;
    line-height: 1.8;
    font-weight: 650;
  }

  .lp-feature {
    position: relative;
    flex: 1;
    min-height: 260px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    justify-content:
      space-between;
    overflow: hidden;
    border:
      1px solid #e4e9ef;
    border-radius: 24px !important;
    background:
      linear-gradient(
        145deg,
        #fff,
        #fafbfc
      ) !important;
    box-shadow:
      0 14px 40px
      rgba(15,23,42,.05) !important;
  }

  .lp-feature.dark {
    color: #fff;
    border-color:
      rgba(255,255,255,.075);
    background:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.25),
        transparent 38%
      ),
      linear-gradient(
        145deg,
        #0d1117,
        #211217
      ) !important;
    box-shadow:
      0 24px 65px
      rgba(15,23,42,.18) !important;
  }

  .lp-feature-number {
    color: #991b1b;
    font-size: 10px !important;
    font-weight: 950 !important;
    letter-spacing: .10em;
  }

  .lp-feature.dark
    .lp-feature-number {
    color: #fca5a5 !important;
  }

  .lp-feature-title {
    margin-top: 14px !important;
    color: #0f172a;
    font-size: 21px !important;
    font-weight: 950 !important;
    letter-spacing: -.035em;
  }

  .lp-feature.dark
    .lp-feature-title {
    color: #fff !important;
  }

  .lp-feature-text {
    margin-top: 11px !important;
    color: #64748b;
    font-size: 12px !important;
    line-height: 1.75 !important;
  }

  .lp-feature.dark
    .lp-feature-text {
    color:
      rgba(255,255,255,.52) !important;
  }

  .lp-feature-chip {
    width: fit-content;
    height: 27px !important;
    margin-top: 22px;
    color: #991b1b !important;
    border:
      1px solid
      rgba(153,27,27,.13);
    background:
      rgba(153,27,27,.06) !important;
    font-size: 9px !important;
    font-weight: 900 !important;
  }

  .lp-feature.dark
    .lp-feature-chip {
    color: #fff !important;
    border-color:
      rgba(255,255,255,.10);
    background:
      rgba(255,255,255,.08) !important;
  }

  .lp-process-intro {
    height: 100%;
    min-height: 430px;
    padding: 40px;
    overflow: hidden;
    border-radius: 26px !important;
    color: #fff;
    background:
      radial-gradient(
        circle at 100% 0%,
        rgba(220,38,38,.27),
        transparent 40%
      ),
      linear-gradient(
        145deg,
        #0d1117,
        #231218
      ) !important;
    box-shadow:
      0 24px 65px
      rgba(15,23,42,.18) !important;
  }

  .lp-process-intro h2 {
    margin-top: 18px;
    color: #fff !important;
    font-size:
      clamp(
        34px,
        4vw,
        48px
      );
    line-height: 1.08;
    font-weight: 950;
    letter-spacing: -.05em;
  }

  .lp-process-intro > p {
    margin-top: 18px;
    color:
      rgba(255,255,255,.48) !important;
    font-size: 13px;
    line-height: 1.8;
  }

  .lp-process-intro
    > div:last-child {
    margin-top: 30px;
    padding: 16px;
    border:
      1px solid
      rgba(255,255,255,.08);
    border-radius: 16px;
    background:
      rgba(255,255,255,.045);
  }

  .lp-process-intro
    > div:last-child
    .MuiTypography-root:first-child {
    color: #fff !important;
    font-size: 10px;
    font-weight: 900;
  }

  .lp-process-intro
    > div:last-child
    .MuiTypography-root:last-child {
    margin-top: 4px;
    color:
      rgba(255,255,255,.40) !important;
    font-size: 9.5px;
    line-height: 1.6;
  }

  .lp-process-list {
    height: 100%;
    padding: 30px;
    display: grid;
    gap: 13px;
    border:
      1px solid #e4e9ef;
    border-radius: 26px !important;
    background: #fafbfc !important;
    box-shadow:
      0 14px 42px
      rgba(15,23,42,.05) !important;
  }

  .lp-process-row {
    display: grid;
    grid-template-columns:
      46px minmax(0,1fr);
    gap: 13px;
    align-items: start;
  }

  .lp-process-row
    > div:first-child {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    color: #991b1b;
    border:
      1px solid
      rgba(153,27,27,.12);
    border-radius: 13px;
    background:
      rgba(153,27,27,.06);
    font-size: 10px;
    font-weight: 950;
  }

  .lp-process-row
    > div:first-child.active {
    color: #fff;
    background:
      linear-gradient(
        135deg,
        #7f1d1d,
        #dc2626
      );
  }

  .lp-process-row
    > div:last-child {
    padding: 16px;
    border:
      1px solid #e4e9ef;
    border-radius: 16px;
    background: #fff;
  }

  .lp-process-row
    > div:last-child
    .MuiTypography-root:first-child {
    color: #0f172a;
    font-size: 11.5px;
    font-weight: 950;
  }

  .lp-process-row
    > div:last-child
    .MuiTypography-root:last-child {
    margin-top: 4px;
    color: #64748b;
    font-size: 10.5px;
    line-height: 1.65;
  }

  .lp-plan {
    position: relative;
    flex: 1;
    padding: 27px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border:
      1px solid #e4e9ef;
    border-radius: 24px !important;
    background:
      linear-gradient(
        145deg,
        #fff,
        #fafbfc
      ) !important;
    box-shadow:
      0 14px 40px
      rgba(15,23,42,.05) !important;
  }

  .lp-plan.featured {
    border-color:
      rgba(153,27,27,.24);
    background:
      linear-gradient(
        145deg,
        rgba(153,27,27,.065),
        #fff 45%
      ) !important;
    box-shadow:
      0 24px 65px
      rgba(153,27,27,.12) !important;
  }

  .lp-plan-badge {
    position: absolute !important;
    top: 16px;
    right: 16px;
    height: 25px !important;
    color: #fff !important;
    background: #991b1b !important;
    font-size: 8.5px !important;
    font-weight: 900 !important;
  }

  .lp-plan-name {
    color: #0f172a;
    font-size: 17px !important;
    font-weight: 950 !important;
  }

  .lp-plan.featured
    .lp-plan-name {
    color: #991b1b;
  }

  .lp-plan-price {
    color: #0f172a;
    font-size: 29px !important;
    font-weight: 950 !important;
    letter-spacing: -.045em;
  }

  .lp-plan-period {
    color: #94a3b8;
    font-size: 9px !important;
  }

  .lp-plan-text {
    min-height: 48px;
    margin-top: 9px !important;
    color: #64748b;
    font-size: 10.5px !important;
    line-height: 1.6 !important;
  }

  .lp-check {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #15803d;
  }

  .lp-plan.featured
    .lp-check {
    background: #991b1b;
  }

  .lp-plan-feature {
    color: #64748b;
    font-size: 10px !important;
    font-weight: 800 !important;
  }

  .lp-plan-button {
    min-height: 42px;
    margin-top: 23px !important;
    border-color: #dce3ea !important;
    border-radius: 12px !important;
    color: #64748b !important;
    font-size: 10.5px !important;
    font-weight: 900 !important;
    text-transform: none !important;
  }

  .lp-plan-button:hover {
    color: #991b1b !important;
    border-color:
      rgba(153,27,27,.24) !important;
    background:
      rgba(153,27,27,.04) !important;
  }

  .lp-plan-button.featured {
    color: #fff !important;
    border: 0 !important;
    background:
      linear-gradient(
        135deg,
        #7f1d1d,
        #b91c1c
      ) !important;
  }

  .lp-ad-dark,
  .lp-ad-light {
    height: 100%;
    min-height: 430px;
    padding: 40px;
    border-radius: 26px !important;
  }

  .lp-ad-dark {
    display: flex;
    flex-direction: column;
    justify-content:
      space-between;
    overflow: hidden;
    color: #fff;
    background:
      radial-gradient(
        circle at 100% 0%,
        rgba(255,255,255,.12),
        transparent 35%
      ),
      linear-gradient(
        145deg,
        #7f1d1d,
        #b91c1c 58%,
        #dc2626
      ) !important;
    box-shadow:
      0 24px 65px
      rgba(153,27,27,.18) !important;
  }

  .lp-ad-label {
    color:
      rgba(255,255,255,.54) !important;
    font-size: 9.5px !important;
    font-weight: 900 !important;
    letter-spacing: .10em;
    text-transform: uppercase;
  }

  .lp-ad-dark h2 {
    margin-top: 17px;
    color: #fff !important;
    font-size:
      clamp(
        34px,
        4vw,
        47px
      );
    line-height: 1.08;
    font-weight: 950;
    letter-spacing: -.05em;
  }

  .lp-ad-dark p {
    margin-top: 17px;
    color:
      rgba(255,255,255,.52) !important;
    font-size: 12.5px;
    line-height: 1.8;
  }

  .lp-ad-dark img {
    width: 120px;
    max-height: 90px;
    object-fit: contain;
    filter: invert(1);
    opacity: .92;
  }

  .lp-ad-dark
    > div:last-child
    .MuiTypography-root {
    margin-top: 10px;
    color:
      rgba(255,255,255,.42) !important;
    font-size: 8.5px;
  }

  .lp-ad-light {
    border:
      1px solid #e4e9ef;
    background:
      linear-gradient(
        145deg,
        #fff,
        #fafbfc
      ) !important;
    box-shadow:
      0 14px 42px
      rgba(15,23,42,.06) !important;
  }

  .lp-ad-light h2 {
    margin-top: 16px;
    color: #0f172a;
    font-size:
      clamp(
        27px,
        3vw,
        36px
      );
    line-height: 1.18;
    font-weight: 950;
    letter-spacing: -.04em;
  }

  .lp-ad-point {
    height: 100%;
    min-height: 100px;
    padding: 16px;
    display: flex;
    gap: 12px;
    border:
      1px solid #e4e9ef;
    border-radius: 16px;
    background: #f8fafc;
  }

  .lp-ad-point > div {
    width: 27px;
    height: 27px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    color: #991b1b;
    border-radius: 9px;
    background:
      rgba(153,27,27,.07);
    font-size: 9px;
    font-weight: 950;
  }

  .lp-ad-point
    .MuiTypography-root {
    color: #475569;
    font-size: 10.5px;
    line-height: 1.6;
    font-weight: 750;
  }

  .lp-final-section {
    padding: 88px 0;
    color: #fff;
    background:
      radial-gradient(
        circle at 15% 10%,
        rgba(220,38,38,.24),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #080c12,
        #171117 56%,
        #351218
      );
  }

  .lp-final-card {
    padding: 55px;
    text-align: center;
    border:
      1px solid
      rgba(255,255,255,.085);
    border-radius: 28px !important;
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.075),
        rgba(255,255,255,.035)
      ) !important;
    backdrop-filter: blur(18px);
    box-shadow:
      0 30px 90px
      rgba(0,0,0,.28) !important;
  }

  .lp-final-card h2 {
    margin-top: 18px;
    color: #fff !important;
    font-size:
      clamp(
        35px,
        4.5vw,
        57px
      );
    line-height: 1.08;
    font-weight: 950;
    letter-spacing: -.055em;
  }

  .lp-final-card p {
    max-width: 720px;
    margin: 17px auto 0;
    color:
      rgba(255,255,255,.46) !important;
    font-size: 13.5px;
    line-height: 1.8;
  }

  .lp-footer {
    padding: 35px 0;
    color: #fff;
    background: #070a0f;
    border-top:
      1px solid
      rgba(255,255,255,.06);
  }

  .lp-footer-inner {
    display: flex;
    align-items: center;
    justify-content:
      space-between;
    gap: 20px;
  }

  .lp-footer .lp-logo {
    border-color:
      rgba(255,255,255,.10);
  }

  .lp-footer
    .MuiTypography-root:first-child {
    color: #fff !important;
    font-size: 11px;
    font-weight: 950;
  }

  .lp-footer
    .MuiTypography-root:last-child {
    margin-top: 2px;
    color:
      rgba(255,255,255,.30) !important;
    font-size: 8.5px;
  }

  .lp-footer-inner
    > .MuiTypography-root {
    color:
      rgba(255,255,255,.30) !important;
    font-size: 9px !important;
  }

  @media (max-width: 899px) {
    .lp-header-inner {
      grid-template-columns:
        1fr auto;
    }

    .lp-nav {
      display: none !important;
    }

    .lp-hero-watermark {
      right: -170px;
      top: 85px;
      width: 420px;
    }

    .lp-preview-metrics {
      grid-template-columns:
        repeat(2,minmax(0,1fr));
    }

    .lp-section,
    .lp-final-section {
      padding: 72px 0;
    }
  }

  @media (max-width: 599px) {
    .lp-brand-subtitle {
      display: none;
    }

    .lp-login,
    .lp-start {
      min-width: 0 !important;
      padding:
        0 14px !important;
      font-size:
        9.5px !important;
    }

    .lp-hero {
      padding: 64px 0;
    }

    .lp-hero-title {
      font-size:
        42px !important;
      line-height:
        1.08 !important;
    }

    .lp-hero-text {
      font-size:
        14px !important;
    }

    .lp-proof {
      grid-template-columns: 1fr;
    }

    .lp-trust-grid {
      grid-template-columns:
        repeat(2,minmax(0,1fr));
    }

    .lp-section-head h2 {
      font-size: 34px;
    }

    .lp-section-head p {
      font-size: 14px;
    }

    .lp-feature,
    .lp-process-intro,
    .lp-process-list,
    .lp-ad-dark,
    .lp-ad-light {
      padding: 24px;
    }

    .lp-final-card {
      padding: 35px 24px;
    }

    .lp-footer-inner {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;
