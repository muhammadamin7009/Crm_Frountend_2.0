import { Paper } from "@mui/material";

const AppCard = ({ children, sx, ...props }) => (
  <Paper
    elevation={0}
    {...props}
    sx={{
      overflow: "hidden",
      borderRadius: "22px",
      border: "1px solid #e4e9ef",
      backgroundColor: "#ffffff",
      boxShadow: "0 14px 40px rgba(15,23,42,.045)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export default AppCard;
