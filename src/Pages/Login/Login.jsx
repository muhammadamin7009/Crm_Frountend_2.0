import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../../api/axios";
import { getCompanyBranding } from "../../api/companyBranding";
import AuthBrandPanel from "../../Components/Auth/AuthBrandPanel";
import { useAuth } from "../../Context/AuthContext";
import SiteLogo from "../../images/zerr_02_logo.png";
import { setSession } from "../../utils/auth";
import {
  getCompanyLogoUrl,
  getCompanySlug,
  normalizeCompanySlug,
  setCompanySlug,
} from "../../utils/company";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 58,
    borderRadius: "15px",
    backgroundColor: "#ffffff",
    transition: "box-shadow .2s ease",

    "& fieldset": {
      borderColor: "#dce2e9",
    },

    "&:hover fieldset": {
      borderColor: "#9ca6b3",
    },

    "&.Mui-focused": {
      boxShadow: "0 0 0 4px rgba(153,27,27,.075)",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#991b1b",
      borderWidth: 1,
    },
  },

  "& .MuiInputLabel-root": {
    color: "#687385",
    fontWeight: 600,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#991b1b",
  },

  "& .MuiFormHelperText-root": {
    mx: 0.5,
    fontSize: 11.5,
  },
};

const readonlyFieldSx = {
  ...fieldSx,

  "& .MuiOutlinedInput-root": {
    ...fieldSx["& .MuiOutlinedInput-root"],
    background: "linear-gradient(135deg,#f8fafc,#ffffff)",
  },

  "& .MuiOutlinedInput-input": {
    color: "#172033",
    fontWeight: 800,
  },
};

const primaryButtonSx = {
  minHeight: 58,
  borderRadius: "15px",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 900,
  textTransform: "none",
  background: "linear-gradient(135deg,#7f1d1d 0%,#b91c1c 100%)",
  boxShadow: "0 14px 30px rgba(127,29,29,.22)",
  transition: "transform .18s ease, box-shadow .18s ease",

  "&:hover": {
    transform: "translateY(-1px)",
    background: "linear-gradient(135deg,#681818 0%,#991b1b 100%)",
    boxShadow: "0 17px 34px rgba(127,29,29,.28)",
  },

  "&.Mui-disabled": {
    color: "rgba(255,255,255,.72)",
    background: "#cbd5e1",
    boxShadow: "none",
  },
};

