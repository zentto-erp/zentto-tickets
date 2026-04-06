"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import EventIcon from "@mui/icons-material/Event";
import StadiumIcon from "@mui/icons-material/Stadium";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import BarChartIcon from "@mui/icons-material/BarChart";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import CelebrationIcon from "@mui/icons-material/Celebration";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

/* ──────────────────────── MOCK DATA ──────────────────────── */

const FEATURED_EVENTS = [
  {
    id: 1,
    title: "Festival Electronica 2026",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop",
    date: "12 Abr 2026",
    venue: "Arena Central",
    price: "$45",
    category: "Festivales",
    hot: true,
  },
  {
    id: 2,
    title: "Maraton Ciudad 10K",
    image: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=600&h=400&fit=crop",
    date: "20 Abr 2026",
    venue: "Parque Metropolitano",
    price: "$25",
    category: "Carreras",
    hot: false,
  },
  {
    id: 3,
    title: "Concierto Sinfonico",
    image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&h=400&fit=crop",
    date: "5 May 2026",
    venue: "Teatro Nacional",
    price: "$60",
    category: "Conciertos",
    hot: true,
  },
  {
    id: 4,
    title: "Final Liga Nacional",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop",
    date: "15 May 2026",
    venue: "Estadio Olimpico",
    price: "$80",
    category: "Deportes",
    hot: false,
  },
  {
    id: 5,
    title: "Tech Summit 2026",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
    date: "1 Jun 2026",
    venue: "Centro de Convenciones",
    price: "$120",
    category: "Conferencias",
    hot: false,
  },
  {
    id: 6,
    title: "Obra: El Fantasma",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop",
    date: "22 Jun 2026",
    venue: "Teatro Colon",
    price: "$35",
    category: "Teatro",
    hot: true,
  },
];

const CATEGORIES = [
  { label: "Conciertos", icon: <MusicNoteIcon />, color: "#6366F1" },
  { label: "Deportes", icon: <SportsBasketballIcon />, color: "#EF4444" },
  { label: "Teatro", icon: <TheaterComedyIcon />, color: "#8B5CF6" },
  { label: "Festivales", icon: <CelebrationIcon />, color: "#F59E0B" },
  { label: "Carreras", icon: <DirectionsRunIcon />, color: "#10B981" },
  { label: "Conferencias", icon: <BusinessCenterIcon />, color: "#0EA5E9" },
];

const STATS = [
  { value: "1,000+", label: "Eventos", icon: <EventIcon /> },
  { value: "15", label: "Venues", icon: <StadiumIcon /> },
  { value: "50,000+", label: "Boletos vendidos", icon: <ConfirmationNumberIcon /> },
  { value: "4.8", label: "Rating promedio", icon: <StarIcon /> },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Crea tu evento",
    desc: "Configura nombre, fecha, descripcion y precios en minutos.",
    icon: <RocketLaunchIcon sx={{ fontSize: 36 }} />,
    color: "#6366F1",
  },
  {
    step: "02",
    title: "Configura tu venue",
    desc: "Disena secciones, filas y asientos con nuestro editor visual.",
    icon: <SettingsIcon sx={{ fontSize: 36 }} />,
    color: "#F59E0B",
  },
  {
    step: "03",
    title: "Vende boletos",
    desc: "Comparte tu evento, cobra online y valida con QR en puerta.",
    icon: <StorefrontIcon sx={{ fontSize: 36 }} />,
    color: "#10B981",
  },
];

/* ──────────────── AUTHENTICATED DASHBOARD CARDS ──────────────── */
const DASHBOARD_CARDS = [
  { title: "Eventos", desc: "Crear y gestionar eventos, conciertos, partidos", icon: <EventIcon sx={{ fontSize: 44 }} />, href: "/eventos", color: "#6366F1" },
  { title: "Venues", desc: "Estadios, arenas, teatros — editor de secciones", icon: <StadiumIcon sx={{ fontSize: 44 }} />, href: "/venues", color: "#F59E0B" },
  { title: "Boletos", desc: "Mis ordenes y tickets con QR", icon: <ConfirmationNumberIcon sx={{ fontSize: 44 }} />, href: "/boletos", color: "#10B981" },
  { title: "Carreras", desc: "Inscripciones, dorsales, tiempos — 5K, 10K, maraton", icon: <DirectionsRunIcon sx={{ fontSize: 44 }} />, href: "/carreras", color: "#EF4444" },
  { title: "Escaneo", desc: "Validar tickets QR en puerta", icon: <QrCodeScannerIcon sx={{ fontSize: 44 }} />, href: "/scan", color: "#8B5CF6" },
  { title: "Dashboard", desc: "Ventas, ocupacion, analytics en tiempo real", icon: <BarChartIcon sx={{ fontSize: 44 }} />, href: "/eventos", color: "#0EA5E9" },
];

