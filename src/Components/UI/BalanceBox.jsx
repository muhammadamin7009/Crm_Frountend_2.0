import { Box, Typography } from "@mui/material";

const compactTones = {
  default: ["var(--aa-text)", "var(--aa-surface-solid)", "var(--aa-border)"],
  green: ["#2f6b45", "rgba(78, 156, 107,.07)", "rgba(78, 156, 107,.17)"],
  red: ["#6e1622", "rgba(110, 22, 34,.07)", "rgba(110, 22, 34,.16)"],
  blue: ["#1f6f8b", "rgba(31, 111, 139,.07)", "rgba(31, 111, 139,.17)"],
  amber: ["#a06a12", "rgba(160, 106, 18,.09)", "rgba(160, 106, 18,.19)"],
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
          background: "var(--aa-surface-solid)",
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
          color: "var(--aa-text-tertiary)",
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
