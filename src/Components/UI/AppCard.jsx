import { Paper } from "@mui/material";

const AppCard = ({ children, sx, ...props }) => (
  <Paper
    elevation={0}
    {...props}
    sx={{
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid var(--aa-border)",
      backgroundColor: "var(--aa-surface-solid)",
      boxShadow: "0 14px 40px rgba(23, 17, 15,.045)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export default AppCard;
