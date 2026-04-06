"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CircularProgress from "@mui/material/CircularProgress";
import EventIcon from "@mui/icons-material/Event";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import StadiumIcon from "@mui/icons-material/Stadium";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useRouter } from "next/navigation";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import { useDashboardStats, useDashboardSales, useDashboardUpcomingEvents, useDashboardRaceStats, useDashboardVenueOccupancy } from "@/hooks/useDashboard";
import { useErpSyncStats, useErpSyncRecent } from "@/hooks/useErpSync";
import { brandColors } from "@/components/erp/theme";

const DC: Record<string, string> = { "5K": "#10B981", "10K": "#3B82F6", "21K": "#F59E0B", "42K": "#EF4444" };

export default function DashboardPage() {
  const router = useRouter();
  const [sp, setSp] = useState("month");
  const { data: stats, isLoading } = useDashboardStats();
  const { data: sales } = useDashboardSales(sp);
  const { data: upcoming } = useDashboardUpcomingEvents();
  const { data: races } = useDashboardRaceStats();
  const { data: venues } = useDashboardVenueOccupancy();
  const { data: syncStats } = useErpSyncStats();
  const { data: syncRecent } = useErpSyncRecent(10);

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  const kpiCards = [
    { label: "Eventos activos", value: stats?.activeEvents ?? 0, icon: <EventIcon />, color: brandColors.statBlue },
    { label: "Boletos vendidos hoy", value: stats?.totalTicketsSold ?? 0, icon: <ConfirmationNumberIcon />, color: brandColors.statTeal },
    { label: "Revenue hoy", value: `$${(stats?.revenueToday ?? 0).toLocaleString("es", { minimumFractionDigits: 2 })}`, icon: <AttachMoneyIcon />, color: brandColors.statOrange },
    { label: "Escaneos hoy", value: stats?.scannedToday ?? 0, icon: <QrCodeScannerIcon />, color: brandColors.statRed },
    { label: "Venues", value: stats?.totalVenues ?? 0, icon: <StadiumIcon />, color: brandColors.shortcutGreen },
    { label: "Inscritos carreras", value: stats?.totalRaceRegistrations ?? 0, icon: <DirectionsRunIcon />, color: brandColors.shortcutSlate },
  ];

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Resumen operativo en tiempo real</Typography>
        </Box>
      </Stack>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mt: 1, mb: 4 }}>
        {kpiCards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: card.color,
                color: "#fff",
                border: "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Typography variant="h4" fontWeight={700}>{card.value}</Typography>
              <Typography sx={{ opacity: 0.9, fontSize: "0.875rem" }}>{card.label}</Typography>
              <Box sx={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: "#fff", opacity: 0.3, "& svg": { fontSize: 32 } }}>
                {card.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Revenue summary + Sales grid */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 3, height: "100%", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <TrendingUpIcon sx={{ color: "#10B981", fontSize: 20 }} />
              <Typography variant="h6" fontWeight={700}>Revenue</Typography>
            </Stack>
            {[
              { label: "Hoy", value: stats?.revenueToday ?? 0 },
              { label: "Semana", value: stats?.revenueWeek ?? 0 },
              { label: "Mes", value: stats?.revenueMonth ?? 0 },
            ].map((x) => (
              <Stack key={x.label} direction="row" justifyContent="space-between" sx={{ py: 1.5, borderBottom: "1px solid #F1F5F9" }}>
                <Typography variant="body2" color="text.secondary">{x.label}</Typography>
                <Typography variant="body2" fontWeight={700}>${x.value.toLocaleString("es", { minimumFractionDigits: 2 })}</Typography>
              </Stack>
            ))}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>Ventas</Typography>
              <ToggleButtonGroup value={sp} exclusive onChange={(_, v) => v && setSp(v)} size="small">
                <ToggleButton value="week">7d</ToggleButton>
                <ToggleButton value="month">30d</ToggleButton>
                <ToggleButton value="year">1a</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            <TableContainer sx={{ maxHeight: 260 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Ordenes</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Boletos</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(sales ?? []).map((s: any) => (
                    <TableRow key={s.date} hover>
                      <TableCell>{s.date}</TableCell>
                      <TableCell align="right">{s.orders}</TableCell>
                      <TableCell align="right">{s.tickets}</TableCell>
                      <TableCell align="right">${s.revenue.toLocaleString("es", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                  {(sales ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary" variant="body2">Sin ventas</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Upcoming Events + Races */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <CalendarTodayIcon sx={{ fontSize: 20, color: "#6366F1" }} />
              <Typography variant="h6" fontWeight={700}>Proximos eventos</Typography>
            </Stack>
            <Stack spacing={1.5}>
              {(upcoming ?? []).map((ev: any) => (
                <Box
                  key={ev.eventId}
                  sx={{
                    p: 2, borderRadius: 2, bgcolor: "#F8FAFC", cursor: "pointer",
                    border: "1px solid #F1F5F9",
                    "&:hover": { bgcolor: "#F1F5F9", borderColor: "#E2E8F0" },
                  }}
                  onClick={() => router.push(`/eventos/${ev.eventId}`)}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{ev.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ev.venueName} - {new Date(ev.eventDate).toLocaleDateString("es", { day: "numeric", month: "short" })}
                      </Typography>
                    </Box>
                    <Chip
                      label={ev.status === "on_sale" ? "En venta" : ev.status}
                      size="small"
                      color={ev.status === "on_sale" ? "success" : "default"}
                    />
                  </Stack>
                </Box>
              ))}
              {(upcoming ?? []).length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>Sin eventos proximos</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <DirectionsRunIcon sx={{ fontSize: 20, color: "#EF4444" }} />
              <Typography variant="h6" fontWeight={700}>Carreras</Typography>
            </Stack>
            <Stack spacing={1.5}>
              {(races ?? []).map((r: any) => {
                const pct = r.maxParticipants > 0 ? Math.round((r.registeredCount / r.maxParticipants) * 100) : 0;
                return (
                  <Box
                    key={r.raceId}
                    sx={{
                      p: 2, borderRadius: 2, bgcolor: "#F8FAFC", cursor: "pointer",
                      border: "1px solid #F1F5F9",
                      "&:hover": { bgcolor: "#F1F5F9" },
                    }}
                    onClick={() => router.push(`/carreras/${r.raceId}`)}
                  >
                    <Stack direction="row" justifyContent="space-between" mb={1}>
                      <Stack direction="row" gap={1} alignItems="center">
                        <Chip label={r.distance} size="small" sx={{ bgcolor: DC[r.distance] || "#6366F1", color: "#fff", fontWeight: 700 }} />
                        <Typography variant="subtitle2" fontWeight={600}>{r.eventName}</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={700}>{r.registeredCount}/{r.maxParticipants}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate" value={pct}
                      sx={{
                        height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.06)",
                        "& .MuiLinearProgress-bar": { bgcolor: DC[r.distance] || "#6366F1" },
                      }}
                    />
                  </Box>
                );
              })}
              {(races ?? []).length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>Sin carreras</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Venues */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <StadiumIcon sx={{ fontSize: 20, color: "#8B5CF6" }} />
          <Typography variant="h6" fontWeight={700}>Venues</Typography>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Venue</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ciudad</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Capacidad</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Eventos</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 200 }}>Ocupacion</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(venues ?? []).map((v: any) => (
                <TableRow key={v.venueId} hover>
                  <TableCell>{v.venueName}</TableCell>
                  <TableCell>{v.city}</TableCell>
                  <TableCell align="right">{v.capacity.toLocaleString("es")}</TableCell>
                  <TableCell align="right">{v.eventCount}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate" value={v.occupancyPct}
                        sx={{
                          flex: 1, height: 8, borderRadius: 4, bgcolor: "rgba(0,0,0,0.06)",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: v.occupancyPct >= 90 ? "#EF4444" : v.occupancyPct >= 70 ? "#F59E0B" : "#10B981",
                          },
                        }}
                      />
                      <Typography variant="caption" fontWeight={600}>{v.occupancyPct}%</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ERP Sync Panel */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <SyncIcon sx={{ fontSize: 20, color: "#6366F1" }} />
          <Typography variant="h6" fontWeight={700}>Sincronizacion ERP</Typography>
        </Stack>
        <Grid container spacing={2} mb={3}>
          {[
            { label: "Pendientes", value: syncStats?.pending ?? 0, color: "#F59E0B", icon: <PendingIcon sx={{ fontSize: 18 }} /> },
            { label: "Sincronizados hoy", value: syncStats?.syncedToday ?? 0, color: "#10B981", icon: <CheckCircleIcon sx={{ fontSize: 18 }} /> },
            { label: "Con error", value: syncStats?.failed ?? 0, color: "#EF4444", icon: <ErrorIcon sx={{ fontSize: 18 }} /> },
          ].map((s) => (
            <Grid key={s.label} size={{ xs: 4 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#F8FAFC", textAlign: "center", border: "1px solid #F1F5F9" }}>
                <Box sx={{ color: s.color, mb: 0.5 }}>{s.icon}</Box>
                <Typography variant="h5" fontWeight={800}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Orden</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Intentos</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Creado</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sincronizado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(syncRecent ?? []).map((s: any) => (
                <TableRow key={s.SyncId} hover>
                  <TableCell>{s.SyncId}</TableCell>
                  <TableCell>#{s.OrderId}</TableCell>
                  <TableCell>
                    <Chip label={s.EventType === "payment_received" ? "Pago" : s.EventType === "refund" ? "Reembolso" : "Orden"} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.Status === "synced" ? "Sincronizado" : s.Status === "failed" ? "Error" : "Pendiente"}
                      size="small"
                      color={s.Status === "synced" ? "success" : s.Status === "failed" ? "error" : "warning"}
                    />
                  </TableCell>
                  <TableCell>{s.Attempts}</TableCell>
                  <TableCell>{new Date(s.CreatedAt).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</TableCell>
                  <TableCell>{s.SyncedAt ? new Date(s.SyncedAt).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "--"}</TableCell>
                </TableRow>
              ))}
              {(syncRecent ?? []).length === 0 && (
                <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary" variant="body2">Sin sincronizaciones</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
