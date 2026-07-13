import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/context/theme-provider";
import { ThemeCustomizationProvider } from "@/context/theme-customization-provider";
import App from "./App";
import "./i18n/config";
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount: number, error: any) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) return false;
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ThemeCustomizationProvider>
          <App />
        </ThemeCustomizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
