import type { ThemePalette } from "./types";

/**
 * Dark mode palette – full set of colors, tones, shadows and elevation
 * so that all components (cards, modals, inputs) look correct in dark mode.
 */
export const darkPalette: ThemePalette = {
  colors: {
    neutral: {
      white: "#1e1e1e",
      silver: "#121212",
      greyBlue: "#333333",
      lGrey: "#a0a0a0",
      grey: "#cccccc",
      dGrey: "#e0e0e0",
      black: "#ffffff",
      whiteStroke: "#333333",
    },
    brand: {
      info: "#64b5f6",
      secondary: "#90caf9",
      primary: "#66bb6a",
    },
    shade: {
      s1: "#43a047",
      s2: "#388e3c",
      s3: "#2e7d32",
      s5: "#1b5e20",
    },
    tint: {
      t1: "#2e7d32",
      t2: "#388e3c",
      t3: "#43a047",
      t4: "#4caf50",
      t5: "#2d2d2d",
    },
    action: {
      success: "#81c784",
      error: "#e57373",
      warning: "#ffb74d",
    },
    danger: {
      main: "#ef5350",
      bg: "rgba(244, 67, 54, 0.16)",
      border: "rgba(244, 67, 54, 0.4)",
      hover: "rgba(244, 67, 54, 0.24)",
      shadow: "rgba(244, 67, 54, 0.25)",
    },
  },
  tone: {
    default: "#e0e0e0",
    muted: "#b0b0b0",
    subtle: "#a0a0a0",
    inverted: "#1e1e1e",
    info: "#64b5f6",
    success: "#81c784",
    warning: "#ffb74d",
    danger: "#ef5350",
  },
  shadows: {
    "2px": "0px 2px 4px 0px rgba(0, 0, 0, 0.5)",
    "4px": "0px 4px 8px 0px rgba(0, 0, 0, 0.55)",
    "6px": "0px 6px 12px 0px rgba(0, 0, 0, 0.5)",
    "8px": "0px 8px 16px 0px rgba(0, 0, 0, 0.55)",
    "16px": "0px 16px 32px 0px rgba(0, 0, 0, 0.5)",
  },
  elevation: {
    sm: "0px 2px 4px 0px rgba(0, 0, 0, 0.5)",
    md: "0px 4px 8px 0px rgba(0, 0, 0, 0.55)",
    lg: "0px 6px 12px 0px rgba(0, 0, 0, 0.5)",
    xl: "0px 8px 16px 0px rgba(0, 0, 0, 0.55)",
    "2xl": "0px 16px 32px 0px rgba(0, 0, 0, 0.5)",
  },
};