const secondaryButtonSx = {
  minHeight: 48,
  borderRadius: "13px",
  color: "#7f1d1d",
  fontWeight: 850,
  textTransform: "none",

  "&:hover": {
    backgroundColor: "rgba(153,27,27,.055)",
  },
};

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [setupResult, setSetupResult] = useState(null);
  const [branding, setBranding] = useState(null);
  const [brandingLoading, setBrandingLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
      company_slug: getCompanySlug(),
    },
  });

  const companySlug = watch("company_slug");
  const normalizedSlug = normalizeCompanySlug(companySlug);
  const isMainCompany = normalizedSlug === "zerrshoes";

  const companyTitle =
    branding?.name ||
    (isMainCompany
      ? "Al-Amin CRM"
      : normalizedSlug
        ? normalizedSlug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
        : "Al-Amin CRM");

  const companyLogo = getCompanyLogoUrl(branding?.logo_url) || (isMainCompany ? SiteLogo : "");

  useEffect(() => {
    const slug = normalizeCompanySlug(companySlug);

    if (!slug) {
      setBranding(null);
      setBrandingLoading(false);
      return undefined;
    }

    setBrandingLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const { data } = await getCompanyBranding(slug);
        setBranding(data.company || null);
      } catch {
        setBranding(null);
      } finally {
        setBrandingLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [companySlug]);

  const getBaseUrl = (slug) =>
    `${String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api/${slug}`;

  const finishLogin = (data) => {
    setSession({
      token: data.token,
      user: data.user,
    });

    setUser(data.user);

    toast.success("Muvaffaqiyatli tizimga kirdingiz");

    navigate("/");
  };

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      const slug = setCompanySlug(values.company_slug);

      const { data } = await api.post(
        "/users/login",
        {
          username: values.username,
          password: values.password,
          device_id: localStorage.getItem("device_id") || undefined,
        },
        {
          baseURL: getBaseUrl(slug),
        },
      );

      if (data.mfa_required) {
        setChallenge(data);

        toast.info(
          data.setup_required
            ? "Google Authenticator'ni bir marta sozlang."
            : "Google Authenticator kodini kiriting.",
        );

        return;
      }

      finishLogin(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login xato");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const normalizedCode = code.trim().toUpperCase();

    const validCode =
      /^\d{6}$/.test(normalizedCode) ||
      (!challenge?.setup_required && /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(normalizedCode));

    if (!validCode) {
      toast.error("6 xonali kod yoki tiklash kodini kiriting.");
      return;
    }

    setLoading(true);

    try {
      const slug = setCompanySlug(watch("company_slug"));

      const { data } = await api.post(
        "/users/login/verify",
        {
          challenge_id: challenge.challenge_id,
          code: normalizedCode,
        },
        {
          baseURL: getBaseUrl(slug),
        },
      );

      if (data.recovery_codes?.length) {
        setSetupResult(data);
        setChallenge(null);
        setCode("");

        toast.success("Google Authenticator muvaffaqiyatli ulandi.");

        return;
      }

      finishLogin(data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Tasdiqlash kodi noto‘g‘ri.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error("Nusxalab bo‘lmadi. Ma’lumotni qo‘lda saqlang.");
    }
  };

  const pageTitle = setupResult
    ? "Tiklash kodlarini saqlang"
    : challenge?.setup_required
      ? "Authenticator'ni sozlash"
      : challenge
        ? "Kirishni tasdiqlash"
        : "Xush kelibsiz! 👋";

  const pageDescription = setupResult
    ? "Bu kodlar telefon yo‘qolsa hisobga kirish uchun kerak. Ular boshqa ko‘rsatilmaydi."
    : challenge?.setup_required
      ? "QR-kodni Google Authenticator bilan skanerlang va 6 xonali kodni kiriting."
      : challenge
        ? "Google Authenticator ilovasidagi kodni kiriting."
        : "Hisobingizga kirish uchun ma’lumotlaringizni kiriting.";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: { xs: 1.5, sm: 3, lg: 4 },
        display: "flex",
        alignItems: "center",
        background:
          "radial-gradient(circle at 10% 8%,rgba(127,29,29,.075),transparent 28%),#f5f6f8",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1480,
          minHeight: { xs: "calc(100vh - 24px)", lg: 820 },
          mx: "auto",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "0.98fr 1.02fr",
          },
          overflow: "hidden",
          borderRadius: { xs: "22px", sm: "30px" },
          border: "1px solid rgba(15,23,42,.08)",
          backgroundColor: "#ffffff",
          boxShadow: "0 28px 80px rgba(15,23,42,.13)",
        }}
      >
        <AuthBrandPanel companyName={companyTitle} companyLogo={companyLogo} />

        <Box
          sx={{
            minHeight: { xs: "calc(100vh - 24px)", lg: 820 },
            p: { xs: 2.5, sm: 5, lg: 7, xl: 9 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(circle at 92% 5%,rgba(127,29,29,.04),transparent 28%),#ffffff",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 550,
            }}
          >
            <Box
              sx={{
                display: { xs: "flex", lg: "none" },
                alignItems: "center",
                gap: 1.5,
                mb: 5,
              }}
            >
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 8px 20px rgba(15,23,42,.07)",
                }}
              >
                {companyLogo ? (
                  <Box
                    component="img"
                    src={companyLogo}
                    alt={companyTitle}
                    sx={{
                      width: 39,
                      height: 39,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Typography
                    sx={{
                      color: "#991b1b",
                      fontSize: 20,
                      fontWeight: 950,
                    }}
                  >
                    {companyTitle.charAt(0)}
                  </Typography>
                )}
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    color: "#111827",
                    fontSize: 18,
                    fontWeight: 950,
                  }}
                >
                  {companyTitle}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color: "#7b8494",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Korxonani boshqarish tizimi
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                component="h2"
                sx={{
                  m: 0,
                  color: "#111827",
                  fontSize: { xs: 34, sm: 43 },
                  lineHeight: 1.08,
                  fontWeight: 950,
                  letterSpacing: "-0.045em",
                }}
              >
                {pageTitle}
              </Typography>

              <Typography
                sx={{
                  mt: 1.5,
                  color: "#687385",
                  fontSize: { xs: 14.5, sm: 16.5 },
                  lineHeight: 1.65,
                  fontWeight: 500,
                }}
              >
                {pageDescription}
              </Typography>
            </Box>

            {setupResult ? (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2,minmax(0,1fr))",
                      sm: "repeat(4,minmax(0,1fr))",
                    },
                    gap: 1,
                    p: 2,
                    borderRadius: "18px",
                    border: "1px solid #fde68a",
                    backgroundColor: "#fffbeb",
                  }}
                >
                  {setupResult.recovery_codes.map((recoveryCode) => (
                    <Typography
                      key={recoveryCode}
                      component="code"
                      sx={{
                        px: 1,
                        py: 1.2,
                        textAlign: "center",
                        color: "#172033",
                        fontWeight: 850,
                        borderRadius: "10px",
                        border: "1px solid #fef3c7",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {recoveryCode}
                    </Typography>
                  ))}
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() =>
                    copyText(setupResult.recovery_codes.join("\n"), "Tiklash kodlari nusxalandi.")
                  }
                  sx={{
                    minHeight: 50,
                    borderRadius: "13px",
                    color: "#7f1d1d",
                    borderColor: "rgba(153,27,27,.22)",
                    fontWeight: 850,
                    textTransform: "none",
                  }}
                >
                  Kodlarni nusxalash
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => finishLogin(setupResult)}
                  sx={primaryButtonSx}
                >
                  Saqladim, tizimga kirish
                </Button>
              </Box>
            ) : challenge ? (
              <Box sx={{ display: "grid", gap: 2 }}>
                {challenge.setup_required && (
                  <Box
                    sx={{
                      p: 2.5,
                      textAlign: "center",
                      borderRadius: "18px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <Box
                      component="img"
                      src={challenge.qr_code_data_url}
                      alt="Google Authenticator QR-kodi"
                      sx={{
                        width: 220,
                        height: 220,
                        maxWidth: "100%",
                        mx: "auto",
                        p: 1,
                        borderRadius: "14px",
                        backgroundColor: "#ffffff",
                      }}
                    />

                    <Typography
                      sx={{
                        mt: 2,
                        color: "#687385",
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      QR-kod ishlamasa, ilovada quyidagi sozlash kalitini kiriting:
                    </Typography>

                    <Typography
                      component="code"
                      sx={{
                        display: "block",
                        mt: 1.2,
                        px: 1.5,
                        py: 1.2,
                        wordBreak: "break-all",
                        color: "#172033",
                        fontWeight: 850,
                        letterSpacing: ".08em",
                        borderRadius: "10px",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {challenge.manual_key}
                    </Typography>

                    <Button
                      size="small"
                      onClick={() => copyText(challenge.manual_key, "Sozlash kaliti nusxalandi.")}
                      sx={{
                        mt: 1,
                        color: "#991b1b",
                        fontWeight: 850,
                        textTransform: "none",
                      }}
                    >
                      Kalitni nusxalash
                    </Button>
                  </Box>
                )}

                <TextField
                  fullWidth
                  autoFocus
                  label={
                    challenge.setup_required
                      ? "Authenticator kodi"
                      : "Authenticator yoki tiklash kodi"
                  }
                  value={code}
                  onChange={(event) => {
                    const value = challenge.setup_required
                      ? event.target.value.replace(/\D/g, "").slice(0, 6)
                      : event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9-]/g, "")
                          .slice(0, 9);

                    setCode(value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      verifyCode();
                    }
                  }}
                  inputProps={{
                    inputMode: challenge.setup_required ? "numeric" : "text",
                    maxLength: challenge.setup_required ? 6 : 9,
                  }}
                  sx={fieldSx}
                />

                <Button
                  fullWidth
                  variant="contained"
                  disabled={
                    loading ||
                    !(challenge.setup_required
                      ? /^\d{6}$/.test(code)
                      : /^\d{6}$/.test(code) || /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code))
                  }
                  onClick={verifyCode}
                  sx={primaryButtonSx}
                >
                  {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
                </Button>

                <Button
                  fullWidth
                  onClick={() => {
                    setChallenge(null);
                    setCode("");
                  }}
                  sx={secondaryButtonSx}
                >
                  Kirish ma’lumotlariga qaytish
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Korxona kodi"
                    placeholder="Masalan: zerrshoes"
                    autoComplete="organization"
                    error={Boolean(errors.company_slug)}
                    helperText={
                      errors.company_slug?.message ||
                      "Korxonangizga berilgan maxsus kodni kiriting."
                    }
                    {...register("company_slug", {
                      required: "Korxona kodi majburiy",
                      pattern: {
                        value: /^[a-z0-9-]+$/,
                        message: "Faqat kichik harf, raqam va chiziqcha kiriting",
                      },
                    })}
                    sx={fieldSx}
                  />


                  <TextField
                    fullWidth
                    label="Foydalanuvchi nomi"
                    autoComplete="username"
                    error={Boolean(errors.username)}
                    helperText={errors.username?.message}
                    {...register("username", {
                      required: "Foydalanuvchi nomi majburiy",
                    })}
                    sx={fieldSx}
                  />

                  <TextField
                    fullWidth
                    type="password"
                    label="Parol"
                    autoComplete="current-password"
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                    {...register("password", {
                      required: "Parol majburiy",
                    })}
                    sx={fieldSx}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          sx={{
                            color: "#9ca6b3",

                            "&.Mui-checked": {
                              color: "#991b1b",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          sx={{
                            color: "#687385",
                            fontSize: 13.5,
                            fontWeight: 600,
                          }}
                        >
                          Eslab qolish
                        </Typography>
                      }
                    />

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                      }}
                    >
                      <Box
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          backgroundColor: "#22c55e",
                          boxShadow: "0 0 0 4px rgba(34,197,94,.08)",
                        }}
                      />

                      <Typography
                        sx={{
                          color: "#687385",
                          fontSize: 12.5,
                          fontWeight: 700,
                        }}
                      >
                        Xavfsiz kirish
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={primaryButtonSx}
                  >
                    {loading ? "Kirilmoqda..." : "Tizimga kirish"}
                  </Button>
                </Box>
              </form>
            )}

            {!challenge && !setupResult && (
              <Box
                sx={{
                  mt: 4,
                  textAlign: "center",
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    color: "#7b8494",
                    fontSize: 13.5,
                    fontWeight: 600,
                  }}
                >
                  Hisobingiz yo‘qmi?{" "}
                </Typography>

                <Link
                  to="/register"
                  style={{
                    color: "#991b1b",
                    fontSize: "13.5px",
                    fontWeight: 900,
                    textDecoration: "none",
                  }}
                >
                  Ro‘yxatdan o‘tish
                </Link>
              </Box>
            )}

            <Typography
              sx={{
                mt: 4,
                color: "#a0a7b2",
                fontSize: 11.5,
                textAlign: "center",
              }}
            >
              © {new Date().getFullYear()} Al-Amin CRM. Barcha huquqlar himoyalangan.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
