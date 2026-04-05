"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function CarrerasPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["races", search],
    queryFn: () => api.get<any>(`/v1/races?search=${search}`),
  });

  const races = data?.rows ?? [];

  const DISTANCE_COLORS: Record<string, string> = {
    "5K": "#10B981",
    "10K": "#3B82F6",
    "21K": "#F59E0B",
    "42K": "#EF4444",
  };

  return (
    <Box px={4} py={4} maxWidth={1200} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Carreras</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/carreras/nueva")}>
          Nueva Carrera
        </Button>
      </Stack>

      <TextField
        placeholder="Buscar carreras..."
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

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {races.map((race: any) => {
          const pct = race.MaxParticipants > 0
            ? Math.round((Number(race.RegisteredCount) / race.MaxParticipants) * 100)
            : 0;

          return (
            <Grid key={race.RaceId} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                  borderTop: `4px solid ${DISTANCE_COLORS[race.Distance] || "#6366F1"}`,
                }}
                onClick={() => router.push(`/carreras/${race.RaceId}`)}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" mb={1}>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>{race.EventName}</Typography>
                      <Chip
                        label={race.Distance}
                        size="small"
                        sx={{
                          bgcolor: DISTANCE_COLORS[race.Distance] || "#6366F1",
                          color: "#FFF",
                          fontWeight: 700,
                          mt: 0.5,
                        }}
                      />
                    </Box>
                    <DirectionsRunIcon sx={{ fontSize: 36, color: DISTANCE_COLORS[race.Distance] || "#6366F1" }} />
                  </Stack>

                  <Stack direction="row" alignItems="center" gap={0.5} mt={1}>
                    <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {race.EventDate && new Date(race.EventDate).toLocaleDateString("es", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
                    <PeopleIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {race.RegisteredCount} / {race.MaxParticipants} inscritos
                    </Typography>
                  </Stack>

                  <Box mt={1.5}>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: "rgba(0,0,0,0.1)",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981",
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                      {pct}% ocupación
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {!isLoading && races.length === 0 && (
        <Box textAlign="center" py={8}>
          <DirectionsRunIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No hay carreras</Typography>
          <Typography variant="body2" color="text.secondary">
            Crea un evento tipo "carrera" y agrega distancias, categorías e inscripciones.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
