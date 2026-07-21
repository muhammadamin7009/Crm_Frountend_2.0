import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../../api/axios";
import { getCompanyBranding } from "../../api/companyBranding";
import AuthBrandPanel from "../../Components/Auth/AuthBrandPanel";
import SiteLogo from "../../images/zerr_02_logo.png";
import {
  getCompanyLogoUrl,
  getCompanySlug,
  normalizeCompanySlug,
  setCompanySlug,
} from "../../utils/company";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 56,
    borderRadius: "14px",
    backgroundColor: "#ffffff",
    transition: "box-shadow .2s ease, border-color .2s ease, background-color .2s ease",

    "& fieldset": {
      borderColor: "#dce2e9",
    },

    "&:hover fieldset": {
      borderColor: "#9ca6b3",
    },

    "&.Mui-focused": {
      boxShadow: "0 0 0 4px rgba(153,27,27,.07)",
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
    fontSize: 11,
    lineHeight: 1.45,
  },
};

const readonlyFieldSx = {
  ...fieldSx,

  "& .MuiOutlinedInput-root": {
    ...fieldSx["& .MuiOutlinedInput-root"],
    background: "linear-gradient(135deg,#f8fafc 0%,#ffffff 100%)",
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
  transition: "transform .18s ease, box-shadow .18s ease, background .18s ease",

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

const formatNameValue = (value = "") =>
  String(value)
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => {
      const lower = part.toLocaleLowerCase("uz-UZ");

      return lower ? `${lower[0].toLocaleUpperCase("uz-UZ")}${lower.slice(1)}` : "";
    })
    .join(" ");

const compactPhoneValue = (value = "") => {
  const text = String(value).trim();

  if (!text) return "";

  const digits = text.replace(/\D/g, "");

  return text.startsWith("+") ? `+${digits}` : digits;
};

const formatPhoneInput = (value = "") => {
  const text = String(value).trim();

  if (!text) return "";

  const digits = text.replace(/\D/g, "");

  const isUzbekPhone = text.startsWith("+998") || digits.startsWith("998") || text === "+998";

  if (!isUzbekPhone) {
    return text.startsWith("+") ? `+${digits}` : digits;
  }

  const local = digits.startsWith("998") ? digits.slice(3) : digits;

  let formatted = "+998";

  if (local.length > 0) {
    formatted += ` (${local.slice(0, 2)}`;
  }

  if (local.length >= 2) {
    formatted += ")";
  }

  if (local.length > 2) {
    formatted += ` ${local.slice(2, 5)}`;
  }

  if (local.length > 5) {
    formatted += `-${local.slice(5, 7)}`;
  }

  if (local.length > 7) {
    formatted += `-${local.slice(7, 9)}`;
  }

  if (local.length > 9) {
    formatted += ` ${local.slice(9)}`;
  }

  return formatted;
};

const normalizePhoneForSubmit = (value = "") => {
  const phone = compactPhoneValue(value);

  if (!phone || phone === "+998") {
    return null;
  }

  if (!phone.startsWith("+")) {
    throw new Error("Telefon raqam + bilan boshlansin. Masalan: +998965001001");
  }

  if (phone.startsWith("+998") && !/^\+998\d{9}$/.test(phone)) {
    throw new Error("O‘zbekiston raqami +998 dan keyin aynan 9 ta raqam bo‘lishi kerak.");
  }

  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new Error("Telefon raqam xalqaro formatda bo‘lishi kerak. Masalan: +998965001001");
  }

  return phone;
};

