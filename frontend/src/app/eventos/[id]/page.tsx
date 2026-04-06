"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Collapse from "@mui/material/Collapse";
import Avatar from "@mui/material/Avatar";
import dynamic from "next/dynamic";
import { useEvent, useEventAvailability, usePricingZones, useHoldSeats } from "@/hooks/useEvents";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ShareIcon from "@mui/icons-material/Share";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import TimerIcon from "@mui/icons-material/Timer";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import type { SeatAvailability } from "@/types";

const SeatMapRenderer = dynamic(() => import("@/components/SeatMap/SeatMapRenderer"), {
  ssr: false, loading: () => <Skeleton variant="rectangular" height={550} />,
});

/* ── Fallback images by event type ── */
const HERO_IMAGES: Record<string, string> = {
  concert: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=500&fit=crop",
  sports: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&h=500&fit=crop",
  theater: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=500&fit=crop",
  festival: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=500&fit=crop",
  race: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=1200&h=500&fit=crop",
  general: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=500&fit=crop",
};

/* ── Countdown hook ── */
function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });

  useEffect(() => {
    if (!targetDate) return;
    function calc() {
      const diff = new Date(targetDate!).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isPast: false,
      };
    }
    setTimeLeft(calc());
    const iv = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(iv);
  }, [targetDate]);

  return timeLeft;
}

