import { Box, Typography } from "@mui/material";
import MrLogo from "../../images/mr-logo.png";

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

  const displayLogo = companyLogo || MrLogo;

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        display: {
          xs: "none",
          lg: "flex",
        },
        minHeight: 850,
        p: {
          lg: 5,
          xl: 7,
        },
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        color: "#ffffff",

        background: isRegister
          ? `
            radial-gradient(
              circle at 84% 10%,
              rgba(239, 68, 68, 0.28),
              transparent 30%
            ),
            radial-gradient(
              circle at 3% 91%,
              rgba(127, 29, 29, 0.38),
              transparent 31%
            ),
            linear-gradient(
              145deg,
              #0a0c11 0%,
              #141017 38%,
              #351219 71%,
              #65151e 100%
            )
          `
          : `
            radial-gradient(
              circle at 100% 0%,
              rgba(220, 38, 38, 0.37),
              transparent 34%
            ),
            linear-gradient(
              145deg,
              #11151c 0%,
              #211117 48%,
              #63151d 100%
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
          border: "1px solid rgba(248, 113, 113, 0.17)",
          boxShadow: isRegister
            ? `
              0 0 0 78px rgba(248, 113, 113, 0.022),
              0 0 0 156px rgba(248, 113, 113, 0.015),
              0 0 110px rgba(220, 38, 38, 0.13)
            `
            : `
              0 0 0 70px rgba(248, 113, 113, 0.025),
              0 0 0 140px rgba(248, 113, 113, 0.018)
            `,
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
              background: "radial-gradient(circle, rgba(220, 38, 38, 0.21), transparent 68%)",
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
                0 0 0 45px rgba(255, 255, 255, 0.012),
                0 0 0 90px rgba(255, 255, 255, 0.008)
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
                color: "#ffffff",
                fontSize: 28,
                lineHeight: 1.1,
                fontWeight: 950,
                letterSpacing: "-0.04em",
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
            mt: {
              lg: isRegister ? 8.5 : 10,
              xl: isRegister ? 10 : 12,
            },
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
                border: "1px solid rgba(248,113,113,.15)",
                backgroundColor: "rgba(220,38,38,.10)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "#fb7185",
                  boxShadow: "0 0 0 5px rgba(251,113,133,.09)",
                }}
              />

              <Typography
                sx={{
                  color: "#fecdd3",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".04em",
                }}
              >
                Yangi hisob yaratish
              </Typography>
            </Box>
          )}

          <Typography
            component="h1"
            sx={{
              m: 0,
              color: "#ffffff",
              fontSize: {
                lg: 44,
                xl: 53,
              },
              lineHeight: 1.07,
              fontWeight: 950,
              letterSpacing: "-0.05em",
            }}
          >
            {title}{" "}
            <Box
              component="span"
              sx={{
                color: isRegister ? "#fb7185" : "#fb445b",
                textShadow: "0 12px 34px rgba(220,38,38,.24)",
              }}
            >
              {accent}
            </Box>
          </Typography>

          <Typography
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
                    fontWeight: 800,
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
                    fontWeight: 850,
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
                  borderRadius: "14px",
                  color: "#fecdd3",
                  fontSize: 19,
                  border: "1px solid rgba(248,113,113,.13)",
                  backgroundColor: "rgba(220,38,38,.17)",
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
              sx={{
                minHeight: 142,
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
                sx={{
                  width: 39,
                  height: 39,
                  mb: 1.6,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "12px",
                  color: "#fecdd3",
                  fontSize: item.number ? 10 : 15,
                  fontWeight: 950,
                  letterSpacing: item.number ? ".08em" : "normal",
                  border: "1px solid rgba(248,113,113,.12)",
                  backgroundColor: "rgba(220,38,38,.16)",
                }}
              >
                {item.number || item.value.slice(0, 1)}
              </Box>

              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: 15.5,
                  fontWeight: 900,
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
              backgroundColor: "#22c55e",
              boxShadow: "0 0 0 5px rgba(34,197,94,.08)",
            }}
          />

          <Typography
            sx={{
              color: "rgba(255,255,255,.48)",
              fontSize: 11,
              fontWeight: 650,
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
