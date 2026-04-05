"use client";

import React, { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import dynamic from "next/dynamic";
import { useEvent, useEventAvailability, useHoldSeats, useReleaseSeats } from "@/hooks/useEvents";
import { useRouter } from "next/navigation";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

const SeatMapRenderer = dynamic(
  () => import("@/components/SeatMap/SeatMapRenderer"),
  { ssr: false }
);

export default function EventDetailPage() {
  const { id } = useParams();
  const eventId = Number(id);
  const router = useRouter();

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const { data: availability } = useEventAvailability(eventId, selectedSectionId ?? undefined);
  const holdMutation = useHoldSeats();
  const releaseMutation = useReleaseSeats();

  const handleSectionClick = useCallback((sectionId: number) => {
    setSelectedSectionId(sectionId);
    setSelectedSeats([]);
  }, []);

  const handleSeatClick = useCallback((seatId: number) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) return prev.filter((id) => id !== seatId);
      if (prev.length >= (event?.MaxTicketsPerOrder ?? 6)) return prev;
      return [...prev, seatId];
    });
  }, [event]);

  const handleBackToOverview = useCallback(() => {
    setSelectedSectionId(null);
    setSelectedSeats([]);
  }, []);

  const handleHoldAndCheckout = useCallback(async () => {
    if (selectedSeats.length === 0) return;
    try {
      await holdMutation.mutateAsync({ eventId, seatIds: selectedSeats });
      // Navegar al checkout con los asientos seleccionados
      const params = new URLSearchParams({
        eventId: String(eventId),
        seats: selectedSeats.join(","),
      });
      router.push(`/checkout?${params}`);
    } catch (err) {
      console.error("Error al reservar asientos:", err);
    }
  }, [eventId, selectedSeats, holdMutation, router]);

  if (eventLoading) return <Box p={4}><Typography>Cargando evento...</Typography></Box>;
  if (!event) return <Box p={4}><Typography>Evento no encontrado</Typography></Box>;

  return (
    <Box px={4} py={4} maxWidth={1400} mx="auto">
      {/* Header del evento */}
      <Stack direction="row" justifyContent="space-between" alignItems="start" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>{event.Name}</Typography>
          <Typography variant="body1" color="text.secondary">
            {event.VenueName} — {event.City}, {event.Country}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(event.EventDate).toLocaleDateString("es", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </Typography>
        </Box>
        <Chip
          label={event.Status}
          color={event.Status === "on_sale" ? "success" : "default"}
          size="medium"
        />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Mapa + Carrito */}
      <Box display="flex" gap={3} flexWrap="wrap">
        {/* Mapa de asientos */}
        <Paper sx={{ flex: 1, minWidth: 600, p: 2, bgcolor: "#0F172A" }}>
          <Typography variant="subtitle2" color="rgba(255,255,255,0.7)" mb={1}>
            {selectedSectionId ? "Selecciona tus asientos" : "Selecciona una sección"}
          </Typography>
          <SeatMapRenderer
            sections={availability?.sections ?? []}
            seats={availability?.seats}
            selectedSectionId={selectedSectionId}
            selectedSeats={selectedSeats}
            onSectionClick={handleSectionClick}
            onSeatClick={handleSeatClick}
            onBackToOverview={handleBackToOverview}
            width={850}
            height={550}
          />
        </Paper>

        {/* Panel de compra */}
        <Paper sx={{ width: 320, p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Tu selección
          </Typography>

          {selectedSeats.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Selecciona asientos en el mapa para continuar.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {selectedSeats.length} asiento{selectedSeats.length > 1 ? "s" : ""} seleccionado{selectedSeats.length > 1 ? "s" : ""}
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                Máximo {event.MaxTicketsPerOrder} boletos por orden
              </Alert>

              <Divider sx={{ my: 2 }} />

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={handleHoldAndCheckout}
                disabled={holdMutation.isPending}
              >
                {holdMutation.isPending ? "Reservando..." : "Continuar al pago"}
              </Button>

              <Typography variant="caption" display="block" color="text.secondary" mt={1} textAlign="center">
                Los asientos se reservan por 10 minutos
              </Typography>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
