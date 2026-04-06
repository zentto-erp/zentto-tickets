"use client";

import React, { useState, useEffect, useRef } from "react";
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
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Skeleton from "@mui/material/Skeleton";
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
import SearchIcon from "@mui/icons-material/Search";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SettingsIcon from "@mui/icons-material/Settings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupsIcon from "@mui/icons-material/Groups";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useEvents } from "@/hooks/useEvents";
import { useRaces } from "@/hooks/useRaces";
import type { Event } from "@/types";

/* ──────────────────────── CONSTANTS ──────────────────────── */

const CATEGORIES = [
  { label: "Conciertos", icon: <MusicNoteIcon />, color: "#6366F1", type: "concert" },
  { label: "Deportes", icon: <SportsBasketballIcon />, color: "#EF4444", type: "sports" },
  { label: "Teatro", icon: <TheaterComedyIcon />, color: "#8B5CF6", type: "theater" },
  { label: "Festivales", icon: <CelebrationIcon />, color: "#F59E0B", type: "festival" },
  { label: "Carreras", icon: <DirectionsRunIcon />, color: "#10B981", type: "race" },
  { label: "Conferencias", icon: <BusinessCenterIcon />, color: "#0EA5E9", type: "general" },
];

const RACE_DISTANCES = [
  { label: "5K", color: "#10B981", desc: "Perfecta para principiantes" },
  { label: "10K", color: "#0EA5E9", desc: "El reto intermedio" },
  { label: "21K", color: "#F59E0B", desc: "Media maraton" },
  { label: "42K", color: "#EF4444", desc: "Maraton completa" },
];

const STATS = [
  { value: "1,000+", label: "Eventos", icon: <EventIcon /> },
  { value: "15", label: "Venues", icon: <StadiumIcon /> },
  { value: "50,000+", label: "Boletos vendidos", icon: <ConfirmationNumberIcon /> },
  { value: "4.8", label: "Rating promedio", icon: <StarIcon /> },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Crea tu evento", desc: "Configura nombre, fecha, descripcion y precios en minutos.", icon: <RocketLaunchIcon sx={{ fontSize: 36 }} />, color: "#6366F1" },
  { step: "02", title: "Configura tu venue", desc: "Disena secciones, filas y asientos con nuestro editor visual.", icon: <SettingsIcon sx={{ fontSize: 36 }} />, color: "#F59E0B" },
  { step: "03", title: "Vende boletos", desc: "Comparte tu evento, cobra online y valida con QR en puerta.", icon: <StorefrontIcon sx={{ fontSize: 36 }} />, color: "#10B981" },
];

/* ── FALLBACK IMAGES ── */
const FALLBACK_IMAGES: Record<string, string> = {
  concert: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop",
  sports: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop",
  theater: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop",
  festival: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop",
  race: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=600&h=400&fit=crop",
  general: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
};

/* ── DASHBOARD CARDS (auth) ── */
const DASHBOARD_CARDS = [
  { title: "Eventos", desc: "Crear y gestionar eventos, conciertos, partidos", icon: <EventIcon sx={{ fontSize: 44 }} />, href: "/eventos", color: "#6366F1" },
  { title: "Venues", desc: "Estadios, arenas, teatros — editor de secciones", icon: <StadiumIcon sx={{ fontSize: 44 }} />, href: "/venues", color: "#F59E0B" },
  { title: "Boletos", desc: "Mis ordenes y tickets con QR", icon: <ConfirmationNumberIcon sx={{ fontSize: 44 }} />, href: "/boletos", color: "#10B981" },
  { title: "Carreras", desc: "Inscripciones, dorsales, tiempos — 5K, 10K, maraton", icon: <DirectionsRunIcon sx={{ fontSize: 44 }} />, href: "/carreras", color: "#EF4444" },
  { title: "Escaneo", desc: "Validar tickets QR en puerta", icon: <QrCodeScannerIcon sx={{ fontSize: 44 }} />, href: "/scan", color: "#8B5CF6" },
  { title: "Dashboard", desc: "Ventas, ocupacion, analytics en tiempo real", icon: <BarChartIcon sx={{ fontSize: 44 }} />, href: "/eventos", color: "#0EA5E9" },
];

