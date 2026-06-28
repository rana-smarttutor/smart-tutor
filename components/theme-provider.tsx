"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;

    root.classList.remove("dark");
    root.classList.add("light");
    root.dataset.theme = "light";
    root.style.colorScheme = "light";

    window.localStorage.removeItem("theme");
    window.localStorage.removeItem("smart-tutor-theme");
    window.localStorage.removeItem("color-theme");
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        toggleTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}