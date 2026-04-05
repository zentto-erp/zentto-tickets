"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
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
import dynamic from "next/dynamic";
import { useEvent, useEventAvailability, usePricingZones, useHoldSeats } from "@/hooks/useEvents";
import { useRouter } from "next/navigation";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { SeatAvailability } from "@/types";

const SeatMapRenderer = dynamic(() => import("@/components/SeatMap/SeatMapRenderer"), {
  ssr: false, loading: () => <Skeleton variant="rectangular" height={550} />,
});

export default function EventDetailPage() {
  const { id } = useParams();
  const eventId = Number(id);
  const router = useRouter();
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const { data: overviewAvailability } = useEventAvailability(eventId);
  const { data: sectionAvailability } = useEventAvailability(eventId, selectedSectionId ?? undefined);
  const { data: pricingZones } = usePricingZones(eventId);
  const holdMutation = useHoldSeats();
  const sections = overviewAvailability?.sections ?? [];
  const seats = sectionAvailability?.seats;

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

  if (eventLoading) return <Box p={4} maxWidth={1400} mx="auto"><Skeleton variant="text" width={300} height={48} /><Skeleton variant="rectangular" height={550} sx={{ mt: 3 }} /></Box>;
  if (!event) return <Box p={4} textAlign="center"><Typography variant="h5" color="text.secondary">Evento no encontrado</Typography><Button onClick={() => router.push("/eventos")} sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>Volver</Button></Box>;

  const sectionInfo = selectedSectionId ? sections.find((s) => s.SectionId === selectedSectionId) : null;
  const sectionZone = selectedSectionId ? pricingZones?.find((z) => z.SectionIds?.includes(selectedSectionId)) : null;

  return (
    <Box px={{ xs: 2, md: 4 }} py={4} maxWidth={1400} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="start" mb={3}>
        <Box>
          <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => router.push("/eventos")} sx={{ mb: 1 }}>Eventos</Button>
          <Typography variant="h4" fontWeight={700}>{event.Name}</Typography>
          <Typography variant="body1" color="text.secondary">{event.VenueName} &mdash; {event.City}, {event.Country}</Typography>
          <Typography variant="body2" color="text.secondary">{new Date(event.EventDate).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography>
        </Box>
        <Chip label={event.Status === "on_sale" ? "En venta" : event.Status} color={event.Status === "on_sale" ? "success" : "default"} size="medium" />
      </Stack>
      <Divider sx={{ mb: 3 }} />
      <Box display="flex" gap={3} flexWrap="wrap">
        <Paper sx={{ flex: 1, minWidth: { xs: "100%", md: 600 }, p: 2, bgcolor: "#0F172A", borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" color="rgba(255,255,255,0.7)">
              {selectedSectionId ? `${sectionInfo?.Code ?? sectionInfo?.Name ?? "Seccion"} ${sectionZone ? `- $${Number(sectionZone.Price).toFixed(2)} ${sectionZone.Currency}` : ""}` : "Selecciona una seccion"}
            </Typography>
            {selectedSectionId && <Typography variant="caption" color="rgba(255,255,255,0.5)">Scroll para zoom</Typography>}
          </Stack>
          <SeatMapRenderer sections={sections} seats={seats} selectedSectionId={selectedSectionId} selectedSeats={selectedSeats}
            onSectionClick={handleSectionClick} onSeatClick={handleSeatClick} onBackToOverview={handleBackToOverview}
            width={850} height={550} maxTickets={event.MaxTicketsPerOrder} />
        </Paper>
        <Paper sx={{ width: { xs: "100%", md: 340 }, p: 3, alignSelf: "flex-start", borderRadius: 3 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            <EventSeatIcon color="primary" /><Typography variant="h6" fontWeight={600}>Tu seleccion</Typography>
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
              <Typography variant="body2" color="text.secondary">{selectedSectionId ? "Haz clic en los asientos verdes." : "Selecciona una seccion en el mapa."}</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ maxHeight: 200, overflow: "auto", mb: 2 }}>
                {selectedSeatDetails.map((seat) => (
                  <Stack key={seat.SeatId} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75, px: 1, mb: 0.5, borderRadius: 1, bgcolor: "action.hover" }}>
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
              <Alert severity="info" sx={{ mb: 2, py: 0 }}><Typography variant="caption">Max {event.MaxTicketsPerOrder} boletos. Reserva 10 min.</Typography></Alert>
              <Button variant="contained" fullWidth size="large"
                startIcon={holdMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <ShoppingCartIcon />}
                onClick={handleHoldAndCheckout} disabled={holdMutation.isPending} sx={{ borderRadius: 2, py: 1.5 }}>
                {holdMutation.isPending ? "Reservando..." : `Pagar $${selectedTotal.toFixed(2)}`}
              </Button>
              {holdMutation.isError && <Alert severity="error" sx={{ mt: 1 }}>Error al reservar.</Alert>}
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
