import type { ThemePalette } from "./types";

/**
 * Eye-friendly (sepia) palette – reduced contrast, warmer tones.
 */
export const eyeFriendlyPalette: ThemePalette = {
  colors: {
    neutral: {
      white: "#fdf6e3",
      silver: "#eee8d5",
      greyBlue: "#93a1a1",
      lGrey: "#839496",
      grey: "#657b83",
      dGrey: "#586e75",
      black: "#073642",
      whiteStroke: "#93a1a1",
    },
    brand: {
      info: "#268bd2",
      secondary: "#268bd2",
      primary: "#859900",
    },
    shade: {
      s1: "#6b8e23",
      s2: "#586e75",
      s3: "#073642",
      s5: "#002b36",
    },
    tint: {
      t1: "#9cad2d",
      t2: "#b4c42d",
      t3: "#c8d44d",
      t4: "#dce46d",
      t5: "#eee8d5",
    },
    action: {
      success: "#2e7d31",
      error: "#dc322f",
      warning: "#b58900",
      warningBg: "rgba(181, 137, 0, 0.18)",
    },
    danger: {
      main: "#dc322f",
      bg: "rgba(220, 50, 47, 0.1)",
      border: "rgba(220, 50, 47, 0.35)",
      hover: "rgba(220, 50, 47, 0.18)",
      shadow: "rgba(220, 50, 47, 0.2)",
    },
  },
  tone: {
    default: "#586e75",
    muted: "#657b83",
    subtle: "#839496",
    inverted: "#fdf6e3",
    info: "#268bd2",
    success: "#859900",
    warning: "#b58900",
    danger: "#dc322f",
  },
  shadows: {
    "2px": "0px 2px 4px 0px rgba(147, 161, 161, 0.4)",
    "4px": "0px 4px 8px 0px rgba(147, 161, 161, 0.3)",
    "6px": "0px 6px 12px 0px rgba(147, 161, 161, 0.25)",
    "8px": "0px 8px 16px 0px rgba(147, 161, 161, 0.3)",
    "16px": "0px 16px 32px 0px rgba(147, 161, 161, 0.25)",
  },
  elevation: {
    sm: "0px 2px 4px 0px rgba(147, 161, 161, 0.4)",
    md: "0px 4px 8px 0px rgba(147, 161, 161, 0.3)",
    lg: "0px 6px 12px 0px rgba(147, 161, 161, 0.25)",
    xl: "0px 8px 16px 0px rgba(147, 161, 161, 0.3)",
    "2xl": "0px 16px 32px 0px rgba(147, 161, 161, 0.25)",
  },
};
