import Stripe from "stripe";
import { env } from "../../config/env.js";
import { confirmPayment } from "../orders/service.js";
import { callSp } from "../../db/query.js";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!env.stripe.secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(env.stripe.secretKey, { apiVersion: "2025-04-30.basil" });
  }
  return _stripe;
}

/* ── Create Payment Intent ── */

interface CreateIntentParams {
  orderId: number;
  amount: number;        // amount in smallest currency unit (cents)
  currency: string;      // e.g. "usd"
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(params: CreateIntentParams) {
  const stripe = getStripe();
  const { orderId, amount, currency, metadata } = params;

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: currency.toLowerCase(),
    metadata: {
      orderId: String(orderId),
      ...metadata,
    },
    automatic_payment_methods: { enabled: true },
  });

  // Save PaymentIntentId to order
  await callSp("usp_tkt_order_set_payment_intent", {
    OrderId: orderId,
    PaymentIntentId: intent.id,
  });

  return {
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  };
}

/* ── Webhook Handler ── */

export async function handleWebhook(body: Buffer, signature: string) {
  const stripe = getStripe();

  if (!env.stripe.webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  const event = stripe.webhooks.constructEvent(body, signature, env.stripe.webhookSecret);

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = Number(intent.metadata?.orderId);
      if (!orderId) {
        console.warn("[stripe] payment_intent.succeeded without orderId in metadata");
        break;
      }
      // Confirm payment in our system
      await confirmPayment(orderId, intent.id, "card");
      console.log(`[stripe] Order #${orderId} confirmed via webhook (${intent.id})`);
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = Number(intent.metadata?.orderId);
      console.warn(`[stripe] Payment failed for order #${orderId}: ${intent.last_payment_error?.message}`);
      break;
    }

    default:
      // Unhandled event type — ignore silently
      break;
  }

  return { received: true };
}
