import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import SiteLogo from "../../images/zerr_02_logo.png";
import api from "../../api/axios";
import { getCompanySlug, setCompanySlug } from "../../utils/company";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      phone: "",
      password: "",
      confirm_password: "",
      company_slug: getCompanySlug(),
    },
  });

  const password = watch("password");
  const companySlug = watch("company_slug");
  const isMainCompany = companySlug === "zerrshoes";
  const companyTitle = isMainCompany
    ? "Al-amin CRM"
    : companySlug
      ? companySlug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "Korxona CRM";

  const onSubmit = async (submittedValues) => {
    const { company_slug, ...values } = submittedValues;
    delete values.confirm_password;
    setLoading(true);

    try {
      const companySlug = setCompanySlug(company_slug);
      await api.post(
        "/users",
        {
          ...values,
          phone: values.phone || null,
        },
        {
          baseURL: `${String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api/${companySlug}`,
        },
      );

      toast.success("Ro'yxatdan o'tdingiz. Endi tizimga kiring.");
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Ro'yxatdan o'tishda xato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <Box className="mx-auto flex min-h-[calc(100vh-48px)] max-w-6xl items-center">
        <Paper
          elevation={0}
          className="auth-shell grid w-full overflow-hidden lg:grid-cols-[1fr_1fr]"
        >
          <Box className="auth-hero hidden min-h-175 flex-col justify-between p-10 text-white lg:flex">
            <Box>
              <Box className="mb-10 flex items-center gap-3">
                <Box className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white">
                  {isMainCompany ? (
                    <img width={40} src={SiteLogo} alt={companyTitle} />
                  ) : (
                    <Typography fontWeight={900}>{companyTitle[0]}</Typography>
                  )}
                </Box>
                <Box>
                  <Typography fontWeight={900} className="text-xl leading-tight">
                    {companyTitle}
                  </Typography>
                  <Typography className="text-sm text-slate-300">Korxona CRM</Typography>
                </Box>
              </Box>

              <Typography variant="h3" fontWeight={900} className="max-w-xl leading-tight">
                Ro'yxatdan o'ting va CRM hisobingizni yarating.
              </Typography>
              <Typography className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                Yangi foydalanuvchi avtomatik xaridor ruxsati bilan yaratiladi. Keyinchalik
                administrator zarur bo'lsa ruxsat turini o'zgartiradi.
              </Typography>
            </Box>

            <Box className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <Typography fontWeight={800}>Administrator</Typography>
              <Typography className="mt-1 text-slate-300">
                Savollar uchun: +998 91 571 70 09
              </Typography>
            </Box>
          </Box>

          <Box className="auth-form-panel flex min-h-175 items-center justify-center p-6 sm:p-10">
            <Box className="w-full max-w-lg">
              <Box className="mb-8 flex items-center gap-3 lg:hidden">
                <Box className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                  {isMainCompany ? (
                    <img width={34} src={SiteLogo} alt={companyTitle} />
                  ) : (
                    <Typography fontWeight={900}>{companyTitle[0]}</Typography>
                  )}
                </Box>
                <Box>
                  <Typography fontWeight={900} className="text-slate-950">
                    {companyTitle}
                  </Typography>
                  <Typography variant="body2" className="text-slate-500">
                    Korxona CRM
                  </Typography>
                </Box>
              </Box>

              <Box className="mb-7">
                <Typography variant="h4" fontWeight={900} className="text-slate-950">
                  Ro'yxatdan o'tish
                </Typography>
                <Typography className="mt-2 text-slate-500">
                  Ma'lumotlarni kiriting. Hisob xaridor ruxsati bilan ochiladi.
                </Typography>
              </Box>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    fullWidth
                    label="Korxona kodi"
                    error={Boolean(errors.company_slug)}
                    helperText={errors.company_slug?.message}
                    {...register("company_slug", {
                      required: "Korxona kodi majburiy",
                      pattern: {
                        value: /^[a-z0-9-]+$/,
                        message: "Faqat kichik harf, raqam va chiziqcha",
                      },
                    })}
                  />
                  <TextField
                    fullWidth
                    label="Ism"
                    error={Boolean(errors.first_name)}
                    helperText={errors.first_name?.message}
                    {...register("first_name", {
                      required: "Ism majburiy",
                      maxLength: {
                        value: 50,
                        message: "Ism 50 belgidan oshmasin",
                      },
                    })}
                  />
                  <TextField
                    fullWidth
                    label="Familiya"
                    error={Boolean(errors.last_name)}
                    helperText={errors.last_name?.message}
                    {...register("last_name", {
                      required: "Familiya majburiy",
                      maxLength: {
                        value: 50,
                        message: "Familiya 50 belgidan oshmasin",
                      },
                    })}
                  />
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
                  />
                  <TextField
                    fullWidth
                    label="Telefon"
                    placeholder="+998..."
                    error={Boolean(errors.phone)}
                    helperText={errors.phone?.message}
                    {...register("phone", {
                      maxLength: {
                        value: 30,
                        message: "Telefon 30 belgidan oshmasin",
                      },
                    })}
                  />
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
                        message: "Parol kamida 6 belgi bo'lsin",
                      },
                      maxLength: {
                        value: 100,
                        message: "Parol 100 belgidan oshmasin",
                      },
                    })}
                  />
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
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    py: 1.25,
                    borderRadius: 2,
                    backgroundColor: "#7F1D1D",
                    boxShadow: "none",
                    fontWeight: 800,
                    "&:hover": {
                      backgroundColor: "#991B1B",
                      boxShadow: "none",
                    },
                  }}
                >
                  {loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
                </Button>
              </form>

              <Box className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Box className="auth-info-card rounded-2xl border p-4">
                  <Typography variant="body2" className="font-semibold text-slate-900">
                    Administrator
                  </Typography>
                  <Typography variant="body2" className="mt-1 text-slate-500">
                    Savollar bo'lsa bog'laning.
                  </Typography>
                  <Typography variant="body2" className="mt-3 font-bold text-red-900">
                    +998 91 571 70 09
                  </Typography>
                </Box>

                <Box className="auth-info-card accent rounded-2xl border p-4">
                  <Typography variant="body2" className="font-semibold text-slate-900">
                    Hisobingiz bormi?
                  </Typography>
                  <Typography variant="body2" className="mt-1 text-slate-500">
                    Tizimga kirish sahifasiga o'ting.
                  </Typography>
                  <Link
                    className="mt-3 inline-flex rounded-xl bg-red-900 px-3 py-2 text-sm font-bold text-white"
                    to="/login"
                  >
                    Tizimga kirish
                  </Link>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Register;
