import { Box, Typography } from "@mui/material";

const PageHeader = ({ eyebrow, title, description, actions }) => (
  <Box
    className="crm-simple-page-header"
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: { xs: 1.2, md: 2 },
    }}
  >
    <Box>
      {eyebrow && (
        <Typography
          sx={{
            mb: 0.7,
            color: "var(--aa-brand-text)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".09em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </Typography>
      )}
      {/* Sahifa sarlavhasi antiqa shriftda. Ierarxiya og'irlikdan emas,
          shrift OILASIDAN keladi: yonidagi yorliqlar grotesk, sarlavha esa
          antiqa — farq darrov ko'zga tashlanadi. */}
      <Typography
        component="h1"
        sx={{
          color: "var(--aa-text)",
          fontFamily: "var(--aa-display)",
          fontSize: { xs: 25, md: 36 },
          fontWeight: 400,
          letterSpacing: "-.022em",
          lineHeight: 1.12,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          sx={{
            mt: 0.8,
            display: { xs: "none", sm: "block" },
            color: "var(--aa-text-secondary)",
            fontSize: 14,
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={{ flexShrink: 0, width: "auto" }}>{actions}</Box>}
  </Box>
);

export default PageHeader;
