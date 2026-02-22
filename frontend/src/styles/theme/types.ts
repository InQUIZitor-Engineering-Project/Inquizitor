/**
 * Theme palette – the part that changes per color mode (light / dark / eye-friendly).
 */

export interface ThemePalette {
  colors: {
    neutral: {
      white: string;
      silver: string;
      greyBlue: string;
      lGrey: string;
      grey: string;
      dGrey: string;
      black: string;
      whiteStroke: string;
    };
    brand: {
      info: string;
      secondary: string;
      primary: string;
    };
    shade: { s1: string; s2: string; s3: string; s5: string };
    tint: { t1: string; t2: string; t3: string; t4: string; t5: string };
    action: { success: string; error: string; warning: string };
    danger: {
      main: string;
      bg: string;
      border: string;
      hover: string;
      shadow: string;
    };
  };
  tone: {
    default: string;
    muted: string;
    subtle: string;
    inverted: string;
    info: string;
    success: string;
    warning: string;
    danger: string;
  };
  shadows: {
    "2px": string;
    "4px": string;
    "6px": string;
    "8px": string;
    "16px": string;
  };
  elevation: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
}
