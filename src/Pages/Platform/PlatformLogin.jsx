import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { platformLogin } from "../../api/platform";

const PlatformLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data } = await platformLogin(form);
      localStorage.setItem("platform_token", data.token);
      localStorage.setItem("platform_admin", JSON.stringify(data.admin));
      navigate("/platform", { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Kirishda xato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-page flex min-h-screen items-center justify-center p-4 sm:p-6">
      <Paper
        elevation={0}
        className="auth-shell grid w-full max-w-4xl overflow-hidden md:grid-cols-[0.9fr_1.1fr]"
        sx={{ borderRadius: 2 }}
      >
        <Box className="auth-hero flex min-h-64 flex-col justify-between p-7 text-white sm:p-9">
          <Box>
            <Box className="mb-8 flex h-11 w-11 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-lg font-black">
              Z
            </Box>
            <Typography variant="h4" fontWeight={900} color="inherit">
              CRM Platform
            </Typography>
            <Typography className="mt-3 max-w-sm text-red-100">
              Korxonalar, obunalar va to'lovlarni yagona boshqaruv markazida nazorat qiling.
            </Typography>
          </Box>

          <Box className="mt-10 grid grid-cols-3 gap-3 border-t border-white/20 pt-5">
            <Box>
              <Typography fontWeight={800}>Korxonalar</Typography>
              <Typography variant="caption" className="text-red-100">
                Bitta ro'yxatda
              </Typography>
            </Box>
            <Box>
              <Typography fontWeight={800}>Obunalar</Typography>
              <Typography variant="caption" className="text-red-100">
                Aniq nazorat
              </Typography>
            </Box>
            <Box>
              <Typography fontWeight={800}>Tushum</Typography>
              <Typography variant="caption" className="text-red-100">
                Jami hisob
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box className="flex items-center p-7 sm:p-10 md:p-12">
          <Box className="w-full">
            <Typography variant="overline" className="font-bold text-red-900">
              Platform administratori
            </Typography>
            <Typography variant="h4" fontWeight={900} className="mt-1 text-slate-950">
              Tizimga kirish
            </Typography>
            <Typography className="mt-2 text-slate-500">
              Boshqaruv paneliga kirish uchun ma'lumotlaringizni kiriting.
            </Typography>

            <Box component="form" onSubmit={submit} className="mt-8 grid gap-4">
              <TextField
                name="username"
                label="Foydalanuvchi nomi"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
                required
                fullWidth
              />
              <TextField
                name="password"
                type="password"
                label="Parol"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                className="mt-2"
                sx={{ minHeight: 48, bgcolor: "#7f1d1d", "&:hover": { bgcolor: "#991b1b" } }}
              >
                {loading ? "Kirilmoqda..." : "Kirish"}
              </Button>
            </Box>

            <Typography variant="body2" className="mt-6 text-center text-slate-400">
              Ushbu sahifa faqat platforma boshqaruvchilari uchun.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PlatformLogin;
