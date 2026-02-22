import { useEffect } from "react";
import { useTheme } from "styled-components";

/**
 * Syncs current styled-components theme to CSS custom properties on :root.
 * Enables global styles (e.g. body in App.css) and var(--color-*) usages
 * to stay in sync with the active color mode (light / dark / eye-friendly).
 */
export function ThemeSync() {
  const theme = useTheme() as {
    colors?: {
      neutral?: { silver?: string; white?: string };
      danger?: { main?: string };
    };
  };

  useEffect(() => {
    const root = document.documentElement;
    if (!theme?.colors) return;

    root.style.setProperty(
      "--surface-page",
      theme.colors.neutral?.silver ?? "#f5f7fa"
    );
    root.style.setProperty(
      "--color-neutral-white",
      theme.colors.neutral?.white ?? "#ffffff"
    );
    root.style.setProperty(
      "--color-danger-main",
      theme.colors.danger?.main ?? "#c62828"
    );
  }, [theme]);

  return null;
}
