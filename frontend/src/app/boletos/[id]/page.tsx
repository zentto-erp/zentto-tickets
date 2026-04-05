"use client";
import React from "react";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useOrder, useOrderTickets } from "@/hooks/useOrders";
import type { OrderStatus } from "@/types";
import { QrTicketCard } from "@/components/QrTicketCard";

const SL: Record<OrderStatus, string> = { pending_payment: "Pendiente de pago", paid: "Pagado", cancelled: "Cancelado", refunded: "Reembolsado" };
const SC: Record<OrderStatus, "default"|"success"|"error"|"warning"> = { pending_payment: "warning", paid: "success", cancelled: "error", refunded: "default" };

export default function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const { data: order, isLoading: oL } = useOrder(orderId);
  const { data: tickets, isLoading: tL } = useOrderTickets(orderId);

  if (oL || tL) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!order) return <Box px={4} py={8} textAlign="center"><Typography variant="h5" color="text.secondary">Orden no encontrada</Typography></Box>;

  return (
    <Box px={4} py={4} maxWidth={800} mx="auto">
      <Stack direction="row" justifyContent="space-between" alignItems="start" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Orden #{order.OrderId}</Typography>
          <Typography variant="body2" color="text.secondary">{new Date(order.CreatedAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography>
        </Box>
        <Chip label={SL[order.Status]} color={SC[order.Status]} size="medium" icon={order.Status === "paid" ? <CheckCircleIcon /> : undefined} />
      </Stack>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>{order.EventName}</Typography>
        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" gap={0.5}><CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} /><Typography variant="body2" color="text.secondary">{order.EventDate && new Date(order.EventDate).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Typography></Stack>
          <Stack direction="row" alignItems="center" gap={0.5}><LocationOnIcon sx={{ fontSize: 16, color: "text.secondary" }} /><Typography variant="body2" color="text.secondary">{order.VenueName}</Typography></Stack>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">{tickets?.length ?? 0} boleto{(tickets?.length ?? 0) > 1 ? "s" : ""}</Typography>
          <Typography variant="h6" fontWeight={700}>${Number(order.Total).toFixed(2)} {order.Currency}</Typography>
        </Stack>
      </Paper>
      {order.Status === "paid" && <Alert severity="success" sx={{ mb: 3 }}>Pago confirmado{order.PaidAt && ` el ${new Date(order.PaidAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}{order.PaymentMethod && ` via ${order.PaymentMethod}`}</Alert>}
      {order.Status === "paid" && tickets && tickets.length > 0 && (<><Typography variant="h5" fontWeight={700} mb={2}>Tus Boletos</Typography><Stack spacing={3}>{tickets.map((t) => <QrTicketCard key={t.TicketId} ticket={t} />)}</Stack></>)}
      {order.Status === "pending_payment" && <Alert severity="warning">Esta orden esta pendiente de pago.</Alert>}
      {order.Status === "cancelled" && <Alert severity="error">Esta orden fue cancelada.</Alert>}
    </Box>
  );
}
