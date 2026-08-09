import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "al-amin-theme";
const ThemeModeContext = createContext(null);

const getInitialMode = () => {
  const savedMode = localStorage.getItem(STORAGE_KEY);

  if (["light", "dark"].includes(savedMode)) return savedMode;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleTheme: () => setMode((currentMode) => (currentMode === "dark" ? "light" : "dark")),
    }),
    [mode],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#a61717",
            dark: "#7f1d1d",
            light: "#d94b50",
          },
          background: {
            default: mode === "dark" ? "#090a0c" : "#f7f7f8",
            paper: mode === "dark" ? "#121419" : "#ffffff",
          },
          text: {
            primary: mode === "dark" ? "#f8fafc" : "#111827",
            secondary: mode === "dark" ? "#9ca3af" : "#6b7280",
          },
          divider: mode === "dark" ? "rgba(255,255,255,.08)" : "rgba(17,24,39,.09)",
        },
        shape: {
          borderRadius: 14,
        },
        typography: {
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif',
          button: {
            textTransform: "none",
            fontWeight: 800,
          },
        },
        components: {
          MuiButtonBase: {
            defaultProps: {
              disableRipple: true,
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);

  if (!context) throw new Error("useThemeMode ThemeModeProvider ichida ishlatilishi kerak");

  return context;
};
