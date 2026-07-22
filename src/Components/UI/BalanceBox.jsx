import { Box, Typography } from "@mui/material";

const compactTones = {
  default: ["#334155", "#ffffff", "#e7ebf0"],
  green: ["#15803d", "rgba(34,197,94,.07)", "rgba(34,197,94,.17)"],
  red: ["#991b1b", "rgba(153,27,27,.07)", "rgba(153,27,27,.16)"],
  blue: ["#1d4ed8", "rgba(37,99,235,.07)", "rgba(37,99,235,.17)"],
  amber: ["#b45309", "rgba(245,158,11,.09)", "rgba(245,158,11,.19)"],
};

const surfaceColors = {
  default: "var(--aa-text)",
  blue: "var(--aa-info)",
  green: "var(--aa-success)",
  red: "var(--aa-brand-800)",
  orange: "var(--aa-warning)",
};

const BalanceBox = ({ label, value, tone = "default", variant = "compact" }) => {
  if (variant === "surface") {
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: "var(--aa-radius-lg)",
          background: "#fff",
          border: "1px solid var(--aa-border)",
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 800,
            color: "var(--aa-text-tertiary)",
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 0.45,
            fontSize: 15,
            fontWeight: 850,
            color: surfaceColors[tone] || surfaceColors.default,
            letterSpacing: "-0.035em",
          }}
        >
          {value}
        </Typography>
      </Box>
    );
  }

  const current = compactTones[tone] || compactTones.default;

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.5,
        borderRadius: "15px",
        backgroundColor: current[1],
        border: `1px solid ${current[2]}`,
      }}
    >
      <Typography
        sx={{
          color: "#94a3b8",
          fontSize: 9.5,
          fontWeight: 800,
        }}
      >
        {label}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.55,
          color: current[0],
          fontSize: 13,
          fontWeight: 950,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

export default BalanceBox;
