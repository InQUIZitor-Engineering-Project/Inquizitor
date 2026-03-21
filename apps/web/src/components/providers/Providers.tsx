"use client";
import { ThemeProvider } from "styled-components";
import { getTheme, GlobalStyles } from "@inquizitor/ui";

const theme = getTheme("default");

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      {children}
    </ThemeProvider>
  );
}
