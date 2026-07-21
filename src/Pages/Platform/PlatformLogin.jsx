import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { platformLogin } from "../../api/platform";

const PlatformFeature = ({ value, label, description }) => (
  <Box
    sx={{
      minWidth: 0,
      p: 1.7,
      borderRadius: "17px",
      border: "1px solid rgba(255,255,255,.075)",
      background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",
      backdropFilter: "blur(18px)",
    }}
  >
    <Typography
      sx={{
        color: "#ffffff !important",
        fontSize: 12,
        fontWeight: 950,
      }}
    >
      {value}
    </Typography>

    <Typography
      sx={{
        mt: 0.6,
        color: "#fecdd3 !important",
        fontSize: 9.5,
        fontWeight: 850,
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        mt: 0.45,
        color: "rgba(255,255,255,.30) !important",
        fontSize: 8.8,
        lineHeight: 1.55,
      }}
    >
      {description}
    </Typography>
  </Box>
);

const PlatformLogin = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const username = form.username.trim();

    if (!username) {
      toast.error("Foydalanuvchi nomini kiriting.");
      return;
    }

    if (!form.password) {
      toast.error("Parolni kiriting.");
      return;
    }

    setLoading(true);

    try {
      const response = await platformLogin({
        username,
        password: form.password,
      });

      const data = response?.data || response || {};

      if (!data.token || !data.admin) {
        throw new Error("Serverdan kirish ma’lumotlari to‘liq qaytmadi.");
      }

      localStorage.setItem("platform_token", data.token);

      localStorage.setItem("platform_admin", JSON.stringify(data.admin));

      toast.success("Platformaga muvaffaqiyatli kirildi.");

      navigate("/platform", {
        replace: true,
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Platformaga kirishda xato yuz berdi.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formCompleted = Boolean(form.username.trim()) && Boolean(form.password);

  return (
    <Box
      component="main"
      className="platform-login-page"
      sx={{
        minHeight: "100vh",
        p: {
          xs: 1.5,
          sm: 2.5,
          lg: 3,
        },
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        backgroundColor: "#f4f6f8",
        backgroundImage: `
          radial-gradient(
            circle at 0% 0%,
            rgba(153,27,27,.09),
            transparent 28%
          ),
          radial-gradient(
            circle at 100% 100%,
            rgba(15,23,42,.07),
            transparent 32%
          )
        `,
      }}
    >
      <style>{platformLoginStyles}</style>

      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1240,
          minHeight: {
            xs: "auto",
            lg: 720,
          },
          display: "grid",
          overflow: "hidden",
          borderRadius: {
            xs: "22px",
            md: "30px",
          },
          border: "1px solid rgba(148,163,184,.20)",
          backgroundColor: "#ffffff",
          boxShadow: "0 35px 100px rgba(15,23,42,.16)",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0,1.12fr) minmax(420px,.88fr)",
          },
        }}
      >
        <Box
          component="section"
          className="platform-brand-panel"
          sx={{
            position: "relative",
            isolation: "isolate",
            minHeight: {
              xs: 520,
              lg: 720,
            },
            p: {
              xs: 3,
              sm: 4.5,
              lg: 6,
            },
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            color: "#ffffff",
            backgroundColor: "#0d1117 !important",
            backgroundImage: `
              radial-gradient(
                circle at 100% 0%,
                rgba(220,38,38,.36),
                transparent 32%
              ),
              radial-gradient(
                circle at 0% 100%,
                rgba(127,29,29,.20),
                transparent 35%
              ),
              linear-gradient(
                145deg,
                #0b0f15,
                #171117 54%,
                #3a121a
              )
            !important`,
            "&::before": {
              content: '""',
              position: "absolute",
              width: 450,
              height: 450,
              top: -315,
              right: -215,
              borderRadius: "50%",
              border: "1px solid rgba(248,113,113,.17)",
              boxShadow: "0 0 0 72px rgba(248,113,113,.025),0 0 0 144px rgba(248,113,113,.015)",
              pointerEvents: "none",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              width: 230,
              height: 230,
              left: -140,
              bottom: -135,
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(220,38,38,.22),transparent 68%)",
              pointerEvents: "none",
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.2,
                px: 1.2,
                py: 0.9,
                borderRadius: "13px",
                border: "1px solid rgba(255,255,255,.08)",
                backgroundColor: "rgba(255,255,255,.045)",
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  display: "grid",
                  placeItems: "center",
                  color: "#ffffff",
                  borderRadius: "11px",
                  background: "linear-gradient(135deg,#991b1b,#dc2626)",
                  boxShadow: "0 10px 24px rgba(127,29,29,.30)",
                  fontSize: 15,
                  fontWeight: 950,
                }}
              >
                A
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "#ffffff !important",
                    fontSize: 11,
                    lineHeight: 1.2,
                    fontWeight: 950,
                    letterSpacing: ".08em",
                  }}
                >
                  AL AMIN
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    color: "rgba(255,255,255,.34) !important",
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: ".12em",
                  }}
                >
                  CRM PLATFORM
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                mt: {
                  xs: 5,
                  lg: 7,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.1,
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    height: 2,
                    borderRadius: 99,
                    background: "linear-gradient(90deg,#fb7185,#ef4444)",
                  }}
                />

                <Typography
                  sx={{
                    color: "#fecdd3 !important",
                    fontSize: 9.5,
                    fontWeight: 950,
                    letterSpacing: ".14em",
                    textTransform: "uppercase",
                  }}
                >
                  Platforma boshqaruv markazi
                </Typography>
              </Box>

              <Typography
                component="h1"
                sx={{
                  maxWidth: 620,
                  mt: 2,
                  color: "#ffffff !important",
                  fontSize: {
                    xs: 34,
                    sm: 43,
                    lg: 52,
                  },
                  lineHeight: 1.04,
                  fontWeight: 950,
                  letterSpacing: "-.055em",
                }}
              >
                Barcha korxonalarni yagona markazdan{" "}
                <Box
                  component="span"
                  sx={{
                    color: "#fca5a5",
                  }}
                >
                  boshqaring.
                </Box>
              </Typography>

              <Typography
                sx={{
                  maxWidth: 570,
                  mt: 2.2,
                  color: "rgba(255,255,255,.43) !important",
                  fontSize: {
                    xs: 12,
                    sm: 13,
                  },
                  lineHeight: 1.8,
                }}
              >
                Korxonalar, obunalar, platforma to‘lovlari va tizimning umumiy holatini himoyalangan
                boshqaruv panelida nazorat qiling.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              mt: 5,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3,minmax(0,1fr))",
                },
                gap: 1.2,
              }}
            >
              <PlatformFeature
                value="Korxonalar"
                label="Yagona ro‘yxat"
                description="Barcha mijoz korxonalarni boshqarish."
              />

              <PlatformFeature
                value="Obunalar"
                label="Aniq nazorat"
                description="Tarif va amal qilish muddatlarini kuzatish."
              />

              <PlatformFeature
                value="To‘lovlar"
                label="Tushum hisobi"
                description="Platforma daromadlarini nazorat qilish."
              />
            </Box>

            <Box
              sx={{
                mt: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.1,
                px: 1.5,
                py: 1.2,
                borderRadius: "15px",
                border: "1px solid rgba(255,255,255,.07)",
                backgroundColor: "rgba(255,255,255,.035)",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: 10,
                  height: 10,
                  flexShrink: 0,
                  borderRadius: "50%",
                  backgroundColor: "#4ade80",
                  boxShadow: "0 0 0 5px rgba(74,222,128,.10)",
                }}
              />

              <Box>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,.72) !important",
                    fontSize: 9.5,
                    fontWeight: 900,
                  }}
                >
                  Himoyalangan platforma kirishi
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    color: "rgba(255,255,255,.28) !important",
                    fontSize: 8.5,
                  }}
                >
                  Faqat platforma administratorlari uchun
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          component="section"
          sx={{
            minHeight: {
              xs: 580,
              lg: 720,
            },
            p: {
              xs: 3,
              sm: 5,
              lg: 7,
            },
            display: "flex",
            alignItems: "center",
            backgroundColor: "#ffffff",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 430,
              mx: "auto",
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                display: "grid",
                placeItems: "center",
                color: "#991b1b",
                borderRadius: "15px",
                border: "1px solid rgba(153,27,27,.12)",
                backgroundColor: "rgba(153,27,27,.055)",
                fontSize: 16,
                fontWeight: 950,
              }}
            >
              P
            </Box>

            <Typography
              sx={{
                mt: 2.5,
                color: "#991b1b",
                fontSize: 9.5,
                fontWeight: 950,
                letterSpacing: ".13em",
                textTransform: "uppercase",
              }}
            >
              Platform administratori
            </Typography>

            <Typography
              component="h2"
              sx={{
                mt: 1,
                color: "#0f172a",
                fontSize: {
                  xs: 29,
                  sm: 34,
                },
                lineHeight: 1.15,
                fontWeight: 950,
                letterSpacing: "-.045em",
              }}
            >
              Tizimga kirish
            </Typography>

            <Typography
              sx={{
                mt: 1.2,
                color: "#64748b",
                fontSize: 11.5,
                lineHeight: 1.7,
              }}
            >
              Platforma boshqaruv paneliga kirish uchun administrator ma’lumotlaringizni kiriting.
            </Typography>

            <Box
              component="form"
              onSubmit={submit}
              noValidate
              sx={{
                mt: 4,
                display: "grid",
                gap: 2,
              }}
            >
              <Box>
                <Typography sx={fieldLabelSx}>Foydalanuvchi nomi</Typography>

                <TextField
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  placeholder="Platform username"
                  autoFocus
                  required
                  fullWidth
                  disabled={loading}
                  inputProps={{
                    "aria-label": "Platform foydalanuvchi nomi",
                  }}
                  sx={inputSx}
                />
              </Box>

              <Box>
                <Typography sx={fieldLabelSx}>Parol</Typography>

                <TextField
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="Parolingizni kiriting"
                  required
                  fullWidth
                  disabled={loading}
                  inputProps={{
                    "aria-label": "Platform paroli",
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          disabled={loading}
                          sx={{
                            minWidth: "auto",
                            px: 1,
                            color: "#64748b",
                            fontSize: 9.5,
                            fontWeight: 900,
                            textTransform: "none",
                            "&:hover": {
                              color: "#991b1b",
                              backgroundColor: "transparent",
                            },
                          }}
                        >
                          {showPassword ? "Yashirish" : "Ko‘rsatish"}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  sx={inputSx}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                disabled={loading || !formCompleted}
                sx={{
                  minHeight: 52,
                  mt: 0.7,
                  color: "#ffffff",
                  borderRadius: "14px",
                  fontSize: 11.5,
                  fontWeight: 950,
                  textTransform: "none",
                  background: "linear-gradient(135deg,#7f1d1d,#b91c1c 55%,#dc2626)",
                  boxShadow: "0 14px 30px rgba(127,29,29,.22)",
                  "&:hover": {
                    background: "linear-gradient(135deg,#681818,#991b1b 55%,#b91c1c)",
                    boxShadow: "0 16px 34px rgba(127,29,29,.28)",
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,.58)",
                    background: "linear-gradient(135deg,#94a3b8,#64748b)",
                  },
                }}
              >
                {loading ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <CircularProgress
                      size={17}
                      thickness={5}
                      sx={{
                        color: "#ffffff",
                      }}
                    />
                    Kirilmoqda...
                  </Box>
                ) : (
                  "Platformaga kirish"
                )}
              </Button>
            </Box>

            <Box
              sx={{
                mt: 3.5,
                p: 1.6,
                display: "flex",
                alignItems: "flex-start",
                gap: 1.2,
                borderRadius: "15px",
                border: "1px solid #e7ebf0",
                backgroundColor: "#f8fafc",
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  color: "#991b1b",
                  borderRadius: "10px",
                  backgroundColor: "rgba(153,27,27,.07)",
                  fontSize: 11,
                  fontWeight: 950,
                }}
              >
                !
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "#475569",
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                >
                  Cheklangan boshqaruv sahifasi
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    color: "#94a3b8",
                    fontSize: 9,
                    lineHeight: 1.55,
                  }}
                >
                  Ushbu bo‘lim faqat platforma boshqaruvchilari uchun mo‘ljallangan.
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                mt: 3,
                color: "#c0c9d4",
                fontSize: 8.8,
                textAlign: "center",
              }}
            >
              © {new Date().getFullYear()} AL AMIN CRM Platform
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const fieldLabelSx = {
  mb: 0.8,
  color: "#475569",
  fontSize: 10,
  fontWeight: 900,
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 52,
    borderRadius: "14px",
    backgroundColor: "#f8fafc",
    transition: "background-color .2s ease, box-shadow .2s ease",

    "& fieldset": {
      borderColor: "#dfe5eb",
    },

    "&:hover fieldset": {
      borderColor: "rgba(153,27,27,.30)",
    },

    "&.Mui-focused": {
      backgroundColor: "#ffffff",
      boxShadow: "0 0 0 4px rgba(153,27,27,.055)",
    },

    "&.Mui-focused fieldset": {
      borderWidth: "1px",
      borderColor: "#991b1b",
    },
  },

  "& input": {
    color: "#0f172a",
    fontSize: 11.5,
    fontWeight: 750,
  },

  "& input::placeholder": {
    color: "#a8b3c0",
    opacity: 1,
  },
};

const platformLoginStyles = `
  .platform-login-page * {
    box-sizing: border-box;
  }

  .platform-login-page .platform-brand-panel {
    color: #ffffff !important;
    background-color: #0d1117 !important;
  }

  @media (max-width: 1199px) {
    .platform-login-page {
      overflow-y: auto !important;
    }
  }
`;

export default PlatformLogin;
