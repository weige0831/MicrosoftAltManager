import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/context/theme-provider";
import App from "./App";
import { ThemeCustomizationProvider } from "./context/theme-customization-provider";
import "./i18n/config";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ThemeCustomizationProvider>
        <App />
      </ThemeCustomizationProvider>
    </ThemeProvider>
  </StrictMode>,
);
