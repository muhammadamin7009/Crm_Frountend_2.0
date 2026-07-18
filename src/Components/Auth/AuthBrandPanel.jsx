import { Box, Typography } from "@mui/material";
import MrLogo from "../../images/mr-logo.png";

const defaultHighlights = [
  { value: "Savdo", label: "Mijozlar va tushum" },
  { value: "Ombor", label: "Qoldiq va harakatlar" },
  { value: "Nazorat", label: "Xodimlar va moliya" },
];

export default function AuthBrandPanel({
  eyebrow = "Korxonani boshqarish tizimi",
  title = "Korxonangizni raqamli boshqaruv bilan",
  accent = "rivojlantiring",
  description =
    "Savdo, ombor, ishlab chiqarish, moliya va xodimlar ishini yagona tizimda boshqaring.",
  highlights = defaultHighlights,
}) {
  return (
    <Box className="auth-brand-panel hidden min-h-180 flex-col justify-between p-10 text-white lg:flex xl:p-14">
      <Box>
        <Box className="auth-brand-lockup flex items-center gap-4">
          <Box className="auth-brand-logo flex h-19 w-19 items-center justify-center rounded-[18px] bg-white">
            <img src={MrLogo} alt="Al-Amin CRM" className="h-14.5 w-14.5 object-contain" />
          </Box>
          <Box>
            <Typography className="auth-brand-name text-[28px] font-black leading-tight">
              Al-Amin <span>CRM</span>
            </Typography>
            <Typography className="mt-1.5 text-[15px] font-medium text-white/65">
              {eyebrow}
            </Typography>
          </Box>
        </Box>

        <Box className="mt-20 max-w-140">
          <Typography
            component="h1"
            className="text-[42px] font-black leading-[1.12] tracking-[-0.035em] xl:text-[50px]"
          >
            {title} <span className="auth-brand-accent">{accent}</span>
          </Typography>
          <Typography className="mt-7 max-w-130 text-[17px] font-medium leading-8 text-white/70">
            {description}
          </Typography>
        </Box>
      </Box>

      <Box className="mt-20 flex flex-col items-center gap-2">
        <Box className="auth-highlight-grid grid grid-cols-3 overflow-hidden rounded-[20px] border border-white/10 bg-white/5.5">
          {highlights.map((item) => (
            <Box key={item.value} className="auth-highlight-item px-5 py-5">
              <Box className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/25 text-lg font-black text-red-200">
                {item.value.slice(0, 1)}
              </Box>
              <Typography className="text-[18px] font-black text-white">{item.value}</Typography>
              <Typography className="mt-1 text-xs font-medium leading-5 text-white/55">
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography className="mt-5 text-xs font-semibold tracking-wide text-white/70">
          al-amin.uz · Korxona ma'lumotlari himoyalangan
        </Typography>
      </Box>
    </Box>
  );
}
