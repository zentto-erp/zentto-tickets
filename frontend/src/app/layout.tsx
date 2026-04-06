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
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuIcon from "@mui/icons-material/Menu";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EventIcon from "@mui/icons-material/Event";
import StadiumIcon from "@mui/icons-material/Stadium";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter, usePathname } from "next/navigation";
import "@/app/globals.css";

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

/* ---------- Public nav links (always visible) ---------- */
const PUBLIC_NAV = [
  { label: "Eventos", href: "/eventos", icon: <EventIcon /> },
  { label: "Venues", href: "/venues", icon: <StadiumIcon /> },
  { label: "Carreras", href: "/carreras", icon: <DirectionsRunIcon /> },
];

/* ---------- Authenticated nav links ---------- */
const AUTH_NAV = [
  { label: "Mis Boletos", href: "/boletos", icon: <ConfirmationNumberIcon /> },
  { label: "Scanner", href: "/scan", icon: <QrCodeScannerIcon /> },
];

function ZenttoAppBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const isAuthenticated = status === "authenticated" && !!session;
  const allNav = isAuthenticated ? [...PUBLIC_NAV, ...AUTH_NAV] : PUBLIC_NAV;

  // Hide AppBar on login page
  if (pathname === "/login") return null;

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
          {/* Mobile hamburger */}
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", mr: 4 }}
            onClick={() => router.push("/")}
          >
            <ConfirmationNumberIcon sx={{ fontSize: 28, color: "#F59E0B" }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: "1.15rem",
                background: "linear-gradient(90deg, #fff 0%, #C7D2FE 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              Zentto Tickets
            </Typography>
          </Box>

          {/* Desktop nav */}
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
                      fontSize: "0.875rem",
                      px: 2,
                      position: "relative",
                      "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.06)" },
                      "&::after": isActive
                        ? {
                            content: '""',
                            position: "absolute",
                            bottom: 6,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 20,
                            height: 2,
                            borderRadius: 1,
                            bgcolor: "#F59E0B",
                          }
                        : {},
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Auth area */}
          {isAuthenticated ? (
            <>
              <Avatar
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  width: { xs: 32, md: 36 },
                  height: { xs: 32, md: 36 },
                  bgcolor: "#6366F1",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: "2px solid rgba(255,255,255,0.2)",
                  "&:hover": { borderColor: "#F59E0B" },
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
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      bgcolor: "#1A1744",
                      color: "#fff",
                      border: "1px solid rgba(99,102,241,0.2)",
                    },
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {session.user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                    {session.user?.email}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                <MenuItem onClick={() => { setAnchorEl(null); router.push("/boletos"); }}>
                  <ListItemIcon><ConfirmationNumberIcon sx={{ color: "#818CF8" }} /></ListItemIcon>
                  Mis Boletos
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); router.push("/scan"); }}>
                  <ListItemIcon><QrCodeScannerIcon sx={{ color: "#818CF8" }} /></ListItemIcon>
                  Scanner
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
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 500,
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                  px: { xs: 1, md: 2 },
                  minWidth: "auto",
                  display: { xs: "none", sm: "inline-flex" },
                }}
              >
                Iniciar Sesion
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => router.push("/login")}
                sx={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                  px: { xs: 1.5, md: 2 },
                  whiteSpace: "nowrap",
                  "&:hover": { background: "linear-gradient(135deg, #FBBF24, #F59E0B)" },
                }}
              >
                {isMobile ? "Entrar" : "Crear Evento"}
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 280,
              background: "linear-gradient(180deg, #1E1B4B 0%, #0F0D2E 100%)",
              color: "#fff",
            },
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
                    borderRadius: 2,
                    mb: 0.5,
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
              fullWidth
              variant="contained"
              onClick={() => { router.push("/login"); setDrawerOpen(false); }}
              sx={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                fontWeight: 700,
              }}
            >
              Iniciar Sesion
            </Button>
          </Box>
        )}
      </Drawer>
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
                  <ZenttoAppBar />
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
