import type { DefaultTheme } from "styled-components";

const breakpoints = {
  xl: 1280,
  lg: 1100,
  md: 900,
  sm: 640,
};

const theme: DefaultTheme = {
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
      main: "#c62828", //main color
      bg: "rgba(244, 67, 54, 0.08)", //background
      border: "rgba(244, 67, 54, 0.3)", //border
      hover: "rgba(244, 67, 54, 0.16)", //hover
      shadow: "rgba(244, 67, 54, 0.18)" //box-shadow
    },
  },
  spacing: {
    xxs: "4px",
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
    "3xl": "64px",
  },
  radii: {
    xs: "4px",
    sm: "8px",
    md: "10px",
    lg: "12px",
    xl: "16px",
    pill: "999px",
    full: "9999px",
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
  typography: {
    heading: {
      h1: {
        fontFamily: "Inter, sans-serif",
        fontSize: "64px",
        fontWeight: 600,
        lineHeight: "76px",
      },
      h2: {
        fontFamily: "Inter, sans-serif",
        fontSize: "36px",
        fontWeight: 600,
        lineHeight: "44px",
      },
      h3: {
        fontFamily: "Inter, sans-serif",
        fontSize: "28px",
        fontWeight: 700,
        lineHeight: "36px",
      },
      h4: {
        fontFamily: "Inter, sans-serif",
        fontSize: "20px",
        fontWeight: 600,
        lineHeight: "28px",
      },
    },
    body: {
      regular: {
        body1: {
          fontFamily: "Inter, sans-serif",
          fontSize: "18px",
          fontWeight: 400,
          lineHeight: "28px",
        },
        body2: {
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          fontWeight: 400,
          lineHeight: "24px",
        },
        body3: {
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: "20px",
        },
        body4: {
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
          fontWeight: 400,
          lineHeight: "16px",
        },
      },
      medium: {
        body1: {
          fontFamily: "Inter, sans-serif",
          fontSize: "18px",
          fontWeight: 500,
          lineHeight: "28px",
        },
        body2: {
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
          fontWeight: 500,
          lineHeight: "24px",
        },
        body3: {
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          lineHeight: "20px",
        },
        body4: {
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
          fontWeight: 500,
          lineHeight: "16px",
        },
      },
    },
  },
  grid: {
    columns: 12,
    gutter: "24px",
    margin: "144px",
  },
  breakpoints,
  media: {
    down: (key: keyof typeof breakpoints) => `@media (max-width: ${breakpoints[key]}px)`,
    up: (key: keyof typeof breakpoints) => `@media (min-width: ${breakpoints[key]}px)`,
  },
};

export default theme;
