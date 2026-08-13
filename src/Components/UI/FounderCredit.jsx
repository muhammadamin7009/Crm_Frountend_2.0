import { Box, Typography } from "@mui/material";

/**
 * Asoschi imzosi.
 *
 * Faqat vitrinada — landing va kirish sahifalarida. Ilova ichiga qo'yilmaydi:
 * u yerda mijoz o'z logotipi bilan ishlaydi va har sahifada boshqa ismni
 * ko'rish "bu bizning tizimimiz" hissini susaytiradi.
 *
 * Ko'rinishi kitob oxiridagi nashriyot imzosidek: mayda katta harflar, keng
 * oraliq va ikki yonida guruch chiziq.
 */
const FounderCredit = ({ tone = "light", sx }) => {
  const isDark = tone === "dark";

  const rule = isDark ? "rgba(201,168,117,.45)" : "rgba(169,129,75,.4)";
  const text = isDark ? "#d9b782" : "#a9814b";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.6,
        ...sx,
      }}
    >
      <Box sx={{ width: 22, height: "1px", flex: "0 0 auto", backgroundColor: rule }} />

      <Typography
        sx={{
          color: text,
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: ".17em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        Asoschi Muhammadamin Rustamov
      </Typography>

      <Box sx={{ width: 22, height: "1px", flex: "0 0 auto", backgroundColor: rule }} />
    </Box>
  );
};

export default FounderCredit;
