/**
 * Shared theme constants – identical across all color modes (light, dark, eye-friendly).
 * Used by theme/light.ts, dark.ts, eyeFriendly.ts.
 */

const breakpoints = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

type BreakpointKey = keyof typeof breakpoints;

export const media = {
  up: (bp: BreakpointKey) => `@media (min-width: ${breakpoints[bp]}px)`,
  down: (bp: BreakpointKey) => `@media (max-width: ${breakpoints[bp]}px)`,
  between: (from: BreakpointKey, to: BreakpointKey) =>
    `@media (min-width: ${breakpoints[from]}px) and (max-width: ${breakpoints[to]}px)`,
} as const;

export const contentWidth = {
  sm: "100%",
  md: "720px",
  lg: "960px",
  xl: "1180px",
} as const;

export const pagePadding = {
  sm: "16px",
  md: "20px",
  lg: "24px",
  xl: "32px",
} as const;

export const spacing = {
  xxs: "4px",
  xs: "8px",
  sm: "12px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
} as const;

export const radii = {
  xs: "4px",
  sm: "8px",
  md: "10px",
  lg: "12px",
  xl: "16px",
  pill: "999px",
  full: "9999px",
} as const;

export const grid = {
  columns: 12,
  gutter: "24px",
  margin: "144px",
} as const;

export const baseTypography = {
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
} as const;

export { breakpoints };
