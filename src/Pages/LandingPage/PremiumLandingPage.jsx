import { useState } from "react";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import AuditRequestDialog from "./AuditRequestDialog";
import alAminErpLogo from "../../images/al-amin-erp-mark.png";

const ease = [0.22, 1, 0.36, 1];

const painPoints = [
  [
    "01",
    "Oylik va avans alohida daftarda",
    "Kim qancha ishladi va qancha oldi — oy oxirida qayta sanaladi.",
  ],
  [
    "02",
    "Mijoz qarzi esdan chiqadi",
    "Savdo bor, lekin qaysi mijozdan qancha pul olinishi aniq ko‘rinmaydi.",
  ],
  [
    "03",
    "Ombor qoldig‘i taxmin bilan",
    "Xomashyo va tayyor mahsulot miqdori real holatdan farq qilib ketadi.",
  ],
  [
    "04",
    "Rahbar holatni kech biladi",
    "Savdo, xarajat va ishlab chiqarish turli fayllarda bo‘lsa, qaror ham kechikadi.",
  ],
];

const modules = [
  ["SV", "Savdo", "Bir savdoda mahsulotlar, to‘lov va qolgan qarzni birga yuriting."],
  ["MJ", "Mijozlar", "Har bir mijozning savdosi, to‘lovi va qarzdorligini ko‘ring."],
  ["OM", "Ombor", "Kirim-chiqim, qoldiq va tugayotgan pozitsiyalar nazoratda."],
  ["IC", "Ishlab chiqarish", "Zakazni bo‘limma-bo‘lim va bajarilgan miqdor bo‘yicha kuzating."],
  ["XM", "Xomashyo", "Xarid, ta’minotchi qarzi va xomashyo qoldig‘ini bog‘lang."],
  ["XD", "Xodimlar", "Bo‘lim, vazifa va xodim faoliyatini bitta tizimda boshqaring."],
  ["OA", "Oylik va avans", "Bajarilgan ish, avans va qolgan ish haqini avtomatik hisoblang."],
  ["ML", "Moliya", "Tushum, xarajat va pul harakatining umumiy holatini ko‘ring."],
  ["IN", "Inventarizatsiya", "Tizimdagi qoldiqni haqiqiy sanoq bilan solishtiring."],
  ["RX", "Ruxsatlar", "Har bir xodim faqat unga kerak bo‘lgan bo‘limni ko‘radi."],
  ["AT", "Amallar tarixi", "Muhim o‘zgarishlarni kim va qachon qilganini kuzating."],
];

const businessFlow = [
  ["01", "Xomashyo xaridi"],
  ["02", "Xomashyo ombori"],
  ["03", "Ishlab chiqarish"],
  ["04", "Tayyor mahsulot"],
  ["05", "Mijozga savdo"],
  ["06", "To‘lov va qarz"],
  ["07", "Moliya va hisobot"],
];

const ownerBenefits = [
  ["Korxona holati", "Savdo, tushum, qarz va qoldiqni bir qarashda ko‘ring."],
  ["Ishchi mehnati", "Kim qancha mahsulot bajardi — aniq miqdor bilan bilinadi."],
  ["Oylik va avans", "Berilgan avans va qolgan ish haqi esdan chiqmaydi."],
  ["Mijoz qarzi", "Kimdan qancha pul olinishi kerakligi doim ko‘rinib turadi."],
  ["Aniq ombor", "Omborda nima bor — taxmin emas, kirim-chiqim bilan tasdiqlangan raqam."],
  ["Xarajat nazorati", "Pul qayerga ketgani va qaysi hisobdan chiqqani nazorat ostida."],
];

const permissions = [
  ["Ishlab chiqarish admini", ["Zakazlar", "Bo‘limlar", "Ish hisoboti"]],
  ["Savdo admini", ["Mijozlar", "Savdo", "To‘lovlar"]],
  ["Xomashyo admini", ["Xarid", "Ta’minotchi", "Xomashyo ombori"]],
  ["Hisobchi", ["Moliya", "Oylik", "Xarajatlar"]],
];

const securityItems = [
  ["Ajratilgan ma’lumot", "Har bir korxona faqat o‘z ma’lumotlari bilan ishlaydi."],
  ["Aniq ruxsat", "Foydalanuvchi faqat berilgan vakolat doirasini ko‘radi."],
  ["Amallar tarixi", "Muhim o‘zgarishlar foydalanuvchi va vaqt bilan qayd etiladi."],
  ["Qo‘shimcha himoya", "Super administrator kirishi Google Authenticator bilan himoyalanadi."],
];

function Reveal({ children, className = "", delay = 0, component = "div" }) {
  const reduceMotion = useReducedMotion();
  return (
    <Box
      component={motion[component] || motion.div}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.62, delay, ease }}
    >
      {children}
    </Box>
  );
}

function Brand({ compact = false }) {
  return (
    <Box className={`pl-brand ${compact ? "compact" : ""}`}>
      <Box component="img" src={alAminErpLogo} alt="Al-amin ERP logotipi" />
      <Box>
        <Typography>AL-AMIN ERP</Typography>
        <Typography>Korxonani boshqarish tizimi</Typography>
      </Box>
    </Box>
  );
}

function SectionTitle({ eyebrow, title, text, light = false, center = false }) {
  return (
    <Reveal className={`pl-section-title ${light ? "light" : ""} ${center ? "center" : ""}`}>
      <Typography className="pl-eyebrow">{eyebrow}</Typography>
      <Typography component="h2">{title}</Typography>
      {text && <Typography component="p">{text}</Typography>}
    </Reveal>
  );
}

function HeroDashboard() {
  const kpis = [
    ["Jami savdo", "3,24 mlrd", "+18,6%", "red"],
    ["Tushum", "2,86 mlrd", "+14,2%", "green"],
    ["Mijoz qarzi", "380 mln", "nazoratda", "amber"],
  ];

  return (
    <Reveal className="pl-hero-dashboard" delay={0.18}>
      <Box className="pl-dashboard-windowbar">
        <Box className="pl-window-dots">
          <i />
          <i />
          <i />
        </Box>
        <Typography>Rahbar bosh sahifasi</Typography>
        <Box className="pl-live">
          <span /> Jonli nazorat
        </Box>
      </Box>
      <Box className="pl-dashboard-body">
        <Box className="pl-dashboard-kpis">
          {kpis.map(([label, value, helper, tone]) => (
            <Box key={label} className={`pl-kpi ${tone}`}>
              <Typography>{label}</Typography>
              <Typography>{value}</Typography>
              <Typography>{helper}</Typography>
            </Box>
          ))}
        </Box>
        <Box className="pl-dashboard-grid">
          <Box className="pl-chart-card">
            <Box className="pl-card-head">
              <Box>
                <Typography>Savdo dinamikasi</Typography>
                <Typography>So‘nggi 6 oy</Typography>
              </Box>
              <Typography>+18,6%</Typography>
            </Box>
            <svg viewBox="0 0 560 205" role="img" aria-label="Savdo o‘sish grafigi">
              <defs>
                <linearGradient id="heroChart" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#dc2626" stopOpacity=".28" />
                  <stop offset="1" stopColor="#dc2626" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="grid" d="M18 35H542M18 92H542M18 149H542" />
              <path
                className="area"
                d="M18 154 C80 140,95 117,145 124 S235 100,285 108 S375 66,425 73 S500 34,542 42 L542 184 L18 184 Z"
              />
              <path
                className="line"
                d="M18 154 C80 140,95 117,145 124 S235 100,285 108 S375 66,425 73 S500 34,542 42"
              />
              {[18, 145, 285, 425, 542].map((cx, index) => (
                <circle key={cx} cx={cx} cy={[154, 124, 108, 73, 42][index]} r="4" />
              ))}
            </svg>
            <Box className="pl-chart-months">
              <span>Yan</span>
              <span>Fev</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Iyun</span>
            </Box>
          </Box>
          <Box className="pl-dashboard-side">
            <Box className="pl-production-card">
              <Typography>Tayyor mahsulot</Typography>
              <Typography>
                12 480 <small>birlik</small>
              </Typography>
              <Box>
                <span style={{ width: "78%" }} />
              </Box>
              <Typography>Oylik rejaning 78 foizi</Typography>
            </Box>
            <Box className="pl-alert-card">
              <span>!</span>
              <Box>
                <Typography>3 ta muhim vazifa</Typography>
                <Typography>Rahbar nazoratini kutmoqda</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Reveal>
  );
}

