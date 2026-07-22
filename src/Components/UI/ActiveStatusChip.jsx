import { Chip } from "@mui/material";

const ActiveStatusChip = ({
  active,
  dark = false,
  activeLabel = "Faol",
  inactiveLabel = "Nofaol",
  height = 26,
  px = 0.35,
}) => (
  <Chip
    size="small"
    label={active ? activeLabel : inactiveLabel}
    sx={{
      height,
      px,
      fontSize: 9.5,
      fontWeight: 900,
      color: dark
        ? active
          ? "#bbf7d0 !important"
          : "#fecaca !important"
        : active
          ? "#15803d"
          : "#b91c1c",
      backgroundColor: dark
        ? active
          ? "rgba(34,197,94,.13) !important"
          : "rgba(220,38,38,.13) !important"
        : active
          ? "rgba(34,197,94,.09)"
          : "rgba(220,38,38,.08)",
      border: dark
        ? active
          ? "1px solid rgba(74,222,128,.16)"
          : "1px solid rgba(248,113,113,.16)"
        : active
          ? "1px solid rgba(34,197,94,.18)"
          : "1px solid rgba(220,38,38,.18)",
    }}
  />
);

export default ActiveStatusChip;
