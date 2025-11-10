import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { ThemeProvider } from "styled-components";
import theme from "./styles/theme";
import { GlobalStyles } from "./styles/GlobalStyles";
import { LoaderProvider } from "./components/Loader/GlobalLoader";


const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <LoaderProvider>
        <App />
      </LoaderProvider>
    </ThemeProvider>
  </React.StrictMode>
);
