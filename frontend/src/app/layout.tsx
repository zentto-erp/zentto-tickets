"use client";

import * as React from "react";
import { Suspense } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuIcon from "@mui/icons-material/Menu";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EventIcon from "@mui/icons-material/Event";
import StadiumIcon from "@mui/icons-material/Stadium";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BarChartIcon from "@mui/icons-material/BarChart";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SyncIcon from "@mui/icons-material/Sync";
import { useRouter, usePathname } from "next/navigation";
import "@/app/globals.css";

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 64;

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data-toolpad-color-scheme" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#6366F1" },
        secondary: { main: "#F59E0B" },
        background: { default: "#F8FAFC", paper: "#FFFFFF" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#818CF8" },
        secondary: { main: "#FBBF24" },
        background: { default: "#0F0D2E", paper: "#1A1744" },
      },
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          "&:hover": {
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function Loading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
      sx={{ background: "linear-gradient(180deg, #1E1B4B 0%, #0F0D2E 100%)" }}>
      <CircularProgress sx={{ color: "#818CF8" }} />
    </Box>
  );
}

/* ---------- Public nav links (buyer/consumer) ---------- */
const PUBLIC_NAV = [
  { label: "Eventos", href: "/eventos", icon: <EventIcon /> },
  { label: "Venues", href: "/venues", icon: <StadiumIcon /> },
  { label: "Carreras", href: "/carreras", icon: <DirectionsRunIcon /> },
];

const BUYER_NAV = [
  { label: "Mi Cuenta", href: "/mi-cuenta", icon: <AccountCircleIcon /> },
  { label: "Mis Boletos", href: "/boletos", icon: <ConfirmationNumberIcon /> },
];

/* ---------- Admin sidebar links ---------- */
const ADMIN_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
  { label: "Eventos", href: "/eventos", icon: <EventIcon /> },
  { label: "Venues", href: "/venues", icon: <StadiumIcon /> },
  { label: "Ordenes", href: "/ordenes", icon: <ReceiptIcon /> },
  { label: "Carreras", href: "/carreras", icon: <DirectionsRunIcon /> },
  { label: "Escaneo", href: "/scan", icon: <QrCodeScannerIcon /> },
  { label: "Sincronizacion", href: "/sync", icon: <SyncIcon /> },
  { label: "Analytics", href: "/analytics", icon: <BarChartIcon /> },
  { label: "Configuracion", href: "/configuracion", icon: <SettingsIcon /> },
];

/* ---------- Helper: detect admin role ---------- */
function useIsAdmin() {
  const { data: session } = useSession();
  if (!session) return false;
  const s = session as Record<string, unknown>;
  if (s.isAdmin === true) return true;
  const roles = (s.roles as string[]) ?? [];
  return roles.some((r) => ["admin", "staff", "organizer", "manager"].includes(r.toLowerCase()));
}

/* ================================================================== */
/*  Admin Sidebar                                                      */
/* ================================================================== */

function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #1E1B4B 0%, #0F0D2E 100%)",
        borderRight: "1px solid rgba(99,102,241,0.12)",
        transition: "width 0.2s ease",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1200,
        overflowX: "hidden",
      }}
    >
      {/* Logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 2, minHeight: 64 }}>
        <ConfirmationNumberIcon sx={{ fontSize: 28, color: "#F59E0B", flexShrink: 0 }} />
        {!collapsed && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              fontSize: "1rem",
              background: "linear-gradient(90deg, #fff 0%, #C7D2FE 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              whiteSpace: "nowrap",
            }}
          >
            Zentto Tickets
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={onToggle} sx={{ color: "rgba(255,255,255,0.5)", p: 0.5 }}>
          {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      {/* Nav items */}
      <List sx={{ px: 1, pt: 1, flex: 1 }}>
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const btn = (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => router.push(item.href)}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 1.5 : 2,
                  bgcolor: isActive ? "rgba(99,102,241,0.18)" : "transparent",
                  "&:hover": { bgcolor: "rgba(99,102,241,0.12)" },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "#F59E0B" : "rgba(255,255,255,0.6)",
                    minWidth: collapsed ? 0 : 40,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontWeight: isActive ? 700 : 500,
                          fontSize: "0.875rem",
                          color: isActive ? "#fff" : "rgba(255,255,255,0.8)",
                        },
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
          return collapsed ? (
            <Tooltip key={item.href} title={item.label} placement="right" arrow>
              {btn}
            </Tooltip>
          ) : btn;
        })}
      </List>
    </Box>
  );
}

