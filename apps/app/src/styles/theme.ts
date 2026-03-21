/**
 * Legacy entry point – re-exports default (light) theme and shared constants.
 * New code should use getTheme(mode) from "./theme" or "./styles/theme".
 */
import type { DefaultTheme } from "styled-components";
import { getTheme, applyTypography, type ColorThemeMode } from "./theme/index";
import { breakpoints, media, contentWidth, pagePadding } from "./theme/constants";
import type { ThemePalette } from "./theme/types";

const lightTheme: DefaultTheme = getTheme("default");

export default lightTheme;
export { breakpoints, media, contentWidth, pagePadding, getTheme, applyTypography };
export type { DefaultTheme, ThemePalette, ColorThemeMode };