export default function EventDetailPage() {
  const { id } = useParams();
  const eventId = Number(id);
  const router = useRouter();
  const ticketsRef = useRef<HTMLDivElement>(null);
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { data: overviewAvailability } = useEventAvailability(eventId);
  const { data: sectionAvailability } = useEventAvailability(eventId, selectedSectionId ?? undefined);
  const { data: pricingZones } = usePricingZones(eventId);
  const holdMutation = useHoldSeats();
  const sections = overviewAvailability?.sections ?? [];
  const seats = sectionAvailability?.seats;

  const countdown = useCountdown(event?.EventDate ?? null);

  const seatPriceMap = useMemo(() => {
    if (!pricingZones || !selectedSectionId) return new Map<number, number>();
    const zone = pricingZones.find((z) => z.SectionIds?.includes(selectedSectionId));
    if (!zone || !seats) return new Map<number, number>();
    const map = new Map<number, number>();
    for (const seat of seats) map.set(seat.SeatId, Number(zone.Price));
    return map;
  }, [pricingZones, selectedSectionId, seats]);

  const selectedTotal = useMemo(() => selectedSeats.reduce((sum, id) => sum + (seatPriceMap.get(id) ?? 0), 0), [selectedSeats, seatPriceMap]);
  const currency = pricingZones?.[0]?.Currency ?? "USD";
  const selectedSeatDetails = useMemo(() => {
    if (!seats) return [];
    return selectedSeats.map((id) => seats.find((s) => s.SeatId === id)).filter(Boolean) as SeatAvailability[];
  }, [selectedSeats, seats]);

  const minPrice = useMemo(() => {
    if (!pricingZones?.length) return null;
    return Math.min(...pricingZones.map((z) => Number(z.Price)));
  }, [pricingZones]);

  const handleSectionClick = useCallback((sectionId: number) => { setSelectedSectionId(sectionId); setSelectedSeats([]); }, []);
  const handleSeatClick = useCallback((seatId: number) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) return prev.filter((id) => id !== seatId);
      if (prev.length >= (event?.MaxTicketsPerOrder ?? 6)) return prev;
      return [...prev, seatId];
    });
  }, [event]);
  const handleBackToOverview = useCallback(() => { setSelectedSectionId(null); setSelectedSeats([]); }, []);
  const handleHoldAndCheckout = useCallback(async () => {
    if (selectedSeats.length === 0) return;
    try {
      await holdMutation.mutateAsync({ eventId, seatIds: selectedSeats });
      router.push(`/checkout?eventId=${eventId}&seats=${selectedSeats.join(",")}`);
    } catch (err) { console.error("Error al reservar:", err); }
  }, [eventId, selectedSeats, holdMutation, router]);

  function scrollToTickets() {
    ticketsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: event?.Name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  /* ── Loading ── */
  if (eventLoading) {
    return (
      <Box sx={{ bgcolor: "#0F0D2E", minHeight: "100vh" }}>
        <Skeleton variant="rectangular" height={400} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="text" width={400} height={48} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
          <Skeleton variant="text" width={250} height={24} sx={{ bgcolor: "rgba(255,255,255,0.05)", mt: 1 }} />
        </Container>
      </Box>
    );
  }

  /* ── Not found ── */
  if (!event) {
    return (
      <Box sx={{ bgcolor: "#0F0D2E", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box textAlign="center">
          <ConfirmationNumberIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.15)", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Evento no encontrado</Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mb: 3 }}>
            Este evento no existe o ya no esta disponible.
          </Typography>
          <Button onClick={() => router.push("/eventos")} startIcon={<ArrowBackIcon />} variant="contained">
            Ver eventos
          </Button>
        </Box>
      </Box>
    );
  }

  const heroImage = event.ImageUrl || HERO_IMAGES[event.EventType] || HERO_IMAGES.general;
  const eventDate = new Date(event.EventDate);
  const sectionInfo = selectedSectionId ? sections.find((s) => s.SectionId === selectedSectionId) : null;
  const sectionZone = selectedSectionId ? pricingZones?.find((z) => z.SectionIds?.includes(selectedSectionId)) : null;
  const isUpcoming = !countdown.isPast && countdown.days <= 30;

  return (
    <Box sx={{ bgcolor: "#0F0D2E", color: "#fff", minHeight: "100vh" }}>

      {/* ═══════════ HERO IMAGE ═══════════ */}
      <Box sx={{ position: "relative", height: { xs: 280, sm: 360, md: 440 }, overflow: "hidden" }}>
        <Box
          component="img"
          src={heroImage}
          alt={event.Name}
          sx={{
            width: "100%", height: "100%", objectFit: "cover",
            filter: "brightness(0.5)",
          }}
        />
        {/* Gradient overlay */}
        <Box sx={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, #0F0D2E 0%, rgba(15,13,46,0.4) 50%, rgba(15,13,46,0.2) 100%)",
        }} />

        {/* Top bar */}
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, p: { xs: 2, md: 3 }, display: "flex", justifyContent: "space-between" }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push("/eventos")}
            sx={{ color: "#fff", bgcolor: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", "&:hover": { bgcolor: "rgba(0,0,0,0.5)" } }}
          >
            Eventos
          </Button>
          <Stack direction="row" spacing={1}>
            <IconBtn onClick={handleShare}><ShareIcon sx={{ fontSize: 20 }} /></IconBtn>
            <IconBtn onClick={() => setIsFavorite(!isFavorite)}>
              {isFavorite ? <FavoriteIcon sx={{ fontSize: 20, color: "#EF4444" }} /> : <FavoriteBorderIcon sx={{ fontSize: 20 }} />}
            </IconBtn>
          </Stack>
        </Box>

        {/* Hero content */}
        <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, p: { xs: 2, md: 4 } }}>
          <Container maxWidth="lg">
            <Stack direction="row" spacing={1.5} mb={2} flexWrap="wrap">
              <Chip
                label={event.Status === "on_sale" ? "En venta" : event.Status === "sold_out" ? "Agotado" : event.Status === "published" ? "Publicado" : event.Status}
                size="small"
                sx={{
                  bgcolor: event.Status === "on_sale" ? "#10B981" : event.Status === "sold_out" ? "#EF4444" : "rgba(255,255,255,0.2)",
                  color: "#fff", fontWeight: 600,
                }}
              />
              <Chip
                label={event.EventType === "concert" ? "Concierto" : event.EventType === "sports" ? "Deportes" : event.EventType === "theater" ? "Teatro" : event.EventType === "festival" ? "Festival" : event.EventType === "race" ? "Carrera" : "Evento"}
                size="small"
                sx={{ bgcolor: "rgba(99,102,241,0.8)", color: "#fff", fontWeight: 600 }}
              />
            </Stack>
            <Typography variant="h3" sx={{
              fontWeight: 900, fontSize: { xs: "1.6rem", sm: "2rem", md: "2.8rem" },
              lineHeight: 1.1, mb: 1, textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}>
              {event.Name}
            </Typography>
            {minPrice !== null && (
              <Typography variant="h6" sx={{ color: "#F59E0B", fontWeight: 700, fontSize: { xs: "1rem", md: "1.2rem" } }}>
                Desde ${minPrice.toFixed(2)} {currency}
              </Typography>
            )}
          </Container>
        </Box>
      </Box>

      {/* ═══════════ CONTENT ═══════════ */}
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Box sx={{ display: "flex", gap: { xs: 0, md: 4 }, flexDirection: { xs: "column", md: "row" } }}>

          {/* Left column — Event details */}
          <Box sx={{ flex: 1, minWidth: 0 }}>

            {/* ── Date / Time / Countdown ── */}
            <Paper sx={{
              p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 4 }} alignItems={{ sm: "center" }}>
                {/* Date */}
                <Stack direction="row" alignItems="center" gap={2}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 2,
                    bgcolor: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <Typography variant="caption" sx={{ color: "#818CF8", fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase", lineHeight: 1 }}>
                      {eventDate.toLocaleDateString("es", { month: "short" })}
                    </Typography>
                    <Typography variant="h6" sx={{ color: "#fff", fontWeight: 900, lineHeight: 1 }}>
                      {eventDate.getDate()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fff" }}>
                      {eventDate.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <AccessTimeIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }} />
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                        {eventDate.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                        {event.DoorsOpen && ` (Puertas: ${new Date(event.DoorsOpen).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })})`}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>

                {/* Countdown */}
                {isUpcoming && (
                  <Box sx={{
                    display: "flex", gap: 1.5, ml: { sm: "auto" },
                    p: 1.5, borderRadius: 2,
                    bgcolor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                  }}>
                    <TimerIcon sx={{ color: "#F59E0B", fontSize: 20, alignSelf: "center" }} />
                    {[
                      { val: countdown.days, label: "D" },
                      { val: countdown.hours, label: "H" },
                      { val: countdown.minutes, label: "M" },
                      { val: countdown.seconds, label: "S" },
                    ].map((u) => (
                      <Box key={u.label} sx={{ textAlign: "center", minWidth: 32 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#F59E0B", fontSize: "1.1rem", lineHeight: 1 }}>
                          {String(u.val).padStart(2, "0")}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontSize: "0.6rem" }}>
                          {u.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* ── Venue / Location ── */}
            <Paper sx={{
              p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <Stack direction="row" alignItems="center" gap={2}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: 2,
                  bgcolor: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <LocationOnIcon sx={{ color: "#F59E0B" }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{event.VenueName || "Venue"}</Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                    {[event.City, event.Country].filter(Boolean).join(", ")}
                  </Typography>
                </Box>
              </Stack>
              {/* Mini map placeholder */}
              <Box sx={{
                mt: 2, height: 140, borderRadius: 2, overflow: "hidden",
                bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.25)" }}>
                  Mapa del venue
                </Typography>
              </Box>
            </Paper>

            {/* ── Description ── */}
            {event.Description && (
              <Paper sx={{
                p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Acerca del evento</Typography>
                <Collapse in={descExpanded} collapsedSize={80}>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                    {event.Description}
                  </Typography>
                </Collapse>
                {event.Description.length > 200 && (
                  <Button
                    size="small"
                    endIcon={descExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setDescExpanded(!descExpanded)}
                    sx={{ mt: 1, color: "#818CF8", fontWeight: 600 }}
                  >
                    {descExpanded ? "Ver menos" : "Ver mas"}
                  </Button>
                )}
              </Paper>
            )}

            {/* ── Pricing zones ── */}
            {pricingZones && pricingZones.length > 0 && (
              <Paper sx={{
                p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  <ConfirmationNumberIcon sx={{ fontSize: 20, mr: 1, verticalAlign: "text-bottom", color: "#818CF8" }} />
                  Tickets y precios
                </Typography>
                <Stack spacing={1.5}>
                  {pricingZones.map((zone) => (
                    <Box key={zone.ZoneId} sx={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      p: 2, borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                      transition: "all 0.2s",
                      "&:hover": { borderColor: zone.Color, bgcolor: "rgba(255,255,255,0.05)" },
                    }}>
                      <Stack direction="row" alignItems="center" gap={2}>
                        <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: zone.Color, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>{zone.Name}</Typography>
                          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
                            Selecciona en el mapa
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography variant="h6" fontWeight={800} sx={{ color: "#F59E0B" }}>
                        ${Number(zone.Price).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}

            {/* ── Organizer ── */}
            <Paper sx={{
              p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Organizador</Typography>
              <Stack direction="row" alignItems="center" gap={2}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: "#6366F1" }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>Zentto Events</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
                    Organizador verificado
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* ═══════ Right column — Seat Map + Selection ═══════ */}
          <Box ref={ticketsRef} sx={{ width: { xs: "100%", md: 460 }, flexShrink: 0 }}>
            {/* Seat map */}
            <Paper sx={{
              p: 2, mb: 2, borderRadius: 3,
              bgcolor: "#0F172A", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
                  {selectedSectionId
                    ? `${sectionInfo?.Code ?? sectionInfo?.Name ?? "Seccion"} ${sectionZone ? `- $${Number(sectionZone.Price).toFixed(2)} ${sectionZone.Currency}` : ""}`
                    : "Selecciona una seccion"}
                </Typography>
                {selectedSectionId && (
                  <Typography variant="caption" color="rgba(255,255,255,0.5)">Scroll para zoom</Typography>
                )}
              </Stack>
              <SeatMapRenderer
                sections={sections}
                seats={seats}
                selectedSectionId={selectedSectionId}
                selectedSeats={selectedSeats}
                onSectionClick={handleSectionClick}
                onSeatClick={handleSeatClick}
                onBackToOverview={handleBackToOverview}
                width={420}
                height={400}
                maxTickets={event.MaxTicketsPerOrder}
              />
            </Paper>

            {/* Selection panel */}
            <Paper sx={{
              p: 3, borderRadius: 3, position: "sticky", top: 80,
              bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <Stack direction="row" alignItems="center" gap={1} mb={2}>
                <EventSeatIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>Tu seleccion</Typography>
              </Stack>

              {pricingZones && pricingZones.length > 0 && !selectedSectionId && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Precios por zona</Typography>
                  {pricingZones.map((zone) => (
                    <Stack key={zone.ZoneId} direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: zone.Color }} />
                        <Typography variant="body2">{zone.Name}</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={600}>${Number(zone.Price).toFixed(2)} {zone.Currency}</Typography>
                    </Stack>
                  ))}
                  <Divider sx={{ my: 2 }} />
                </Box>
              )}

              {selectedSeats.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <EventSeatIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {selectedSectionId ? "Haz clic en los asientos verdes." : "Selecciona una seccion en el mapa."}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ maxHeight: 200, overflow: "auto", mb: 2 }}>
                    {selectedSeatDetails.map((seat) => (
                      <Stack key={seat.SeatId} direction="row" justifyContent="space-between" alignItems="center"
                        sx={{ py: 0.75, px: 1, mb: 0.5, borderRadius: 1, bgcolor: "action.hover" }}>
                        <Typography variant="body2">Fila {seat.RowLabel} - Asiento {seat.SeatNumber}</Typography>
                        <Typography variant="body2" fontWeight={600}>${(seatPriceMap.get(seat.SeatId) ?? 0).toFixed(2)}</Typography>
                      </Stack>
                    ))}
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>Total</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">${selectedTotal.toFixed(2)} {currency}</Typography>
                  </Stack>
                  <Alert severity="info" sx={{ mb: 2, py: 0 }}>
                    <Typography variant="caption">Max {event.MaxTicketsPerOrder} boletos. Reserva 10 min.</Typography>
                  </Alert>
                  <Button
                    variant="contained" fullWidth size="large"
                    startIcon={holdMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <ShoppingCartIcon />}
                    onClick={handleHoldAndCheckout}
                    disabled={holdMutation.isPending}
                    sx={{
                      borderRadius: 2, py: 1.5,
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      fontWeight: 700, fontSize: "1rem",
                      "&:hover": { background: "linear-gradient(135deg, #4F46E5, #7C3AED)" },
                    }}
                  >
                    {holdMutation.isPending ? "Reservando..." : `Comprar boletos - $${selectedTotal.toFixed(2)}`}
                  </Button>
                  {holdMutation.isError && <Alert severity="error" sx={{ mt: 1 }}>Error al reservar.</Alert>}
                </>
              )}
            </Paper>
          </Box>
        </Box>
      </Container>

      {/* ═══════════ FLOATING CTA (mobile) ═══════════ */}
      {event.Status === "on_sale" && (
        <Box sx={{
          display: { xs: "block", md: "none" },
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1100,
          p: 2, bgcolor: "rgba(15,13,46,0.95)", backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(99,102,241,0.15)",
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              {minPrice !== null && (
                <Typography variant="subtitle2" sx={{ color: "#F59E0B", fontWeight: 700 }}>
                  Desde ${minPrice.toFixed(2)}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
                {selectedSeats.length > 0 ? `${selectedSeats.length} seleccionados` : "Selecciona asientos"}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={scrollToTickets}
              sx={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                fontWeight: 700, px: 3,
                "&:hover": { background: "linear-gradient(135deg, #4F46E5, #7C3AED)" },
              }}
            >
              {selectedSeats.length > 0 ? "Pagar" : "Comprar boletos"}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

/* ── Small icon button helper ── */
function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: 40, height: 40, borderRadius: "50%",
        bgcolor: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", cursor: "pointer", transition: "all 0.2s",
        "&:hover": { bgcolor: "rgba(0,0,0,0.5)" },
      }}
    >
      {children}
    </Box>
  );
}
