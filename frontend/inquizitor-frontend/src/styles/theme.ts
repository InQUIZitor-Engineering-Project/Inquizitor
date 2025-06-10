import type { DefaultTheme } from "styled-components";

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
  },
  shadows: {
    "2px": "0px 2px 4px 0px rgba(171, 189, 209, 0.6)",   
    "4px": "0px 4px 8px 0px rgba(171, 189, 209, 0.4)",   
    "6px": "0px 6px 12px 0px rgba(171, 189, 209, 0.3)",  
    "8px": "0px 8px 16px 0px rgba(171, 189, 209, 0.4)", 
    "16px": "0px 16px 32px 0px rgba(171, 189, 209, 0.3)",
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
};

export default theme;
