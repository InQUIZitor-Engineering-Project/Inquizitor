import React, { createContext, useContext, useState, type ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import baseTheme from "../styles/theme";

type FontSize = "small" | "medium" | "large";
type ColorTheme = "default" | "eye-friendly" | "dark";

interface PersonalizationContextType {
  fontSize: FontSize;
  colorTheme: ColorTheme;
  setFontSize: (size: FontSize) => void;
  setColorTheme: (theme: ColorTheme) => void;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error("usePersonalization must be used within a PersonalizationProvider");
  }
  return context;
};

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

  const getAdjustedTheme = (): any => {
    let theme = { ...baseTheme };

    // Adjust Font Size
    const sizeMultiplier = fontSize === "small" ? 0.9 : fontSize === "large" ? 1.2 : 1;
    
    const adjustTypography = (typography: any) => {
      const newTypography = JSON.parse(JSON.stringify(typography));
      Object.keys(newTypography.heading).forEach(key => {
        const size = parseInt(newTypography.heading[key].fontSize);
        newTypography.heading[key].fontSize = `${Math.round(size * sizeMultiplier)}px`;
        const line = parseInt(newTypography.heading[key].lineHeight);
        newTypography.heading[key].lineHeight = `${Math.round(line * sizeMultiplier)}px`;
      });
      Object.keys(newTypography.body).forEach(weight => {
        Object.keys(newTypography.body[weight]).forEach(key => {
          const size = parseInt(newTypography.body[weight][key].fontSize);
          newTypography.body[weight][key].fontSize = `${Math.round(size * sizeMultiplier)}px`;
          const line = parseInt(newTypography.body[weight][key].lineHeight);
          newTypography.body[weight][key].lineHeight = `${Math.round(line * sizeMultiplier)}px`;
        });
      });
      return newTypography;
    };

    theme.typography = adjustTypography(theme.typography);

    // Adjust Color Theme
    theme.colorTheme = colorTheme; // Add this line
    if (colorTheme === "eye-friendly") {
      theme.colors = {
        ...theme.colors,
        neutral: {
          ...theme.colors.neutral,
          white: "#fdf6e3", // Sepia-like background for components
          silver: "#eee8d5", // Sepia-like background for page
          greyBlue: "#93a1a1",
          lGrey: "#839496",
          grey: "#657b83",
          dGrey: "#586e75",
          black: "#073642",
        },
        brand: {
          ...theme.colors.brand,
          primary: "#859900", // Solarized Green
          secondary: "#268bd2", // Solarized Blue
        },
        tint: {
          ...theme.colors.tint,
          t5: "#eee8d5", // Same as silver for hover/active
        }
      };
      theme.tone = {
        ...theme.tone,
        default: "#586e75",
        inverted: "#fdf6e3",
      };
      theme.shadows = {
        ...theme.shadows,
        "2px": "0px 2px 4px 0px rgba(147, 161, 161, 0.4)",
        "4px": "0px 4px 8px 0px rgba(147, 161, 161, 0.3)",
      };
    } else if (colorTheme === "dark") {
      theme.colors = {
        ...theme.colors,
        neutral: {
          ...theme.colors.neutral,
          white: "#1e1e1e", // Dark background for components
          silver: "#121212", // Dark background for page
          greyBlue: "#333333",
          lGrey: "#a0a0a0",
          grey: "#cccccc",
          dGrey: "#e0e0e0",
          black: "#ffffff",
        },
        brand: {
          ...theme.colors.brand,
          primary: "#66bb6a",
          secondary: "#90caf9",
        },
        tint: {
          ...theme.colors.tint,
          t1: "#2e7d32",
          t2: "#388e3c",
          t3: "#43a047",
          t4: "#4caf50",
          t5: "#2d2d2d", // Darker tint for hover states
        }
      };
      theme.tone = {
        ...theme.tone,
        default: "#e0e0e0",
        inverted: "#1e1e1e",
      };
      theme.shadows = {
        ...theme.shadows,
        "2px": "0px 2px 4px 0px rgba(0, 0, 0, 0.5)",
        "4px": "0px 4px 8px 0px rgba(0, 0, 0, 0.6)",
      };
    }

    return theme;
  };

  return (
    <PersonalizationContext.Provider value={{ fontSize, colorTheme, setFontSize, setColorTheme }}>
      <ThemeProvider theme={getAdjustedTheme()}>
        {children}
      </ThemeProvider>
    </PersonalizationContext.Provider>
  );
};
