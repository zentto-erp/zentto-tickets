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
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import StadiumIcon from "@mui/icons-material/Stadium";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import { useVenues } from "@/hooks/useVenues";
import { useRouter } from "next/navigation";

const COUNTRY_FLAGS: Record<string, string> = {
  VE: "🇻🇪", ES: "🇪🇸", US: "🇺🇸", CO: "🇨🇴", MX: "🇲🇽", AR: "🇦🇷",
};

export default function VenuesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useVenues({ search });
  const venues = data?.rows ?? [];

  return (
    <Box px={4} py={4} maxWidth={1200} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Venues</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push("/venues/editor")}>
          Nuevo Venue
        </Button>
      </Stack>

      <TextField
        placeholder="Buscar venues..."
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
        {venues.map((venue) => (
          <Grid key={venue.VenueId} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{ cursor: "pointer", transition: "all 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: 6 } }}
              onClick={() => router.push(`/venues/${venue.VenueId}`)}
            >
              <Box height={140} bgcolor="#1E293B" display="flex" alignItems="center" justifyContent="center">
                <StadiumIcon sx={{ fontSize: 56, color: "primary.main" }} />
              </Box>
              <CardContent>
                <Typography variant="h6" fontWeight={600} noWrap>{venue.Name}</Typography>
                <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
                  <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {venue.City}, {venue.Country}
                  </Typography>
                  <Typography variant="body2" ml={0.5}>
                    {COUNTRY_FLAGS[venue.Country] ?? ""}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
                  <PeopleIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {venue.Capacity.toLocaleString()} capacidad
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!isLoading && venues.length === 0 && (
        <Box textAlign="center" py={8}>
          <StadiumIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No hay venues</Typography>
        </Box>
      )}
    </Box>
  );
}