/* ──────────────── HELPERS ──────────────── */

function getEventImage(event: Event): string {
  return event.ImageUrl || FALLBACK_IMAGES[event.EventType] || FALLBACK_IMAGES.general;
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

function formatEventDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
}

function formatEventTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

/* ──────────────────────── MAIN COMPONENT ──────────────────────── */

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <Box sx={{ minHeight: "100vh", background: "linear-gradient(180deg, #1E1B4B 0%, #0F0D2E 100%)" }} />
    );
  }

  if (session) {
    return <AuthenticatedDashboard name={session.user?.name || "Usuario"} />;
  }

  return <LandingPage />;
}

/* =================================================================
   LANDING PAGE (unauthenticated) — Estilo Eventbrite / Ticketmaster
   ================================================================= */

function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const { data: eventsData, isLoading: eventsLoading } = useEvents();
  const { data: racesData } = useRaces();

  const allEvents = eventsData?.rows ?? [];
  const featuredEvents = allEvents.filter((e) => e.Status === "on_sale" || e.Status === "published").slice(0, 6);
  const upcomingEvents = allEvents
    .filter((e) => new Date(e.EventDate) > new Date())
    .sort((a, b) => new Date(a.EventDate).getTime() - new Date(b.EventDate).getTime())
    .slice(0, 8);

  const races = racesData?.rows ?? racesData ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    router.push(`/eventos?${params.toString()}`);
  }

  return (
    <Box sx={{ bgcolor: "#0F0D2E", color: "#fff", minHeight: "100vh" }}>

      {/* ─── HERO with Search ─── */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #1E1B4B 100%)",
          pt: { xs: 5, sm: 7, md: 12 },
          pb: { xs: 8, sm: 10, md: 14 },
        }}
      >
        {/* Decorative elements */}
        <Box sx={{
          position: "absolute", top: -120, right: -120,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }} />
        <Box sx={{
          position: "absolute", bottom: -80, left: -80,
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)",
        }} />
        {/* Floating dots pattern */}
        <Box sx={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03,
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }} />

        <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Chip
            label="La plataforma #1 de eventos y boletos"
            size="small"
            sx={{
              bgcolor: "rgba(99,102,241,0.15)", color: "#A5B4FC",
              fontWeight: 600, fontSize: "0.75rem", mb: 3,
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2rem", sm: "2.8rem", md: "3.8rem" },
              fontWeight: 900, lineHeight: 1.1, mb: 2, letterSpacing: "-0.03em",
            }}
          >
            Encuentra eventos{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(135deg, #818CF8 0%, #F59E0B 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}
            >
              cerca de ti
            </Box>
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.55)", fontWeight: 400,
              fontSize: { xs: "0.95rem", md: "1.15rem" },
              lineHeight: 1.6, mb: 5, maxWidth: 560, mx: "auto",
            }}
          >
            Conciertos, festivales, carreras, teatro y mas.
            Compra boletos de forma segura y vive experiencias unicas.
          </Typography>

          {/* Search bar */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1.5, sm: 0 },
              maxWidth: 700, mx: "auto",
              bgcolor: "rgba(255,255,255,0.08)",
              borderRadius: { xs: 3, sm: 50 },
              border: "1px solid rgba(255,255,255,0.1)",
              p: { xs: 1.5, sm: 0.8 },
              backdropFilter: "blur(12px)",
              transition: "all 0.3s",
              "&:focus-within": {
                borderColor: "rgba(99,102,241,0.4)",
                bgcolor: "rgba(255,255,255,0.1)",
                boxShadow: "0 8px 32px rgba(99,102,241,0.15)",
              },
            }}
          >
            <TextField
              placeholder="Buscar eventos, artistas, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="standard"
              fullWidth
              slotProps={{
                input: {
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "rgba(255,255,255,0.4)", ml: { xs: 0, sm: 1.5 } }} />
                    </InputAdornment>
                  ),
                  sx: { color: "#fff", fontSize: "0.95rem", py: 0.5 },
                },
              }}
            />
            <Box sx={{ width: "1px", bgcolor: "rgba(255,255,255,0.1)", mx: 0.5, display: { xs: "none", sm: "block" } }} />
            <TextField
              placeholder="Ciudad o ubicacion"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              variant="standard"
              sx={{ minWidth: { sm: 180 } }}
              slotProps={{
                input: {
                  disableUnderline: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <MyLocationIcon sx={{ color: "rgba(255,255,255,0.4)" }} />
                    </InputAdornment>
                  ),
                  sx: { color: "#fff", fontSize: "0.95rem", py: 0.5 },
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: { xs: 3, sm: 50 },
                px: 4, py: 1.3,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                fontWeight: 700, fontSize: "0.95rem",
                whiteSpace: "nowrap", flexShrink: 0,
                "&:hover": { background: "linear-gradient(135deg, #4F46E5, #7C3AED)" },
              }}
            >
              Buscar
            </Button>
          </Box>

          {/* Popular searches */}
          <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", alignSelf: "center", mr: 0.5 }}>
              Popular:
            </Typography>
            {["Conciertos en vivo", "Maraton 10K", "Teatro", "Festivales"].map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onClick={() => { setSearchQuery(tag); }}
                sx={{
                  bgcolor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)",
                  fontWeight: 500, fontSize: "0.75rem", cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.06)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)", color: "#fff" },
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* ─── CATEGORIES HORIZONTAL ─── */}
      <Container maxWidth="lg" sx={{ mt: { xs: -4, md: -6 }, position: "relative", zIndex: 2, px: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            display: "flex", gap: 2, overflowX: "auto", py: 2, px: 1,
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none", scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((cat) => (
            <Box
              key={cat.label}
              onClick={() => router.push(`/eventos?type=${cat.type}`)}
              sx={{
                display: "flex", flexDirection: "column", alignItems: "center",
                minWidth: 100, py: 2.5, px: 2, borderRadius: 3, cursor: "pointer",
                bgcolor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.3s",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.08)",
                  borderColor: cat.color,
                  transform: "translateY(-4px)",
                  boxShadow: `0 8px 24px ${cat.color}20`,
                },
              }}
            >
              <Box sx={{
                width: 48, height: 48, borderRadius: "50%",
                background: `linear-gradient(135deg, ${cat.color}25, ${cat.color}10)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: cat.color, mb: 1,
              }}>
                {React.cloneElement(cat.icon, { sx: { fontSize: 24 } })}
              </Box>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, whiteSpace: "nowrap" }}>
                {cat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      {/* ─── FEATURED EVENTS ─── */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 }, px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, fontSize: { xs: "1.4rem", md: "2rem" } }}>
              Eventos destacados
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)" }}>
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

        {eventsLoading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 4, bgcolor: "rgba(255,255,255,0.05)" }} />
              </Grid>
            ))}
          </Grid>
        ) : featuredEvents.length > 0 ? (
          <Grid container spacing={3}>
            {featuredEvents.map((event) => (
              <Grid key={event.EventId} size={{ xs: 12, sm: 6, md: 4 }}>
                <FeaturedEventCard event={event} onClick={() => router.push(`/eventos/${event.EventId}`)} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <FallbackFeaturedEvents />
        )}

        <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "center", mt: 3 }}>
          <Button endIcon={<ArrowForwardIcon />} onClick={() => router.push("/eventos")} sx={{ color: "#818CF8", fontWeight: 600 }}>
            Ver todos los eventos
          </Button>
        </Box>
      </Container>

      {/* ─── UPCOMING EVENTS — compact list ─── */}
      {upcomingEvents.length > 0 && (
        <Box sx={{ bgcolor: "rgba(255,255,255,0.015)", py: { xs: 5, md: 8 } }}>
          <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, fontSize: { xs: "1.4rem", md: "2rem" } }}>
                  Proximos eventos
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)" }}>
                  No te pierdas lo que viene
                </Typography>
              </Box>
              <Button endIcon={<ArrowForwardIcon />} onClick={() => router.push("/eventos")}
                sx={{ color: "#818CF8", fontWeight: 600, display: { xs: "none", sm: "flex" } }}>
                Ver calendario
              </Button>
            </Box>

            <Stack spacing={1.5}>
              {upcomingEvents.map((event) => (
                <UpcomingEventRow key={event.EventId} event={event} onClick={() => router.push(`/eventos/${event.EventId}`)} />
              ))}
            </Stack>
          </Container>
        </Box>
      )}

      {/* ─── RACES / CARRERAS SECTION ─── */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 }, px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
          <Box>
            <Stack direction="row" alignItems="center" gap={1.5} mb={0.5}>
              <DirectionsRunIcon sx={{ color: "#10B981", fontSize: 28 }} />
              <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.4rem", md: "2rem" } }}>
                Carreras y maratones
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)" }}>
              Inscribete y corre — desde 5K hasta maraton completa
            </Typography>
          </Box>
          <Button endIcon={<ArrowForwardIcon />} onClick={() => router.push("/carreras")}
            sx={{ color: "#10B981", fontWeight: 600, display: { xs: "none", sm: "flex" } }}>
            Ver carreras
          </Button>
        </Box>

        {/* Distance badges */}
        <Box sx={{ display: "flex", gap: 2, overflowX: "auto", mb: 4, pb: 1, "&::-webkit-scrollbar": { display: "none" } }}>
          {RACE_DISTANCES.map((d) => (
            <Box
              key={d.label}
              onClick={() => router.push("/carreras")}
              sx={{
                display: "flex", alignItems: "center", gap: 2,
                px: 3, py: 2, borderRadius: 3, cursor: "pointer",
                bgcolor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.3s", minWidth: 200,
                "&:hover": {
                  borderColor: d.color, bgcolor: "rgba(255,255,255,0.06)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box sx={{
                width: 52, height: 52, borderRadius: "50%",
                background: `linear-gradient(135deg, ${d.color}30, ${d.color}10)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: d.color, fontSize: "1rem" }}>
                  {d.label}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#fff" }}>{d.label}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>{d.desc}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Race cards from API */}
        {Array.isArray(races) && races.length > 0 && (
          <Grid container spacing={3}>
            {races.slice(0, 3).map((race: any) => (
              <Grid key={race.RaceId || race.EventId} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(16,185,129,0.15)",
                    cursor: "pointer", transition: "all 0.3s",
                    "&:hover": { transform: "translateY(-4px)", borderColor: "#10B981", boxShadow: "0 12px 32px rgba(16,185,129,0.1)" },
                  }}
                  onClick={() => router.push(`/carreras/${race.RaceId || race.EventId}`)}
                >
                  <Box sx={{ position: "relative", height: 160, overflow: "hidden" }}>
                    <Box sx={{
                      width: "100%", height: "100%",
                      background: "linear-gradient(135deg, #064E3B 0%, #0F172A 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <DirectionsRunIcon sx={{ fontSize: 56, color: "#10B981", opacity: 0.3 }} />
                    </Box>
                    <Chip label={race.Distance || "Carrera"} size="small" sx={{
                      position: "absolute", top: 12, left: 12,
                      bgcolor: "#10B981", color: "#fff", fontWeight: 700,
                    }} />
                  </Box>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fff", mb: 1 }}>
                      {race.Name || race.EventName || "Carrera"}
                    </Typography>
                    <Stack spacing={0.5}>
                      <Stack direction="row" alignItems="center" gap={0.8}>
                        <CalendarMonthIcon sx={{ fontSize: 14, color: "#10B981" }} />
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                          {race.StartTime ? formatEventDate(race.StartTime) : "Proximamente"}
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" gap={0.8}>
                        <GroupsIcon sx={{ fontSize: 14, color: "#10B981" }} />
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                          {race.MaxParticipants ? `${race.MaxParticipants} cupos` : "Cupos limitados"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "center", mt: 3 }}>
          <Button endIcon={<ArrowForwardIcon />} onClick={() => router.push("/carreras")} sx={{ color: "#10B981", fontWeight: 600 }}>
            Ver todas las carreras
          </Button>
        </Box>
      </Container>

      {/* ─── HOW IT WORKS ─── */}
      <Box sx={{ bgcolor: "rgba(255,255,255,0.02)", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 4 } }}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip label="Para organizadores" size="small" sx={{
              bgcolor: "rgba(245,158,11,0.12)", color: "#FBBF24", fontWeight: 600, mb: 2,
              border: "1px solid rgba(245,158,11,0.2)",
            }} />
            <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5, fontSize: { xs: "1.4rem", md: "2.4rem" } }}>
              Organiza en 3 simples pasos
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)", maxWidth: 500, mx: "auto" }}>
              Todo lo que necesitas para crear y vender boletos para tu proximo evento.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {HOW_IT_WORKS.map((item) => (
              <Grid key={item.step} size={{ xs: 12, sm: 4 }}>
                <Box sx={{
                  p: 4, borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)",
                  bgcolor: "rgba(255,255,255,0.02)", textAlign: "center", transition: "all 0.3s",
                  "&:hover": { borderColor: `${item.color}40`, bgcolor: "rgba(255,255,255,0.04)", transform: "translateY(-4px)" },
                }}>
                  <Box sx={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${item.color}20, ${item.color}08)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 3, color: item.color,
                  }}>
                    {item.icon}
                  </Box>
                  <Typography variant="caption" sx={{ color: item.color, fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em" }}>
                    PASO {item.step}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ mt: 1, mb: 1 }}>{item.title}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{item.desc}</Typography>
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
              <Box sx={{
                textAlign: "center", p: { xs: 2, md: 3 }, borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(255,255,255,0.02)",
              }}>
                <Box sx={{ color: "#818CF8", mb: { xs: 0.5, md: 1 }, "& svg": { fontSize: { xs: 20, md: 24 } } }}>{stat.icon}</Box>
                <Typography variant="h3" sx={{
                  fontWeight: 900, fontSize: { xs: "1.3rem", md: "2.5rem" },
                  background: "linear-gradient(135deg, #fff, #A5B4FC)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mt: 0.5, fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ─── CTA BANNER ─── */}
      <Box sx={{ background: "linear-gradient(135deg, #312E81 0%, #4338CA 50%, #312E81 100%)", py: { xs: 6, md: 8 } }}>
        <Container maxWidth="md" sx={{ textAlign: "center", px: { xs: 2, md: 4 } }}>
          <Typography variant="h3" fontWeight={800} sx={{ mb: 2, fontSize: { xs: "1.3rem", md: "2.2rem" } }}>
            Listo para crear tu proximo evento?
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)", mb: 4, maxWidth: 500, mx: "auto" }}>
            Unete a cientos de organizadores que confian en Zentto Tickets para sus eventos.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button variant="contained" size="large" onClick={() => router.push("/login")} sx={{
              px: 5, py: 1.5, width: { xs: "100%", sm: "auto" },
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              color: "#000", fontWeight: 700, fontSize: "1rem",
              "&:hover": { background: "linear-gradient(135deg, #FBBF24, #F59E0B)" },
            }}>
              Comenzar gratis
            </Button>
            <Button variant="outlined" size="large" onClick={() => router.push("/eventos")} sx={{
              px: 5, py: 1.5, width: { xs: "100%", sm: "auto" },
              color: "#fff", borderColor: "rgba(255,255,255,0.3)",
              "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.05)" },
            }}>
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
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "rgba(255,255,255,0.8)" }}>Explorar</Typography>
              <Stack spacing={1}>
                {["Eventos", "Venues", "Carreras"].map((link) => (
                  <Typography key={link} variant="body2" onClick={() => router.push(`/${link.toLowerCase()}`)}
                    sx={{ color: "rgba(255,255,255,0.4)", cursor: "pointer", "&:hover": { color: "#818CF8" }, transition: "color 0.2s" }}>
                    {link}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "rgba(255,255,255,0.8)" }}>Organizadores</Typography>
              <Stack spacing={1}>
                {[{ label: "Crear evento", href: "/eventos" }, { label: "Editor de venues", href: "/venues/editor" }, { label: "Dashboard", href: "/eventos" }].map((link) => (
                  <Typography key={link.label} variant="body2" onClick={() => router.push(link.href)}
                    sx={{ color: "rgba(255,255,255,0.4)", cursor: "pointer", "&:hover": { color: "#818CF8" }, transition: "color 0.2s" }}>
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "rgba(255,255,255,0.8)" }}>Soporte</Typography>
              <Stack spacing={1}>
                {[
                  { label: "Centro de ayuda", href: "https://docs.zentto.net", external: true },
                  { label: "Contacto", href: "mailto:info@zentto.net", external: true },
                  { label: "Terminos de uso", href: "/terminos" },
                  { label: "Privacidad", href: "/privacidad" },
                ].map((link) => (
                  <Typography key={link.label} variant="body2"
                    onClick={() => { if ((link as any).external) window.open(link.href, "_blank", "noopener"); else router.push(link.href); }}
                    sx={{ color: "rgba(255,255,255,0.4)", cursor: "pointer", "&:hover": { color: "#818CF8" }, transition: "color 0.2s" }}>
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          </Grid>
          <Box sx={{
            mt: 5, pt: 3, borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2,
          }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>2026 Zentto Tickets. Todos los derechos reservados.</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>Hecho con amor en Zentto</Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

/* ─── FEATURED EVENT CARD ─── */

function FeaturedEventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  return (
    <Card
      sx={{
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer", transition: "all 0.3s ease", overflow: "hidden",
        "&:hover": {
          transform: "translateY(-6px)", borderColor: "rgba(99,102,241,0.3)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          "& .event-image": { transform: "scale(1.05)" },
        },
      }}
      onClick={onClick}
    >
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        <CardMedia
          component="img"
          height={200}
          image={getEventImage(event)}
          alt={event.Name}
          className="event-image"
          sx={{ transition: "transform 0.4s ease", objectFit: "cover" }}
        />
        {/* Date badge */}
        <Box sx={{
          position: "absolute", top: 12, left: 12,
          bgcolor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
          borderRadius: 2, px: 1.5, py: 0.8, textAlign: "center",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <Typography variant="caption" sx={{ color: "#F59E0B", fontWeight: 800, fontSize: "0.7rem", display: "block", lineHeight: 1 }}>
            {new Date(event.EventDate).toLocaleDateString("es", { month: "short" }).toUpperCase()}
          </Typography>
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 900, fontSize: "1.2rem", lineHeight: 1.1 }}>
            {new Date(event.EventDate).getDate()}
          </Typography>
        </Box>
        {/* Status */}
        {event.Status === "on_sale" && (
          <Chip label="En venta" size="small" sx={{
            position: "absolute", top: 12, right: 12,
            bgcolor: "#10B981", color: "#fff", fontWeight: 600, fontSize: "0.7rem",
          }} />
        )}
        {/* Category */}
        <Chip
          label={event.EventType === "concert" ? "Concierto" : event.EventType === "sports" ? "Deportes" : event.EventType === "theater" ? "Teatro" : event.EventType === "festival" ? "Festival" : event.EventType === "race" ? "Carrera" : "Evento"}
          size="small"
          sx={{
            position: "absolute", bottom: 12, left: 12,
            bgcolor: "rgba(99,102,241,0.85)", color: "#fff", fontWeight: 600, fontSize: "0.7rem",
          }}
        />
      </Box>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fff", mb: 1.5, lineHeight: 1.3 }}>
          {event.Name}
        </Typography>
        <Stack spacing={0.8}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarMonthIcon sx={{ fontSize: 16, color: "#818CF8" }} />
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {formatEventDateFull(event.EventDate)} - {formatEventTime(event.EventDate)}
            </Typography>
          </Box>
          {event.VenueName && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOnIcon sx={{ fontSize: 16, color: "#F59E0B" }} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                {event.VenueName}{event.City ? ` - ${event.City}` : ""}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ─── UPCOMING EVENT ROW (compact) ─── */

function UpcomingEventRow({ event, onClick }: { event: Event; onClick: () => void }) {
  const eventDate = new Date(event.EventDate);
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex", alignItems: "center", gap: { xs: 2, md: 3 },
        p: { xs: 1.5, md: 2 }, borderRadius: 3, cursor: "pointer",
        bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
        transition: "all 0.2s",
        "&:hover": {
          bgcolor: "rgba(255,255,255,0.06)",
          borderColor: "rgba(99,102,241,0.2)",
          transform: "translateX(4px)",
        },
      }}
    >
      {/* Date block */}
      <Box sx={{
        minWidth: 56, textAlign: "center", py: 1, px: 1.5,
        borderRadius: 2, bgcolor: "rgba(99,102,241,0.1)",
        border: "1px solid rgba(99,102,241,0.15)",
      }}>
        <Typography variant="caption" sx={{ color: "#818CF8", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase" }}>
          {eventDate.toLocaleDateString("es", { month: "short" })}
        </Typography>
        <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>
          {eventDate.getDate()}
        </Typography>
      </Box>

      {/* Image thumbnail */}
      <Box sx={{
        width: 60, height: 60, borderRadius: 2, overflow: "hidden", flexShrink: 0,
        display: { xs: "none", sm: "block" },
      }}>
        <Box component="img" src={getEventImage(event)} alt={event.Name} sx={{
          width: "100%", height: "100%", objectFit: "cover",
        }} />
      </Box>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#fff", mb: 0.3 }} noWrap>
          {event.Name}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          {event.VenueName && (
            <Stack direction="row" alignItems="center" gap={0.5}>
              <LocationOnIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }} />
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>{event.VenueName}</Typography>
            </Stack>
          )}
          <Stack direction="row" alignItems="center" gap={0.5}>
            <AccessTimeIcon sx={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>{formatEventTime(event.EventDate)}</Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Action */}
      <Button variant="outlined" size="small" sx={{
        borderColor: "rgba(99,102,241,0.3)", color: "#818CF8", fontWeight: 600,
        fontSize: "0.75rem", px: 2, display: { xs: "none", md: "flex" },
        "&:hover": { borderColor: "#818CF8", bgcolor: "rgba(99,102,241,0.08)" },
      }}>
        Ver boletos
      </Button>
      <ArrowForwardIcon sx={{ color: "rgba(255,255,255,0.3)", fontSize: 18, display: { xs: "block", md: "none" } }} />
    </Box>
  );
}

/* ─── FALLBACK featured events (mock) when no API data ─── */

function FallbackFeaturedEvents() {
  const router = useRouter();

  const MOCK = [
    { id: 1, title: "Festival Electronica 2026", image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop", date: "12 Abr 2026", venue: "Arena Central", price: "$45", category: "Festivales", hot: true },
    { id: 2, title: "Maraton Ciudad 10K", image: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=600&h=400&fit=crop", date: "20 Abr 2026", venue: "Parque Metropolitano", price: "$25", category: "Carreras", hot: false },
    { id: 3, title: "Concierto Sinfonico", image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&h=400&fit=crop", date: "5 May 2026", venue: "Teatro Nacional", price: "$60", category: "Conciertos", hot: true },
    { id: 4, title: "Final Liga Nacional", image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=600&h=400&fit=crop", date: "15 May 2026", venue: "Estadio Olimpico", price: "$80", category: "Deportes", hot: false },
    { id: 5, title: "Tech Summit 2026", image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop", date: "1 Jun 2026", venue: "Centro de Convenciones", price: "$120", category: "Conferencias", hot: false },
    { id: 6, title: "Obra: El Fantasma", image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=400&fit=crop", date: "22 Jun 2026", venue: "Teatro Colon", price: "$35", category: "Teatro", hot: true },
  ];

  return (
    <Grid container spacing={3}>
      {MOCK.map((event) => (
        <Grid key={event.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{
            bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            cursor: "pointer", transition: "all 0.3s ease", overflow: "hidden",
            "&:hover": { transform: "translateY(-6px)", borderColor: "rgba(99,102,241,0.3)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", "& .event-image": { transform: "scale(1.05)" } },
          }} onClick={() => router.push(`/eventos/${event.id}`)}>
            <Box sx={{ position: "relative", overflow: "hidden" }}>
              <CardMedia component="img" height={200} image={event.image} alt={event.title} className="event-image" sx={{ transition: "transform 0.4s ease" }} />
              <Chip label={event.price} size="small" sx={{ position: "absolute", top: 12, right: 12, bgcolor: "rgba(0,0,0,0.7)", color: "#F59E0B", fontWeight: 700, backdropFilter: "blur(4px)" }} />
              <Chip label={event.category} size="small" sx={{ position: "absolute", top: 12, left: 12, bgcolor: "rgba(99,102,241,0.85)", color: "#fff", fontWeight: 600, fontSize: "0.75rem" }} />
              {event.hot && <Chip label="HOT" size="small" icon={<TrendingUpIcon sx={{ color: "#fff !important", fontSize: 14 }} />} sx={{ position: "absolute", bottom: 12, left: 12, bgcolor: "#EF4444", color: "#fff", fontWeight: 700, fontSize: "0.65rem" }} />}
            </Box>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fff", mb: 1.5, lineHeight: 1.3 }}>{event.title}</Typography>
              <Stack spacing={0.8}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><CalendarMonthIcon sx={{ fontSize: 16, color: "#818CF8" }} /><Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>{event.date}</Typography></Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><LocationOnIcon sx={{ fontSize: 16, color: "#F59E0B" }} /><Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>{event.venue}</Typography></Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

/* =================================================================
   AUTHENTICATED DASHBOARD
   ================================================================= */

function AuthenticatedDashboard({ name }: { name: string }) {
  const router = useRouter();

  return (
    <Box sx={{ bgcolor: "#0F0D2E", color: "#fff", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Bienvenido, {name}</Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)" }}>Selecciona un modulo para comenzar.</Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 5 }}>
          {[
            { label: "Eventos activos", value: "--", icon: <EventIcon />, color: "#6366F1" },
            { label: "Boletos vendidos", value: "--", icon: <ConfirmationNumberIcon />, color: "#10B981" },
            { label: "Venues", value: "--", icon: <StadiumIcon />, color: "#F59E0B" },
            { label: "Escaneos hoy", value: "--", icon: <QrCodeScannerIcon />, color: "#8B5CF6" },
          ].map((s) => (
            <Grid key={s.label} size={{ xs: 6, md: 3 }}>
              <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Box sx={{ color: s.color, mb: 1 }}>{s.icon}</Box>
                <Typography variant="h5" fontWeight={800}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {DASHBOARD_CARDS.map((card) => (
            <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{
                bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer", transition: "all 0.3s ease", height: "100%",
                "&:hover": { transform: "translateY(-4px)", borderColor: `${card.color}40`, boxShadow: `0 12px 32px ${card.color}15` },
              }} onClick={() => router.push(card.href)}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 3,
                    background: `linear-gradient(135deg, ${card.color}20, ${card.color}08)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: card.color, mb: 2.5,
                  }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: "#fff", mb: 0.5 }}>{card.title}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{card.desc}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 2, color: card.color }}>
                    <Typography variant="body2" fontWeight={600} sx={{ mr: 0.5 }}>Abrir</Typography>
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