/* ================================================================== */
/*  Consumer AppBar (buyers)                                           */
/* ================================================================== */

function ConsumerAppBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const isAuthenticated = status === "authenticated" && !!session;
  const allNav = isAuthenticated ? [...PUBLIC_NAV, ...BUYER_NAV] : PUBLIC_NAV;

  if (pathname === "/login" || pathname === "/register") return null;

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "linear-gradient(90deg, #1E1B4B 0%, #312E81 100%)",
          borderBottom: "1px solid rgba(99,102,241,0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Toolbar sx={{ maxWidth: 1400, width: "100%", mx: "auto", px: { xs: 2, md: 3 } }}>
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}

          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", mr: 4 }}
            onClick={() => router.push("/")}
          >
            <ConfirmationNumberIcon sx={{ fontSize: 28, color: "#F59E0B" }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800, fontSize: "1.15rem",
                background: "linear-gradient(90deg, #fff 0%, #C7D2FE 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              Zentto Tickets
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ display: "flex", gap: 0.5, flex: 1 }}>
              {allNav.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    sx={{
                      color: isActive ? "#F59E0B" : "rgba(255,255,255,0.8)",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.875rem", px: 2,
                      position: "relative",
                      "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" },
                      "&::after": isActive ? {
                        content: '""', position: "absolute", bottom: 6, left: "50%",
                        transform: "translateX(-50%)", width: 20, height: 2, borderRadius: 1, bgcolor: "#F59E0B",
                      } : {},
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          {isAuthenticated ? (
            <>
              <Avatar
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  width: { xs: 32, md: 36 }, height: { xs: 32, md: 36 },
                  bgcolor: "#6366F1", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700,
                  border: "2px solid rgba(255,255,255,0.2)", "&:hover": { borderColor: "#F59E0B" },
                }}
              >
                {initials}
              </Avatar>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                  paper: {
                    sx: { mt: 1, minWidth: 200, bgcolor: "#1A1744", color: "#fff", border: "1px solid rgba(99,102,241,0.2)" },
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{session.user?.name}</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>{session.user?.email}</Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                <MenuItem onClick={() => { setAnchorEl(null); router.push("/boletos"); }}>
                  <ListItemIcon><ConfirmationNumberIcon sx={{ color: "#818CF8" }} /></ListItemIcon>
                  Mis Boletos
                </MenuItem>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                <MenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <ListItemIcon><LogoutIcon sx={{ color: "#EF4444" }} /></ListItemIcon>
                  Cerrar Sesion
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: { xs: 0.5, md: 1 }, alignItems: "center" }}>
              <Button
                onClick={() => router.push("/login")}
                sx={{
                  color: "rgba(255,255,255,0.85)", fontWeight: 500,
                  fontSize: { xs: "0.75rem", md: "0.875rem" }, px: { xs: 1, md: 2 },
                  minWidth: "auto", display: { xs: "none", sm: "inline-flex" },
                }}
              >
                Iniciar Sesion
              </Button>
              <Button
                variant="contained" size="small"
                onClick={() => router.push("/register")}
                sx={{
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  fontWeight: 700, fontSize: { xs: "0.75rem", md: "0.875rem" },
                  px: { xs: 1.5, md: 2 }, whiteSpace: "nowrap",
                  "&:hover": { background: "linear-gradient(135deg, #4F46E5, #7C3AED)" },
                }}
              >
                Registrarse
              </Button>
              <Button
                variant="contained" size="small"
                onClick={() => router.push("/login")}
                sx={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: "#000", fontWeight: 700, fontSize: { xs: "0.75rem", md: "0.875rem" },
                  px: { xs: 1.5, md: 2 }, whiteSpace: "nowrap",
                  "&:hover": { background: "linear-gradient(135deg, #FBBF24, #F59E0B)" },
                  display: { xs: "none", sm: "inline-flex" },
                }}
              >
                Crear Evento
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: { width: 280, background: "linear-gradient(180deg, #1E1B4B 0%, #0F0D2E 100%)", color: "#fff" },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ConfirmationNumberIcon sx={{ color: "#F59E0B" }} />
            <Typography fontWeight={800} fontSize="1.1rem">Zentto Tickets</Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "rgba(255,255,255,0.6)" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
        <List sx={{ px: 1, pt: 1 }}>
          {allNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <ListItem key={item.href} disablePadding>
                <ListItemButton
                  onClick={() => { router.push(item.href); setDrawerOpen(false); }}
                  sx={{
                    borderRadius: 2, mb: 0.5,
                    bgcolor: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                    "&:hover": { bgcolor: "rgba(99,102,241,0.1)" },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? "#F59E0B" : "rgba(255,255,255,0.6)", minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: { fontWeight: isActive ? 700 : 500, color: isActive ? "#fff" : "rgba(255,255,255,0.8)" },
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        {!isAuthenticated && (
          <Box sx={{ p: 2, mt: "auto" }}>
            <Button
              fullWidth variant="contained"
              onClick={() => { router.push("/login"); setDrawerOpen(false); }}
              sx={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", fontWeight: 700 }}
            >
              Iniciar Sesion
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  );
}

/* ================================================================== */
/*  Admin AppBar (top bar inside admin layout)                         */
/* ================================================================== */

function AdminAppBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "#fff",
        borderBottom: "1px solid #E2E8F0",
        color: "#0F172A",
      }}
    >
      <Toolbar sx={{ justifyContent: "flex-end", minHeight: { xs: 56, md: 64 } }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
          {session?.user?.name}
        </Typography>
        <Avatar
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            width: 36, height: 36, bgcolor: "#6366F1",
            cursor: "pointer", fontSize: "0.85rem", fontWeight: 700,
          }}
        >
          {initials}
        </Avatar>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 180 } } }}
        >
          <MenuItem onClick={() => { setAnchorEl(null); router.push("/mi-cuenta"); }}>
            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
            Mi Cuenta
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => signOut({ callbackUrl: "/" })}>
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: "#EF4444" }} /></ListItemIcon>
            Cerrar Sesion
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

