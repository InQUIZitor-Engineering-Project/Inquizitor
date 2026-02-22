import type { ThemePalette } from "./types";

export const lightPalette: ThemePalette = {
  colors: {
    neutral: {
      white: "#ffffff",
      silver: "#f5f7fa",
      greyBlue: "#abbed1",
      lGrey: "#89939e",
      grey: "#717171",
      dGrey: "#4d4d4d",
      black: "#263238",
      whiteStroke: "#abbed1",
    },
    brand: {
      info: "#2194f3",
      secondary: "#263238",
      primary: "#4caf4f",
    },
    shade: {
      s1: "#43a046",
      s2: "#388e3b",
      s3: "#237d31",
      s5: "#103e13",
    },
    tint: {
      t1: "#66bb69",
      t2: "#81c784",
      t3: "#a5d6a7",
      t4: "#c8e6c9",
      t5: "#e8f5e9",
    },
    action: {
      success: "#2e7d31",
      error: "#e53835",
      warning: "#fbc02d",
    },
    danger: {
      main: "#c62828",
      bg: "rgba(244, 67, 54, 0.08)",
      border: "rgba(244, 67, 54, 0.3)",
      hover: "rgba(244, 67, 54, 0.16)",
      shadow: "rgba(244, 67, 54, 0.18)",
    },
  },
  tone: {
    default: "#4d4d4d",
    muted: "#717171",
    subtle: "#89939e",
    inverted: "#ffffff",
    info: "#2194f3",
    success: "#2e7d31",
    warning: "#fbc02d",
    danger: "#c62828",
  },
  shadows: {
    "2px": "0px 2px 4px 0px rgba(171, 189, 209, 0.6)",
    "4px": "0px 4px 8px 0px rgba(171, 189, 209, 0.4)",
    "6px": "0px 6px 12px 0px rgba(171, 189, 209, 0.3)",
    "8px": "0px 8px 16px 0px rgba(171, 189, 209, 0.4)",
    "16px": "0px 16px 32px 0px rgba(171, 189, 209, 0.3)",
  },
  elevation: {
    sm: "0px 2px 4px 0px rgba(171, 189, 209, 0.6)",
    md: "0px 4px 8px 0px rgba(171, 189, 209, 0.4)",
    lg: "0px 6px 12px 0px rgba(171, 189, 209, 0.3)",
    xl: "0px 8px 16px 0px rgba(171, 189, 209, 0.4)",
    "2xl": "0px 16px 32px 0px rgba(171, 189, 209, 0.3)",
  },
};
