import { createContext, useContext, useEffect, useState } from "react";

type Theme = "indigo" | "ocean" | "sunset" | "forest" | "cyber" | "rose";
type Mode = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultMode?: Mode;
};

type ThemeProviderState = {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;
};

const initialState: ThemeProviderState = {
  theme: "indigo",
  mode: "light",
  setTheme: () => null,
  setMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "indigo",
  defaultMode = "light",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || defaultTheme
  );
  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem("mode") as Mode) || defaultMode
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("indigo", "ocean", "sunset", "forest", "cyber", "rose");
    
    // Remove dark class
    root.classList.remove("dark");
    
    // Add current theme and mode
    root.classList.add(theme);
    if (mode === "dark") {
      root.classList.add("dark");
    }
  }, [theme, mode]);

  const value = {
    theme,
    mode,
    setTheme: (theme: Theme) => {
      localStorage.setItem("theme", theme);
      setTheme(theme);
    },
    setMode: (mode: Mode) => {
      localStorage.setItem("mode", mode);
      setMode(mode);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
