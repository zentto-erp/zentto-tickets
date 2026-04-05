"use client";

import * as React from "react";
import { Suspense } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { SessionProvider, useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import "@/app/globals.css";

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data-toolpad-color-scheme" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#6366F1" },    // Indigo — identidad Zentto Tickets
        secondary: { main: "#10B981" },  // Emerald
        background: { default: "#F8FAFC", paper: "#FFFFFF" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#818CF8" },
        secondary: { main: "#34D399" },
        background: { default: "#0F172A", paper: "#1E293B" },
      },
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
  shape: { borderRadius: 12 },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function Loading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>Zentto Tickets</title>
        <meta name="description" content="Eventos, boletos y experiencias — Zentto" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <InitColorSchemeScript attribute="data-toolpad-color-scheme" />
      </head>
      <body>
        <SessionProvider>
          <CookieSync />
          <QueryClientProvider client={queryClient}>
            <AppRouterCacheProvider>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <Suspense fallback={<Loading />}>
                  {children}
                </Suspense>
              </ThemeProvider>
            </AppRouterCacheProvider>
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

/** Setear cookie HttpOnly zentto_token después del login */
function CookieSync() {
  const { status } = useSession();
  React.useEffect(() => {
    if (status === 'authenticated') {
      fetch('/tickets/api/auth/set-token', { method: 'POST', credentials: 'include' }).catch(() => {});
    }
  }, [status]);
  return null;
}
