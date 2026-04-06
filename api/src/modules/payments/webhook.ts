import { Router, Request, Response } from "express";
import express from "express";
import * as stripeSvc from "./stripe.service.js";

export const paymentWebhookRouter = Router();

// Stripe webhooks need raw body — use express.raw() instead of json
paymentWebhookRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers["stripe-signature"];
      if (!signature) {
        return res.status(400).json({ error: "missing_stripe_signature" });
      }

      const result = await stripeSvc.handleWebhook(
        req.body as Buffer,
        String(signature),
      );

      res.json(result);
    } catch (err: unknown) {
      console.error("[stripe-webhook] Error:", err);
      res.status(400).json({ error: "webhook_error", message: String(err) });
    }
  },
);
