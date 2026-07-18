import { Paper } from "@mui/material";

const AppCard = ({ children, sx, ...props }) => (
  <Paper
    elevation={0}
    {...props}
    sx={{
      border: "1px solid var(--aa-border)",
      borderRadius: "var(--aa-radius-xl)",
      background: "var(--aa-surface)",
      boxShadow: "var(--aa-shadow-sm)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export default AppCard;
