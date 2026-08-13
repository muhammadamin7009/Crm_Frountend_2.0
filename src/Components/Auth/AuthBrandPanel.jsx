import { Box, Typography } from "@mui/material";
import AlAminCrmLogo from "../../images/al-amin-crm-logo.png";

const loginHighlights = [
  {
    number: "01",
    value: "Savdo",
    label: "Mijozlar, savdo va tushum nazorati",
  },
  {
    number: "02",
    value: "Ombor",
    label: "Qoldiq, kirim-chiqim va inventar",
  },
  {
    number: "03",
    value: "Nazorat",
    label: "Xodimlar, oylik va moliya",
  },
];

const registerHighlights = [
  {
    number: "01",
    value: "Korxona",
    label: "Korxonangizga berilgan kodni kiriting",
  },
  {
    number: "02",
    value: "Profil",
    label: "Shaxsiy ma’lumotlaringizni to‘ldiring",
  },
  {
    number: "03",
    value: "Boshlash",
    label: "Hisobni yaratib tizimdan foydalaning",
  },
];

export default function AuthBrandPanel({
  variant = "login",
  companyName = "Al-Amin CRM",
  companyLogo,
  eyebrow = "Korxonani boshqarish tizimi",
  title = "Korxonangizni raqamli boshqaruv bilan",
  accent = "rivojlantiring",
  description = "Savdo, ombor, ishlab chiqarish, moliya va xodimlar ishini yagona tizimda boshqaring.",
  highlights,
}) {
  const isRegister = variant === "register";

  const resolvedHighlights = highlights || (isRegister ? registerHighlights : loginHighlights);

  const displayLogo = companyLogo || AlAminCrmLogo;

  return (
    <Box
      component="section"
      className="auth-brand-panel"
      sx={{
        position: "relative",
        display: {
          xs: "none",
          lg: "flex",
        },
        minHeight: { lg: 0 },
        height: { lg: "100%" },
        p: {
          lg: "clamp(24px, 4vh, 56px)",
        },
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        color: "#ffffff",

        "@media (min-width: 1200px) and (max-height: 780px)": {
          p: 2,

          "& .auth-brand-hero": {
            mt: 2,
          },

          "& .auth-brand-hero h1": {
            fontSize: 36,
          },

          "& .auth-brand-description": {
            mt: 1.7,
            fontSize: 14,
            lineHeight: 1.55,
          },

          "& .auth-register-security": {
            my: 0.75,
            p: 0.8,
          },

          "& .auth-highlight-grid": {
            p: 0.8,
          },

          "& .auth-highlight-card": {
            minHeight: 80,
            p: 1.2,
          },

          "& .auth-highlight-icon": {
            width: 32,
            height: 32,
            mb: 0.8,
          },

          "& .auth-highlight-label": {
            mt: 0.4,
            fontSize: 10.5,
            lineHeight: 1.35,
          },

          "& .auth-brand-status": {
            mt: 0,
          },
        },

        // Landing bilan bir xil til: yorqin qizil o'rniga chuqur sharob va
        // issiq qora. Ko'kimtir qora (#100d0c) issiqqa almashtirildi —
        // aks holda guruch urg'usi begona ko'rinardi.
        //
        // Gradient OXIRGI to'xtashi qorong'i qoladi (#3a1219 atrofida).
        // Ilgari u #57121e edi va panelning pastki qismi to'yingan maroon
        // bo'lib "loyqa" ko'rinardi. Platforma kirish sahifasida shu chuqurlik
        // saqlangani uchun u ancha chiroyli chiqqan — endi uchtasi bir xil.
        background: isRegister
          ? `
            radial-gradient(
              circle at 84% 10%,
              rgba(169, 129, 75, 0.16),
              transparent 32%
            ),
            radial-gradient(
              circle at 3% 91%,
              rgba(110, 22, 34, 0.4),
              transparent 33%
            ),
            linear-gradient(
              145deg,
              #100d0c 0%,
              #191412 38%,
              #2a1117 71%,
              #3d1219 100%
            )
          `
          : `
            radial-gradient(
              circle at 100% 0%,
              rgba(110, 22, 34, 0.5),
              transparent 36%
            ),
            radial-gradient(
              circle at 6% 96%,
              rgba(169, 129, 75, 0.13),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              #110e0d 0%,
              #1c1513 52%,
              #3a1219 100%
            )
          `,

        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          opacity: isRegister ? 0.085 : 0.1,
          pointerEvents: "none",
          backgroundImage: `
            linear-gradient(
              rgba(255, 255, 255, 0.12) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.12) 1px,
              transparent 1px
            )
          `,
          backgroundSize: isRegister ? "56px 56px" : "48px 48px",
          maskImage: `
            linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.92),
              transparent 72%
            )
          `,
        },

        "&::after": {
          content: '""',
          position: "absolute",
          width: isRegister ? 540 : 430,
          height: isRegister ? 540 : 430,
          top: isRegister ? -320 : -250,
          right: isRegister ? -300 : -230,
          borderRadius: "50%",
          border: "1px solid rgba(201, 168, 117, 0.18)",
          // `0 0 0 70px` ko'rinishidagi soyalar tarqalmaydi — ular QATTIQ
          // halqa hosil qiladi. Fon yorug'roq bo'lganda bilinmasdi, panel
          // qorayganda esa yoy shaklidagi tasma bo'lib chiqib qoldi.
          // Endi bitta yumshoq nur qoladi.
          boxShadow: isRegister
            ? "0 0 120px 40px rgba(110, 22, 34, 0.16)"
            : "0 0 100px 30px rgba(110, 22, 34, 0.14)",
          pointerEvents: "none",
        },
      }}
    >
      {isRegister && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: "28%",
              right: "-7%",
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(110, 22, 34, 0.22), transparent 68%)",
              filter: "blur(20px)",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              left: -135,
              bottom: 115,
              width: 300,
              height: 300,
              borderRadius: "50%",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              boxShadow: `
                0 0 59px 16px rgba(255, 255, 255, 0.012),
                0 0 117px 31px rgba(255, 255, 255, 0.008)
              `,
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: 235,
              right: 55,
              width: 110,
              height: 110,
              borderRadius: "30px",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              background: "linear-gradient(145deg, rgba(255,255,255,.06), rgba(255,255,255,.015))",
              transform: "rotate(18deg)",
              boxShadow: "0 24px 60px rgba(0,0,0,.16)",
              backdropFilter: "blur(12px)",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
        }}
      >
        <Box
          className="auth-brand-hero"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: 72,
              height: 72,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              borderRadius: "21px",
              border: "1px solid rgba(255,255,255,.24)",
              backgroundColor: "#ffffff",
              boxShadow: `
                0 20px 45px rgba(0,0,0,.28),
                inset 0 1px 0 rgba(255,255,255,.8)
              `,
            }}
          >
            <Box
              component="img"
              src={displayLogo}
              alt={companyName}
              sx={{
                width: 52,
                height: 52,
                objectFit: "contain",
              }}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                color: "#fdf8f2",
                fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
                fontSize: 27,
                lineHeight: 1.15,
                fontWeight: 400,
                letterSpacing: "-0.018em",
              }}
            >
              {companyName}
            </Typography>

            <Typography
              sx={{
                mt: 0.9,
                color: "rgba(255,255,255,.53)",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              {eyebrow}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            maxWidth: 610,
            mt: `clamp(32px, ${isRegister ? "7vh" : "8vh"}, ${isRegister ? "80px" : "96px"})`,
          }}
        >
          {isRegister && (
            <Box
              sx={{
                width: "fit-content",
                mb: 2.5,
                px: 1.5,
                py: 0.8,
                display: "flex",
                alignItems: "center",
                gap: 1,
                borderRadius: "999px",
                border: "1px solid rgba(201, 168, 117,.15)",
                backgroundColor: "rgba(140, 29, 43,.10)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "#c9a875",
                  boxShadow: "0 0 0 5px rgba(201,168,117,.12)",
                }}
              />

              <Typography
                sx={{
                  color: "#d9b782",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: ".05em",
                }}
              >
                Yangi hisob yaratish
              </Typography>
            </Box>
          )}

          {/* Sarlavha antiqa shriftda. Ilgari fontWeight 950 turardi —
              Inter'da bunday og'irlik yo'q va brauzer uni sun'iy
              qalinlashtirib xira ko'rsatardi. */}
          <Typography
            component="h1"
            sx={{
              m: 0,
              color: "#fdf8f2",
              fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
              fontSize: {
                lg: "clamp(38px, 3.5vw, 54px)",
              },
              lineHeight: 1.1,
              fontWeight: 400,
              letterSpacing: "-0.028em",
            }}
          >
            {title}{" "}
            <Box
              component="span"
              sx={{
                color: "#d9b782",
                fontStyle: "italic",
              }}
            >
              {accent}
            </Box>
          </Typography>

          <Typography
            className="auth-brand-description"
            sx={{
              maxWidth: 555,
              mt: 3.5,
              color: "rgba(255,255,255,.64)",
              fontSize: 16.5,
              lineHeight: 1.85,
              fontWeight: 500,
            }}
          >
            {description}
          </Typography>
        </Box>

        {isRegister && (
          <Box
            className="auth-register-security"
            sx={{
              position: "relative",
              maxWidth: "100%",
              my: 3,
              p: 1.2,
              borderRadius: "22px",
              border: "1px solid rgba(255,255,255,.09)",
              background: "linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.022))",
              backdropFilter: "blur(20px)",
              boxShadow: "0 26px 65px rgba(0,0,0,.22)",
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,.42)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                  }}
                >
                  Al-Amin xavfsizligi
                </Typography>

                <Typography
                  sx={{
                    mt: 0.7,
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Ma’lumotlaringiz himoyalangan
                </Typography>
              </Box>

              <Box
                sx={{
                  width: 43,
                  height: 43,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "13px",
                  color: "#d9b782",
                  fontSize: 18,
                  border: "1px solid rgba(201,168,117,.2)",
                  backgroundColor: "rgba(201,168,117,.11)",
                }}
              >
                ✓
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 2,
        }}
      >
        <Box
          className="auth-highlight-grid"
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: 1,
            p: 1.2,
            borderRadius: "23px",
            border: "1px solid rgba(255,255,255,.09)",
            backgroundColor: "rgba(255,255,255,.045)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 24px 56px rgba(0,0,0,.18)",
          }}
        >
          {resolvedHighlights.map((item, index) => (
            <Box
              key={`${item.value}-${index}`}
              className="auth-highlight-card"
              sx={{
                minHeight: "clamp(104px, 15vh, 142px)",
                p: 2,
                borderRadius: "17px",
                border: "1px solid rgba(255,255,255,.06)",
                background: `
                  linear-gradient(
                    145deg,
                    rgba(255,255,255,.065),
                    rgba(255,255,255,.018)
                  )
                `,
                transition: "transform .2s ease, background-color .2s ease",

                "&:hover": {
                  transform: "translateY(-3px)",
                  backgroundColor: "rgba(255,255,255,.065)",
                },
              }}
            >
              <Box
                className="auth-highlight-icon"
                sx={{
                  width: 39,
                  height: 39,
                  mb: 1.6,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "11px",
                  color: "#d9b782",
                  fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
                  fontSize: item.number ? 13 : 16,
                  fontWeight: 400,
                  letterSpacing: item.number ? ".05em" : "normal",
                  border: "1px solid rgba(201,168,117,.2)",
                  backgroundColor: "rgba(201,168,117,.1)",
                }}
              >
                {item.number || item.value.slice(0, 1)}
              </Box>

              <Typography
                className="auth-highlight-label"
                sx={{
                  color: "#fdf8f2",
                  fontSize: 15.5,
                  fontWeight: 600,
                }}
              >
                {item.value}
              </Typography>

              <Typography
                sx={{
                  mt: 0.8,
                  color: "rgba(255,255,255,.43)",
                  fontSize: 11.5,
                  lineHeight: 1.55,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box
          className="auth-brand-status"
          sx={{
            mt: 2.4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#4e9c6b",
              boxShadow: "0 0 0 5px rgba(78, 156, 107,.08)",
            }}
          />

          <Typography
            sx={{
              color: "rgba(255,255,255,.48)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: ".025em",
            }}
          >
            al-amin.uz · Xavfsiz va ishonchli tizim
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
