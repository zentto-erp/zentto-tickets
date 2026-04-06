"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
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
import Container from "@mui/material/Container";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepConnector from "@mui/material/StepConnector";
import Skeleton from "@mui/material/Skeleton";
import LockIcon from "@mui/icons-material/Lock";
import TimerIcon from "@mui/icons-material/Timer";
import PaymentIcon from "@mui/icons-material/Payment";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import DownloadIcon from "@mui/icons-material/Download";
import ShieldIcon from "@mui/icons-material/Shield";
import { useEvent, usePricingZones } from "@/hooks/useEvents";
import { useCheckout, useConfirmPayment, useCreatePaymentIntent } from "@/hooks/useOrders";
import dynamic from "next/dynamic";

const StripePaymentForm = dynamic(() => import("@/components/StripePaymentForm"), { ssr: false });

/* ── Step labels ── */
const STEPS = ["Seleccionar", "Datos", "Pago", "Confirmacion"];

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
  const [activeStep, setActiveStep] = useState(0); // 0=select, 1=info, 2=payment, 3=confirm
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Start at step 1 (datos) since seats are already selected from URL params
  useEffect(() => {
    if (seatIds.length > 0) setActiveStep(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer
  useEffect(() => {
    if (activeStep >= 3) return; // No timer on confirmation
    const iv = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(iv);
          alert("Tu reserva ha expirado. Los asientos han sido liberados.");
          router.push(`/eventos/${eventId}`);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [eventId, router, activeStep]);

  // Estimate pricing
  const estimate = useMemo(() => {
    if (!pricingZones?.length) return null;
    const price = Number(pricingZones[0]?.Price ?? 0);
    return {
      total: seatIds.length * price,
      perSeat: price,
      currency: pricingZones[0]?.Currency ?? "USD",
    };
  }, [pricingZones, seatIds.length]);

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timerColor = timeLeft < 120 ? "#EF4444" : timeLeft < 300 ? "#F59E0B" : "#10B981";

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await checkout.mutateAsync({ eventId, seatIds, buyerName, buyerEmail, buyerPhone });
      setOrderId(r.order.OrderId);
      setActiveStep(2);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handlePay() {
    if (!orderId) return;
    setError(null);

    if (paymentMethod === "card") {
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

    // Cash / transfer flow
    try {
      const ref = paymentRef.trim() || `${paymentMethod.toUpperCase()}-${Date.now()}`;
      await confirmPayment.mutateAsync({ orderId, paymentRef: ref, paymentMethod });
      setActiveStep(3);
    } catch (err) {
      setError(String(err));
    }
  }

  function handleStripeSuccess() {
    setActiveStep(3);
  }

  function handleAddToCalendar() {
    if (!event) return;
    const startDate = new Date(event.EventDate);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // +3h
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const url = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.Name)}&dates=${fmt(startDate)}/${fmt(endDate)}&location=${encodeURIComponent(event.VenueName || "")}&details=${encodeURIComponent(`Boleto Zentto Tickets - Orden #${orderId}`)}`;
    window.open(url, "_blank");
  }

  return (
    <Box sx={{ bgcolor: "#0F0D2E", color: "#fff", minHeight: "100vh" }}>

      {/* ── Timer bar ── */}
      {activeStep < 3 && (
        <Box sx={{
          bgcolor: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)",
          py: 1.2, position: "sticky", top: 0, zIndex: 1100,
          backdropFilter: "blur(12px)",
        }}>
          <Container maxWidth="md">
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" gap={1}>
                <TimerIcon sx={{ color: timerColor, fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: timerColor, fontWeight: 700 }}>
                  {m}:{String(s).padStart(2, "0")}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
                  para completar tu compra
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap={0.5}>
                <ShieldIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }} />
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>Pago seguro</Typography>
              </Stack>
            </Stack>
            {/* Progress bar */}
            <LinearProgress
              variant="determinate"
              value={(timeLeft / 600) * 100}
              sx={{
                mt: 0.8, height: 3, borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.05)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: timerColor,
                  borderRadius: 2,
                },
              }}
            />
          </Container>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>

        {/* ── Stepper ── */}
        <Box sx={{ maxWidth: 600, mx: "auto", mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel
            connector={<StepConnector sx={{ "& .MuiStepConnector-line": { borderColor: "rgba(255,255,255,0.1)" } }} />}
          >
            {STEPS.map((label, i) => (
              <Step key={label} completed={i < activeStep}>
                <StepLabel
                  StepIconComponent={({ active, completed }) => (
                    <Box sx={{
                      width: 36, height: 36, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      bgcolor: completed ? "#10B981" : active ? "#6366F1" : "rgba(255,255,255,0.08)",
                      border: active ? "2px solid #818CF8" : "2px solid transparent",
                      transition: "all 0.3s",
                    }}>
                      {completed ? (
                        <CheckCircleIcon sx={{ fontSize: 20, color: "#fff" }} />
                      ) : (
                        <Typography variant="caption" sx={{ color: active ? "#fff" : "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                          {i + 1}
                        </Typography>
                      )}
                    </Box>
                  )}
                >
                  <Typography variant="caption" sx={{
                    color: i <= activeStep ? "#fff" : "rgba(255,255,255,0.3)",
                    fontWeight: i === activeStep ? 700 : 500,
                    fontSize: "0.7rem",
                  }}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>

          {/* ═══════ Left — Main content ═══════ */}
          <Box sx={{ flex: 1, minWidth: 0 }}>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Step 0: Selection summary (redirected from event) */}
            {activeStep === 0 && (
              <Paper sx={{ p: 3, borderRadius: 3, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Selecciona tus asientos</Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                  Ve a la pagina del evento para seleccionar asientos.
                </Typography>
                <Button variant="contained" onClick={() => router.push(`/eventos/${eventId}`)} sx={{ mt: 2 }}>
                  Ir al evento
                </Button>
              </Paper>
            )}

            {/* Step 1: Buyer info */}
            {activeStep === 1 && (
              <Paper sx={{
                p: { xs: 3, md: 4 }, borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
                  <PersonIcon sx={{ color: "#818CF8" }} />
                  <Typography variant="h6" fontWeight={700}>Datos del comprador</Typography>
                </Stack>

                <form onSubmit={handleCheckout}>
                  <Stack spacing={2.5}>
                    <TextField
                      label="Nombre completo"
                      fullWidth required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <PersonIcon sx={{ color: "rgba(255,255,255,0.3)", mr: 1, fontSize: 20 }} />,
                        },
                      }}
                      sx={textFieldSx}
                    />
                    <TextField
                      label="Correo electronico"
                      type="email" fullWidth required
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      helperText="Recibiras los boletos con QR en este email"
                      slotProps={{
                        input: {
                          startAdornment: <EmailIcon sx={{ color: "rgba(255,255,255,0.3)", mr: 1, fontSize: 20 }} />,
                        },
                      }}
                      sx={textFieldSx}
                    />
                    <TextField
                      label="Telefono (opcional)"
                      fullWidth
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <PhoneIcon sx={{ color: "rgba(255,255,255,0.3)", mr: 1, fontSize: 20 }} />,
                        },
                      }}
                      sx={textFieldSx}
                    />

                    <Stack direction="row" spacing={2} pt={1}>
                      <Button
                        variant="outlined" size="large"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push(`/eventos/${eventId}`)}
                        sx={{
                          borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)",
                          "&:hover": { borderColor: "rgba(255,255,255,0.3)" },
                        }}
                      >
                        Volver
                      </Button>
                      <Button
                        type="submit" variant="contained" size="large" fullWidth
                        endIcon={<ArrowForwardIcon />}
                        disabled={checkout.isPending}
                        sx={{
                          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                          fontWeight: 700,
                          "&:hover": { background: "linear-gradient(135deg, #4F46E5, #7C3AED)" },
                        }}
                      >
                        {checkout.isPending ? "Creando orden..." : "Continuar al pago"}
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              </Paper>
            )}

            {/* Step 2: Payment */}
            {activeStep === 2 && orderId && (
              <Paper sx={{
                p: { xs: 3, md: 4 }, borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <PaymentIcon sx={{ color: "#818CF8" }} />
                    <Typography variant="h6" fontWeight={700}>Metodo de pago</Typography>
                  </Stack>
                  <Chip label={`Orden #${orderId}`} size="small" sx={{
                    bgcolor: "rgba(99,102,241,0.12)", color: "#818CF8", fontWeight: 600,
                    border: "1px solid rgba(99,102,241,0.2)",
                  }} />
                </Stack>

                {!clientSecret && (
                  <>
                    <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
                      <FormLabel component="legend" sx={{ color: "rgba(255,255,255,0.5)", mb: 1.5, fontSize: "0.85rem" }}>
                        Selecciona como deseas pagar
                      </FormLabel>
                      <RadioGroup value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setClientSecret(null); }}>
                        <PaymentOption value="cash" icon={<PaymentIcon />} label="Efectivo" desc="Paga en punto de venta" />
                        <PaymentOption value="transfer" icon={<AccountBalanceIcon />} label="Transferencia bancaria" desc="Pago por transferencia o deposito" />
                        <PaymentOption value="card" icon={<CreditCardIcon />} label="Tarjeta de credito/debito" desc="Visa, Mastercard, AMEX" />
                      </RadioGroup>
                    </FormControl>

                    {paymentMethod === "transfer" && (
                      <TextField
                        label="Referencia de transferencia"
                        fullWidth
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="Ej: 0012345678"
                        sx={{ ...textFieldSx, mb: 3 }}
                      />
                    )}

                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined" size="large"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => setActiveStep(1)}
                        sx={{
                          borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)",
                          "&:hover": { borderColor: "rgba(255,255,255,0.3)" },
                        }}
                      >
                        Atras
                      </Button>
                      <Button
                        variant="contained" size="large" fullWidth
                        startIcon={<LockIcon />}
                        onClick={handlePay}
                        disabled={confirmPayment.isPending || stripeLoading}
                        sx={{
                          background: "linear-gradient(135deg, #10B981, #059669)",
                          fontWeight: 700, fontSize: "1rem",
                          "&:hover": { background: "linear-gradient(135deg, #059669, #047857)" },
                        }}
                      >
                        {stripeLoading ? "Conectando con Stripe..." : confirmPayment.isPending ? "Procesando..." : paymentMethod === "card" ? "Continuar con tarjeta" : `Pagar $${estimate?.total.toFixed(2) ?? "0.00"}`}
                      </Button>
                    </Stack>
                  </>
                )}

                {clientSecret && (
                  <Box sx={{ mt: 2 }}>
                    <StripePaymentForm clientSecret={clientSecret} onSuccess={handleStripeSuccess} />
                  </Box>
                )}
              </Paper>
            )}

            {/* Step 3: Confirmation */}
            {activeStep === 3 && (
              <Paper sx={{
                p: { xs: 3, md: 5 }, borderRadius: 3, textAlign: "center",
                bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(16,185,129,0.2)",
              }}>
                {/* Success animation */}
                <Box sx={{
                  width: 80, height: 80, borderRadius: "50%", mx: "auto", mb: 3,
                  background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid #10B981",
                }}>
                  <CheckCircleIcon sx={{ fontSize: 44, color: "#10B981" }} />
                </Box>

                <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
                  Compra confirmada!
                </Typography>
                <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.5)", mb: 1 }}>
                  Orden #{orderId}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", mb: 4, maxWidth: 400, mx: "auto" }}>
                  Hemos enviado tus boletos con codigo QR a <strong style={{ color: "#fff" }}>{buyerEmail}</strong>
                </Typography>

                {/* QR placeholder */}
                <Box sx={{
                  width: 180, height: 180, mx: "auto", mb: 4,
                  bgcolor: "#fff", borderRadius: 3, p: 2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <QrCode2Icon sx={{ fontSize: 120, color: "#0F0D2E" }} />
                </Box>

                {/* Event info */}
                <Paper sx={{
                  p: 2.5, borderRadius: 2, mb: 4, mx: "auto", maxWidth: 400,
                  bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  textAlign: "left",
                }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{event?.Name}</Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <CalendarMonthIcon sx={{ fontSize: 16, color: "#818CF8" }} />
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                        {event?.EventDate ? new Date(event.EventDate).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <LocationOnIcon sx={{ fontSize: 16, color: "#F59E0B" }} />
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>{event?.VenueName}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <EventSeatIcon sx={{ fontSize: 16, color: "#10B981" }} />
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                        {seatIds.length} boleto{seatIds.length > 1 ? "s" : ""}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Action buttons */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                  <Button
                    variant="contained" size="large"
                    startIcon={<CalendarTodayIcon />}
                    onClick={handleAddToCalendar}
                    sx={{
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      fontWeight: 700,
                      "&:hover": { background: "linear-gradient(135deg, #4F46E5, #7C3AED)" },
                    }}
                  >
                    Anadir a calendario
                  </Button>
                  <Button
                    variant="outlined" size="large"
                    startIcon={<ConfirmationNumberIcon />}
                    onClick={() => router.push(`/boletos/${orderId}`)}
                    sx={{
                      borderColor: "rgba(255,255,255,0.2)", color: "#fff",
                      "&:hover": { borderColor: "rgba(255,255,255,0.4)" },
                    }}
                  >
                    Ver mis boletos
                  </Button>
                  <Button
                    variant="outlined" size="large"
                    startIcon={<DownloadIcon />}
                    onClick={() => router.push(`/boletos/${orderId}`)}
                    sx={{
                      borderColor: "rgba(255,255,255,0.2)", color: "#fff",
                      "&:hover": { borderColor: "rgba(255,255,255,0.4)" },
                    }}
                  >
                    Descargar PDF
                  </Button>
                </Stack>
              </Paper>
            )}
          </Box>

          {/* ═══════ Right — Sidebar summary ═══════ */}
          {activeStep < 3 && (
            <Box sx={{
              width: { xs: "100%", md: 340 }, flexShrink: 0,
              position: { md: "sticky" }, top: { md: 100 }, alignSelf: "flex-start",
            }}>
              <Paper sx={{
                p: 3, borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>
                  Resumen de la orden
                </Typography>

                {/* Event info */}
                <Box sx={{
                  display: "flex", gap: 2, mb: 2.5,
                  p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.03)",
                }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: 2,
                    bgcolor: "rgba(99,102,241,0.12)", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ConfirmationNumberIcon sx={{ color: "#818CF8" }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>{event?.Name}</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
                      {event?.VenueName}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ color: "rgba(255,255,255,0.35)" }}>
                      {event?.EventDate ? new Date(event.EventDate).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" }) : ""}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", my: 2 }} />

                {/* Seats */}
                <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                  <EventSeatIcon sx={{ fontSize: 18, color: "#818CF8" }} />
                  <Typography variant="body2" fontWeight={600}>
                    {seatIds.length} asiento{seatIds.length > 1 ? "s" : ""}
                  </Typography>
                </Stack>

                {/* Pricing breakdown */}
                {estimate && (
                  <>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                        {seatIds.length} x ${estimate.perSeat.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                        ${estimate.total.toFixed(2)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                        Cargo por servicio
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                        $0.00
                      </Typography>
                    </Stack>

                    <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", my: 2 }} />

                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" fontWeight={700}>Total</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: "#F59E0B" }}>
                        ${estimate.total.toFixed(2)} {estimate.currency}
                      </Typography>
                    </Stack>
                  </>
                )}

                {/* Security badges */}
                <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <Stack direction="row" alignItems="center" gap={1} mb={1}>
                    <LockIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }} />
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>
                      Pago seguro con encriptacion SSL
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <ShieldIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }} />
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>
                      Garantia de reembolso
                    </Typography>
                  </Stack>
                </Box>
              </Paper>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}

/* ── Payment option component ── */
function PaymentOption({ value, icon, label, desc }: {
  value: string; icon: React.ReactNode; label: string; desc: string;
}) {
  return (
    <FormControlLabel
      value={value}
      control={<Radio sx={{ color: "rgba(255,255,255,0.3)", "&.Mui-checked": { color: "#818CF8" } }} />}
      label={
        <Stack direction="row" alignItems="center" gap={1.5} py={0.5}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 1.5,
            bgcolor: "rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.5)",
          }}>
            {React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 20 } })}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600}>{label}</Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)" }}>{desc}</Typography>
          </Box>
        </Stack>
      }
      sx={{
        mx: 0, mb: 1, p: 1, borderRadius: 2, width: "100%",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "all 0.2s",
        "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
      }}
    />
  );
}

/* ── TextField dark styles ── */
const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
    "&.Mui-focused fieldset": { borderColor: "#6366F1" },
    color: "#fff",
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
  "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.3)" },
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <Box sx={{ bgcolor: "#0F0D2E", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ width: 200 }}>
          <LinearProgress sx={{ bgcolor: "rgba(255,255,255,0.05)", "& .MuiLinearProgress-bar": { bgcolor: "#6366F1" } }} />
        </Box>
      </Box>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
