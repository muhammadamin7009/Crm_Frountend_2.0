import { Box } from "@mui/material";

/**
 * Sonli tanlagich: "Tasdiq kutmoqda 4", "Navbatda 12".
 *
 * Ro'yxatlar uzayib ketganda odam kerakli ishni pastga aylanib qidirardi —
 * bo'lim boshlig'i tasdiq kutayotgan ishga yetish uchun butun tarqatilmagan
 * navbatdan o'tishi kerak edi. Bu yerda bitta bosishda o'tiladi va son
 * qancha ish borligini oldindan aytadi: nol bo'lsa u yerga kirish shart emas.
 *
 * Tanlagich gorizontal aylanadi — telefonda to'rt-besh band bir qatorga
 * sig'maydi, lekin sahifaning o'zi yon tomonga surilib ketmasligi kerak.
 */
const CountTabs = ({ items, value, onChange }) => (
  <Box
    sx={{
      display: "flex",
      gap: 0.8,
      overflowX: "auto",
      pb: 0.5,
      // Aylantirgich chizig'i kartaning ostida turmasin.
      scrollbarWidth: "thin",
      "&::-webkit-scrollbar": { height: 4 },
      "&::-webkit-scrollbar-thumb": {
        borderRadius: 4,
        backgroundColor: "var(--aa-border-strong)",
      },
    }}
  >
    {items.map((item) => {
      const active = item.value === value;
      const count = Number(item.count || 0);

      return (
        <Box
          key={item.value || "all"}
          component="button"
          type="button"
          onClick={() => onChange(item.value)}
          sx={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.7,
            minHeight: 38,
            px: 1.6,
            border: "1px solid",
            borderColor: active ? "var(--aa-brand-800)" : "var(--aa-border)",
            borderRadius: "11px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12,
            fontWeight: 600,
            color: active ? "#ffffff" : "var(--aa-text-secondary)",
            backgroundColor: active ? "var(--aa-brand-800)" : "var(--aa-surface-solid)",
            transition: "background-color .15s ease,border-color .15s ease",
            "&:hover": {
              borderColor: "var(--aa-brand-800)",
            },
          }}
        >
          {item.label}

          <Box
            component="span"
            sx={{
              minWidth: 20,
              px: 0.6,
              borderRadius: "7px",
              fontSize: 11,
              fontWeight: 700,
              // Nol alohida ko'rinadi: "bu yerda ish yo'q" degani.
              color: active ? "#ffffff" : count ? "var(--aa-text)" : "var(--aa-text-tertiary)",
              backgroundColor: active ? "rgba(255,255,255,.20)" : "var(--aa-surface-muted)",
            }}
          >
            {count}
          </Box>
        </Box>
      );
    })}
  </Box>
);

export default CountTabs;