/* ──────────────────────── MAIN COMPONENT ──────────────────────── */

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #1E1B4B 0%, #0F0D2E 100%)" }} />
    );
  }

  /* ── Authenticated: show personalized dashboard ── */
  if (session) {
    return <AuthenticatedDashboard name={session.user?.name || "Usuario"} />;
  }

  /* ── Unauthenticated: full landing page ── */
  return <LandingPage />;
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE (unauthenticated)
   ═══════════════════════════════════════════════════════════════ */

function LandingPage() {
  const router = useRouter();

  return (
    <Box sx={{ bgcolor: "#0F0D2E", color: "#fff", minHeight: "100vh" }}>
      {/* ─── HERO ─── */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #1E1B4B 100%)",
          pt: { xs: 6, sm: 8, md: 14 },
          pb: { xs: 6, sm: 8, md: 12 },
        }}
      >
        {/* Decorative circles */}
        <Box sx={{
          position: "absolute", top: { xs: -80, md: -120 }, right: { xs: -80, md: -120 },
          width: { xs: 200, md: 400 }, height: { xs: 200, md: 400 }, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }} />
        <Box sx={{
          position: "absolute", bottom: { xs: -50, md: -80 }, left: { xs: -50, md: -80 },
          width: { xs: 150, md: 300 }, height: { xs: 150, md: 300 }, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
        }} />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, px: { xs: 2, md: 4 } }}>
          <Box sx={{ maxWidth: 720, mx: { xs: 0, md: 0 }, px: { xs: 2, md: 0 } }}>
            <Chip
              label="Plataforma de eventos #1"
              size="small"
              sx={{
                bgcolor: "rgba(99,102,241,0.15)",
                color: "#A5B4FC",
                fontWeight: 600,
                fontSize: "0.75rem",
                mb: 3,
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem" },
                fontWeight: 900,
                lineHeight: 1.1,
                mb: 3,
                letterSpacing: "-0.03em",
              }}
            >
              Descubre eventos{" "}
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(135deg, #818CF8 0%, #F59E0B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                increibles
              </Box>
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "rgba(255,255,255,0.6)",
                fontWeight: 400,
                fontSize: { xs: "0.95rem", md: "1.2rem" },
                lineHeight: 1.6,
                mb: 4,
                maxWidth: 560,
              }}
            >
              Encuentra conciertos, festivales, carreras y mas. Compra boletos
              de forma segura y vive experiencias unicas.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push("/eventos")}
                className="pulse-glow"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  width: { xs: "100%", sm: "auto" },
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  "&:hover": { background: "linear-gradient(135deg, #4F46E5, #7C3AED)" },
                }}
              >
                Explorar Eventos
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push("/login")}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  width: { xs: "100%", sm: "auto" },
                  color: "#F59E0B",
                  borderColor: "rgba(245,158,11,0.4)",
                  "&:hover": {
                    borderColor: "#F59E0B",
                    bgcolor: "rgba(245,158,11,0.08)",
                  },
                }}
              >
                Organizar Evento
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ─── CATEGORIES CHIPS ─── */}
      <Container maxWidth="lg" sx={{ mt: -4, position: "relative", zIndex: 2, px: { xs: 2, md: 4 } }}>
        <Box
          className="hide-scrollbar"
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            py: 2,
            px: 2,
          }}
        >
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.label}
              icon={React.cloneElement(cat.icon, { sx: { color: `${cat.color} !important`, fontSize: 20 } })}
              label={cat.label}
              onClick={() => router.push("/eventos")}
              sx={{
                bgcolor: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.85rem",
                py: 2.5,
                px: 1,
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.1)",
                  borderColor: cat.color,
                  transform: "translateY(-2px)",
                },
              }}
            />
          ))}
        </Box>
      </Container>

      {/* ─── FEATURED EVENTS ─── */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 }, px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 1 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, fontSize: { xs: "1.4rem", sm: "1.8rem", md: "2.125rem" } }}>
              Eventos destacados
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)" }}>
              Los mas populares esta temporada
            </Typography>
          </Box>
          <Button
            endIcon={<ArrowForwardIcon />}
            onClick={() => router.push("/eventos")}
            sx={{ color: "#818CF8", fontWeight: 600, display: { xs: "none", sm: "flex" } }}
          >
            Ver todos
          </Button>
        </Box>

        <Grid container spacing={3}>
          {FEATURED_EVENTS.map((event) => (
            <Grid key={event.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  overflow: "hidden",
                  "&:hover": {
                    transform: "translateY(-6px)",
                    borderColor: "rgba(99,102,241,0.3)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                    "& .event-image": {
                      transform: "scale(1.05)",
                    },
                  },
                }}
                onClick={() => router.push(`/eventos/${event.id}`)}
              >
                <Box sx={{ position: "relative", overflow: "hidden" }}>
                  <CardMedia
                    component="img"
                    height={200}
                    image={event.image}
                    alt={event.title}
                    className="event-image"
                    sx={{ transition: "transform 0.4s ease" }}
                  />
                  {/* Price badge */}
                  <Chip
                    label={event.price}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      bgcolor: "rgba(0,0,0,0.7)",
                      color: "#F59E0B",
                      fontWeight: 700,
                      backdropFilter: "blur(4px)",
                    }}
                  />
                  {/* Category badge */}
                  <Chip
                    label={event.category}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      bgcolor: "rgba(99,102,241,0.85)",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                    }}
                  />
                  {event.hot && (
                    <Chip
                      label="HOT"
                      size="small"
                      icon={<TrendingUpIcon sx={{ color: "#fff !important", fontSize: 14 }} />}
                      sx={{
                        position: "absolute",
                        bottom: 12,
                        left: 12,
                        bgcolor: "#EF4444",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                      }}
                    />
                  )}
                </Box>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fff", mb: 1.5, lineHeight: 1.3 }}>
                    {event.title}
                  </Typography>
                  <Stack spacing={0.8}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarMonthIcon sx={{ fontSize: 16, color: "#818CF8" }} />
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                        {event.date}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOnIcon sx={{ fontSize: 16, color: "#F59E0B" }} />
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                        {event.venue}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Mobile "ver todos" */}
        <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "center", mt: 3 }}>
          <Button
            endIcon={<ArrowForwardIcon />}
            onClick={() => router.push("/eventos")}
            sx={{ color: "#818CF8", fontWeight: 600 }}
          >
            Ver todos los eventos
          </Button>
        </Box>
      </Container>

      {/* ─── HOW IT WORKS ─── */}
      <Box sx={{ bgcolor: "rgba(255,255,255,0.02)", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip
              label="Para organizadores"
              size="small"
              sx={{
                bgcolor: "rgba(245,158,11,0.12)",
                color: "#FBBF24",
                fontWeight: 600,
                mb: 2,
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            />
            <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5, fontSize: { xs: "1.4rem", sm: "1.8rem", md: "2.4rem" } }}>
              Organiza en 3 simples pasos
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)", maxWidth: 500, mx: "auto" }}>
              Todo lo que necesitas para crear y vender boletos para tu proximo evento.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {HOW_IT_WORKS.map((item) => (
              <Grid key={item.step} size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.06)",
                    bgcolor: "rgba(255,255,255,0.02)",
                    textAlign: "center",
                    transition: "all 0.3s",
                    "&:hover": {
                      borderColor: `${item.color}40`,
                      bgcolor: "rgba(255,255,255,0.04)",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${item.color}20, ${item.color}08)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 3,
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ color: item.color, fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em" }}
                  >
                    PASO {item.step}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ mt: 1, mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                    {item.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── STATS ─── */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, md: 4 } }}>
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {STATS.map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
              <Box
                sx={{
                  textAlign: "center",
                  p: { xs: 2, sm: 2.5, md: 3 },
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.06)",
                  bgcolor: "rgba(255,255,255,0.02)",
                }}
              >
                <Box sx={{ color: "#818CF8", mb: { xs: 0.5, md: 1 }, '& svg': { fontSize: { xs: 20, md: 24 } } }}>{stat.icon}</Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: "1.3rem", sm: "1.6rem", md: "2.5rem" },
                    background: "linear-gradient(135deg, #fff, #A5B4FC)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255,255,255,0.5)",
                    mt: 0.5,
                    fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem" },
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ─── CTA BANNER ─── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #312E81 0%, #4338CA 50%, #312E81 100%)",
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center", px: { xs: 2, md: 4 } }}>
          <Typography variant="h3" fontWeight={800} sx={{ mb: 2, fontSize: { xs: "1.3rem", sm: "1.6rem", md: "2.2rem" } }}>
            Listo para crear tu proximo evento?
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", mb: 4, maxWidth: 500, mx: "auto" }}>
            Unete a cientos de organizadores que confian en Zentto Tickets para
            sus eventos.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push("/login")}
              sx={{
                px: 5,
                py: 1.5,
                width: { xs: "100%", sm: "auto" },
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#000",
                fontWeight: 700,
                fontSize: "1rem",
                "&:hover": { background: "linear-gradient(135deg, #FBBF24, #F59E0B)" },
              }}
            >
              Comenzar gratis
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push("/eventos")}
              sx={{
                px: 5,
                py: 1.5,
                width: { xs: "100%", sm: "auto" },
                color: "#fff",
                borderColor: "rgba(255,255,255,0.3)",
                "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              Explorar eventos
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ─── FOOTER ─── */}
      <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.06)", py: 5 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <ConfirmationNumberIcon sx={{ color: "#F59E0B" }} />
                <Typography fontWeight={800} fontSize="1.1rem">Zentto Tickets</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 300 }}>
                La plataforma integral para eventos, boletos y experiencias. Crea, vende y escanea todo en un solo lugar.
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "rgba(255,255,255,0.8)" }}>
                Explorar
              </Typography>
              <Stack spacing={1}>
                {["Eventos", "Venues", "Carreras"].map((link) => (
                  <Typography
                    key={link}
                    variant="body2"
                    onClick={() => router.push(`/${link.toLowerCase()}`)}
                    sx={{
                      color: "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      "&:hover": { color: "#818CF8" },
                      transition: "color 0.2s",
                    }}
                  >
                    {link}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "rgba(255,255,255,0.8)" }}>
                Organizadores
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: "Crear evento", href: "/eventos" },
                  { label: "Editor de venues", href: "/venues/editor" },
                  { label: "Dashboard", href: "/eventos" },
                ].map((link) => (
                  <Typography
                    key={link.label}
                    variant="body2"
                    onClick={() => router.push(link.href)}
                    sx={{ color: "rgba(255,255,255,0.4)", cursor: "pointer", "&:hover": { color: "#818CF8" }, transition: "color 0.2s" }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "rgba(255,255,255,0.8)" }}>
                Soporte
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: "Centro de ayuda", href: "https://docs.zentto.net", external: true },
                  { label: "Contacto", href: "mailto:info@zentto.net", external: true },
                  { label: "Terminos de uso", href: "/terminos" },
                  { label: "Privacidad", href: "/privacidad" },
                ].map((link) => (
                  <Typography
                    key={link.label}
                    variant="body2"
                    onClick={() => {
                      if ((link as any).external) {
                        window.open(link.href, "_blank", "noopener");
                      } else {
                        router.push(link.href);
                      }
                    }}
                    sx={{ color: "rgba(255,255,255,0.4)", cursor: "pointer", "&:hover": { color: "#818CF8" }, transition: "color 0.2s" }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 5,
              pt: 3,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>
              2026 Zentto Tickets. Todos los derechos reservados.
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>
              Hecho con amor en Zentto
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUTHENTICATED DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

function AuthenticatedDashboard({ name }: { name: string }) {
  const router = useRouter();

  return (
    <Box sx={{ bgcolor: "#0F0D2E", color: "#fff", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Welcome header */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
            Bienvenido, {name}
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)" }}>
            Selecciona un modulo para comenzar.
          </Typography>
        </Box>

        {/* Quick stats row */}
        <Grid container spacing={2} sx={{ mb: 5 }}>
          {[
            { label: "Eventos activos", value: "—", icon: <EventIcon />, color: "#6366F1" },
            { label: "Boletos vendidos", value: "—", icon: <ConfirmationNumberIcon />, color: "#10B981" },
            { label: "Venues", value: "—", icon: <StadiumIcon />, color: "#F59E0B" },
            { label: "Escaneos hoy", value: "—", icon: <QrCodeScannerIcon />, color: "#8B5CF6" },
          ].map((s) => (
            <Grid key={s.label} size={{ xs: 6, md: 3 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Box sx={{ color: s.color, mb: 1 }}>{s.icon}</Box>
                <Typography variant="h5" fontWeight={800}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Module cards */}
        <Grid container spacing={3}>
          {DASHBOARD_CARDS.map((card) => (
            <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  height: "100%",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: `${card.color}40`,
                    boxShadow: `0 12px 32px ${card.color}15`,
                  },
                }}
                onClick={() => router.push(card.href)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      background: `linear-gradient(135deg, ${card.color}20, ${card.color}08)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: card.color,
                      mb: 2.5,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: "#fff", mb: 0.5 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                    {card.desc}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 2, color: card.color }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mr: 0.5 }}>
                      Abrir
                    </Typography>
                    <ArrowForwardIcon sx={{ fontSize: 16 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
