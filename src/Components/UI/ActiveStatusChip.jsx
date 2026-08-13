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
      fontWeight: 700,
      color: dark
        ? active
          ? "#a8dcbc !important"
          : "#ecd9bd !important"
        : active
          ? "#2f6b45"
          : "#7a1826",
      backgroundColor: dark
        ? active
          ? "rgba(78, 156, 107,.13) !important"
          : "rgba(140, 29, 43,.13) !important"
        : active
          ? "rgba(78, 156, 107,.09)"
          : "rgba(140, 29, 43,.08)",
      border: dark
        ? active
          ? "1px solid rgba(108, 191, 139,.16)"
          : "1px solid rgba(201, 168, 117,.16)"
        : active
          ? "1px solid rgba(78, 156, 107,.18)"
          : "1px solid rgba(140, 29, 43,.18)",
    }}
  />
);

export default ActiveStatusChip;
