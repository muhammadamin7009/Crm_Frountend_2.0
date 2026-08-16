/**
 * Xomashyo xaridi sahifasining uslublari.
 *
 * Sahifa kodidan ajratildi: bu obyektlarda mantiq yo'q, lekin ular faylning
 * uchdan birini egallab, kodni o'qishni qiyinlashtirardi.
 */

const eyebrowSx = {
  color: "#d9b782 !important",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".13em",
  textTransform: "uppercase",
};

const heroTitleSx = {
  mt: 1.5,
  color: "#ffffff !important",

  fontSize: {
    xs: 29,
    md: 36,
  },

  lineHeight: 1.08,
  fontWeight: 700,
  letterSpacing: "-.045em",
};

const heroDescriptionSx = {
  maxWidth: 555,
  mt: 1.4,

  color: "rgba(255,255,255,.45) !important",

  fontSize: 12.5,
  lineHeight: 1.75,
};

const heroSx = {
  position: "relative",
  isolation: "isolate",
  mb: 2,

  p: {
    xs: 2.5,
    md: 3,
  },

  overflow: "hidden",
  color: "#ffffff",
  borderRadius: "25px",

  border: "1px solid rgba(255,255,255,.075)",

  backgroundColor: "#151211 !important",

  backgroundImage:
    "radial-gradient(circle at 100% 0%,rgba(140, 29, 43,.34),transparent 30%),linear-gradient(145deg,#151211,#1e1a18 52%,#3a1219) !important",

  boxShadow: "0 24px 60px rgba(23, 17, 15,.20)",

  flexShrink: 0,

  "&::before": {
    content: '""',
    position: "absolute",
    width: 390,
    height: 390,
    top: -275,
    right: -210,
    borderRadius: "50%",

    border: "1px solid rgba(201, 168, 117,.16)",

    boxShadow: "0 0 81px 22px rgba(201, 168, 117,.022),0 0 161px 43px rgba(201, 168, 117,.014)",

    pointerEvents: "none",
  },
};

const heroPrimaryButtonSx = {
  minHeight: 43,
  px: 2.2,
  color: "#ffffff !important",
  borderRadius: "13px",
  fontSize: 11.5,
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
  px: 2,

  color: "rgba(255,255,255,.72) !important",

  borderRadius: "13px",

  border: "1px solid rgba(255,255,255,.10)",

  backgroundColor: "rgba(255,255,255,.055)",

  fontSize: 11,
  fontWeight: 700,
  textTransform: "none",

  "&:hover": {
    backgroundColor: "rgba(255,255,255,.10)",
  },
};

