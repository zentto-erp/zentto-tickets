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
import CardActions from "@mui/material/CardActions";
import EventIcon from "@mui/icons-material/Event";
import StadiumIcon from "@mui/icons-material/Stadium";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import BarChartIcon from "@mui/icons-material/BarChart";

const CARDS = [
  { title: "Eventos", desc: "Crear y gestionar eventos, conciertos, partidos", icon: <EventIcon sx={{ fontSize: 48 }} />, href: "/eventos", color: "#6366F1" },
  { title: "Venues", desc: "Estadios, arenas, teatros — editor de secciones", icon: <StadiumIcon sx={{ fontSize: 48 }} />, href: "/venues", color: "#F59E0B" },
  { title: "Boletos", desc: "Mis órdenes y tickets con QR", icon: <ConfirmationNumberIcon sx={{ fontSize: 48 }} />, href: "/boletos", color: "#10B981" },
  { title: "Carreras", desc: "Inscripciones, dorsales, tiempos — 5K, 10K, maratón", icon: <DirectionsRunIcon sx={{ fontSize: 48 }} />, href: "/carreras", color: "#EF4444" },
  { title: "Escaneo", desc: "Validar tickets QR en puerta", icon: <QrCodeScannerIcon sx={{ fontSize: 48 }} />, href: "/scan", color: "#8B5CF6" },
  { title: "Dashboard", desc: "Ventas, ocupación, analytics en tiempo real", icon: <BarChartIcon sx={{ fontSize: 48 }} />, href: "/dashboard", color: "#0EA5E9" },
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;

  if (!session) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={3} px={2}>
        <StadiumIcon sx={{ fontSize: 80, color: "primary.main" }} />
        <Typography variant="h3" fontWeight={700} textAlign="center">
          Zentto Tickets
        </Typography>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          Eventos, boletos y experiencias
        </Typography>
        <Button variant="contained" size="large" onClick={() => router.push("/login")} sx={{ mt: 2, px: 6 }}>
          Iniciar Sesión
        </Button>
      </Box>
    );
  }

  return (
    <Box px={4} py={4} maxWidth={1200} mx="auto">
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Zentto Tickets
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Bienvenido, {session.user?.name}. Selecciona un módulo para comenzar.
      </Typography>

      <Grid container spacing={3}>
        {CARDS.map((card) => (
          <Grid key={card.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                height: "100%",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
                borderTop: `4px solid ${card.color}`,
              }}
              onClick={() => router.push(card.href)}
            >
              <CardContent>
                <Box color={card.color} mb={2}>{card.icon}</Box>
                <Typography variant="h6" fontWeight={600}>{card.title}</Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {card.desc}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" sx={{ color: card.color }}>Abrir</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
