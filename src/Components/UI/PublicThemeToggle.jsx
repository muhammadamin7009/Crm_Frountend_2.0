import { IconButton, Tooltip } from "@mui/material";

import { useThemeMode } from "../../Context/ThemeContext";

const PublicThemeToggle = () => {
  const { mode, toggleTheme } = useThemeMode();
  const isDark = mode === "dark";
  const label = isDark ? "Yorug‘ rejimni yoqish" : "Qorong‘i rejimni yoqish";

  return (
    <Tooltip title={label}>
      <IconButton className="aa-public-theme-toggle" aria-label={label} onClick={toggleTheme}>
        <span className="aa-public-theme-icon" aria-hidden="true">
          {isDark ? "☀" : "☾"}
        </span>
      </IconButton>
    </Tooltip>
  );
};

export default PublicThemeToggle;
