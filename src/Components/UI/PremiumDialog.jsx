import { DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { CompatDialog as Dialog } from "./MuiCompat";

const PremiumDialog = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = "sm",
  titleClassName,
  titleSx,
  contentSx,
  actionsSx,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth={maxWidth}
    PaperProps={{
      sx: {
        overflow: "hidden",
        borderRadius: "23px",
        border: "1px solid rgba(138, 128, 122,.20)",
        boxShadow: "0 30px 80px rgba(23, 17, 15,.22)",
      },
    }}
  >
    <DialogTitle
      className={titleClassName}
      sx={{
        px: 3,
        py: 2.35,
        color: "#ffffff !important",
        backgroundColor: "#151211 !important",
        backgroundImage:
          "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.28),transparent 36%),linear-gradient(135deg,#151211,#2a1117) !important",
        ...titleSx,
      }}
    >
      <Typography
        sx={{
          color: "#ffffff !important",
          fontSize: 19,
          fontWeight: 950,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          mt: 0.5,
          color: "rgba(255,255,255,.43) !important",
          fontSize: 10.5,
        }}
      >
        {subtitle}
      </Typography>
    </DialogTitle>

    <DialogContent
      sx={{
        px: 3,
        py: 2.7,
        ...contentSx,
      }}
    >
      {children}
    </DialogContent>

    {actions && (
      <DialogActions
        sx={{
          px: 3,
          py: 2.1,
          borderTop: "1px solid var(--aa-border)",
          backgroundColor: "var(--aa-surface-muted)",
          ...actionsSx,
        }}
      >
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

export default PremiumDialog;
