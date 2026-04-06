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
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Chip from "@mui/material/Chip";
import LockIcon from "@mui/icons-material/Lock";
import TimerIcon from "@mui/icons-material/Timer";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import { useEvent, usePricingZones } from "@/hooks/useEvents";
import { useCheckout, useConfirmPayment, useCreatePaymentIntent } from "@/hooks/useOrders";
import dynamic from "next/dynamic";

const StripePaymentForm = dynamic(() => import("@/components/StripePaymentForm"), { ssr: false });

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = Number(searchParams.get("eventId"));
  const seatIds = (searchParams.get("seats") || "").split(",").map(Number).filter(Boolean);
  const { data: event } = useEvent(eventId);
  const { data: pricingZones } = usePricingZones(eventId);
  const checkout = useCheckout();
  const confirmPayment = useConfirmPayment();
  const createPaymentIntent = useCreatePaymentIntent();
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");
  const [step, setStep] = useState<"info" | "payment" | "processing">("info");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => { setTimeLeft((p) => { if (p <= 1) { clearInterval(iv); alert("Tu reserva ha expirado."); router.push(`/eventos/${eventId}`); return 0; } return p - 1; }); }, 1000);
    return () => clearInterval(iv);
  }, [eventId, router]);

  const est = (() => { if (!pricingZones?.length) return null; const p = Number(pricingZones[0]?.Price ?? 0); return { total: seatIds.length * p, perSeat: p, currency: pricingZones[0]?.Currency ?? "USD" }; })();

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    try { const r = await checkout.mutateAsync({ eventId, seatIds, buyerName, buyerEmail, buyerPhone }); setOrderId(r.order.OrderId); setStep("payment"); } catch (err) { setError(String(err)); }
  }

  async function handlePay() {
    if (!orderId) return;
    setError(null);

    if (paymentMethod === "card") {
      // For card payments, create a PaymentIntent and show Stripe form
      setStripeLoading(true);
      try {
        const { clientSecret: cs } = await createPaymentIntent.mutateAsync({ orderId });
        setClientSecret(cs);
        setStripeLoading(false);
      } catch (err) {
        setError(String(err));
        setStripeLoading(false);
      }
      return;
    }

    // Cash / transfer — existing flow
    setStep("processing");
    try {
      const ref = paymentRef.trim() || `${paymentMethod.toUpperCase()}-${Date.now()}`;
      await confirmPayment.mutateAsync({ orderId, paymentRef: ref, paymentMethod });
      router.push(`/boletos/${orderId}`);
    } catch (err) {
      setError(String(err));
      setStep("payment");
    }
  }

  function handleStripeSuccess() {
    // Stripe webhook will confirm the order; redirect to tickets
    if (orderId) router.push(`/boletos/${orderId}`);
  }

  const m = Math.floor(timeLeft / 60), s = timeLeft % 60;

  return (
    <Box px={4} py={4} maxWidth={650} mx="auto">
      <Typography variant="h4" fontWeight={700} mb={1}>Checkout</Typography>
      <Alert severity={timeLeft < 120 ? "warning" : "info"} icon={<TimerIcon />} sx={{ mb: 3 }}>
        Tus asientos estan reservados por {m}:{s.toString().padStart(2, "0")}
      </Alert>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Order summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>Resumen de la orden</Typography>
        <Typography variant="h6" fontWeight={600}>{event?.Name}</Typography>
        <Typography variant="body2" color="text.secondary" mb={1}>
          {event?.VenueName}
          {event?.EventDate && <> — {new Date(event.EventDate).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</>}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" alignItems="center" gap={1} mb={1}>
          <EventSeatIcon sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography variant="body2">{seatIds.length} asiento{seatIds.length > 1 ? "s" : ""}</Typography>
        </Stack>
        {est && (
          <>
            <Stack direction="row" justifyContent="space-between" mt={1}>
              <Typography variant="body2" color="text.secondary">{seatIds.length} x ${est.perSeat.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">${est.total.toFixed(2)} {est.currency}</Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700}>Total</Typography>
              <Typography variant="h6" fontWeight={700}>${est.total.toFixed(2)} {est.currency}</Typography>
            </Stack>
          </>
        )}
      </Paper>

      {/* Step 1: Buyer info */}
      {step === "info" && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>Datos del comprador</Typography>
          <form onSubmit={handleCheckout}>
            <Stack spacing={2}>
              <TextField label="Nombre completo" fullWidth required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
              <TextField label="Email" type="email" fullWidth required value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} helperText="Recibiras los boletos con QR en este email" />
              <TextField label="Telefono (opcional)" fullWidth value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
              <Button type="submit" variant="contained" size="large" fullWidth disabled={checkout.isPending}>
                {checkout.isPending ? "Creando orden..." : "Continuar al pago"}
              </Button>
            </Stack>
          </form>
        </Paper>
      )}

      {/* Step 2: Payment */}
      {step === "payment" && orderId && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            <PaymentIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>Metodo de pago</Typography>
          </Stack>
          <Chip label={`Orden #${orderId}`} color="primary" variant="outlined" size="small" sx={{ mb: 2 }} />

          {!clientSecret && (
            <>
              <FormControl component="fieldset" sx={{ mb: 2, width: "100%" }}>
                <FormLabel component="legend">Selecciona el metodo de pago</FormLabel>
                <RadioGroup value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setClientSecret(null); }}>
                  <FormControlLabel value="cash" control={<Radio />} label={
                    <Stack direction="row" alignItems="center" gap={1}><PaymentIcon sx={{ fontSize: 18 }} /><span>Efectivo</span></Stack>
                  } />
                  <FormControlLabel value="transfer" control={<Radio />} label={
                    <Stack direction="row" alignItems="center" gap={1}><AccountBalanceIcon sx={{ fontSize: 18 }} /><span>Transferencia bancaria</span></Stack>
                  } />
                  <FormControlLabel value="card" control={<Radio />} label={
                    <Stack direction="row" alignItems="center" gap={1}><CreditCardIcon sx={{ fontSize: 18 }} /><span>Tarjeta de credito/debito</span></Stack>
                  } />
                </RadioGroup>
              </FormControl>

              {paymentMethod === "transfer" && (
                <TextField label="Referencia de transferencia" fullWidth value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Ej: 0012345678" sx={{ mb: 2 }} />
              )}

              <Button
                variant="contained" size="large" fullWidth startIcon={<LockIcon />}
                onClick={handlePay}
                disabled={confirmPayment.isPending || stripeLoading}
              >
                {stripeLoading
                  ? "Conectando con Stripe..."
                  : confirmPayment.isPending
                    ? "Procesando pago..."
                    : paymentMethod === "card"
                      ? "Continuar con tarjeta"
                      : "Confirmar pago"}
              </Button>
            </>
          )}

          {clientSecret && (
            <StripePaymentForm clientSecret={clientSecret} onSuccess={handleStripeSuccess} />
          )}
        </Paper>
      )}

      {/* Step 3: Processing */}
      {step === "processing" && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Procesando pago...</Typography>
        </Paper>
      )}
    </Box>
  );
}

export default function CheckoutPage() {
  return (<Suspense fallback={<Box p={4}><LinearProgress /></Box>}><CheckoutContent /></Suspense>);
}
