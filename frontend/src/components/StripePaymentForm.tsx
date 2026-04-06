"use client";

import React, { useState, useCallback } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe as StripeType } from "@stripe/stripe-js";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import LockIcon from "@mui/icons-material/Lock";

/* ── Stripe singleton ── */

let stripePromise: Promise<StripeType | null> | null = null;

function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

/* ── Inner form (inside Elements provider) ── */

interface InnerFormProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
  processing: boolean;
  setProcessing: (v: boolean) => void;
}

function CheckoutForm({ onSuccess, onError, processing, setProcessing }: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      setProcessing(true);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href, // fallback — we handle redirect ourselves
        },
        redirect: "if_required",
      });

      if (error) {
        onError(error.message || "Error procesando el pago");
        setProcessing(false);
      } else {
        // Payment succeeded (or requires no further action)
        onSuccess();
      }
    },
    [stripe, elements, onSuccess, onError, setProcessing],
  );

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
        disabled={!stripe || processing}
        sx={{ mt: 3 }}
      >
        {processing ? "Procesando pago..." : "Pagar con tarjeta"}
      </Button>
    </form>
  );
}

/* ── Public component ── */

interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
}

export default function StripePaymentForm({ clientSecret, onSuccess }: StripePaymentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const stripe = getStripe();

  if (!stripe) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Stripe no esta configurado. Contacta al administrador.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Tus datos de pago son procesados de forma segura por Stripe.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Elements
        stripe={stripe}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#6366f1",
              borderRadius: "8px",
            },
          },
        }}
      >
        <CheckoutForm
          onSuccess={onSuccess}
          onError={setError}
          processing={processing}
          setProcessing={setProcessing}
        />
      </Elements>
    </Box>
  );
}
