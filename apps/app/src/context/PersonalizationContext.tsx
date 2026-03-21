import React, { createContext, useState, useMemo, type ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { getTheme, applyTypography, type ColorThemeMode } from "../styles/theme";
import { ThemeSync } from "./ThemeSync";

export type FontSize = "small" | "medium" | "large";
export type ColorTheme = ColorThemeMode;

export interface PersonalizationContextType {
  fontSize: FontSize;
  colorTheme: ColorTheme;
  setFontSize: (size: FontSize) => void;
  setColorTheme: (theme: ColorTheme) => void;
}

export const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

interface PersonalizationProviderProps {
  children: ReactNode;
}

export const PersonalizationProvider: React.FC<PersonalizationProviderProps> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>(
    (localStorage.getItem("fontSize") as FontSize) || "medium"
  );
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(
    (localStorage.getItem("colorTheme") as ColorTheme) || "default"
  );

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("fontSize", size);
  };

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem("colorTheme", theme);
  };

  const theme = useMemo(() => {
    const base = getTheme(colorTheme);
    return applyTypography(base, fontSize);
  }, [colorTheme, fontSize]);

  return (
    <PersonalizationContext.Provider value={{ fontSize, colorTheme, setFontSize, setColorTheme }}>
      <ThemeProvider theme={theme}>
        <ThemeSync />
        {children}
      </ThemeProvider>
    </PersonalizationContext.Provider>
  );
};
