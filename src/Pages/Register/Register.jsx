import { Alert, Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { submitCompanyApplication } from "../../api/platform";
import AuthBrandPanel from "../../Components/Auth/AuthBrandPanel";
import FounderCredit from "../../Components/UI/FounderCredit";
import AppLogo from "../../images/al-amin-erp-mark.png";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    minHeight: 56,
    borderRadius: "14px",
    backgroundColor: "var(--aa-surface-solid)",
    transition: "box-shadow .2s ease, border-color .2s ease, background-color .2s ease",

    "& fieldset": {
      borderColor: "#e8e1d8",
    },

    "&:hover fieldset": {
      borderColor: "#a89d95",
    },

    "&.Mui-focused": {
      boxShadow: "0 0 0 4px rgba(110, 22, 34,.07)",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#6e1622",
      borderWidth: 1,
    },
  },

  "& .MuiInputLabel-root": {
    color: "#7d716a",
    fontWeight: 600,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#6e1622",
  },

  "& .MuiFormHelperText-root": {
    mx: 0.5,
    fontSize: 11,
    lineHeight: 1.45,
  },
};

const primaryButtonSx = {
  minHeight: 58,
  borderRadius: "15px",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 700,
  textTransform: "none",
  background: "linear-gradient(135deg,#4d0f18 0%,#7a1826 100%)",
  boxShadow: "0 14px 30px rgba(77, 15, 24,.22)",
  transition: "transform .18s ease, box-shadow .18s ease, background .18s ease",

  "&:hover": {
    transform: "translateY(-1px)",
    background: "linear-gradient(135deg,#4d0f18 0%,#6e1622 100%)",
    boxShadow: "0 17px 34px rgba(77, 15, 24,.28)",
  },

  "&.Mui-disabled": {
    color: "rgba(255,255,255,.72)",
    background: "#d8cec1",
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
  const [submissionNotice, setSubmissionNotice] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      company_name: "",
      company_slug: "",
      first_name: "",
      last_name: "",
      username: "",
      phone: "+998",
      password: "",
      confirm_password: "",
    },
  });

  const password = watch("password");
  const companyTitle = "Al-amin ERP";
  // Ro'yxatdan o'tish sahifasi hali biror korxonaga tegishli emas — loyiha logosi.
  const companyLogo = AppLogo;

  const onSubmit = async (submittedValues) => {
    const { confirm_password: _confirmPassword, ...values } = submittedValues;

    setLoading(true);
    setSubmissionNotice(null);

    try {
      const phone = normalizePhoneForSubmit(values.phone);

      await submitCompanyApplication({
        ...values,
        company_name: values.company_name.trim(),
        company_slug: values.company_slug.trim().toLowerCase(),
        first_name: formatNameValue(values.first_name),
        last_name: formatNameValue(values.last_name),
        phone,
      });

      toast.success(
        "Arizangiz yuborildi. Platforma administratori tasdiqlagach tizimga kira olasiz.",
      );

      navigate("/login", {
        state: {
          companyApplication: {
            status: "pending",
            company_name: values.company_name.trim(),
            company_slug: values.company_slug.trim().toLowerCase(),
            message: "Korxona arizangiz ko‘rib chiqilmoqda.",
          },
        },
      });
    } catch (error) {
      const message =
        error?.response?.data?.message || error?.message || "Ro‘yxatdan o‘tishda xato.";
      const normalizedMessage = message.toLocaleLowerCase("uz-UZ");
      const severity = normalizedMessage.includes("kutilmoqda")
        ? "warning"
        : normalizedMessage.includes("tasdiqlangan") || normalizedMessage.includes("qabul qilingan")
          ? "success"
          : "error";

      setSubmissionNotice({ message, severity });

      if (severity === "warning") toast.info(message);
      else if (severity === "success") toast.success(message);
      else toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="auth-page auth-register-page"
      sx={{
        minHeight: "100vh",
        height: { lg: "100dvh" },
        px: {
          xs: 1.5,
          sm: 3,
          lg: 3,
        },
        py: {
          xs: 1.5,
          sm: 3,
          lg: 3,
        },
        display: "flex",
        alignItems: "center",
        overflow: { lg: "hidden" },

        "@media (min-width: 1200px) and (max-height: 780px)": {
          "& .auth-form-panel": {
            p: 2.5,
          },

          "& .auth-register-heading": {
            mb: 1.5,
          },

          "& .auth-register-heading-badge": {
            mb: 1,
            py: 0.45,
          },

          "& .auth-register-heading h1": {
            fontSize: 35,
          },

          "& .auth-register-heading h1 + p": {
            mt: 0.8,
            lineHeight: 1.4,
          },

          "& .auth-register-fields": {
            gap: 1.1,
          },

          "& .auth-register-assurance": {
            mt: 1.25,
            p: 1,
          },

          "& .auth-register-submit": {
            mt: 1.25,
          },

          "& .auth-register-account": {
            mt: 1.5,
          },

          "& .auth-register-copyright": {
            mt: 1.25,
          },
        },
        background: `
          radial-gradient(
            circle at 7% 7%,
            rgba(77, 15, 24,.085),
            transparent 27%
          ),
          radial-gradient(
            circle at 93% 91%,
            rgba(23, 17, 15,.055),
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
        className="auth-shell"
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1480,
          minHeight: {
            xs: "calc(100vh - 24px)",
            lg: 0,
          },
          height: { lg: "min(850px, calc(100dvh - 48px))" },
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
          border: "1px solid rgba(23, 17, 15,.08)",
          backgroundColor: "var(--aa-surface-solid)",
          boxShadow: `
            0 30px 90px rgba(23, 17, 15,.14),
            inset 0 1px 0 rgba(255,255,255,.8)
          `,
        }}
      >
        <AuthBrandPanel
          variant="register"
          companyName={companyTitle}
          companyLogo={companyLogo}
          eyebrow="Yangi korxona arizasini yuborish"
          title="Mukammal boshqaruv sari birinchi qadamingizni"
          accent="bugun boshlang"
          description="Korxonangiz ma’lumotlarini yuboring. Platforma administratori tasdiqlagach boshqaruv tizimingiz avtomatik yaratiladi."
        />

        <Box
          className="auth-form-panel"
          component="main"
          sx={{
            minHeight: {
              xs: "calc(100vh - 24px)",
              lg: 0,
            },
            height: { lg: "100%" },
            p: {
              xs: 2.5,
              sm: 5,
              lg: "clamp(24px, 4vh, 48px)",
            },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflowY: { lg: "auto" },
            background: `
              radial-gradient(
                circle at 93% 5%,
                rgba(77, 15, 24,.04),
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
                  border: "1px solid #e8e1d8",
                  backgroundColor: "var(--aa-surface-solid)",
                  boxShadow: "0 8px 20px rgba(23, 17, 15,.07)",
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
                      color: "#6e1622",
                      fontSize: 20,
                      fontWeight: 700,
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
                    color: "var(--aa-text)",
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {companyTitle}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color: "#7d716a",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Korxonani boshqarish tizimi
                </Typography>
              </Box>
            </Box>

            <Box className="auth-register-heading" sx={{ mb: 3.5 }}>
              <Box
                className="auth-register-heading-badge"
                sx={{
                  width: "fit-content",
                  mb: 1.8,
                  px: 1.3,
                  py: 0.7,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.8,
                  borderRadius: "999px",
                  color: "#6e1622",
                  border: "1px solid rgba(110, 22, 34,.12)",
                  backgroundColor: "rgba(110, 22, 34,.055)",
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#8c1d2b",
                    boxShadow: "0 0 0 4px rgba(140, 29, 43,.08)",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: ".04em",
                  }}
                >
                  Yangi korxona arizasi
                </Typography>
              </Box>

              <Typography
                component="h1"
                sx={{
                  m: 0,
                  color: "var(--aa-text)",
                  fontSize: {
                    xs: 33,
                    sm: 42,
                  },
                  lineHeight: 1.08,
                  fontFamily: "var(--aa-display)",
                  fontWeight: 400,
                  letterSpacing: "-0.045em",
                }}
              >
                Ro‘yxatdan o‘tish
              </Typography>

              <Typography
                sx={{
                  mt: 1.4,
                  color: "#7d716a",
                  fontSize: {
                    xs: 14,
                    sm: 15.5,
                  },
                  lineHeight: 1.65,
                  fontWeight: 500,
                }}
              >
                Korxona va bo‘lajak bosh administrator ma’lumotlarini to‘ldiring.
              </Typography>
            </Box>

            {submissionNotice && (
              <Alert
                severity={submissionNotice.severity}
                sx={{
                  mb: 1,
                  py: 0.25,
                  borderRadius: "14px",
                  fontSize: 12,
                  fontWeight: 600,

                  "& .MuiAlert-message": { py: 0.5 },
                }}
              >
                {submissionNotice.message}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Box
                className="auth-register-fields"
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1.8,
                }}
              >
                <TextField
                  fullWidth
                  label="Korxona nomi"
                  autoComplete="organization"
                  error={Boolean(errors.company_name)}
                  helperText={
                    errors.company_name?.message || "Platformada ko‘rinadigan to‘liq nom."
                  }
                  {...register("company_name", {
                    required: "Korxona nomi majburiy",
                    maxLength: {
                      value: 150,
                      message: "Korxona nomi 150 belgidan oshmasin",
                    },
                  })}
                  sx={fieldSx}
                />

                {/* Korxona kodi */}
                <TextField
                  fullWidth
                  label="Korxona kodi"
                  placeholder="Masalan: alamin"
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
                  sx={fieldSx}
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

              {!submissionNotice && (
                <Box
                  className="auth-register-assurance"
                  sx={{
                    mt: 2.5,
                    p: 1.7,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.4,
                    borderRadius: "15px",
                    border: "1px solid rgba(78, 156, 107,.12)",
                    background:
                      "linear-gradient(135deg,rgba(78, 156, 107,.055),var(--aa-surface-elevated))",
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
                      color: "#2f6b45",
                      fontSize: 15,
                      fontWeight: 700,
                      backgroundColor: "rgba(78, 156, 107,.10)",
                    }}
                  >
                    ✓
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        color: "#241d1a",
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      Xavfsiz ro‘yxatdan o‘tish
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.35,
                        color: "#7d716a",
                        fontSize: 11,
                        lineHeight: 1.45,
                      }}
                    >
                      Ma’lumotlaringiz faqat korxona tizimida ishlatiladi.
                    </Typography>
                  </Box>
                </Box>
              )}

              <Button
                className="auth-register-submit"
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !isValid}
                sx={{
                  ...primaryButtonSx,
                  mt: 2.5,
                }}
              >
                {loading ? "Ariza yuborilmoqda..." : "Arizani yuborish"}
              </Button>
            </form>

            <Box
              className="auth-register-account"
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
                  color: "#7d716a",
                  fontSize: 13.5,
                  fontWeight: 600,
                }}
              >
                Hisobingiz bormi?
              </Typography>

              <Link
                to="/login"
                style={{
                  color: "#6e1622",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Tizimga kirish
              </Link>
            </Box>

            <Typography
              className="auth-register-copyright"
              sx={{
                mt: 3,
                color: "#a0a7b2",
                fontSize: 11,
                textAlign: "center",
              }}
            >
              © {new Date().getFullYear()} Al-Amin CRM. Barcha huquqlar himoyalangan.
            </Typography>

            <FounderCredit sx={{ mt: 1.4 }} />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
