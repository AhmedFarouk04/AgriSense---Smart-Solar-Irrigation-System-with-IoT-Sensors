import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "forest";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("app-theme") as Theme) || "dark";
  });

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    if (theme === "forest") {
      document.body.classList.add("theme-forest");
    } else {
      document.body.classList.remove("theme-forest");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