/* ================================================================== */
/*  Adaptive Inner Layout                                              */
/* ================================================================== */

function AdaptiveLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const isLoginPage = pathname === "/login" || pathname === "/register";
  if (isLoginPage) return <>{children}</>;

  // Loading
  if (status === "loading") return <Loading />;

  // Admin layout: sidebar + top bar + content
  if (isAdmin) {
    const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
    return (
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAFC" }}>
        <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((p) => !p)} />
        <Box sx={{ flex: 1, ml: `${sidebarW}px`, transition: "margin-left 0.2s ease", display: "flex", flexDirection: "column" }}>
          <AdminAppBar />
          <Box component="main" sx={{ flex: 1, p: 0 }}>
            {children}
          </Box>
        </Box>
      </Box>
    );
  }

  // Consumer layout: top AppBar + content
  return (
    <>
      <ConsumerAppBar />
      {children}
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>Zentto Tickets — Eventos, Boletos y Experiencias</title>
        <meta name="description" content="Descubre eventos increibles, compra boletos y organiza experiencias unicas con Zentto Tickets." />
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
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <Suspense fallback={<Loading />}>
                  <AdaptiveLayout>{children}</AdaptiveLayout>
                </Suspense>
              </ThemeProvider>
            </AppRouterCacheProvider>
          </QueryClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

/** Setear cookie HttpOnly zentto_token despues del login */
function CookieSync() {
  const { status } = useSession();
  React.useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/auth/set-token", { method: "POST", credentials: "include" }).catch(() => {});
    }
  }, [status]);
  return null;
}
