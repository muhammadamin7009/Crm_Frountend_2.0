import { useEffect, useState } from "react";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import alAminCrmLogo from "../../images/al-amin-crm-logo.png";

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
      <Box component="img" src={alAminCrmLogo} alt="Al-Amin CRM logosi" />
      <Box>
        <Typography>AL-AMIN CRM</Typography>
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
          <Box className="pl-line-visual">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <span />
          </Box>
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

function DevicesVisual() {
  return (
    <Box className="pl-devices" aria-label="Al-Amin CRM desktop va mobil ko‘rinishi">
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
              <span />
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
          <span />
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

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Al-Amin CRM — korxonani to‘liq nazorat qilish tizimi";
    let meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") || "";
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Savdo, ombor, ishlab chiqarish, xodimlar, qarz va moliyani bitta tizimda boshqaring.",
    );
    return () => {
      document.title = previousTitle;
      if (meta && previousDescription) meta.setAttribute("content", previousDescription);
    };
  }, []);

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
            <Button className="pl-button primary" onClick={() => navigate("/register")}>
              Bepul tanishib ko‘rish
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
              <Button className="pl-button primary" onClick={() => navigate("/register")}>
                Boshlash
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
                <Typography className="pl-eyebrow">ISHLAB CHIQARISH VA BIZNES NAZORATI</Typography>
                <Typography component="h1">
                  Korxonangizdagi tartib, nazorat va hisob-kitob — <span>bitta tizimda.</span>
                </Typography>
                <Typography component="p">
                  Savdo, ombor, ishlab chiqarish, xodimlar va moliyani tarqoq daftarlar bilan emas,
                  o‘zaro bog‘langan aniq raqamlar bilan boshqaring.
                </Typography>
                <Box className="pl-hero-actions">
                  <Button className="pl-button primary large" onClick={() => navigate("/register")}>
                    Al-Amin CRM bilan boshlash
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
              text="Kichik chalkashliklar yig‘ilib, pul va vaqt yo‘qotishiga aylanadi. Al-Amin CRM shu nuqtalarni bitta nazorat tizimiga bog‘laydi."
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
                  text="Al-Amin CRM ekran o‘lchamiga moslashadi. Rahbar, admin va ishchi o‘ziga kerakli jarayonni ortiqcha murakkabliksiz ko‘radi."
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
                  Al-Amin CRM’ni korxonangizda qanday ishlashini ko‘ring.
                </Typography>
                <Typography component="p">
                  Daftar, tarqoq Excel va eslab qolishga tayangan hisobdan aniq boshqaruv tizimiga
                  o‘ting.
                </Typography>
              </Box>
              <Box className="pl-final-actions">
                <Button className="pl-button white large" onClick={() => navigate("/register")}>
                  Bepul tanishib ko‘rish
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
              © {new Date().getFullYear()} Al-Amin CRM. Barcha huquqlar himoyalangan.
            </Typography>
            <Typography>al-amin.uz · +998 91 571 70 09</Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

