import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

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
        border: "1px solid rgba(148,163,184,.20)",
        boxShadow: "0 30px 80px rgba(15,23,42,.22)",
      },
    }}
  >
    <DialogTitle
      className={titleClassName}
      sx={{
        px: 3,
        py: 2.35,
        color: "#ffffff !important",
        backgroundColor: "#0d1117 !important",
        backgroundImage:
          "radial-gradient(circle at 100% 0%,rgba(220,38,38,.28),transparent 36%),linear-gradient(135deg,#11151c,#321319) !important",
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
          borderTop: "1px solid #edf0f3",
          backgroundColor: "#fafbfc",
          ...actionsSx,
        }}
      >
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

export default PremiumDialog;
