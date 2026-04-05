"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import { useCreateVenue } from "@/hooks/useVenues";
import { useRouter } from "next/navigation";

const VenueDesigner = dynamic(
  () => import("@/components/VenueEditor/VenueDesigner"),
  { ssr: false }
);

export default function VenueEditorPage() {
  const router = useRouter();
  const createVenue = useCreateVenue();

  async function handleSave(sections: any[]) {
    // TODO: Implementar flujo completo de guardado
    // 1. Crear venue
    // 2. Crear configuration
    // 3. Crear sections con polígonos
    // 4. Generar asientos por sección
    console.log("Guardando venue con secciones:", sections);
    alert(`Venue guardado con ${sections.length} secciones. Total asientos: ${sections.reduce((sum: number, s: any) => sum + (s.isGA ? 0 : s.rows * s.seatsPerRow), 0)}`);
  }

  return (
    <Box px={4} py={4} height="calc(100vh - 64px)">
      <Typography variant="h4" fontWeight={700} mb={2}>
        Editor de Venue
      </Typography>
      <Box height="calc(100% - 60px)">
        <VenueDesigner
          venueName="Nuevo Venue"
          onSave={handleSave}
        />
      </Box>
    </Box>
  );
}
