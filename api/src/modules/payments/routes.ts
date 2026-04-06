import { Router, Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.js";
import { env } from "../../config/env.js";
import * as stripeSvc from "./stripe.service.js";
import { getOrder } from "../orders/service.js";

export const paymentRouter = Router();

/* POST /v1/payments/create-intent — Create a Stripe PaymentIntent for an order */
paymentRouter.post("/create-intent", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "missing_orderId" });
    }

    if (!env.stripe.secretKey) {
      return res.status(503).json({ error: "stripe_not_configured" });
    }

    // Fetch the order to get amount/currency
    const order = await getOrder(Number(orderId), userId) as Record<string, unknown> | null;
    if (!order) {
      return res.status(404).json({ error: "order_not_found" });
    }

    if (order.Status !== "pending_payment") {
      return res.status(400).json({ error: "order_not_pending" });
    }

    // Convert to smallest currency unit (cents)
    const amount = Math.round(Number(order.Total) * 100);
    const currency = String(order.Currency || "USD");

    const result = await stripeSvc.createPaymentIntent({
      orderId: Number(orderId),
      amount,
      currency,
      metadata: {
        buyerEmail: String(order.BuyerEmail || ""),
        buyerName: String(order.BuyerName || ""),
        eventId: String(order.EventId || ""),
      },
    });

    res.json(result);
  } catch (err: unknown) {
    console.error("[payments] create-intent error:", err);
    res.status(500).json({ error: String(err) });
  }
});

/* GET /v1/payments/config — Return publishable key for frontend */
paymentRouter.get("/config", (_req: Request, res: Response) => {
  res.json({
    publishableKey: env.stripe.publishableKey,
  });
});

export { paymentWebhookRouter } from "./webhook.js";
