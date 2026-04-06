import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { requireJwt } from "./middleware/auth.js";
import { venueRouter } from "./modules/venues/routes.js";
import { eventRouter } from "./modules/events/routes.js";
import { orderRouter } from "./modules/orders/routes.js";
import { scanRouter } from "./modules/scan/routes.js";
import { raceRouter } from "./modules/races/routes.js";
import { dashboardRouter } from "./modules/dashboard/routes.js";
import { paymentRouter, paymentWebhookRouter } from "./modules/payments/routes.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:3300",
    "http://localhost:3000",
    /^https:\/\/[a-z0-9-]+\.zentto\.net$/,
  ],
  credentials: true,
}));
app.use(morgan("short"));

// Stripe webhook needs raw body — mount BEFORE json parser
app.use("/v1/payments/webhook", paymentWebhookRouter);

app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "zentto-tickets", timestamp: new Date().toISOString() });
});

app.use("/v1/venues", requireJwt, venueRouter);
app.use("/v1/events", requireJwt, eventRouter);
app.use("/v1/orders", requireJwt, orderRouter);
app.use("/v1/scan", requireJwt, scanRouter);
app.use("/v1/races", requireJwt, raceRouter);
app.use("/v1/dashboard", requireJwt, dashboardRouter);
app.use("/v1/payments", requireJwt, paymentRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

export { app };
