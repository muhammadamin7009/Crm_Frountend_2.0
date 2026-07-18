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

import { setSession } from "../../utils/auth";
import { useAuth } from "../../Context/AuthContext";
import SiteLogo from "../../images/zerr_02_logo.png";
import api from "../../api/axios";
import {
  getCompanyLogoUrl,
  getCompanySlug,
  normalizeCompanySlug,
  setCompanySlug,
} from "../../utils/company";
import { getCompanyBranding } from "../../api/companyBranding";
import AuthBrandPanel from "../../Components/Auth/AuthBrandPanel";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [setupResult, setSetupResult] = useState(null);
  const [branding, setBranding] = useState(null);

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
  const isMainCompany = companySlug === "zerrshoes";
  const companyTitle =
    branding?.name ||
    (isMainCompany
      ? "Al-amin CRM"
      : companySlug
        ? companySlug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
        : "Korxona CRM");
  const companyLogo = getCompanyLogoUrl(branding?.logo_url) || (isMainCompany ? SiteLogo : "");

  useEffect(() => {
    const slug = normalizeCompanySlug(companySlug);
    if (!slug) {
      setBranding(null);
      return undefined;
    }
    const timeout = setTimeout(async () => {
      try {
        const { data } = await getCompanyBranding(slug);
        setBranding(data.company || null);
      } catch {
        setBranding(null);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [companySlug]);

  const finishLogin = (data) => {
    setSession({ token: data.token, user: data.user });
    setUser(data.user);
    toast.success("Muvaffaqiyatli tizimga kirdingiz");
    navigate("/");
  };

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      const companySlug = setCompanySlug(values.company_slug);
      const { data } = await api.post(
        "/users/login",
        {
          username: values.username,
          password: values.password,
          device_id: localStorage.getItem("device_id") || undefined,
        },
        {
          baseURL: `${String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api/${companySlug}`,
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
      (!challenge.setup_required && /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(normalizedCode));
    if (!validCode) return toast.error("6 xonali kod yoki tiklash kodini kiriting.");
    setLoading(true);
    try {
      const companySlug = setCompanySlug(watch("company_slug"));
      const { data } = await api.post(
        "/users/login/verify",
        { challenge_id: challenge.challenge_id, code: normalizedCode },
        {
          baseURL: `${String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "")}/api/${companySlug}`,
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
      toast.error(error?.response?.data?.message || "Tasdiqlash kodi noto'g'ri.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <Box className="mx-auto flex min-h-[calc(100vh-48px)] max-w-370 items-center">
        <Paper
          elevation={0}
          className="auth-shell grid w-full overflow-hidden lg:grid-cols-[1fr_1.05fr]"
        >
          <AuthBrandPanel />

          <Box className="hidden">
            <Box>
              <Box className="mb-10 flex items-center gap-3">
                <Box className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white">
                  {companyLogo ? (
                    <img
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain"
                      src={companyLogo}
                      alt={companyTitle}
                    />
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

          <Box className="auth-form-panel flex min-h-180 items-center justify-center p-6 sm:p-10 lg:p-14">
            <Box className="w-full max-w-lg">
              <Box className="mb-8 flex items-center gap-3 lg:hidden">
                <Box className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                  {companyLogo ? (
                    <img
                      width={34}
                      height={34}
                      className="h-8.5 w-8.5 object-contain"
                      src={companyLogo}
                      alt={companyTitle}
                    />
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
                  {setupResult
                    ? "Tiklash kodlarini saqlang"
                    : challenge?.setup_required
                      ? "Authenticator'ni sozlash"
                      : challenge
                        ? "Kirishni tasdiqlash"
                        : "Xush kelibsiz! 👋"}
                </Typography>
                <Typography className="mt-2 text-slate-500">
                  {setupResult
                    ? "Bu kodlar telefon yo'qolsa hisobga kirish uchun kerak. Ular boshqa ko'rsatilmaydi."
                    : challenge?.setup_required
                      ? "QR-kodni Google Authenticator bilan skanerlang va ilovadagi 6 xonali kodni kiriting."
                      : challenge
                        ? "Google Authenticator'dagi 6 xonali kodni kiriting."
                        : "Davom etish uchun foydalanuvchi nomi va parolingizni kiriting."}
                </Typography>
              </Box>

              {setupResult ? (
                <Box className="space-y-4">
                  <Box className="grid grid-cols-2 gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:grid-cols-4">
                    {setupResult.recovery_codes.map((recoveryCode) => (
                      <Typography
                        key={recoveryCode}
                        component="code"
                        className="rounded-lg bg-white px-2 py-2 text-center font-bold text-slate-900"
                      >
                        {recoveryCode}
                      </Typography>
                    ))}
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(setupResult.recovery_codes.join("\n"));
                        toast.success("Tiklash kodlari nusxalandi.");
                      } catch {
                        toast.error("Kodlarni nusxalab bo'lmadi. Ularni qo'lda saqlang.");
                      }
                    }}
                  >
                    Kodlarni nusxalash
                  </Button>
                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    className="auth-primary-button"
                    onClick={() => finishLogin(setupResult)}
                  >
                    Saqladim, tizimga kirish
                  </Button>
                </Box>
              ) : challenge ? (
                <Box className="space-y-4">
                  {challenge.setup_required && (
                    <Box className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <img
                        src={challenge.qr_code_data_url}
                        alt="Google Authenticator QR-kodi"
                        className="mx-auto h-56 w-56 max-w-full rounded-xl bg-white p-2"
                      />
                      <Typography variant="body2" className="text-slate-600">
                        QR-kod skanerlanmasa, ilovada &quot;Sozlash kalitini kiriting&quot;ni tanlab
                        quyidagi kalitni kiriting:
                      </Typography>
                      <Typography
                        component="code"
                        className="block break-all rounded-lg bg-white px-3 py-2 font-bold tracking-wider text-slate-900"
                      >
                        {challenge.manual_key}
                      </Typography>
                      <Button
                        size="small"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(challenge.manual_key);
                            toast.success("Sozlash kaliti nusxalandi.");
                          } catch {
                            toast.error("Kalitni nusxalab bo'lmadi. Uni qo'lda kiriting.");
                          }
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
                    onKeyDown={(event) => event.key === "Enter" && verifyCode()}
                    inputProps={{
                      inputMode: challenge.setup_required ? "numeric" : "text",
                      maxLength: challenge.setup_required ? 6 : 9,
                    }}
                  />
                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    className="auth-primary-button"
                    disabled={
                      loading ||
                      !(challenge.setup_required
                        ? /^\d{6}$/.test(code)
                        : /^\d{6}$/.test(code) || /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code))
                    }
                    onClick={verifyCode}
                  >
                    {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => {
                      setChallenge(null);
                      setCode("");
                    }}
                  >
                    Kirish ma'lumotlariga qaytish
                  </Button>
                </Box>
              ) : (
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
                      label="Foydalanuvchi nomi"
                      autoComplete="username"
                      error={Boolean(errors.username)}
                      helperText={errors.username?.message}
                      {...register("username", {
                        required: "Foydalanuvchi nomi majburiy",
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
                      className="auth-primary-button"
                      disabled={loading}
                    >
                      {loading ? "Kirilmoqda..." : "Kirish"}
                    </Button>
                  </Box>
                </form>
              )}

              <Box className="hidden">
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

              {!challenge && !setupResult && (
                <Box className="mt-8 text-center">
                  <Typography component="span" className="text-sm font-medium text-slate-500">
                    Hisobingiz yo'qmi?{" "}
                  </Typography>
                  <Link className="text-sm font-black text-red-800 hover:text-red-700" to="/register">
                    Ro'yxatdan o'tish
                  </Link>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
