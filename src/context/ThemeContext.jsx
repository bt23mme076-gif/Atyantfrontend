import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "atyant-theme";
const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {}, setTheme: () => {} });

/** Read the initial theme: saved choice → OS preference → dark. */
function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* ignore */ }
  // Default to the current look (dark). Flip the next line to respect OS instead.
  return "dark";
}

/** Apply the theme to <html> so both Tailwind `dark:` variants and our CSS vars react. */
function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme; // native form controls / scrollbars
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Keep <html> + storage in sync whenever the theme changes.
  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = useCallback((t) => setThemeState(t === "light" ? "light" : "dark"), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Drop-in theme toggle button. Inherits the surrounding color via `currentColor`,
 * so it looks right in both the inline-styled app shell and Tailwind pages.
 */
export function ThemeToggle({ size = 16, className = "", style = {} }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        background: "transparent",
        border: "1px solid var(--c-cardBorder)",
        color: "var(--c-textSub)",
        borderRadius: 10,
        padding: 8,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--c-text)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--c-textSub)"; }}
    >
      {isDark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
}

export default ThemeContext;
