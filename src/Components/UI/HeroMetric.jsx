import { Box, Typography } from "@mui/material";

const toneStyles = {
  red: ["#d9b782", "rgba(140, 29, 43,.15)", "rgba(201, 168, 117,.15)"],
  green: ["#a8dcbc", "rgba(78, 156, 107,.14)", "rgba(108, 191, 139,.15)"],
  blue: ["#bcd9e2", "rgba(31, 111, 139,.15)", "rgba(107, 179, 201,.15)"],
  amber: ["#e3c98f", "rgba(160, 106, 18,.15)", "rgba(201, 168, 117,.15)"],
  violet: ["#ddd6fe", "rgba(139,92,246,.16)", "rgba(167,139,250,.15)"],
  gray: ["#e8e1d8", "rgba(138, 128, 122,.14)", "rgba(216, 206, 193,.13)"],
};

const softToneBorders = {
  red: "rgba(201, 168, 117,.14)",
  green: "rgba(108, 191, 139,.14)",
  blue: "rgba(107, 179, 201,.14)",
  amber: "rgba(201, 168, 117,.14)",
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
          fontWeight: 700,
        }}
      >
        {label.charAt(0)}
      </Box>

      <Typography
        sx={{
          mt: 1.35,
          color: "rgba(255,255,255,.44) !important",
          fontSize: 9.5,
          fontWeight: 600,
          ...labelSx,
        }}
      >
        {label}
      </Typography>

      {/* Raqam antiqa shriftda — yorliq va izoh grotesk. */}
      <Typography
        noWrap
        sx={{
          mt: 0.7,
          color: "#ffffff !important",
          fontFamily: "var(--aa-display)",
          fontSize: 21,
          lineHeight: 1.15,
          fontWeight: 400,
          letterSpacing: "-.018em",
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
