import type { DefaultTheme } from "styled-components";
import {
  breakpoints,
  media,
  contentWidth,
  pagePadding,
  spacing,
  radii,
  grid,
  baseTypography,
} from "./constants";
import type { ThemePalette } from "./types";
import { lightPalette } from "./light";
import { darkPalette } from "./dark";
import { eyeFriendlyPalette } from "./eyeFriendly";

export type ColorThemeMode = "default" | "eye-friendly" | "dark";

function buildTheme(palette: ThemePalette): Omit<DefaultTheme, "colorTheme"> {
  return {
    colors: palette.colors,
    tone: palette.tone,
    shadows: palette.shadows,
    elevation: palette.elevation,
    spacing,
    radii,
    typography: JSON.parse(JSON.stringify(baseTypography)),
    grid,
    breakpoints,
    media,
    contentWidth,
    pagePadding,
  };
}

/**
 * Returns the full theme for the given color mode (no typography scaling).
 */
export function getTheme(mode: ColorThemeMode): DefaultTheme {
  const palette =
    mode === "dark"
      ? darkPalette
      : mode === "eye-friendly"
        ? eyeFriendlyPalette
        : lightPalette;
  const theme = buildTheme(palette) as DefaultTheme;
  theme.colorTheme = mode;
  return theme;
}

/**
 * Applies font-size scaling to the theme's typography and returns a new theme.
 * Does not mutate the input theme. Preserves non-JSON-serializable refs (e.g. media functions).
 */
export function applyTypography(
  theme: DefaultTheme,
  fontSize: "small" | "medium" | "large"
): DefaultTheme {
  const sizeMultiplier = fontSize === "small" ? 0.9 : fontSize === "large" ? 1.2 : 1;
  const next = JSON.parse(JSON.stringify(theme)) as DefaultTheme;
  const t = next.typography;

  Object.keys(t.heading).forEach((key) => {
    const h = t.heading[key as keyof typeof t.heading];
    const size = parseInt(h.fontSize, 10);
    const line = parseInt(h.lineHeight, 10);
    h.fontSize = `${Math.round(size * sizeMultiplier)}px`;
    h.lineHeight = `${Math.round(line * sizeMultiplier)}px`;
  });

  (Object.keys(t.body) as Array<keyof typeof t.body>).forEach((weight) => {
    Object.keys(t.body[weight]).forEach((key) => {
      const b = t.body[weight][key as keyof (typeof t.body)[typeof weight]];
      const size = parseInt(b.fontSize, 10);
      const line = parseInt(b.lineHeight, 10);
      b.fontSize = `${Math.round(size * sizeMultiplier)}px`;
      b.lineHeight = `${Math.round(line * sizeMultiplier)}px`;
    });
  });

  // JSON.stringify drops functions; restore theme.media (and any other refs)
  next.media = theme.media;
  next.breakpoints = theme.breakpoints;
  next.contentWidth = theme.contentWidth;
  next.pagePadding = theme.pagePadding;

  return next;
}

// Re-export for consumers that import from theme (e.g. theme.ts)
export { lightPalette, darkPalette, eyeFriendlyPalette };
export {
  breakpoints,
  media,
  contentWidth,
  pagePadding,
  spacing,
  radii,
  grid,
  baseTypography,
} from "./constants";
export type { ThemePalette } from "./types";
