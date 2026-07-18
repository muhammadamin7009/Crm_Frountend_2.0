import { Box, Typography } from "@mui/material";

const PageHeader = ({ eyebrow, title, description, actions }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: { xs: "flex-start", md: "center" },
      justifyContent: "space-between",
      flexDirection: { xs: "column", md: "row" },
      gap: 2,
    }}
  >
    <Box>
      {eyebrow && (
        <Typography
          sx={{
            mb: 0.7,
            color: "var(--aa-brand-700)",
            fontSize: 11,
            fontWeight: 850,
            letterSpacing: ".09em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography
        component="h1"
        sx={{
          color: "var(--aa-text)",
          fontSize: { xs: 26, md: 32 },
          fontWeight: 850,
          letterSpacing: "-.04em",
          lineHeight: 1.08,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography sx={{ mt: 0.8, color: "var(--aa-text-secondary)", fontSize: 14 }}>
          {description}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={{ width: { xs: "100%", md: "auto" } }}>{actions}</Box>}
  </Box>
);

export default PageHeader;
