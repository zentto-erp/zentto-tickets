"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import QrCodeIcon from "@mui/icons-material/QrCode";
import { useMyOrders } from "@/hooks/useOrders";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const STATUS_COLORS: Record<OrderStatus, "default" | "success" | "error" | "warning"> = {
  pending_payment: "warning",
  paid: "success",
  cancelled: "error",
  refunded: "default",
};

export default function BoletosPage() {
  const router = useRouter();
  const { data, isLoading } = useMyOrders();
  const orders = data?.rows ?? [];

  return (
    <Box px={4} py={4} maxWidth={800} mx="auto">
      <Typography variant="h4" fontWeight={700} mb={3}>
        Mis Boletos
      </Typography>

      {isLoading && <Typography>Cargando...</Typography>}

      <Stack spacing={2}>
        {orders.map((order) => (
          <Paper
            key={order.OrderId}
            sx={{
              p: 3,
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": { boxShadow: 4 },
              borderLeft: `4px solid ${order.Status === "paid" ? "#10B981" : "#F59E0B"}`,
            }}
            onClick={() => router.push(`/boletos/${order.OrderId}`)}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="start">
              <Box flex={1}>
                <Typography variant="h6" fontWeight={600}>{order.EventName}</Typography>
                <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
                  <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {order.EventDate && new Date(order.EventDate).toLocaleDateString("es", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
                  <LocationOnIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">{order.VenueName}</Typography>
                </Stack>
              </Box>

              <Stack alignItems="end" gap={1}>
                <Chip label={STATUS_LABELS[order.Status]} color={STATUS_COLORS[order.Status]} size="small" />
                <Typography variant="h6" fontWeight={700}>
                  ${Number(order.Total).toFixed(2)} {order.Currency}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {order.TicketCount} boleto{(order.TicketCount ?? 0) > 1 ? "s" : ""}
                </Typography>
              </Stack>
            </Stack>

            {order.Status === "paid" && (
              <>
                <Divider sx={{ my: 2 }} />
                <Button size="small" startIcon={<QrCodeIcon />} onClick={(e) => { e.stopPropagation(); router.push(`/boletos/${order.OrderId}`); }}>
                  Ver QR de boletos
                </Button>
              </>
            )}
          </Paper>
        ))}
      </Stack>

      {!isLoading && orders.length === 0 && (
        <Box textAlign="center" py={8}>
          <ConfirmationNumberIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No tienes boletos</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Explora eventos y compra tus primeros boletos.
          </Typography>
          <Button variant="contained" onClick={() => router.push("/eventos")}>
            Ver Eventos
          </Button>
        </Box>
      )}
    </Box>
  );
}