function FullDashboard() {
  const metrics = [
    ["Jami savdo", "3 240 000 000 so‘m", "18,6% o‘sish"],
    ["Mijozlardan tushum", "2 860 000 000 so‘m", "380 mln qarz qoldi"],
    ["Xomashyo xaridi", "465 000 000 so‘m", "26 ta xarid"],
    ["Jami xarajat", "220 000 000 so‘m", "Nazoratdagi davr"],
  ];
  return (
    <Reveal className="pl-full-dashboard">
      <Box className="pl-full-top">
        <Box>
          <Typography>Korxona boshqaruv paneli</Typography>
          <Typography>2026-yil, avgust</Typography>
        </Box>
        <Box className="pl-full-user">
          <span>JR</span>
          <Box>
            <Typography>Rahbar</Typography>
            <Typography>Super administrator</Typography>
          </Box>
        </Box>
      </Box>
      <Box className="pl-full-metrics">
        {metrics.map(([label, value, helper]) => (
          <Box key={label}>
            <Typography>{label}</Typography>
            <Typography>{value}</Typography>
            <Typography>{helper}</Typography>
          </Box>
        ))}
      </Box>
      <Box className="pl-full-content">
        <Box className="pl-full-chart">
          <Box className="pl-card-head">
            <Box>
              <Typography>Moliyaviy harakat</Typography>
              <Typography>Savdo va tushum taqqoslanishi</Typography>
            </Box>
            <Typography>6 oy</Typography>
          </Box>
          <svg
            className="pl-svg-chart"
            viewBox="0 0 600 176"
            role="img"
            aria-label="Savdo va tushum taqqoslanishi"
          >
            <defs>
              <linearGradient id="fullChart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6e1622" stopOpacity=".16" />
                <stop offset="1" stopColor="#6e1622" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="grid" d="M0 34H600M0 78H600M0 122H600" />
            <path
              className="area"
              d="M8 132 C70 120,96 96,158 104 S256 78,318 86 S414 44,476 52 S560 24,592 30 L592 166 L8 166 Z"
            />
            <path
              className="line"
              d="M8 132 C70 120,96 96,158 104 S256 78,318 86 S414 44,476 52 S560 24,592 30"
            />
            {/* Ikkinchi chiziq — tushum. Savdo bilan farqni ko'rsatadi. */}
            <path
              className="compare"
              d="M8 146 C70 138,96 120,158 126 S256 106,318 112 S414 80,476 86 S560 62,592 66"
            />
            {[8, 158, 318, 476, 592].map((cx, index) => (
              <circle key={cx} cx={cx} cy={[132, 104, 86, 52, 30][index]} r="4" />
            ))}
          </svg>
          <Box className="pl-chart-months">
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Iyun</span>
            <span>Iyul</span>
            <span>Avg</span>
          </Box>
        </Box>
        <Box className="pl-activity">
          <Typography>So‘nggi faoliyat</Typography>
          {[
            ["Savdo yaratildi", "+24 800 000 so‘m", "hozir"],
            ["Mijoz to‘lovi", "+18 500 000 so‘m", "12 daqiqa"],
            ["Xomashyo olindi", "6 200 kg", "34 daqiqa"],
            ["Bo‘lim ishi yakunlandi", "320 dona", "1 soat"],
          ].map(([title, value, time]) => (
            <Box key={title}>
              <i />
              <Box>
                <Typography>{title}</Typography>
                <Typography>{time} oldin</Typography>
              </Box>
              <Typography>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Reveal>
  );
}

function PermissionCard({ role, items, index }) {
  return (
    <Box className="pl-permission-card">
      <Box className="pl-permission-role">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <Typography>{role}</Typography>
      </Box>
      {items.map((item, itemIndex) => (
        <Box className="pl-permission-row" key={item}>
          <Typography>{item}</Typography>
          <span className={itemIndex < 2 ? "on" : ""}>
            <i />
          </span>
        </Box>
      ))}
    </Box>
  );
}

/** Qurilma maketidagi kichik grafik. Ilgari clip-path bilan chizilardi. */
function MiniChart({ viewBox = "0 0 240 110", line, area }) {
  return (
    <svg className="pl-mini-chart" viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">
      <path className="grid" d="M0 28H240M0 55H240M0 82H240" />
      <path className="area" d={area} />
      <path className="line" d={line} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function DevicesVisual() {
  return (
    <Box className="pl-devices" aria-label="Al-amin ERP desktop va mobil ko‘rinishi">
      <Box className="pl-desktop-device">
        <Box className="pl-device-bar">
          <i />
          <i />
          <i />
        </Box>
        <Box className="pl-device-layout">
          <aside>
            <span />
            <span />
            <span />
            <span />
          </aside>
          <main>
            <Box className="pl-device-kpis">
              <i />
              <i />
              <i />
            </Box>
            <Box className="pl-device-chart">
              <MiniChart
                line="M10 86 C46 78,58 58,94 64 S150 42,186 48 S222 20,230 24"
                area="M10 86 C46 78,58 58,94 64 S150 42,186 48 S222 20,230 24 L230 104 L10 104 Z"
              />
            </Box>
          </main>
        </Box>
      </Box>
      <Box className="pl-phone-device">
        <i className="pl-notch" />
        <Box className="pl-phone-head">
          <span>AL</span>
          <i />
        </Box>
        <Box className="pl-phone-kpis">
          <i />
          <i />
          <i />
          <i />
        </Box>
        <Box className="pl-phone-chart">
          <MiniChart
            line="M10 84 C42 76,56 62,88 66 S142 34,174 42 S218 16,230 22"
            area="M10 84 C42 76,56 62,88 66 S142 34,174 42 S218 16,230 22 L230 104 L10 104 Z"
          />
        </Box>
        <Box className="pl-phone-nav">
          <i />
          <i />
          <i />
          <i />
        </Box>
      </Box>
    </Box>
  );
}

export default function PremiumLandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Sahifada bitta asosiy harakat bor: audit so'rash. Uch joydagi qizil
  // tugma ham shu bitta oynani ochadi — mijoz nima bosishini o'ylamaydi.
  const [auditOpen, setAuditOpen] = useState(false);
  const openAudit = () => {
    setMenuOpen(false);
    setAuditOpen(true);
  };

  // Sarlavha va tavsif endi bu yerda emas, index.html ichida. Sababi:
  // izlash tizimi va Telegram/Instagram havolani ochganda JavaScript
  // ishlamaydi — ular serverdan kelgan HTML ni o'qiydi. Bu yerda qo'yilgan
  // teg faqat brauzerda paydo bo'lardi, ya'ni kerakli joyga yetmasdi.

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const navItems = [
    ["Muammolar", "muammolar"],
    ["Imkoniyatlar", "imkoniyatlar"],
    ["Tizim", "jarayon"],
    ["Nazorat", "nazorat"],
    ["Aloqa", "aloqa"],
  ];

  return (
    <Box className="premium-landing">
      <style>{premiumStyles}</style>

      <Box component="header" className="pl-header">
        <Container maxWidth="xl" className="pl-header-container">
          <Brand compact />
          <Box component="nav" className="pl-nav" aria-label="Asosiy navigatsiya">
            {navItems.map(([label, id]) => (
              <Button key={id} onClick={() => goTo(id)}>
                {label}
              </Button>
            ))}
          </Box>
          <Box className="pl-header-actions">
            <Button className="pl-button ghost" onClick={() => navigate("/login")}>
              Kirish
            </Button>
            <Button className="pl-button primary" onClick={openAudit}>
              Bepul jarayon auditi
            </Button>
          </Box>
          <Button
            className="pl-menu-button"
            aria-label="Menyuni ochish"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </Button>
          {menuOpen && (
            <Paper className="pl-mobile-menu" elevation={0}>
              {navItems.map(([label, id]) => (
                <Button key={id} onClick={() => goTo(id)}>
                  {label}
                </Button>
              ))}
              <Button onClick={() => navigate("/login")}>Tizimga kirish</Button>
              <Button className="pl-button primary" onClick={openAudit}>
                Bepul jarayon auditi
              </Button>
            </Paper>
          )}
        </Container>
      </Box>

      <Box component="main">
        <Box component="section" className="pl-hero">
          <Container maxWidth="xl">
            <Box className="pl-hero-grid">
              <Reveal className="pl-hero-copy">
                <Typography className="pl-eyebrow">
                  ISHLAB CHIQARISH KORXONALARI UCHUN ERP
                </Typography>
                <Typography component="h1">
                  Xomashyodan tayyor mahsulotgacha — <span>har bir so‘m nazoratda.</span>
                </Typography>
                <Typography component="p">
                  Savdo, ombor, ishlab chiqarish, xodimlar va moliyani tarqoq daftarlar bilan emas,
                  o‘zaro bog‘langan aniq raqamlar bilan boshqaring.
                </Typography>
                <Box className="pl-hero-actions">
                  <Button className="pl-button primary large" onClick={openAudit}>
                    Bepul jarayon auditi
                  </Button>
                  <Button className="pl-button outline large" onClick={() => goTo("dashboard")}>
                    Tizimni ko‘rish
                  </Button>
                </Box>
                <Box className="pl-trust-line">
                  <span />
                  <Typography>Korxona ma’lumotlari ajratilgan</Typography>
                  <i />
                  <Typography>Muhim amallar qayd etiladi</Typography>
                </Box>
              </Reveal>
              <HeroDashboard />
            </Box>
          </Container>
        </Box>

        <Box className="pl-signal-strip">
          <Container maxWidth="xl">
            <Box>
              {[
                ["15+", "boshqaruv yo‘nalishi"],
                ["Bitta", "bog‘langan biznes oqimi"],
                ["Aniq", "ruxsat va javobgarlik"],
                ["24/7", "telefon va kompyuterdan kirish"],
              ].map(([value, label]) => (
                <Box key={label}>
                  <Typography>{value}</Typography>
                  <Typography>{label}</Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>

        <Box id="muammolar" component="section" className="pl-section pl-warm">
          <Container maxWidth="xl">
            <SectionTitle
              eyebrow="TANISH MUAMMOLAR"
              title="Korxonani raqam bilan emas, xotira bilan boshqaryapsizmi?"
              text="Kichik chalkashliklar yig‘ilib, pul va vaqt yo‘qotishiga aylanadi. Al-amin ERP shu nuqtalarni bitta nazorat tizimiga bog‘laydi."
            />
            <Box className="pl-pain-grid">
              {painPoints.map(([no, title, text], index) => (
                <Reveal className="pl-pain-card" key={title} delay={index * 0.06}>
                  <Typography>{no}</Typography>
                  <Typography component="h3">{title}</Typography>
                  <Typography component="p">{text}</Typography>
                </Reveal>
              ))}
            </Box>
          </Container>
        </Box>

        <Box id="imkoniyatlar" component="section" className="pl-section pl-white">
          <Container maxWidth="xl">
            <SectionTitle
              eyebrow="ASOSIY IMKONIYATLAR"
              title="Korxonadagi har bir muhim jarayon uchun aniq boshqaruv."
              text="Modullar alohida ishlamaydi. Savdo omborga, ishlab chiqarish ish haqiga, to‘lovlar esa moliyaviy holatga ta’sir qiladi."
            />
            <Box className="pl-module-grid">
              {modules.map(([code, title, text], index) => (
                <Reveal className="pl-module-card" key={title} delay={(index % 4) * 0.04}>
                  <Box>{code}</Box>
                  <Typography component="h3">{title}</Typography>
                  <Typography component="p">{text}</Typography>
                  <span>→</span>
                </Reveal>
              ))}
            </Box>
          </Container>
        </Box>

        <Box id="jarayon" component="section" className="pl-section pl-dark">
          <Container maxWidth="xl">
            <SectionTitle
              light
              eyebrow="BOG‘LANGAN BIZNES OQIMI"
              title="Xomashyodan tushumgacha — hammasi bir zanjirda."
              text="Bir bo‘limdagi harakat keyingi jarayon uchun tayyor ma’lumotga aylanadi. Qayta yozish va alohida hisoblash kamayadi."
            />
            <Box className="pl-flow">
              {businessFlow.map(([no, title], index) => (
                <Reveal className="pl-flow-step" key={title} delay={index * 0.05}>
                  <Typography>{no}</Typography>
                  <Typography>{title}</Typography>
                  {index < businessFlow.length - 1 && <span>→</span>}
                </Reveal>
              ))}
            </Box>
            <Reveal className="pl-flow-note">
              <Typography>Natija</Typography>
              <Typography>
                Rahbar korxonaning real holatini kechagi daftar emas, bugungi raqamlar orqali
                ko‘radi.
              </Typography>
            </Reveal>
          </Container>
        </Box>

        <Box id="dashboard" component="section" className="pl-section pl-dashboard-section">
          <Container maxWidth="xl">
            <SectionTitle
              center
              eyebrow="REAL BOSHQARUV PANELI"
              title="Muhim raqamlar rahbar ko‘radigan tilda."
              text="Demo qiymatlar real ishlab chiqarish korxonasi miqyosida tuzilgan. Bu faqat landing namoyishi — production ma’lumotlariga ta’sir qilmaydi."
            />
            <FullDashboard />
          </Container>
        </Box>

        <Box id="nazorat" component="section" className="pl-section pl-warm">
          <Container maxWidth="xl">
            <Box className="pl-benefit-layout">
              <SectionTitle
                eyebrow="RAHBAR UCHUN NATIJA"
                title="Korxonada nima bo‘layotganini bir qarashda ko‘ring."
                text="Murakkab hisobot izlash shart emas. Kerakli savollarning javobi bosh sahifada va tegishli bo‘limlarda tayyor turadi."
              />
              <Box className="pl-benefit-grid">
                {ownerBenefits.map(([title, text], index) => (
                  <Reveal className="pl-benefit-card" key={title} delay={(index % 2) * 0.06}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Box>
                      <Typography component="h3">{title}</Typography>
                      <Typography component="p">{text}</Typography>
                    </Box>
                  </Reveal>
                ))}
              </Box>
            </Box>
          </Container>
        </Box>

        <Box component="section" className="pl-section pl-white">
          <Container maxWidth="xl">
            <Box className="pl-permission-layout">
              <Box>
                <SectionTitle
                  eyebrow="RUXSAT VA JAVOBGARLIK"
                  title="Har bir xodim faqat o‘z ishini ko‘radi."
                  text="Savdo adminiga oylik sozlamalari, omborchiga esa platforma boshqaruvi kerak emas. Vakolatlar rol va ruxsatlar bo‘yicha aniq ajratiladi."
                />
                <Reveal className="pl-permission-summary">
                  <span>✓</span>
                  <Box>
                    <Typography>Ortiqcha menyu yo‘q</Typography>
                    <Typography>Xodimga tushunarli, rahbarga xavfsiz boshqaruv.</Typography>
                  </Box>
                </Reveal>
              </Box>
              <Reveal className="pl-permission-panel">
                <Box className="pl-panel-head">
                  <Typography>Ruxsatlar boshqaruvi</Typography>
                  <Typography>4 ta rol</Typography>
                </Box>
                <Box className="pl-permission-grid">
                  {permissions.map(([role, items], index) => (
                    <PermissionCard key={role} role={role} items={items} index={index} />
                  ))}
                </Box>
              </Reveal>
            </Box>
          </Container>
        </Box>

        <Box component="section" className="pl-section pl-device-section">
          <Container maxWidth="xl">
            <Box className="pl-device-layout-section">
              <Reveal>
                <DevicesVisual />
              </Reveal>
              <Box>
                <SectionTitle
                  light
                  eyebrow="TELEFON VA KOMPYUTERDA"
                  title="Ofisda kompyuterdan, tashqarida telefondan nazorat qiling."
                  text="Al-amin ERP ekran o‘lchamiga moslashadi. Rahbar, admin va ishchi o‘ziga kerakli jarayonni ortiqcha murakkabliksiz ko‘radi."
                />
                <Box className="pl-device-points">
                  {[
                    "Mobil uchun ixcham kartalar",
                    "Pastki tezkor navigatsiya",
                    "Desktopda keng boshqaruv paneli",
                  ].map((item) => (
                    <Box key={item}>
                      <span>✓</span>
                      <Typography>{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        <Box component="section" className="pl-section pl-security">
          <Container maxWidth="xl">
            <SectionTitle
              center
              eyebrow="ISHONCHLI NAZORAT"
              title="Ma’lumot va vakolat bir-biridan aniq ajratilgan."
              text="Tizim xavfsizlik haqida baland va’dalar bermaydi — amalda mavjud nazorat mexanizmlarini tushunarli ko‘rsatadi."
            />
            <Box className="pl-security-grid">
              {securityItems.map(([title, text], index) => (
                <Reveal className="pl-security-card" key={title} delay={index * 0.05}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <Typography component="h3">{title}</Typography>
                  <Typography component="p">{text}</Typography>
                </Reveal>
              ))}
            </Box>
          </Container>
        </Box>

        <Box id="aloqa" component="section" className="pl-final-section">
          <Container maxWidth="xl">
            <Reveal className="pl-final-card">
              <Box>
                <Typography className="pl-eyebrow">KORXONANGIZGA MOS YECHIM</Typography>
                <Typography component="h2">
                  Al-amin ERP korxonangizda qanday ishlashini ko‘ring.
                </Typography>
                <Typography component="p">
                  Daftar, tarqoq Excel va eslab qolishga tayangan hisobdan aniq boshqaruv tizimiga
                  o‘ting.
                </Typography>
              </Box>
              <Box className="pl-final-actions">
                <Button className="pl-button white large" onClick={openAudit}>
                  Bepul jarayon auditi
                </Button>
                <Button
                  component="a"
                  href="tel:+998915717009"
                  className="pl-button dark-outline large"
                >
                  +998 91 571 70 09
                </Button>
                <Typography>Maslahat va tizim bo‘yicha bog‘lanish</Typography>
              </Box>
            </Reveal>
          </Container>
        </Box>
      </Box>

      <Box component="footer" className="pl-footer">
        <Container maxWidth="xl">
          <Box className="pl-footer-top">
            <Brand compact />
            <Typography>
              Savdo, ombor, ishlab chiqarish, xodimlar va moliyani bitta joydan boshqarish uchun
              yaratilgan tizim.
            </Typography>
            <Box>
              <Button onClick={() => goTo("imkoniyatlar")}>Imkoniyatlar</Button>
              <Button onClick={() => goTo("jarayon")}>Tizim</Button>
              <Button onClick={() => navigate("/login")}>Kirish</Button>
            </Box>
          </Box>
          <Box className="pl-footer-bottom">
            <Typography>
              © {new Date().getFullYear()} Al-amin ERP. Barcha huquqlar himoyalangan.
            </Typography>
            <Typography>al-amin.uz · +998 91 571 70 09</Typography>
          </Box>

          {/* Asoschi imzosi — kitob oxiridagi nashriyot qatoridek. */}
          <Box className="pl-founder">
            <span />
            <Typography>Asoschi Muhammadamin Rustamov</Typography>
            <span />
          </Box>
        </Container>
      </Box>

      <AuditRequestDialog open={auditOpen} onClose={() => setAuditOpen(false)} />
    </Box>
  );
}

const premiumStyles = `
  /* ------------------------------------------------------------------
     RANG VA SHRIFT TIZIMI

     Ilgari yorqin qizil (#b91c1c) toza oq fonda ishlatilardi — bu
     "korporativ shablon" tuyg'usini beradi. Endi:

       wine   — chuqur qizil (oxblood). Charm va sifat bilan bog'lanadi.
       brass  — guruch. Faqat nozik chiziq, raqam va belgilar uchun;
                aynan shu bitta metall urg'u qimmat ko'rinishni beradi.
       ink    — issiq qora (ko'k emas). Bone — issiq qog'oz rangi.

     Shrift: sarlavhalar uchun antiqa (Georgia hamma tizimda bor va
     yirik o'lchamda haqiqiy xarakterga ega), matn uchun grotesk.
     Ilgari hamma joyda font-weight:950 turardi — Inter'da bunday
     og'irlik yo'q, brauzer uni sun'iy qalinlashtirar va xira chiqardi.
     Endi og'irliklar ierarxiya hosil qiladi: 700 sarlavha, 600 yorliq.
     ------------------------------------------------------------------ */
  .premium-landing{
    --wine:#6e1622;--wine-2:#8c1d2b;--wine-soft:#f7ecec;
    --brass:#a9814b;--brass-2:#c9a875;--brass-soft:#f3ebde;
    --ink:#17110f;--ink-2:#4b413c;--ink-3:#7d716a;
    --paper:#ffffff;--bone:#f8f5f1;--sunk:#f1ece5;
    --line:#e8e1d8;--line-2:#d8cec1;
    --night:#151211;--night-2:#1e1a18;--night-3:#272220;--night-line:#332c28;
    --night-ink:#f4efe9;--night-ink-2:#b6aca4;--night-ink-3:#8a807a;
    --green:#2f6b45;--green-light:#6cbf8b;
    --display:Georgia,"Iowan Old Style","Times New Roman",serif;
    --sans:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    --shadow-sm:0 10px 26px rgba(23,17,15,.05);
    --shadow-md:0 20px 46px rgba(23,17,15,.08);
    --shadow-lg:0 38px 84px rgba(23,17,15,.14);
    position:relative;min-height:100vh;overflow-x:hidden;
    background:var(--paper);color:var(--ink);font-family:var(--sans);scroll-behavior:smooth
  }

  /* Qorong'i mavzu. Ilgari landing faqat oq edi va tungi rejimda
     ko'z qamashardi. Ranglar tokenlar orqali almashadi, tuzilma emas. */
  :root[data-theme="dark"] .premium-landing{
    --wine:#a8303f;--wine-2:#c2404f;--wine-soft:#2a1618;
    --brass:#c9a875;--brass-2:#e0c69a;--brass-soft:#2a2318;
    --ink:#f4efe9;--ink-2:#c2b8b0;--ink-3:#8f8781;
    --paper:#131110;--bone:#191614;--sunk:#201c1a;
    --line:#2f2926;--line-2:#3d3531;
    --night:#0e0c0b;--night-2:#171413;--night-3:#201c1a;--night-line:#2e2825;
    --shadow-sm:0 10px 26px rgba(0,0,0,.4);
    --shadow-md:0 20px 46px rgba(0,0,0,.48);
    --shadow-lg:0 38px 84px rgba(0,0,0,.56)
  }

  /* Juda nozik don. Tekis oq fon "bosilmagan" ko'rinadi; don unga
     qog'oz sifatini beradi. Faqat bezak — bosishga xalaqit bermaydi. */
  .premium-landing:before{
    content:"";position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.5;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.045'/%3E%3C/svg%3E");
    mix-blend-mode:multiply
  }
  :root[data-theme="dark"] .premium-landing:before{mix-blend-mode:screen;opacity:.35}
  .premium-landing>*{position:relative;z-index:2}

  .premium-landing *{box-sizing:border-box}
  .premium-landing .MuiButton-root{font-family:inherit;text-transform:none}
  .pl-section{padding:clamp(78px,8vw,132px) 0;scroll-margin-top:84px}
  .pl-white{background:var(--paper)}
  .pl-warm{background:var(--bone)}
  /* --------------------------- Sarlavha ---------------------------- */
  /* Birinchi e'lon — zaxira: color-mix qo'llanmaydigan brauzerda sarlavha
     shaffof bo'lib qolmasligi uchun. Yaroqsiz e'lon tashlanadi, oldingisi qoladi. */
  .pl-header{position:sticky;top:0;z-index:50;border-bottom:1px solid var(--line);background:var(--paper);backdrop-filter:blur(22px) saturate(140%)}
  .pl-header{background:color-mix(in srgb,var(--paper) 88%,transparent)}
  .pl-header-container{position:relative;min-height:78px;display:grid!important;grid-template-columns:260px 1fr 300px;align-items:center;gap:22px}
  .pl-brand{display:flex;align-items:center;gap:13px;min-width:0}
  /* Belgi shaffof PNG — "cover" uni kesib yuborardi. "contain" + ichki
     bo'shliq bilan u ramka ichida markazda turadi. */
  .pl-brand>img{width:52px;height:52px;padding:5px;object-fit:contain;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow-sm)}
  .pl-brand>div{min-width:0}
  .pl-brand .MuiTypography-root:first-child{font-family:var(--display);font-size:17px;font-weight:700;letter-spacing:-.015em}
  .pl-brand .MuiTypography-root:last-child{margin-top:3px;color:var(--ink-3);font-size:9px;font-weight:600;letter-spacing:.055em;text-transform:uppercase}
  .pl-brand.compact>img{width:42px;height:42px;border-radius:12px}
  .pl-nav{display:flex;justify-content:center;gap:2px}
  .pl-nav .MuiButton-root{min-width:0;padding:9px 13px;color:var(--ink-2);font-size:12px;font-weight:600;letter-spacing:.005em}
  .pl-nav .MuiButton-root:hover{color:var(--wine);background:var(--wine-soft)}
  .pl-header-actions{display:flex;justify-content:flex-end;gap:9px}

  /* Tugmalar. Gradient o'rniga tekis chuqur rang va nozik guruch chiziq. */
  .pl-button{min-height:45px!important;padding:0 20px!important;border-radius:11px!important;font-size:12px!important;font-weight:700!important;letter-spacing:.005em!important;box-shadow:none!important;transition:transform .24s cubic-bezier(.22,1,.36,1),background-color .24s ease,border-color .24s ease,box-shadow .24s ease}
  .pl-button.primary{color:#fdf9f4!important;background:var(--wine)!important;box-shadow:0 12px 30px color-mix(in srgb,var(--wine) 26%,transparent)!important}
  .pl-button.primary:hover{transform:translateY(-2px);background:var(--wine-2)!important;box-shadow:0 16px 38px color-mix(in srgb,var(--wine) 34%,transparent)!important}
  .pl-button.ghost{color:var(--ink-2)!important}
  .pl-button.ghost:hover{color:var(--wine)!important;background:var(--wine-soft)!important}
  .pl-button.outline{color:var(--ink)!important;border:1px solid var(--line-2)!important;background:transparent!important}
  .pl-button.outline:hover{transform:translateY(-2px);border-color:var(--brass)!important;background:var(--brass-soft)!important}
  .pl-button.large{min-height:54px!important;padding:0 26px!important;font-size:13px!important}
  .pl-menu-button,.pl-mobile-menu{display:none!important}
  /* ----------------------------- Hero ------------------------------ */
  .pl-hero{position:relative;padding:clamp(64px,7vw,112px) 0 clamp(78px,8vw,126px);overflow:hidden;background:radial-gradient(ellipse 60% 50% at 6% 4%,color-mix(in srgb,var(--wine) 7%,transparent),transparent 70%),linear-gradient(180deg,var(--paper) 0%,var(--bone) 100%)}
  .pl-hero:after{content:"";position:absolute;right:-190px;top:-260px;width:640px;height:640px;border:1px solid color-mix(in srgb,var(--brass) 24%,transparent);border-radius:50%;box-shadow:0 0 0 90px color-mix(in srgb,var(--brass) 5%,transparent),0 0 0 180px color-mix(in srgb,var(--brass) 3%,transparent);pointer-events:none}
  .pl-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,.88fr) minmax(560px,1.12fr);align-items:center;gap:clamp(42px,6vw,94px)}

  /* Ustki yorliq — oldida qisqa guruch chiziq. Bu bitta detal
     bo'limlarga bosma nashr ohangini beradi. */
  .pl-eyebrow{position:relative;display:inline-flex;align-items:center;gap:11px;color:var(--wine)!important;font-size:10px!important;font-weight:700!important;letter-spacing:.16em!important}
  .pl-eyebrow:before{content:"";width:26px;height:1px;flex:0 0 auto;background:var(--brass)}

  /* Hero yorlig'i alohida: aynan shu qator kimga mo'ljallanganini aytadi,
     shuning uchun boshqa bo'lim yorliqlaridan kattaroq. Qolgan
     .pl-eyebrow o'lchamlari o'zgarmaydi. */
  .pl-hero-copy .pl-eyebrow{
    gap:14px;
    font-size:clamp(11.5px,1.05vw,14px)!important;
    letter-spacing:.185em!important;
    line-height:1.45!important
  }
  .pl-hero-copy .pl-eyebrow:before{width:38px;height:1.5px}

  .pl-hero-copy h1{max-width:720px;margin:22px 0 0;font-family:var(--display);font-size:clamp(44px,5vw,78px);line-height:1.02;letter-spacing:-.032em;font-weight:400}
  .pl-hero-copy h1 span{color:var(--wine);font-style:italic}
  .pl-hero-copy>p{max-width:620px;margin:26px 0 0;color:var(--ink-2);font-size:clamp(15px,1.2vw,17.5px);line-height:1.78;font-weight:400}
  .pl-hero-actions{display:flex;gap:11px;margin-top:34px}
  .pl-trust-line{display:flex;align-items:center;gap:9px;margin-top:26px;color:var(--ink-3)}
  .pl-trust-line>span{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 0 5px color-mix(in srgb,var(--green) 12%,transparent)}
  .pl-trust-line>i{width:1px;height:14px;margin:0 6px;background:var(--line-2)}
  .pl-trust-line .MuiTypography-root{font-size:10.5px;font-weight:600;letter-spacing:.01em}
  /* Hero ichidagi panel maketi. Fon issiq qora — ko'kimtir emas, shunda
     u guruch va sharob ranglari bilan bir oilada turadi. */
  .pl-hero-dashboard{position:relative;overflow:hidden;border:1px solid var(--night-line);border-radius:22px;background:var(--night);box-shadow:var(--shadow-lg);transform:perspective(1500px) rotateY(-2deg)}
  .pl-hero-dashboard{box-shadow:var(--shadow-lg),0 0 0 7px color-mix(in srgb,var(--paper) 70%,transparent)}
  .pl-dashboard-windowbar{height:54px;padding:0 18px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;border-bottom:1px solid var(--night-line);background:var(--night-2)}
  .pl-dashboard-windowbar>.MuiTypography-root{color:var(--night-ink);font-size:10px;font-weight:600;letter-spacing:.04em}
  .pl-window-dots{display:flex;gap:6px}
  .pl-window-dots i{width:8px;height:8px;border-radius:50%;background:#3a332f}
  .pl-window-dots i:first-child{background:var(--wine-2)}
  .pl-live{justify-self:end;display:flex;align-items:center;gap:6px;color:var(--night-ink-2);font-size:9px;font-weight:600}
  .pl-live span{width:6px;height:6px;border-radius:50%;background:var(--green-light);box-shadow:0 0 0 4px color-mix(in srgb,var(--green-light) 14%,transparent)}
  .pl-dashboard-body{padding:17px}
  .pl-dashboard-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
  .pl-kpi{padding:15px;border:1px solid var(--night-line);border-radius:14px;background:var(--night-2)}
  .pl-kpi .MuiTypography-root:first-child{color:var(--night-ink-3);font-size:8.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
  .pl-kpi .MuiTypography-root:nth-child(2){margin-top:8px;color:var(--night-ink);font-family:var(--display);font-size:21px;font-weight:400;letter-spacing:-.02em}
  .pl-kpi .MuiTypography-root:last-child{margin-top:5px;font-size:8px;font-weight:600}
  .pl-kpi.red .MuiTypography-root:last-child{color:var(--brass-2)}
  .pl-kpi.green .MuiTypography-root:last-child{color:var(--green-light)}
  .pl-kpi.amber .MuiTypography-root:last-child{color:var(--night-ink-2)}
  .pl-dashboard-grid{display:grid;grid-template-columns:1.65fr .75fr;gap:9px;margin-top:9px}
  .pl-chart-card,.pl-production-card,.pl-alert-card{border:1px solid var(--night-line);border-radius:14px;background:var(--night-2)}
  .pl-chart-card{padding:15px 15px 10px}
  .pl-card-head{display:flex;justify-content:space-between;align-items:flex-start}
  .pl-card-head>div .MuiTypography-root:first-child,.pl-card-head>.MuiTypography-root:first-child{color:var(--night-ink);font-size:10px;font-weight:650}
  .pl-card-head>div .MuiTypography-root:last-child{margin-top:3px;color:var(--night-ink-3);font-size:7.5px}
  .pl-card-head>.MuiTypography-root:last-child{color:var(--green-light);font-size:9px;font-weight:700}
  .pl-chart-card svg{display:block;width:100%;height:146px;margin-top:4px;overflow:visible}
  .pl-chart-card svg .grid{fill:none;stroke:var(--night-3);stroke-width:1;stroke-dasharray:3 7}
  .pl-chart-card svg .area{fill:url(#heroChart)}
  .pl-chart-card svg .line{fill:none;stroke:#c2404f;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
  .pl-chart-card svg circle{fill:var(--night-2);stroke:var(--brass-2);stroke-width:2}
  .pl-chart-months{display:flex;justify-content:space-between;color:var(--night-ink-3);font-size:7px;font-weight:600;letter-spacing:.05em}
  .pl-dashboard-side{display:grid;gap:9px}
  .pl-production-card{padding:15px}
  .pl-production-card>.MuiTypography-root:first-child{color:var(--night-ink-3);font-size:8px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
  .pl-production-card>.MuiTypography-root:nth-child(2){margin-top:10px;color:var(--night-ink);font-family:var(--display);font-size:21px;font-weight:400}
  .pl-production-card small{color:var(--night-ink-3);font-family:var(--sans);font-size:8px}
  .pl-production-card>div{height:4px;margin-top:14px;overflow:hidden;border-radius:10px;background:var(--night-3)}
  .pl-production-card>div span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--wine-2),var(--brass))}
  .pl-production-card>.MuiTypography-root:last-child{margin-top:8px;color:var(--night-ink-3);font-size:7.5px}
  .pl-alert-card{padding:13px;display:flex;align-items:center;gap:10px}
  .pl-alert-card>span{width:28px;height:28px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;color:var(--brass-2);font-family:var(--display);font-size:12px;background:color-mix(in srgb,var(--brass) 16%,transparent)}
  .pl-alert-card .MuiTypography-root:first-child{color:var(--night-ink);font-size:8.5px;font-weight:650}
  .pl-alert-card .MuiTypography-root:last-child{margin-top:3px;color:var(--night-ink-3);font-size:7px}
  .pl-signal-strip{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--paper)}
  .pl-signal-strip .MuiContainer-root>div{display:grid;grid-template-columns:repeat(4,1fr)}
  .pl-signal-strip .MuiContainer-root>div>div{padding:27px 30px;border-right:1px solid var(--line)}
  .pl-signal-strip .MuiContainer-root>div>div:first-child{border-left:1px solid var(--line)}
  .pl-signal-strip .MuiTypography-root:first-child{font-family:var(--display);font-size:24px;font-weight:400;letter-spacing:-.02em}
  .pl-signal-strip .MuiTypography-root:last-child{margin-top:6px;color:var(--ink-3);font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
  /* ------------------------- Bo'lim sarlavhasi ---------------------- */
  .pl-section-title{max-width:780px}
  .pl-section-title.center{margin:0 auto;text-align:center}
  .pl-section-title.center .pl-eyebrow{justify-content:center}
  .pl-section-title h2{margin:16px 0 0;font-family:var(--display);font-size:clamp(33px,3.9vw,56px);line-height:1.1;letter-spacing:-.028em;font-weight:400;text-wrap:balance}
  .pl-section-title p{max-width:660px;margin:20px 0 0;color:var(--ink-2);font-size:15px;line-height:1.78}
  .pl-section-title.center p{margin-left:auto;margin-right:auto}
  .pl-section-title.light h2{color:var(--night-ink)}
  .pl-section-title.light p{color:var(--night-ink-2)}
  .pl-section-title.light .pl-eyebrow{color:var(--brass-2)!important}
  .pl-section-title.light .pl-eyebrow:before{background:var(--brass)}

  /* Raqamlar antiqa shriftda va guruch rangda — kartaning yagona bezagi. */
  .pl-pain-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:48px}
  .pl-pain-card{min-height:238px;padding:27px;display:flex;flex-direction:column;border:1px solid var(--line);border-radius:16px;background:var(--paper);box-shadow:var(--shadow-sm)}
  .pl-pain-card>.MuiTypography-root:first-child{color:var(--brass);font-family:var(--display);font-size:15px;font-weight:400;letter-spacing:.04em}
  .pl-pain-card h3{margin-top:auto;padding-top:42px;font-family:var(--display);font-size:19px;line-height:1.3;font-weight:400;letter-spacing:-.015em}
  .pl-pain-card p{margin-top:11px;color:var(--ink-3);font-size:12px;line-height:1.68}
  .pl-module-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:48px}
  .pl-module-card{position:relative;min-height:222px;padding:25px;border:1px solid var(--line);border-radius:16px;background:var(--paper)}
  .pl-module-card>div:first-child{width:44px;height:44px;display:grid;place-items:center;border:1px solid var(--brass-soft);border-radius:12px;color:var(--wine);font-size:10px;font-weight:700;letter-spacing:.06em;background:var(--wine-soft)}
  .pl-module-card h3{margin-top:28px;font-family:var(--display);font-size:18px;font-weight:400;letter-spacing:-.015em}
  .pl-module-card p{margin-top:10px;color:var(--ink-3);font-size:11.5px;line-height:1.68}
  .pl-module-card>span{position:absolute;right:22px;bottom:20px;color:var(--line-2);font-size:16px;transition:color .28s ease,transform .28s cubic-bezier(.22,1,.36,1)}
  .pl-module-card:last-child{grid-column:span 2;background:linear-gradient(135deg,var(--paper),var(--brass-soft))}
  .pl-dark{position:relative;background:var(--night)}
  .pl-dark:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 50% 60% at 82% 6%,color-mix(in srgb,var(--wine) 26%,transparent),transparent 70%);pointer-events:none}
  .pl-dark .MuiContainer-root{position:relative}
  .pl-flow{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:52px}
  .pl-flow-step{position:relative;min-width:0;padding:20px 15px;border:1px solid var(--night-line);border-radius:14px;background:var(--night-2)}
  .pl-flow-step>.MuiTypography-root:first-child{color:var(--brass-2);font-family:var(--display);font-size:13px;font-weight:400;letter-spacing:.04em}
  .pl-flow-step>.MuiTypography-root:nth-child(2){margin-top:28px;color:var(--night-ink);font-size:12px;line-height:1.4;font-weight:600}
  .pl-flow-step>span{position:absolute;right:-8px;top:50%;z-index:2;width:16px;height:16px;display:grid;place-items:center;border-radius:50%;color:var(--night-ink-2);font-size:8px;background:var(--night-3)}
  .pl-flow-note{max-width:720px;margin:30px auto 0;padding:17px 21px;display:flex;align-items:center;gap:18px;border:1px solid color-mix(in srgb,var(--brass) 26%,transparent);border-radius:13px;background:color-mix(in srgb,var(--brass) 8%,transparent)}
  .pl-flow-note .MuiTypography-root:first-child{flex:0 0 auto;color:var(--brass-2);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.14em}
  .pl-flow-note .MuiTypography-root:last-child{color:var(--night-ink-2);font-size:11.5px;line-height:1.6}
  .pl-dashboard-section{background:var(--sunk)}
  .pl-full-dashboard{margin-top:52px;padding:13px;border:1px solid var(--line);border-radius:24px;background:var(--bone);box-shadow:var(--shadow-lg)}
  .pl-full-top{min-height:66px;padding:0 19px;display:flex;align-items:center;justify-content:space-between;border-radius:14px 14px 7px 7px;background:var(--night)}
  .pl-full-top>div:first-child .MuiTypography-root:first-child{color:var(--night-ink);font-family:var(--display);font-size:13px;font-weight:400}
  .pl-full-top>div:first-child .MuiTypography-root:last-child{margin-top:3px;color:var(--night-ink-3);font-size:8px;letter-spacing:.04em}
  .pl-full-user{display:flex;align-items:center;gap:10px}
  .pl-full-user>span{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;color:#fdf9f4;font-size:9px;font-weight:700;background:var(--wine)}
  .pl-full-user .MuiTypography-root:first-child{color:var(--night-ink);font-size:8.5px;font-weight:650}
  .pl-full-user .MuiTypography-root:last-child{color:var(--night-ink-3);font-size:7px}
  .pl-full-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:9px}
  .pl-full-metrics>div{padding:21px;border:1px solid var(--line);border-radius:13px;background:var(--paper)}
  .pl-full-metrics .MuiTypography-root:first-child{color:var(--ink-3);font-size:9px;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
  .pl-full-metrics .MuiTypography-root:nth-child(2){margin-top:11px;font-family:var(--display);font-size:19px;font-weight:400;letter-spacing:-.02em}
  .pl-full-metrics .MuiTypography-root:last-child{margin-top:6px;color:var(--green);font-size:8px;font-weight:600}
  .pl-full-content{display:grid;grid-template-columns:1.6fr .8fr;gap:9px;margin-top:9px}
  .pl-full-chart,.pl-activity{min-height:282px;padding:21px;border:1px solid var(--line);border-radius:13px;background:var(--paper)}
  .pl-full-chart .pl-card-head>div .MuiTypography-root:first-child{color:var(--ink)}
  .pl-full-chart .pl-card-head>div .MuiTypography-root:last-child{color:var(--ink-3)}
  .pl-full-chart .pl-card-head>.MuiTypography-root:last-child{color:var(--brass)}

  /* Ilgari bu grafik clip-path ko'pburchagi bilan chizilgan edi —
     chetlari tishli chiqar va hero'dagi toza SVG bilan yonma-yon
     qo'pol ko'rinardi. Endi u ham SVG. */
  .pl-svg-chart{display:block;width:100%;height:176px;margin-top:12px;overflow:visible}
  .pl-svg-chart .grid{fill:none;stroke:var(--line);stroke-width:1;stroke-dasharray:3 7}
  .pl-svg-chart .area{fill:url(#fullChart)}
  .pl-svg-chart .line{fill:none;stroke:var(--wine);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
  .pl-svg-chart .compare{fill:none;stroke:var(--brass);stroke-width:1.5;stroke-dasharray:5 5;opacity:.85}
  .pl-svg-chart circle{fill:var(--paper);stroke:var(--wine);stroke-width:2}
  .pl-full-chart .pl-chart-months{margin-top:9px;color:var(--ink-3)}

  .pl-activity>p{font-family:var(--display);font-size:13px;font-weight:400}
  .pl-activity>div{padding:13px 0;display:grid;grid-template-columns:7px 1fr auto;align-items:center;gap:11px;border-bottom:1px solid var(--line)}
  .pl-activity>div:last-child{border-bottom:0}
  .pl-activity>div>i{width:6px;height:6px;border-radius:50%;background:var(--brass)}
  .pl-activity>div>div .MuiTypography-root:first-child{font-size:9.5px;font-weight:650}
  .pl-activity>div>div .MuiTypography-root:last-child{margin-top:3px;color:var(--ink-3);font-size:7px}
  .pl-activity>div>.MuiTypography-root{color:var(--ink-2);font-size:8.5px;font-weight:650}
  .pl-benefit-layout{display:grid;grid-template-columns:.8fr 1.2fr;gap:80px;align-items:start}
  .pl-benefit-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px}
  .pl-benefit-card{min-height:146px;padding:22px;display:flex;gap:17px;border:1px solid var(--line);border-radius:15px;background:var(--paper)}
  .pl-benefit-card>span{width:30px;height:30px;display:grid;place-items:center;flex:0 0 auto;border:1px solid var(--brass-soft);border-radius:9px;color:var(--brass);font-family:var(--display);font-size:11px;background:var(--brass-soft)}
  .pl-benefit-card h3{font-family:var(--display);font-size:15px;font-weight:400}
  .pl-benefit-card p{margin-top:8px;color:var(--ink-3);font-size:10.5px;line-height:1.6}

  .pl-permission-layout{display:grid;grid-template-columns:.7fr 1.3fr;gap:72px;align-items:center}
  .pl-permission-summary{margin-top:30px;padding:18px;display:flex;align-items:center;gap:13px;border:1px solid var(--line);border-radius:13px;background:var(--paper)}
  .pl-permission-summary>span{width:32px;height:32px;display:grid;place-items:center;flex:0 0 auto;border-radius:10px;color:var(--green);background:color-mix(in srgb,var(--green) 10%,transparent)}
  .pl-permission-summary .MuiTypography-root:first-child{font-size:11.5px;font-weight:650}
  .pl-permission-summary .MuiTypography-root:last-child{margin-top:3px;color:var(--ink-3);font-size:9.5px}
  .pl-permission-panel{padding:13px;border:1px solid var(--line);border-radius:20px;background:var(--bone)}
  .pl-panel-head{padding:16px 18px;display:flex;justify-content:space-between;align-items:center;border-radius:12px;background:var(--night)}
  .pl-panel-head .MuiTypography-root:first-child{color:var(--night-ink);font-family:var(--display);font-size:12px;font-weight:400}
  .pl-panel-head .MuiTypography-root:last-child{color:var(--brass-2);font-size:9px;font-weight:600;letter-spacing:.05em}
  .pl-permission-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px}
  .pl-permission-card{padding:17px;border:1px solid var(--line);border-radius:12px;background:var(--paper)}
  .pl-permission-role{display:flex;align-items:center;gap:10px;padding-bottom:13px;border-bottom:1px solid var(--line)}
  .pl-permission-role>span{width:27px;height:27px;display:grid;place-items:center;flex:0 0 auto;border-radius:8px;color:var(--brass);font-family:var(--display);font-size:10px;background:var(--brass-soft)}
  .pl-permission-role .MuiTypography-root{font-size:10.5px;font-weight:650}
  .pl-permission-row{padding-top:11px;display:flex;align-items:center;justify-content:space-between;gap:10px}
  .pl-permission-row .MuiTypography-root{color:var(--ink-3);font-size:8.5px;font-weight:550}
  .pl-permission-row>span{width:25px;height:14px;padding:2px;display:flex;flex:0 0 auto;justify-content:flex-start;border-radius:10px;background:var(--line-2);transition:background-color .28s ease}
  .pl-permission-row>span.on{justify-content:flex-end;background:var(--wine)}
  .pl-permission-row>span i{width:10px;height:10px;border-radius:50%;background:var(--paper)}
  .pl-device-section{background:var(--night-2)}
  .pl-device-layout-section{display:grid;grid-template-columns:1.15fr .85fr;gap:80px;align-items:center}
  .pl-devices{position:relative;min-height:470px}
  .pl-desktop-device{position:absolute;left:0;right:72px;top:28px;height:365px;padding:10px;border:1px solid var(--night-line);border-radius:19px;background:var(--night);box-shadow:0 35px 70px rgba(0,0,0,.42)}
  .pl-device-bar{height:32px;padding:0 11px;display:flex;align-items:center;gap:5px;border-radius:10px 10px 5px 5px;background:var(--night-2)}
  .pl-device-bar i{width:6px;height:6px;border-radius:50%;background:#3a332f}
  .pl-device-bar i:first-child{background:var(--wine-2)}
  .pl-device-layout{height:calc(100% - 39px);display:grid;grid-template-columns:78px 1fr;gap:8px;margin-top:7px}
  .pl-device-layout aside{padding:12px;display:grid;align-content:start;gap:14px;border-radius:7px;background:var(--night-2)}
  .pl-device-layout aside span{height:6px;border-radius:5px;background:var(--night-3)}
  .pl-device-layout aside span:first-child{background:var(--wine)}
  .pl-device-layout main{padding:12px;border-radius:7px;background:var(--bone)}
  .pl-device-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .pl-device-kpis i{height:66px;border:1px solid var(--line);border-radius:8px;background:var(--paper)}
  .pl-device-chart{position:relative;height:205px;margin-top:8px;overflow:hidden;border:1px solid var(--line);border-radius:8px;background:var(--paper)}
  .pl-phone-device{position:absolute;right:0;bottom:0;width:190px;height:390px;padding:19px 12px 14px;border:5px solid var(--night-3);border-radius:33px;background:var(--night);box-shadow:0 35px 65px rgba(0,0,0,.5)}
  .pl-notch{position:absolute;top:7px;left:50%;width:58px;height:13px;transform:translateX(-50%);border-radius:10px;background:var(--night-3)}
  .pl-phone-head{height:46px;display:flex;align-items:center;justify-content:space-between}
  .pl-phone-head span{color:var(--night-ink);font-family:var(--display);font-size:12px;font-weight:400;letter-spacing:.04em}
  .pl-phone-head i{width:22px;height:22px;border-radius:50%;background:var(--wine)}
  .pl-phone-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
  .pl-phone-kpis i{height:64px;border:1px solid var(--night-line);border-radius:10px;background:var(--night-2)}
  .pl-phone-chart{position:relative;height:145px;margin-top:8px;overflow:hidden;border:1px solid var(--night-line);border-radius:10px;background:var(--night-2)}
  .pl-phone-nav{position:absolute;left:10px;right:10px;bottom:10px;height:44px;display:flex;align-items:center;justify-content:space-around;border:1px solid var(--night-line);border-radius:13px;background:var(--night-2)}
  .pl-phone-nav i{width:11px;height:11px;border:2px solid var(--night-ink-3);border-radius:3px}
  .pl-phone-nav i:first-child{border-color:var(--brass-2)}

  /* Qurilma maketidagi grafiklar ham SVG — ilgari clip-path edi. */
  .pl-mini-chart{position:absolute;inset:0;width:100%;height:100%}
  .pl-mini-chart .grid{fill:none;stroke:var(--line);stroke-width:1;stroke-dasharray:2 6}
  .pl-mini-chart .line{fill:none;stroke:var(--wine);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
  .pl-mini-chart .area{fill:currentColor;opacity:.1;color:var(--wine)}
  .pl-phone-chart .pl-mini-chart .grid{stroke:var(--night-3)}
  .pl-phone-chart .pl-mini-chart .line{stroke:var(--brass-2)}
  .pl-phone-chart .pl-mini-chart .area{color:var(--brass-2);opacity:.13}

  .pl-device-points{display:grid;gap:12px;margin-top:30px}
  .pl-device-points>div{display:flex;align-items:center;gap:11px}
  .pl-device-points span{width:24px;height:24px;display:grid;place-items:center;flex:0 0 auto;border-radius:7px;color:var(--brass-2);font-size:10px;background:color-mix(in srgb,var(--brass) 15%,transparent)}
  .pl-device-points .MuiTypography-root{color:var(--night-ink-2);font-size:11.5px;font-weight:550}
  .pl-security{background:var(--paper)}
  .pl-security-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:48px}
  .pl-security-card{min-height:212px;padding:25px;border:1px solid var(--line);border-radius:16px;background:var(--bone)}
  .pl-security-card>span{color:var(--brass);font-family:var(--display);font-size:15px;font-weight:400;letter-spacing:.04em}
  .pl-security-card h3{margin-top:42px;font-family:var(--display);font-size:17px;font-weight:400;letter-spacing:-.01em}
  .pl-security-card p{margin-top:10px;color:var(--ink-3);font-size:10.5px;line-height:1.65}

  /* Yakuniy chaqiruv. Gradient o'rniga chuqur sharob va guruch halqa —
     tekis rang qimmatroq ko'rinadi. */
  .pl-final-section{padding:22px 0 80px;background:var(--paper)}
  .pl-final-card{position:relative;overflow:hidden;padding:clamp(36px,5vw,76px);display:grid;grid-template-columns:1.2fr .8fr;align-items:center;gap:70px;border-radius:24px;background:linear-gradient(140deg,#4d0f18,#6e1622 58%,#7d1a28);box-shadow:0 34px 80px rgba(77,15,24,.32)}
  .pl-final-card:after{content:"";position:absolute;right:-140px;top:-220px;width:500px;height:500px;border:1px solid rgba(201,168,117,.28);border-radius:50%;box-shadow:0 0 0 70px rgba(201,168,117,.05),0 0 0 140px rgba(201,168,117,.03)}
  .pl-final-card>div{position:relative;z-index:1}
  .pl-final-card .pl-eyebrow{color:#e2c9a0!important}
  .pl-final-card .pl-eyebrow:before{background:#c9a875}
  .pl-final-card h2{max-width:760px;margin-top:16px;color:#fdf8f2;font-family:var(--display);font-size:clamp(33px,3.9vw,56px);line-height:1.1;letter-spacing:-.026em;font-weight:400;text-wrap:balance}
  .pl-final-card p{max-width:660px;margin-top:19px;color:rgba(253,248,242,.68);font-size:14px;line-height:1.72}
  .pl-final-actions{position:relative;z-index:1;display:grid;gap:9px}
  .pl-button.white{color:#5c111b!important;background:#fdf8f2!important}
  .pl-button.white:hover{transform:translateY(-2px);background:#fff!important}
  .pl-button.dark-outline{color:#fdf8f2!important;border:1px solid rgba(201,168,117,.5)!important}
  .pl-button.dark-outline:hover{transform:translateY(-2px);border-color:#c9a875!important;background:rgba(201,168,117,.12)!important}
  .pl-final-actions>.MuiTypography-root{color:rgba(253,248,242,.5);font-size:9px;text-align:center;letter-spacing:.03em}
  .pl-footer{padding:48px 0 26px;border-top:1px solid var(--line);background:var(--bone)}
  .pl-footer-top{display:grid;grid-template-columns:280px 1fr auto;align-items:center;gap:50px}
  .pl-footer-top>p{max-width:520px;color:var(--ink-3);font-size:11px;line-height:1.68}
  .pl-footer-top>div:last-child{display:flex;gap:3px}
  .pl-footer-top>div:last-child .MuiButton-root{color:var(--ink-2);font-size:10px;font-weight:600}
  .pl-footer-top>div:last-child .MuiButton-root:hover{color:var(--wine);background:var(--wine-soft)}
  .pl-footer-bottom{margin-top:36px;padding-top:21px;display:flex;justify-content:space-between;gap:16px;border-top:1px solid var(--line)}
  .pl-footer-bottom .MuiTypography-root{color:var(--ink-3);font-size:9px;letter-spacing:.02em}
  .pl-founder{margin-top:26px;display:flex;align-items:center;justify-content:center;gap:14px}
  .pl-founder>span{width:34px;height:1px;flex:0 0 auto;background:var(--brass);opacity:.55}
  .pl-founder .MuiTypography-root{color:var(--brass);font-size:9.5px;font-weight:650;letter-spacing:.19em;text-transform:uppercase;white-space:nowrap}
  @media(max-width:479px){.pl-founder{gap:9px}.pl-founder>span{width:16px}.pl-founder .MuiTypography-root{font-size:8.5px;letter-spacing:.13em}}
  /* ---------------------------- Hover ------------------------------
     Ilgari har bir karta sichqoncha tegsa TO'LIQ QIZILGA aylanardi.
     O'nta karta bir vaqtda yonib turishi baqiriq bo'lib ko'rinardi.

     Endi harakat kichik: karta bir oz ko'tariladi, chegara guruch
     rangga o'tadi va raqam jonlanadi. Vazminlik qimmat ko'rsatadi.
     ------------------------------------------------------------------ */
  .pl-pain-card,.pl-module-card,.pl-flow-step,.pl-kpi,.pl-production-card,.pl-alert-card,
  .pl-full-metrics>div,.pl-benefit-card,.pl-permission-card,.pl-security-card{
    transition:translate .3s cubic-bezier(.22,1,.36,1),border-color .3s ease,background-color .3s ease,box-shadow .3s ease
  }
  .pl-pain-card>.MuiTypography-root:first-child,.pl-module-card>div:first-child,
  .pl-benefit-card>span,.pl-security-card>span,.pl-permission-role>span,
  .pl-flow-step>.MuiTypography-root:first-child{
    transition:color .3s ease,background-color .3s ease,border-color .3s ease
  }

  @media(hover:hover) and (pointer:fine){
    .pl-pain-card:hover,.pl-module-card:hover,.pl-full-metrics>div:hover,
    .pl-benefit-card:hover,.pl-security-card:hover,.pl-permission-card:hover{
      translate:0 -5px;border-color:var(--brass);box-shadow:var(--shadow-md)
    }
    .pl-pain-card:hover>.MuiTypography-root:first-child,
    .pl-security-card:hover>span{color:var(--wine)}
    .pl-module-card:hover>div:first-child,.pl-benefit-card:hover>span,
    .pl-permission-card:hover .pl-permission-role>span{
      color:var(--wine);border-color:var(--brass);background:var(--brass-soft)
    }
    .pl-module-card:hover>span{color:var(--brass);transform:translateX(3px)}
    .pl-flow-step:hover{translate:0 -5px;border-color:var(--brass);background:var(--night-3)}
    .pl-flow-step:hover>.MuiTypography-root:first-child{color:var(--brass-2)}
    .pl-kpi:hover,.pl-production-card:hover,.pl-alert-card:hover{
      translate:0 -4px;border-color:color-mix(in srgb,var(--brass) 55%,transparent);background:var(--night-3)
    }
  }
  @media(max-width:1199px){.pl-header-container{grid-template-columns:230px 1fr 260px}.pl-hero-grid{grid-template-columns:1fr;gap:54px}.pl-hero-copy{max-width:840px}.pl-hero-dashboard{max-width:850px;transform:none}.pl-pain-grid,.pl-module-grid,.pl-security-grid{grid-template-columns:repeat(2,1fr)}.pl-module-card:last-child{grid-column:span 1}.pl-flow{grid-template-columns:repeat(4,1fr)}.pl-flow-step>span{display:none}.pl-benefit-layout,.pl-permission-layout{grid-template-columns:1fr;gap:42px}.pl-device-layout-section{gap:46px}.pl-full-metrics{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:899px){.pl-header-container{min-height:68px;grid-template-columns:1fr auto}.pl-nav,.pl-header-actions{display:none}.pl-menu-button{width:43px!important;min-width:43px!important;height:43px!important;padding:0!important;display:grid!important;place-content:center;gap:4px;border:1px solid var(--line-2)!important;border-radius:12px!important}.pl-menu-button span{width:17px;height:2px;border-radius:3px;background:var(--wine)}.pl-mobile-menu{position:absolute!important;left:16px;right:16px;top:60px;padding:10px!important;display:grid!important;gap:3px;border:1px solid var(--line)!important;border-radius:16px!important;background:var(--paper)!important;box-shadow:var(--shadow-md)!important}.pl-mobile-menu .MuiButton-root{justify-content:flex-start;color:var(--ink-2);font-size:12px;font-weight:650}.pl-mobile-menu .pl-button.primary{justify-content:center}.pl-section{padding:74px 0}.pl-signal-strip .MuiContainer-root>div{grid-template-columns:repeat(2,1fr)}.pl-signal-strip .MuiContainer-root>div>div:nth-child(3){border-left:1px solid var(--line)}.pl-flow{grid-template-columns:repeat(2,1fr)}.pl-full-content{grid-template-columns:1fr}.pl-device-layout-section{grid-template-columns:1fr}.pl-devices{max-width:700px}.pl-device-layout-section>.MuiBox-root:last-child{order:-1}.pl-final-card{grid-template-columns:1fr;gap:34px}.pl-footer-top{grid-template-columns:1fr;gap:24px}.pl-footer-top>div:last-child{flex-wrap:wrap}}
  @media(max-width:599px){.pl-header-container{padding-left:14px!important;padding-right:14px!important}.pl-brand.compact>img{width:38px;height:38px}.pl-brand .MuiTypography-root:first-child{font-size:14px}.pl-brand .MuiTypography-root:last-child{font-size:8px}.pl-hero{padding:48px 0 72px}.pl-hero-copy h1{font-size:clamp(38px,12vw,53px);line-height:1.01}.pl-hero-copy>p{font-size:14px;line-height:1.66}.pl-hero-actions{display:grid}.pl-button.large{width:100%}.pl-trust-line{align-items:flex-start;flex-wrap:wrap}.pl-trust-line>i{display:none}.pl-trust-line .MuiTypography-root{width:calc(100% - 20px)}.pl-hero-dashboard{border-radius:18px;box-shadow:var(--shadow-md),0 0 0 5px color-mix(in srgb,var(--paper) 70%,transparent)}.pl-dashboard-windowbar{height:49px;padding:0 12px}.pl-dashboard-kpis{grid-template-columns:repeat(2,1fr)}.pl-kpi:last-child{grid-column:span 2}.pl-dashboard-grid{grid-template-columns:1fr}.pl-chart-card svg{height:125px}.pl-dashboard-side{grid-template-columns:1fr 1fr}.pl-dashboard-body{padding:10px}.pl-signal-strip .MuiContainer-root{padding:0!important}.pl-signal-strip .MuiContainer-root>div>div{padding:18px 15px}.pl-signal-strip .MuiTypography-root:first-child{font-size:16px}.pl-section-title h2{font-size:clamp(31px,10vw,43px)}.pl-section-title p{font-size:13.5px}.pl-pain-grid,.pl-module-grid,.pl-security-grid{grid-template-columns:1fr;margin-top:32px}.pl-pain-card{min-height:205px}.pl-module-card{min-height:190px}.pl-flow{grid-template-columns:1fr;margin-top:34px}.pl-flow-step{min-height:95px;display:grid;grid-template-columns:42px 1fr;align-items:center}.pl-flow-step>.MuiTypography-root:nth-child(2){margin-top:0}.pl-flow-note{align-items:flex-start}.pl-full-dashboard{padding:7px;border-radius:18px}.pl-full-top{padding:0 11px}.pl-full-metrics{grid-template-columns:1fr}.pl-full-metrics>div{padding:16px}.pl-full-metrics .MuiTypography-root:nth-child(2){font-size:16px}.pl-full-chart,.pl-activity{padding:15px}.pl-svg-chart{height:140px}.pl-benefit-grid,.pl-permission-grid{grid-template-columns:1fr}.pl-benefit-card{min-height:125px}.pl-permission-panel{padding:8px}.pl-devices{min-height:375px}.pl-desktop-device{right:35px;height:285px}.pl-device-layout{grid-template-columns:48px 1fr}.pl-device-kpis i{height:48px}.pl-device-chart{height:145px}.pl-phone-device{width:142px;height:304px;border-radius:27px}.pl-phone-kpis i{height:45px}.pl-phone-chart{height:102px}.pl-final-section{padding:10px 0 52px}.pl-final-card{padding:30px 22px;border-radius:20px}.pl-final-card h2{font-size:34px}.pl-footer-bottom{display:grid;gap:8px}.pl-footer-top>div:last-child{display:grid;grid-template-columns:repeat(3,1fr)}}
  @media(max-width:359px){.pl-hero-copy h1{font-size:36px}.pl-dashboard-side{grid-template-columns:1fr}.pl-signal-strip .MuiTypography-root:last-child{font-size:8px}.pl-full-user>div{display:none}.pl-phone-device{right:-5px}.pl-footer-top>div:last-child{grid-template-columns:1fr}}
  @media(prefers-reduced-motion:reduce){.premium-landing *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
`;