const Register = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState(null);
  const [brandingLoading, setBrandingLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      phone: "+998",
      password: "",
      confirm_password: "",
      company_slug: getCompanySlug(),
    },
  });

  const password = watch("password");
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

  const onSubmit = async (submittedValues) => {
    const { company_slug, confirm_password, ...values } = submittedValues;

    setLoading(true);

    try {
      const phone = normalizePhoneForSubmit(values.phone);
      const slug = setCompanySlug(company_slug);

      await api.post(
        "/users",
        {
          ...values,
          first_name: formatNameValue(values.first_name),
          last_name: formatNameValue(values.last_name),
          phone,
        },
        {
          baseURL: getBaseUrl(slug),
        },
      );

      toast.success("Ro‘yxatdan o‘tdingiz. Endi tizimga kirishingiz mumkin.");

      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Ro‘yxatdan o‘tishda xato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: {
          xs: 1.5,
          sm: 3,
          lg: 4,
        },
        py: {
          xs: 1.5,
          sm: 3,
          lg: 4,
        },
        display: "flex",
        alignItems: "center",
        background: `
          radial-gradient(
            circle at 7% 7%,
            rgba(127,29,29,.085),
            transparent 27%
          ),
          radial-gradient(
            circle at 93% 91%,
            rgba(15,23,42,.055),
            transparent 29%
          ),
          linear-gradient(
            145deg,
            #f7f7f8 0%,
            #f1f3f5 100%
          )
        `,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1480,
          minHeight: {
            xs: "calc(100vh - 24px)",
            lg: 850,
          },
          mx: "auto",
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "0.96fr 1.04fr",
          },
          overflow: "hidden",
          borderRadius: {
            xs: "22px",
            sm: "30px",
          },
          border: "1px solid rgba(15,23,42,.08)",
          backgroundColor: "#ffffff",
          boxShadow: `
            0 30px 90px rgba(15,23,42,.14),
            inset 0 1px 0 rgba(255,255,255,.8)
          `,
        }}
      >
        <AuthBrandPanel
          variant="register"
          companyName={companyTitle}
          companyLogo={companyLogo}
          eyebrow="Yangi korxona hisobini yaratish"
          title="Mukammal boshqaruv sari birinchi qadamingizni"
          accent="bugun boshlang"
          description="Korxonangiz uchun xavfsiz hisob yarating. Savdo, ombor, xodimlar va moliyaviy jarayonlarni yagona premium tizimda boshqaring."
        />

        <Box
          component="main"
          sx={{
            minHeight: {
              xs: "calc(100vh - 24px)",
              lg: 850,
            },
            p: {
              xs: 2.5,
              sm: 5,
              lg: 6,
              xl: 8,
            },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `
              radial-gradient(
                circle at 93% 5%,
                rgba(127,29,29,.04),
                transparent 27%
              ),
              #ffffff
            `,
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 650,
            }}
          >
            <Box
              sx={{
                display: {
                  xs: "flex",
                  lg: "none",
                },
                alignItems: "center",
                gap: 1.5,
                mb: 4,
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

            <Box sx={{ mb: 3.5 }}>
              <Box
                sx={{
                  width: "fit-content",
                  mb: 1.8,
                  px: 1.3,
                  py: 0.7,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.8,
                  borderRadius: "999px",
                  color: "#991b1b",
                  border: "1px solid rgba(153,27,27,.12)",
                  backgroundColor: "rgba(153,27,27,.055)",
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#dc2626",
                    boxShadow: "0 0 0 4px rgba(220,38,38,.08)",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 850,
                    letterSpacing: ".04em",
                  }}
                >
                  Yangi foydalanuvchi hisobi
                </Typography>
              </Box>

              <Typography
                component="h1"
                sx={{
                  m: 0,
                  color: "#111827",
                  fontSize: {
                    xs: 33,
                    sm: 42,
                  },
                  lineHeight: 1.08,
                  fontWeight: 950,
                  letterSpacing: "-0.045em",
                }}
              >
                Ro‘yxatdan o‘tish
              </Typography>

              <Typography
                sx={{
                  mt: 1.4,
                  color: "#687385",
                  fontSize: {
                    xs: 14,
                    sm: 15.5,
                  },
                  lineHeight: 1.65,
                  fontWeight: 500,
                }}
              >
                Ma’lumotlaringizni to‘ldiring. Hisobingiz korxonaga biriktirilgan holda yaratiladi.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1.8,
                }}
              >
                {/* Korxona kodi — to‘liq qator */}
                <TextField
                  fullWidth
                  label="Korxona kodi"
                  placeholder="Masalan: zerrshoes"
                  autoComplete="organization"
                  error={Boolean(errors.company_slug)}
                  helperText={errors.company_slug?.message || "Korxonangizga berilgan maxsus kod."}
                  {...register("company_slug", {
                    required: "Korxona kodi majburiy",
                    pattern: {
                      value: /^[a-z0-9-]+$/,
                      message: "Faqat kichik harf, raqam va chiziqcha kiriting",
                    },
                  })}
                  sx={{
                    ...fieldSx,
                    gridColumn: "1 / -1",
                  }}
                />

                {/* Ism */}
                <TextField
                  fullWidth
                  label="Ism"
                  autoComplete="given-name"
                  error={Boolean(errors.first_name)}
                  helperText={errors.first_name?.message}
                  {...register("first_name", {
                    required: "Ism majburiy",
                    setValueAs: formatNameValue,
                    maxLength: {
                      value: 50,
                      message: "Ism 50 belgidan oshmasin",
                    },
                  })}
                  sx={fieldSx}
                />

                {/* Familiya */}
                <TextField
                  fullWidth
                  label="Familiya"
                  autoComplete="family-name"
                  error={Boolean(errors.last_name)}
                  helperText={errors.last_name?.message}
                  {...register("last_name", {
                    required: "Familiya majburiy",
                    setValueAs: formatNameValue,
                    maxLength: {
                      value: 50,
                      message: "Familiya 50 belgidan oshmasin",
                    },
                  })}
                  sx={fieldSx}
                />

                {/* Foydalanuvchi nomi */}
                <TextField
                  fullWidth
                  label="Foydalanuvchi nomi"
                  autoComplete="username"
                  error={Boolean(errors.username)}
                  helperText={errors.username?.message}
                  {...register("username", {
                    required: "Foydalanuvchi nomi majburiy",
                    maxLength: {
                      value: 30,
                      message: "Foydalanuvchi nomi 30 belgidan oshmasin",
                    },
                  })}
                  sx={fieldSx}
                />

                {/* Telefon */}
                <TextField
                  fullWidth
                  label="Telefon"
                  placeholder="+998 (96) 500-10-01"
                  autoComplete="tel"
                  error={Boolean(errors.phone)}
                  helperText={
                    errors.phone?.message || "+998 raqamida 9 ta mahalliy raqam bo‘lishi shart."
                  }
                  {...register("phone", {
                    maxLength: {
                      value: 30,
                      message: "Telefon 30 belgidan oshmasin",
                    },
                    validate: (value) => {
                      try {
                        normalizePhoneForSubmit(value);
                        return true;
                      } catch (error) {
                        return error.message;
                      }
                    },
                    onChange: (event) => {
                      setValue("phone", formatPhoneInput(event.target.value), {
                        shouldValidate: true,
                      });
                    },
                  })}
                  sx={fieldSx}
                />

                {/* Parol */}
                <TextField
                  fullWidth
                  type="password"
                  label="Parol"
                  autoComplete="new-password"
                  error={Boolean(errors.password)}
                  helperText={errors.password?.message}
                  {...register("password", {
                    required: "Parol majburiy",
                    minLength: {
                      value: 6,
                      message: "Parol kamida 6 belgi bo‘lsin",
                    },
                    maxLength: {
                      value: 100,
                      message: "Parol 100 belgidan oshmasin",
                    },
                  })}
                  sx={fieldSx}
                />

                {/* Parolni takrorlash */}
                <TextField
                  fullWidth
                  type="password"
                  label="Parolni takrorlang"
                  autoComplete="new-password"
                  error={Boolean(errors.confirm_password)}
                  helperText={errors.confirm_password?.message}
                  {...register("confirm_password", {
                    required: "Parolni takrorlang",
                    validate: (value) => value === password || "Parollar mos emas",
                  })}
                  sx={fieldSx}
                />
              </Box>

              <Box
                sx={{
                  mt: 2.5,
                  p: 1.7,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.4,
                  borderRadius: "15px",
                  border: "1px solid rgba(34,197,94,.12)",
                  background: "linear-gradient(135deg,rgba(34,197,94,.055),rgba(255,255,255,.9))",
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    borderRadius: "11px",
                    color: "#15803d",
                    fontSize: 15,
                    fontWeight: 950,
                    backgroundColor: "rgba(34,197,94,.10)",
                  }}
                >
                  ✓
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#172033",
                      fontSize: 12.5,
                      fontWeight: 850,
                    }}
                  >
                    Xavfsiz ro‘yxatdan o‘tish
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.35,
                      color: "#7b8494",
                      fontSize: 11,
                      lineHeight: 1.45,
                    }}
                  >
                    Ma’lumotlaringiz faqat korxona tizimida ishlatiladi.
                  </Typography>
                </Box>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  ...primaryButtonSx,
                  mt: 2.5,
                }}
              >
                {loading ? "Hisob yaratilmoqda..." : "Hisobni yaratish"}
              </Button>
            </form>

            <Box
              sx={{
                mt: 3.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.6,
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
                Hisobingiz bormi?
              </Typography>

              <Link
                to="/login"
                style={{
                  color: "#991b1b",
                  fontSize: "13.5px",
                  fontWeight: 900,
                  textDecoration: "none",
                }}
              >
                Tizimga kirish
              </Link>
            </Box>

            <Typography
              sx={{
                mt: 3,
                color: "#a0a7b2",
                fontSize: 11,
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

export default Register;
