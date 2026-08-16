/**
 * Ombor sahifasining uslublari.
 *
 * Sahifa kodidan ajratildi: bu obyektlarda mantiq yo'q va ular kodni
 * ikkiga bo'lib turardi.
 */

const surfaceCardSx = {
  overflow: "hidden",
  borderRadius: "22px",
  border: "1px solid #e8e1d8",
  background: "var(--aa-surface-solid)",
  boxShadow: "0 14px 40px rgba(23, 17, 15,.045)",
};

const tableSx = {
  "& th": {
    py: 1.55,
    color: "var(--aa-text-tertiary)",
    fontSize: 9.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".045em",
    background: "var(--aa-surface-muted)",
    borderBottom: "1px solid #e8e1d8",
  },

  "& td": {
    py: 1.4,
    color: "var(--aa-text-secondary)",
    fontSize: 10.5,
    borderBottom: "1px solid #e8e1d8",
  },

  "& tbody tr:hover": {
    background: "rgba(110, 22, 34,.025)",
  },
};

const dialogPaperSx = {
  overflow: "hidden",
  borderRadius: "23px",

  border: "1px solid rgba(138, 128, 122,.20)",

  boxShadow: "0 30px 80px rgba(23, 17, 15,.22)",
};

const dialogTitleSx = {
  px: 3,
  py: 2.35,

  color: "#ffffff !important",

  fontSize: 18,
  fontWeight: 700,

  backgroundColor: "#151211 !important",

  backgroundImage:
    "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.28),transparent 36%),linear-gradient(135deg,#151211,#2a1117) !important",
};

const dialogContentSx = {
  px: 3,
  py: "24px !important",
};

const dialogActionsSx = {
  px: 3,
  py: 2.1,

  borderTop: "1px solid #e8e1d8",

  background: "var(--aa-surface-muted)",
};

const primaryButtonSx = {
  minHeight: 40,
  px: 2,
  color: "#ffffff",
  borderRadius: "11px",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",

  background: "linear-gradient(135deg,#4d0f18,#7a1826)",

  boxShadow: "0 10px 24px rgba(77, 15, 24,.18)",

  "&:hover": {
    background: "linear-gradient(135deg,#4d0f18,#6e1622)",
  },
};

const secondaryButtonSx = {
  minHeight: 40,
  px: 1.8,
  color: "var(--aa-text-secondary)",
  borderRadius: "11px",
  borderColor: "#d8cec1",
  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",
  backgroundColor: "var(--aa-surface-solid)",

  "&:hover": {
    color: "#6e1622",

    borderColor: "rgba(110, 22, 34,.22)",

    backgroundColor: "rgba(110, 22, 34,.04)",
  },
};

const tableActionSx = {
  minHeight: 30,
  borderRadius: "9px",
  fontSize: 9.5,
  fontWeight: 700,
  textTransform: "none",
};

const heroPrimaryButtonSx = {
  minHeight: 43,
  px: 2.2,

  color: "#ffffff !important",

  borderRadius: "13px",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "none",

  background: "linear-gradient(135deg,#6e1622,#8c1d2b)",

  boxShadow: "0 12px 26px rgba(77, 15, 24,.30)",

  "&:hover": {
    background: "linear-gradient(135deg,#4d0f18,#7a1826)",
  },
};

const heroSecondaryButtonSx = {
  minHeight: 43,
  px: 1.9,

  color: "rgba(255,255,255,.72) !important",

  borderRadius: "13px",

  border: "1px solid rgba(255,255,255,.10)",

  backgroundColor: "rgba(255,255,255,.055)",

  fontSize: 10.5,
  fontWeight: 700,
  textTransform: "none",

  "&:hover": {
    backgroundColor: "rgba(255,255,255,.10)",
  },
};

export {
  dialogActionsSx,
  dialogContentSx,
  dialogPaperSx,
  dialogTitleSx,
  heroPrimaryButtonSx,
  heroSecondaryButtonSx,
  primaryButtonSx,
  secondaryButtonSx,
  surfaceCardSx,
  tableActionSx,
  tableSx,
};