const filterButtonSx = {
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

const tableHeaderBoxSx = {
  px: 2.4,
  py: 1.9,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,

  borderBottom: "1px solid #e8e1d8",
};

const countChipSx = {
  height: 25,
  color: "#6e1622",
  fontSize: 9.5,
  fontWeight: 700,

  backgroundColor: "rgba(110, 22, 34,.07)",
};

const softBlueChipSx = {
  height: 25,
  color: "#1f6f8b",
  fontSize: 9.5,
  fontWeight: 700,

  backgroundColor: "rgba(31, 111, 139,.08)",

  border: "1px solid rgba(31, 111, 139,.16)",
};

const softGreenChipSx = {
  height: 25,
  color: "#2f6b45",
  fontSize: 9.5,
  fontWeight: 700,

  backgroundColor: "rgba(78, 156, 107,.08)",

  border: "1px solid rgba(78, 156, 107,.16)",
};

const stockCardSx = {
  position: "relative",
  overflow: "hidden",
  p: 1.5,
  borderRadius: "17px",

  border: "1px solid #e8e1d8",

  background: "linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",

  "&::after": {
    content: '""',
    position: "absolute",
    width: 100,
    height: 100,
    top: -58,
    right: -46,
    borderRadius: "50%",

    backgroundColor: "rgba(110, 22, 34,.045)",
  },
};

const tinyLabelSx = {
  color: "var(--aa-text-tertiary)",
  fontSize: 8.8,
  fontWeight: 600,
};

const greenValueSx = {
  mt: 0.4,
  color: "#2f6b45",
  fontSize: 10,
  fontWeight: 700,
};

const darkValueSx = {
  mt: 0.4,
  color: "var(--aa-text-secondary)",
  fontSize: 10,
  fontWeight: 700,
};

const emptyStateSx = {
  minHeight: 110,
  display: "grid",
  placeItems: "center",
  borderRadius: "17px",

  border: "1px dashed #d8cec1",

  backgroundColor: "var(--aa-surface-muted)",
};

const emptyTextSx = {
  color: "var(--aa-text-tertiary)",
  fontSize: 11,
  fontWeight: 600,
};

const tableActionSx = {
  borderRadius: "9px",
  fontSize: 9.5,
  fontWeight: 700,
  textTransform: "none",
};

const tableSx = {
  minWidth: 1080,

  "& th": {
    py: 1.55,
    color: "var(--aa-text-tertiary)",
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: ".045em",
    textTransform: "uppercase",

    backgroundColor: "var(--aa-surface-muted)",

    borderColor: "#e8e1d8",
  },

  "& td": {
    py: 1.4,
    color: "var(--aa-text-secondary)",
    fontSize: 10.5,
    borderColor: "#e8e1d8",
  },

  "& tbody tr:hover": {
    backgroundColor: "rgba(110, 22, 34,.025)",
  },
};

const supplierTableSx = {
  minWidth: 800,

  "& th": {
    py: 1.45,
    color: "var(--aa-text-tertiary)",
    fontSize: 9.5,
    fontWeight: 700,
    textTransform: "uppercase",

    backgroundColor: "var(--aa-surface-muted)",
  },

  "& td": {
    py: 1.35,
    color: "var(--aa-text-secondary)",
    fontSize: 10.5,
    borderColor: "#e8e1d8",
  },
};

const dialogSectionSx = {
  p: 2,
  borderRadius: "18px",

  border: "1px solid #e8e1d8",

  background: "linear-gradient(145deg,var(--aa-surface-solid),var(--aa-surface-muted))",
};

const purchaseItemRowSx = {
  display: "grid",

  gridTemplateColumns: {
    xs: "1fr",

    md: "1.45fr 1fr 1fr auto",
  },

  gap: 1.3,
  p: 1.4,
  borderRadius: "16px",
  backgroundColor: "var(--aa-surface-solid)",

  border: "1px solid #e8e1d8",
};

const removeButtonSx = {
  borderRadius: "11px",
  fontSize: 9.5,
  fontWeight: 600,
  textTransform: "none",
};

const addRowSx = {
  alignSelf: "flex-start",
  minHeight: 40,
  px: 2,
  borderRadius: "12px",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "none",
  borderColor: "var(--aa-border-strong)",
  color: "var(--aa-text-secondary)",
};

const quickMaterialBoxSx = {
  display: "grid",

  gridTemplateColumns: {
    xs: "1fr",

    sm: "1.5fr 1fr auto auto",
  },

  gap: 1.3,
  p: 1.6,
  borderRadius: "18px",
  backgroundColor: "var(--aa-surface-muted)",

  border: "1px solid #d8cec1",
};

const balanceGridSx = {
  display: "grid",

  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2,1fr)",
    lg: "repeat(4,1fr)",
  },

  gap: 1.2,
  p: 1.5,
  borderRadius: "18px",
  backgroundColor: "var(--aa-surface-muted)",

  border: "1px solid #e8e1d8",
};

const dialogCancelSx = {
  color: "var(--aa-text-secondary)",
  borderRadius: "11px",
  fontWeight: 600,
  textTransform: "none",
};

const dialogPrimarySx = {
  minWidth: 110,
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

const deleteButtonSx = {
  minWidth: 110,
  borderRadius: "11px",
  fontWeight: 700,
  textTransform: "none",
};

const confirmTextSx = {
  color: "var(--aa-text-secondary)",
  fontSize: 12.5,
  fontWeight: 700,
  lineHeight: 1.7,
};

const materialPurchasesStyles = `
  .crm-page .material-purchases-hero {
    color: #ffffff !important;
    background-color: #151211 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(140, 29, 43,.34),
        transparent 30%
      ),
      linear-gradient(
        145deg,
        #151211,
        #1e1a18 52%,
        #3a1219
      ) !important;
  }

  .material-purchases-dialog-title {
    color: #ffffff !important;
    background-color: #151211 !important;
    background-image:
      radial-gradient(
        circle at 100% 0%,
        rgba(140, 29, 43,.28),
        transparent 36%
      ),
      linear-gradient(
        135deg,
        #151211,
        #2a1117
      ) !important;
  }
`;

export {
  addRowSx,
  balanceGridSx,
  confirmTextSx,
  countChipSx,
  darkValueSx,
  deleteButtonSx,
  dialogCancelSx,
  dialogPrimarySx,
  dialogSectionSx,
  emptyStateSx,
  emptyTextSx,
  eyebrowSx,
  filterButtonSx,
  greenValueSx,
  heroDescriptionSx,
  heroPrimaryButtonSx,
  heroSecondaryButtonSx,
  heroSx,
  heroTitleSx,
  materialPurchasesStyles,
  primaryButtonSx,
  purchaseItemRowSx,
  quickMaterialBoxSx,
  removeButtonSx,
  softBlueChipSx,
  softGreenChipSx,
  stockCardSx,
  supplierTableSx,
  tableActionSx,
  tableHeaderBoxSx,
  tableSx,
  tinyLabelSx,
};
