import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { PersonalizationProvider } from "./context/PersonalizationContext";
import { GlobalStyles } from "./styles/GlobalStyles";
import { LoaderProvider } from "./components/Loader/GlobalLoader";
import { PostHogProvider } from "./PostHogProvider";


const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <PostHogProvider>
      <PersonalizationProvider>
        <GlobalStyles />
        <LoaderProvider>
          <App />
        </LoaderProvider>
      </PersonalizationProvider>
    </PostHogProvider>
  </React.StrictMode>
);