const premiumStyles = `
  .premium-landing{--red:#b91c1c;--red-dark:#7f1018;--ink:#111827;--muted:#667085;--line:#e6e8ec;--warm:#f7f5f3;min-height:100vh;overflow-x:hidden;background:#fff;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;scroll-behavior:smooth}
  .premium-landing *{box-sizing:border-box}.premium-landing .MuiButton-root{font-family:inherit;text-transform:none}.pl-section{padding:clamp(76px,8vw,126px) 0;scroll-margin-top:84px}.pl-white{background:#fff}.pl-warm{background:var(--warm)}
  .pl-header{position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(17,24,39,.07);background:rgba(255,255,255,.9);backdrop-filter:blur(20px)}.pl-header-container{position:relative;min-height:76px;display:grid!important;grid-template-columns:260px 1fr 300px;align-items:center;gap:22px}.pl-brand{display:flex;align-items:center;gap:13px;min-width:0}.pl-brand>img{width:52px;height:52px;object-fit:cover;border:1px solid #e6e8ec;border-radius:15px;box-shadow:0 8px 22px rgba(17,24,39,.08)}.pl-brand>div{min-width:0}.pl-brand .MuiTypography-root:first-child{font-size:16px;font-weight:950;letter-spacing:-.025em}.pl-brand .MuiTypography-root:last-child{margin-top:2px;color:#8a93a3;font-size:9px;font-weight:700}.pl-brand.compact>img{width:42px;height:42px;border-radius:12px}.pl-nav{display:flex;justify-content:center;gap:2px}.pl-nav .MuiButton-root{min-width:0;padding:9px 12px;color:#4b5563;font-size:12px;font-weight:750}.pl-nav .MuiButton-root:hover{color:var(--red);background:#fff5f5}.pl-header-actions{display:flex;justify-content:flex-end;gap:8px}.pl-button{min-height:44px!important;padding:0 19px!important;border-radius:12px!important;font-size:12px!important;font-weight:850!important;box-shadow:none!important}.pl-button.primary{color:#fff!important;background:linear-gradient(135deg,#c92525,#9f151c)!important;box-shadow:0 12px 28px rgba(185,28,28,.2)!important}.pl-button.primary:hover{transform:translateY(-1px);background:linear-gradient(135deg,#b91c1c,#851018)!important}.pl-button.ghost{color:#344054!important}.pl-button.outline{color:#1f2937!important;border:1px solid #d7dbe1!important;background:#fff!important}.pl-button.large{min-height:52px!important;padding:0 24px!important;font-size:13px!important}.pl-menu-button,.pl-mobile-menu{display:none!important}
  .pl-hero{position:relative;padding:clamp(62px,7vw,108px) 0 clamp(76px,8vw,122px);overflow:hidden;background:radial-gradient(circle at 8% 10%,rgba(185,28,28,.07),transparent 26%),linear-gradient(180deg,#fff 0%,#faf9f8 100%)}.pl-hero:after{content:"";position:absolute;right:-180px;top:-250px;width:620px;height:620px;border:1px solid rgba(185,28,28,.09);border-radius:50%;box-shadow:0 0 0 80px rgba(185,28,28,.018),0 0 0 160px rgba(185,28,28,.012);pointer-events:none}.pl-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,.88fr) minmax(560px,1.12fr);align-items:center;gap:clamp(42px,6vw,94px)}.pl-eyebrow{color:var(--red)!important;font-size:10px!important;font-weight:950!important;letter-spacing:.14em!important}.pl-hero-copy h1{max-width:700px;margin:20px 0 0;font-size:clamp(44px,5vw,75px);line-height:.99;letter-spacing:-.064em;font-weight:950}.pl-hero-copy h1 span{color:var(--red)}.pl-hero-copy>p{max-width:650px;margin:26px 0 0;color:#5f6978;font-size:clamp(15px,1.25vw,18px);line-height:1.75;font-weight:520}.pl-hero-actions{display:flex;gap:10px;margin-top:32px}.pl-trust-line{display:flex;align-items:center;gap:9px;margin-top:25px;color:#697386}.pl-trust-line>span{width:8px;height:8px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 5px rgba(22,163,74,.09)}.pl-trust-line>i{width:1px;height:15px;margin:0 5px;background:#d7dbe1}.pl-trust-line .MuiTypography-root{font-size:10.5px;font-weight:720}
  .pl-hero-dashboard{position:relative;overflow:hidden;border:1px solid #292f39;border-radius:24px;background:#101319;box-shadow:0 42px 90px rgba(15,23,42,.22),0 0 0 8px rgba(255,255,255,.7);transform:perspective(1500px) rotateY(-2deg)}.pl-dashboard-windowbar{height:56px;padding:0 18px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;border-bottom:1px solid #242a34;background:#151920}.pl-dashboard-windowbar>.MuiTypography-root{color:#e5e7eb;font-size:10px;font-weight:800}.pl-window-dots{display:flex;gap:6px}.pl-window-dots i{width:8px;height:8px;border-radius:50%;background:#374151}.pl-window-dots i:first-child{background:#b91c1c}.pl-live{justify-self:end;display:flex;align-items:center;gap:6px;color:#aeb6c3;font-size:9px;font-weight:700}.pl-live span{width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.1)}.pl-dashboard-body{padding:18px}.pl-dashboard-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.pl-kpi{padding:15px;border:1px solid #292f39;border-radius:15px;background:#171b22}.pl-kpi .MuiTypography-root:first-child{color:#8e99aa;font-size:8.5px;font-weight:750}.pl-kpi .MuiTypography-root:nth-child(2){margin-top:7px;color:#fff;font-size:20px;font-weight:950;letter-spacing:-.035em}.pl-kpi .MuiTypography-root:last-child{margin-top:4px;font-size:8px;font-weight:800}.pl-kpi.red .MuiTypography-root:last-child{color:#fb7185}.pl-kpi.green .MuiTypography-root:last-child{color:#4ade80}.pl-kpi.amber .MuiTypography-root:last-child{color:#fbbf24}.pl-dashboard-grid{display:grid;grid-template-columns:1.65fr .75fr;gap:10px;margin-top:10px}.pl-chart-card,.pl-production-card,.pl-alert-card{border:1px solid #292f39;border-radius:15px;background:#171b22}.pl-chart-card{padding:15px 15px 10px}.pl-card-head{display:flex;justify-content:space-between;align-items:flex-start}.pl-card-head>div .MuiTypography-root:first-child,.pl-card-head>.MuiTypography-root:first-child{color:#f3f4f6;font-size:10px;font-weight:850}.pl-card-head>div .MuiTypography-root:last-child{margin-top:2px;color:#778195;font-size:7.5px}.pl-card-head>.MuiTypography-root:last-child{color:#4ade80;font-size:9px;font-weight:850}.pl-chart-card svg{display:block;width:100%;height:146px;margin-top:4px;overflow:visible}.pl-chart-card svg .grid{fill:none;stroke:#2d3440;stroke-width:1;stroke-dasharray:4 6}.pl-chart-card svg .area{fill:url(#heroChart)}.pl-chart-card svg .line{fill:none;stroke:#e23434;stroke-width:3;stroke-linecap:round}.pl-chart-card svg circle{fill:#171b22;stroke:#ef4444;stroke-width:2.5}.pl-chart-months{display:flex;justify-content:space-between;color:#788396;font-size:7px;font-weight:700}.pl-dashboard-side{display:grid;gap:10px}.pl-production-card{padding:15px}.pl-production-card>.MuiTypography-root:first-child{color:#8e99aa;font-size:8px;font-weight:750}.pl-production-card>.MuiTypography-root:nth-child(2){margin-top:9px;color:#fff;font-size:20px;font-weight:950}.pl-production-card small{color:#8e99aa;font-size:8px}.pl-production-card>div{height:5px;margin-top:14px;overflow:hidden;border-radius:10px;background:#2a303b}.pl-production-card>div span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#b91c1c,#ef4444)}.pl-production-card>.MuiTypography-root:last-child{margin-top:7px;color:#7f8a9d;font-size:7.5px}.pl-alert-card{padding:13px;display:flex;align-items:center;gap:10px}.pl-alert-card>span{width:28px;height:28px;display:grid;place-items:center;border-radius:9px;color:#fda4af;font-size:11px;font-weight:950;background:rgba(185,28,28,.2)}.pl-alert-card .MuiTypography-root:first-child{color:#f3f4f6;font-size:8.5px;font-weight:800}.pl-alert-card .MuiTypography-root:last-child{margin-top:2px;color:#7f8a9d;font-size:7px}
  .pl-signal-strip{border-top:1px solid #e7e9ed;border-bottom:1px solid #e7e9ed;background:#fff}.pl-signal-strip .MuiContainer-root>div{display:grid;grid-template-columns:repeat(4,1fr)}.pl-signal-strip .MuiContainer-root>div>div{padding:25px 30px;border-right:1px solid #eceef1}.pl-signal-strip .MuiContainer-root>div>div:first-child{border-left:1px solid #eceef1}.pl-signal-strip .MuiTypography-root:first-child{font-size:20px;font-weight:950}.pl-signal-strip .MuiTypography-root:last-child{margin-top:4px;color:#7c8594;font-size:9px;font-weight:700}
  .pl-section-title{max-width:770px}.pl-section-title.center{margin:0 auto;text-align:center}.pl-section-title h2{margin:14px 0 0;font-size:clamp(34px,4vw,58px);line-height:1.06;letter-spacing:-.052em;font-weight:950}.pl-section-title p{max-width:700px;margin:20px 0 0;color:var(--muted);font-size:15px;line-height:1.75}.pl-section-title.center p{margin-left:auto;margin-right:auto}.pl-section-title.light h2{color:#fff}.pl-section-title.light p{color:#a8b0bd}.pl-pain-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:44px}.pl-pain-card{min-height:236px;padding:26px;display:flex;flex-direction:column;border:1px solid #e4e1de;border-radius:18px;background:rgba(255,255,255,.72);box-shadow:0 18px 40px rgba(54,35,35,.04)}.pl-pain-card>.MuiTypography-root:first-child{color:var(--red);font-size:10px;font-weight:950;letter-spacing:.12em}.pl-pain-card h3{margin-top:auto;padding-top:42px;font-size:18px;line-height:1.25;font-weight:900;letter-spacing:-.025em}.pl-pain-card p{margin-top:10px;color:#727b88;font-size:12px;line-height:1.65}
  .pl-module-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:44px}.pl-module-card{position:relative;min-height:220px;padding:24px;border:1px solid var(--line);border-radius:17px;background:#fff;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}.pl-module-card:hover{transform:translateY(-5px);border-color:#e4b9bc;box-shadow:0 22px 48px rgba(17,24,39,.08)}.pl-module-card>div:first-child{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;color:#a5151b;font-size:10px;font-weight:950;background:#fff1f2}.pl-module-card h3{margin-top:28px;font-size:17px;font-weight:920;letter-spacing:-.025em}.pl-module-card p{margin-top:9px;color:#717b89;font-size:11.5px;line-height:1.65}.pl-module-card>span{position:absolute;right:22px;bottom:20px;color:#aab0ba;font-size:17px}.pl-module-card:last-child{grid-column:span 2;background:linear-gradient(135deg,#fff,#faf3f3)}
  .pl-dark{position:relative;background:#101319}.pl-dark:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 10%,rgba(185,28,28,.2),transparent 30%);pointer-events:none}.pl-dark .MuiContainer-root{position:relative}.pl-flow{display:grid;grid-template-columns:repeat(7,1fr);gap:9px;margin-top:48px}.pl-flow-step{position:relative;min-width:0;padding:20px 15px;border:1px solid #2a303a;border-radius:15px;background:#171b22}.pl-flow-step>.MuiTypography-root:first-child{color:#ef4444;font-size:9px;font-weight:950}.pl-flow-step>.MuiTypography-root:nth-child(2){margin-top:28px;color:#f3f4f6;font-size:12px;line-height:1.35;font-weight:850}.pl-flow-step>span{position:absolute;right:-9px;top:50%;z-index:2;width:18px;height:18px;display:grid;place-items:center;border-radius:50%;color:#cbd5e1;font-size:9px;background:#303641}.pl-flow-note{max-width:720px;margin:28px auto 0;padding:16px 20px;display:flex;align-items:center;gap:17px;border:1px solid rgba(239,68,68,.18);border-radius:14px;background:rgba(185,28,28,.1)}.pl-flow-note .MuiTypography-root:first-child{color:#fb7185;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.12em}.pl-flow-note .MuiTypography-root:last-child{color:#b9c0ca;font-size:11px;line-height:1.55}
  .pl-dashboard-section{background:#f4f6f8}.pl-full-dashboard{margin-top:48px;padding:14px;border:1px solid #dfe3e8;border-radius:26px;background:#e9ecef;box-shadow:0 36px 90px rgba(15,23,42,.14)}.pl-full-top{min-height:66px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;border-radius:15px 15px 8px 8px;background:#101319}.pl-full-top>div:first-child .MuiTypography-root:first-child{color:#fff;font-size:12px;font-weight:900}.pl-full-top>div:first-child .MuiTypography-root:last-child{margin-top:2px;color:#818b9b;font-size:8px}.pl-full-user{display:flex;align-items:center;gap:9px}.pl-full-user>span{width:32px;height:32px;display:grid;place-items:center;border-radius:50%;color:#fff;font-size:9px;font-weight:900;background:#b91c1c}.pl-full-user .MuiTypography-root:first-child{color:#fff;font-size:8px;font-weight:800}.pl-full-user .MuiTypography-root:last-child{color:#7f8998;font-size:7px}.pl-full-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}.pl-full-metrics>div{padding:20px;border:1px solid #e2e5e9;border-radius:14px;background:#fff}.pl-full-metrics .MuiTypography-root:first-child{color:#7a8493;font-size:9px;font-weight:750}.pl-full-metrics .MuiTypography-root:nth-child(2){margin-top:9px;font-size:18px;font-weight:950;letter-spacing:-.035em}.pl-full-metrics .MuiTypography-root:last-child{margin-top:5px;color:#16a34a;font-size:8px;font-weight:750}.pl-full-content{display:grid;grid-template-columns:1.6fr .8fr;gap:10px;margin-top:10px}.pl-full-chart,.pl-activity{min-height:280px;padding:20px;border:1px solid #e2e5e9;border-radius:14px;background:#fff}.pl-full-chart .pl-card-head>div .MuiTypography-root:first-child{color:#111827}.pl-full-chart .pl-card-head>.MuiTypography-root:last-child{color:#b91c1c}.pl-line-visual{position:relative;height:175px;margin-top:12px;overflow:hidden;border-bottom:1px solid #e8eaed;background:repeating-linear-gradient(to bottom,transparent 0,transparent 43px,#eef0f2 44px)}.pl-line-visual:before{content:"";position:absolute;left:1%;right:1%;top:35px;height:112px;background:linear-gradient(180deg,rgba(220,38,38,.18),transparent);clip-path:polygon(0 80%,17% 62%,35% 71%,53% 38%,70% 48%,86% 10%,100% 25%,100% 100%,0 100%)}.pl-line-visual:after{content:"";position:absolute;inset:28px 1% 15px;background:#c7252b;clip-path:polygon(0 75%,17% 57%,35% 66%,53% 33%,70% 43%,86% 5%,100% 20%,100% 23%,86% 8%,70% 46%,53% 36%,35% 69%,17% 60%,0 78%)}.pl-line-visual i{position:absolute;z-index:2;width:7px;height:7px;border:2px solid #dc2626;border-radius:50%;background:#fff}.pl-line-visual i:nth-child(1){left:1%;top:131px}.pl-line-visual i:nth-child(2){left:35%;top:113px}.pl-line-visual i:nth-child(3){left:53%;top:70px}.pl-line-visual i:nth-child(4){left:86%;top:34px}.pl-activity>p{font-size:11px;font-weight:900}.pl-activity>div{padding:13px 0;display:grid;grid-template-columns:8px 1fr auto;align-items:center;gap:10px;border-bottom:1px solid #eef0f2}.pl-activity>div>i{width:7px;height:7px;border-radius:50%;background:#dc2626}.pl-activity>div>div .MuiTypography-root:first-child{font-size:9px;font-weight:800}.pl-activity>div>div .MuiTypography-root:last-child{margin-top:2px;color:#98a0ad;font-size:7px}.pl-activity>div>.MuiTypography-root{font-size:8px;font-weight:850}
  .pl-benefit-layout{display:grid;grid-template-columns:.8fr 1.2fr;gap:80px;align-items:start}.pl-benefit-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.pl-benefit-card{min-height:145px;padding:21px;display:flex;gap:16px;border:1px solid #e5e1de;border-radius:16px;background:#fff}.pl-benefit-card>span{width:30px;height:30px;display:grid;place-items:center;flex:0 0 auto;border-radius:9px;color:#a8171d;font-size:8px;font-weight:950;background:#fff0f1}.pl-benefit-card h3{font-size:14px;font-weight:900}.pl-benefit-card p{margin-top:7px;color:#747d8a;font-size:10.5px;line-height:1.55}.pl-permission-layout{display:grid;grid-template-columns:.7fr 1.3fr;gap:72px;align-items:center}.pl-permission-summary{margin-top:28px;padding:17px;display:flex;align-items:center;gap:12px;border:1px solid #e2e5e9;border-radius:14px}.pl-permission-summary>span{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;color:#15803d;background:#eaf8ef}.pl-permission-summary .MuiTypography-root:first-child{font-size:11px;font-weight:850}.pl-permission-summary .MuiTypography-root:last-child{margin-top:2px;color:#7d8694;font-size:9px}.pl-permission-panel{padding:14px;border:1px solid #dfe3e8;border-radius:22px;background:#f5f6f8}.pl-panel-head{padding:15px 17px;display:flex;justify-content:space-between;border-radius:12px;background:#11151b}.pl-panel-head .MuiTypography-root:first-child{color:#fff;font-size:11px;font-weight:850}.pl-panel-head .MuiTypography-root:last-child{color:#fda4af;font-size:9px;font-weight:800}.pl-permission-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:9px}.pl-permission-card{padding:16px;border:1px solid #e1e4e8;border-radius:13px;background:#fff}.pl-permission-role{display:flex;align-items:center;gap:9px;padding-bottom:12px;border-bottom:1px solid #eceef1}.pl-permission-role>span{width:27px;height:27px;display:grid;place-items:center;border-radius:8px;color:#a8181e;font-size:7px;font-weight:950;background:#fff0f1}.pl-permission-role .MuiTypography-root{font-size:10px;font-weight:880}.pl-permission-row{padding-top:10px;display:flex;align-items:center;justify-content:space-between}.pl-permission-row .MuiTypography-root{color:#6f7886;font-size:8px;font-weight:700}.pl-permission-row>span{width:25px;height:14px;padding:2px;display:flex;justify-content:flex-start;border-radius:10px;background:#d8dce2}.pl-permission-row>span.on{justify-content:flex-end;background:#b91c1c}.pl-permission-row>span i{width:10px;height:10px;border-radius:50%;background:#fff}
  .pl-device-section{background:#11151b}.pl-device-layout-section{display:grid;grid-template-columns:1.15fr .85fr;gap:80px;align-items:center}.pl-devices{position:relative;min-height:470px}.pl-desktop-device{position:absolute;left:0;right:72px;top:28px;height:365px;padding:10px;border:1px solid #343b46;border-radius:20px;background:#090b0f;box-shadow:0 35px 70px rgba(0,0,0,.38)}.pl-device-bar{height:32px;padding:0 10px;display:flex;align-items:center;gap:5px;border-radius:10px 10px 5px 5px;background:#171b22}.pl-device-bar i{width:6px;height:6px;border-radius:50%;background:#4b5563}.pl-device-bar i:first-child{background:#b91c1c}.pl-device-layout{height:calc(100% - 39px);display:grid;grid-template-columns:78px 1fr;gap:8px;margin-top:7px}.pl-device-layout aside{padding:12px;display:grid;align-content:start;gap:14px;border-radius:7px;background:#11151b}.pl-device-layout aside span{height:7px;border-radius:5px;background:#2d333d}.pl-device-layout aside span:first-child{background:#9f171d}.pl-device-layout main{padding:12px;border-radius:7px;background:#f1f3f5}.pl-device-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pl-device-kpis i{height:66px;border-radius:8px;background:#fff}.pl-device-chart{position:relative;height:205px;margin-top:8px;overflow:hidden;border-radius:8px;background:#fff}.pl-device-chart:before{content:"";position:absolute;inset:20px;background:repeating-linear-gradient(to bottom,#eef0f3 0,#eef0f3 1px,transparent 1px,transparent 43px)}.pl-device-chart span{position:absolute;left:28px;right:28px;bottom:44px;height:105px;background:#c92128;clip-path:polygon(0 82%,17% 52%,34% 69%,52% 33%,68% 48%,85% 8%,100% 27%,100% 31%,85% 12%,68% 52%,52% 37%,34% 73%,17% 56%,0 86%)}.pl-phone-device{position:absolute;right:0;bottom:0;width:190px;height:390px;padding:19px 12px 14px;border:5px solid #252b34;border-radius:34px;background:#0d1015;box-shadow:0 35px 65px rgba(0,0,0,.48)}.pl-notch{position:absolute;top:7px;left:50%;width:60px;height:14px;transform:translateX(-50%);border-radius:10px;background:#252b34}.pl-phone-head{height:46px;display:flex;align-items:center;justify-content:space-between}.pl-phone-head span{color:#fff;font-size:10px;font-weight:950}.pl-phone-head i{width:23px;height:23px;border-radius:50%;background:#b91c1c}.pl-phone-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.pl-phone-kpis i{height:64px;border:1px solid #292f39;border-radius:10px;background:#171b22}.pl-phone-chart{position:relative;height:145px;margin-top:8px;border:1px solid #292f39;border-radius:10px;background:#171b22}.pl-phone-chart span{position:absolute;left:12px;right:12px;bottom:27px;height:70px;background:#dc2626;clip-path:polygon(0 80%,20% 61%,40% 68%,62% 25%,80% 43%,100% 5%,100% 10%,80% 48%,62% 30%,40% 73%,20% 66%,0 85%)}.pl-phone-nav{position:absolute;left:10px;right:10px;bottom:10px;height:44px;display:flex;align-items:center;justify-content:space-around;border:1px solid #292f39;border-radius:14px;background:#171b22}.pl-phone-nav i{width:12px;height:12px;border:2px solid #8791a1;border-radius:3px}.pl-phone-nav i:first-child{border-color:#ef4444}.pl-device-points{display:grid;gap:11px;margin-top:28px}.pl-device-points>div{display:flex;align-items:center;gap:10px}.pl-device-points span{width:24px;height:24px;display:grid;place-items:center;border-radius:8px;color:#4ade80;font-size:10px;background:rgba(34,197,94,.12)}.pl-device-points .MuiTypography-root{color:#c0c6cf;font-size:11px;font-weight:750}
  .pl-security{background:#fff}.pl-security-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:44px}.pl-security-card{min-height:210px;padding:24px;border:1px solid #e5e7eb;border-radius:17px;background:#fafafa}.pl-security-card>span{color:#b91c1c;font-size:9px;font-weight:950;letter-spacing:.1em}.pl-security-card h3{margin-top:42px;font-size:16px;font-weight:900}.pl-security-card p{margin-top:9px;color:#737d8b;font-size:10.5px;line-height:1.6}.pl-final-section{padding:20px 0 76px;background:#fff}.pl-final-card{position:relative;overflow:hidden;padding:clamp(34px,5vw,72px);display:grid;grid-template-columns:1.2fr .8fr;align-items:center;gap:70px;border-radius:26px;background:linear-gradient(125deg,#7f1018,#b91c1c 62%,#d32a2a);box-shadow:0 34px 80px rgba(127,16,24,.25)}.pl-final-card:after{content:"";position:absolute;right:-130px;top:-210px;width:480px;height:480px;border:1px solid rgba(255,255,255,.16);border-radius:50%;box-shadow:0 0 0 65px rgba(255,255,255,.025),0 0 0 130px rgba(255,255,255,.018)}.pl-final-card>div{position:relative;z-index:1}.pl-final-card .pl-eyebrow{color:#fecdd3!important}.pl-final-card h2{max-width:750px;margin-top:14px;color:#fff;font-size:clamp(34px,4vw,58px);line-height:1.04;letter-spacing:-.05em;font-weight:950}.pl-final-card p{max-width:670px;margin-top:18px;color:rgba(255,255,255,.7);font-size:14px;line-height:1.65}.pl-final-actions{display:grid;gap:9px}.pl-button.white{color:#8f1218!important;background:#fff!important}.pl-button.dark-outline{color:#fff!important;border:1px solid rgba(255,255,255,.4)!important}.pl-final-actions>.MuiTypography-root{color:rgba(255,255,255,.55);font-size:9px;text-align:center}
  .pl-footer{padding:46px 0 24px;border-top:1px solid #e8eaed;background:#f8f8f8}.pl-footer-top{display:grid;grid-template-columns:280px 1fr auto;align-items:center;gap:50px}.pl-footer-top>p{max-width:520px;color:#717b89;font-size:11px;line-height:1.6}.pl-footer-top>div:last-child{display:flex;gap:3px}.pl-footer-top>div:last-child .MuiButton-root{color:#4f5967;font-size:10px;font-weight:750}.pl-footer-bottom{margin-top:36px;padding-top:20px;display:flex;justify-content:space-between;border-top:1px solid #e1e4e8}.pl-footer-bottom .MuiTypography-root{color:#8b94a1;font-size:9px}
  .pl-pain-card,.pl-module-card,.pl-flow-step,.pl-kpi,.pl-production-card,.pl-alert-card,.pl-full-metrics>div,.pl-benefit-card,.pl-permission-card,.pl-security-card{transition:translate .28s cubic-bezier(.22,1,.36,1),transform .28s cubic-bezier(.22,1,.36,1),border-color .28s ease,background-color .28s ease,box-shadow .28s ease,color .28s ease}.pl-pain-card h3,.pl-module-card h3,.pl-flow-step>.MuiTypography-root:nth-child(2),.pl-benefit-card h3,.pl-security-card h3,.pl-full-metrics .MuiTypography-root:nth-child(2){transition:color .28s ease}.pl-pain-card>.MuiTypography-root:first-child,.pl-module-card>div:first-child,.pl-benefit-card>span,.pl-security-card>span,.pl-permission-role>span{transition:color .28s ease,background-color .28s ease,transform .28s cubic-bezier(.22,1,.36,1)}
  @media(hover:hover) and (pointer:fine){.pl-pain-card:hover,.pl-module-card:hover,.pl-full-metrics>div:hover,.pl-benefit-card:hover,.pl-security-card:hover{translate:0 -7px;border-color:#8f1219;background:#9f151c;color:#fff;box-shadow:0 26px 54px rgba(127,16,24,.25)}.pl-pain-card:hover h3,.pl-module-card:hover h3,.pl-benefit-card:hover h3,.pl-security-card:hover h3,.pl-full-metrics>div:hover .MuiTypography-root:nth-child(2){color:#fff}.pl-pain-card:hover p,.pl-module-card:hover p,.pl-benefit-card:hover p,.pl-security-card:hover p,.pl-full-metrics>div:hover .MuiTypography-root:first-child{color:rgba(255,255,255,.72)}.pl-full-metrics>div:hover .MuiTypography-root:last-child{color:#fecdd3}.pl-pain-card:hover>.MuiTypography-root:first-child,.pl-module-card:hover>div:first-child,.pl-benefit-card:hover>span,.pl-security-card:hover>span{color:#fff;background:rgba(255,255,255,.16);transform:scale(1.06)}.pl-module-card:hover>span{color:#fff}.pl-flow-step:hover{translate:0 -6px;border-color:#dc3a43;background:#9f151c;box-shadow:0 22px 46px rgba(0,0,0,.3)}.pl-flow-step:hover>.MuiTypography-root:first-child{color:#fecdd3}.pl-flow-step:hover>.MuiTypography-root:nth-child(2){color:#fff}.pl-kpi:hover,.pl-production-card:hover,.pl-alert-card:hover{translate:0 -5px;border-color:#dc3a43;background:#63151d;box-shadow:0 20px 38px rgba(0,0,0,.3)}.pl-permission-card:hover{translate:0 -5px;border-color:#8f1219;background:#9f151c;color:#fff;box-shadow:0 20px 42px rgba(127,16,24,.22)}.pl-permission-card:hover .pl-permission-role{border-color:rgba(255,255,255,.2)}.pl-permission-card:hover .pl-permission-role>span{color:#9f151c;background:#fff;transform:scale(1.06)}.pl-permission-card:hover .pl-permission-role .MuiTypography-root,.pl-permission-card:hover .pl-permission-row .MuiTypography-root{color:#fff}}
  @media(max-width:1199px){.pl-header-container{grid-template-columns:230px 1fr 260px}.pl-hero-grid{grid-template-columns:1fr;gap:54px}.pl-hero-copy{max-width:840px}.pl-hero-dashboard{max-width:850px;transform:none}.pl-pain-grid,.pl-module-grid,.pl-security-grid{grid-template-columns:repeat(2,1fr)}.pl-module-card:last-child{grid-column:span 1}.pl-flow{grid-template-columns:repeat(4,1fr)}.pl-flow-step>span{display:none}.pl-benefit-layout,.pl-permission-layout{grid-template-columns:1fr;gap:42px}.pl-device-layout-section{gap:46px}.pl-full-metrics{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:899px){.pl-header-container{min-height:68px;grid-template-columns:1fr auto}.pl-nav,.pl-header-actions{display:none}.pl-menu-button{width:43px!important;min-width:43px!important;height:43px!important;padding:0!important;display:grid!important;place-content:center;gap:4px;border:1px solid #e2e5e9!important;border-radius:12px!important}.pl-menu-button span{width:17px;height:2px;border-radius:3px;background:#8f171c}.pl-mobile-menu{position:absolute!important;left:16px;right:16px;top:60px;padding:10px!important;display:grid!important;gap:3px;border:1px solid #e1e4e8!important;border-radius:16px!important;background:#fff!important;box-shadow:0 20px 50px rgba(15,23,42,.14)!important}.pl-mobile-menu .MuiButton-root{justify-content:flex-start;color:#344054;font-size:12px;font-weight:800}.pl-mobile-menu .pl-button.primary{justify-content:center}.pl-section{padding:72px 0}.pl-signal-strip .MuiContainer-root>div{grid-template-columns:repeat(2,1fr)}.pl-signal-strip .MuiContainer-root>div>div:nth-child(3){border-left:1px solid #eceef1}.pl-flow{grid-template-columns:repeat(2,1fr)}.pl-full-content{grid-template-columns:1fr}.pl-device-layout-section{grid-template-columns:1fr}.pl-devices{max-width:700px}.pl-device-layout-section>.MuiBox-root:last-child{order:-1}.pl-final-card{grid-template-columns:1fr;gap:34px}.pl-footer-top{grid-template-columns:1fr;gap:24px}.pl-footer-top>div:last-child{flex-wrap:wrap}}
  @media(max-width:599px){.pl-header-container{padding-left:14px!important;padding-right:14px!important}.pl-brand.compact>img{width:38px;height:38px}.pl-brand .MuiTypography-root:first-child{font-size:14px}.pl-brand .MuiTypography-root:last-child{font-size:8px}.pl-hero{padding:48px 0 72px}.pl-hero-copy h1{font-size:clamp(38px,12vw,53px);line-height:1.01}.pl-hero-copy>p{font-size:14px;line-height:1.66}.pl-hero-actions{display:grid}.pl-button.large{width:100%}.pl-trust-line{align-items:flex-start;flex-wrap:wrap}.pl-trust-line>i{display:none}.pl-trust-line .MuiTypography-root{width:calc(100% - 20px)}.pl-hero-dashboard{border-radius:18px;box-shadow:0 28px 55px rgba(15,23,42,.2),0 0 0 5px rgba(255,255,255,.7)}.pl-dashboard-windowbar{height:49px;padding:0 12px}.pl-dashboard-kpis{grid-template-columns:repeat(2,1fr)}.pl-kpi:last-child{grid-column:span 2}.pl-dashboard-grid{grid-template-columns:1fr}.pl-chart-card svg{height:125px}.pl-dashboard-side{grid-template-columns:1fr 1fr}.pl-dashboard-body{padding:10px}.pl-signal-strip .MuiContainer-root{padding:0!important}.pl-signal-strip .MuiContainer-root>div>div{padding:18px 15px}.pl-signal-strip .MuiTypography-root:first-child{font-size:16px}.pl-section-title h2{font-size:clamp(31px,10vw,43px)}.pl-section-title p{font-size:13.5px}.pl-pain-grid,.pl-module-grid,.pl-security-grid{grid-template-columns:1fr;margin-top:32px}.pl-pain-card{min-height:205px}.pl-module-card{min-height:190px}.pl-flow{grid-template-columns:1fr;margin-top:34px}.pl-flow-step{min-height:95px;display:grid;grid-template-columns:42px 1fr;align-items:center}.pl-flow-step>.MuiTypography-root:nth-child(2){margin-top:0}.pl-flow-note{align-items:flex-start}.pl-full-dashboard{padding:7px;border-radius:18px}.pl-full-top{padding:0 11px}.pl-full-metrics{grid-template-columns:1fr}.pl-full-metrics>div{padding:16px}.pl-full-metrics .MuiTypography-root:nth-child(2){font-size:16px}.pl-full-chart,.pl-activity{padding:15px}.pl-benefit-grid,.pl-permission-grid{grid-template-columns:1fr}.pl-benefit-card{min-height:125px}.pl-permission-panel{padding:8px}.pl-devices{min-height:375px}.pl-desktop-device{right:35px;height:285px}.pl-device-layout{grid-template-columns:48px 1fr}.pl-device-kpis i{height:48px}.pl-device-chart{height:145px}.pl-phone-device{width:142px;height:304px;border-radius:27px}.pl-phone-kpis i{height:45px}.pl-phone-chart{height:102px}.pl-final-section{padding:10px 0 52px}.pl-final-card{padding:30px 22px;border-radius:20px}.pl-final-card h2{font-size:34px}.pl-footer-bottom{display:grid;gap:8px}.pl-footer-top>div:last-child{display:grid;grid-template-columns:repeat(3,1fr)}}
  @media(max-width:359px){.pl-hero-copy h1{font-size:36px}.pl-dashboard-side{grid-template-columns:1fr}.pl-signal-strip .MuiTypography-root:last-child{font-size:8px}.pl-full-user>div{display:none}.pl-phone-device{right:-5px}.pl-footer-top>div:last-child{grid-template-columns:1fr}}
  @media(prefers-reduced-motion:reduce){.premium-landing *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
`;
