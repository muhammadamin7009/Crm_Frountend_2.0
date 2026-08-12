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
          fontSize: { xs: 22, md: 32 },
          fontWeight: 850,
          letterSpacing: "-.04em",
          lineHeight: 1.08,
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
