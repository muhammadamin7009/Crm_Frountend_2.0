import { Box, Tooltip } from "@mui/material";

/**
 * Besh yulduzli baho.
 *
 * Loyihada ikonka kutubxonasi yo'q, shuning uchun yulduz belgining o'zi
 * bilan chiziladi — u har qanday shriftda bir xil ko'rinadi va hech
 * qanday tashqi faylga bog'lanmaydi.
 */
const StarRating = ({ value = 0, onChange = null, size = 22, labels = null }) => {
  const readOnly = !onChange;
  const filled = Math.round(Number(value) || 0);

  return (
    <Box sx={{ display: "inline-flex", gap: 0.25, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const on = star <= filled;
        const item = (
          <Box
            key={star}
            component={readOnly ? "span" : "button"}
            type={readOnly ? undefined : "button"}
            aria-label={readOnly ? undefined : `${star} ball`}
            onClick={readOnly ? undefined : () => onChange(star)}
            sx={{
              fontSize: size,
              lineHeight: 1,
              padding: 0,
              border: "none",
              background: "none",
              cursor: readOnly ? "default" : "pointer",
              color: on ? "var(--aa-brass, #a9814b)" : "var(--aa-border)",
              transition: "color .15s, transform .1s",
              "&:hover": readOnly ? undefined : { transform: "scale(1.15)" },
              "&:focus-visible": {
                outline: "2px solid var(--aa-brass, #a9814b)",
                outlineOffset: 2,
                borderRadius: 4,
              },
            }}
          >
            ★
          </Box>
        );

        if (readOnly || !labels?.[star]) return item;
        return (
          <Tooltip key={star} title={labels[star]} placement="top">
            {item}
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default StarRating;
