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
import { useRouter } from "next/navigation";
import SyncIcon from "@mui/icons-material/Sync";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import { useDashboardStats, useDashboardSales, useDashboardUpcomingEvents, useDashboardRaceStats, useDashboardVenueOccupancy } from "@/hooks/useDashboard";
import { useErpSyncStats, useErpSyncRecent } from "@/hooks/useErpSync";

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

  const cards = [
    { l: "Eventos activos", v: stats?.activeEvents ?? 0, i: <EventIcon />, c: "#6366F1" },
    { l: "Boletos vendidos", v: stats?.totalTicketsSold ?? 0, i: <ConfirmationNumberIcon />, c: "#10B981" },
    { l: "Revenue total", v: `$${(stats?.totalRevenue ?? 0).toLocaleString("es", { minimumFractionDigits: 2 })}`, i: <AttachMoneyIcon />, c: "#F59E0B" },
    { l: "Venues", v: stats?.totalVenues ?? 0, i: <StadiumIcon />, c: "#8B5CF6" },
    { l: "Inscritos carreras", v: stats?.totalRaceRegistrations ?? 0, i: <DirectionsRunIcon />, c: "#EF4444" },
    { l: "Escaneos hoy", v: stats?.scannedToday ?? 0, i: <QrCodeScannerIcon />, c: "#0EA5E9" },
  ];

  return (
    <Box px={4} py={4} maxWidth={1400} mx="auto">
      <Typography variant="h4" fontWeight={800} mb={1}>Dashboard</Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>Resumen en tiempo real.</Typography>
      <Grid container spacing={2} mb={4}>{cards.map((s) => (
        <Grid key={s.l} size={{ xs: 6, sm: 4, md: 2 }}><Paper sx={{ p: 2, textAlign: "center", borderTop: `3px solid ${s.c}` }}>
          <Box sx={{ color: s.c, mb: 1 }}>{s.i}</Box><Typography variant="h5" fontWeight={800}>{s.v}</Typography>
          <Typography variant="caption" color="text.secondary">{s.l}</Typography>
        </Paper></Grid>
      ))}</Grid>

      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}><Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>Revenue</Typography>
          {[{ l: "Hoy", v: stats?.revenueToday ?? 0 }, { l: "Semana", v: stats?.revenueWeek ?? 0 }, { l: "Mes", v: stats?.revenueMonth ?? 0 }].map((x) => (
            <Stack key={x.l} direction="row" justifyContent="space-between" mb={1}><Typography variant="body2" color="text.secondary">{x.l}</Typography><Typography variant="body2" fontWeight={700}>${x.v.toLocaleString("es", { minimumFractionDigits: 2 })}</Typography></Stack>
          ))}
        </Paper></Grid>
        <Grid size={{ xs: 12, md: 8 }}><Paper sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={700}>Ventas</Typography>
            <ToggleButtonGroup value={sp} exclusive onChange={(_, v) => v && setSp(v)} size="small">
              <ToggleButton value="week">7d</ToggleButton><ToggleButton value="month">30d</ToggleButton><ToggleButton value="year">1a</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <TableContainer sx={{ maxHeight: 240 }}><Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>Ordenes</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>Boletos</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>Revenue</TableCell></TableRow></TableHead>
            <TableBody>{(sales ?? []).map((s: any) => (<TableRow key={s.date}><TableCell>{s.date}</TableCell><TableCell align="right">{s.orders}</TableCell><TableCell align="right">{s.tickets}</TableCell><TableCell align="right">${s.revenue.toLocaleString("es", { minimumFractionDigits: 2 })}</TableCell></TableRow>))}
              {(sales ?? []).length === 0 && <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary" variant="body2">Sin ventas</Typography></TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Paper></Grid>
      </Grid>

      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 6 }}><Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}><CalendarTodayIcon sx={{ fontSize: 20, mr: 1, verticalAlign: "text-bottom" }} />Proximos eventos</Typography>
          <Stack spacing={1.5}>{(upcoming ?? []).map((ev: any) => (
            <Box key={ev.eventId} sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover", cursor: "pointer", "&:hover": { bgcolor: "action.selected" } }} onClick={() => router.push(`/eventos/${ev.eventId}`)}>
              <Stack direction="row" justifyContent="space-between"><Box><Typography variant="subtitle2" fontWeight={600}>{ev.name}</Typography><Typography variant="caption" color="text.secondary">{ev.venueName} - {new Date(ev.eventDate).toLocaleDateString("es", { day: "numeric", month: "short" })}</Typography></Box>
              <Chip label={ev.status === "on_sale" ? "En venta" : ev.status} size="small" color={ev.status === "on_sale" ? "success" : "default"} /></Stack>
            </Box>))}
          </Stack>
        </Paper></Grid>
        <Grid size={{ xs: 12, md: 6 }}><Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} mb={2}><DirectionsRunIcon sx={{ fontSize: 20, mr: 1, verticalAlign: "text-bottom" }} />Carreras</Typography>
          <Stack spacing={1.5}>{(races ?? []).map((r: any) => {
            const pct = r.maxParticipants > 0 ? Math.round((r.registeredCount / r.maxParticipants) * 100) : 0;
            return (<Box key={r.raceId} sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover", cursor: "pointer", "&:hover": { bgcolor: "action.selected" } }} onClick={() => router.push(`/carreras/${r.raceId}`)}>
              <Stack direction="row" justifyContent="space-between" mb={1}><Stack direction="row" gap={1}><Chip label={r.distance} size="small" sx={{ bgcolor: DC[r.distance] || "#6366F1", color: "#fff", fontWeight: 700 }} /><Typography variant="subtitle2" fontWeight={600}>{r.eventName}</Typography></Stack><Typography variant="body2" fontWeight={700}>{r.registeredCount}/{r.maxParticipants}</Typography></Stack>
              <LinearProgress variant="determinate" value={pct} sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.08)", "& .MuiLinearProgress-bar": { bgcolor: DC[r.distance] || "#6366F1" } }} />
            </Box>);
          })}</Stack>
        </Paper></Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 4 }}><Typography variant="h6" fontWeight={700} mb={2}><StadiumIcon sx={{ fontSize: 20, mr: 1, verticalAlign: "text-bottom" }} />Venues</Typography>
        <TableContainer><Table size="small"><TableHead><TableRow><TableCell sx={{ fontWeight: 700 }}>Venue</TableCell><TableCell sx={{ fontWeight: 700 }}>Ciudad</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>Capacidad</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>Eventos</TableCell><TableCell sx={{ fontWeight: 700, width: 200 }}>Ocupacion</TableCell></TableRow></TableHead>
          <TableBody>{(venues ?? []).map((v: any) => (<TableRow key={v.venueId}><TableCell>{v.venueName}</TableCell><TableCell>{v.city}</TableCell><TableCell align="right">{v.capacity.toLocaleString("es")}</TableCell><TableCell align="right">{v.eventCount}</TableCell>
            <TableCell><Stack direction="row" alignItems="center" gap={1}><LinearProgress variant="determinate" value={v.occupancyPct} sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: "rgba(0,0,0,0.08)", "& .MuiLinearProgress-bar": { bgcolor: v.occupancyPct >= 90 ? "#EF4444" : v.occupancyPct >= 70 ? "#F59E0B" : "#10B981" } }} /><Typography variant="caption" fontWeight={600}>{v.occupancyPct}%</Typography></Stack></TableCell>
          </TableRow>))}</TableBody>
        </Table></TableContainer>
      </Paper>

      {/* ── Panel Sincronizacion ERP ── */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={2}>
          <SyncIcon sx={{ fontSize: 20, mr: 1, verticalAlign: "text-bottom" }} />Sincronizacion ERP
        </Typography>
        <Grid container spacing={2} mb={3}>
          {[
            { l: "Pendientes", v: syncStats?.pending ?? 0, c: "#F59E0B", i: <PendingIcon sx={{ fontSize: 18 }} /> },
            { l: "Sincronizados hoy", v: syncStats?.syncedToday ?? 0, c: "#10B981", i: <CheckCircleIcon sx={{ fontSize: 18 }} /> },
            { l: "Con error", v: syncStats?.failed ?? 0, c: "#EF4444", i: <ErrorIcon sx={{ fontSize: 18 }} /> },
          ].map((s) => (
            <Grid key={s.l} size={{ xs: 4 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover", textAlign: "center" }}>
                <Box sx={{ color: s.c, mb: 0.5 }}>{s.i}</Box>
                <Typography variant="h5" fontWeight={800}>{s.v}</Typography>
                <Typography variant="caption" color="text.secondary">{s.l}</Typography>
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
                <TableRow key={s.SyncId}>
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
                  <TableCell>{s.SyncedAt ? new Date(s.SyncedAt).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</TableCell>
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
