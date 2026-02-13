"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

// Types
interface ThemeContextType {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with "light" to match server render and avoid hydration mismatch.
  // The inline <script> in layout.tsx already adds the "dark" class to <html> before
  // paint, so there's no flash. useEffect below syncs state after hydration.
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  // Set theme from localStorage or system preference
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
      setHtmlClass(saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setThemeState(initialTheme);
      setHtmlClass(initialTheme);
    }
  }, []);

  // Helper to set <html> class
  const setHtmlClass = (t: "light" | "dark") => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", t === "dark");
    }
  };

  // Change theme
  const setTheme = (t: "light" | "dark") => {
    setThemeState(t);
    setHtmlClass(t);
    localStorage.setItem("theme", t);
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
