"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useEvents } from "@/hooks/useEvents";
import { useRouter } from "next/navigation";
import type { EventStatus } from "@/types";

const STATUS_COLORS: Record<EventStatus, "default" | "primary" | "success" | "warning" | "error" | "info"> = {
  draft: "default",
  published: "info",
  on_sale: "success",
  sold_out: "warning",
  completed: "primary",
  cancelled: "error",
};

const STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  on_sale: "En venta",
  sold_out: "Agotado",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

export default function EventosPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useEvents({ search });

  const events = data?.rows ?? [];

  return (
    <Box px={4} py={4} maxWidth={1200} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Eventos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/eventos/nuevo")}>
          Nuevo Evento
        </Button>
      </Stack>

      <TextField
        placeholder="Buscar eventos..."
        size="small"
        fullWidth
        sx={{ mb: 3, maxWidth: 400 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          },
        }}
      />

      {isLoading && <Typography>Cargando...</Typography>}

      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid key={event.EventId} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{ cursor: "pointer", transition: "all 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: 6 } }}
              onClick={() => router.push(`/eventos/${event.EventId}`)}
            >
              {event.ImageUrl && (
                <CardMedia component="img" height={160} image={event.ImageUrl} alt={event.Name} />
              )}
              {!event.ImageUrl && (
                <Box height={160} bgcolor="primary.main" display="flex" alignItems="center" justifyContent="center">
                  <CalendarTodayIcon sx={{ fontSize: 48, color: "#FFF" }} />
                </Box>
              )}
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1}>
                  <Typography variant="h6" fontWeight={600} noWrap sx={{ flex: 1 }}>
                    {event.Name}
                  </Typography>
                  <Chip
                    label={STATUS_LABELS[event.Status]}
                    color={STATUS_COLORS[event.Status]}
                    size="small"
                  />
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.5} mb={0.5}>
                  <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {new Date(event.EventDate).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Typography>
                </Stack>
                {event.VenueName && (
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {event.VenueName} — {event.City}
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!isLoading && events.length === 0 && (
        <Box textAlign="center" py={8}>
          <CalendarTodayIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No hay eventos</Typography>
          <Typography variant="body2" color="text.secondary">Crea tu primer evento para comenzar a vender boletos.</Typography>
        </Box>
      )}
    </Box>
  );
}
