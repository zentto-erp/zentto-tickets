"use client";

import * as React from "react";
import { Suspense, useMemo } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { SessionProvider, useSession } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import "@/app/globals.css";
import theme from "../components/erp/theme";
import OdooLayout from "../components/erp/OdooLayout";
import { LoadingFallback } from "../components/erp/LoadingFallback";

import DashboardIcon from "@mui/icons-material/Dashboard";
import EventIcon from "@mui/icons-material/Event";
import StadiumIcon from "@mui/icons-material/Stadium";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import SyncIcon from "@mui/icons-material/Sync";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function buildAdminNav() {
  return [
    { kind: 'header', title: 'OPERACIONES' },
    { kind: 'page', segment: 'dashboard', title: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
    { kind: 'page', segment: 'eventos', title: 'Eventos', icon: <EventIcon fontSize="small" /> },
    { kind: 'page', segment: 'venues', title: 'Venues', icon: <StadiumIcon fontSize="small" /> },
    { kind: 'page', segment: 'carreras', title: 'Carreras', icon: <DirectionsRunIcon fontSize="small" /> },
    { kind: 'divider' },
    { kind: 'header', title: 'VENTAS' },
    { kind: 'page', segment: 'ordenes', title: 'Ordenes', icon: <ReceiptIcon fontSize="small" /> },
    { kind: 'page', segment: 'boletos', title: 'Boletos', icon: <ConfirmationNumberIcon fontSize="small" /> },
    { kind: 'page', segment: 'scan', title: 'Escaneo', icon: <QrCodeScannerIcon fontSize="small" /> },
    { kind: 'divider' },
    { kind: 'header', title: 'SISTEMA' },
    { kind: 'page', segment: 'sync', title: 'Sincronizacion', icon: <SyncIcon fontSize="small" /> },
    { kind: 'page', segment: 'analytics', title: 'Analytics', icon: <BarChartIcon fontSize="small" /> },
    { kind: 'page', segment: 'configuracion', title: 'Configuracion', icon: <SettingsIcon fontSize="small" /> },
  ];
}

function useIsAdmin() {
  const { data: session } = useSession();
  if (!session) return false;
  const s = session as Record<string, unknown>;
  if (s.isAdmin === true) return true;
  const roles = (s.roles as string[]) ?? [];
  return roles.some((r) => ["admin", "staff", "organizer", "manager"].includes(r.toLowerCase()));
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const nav = useMemo(() => buildAdminNav(), []);

  const isPublicPage = pathname === "/login" || pathname === "/register";
  if (isPublicPage) return <>{children}</>;

  if (status === "loading") return <LoadingFallback />;

  if (isAdmin) {
    return (
      <OdooLayout navigationFields={nav} appTitle="Zentto Tickets">
        <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
      </OdooLayout>
    );
  }

  // Consumer/buyer — render children without sidebar
  return <>{children}</>;
}

function CookieSync() {
  const { status } = useSession();
  React.useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/auth/set-token", { method: "POST", credentials: "include" }).catch(() => {});
    }
  }, [status]);
  return null;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>Zentto Tickets</title>
        <meta name="description" content="Eventos, Boletos y Experiencias — Zentto Tickets" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <InitColorSchemeScript attribute="data-toolpad-color-scheme" />
      </head>
      <body>
        <SessionProvider>
          <CookieSync />
          <QueryClientProvider client={queryClient}>
            <AppRouterCacheProvider>
              <ThemeProvider theme={theme} defaultMode="system">
                <CssBaseline />
                <Suspense fallback={<LoadingFallback />}>
                  <AppContent>{children}</AppContent>
                </Suspense>
              </ThemeProvider>
            </AppRouterCacheProvider>
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
