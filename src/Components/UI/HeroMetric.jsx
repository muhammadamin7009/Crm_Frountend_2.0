import { Box, Typography } from "@mui/material";

const toneStyles = {
  red: ["#fecdd3", "rgba(220,38,38,.15)", "rgba(248,113,113,.15)"],
  green: ["#bbf7d0", "rgba(34,197,94,.14)", "rgba(74,222,128,.15)"],
  blue: ["#bfdbfe", "rgba(37,99,235,.15)", "rgba(96,165,250,.15)"],
  amber: ["#fde68a", "rgba(245,158,11,.15)", "rgba(251,191,36,.15)"],
  violet: ["#ddd6fe", "rgba(139,92,246,.16)", "rgba(167,139,250,.15)"],
  gray: ["#e2e8f0", "rgba(148,163,184,.14)", "rgba(203,213,225,.13)"],
};

const softToneBorders = {
  red: "rgba(248,113,113,.14)",
  green: "rgba(74,222,128,.14)",
  blue: "rgba(96,165,250,.14)",
  amber: "rgba(251,191,36,.14)",
};

const HeroMetric = ({
  label,
  value,
  helper,
  tone = "red",
  softToneBorder = false,
  labelSx,
  valueSx,
  helperSx,
  onClick,
}) => {
  const current = toneStyles[tone] || toneStyles.red;
  const toneBorder = softToneBorder ? softToneBorders[tone] || softToneBorders.red : current[2];

  return (
    <Box
      className="aa-mobile-compact-metric"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick(event);
        }
      }}
      sx={{
        minWidth: 0,
        minHeight: 126,
        p: 1.8,
        borderRadius: "18px",
        border: "1px solid rgba(255,255,255,.075)",
        background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",
        backdropFilter: "blur(16px)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform .18s ease, border-color .18s ease, background-color .18s ease",
        "&:hover": onClick
          ? {
              transform: "translateY(-2px)",
              borderColor: current[2],
              backgroundColor: "rgba(255,255,255,.075)",
            }
          : undefined,
        "&:focus-visible": onClick
          ? {
              outline: `3px solid ${current[2]}`,
              outlineOffset: 2,
            }
          : undefined,
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          display: "grid",
          placeItems: "center",
          borderRadius: "11px",
          color: current[0],
          backgroundColor: current[1],
          border: `1px solid ${toneBorder}`,
          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.35,
          color: "rgba(255,255,255,.44) !important",
          fontSize: 9.5,
          fontWeight: 750,
          ...labelSx,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.6,
          color: "#ffffff !important",
          fontSize: 18,
          lineHeight: 1.2,
          fontWeight: 950,
          letterSpacing: "-.035em",
          ...valueSx,
        }}
      >
        {value}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.55,
          color: "rgba(255,255,255,.28) !important",
          fontSize: 9,
          ...helperSx,
        }}
      >
        {helper}
      </Typography>
    </Box>
  );
};

export default HeroMetric;
