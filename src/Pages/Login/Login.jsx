import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { setSession } from "../../utils/auth";
import { useAuth } from "../../Context/AuthContext";
import SiteLogo from "../../images/zerr_02_logo.png";
import api from "../../api/axios";
import { getCompanySlug, setCompanySlug } from "../../utils/company";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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

  const { setUser } = useAuth();
  const companySlug = watch("company_slug");
  const isZerrShoes = companySlug === "zerrshoes";
  const companyTitle = isZerrShoes
    ? "Zerr Shoes"
    : companySlug
      ? companySlug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "Korxona CRM";

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      const companySlug = setCompanySlug(values.company_slug);
      const { data } = await api.post(
        "/users/login",
        {
          username: values.username,
          password: values.password,
        },
        {
          baseURL: `${String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api/${companySlug}`,
        },
      );

      setSession({
        token: data.token,
        user: data.user,
      });

      setUser(data.user);

      toast.success("Muvaffaqiyatli tizimga kirdingiz");
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login xato");
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
                  {isZerrShoes ? (
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
                Ishlab chiqarish, oylik va mahsulotlarni bir joydan boshqaring.
              </Typography>

              <Typography className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                Hodimlar, mahsulotlar, bo'lim ishlari va ish haqi hisob-kitobi tartibli ko'rinadi.
                CRM ichida har bir yozuv nazoratda.
              </Typography>
            </Box>

            <Box className="grid grid-cols-3 gap-3">
              <Box className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Typography className="text-sm text-slate-300">Hodimlar</Typography>
                <Typography variant="h6" fontWeight={900}>
                  Ruxsat nazorati
                </Typography>
              </Box>
              <Box className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Typography className="text-sm text-slate-300">Ishlar</Typography>
                <Typography variant="h6" fontWeight={900}>
                  Kunlik hisob
                </Typography>
              </Box>
              <Box className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Typography className="text-sm text-slate-300">Oylik</Typography>
                <Typography variant="h6" fontWeight={900}>
                  Balans
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box className="auth-form-panel flex min-h-175 items-center justify-center p-6 sm:p-10">
            <Box className="w-full max-w-lg">
              <Box className="mb-8 flex items-center gap-3 lg:hidden">
                <Box className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                  {isZerrShoes ? (
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
                  Tizimga kirish
                </Typography>
                <Typography className="mt-2 text-slate-500">
                  Davom etish uchun username va parolingizni kiriting.
                </Typography>
              </Box>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Box className="space-y-4">
                  <TextField
                    fullWidth
                    label="Korxona kodi"
                    autoComplete="organization"
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
                    label="Username"
                    autoComplete="username"
                    error={Boolean(errors.username)}
                    helperText={errors.username?.message}
                    {...register("username", {
                      required: "Username majburiy",
                    })}
                    sx={{ marginBottom: "12px", marginTop: "12px" }}
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
                  />

                  <Box className="flex items-center justify-between gap-3">
                    <FormControlLabel
                      control={<Checkbox size="small" />}
                      label={
                        <Typography variant="body2" className="text-slate-600">
                          Eslab qolish
                        </Typography>
                      }
                    />
                    <Typography variant="body2" className="text-slate-500">
                      Xavfsiz kirish
                    </Typography>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
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
                    {loading ? "Kirilmoqda..." : "Kirish"}
                  </Button>
                </Box>
              </form>

              <Box className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Box className="auth-info-card rounded-2xl border p-4">
                  <Typography variant="body2" className="font-semibold text-slate-900">
                    Yordam kerakmi?
                  </Typography>
                  <Typography variant="body2" className="mt-1 text-slate-500">
                    Administrator bilan bog'laning.
                  </Typography>
                  <Typography variant="body2" className="mt-3 font-bold text-red-900">
                    +998 91 571 70 09
                  </Typography>
                </Box>

                <Box className="auth-info-card accent rounded-2xl border p-4">
                  <Typography variant="body2" className="font-semibold text-slate-900">
                    Hisobingiz yo'qmi?
                  </Typography>
                  <Typography variant="body2" className="mt-1 text-slate-500">
                    Yangi hisob ochish mumkin.
                  </Typography>
                  <Link
                    className="mt-3 inline-flex rounded-xl bg-red-900 px-3 py-2 text-sm font-bold text-white"
                    to="/register"
                  >
                    Ro'yxatdan o'tish
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

export default Login;
