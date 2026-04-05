"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import LockIcon from "@mui/icons-material/Lock";
import TimerIcon from "@mui/icons-material/Timer";
import { useEvent } from "@/hooks/useEvents";
import { useCheckout, useConfirmPayment } from "@/hooks/useOrders";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = Number(searchParams.get("eventId"));
  const seatIds = (searchParams.get("seats") || "").split(",").map(Number).filter(Boolean);

  const { data: event } = useEvent(eventId);
  const checkout = useCheckout();
  const confirmPayment = useConfirmPayment();

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 min = 600s

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          alert("Tu reserva ha expirado. Los asientos fueron liberados.");
          router.push(`/eventos/${eventId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [eventId, router]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await checkout.mutateAsync({
        eventId,
        seatIds,
        buyerName,
        buyerEmail,
        buyerPhone,
      });

      // Simular confirmación de pago (en producción → Paddle/Stripe)
      await confirmPayment.mutateAsync({
        orderId: result.order.OrderId,
        paymentRef: `SIM-${Date.now()}`,
        paymentMethod: "simulation",
      });

      router.push(`/boletos/${result.order.OrderId}`);
    } catch (err) {
      console.error("Error en checkout:", err);
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Box px={4} py={4} maxWidth={600} mx="auto">
      <Typography variant="h4" fontWeight={700} mb={1}>Checkout</Typography>

      {/* Timer */}
      <Alert
        severity={timeLeft < 120 ? "warning" : "info"}
        icon={<TimerIcon />}
        sx={{ mb: 3 }}
      >
        Tus asientos están reservados por {minutes}:{seconds.toString().padStart(2, "0")}
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {event?.Name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {event?.VenueName} — {seatIds.length} asiento{seatIds.length > 1 ? "s" : ""}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Datos del comprador
        </Typography>

        <form onSubmit={handleCheckout}>
          <Stack spacing={2}>
            <TextField
              label="Nombre completo"
              fullWidth
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
            />
            <TextField
              label="Teléfono (opcional)"
              fullWidth
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
            />

            <Divider />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              startIcon={<LockIcon />}
              disabled={checkout.isPending || confirmPayment.isPending}
            >
              {checkout.isPending || confirmPayment.isPending ? "Procesando..." : "Confirmar y pagar"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Box p={4}><LinearProgress /></Box>}>
      <CheckoutContent />
    </Suspense>
  );
}
