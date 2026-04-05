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

const app = express();

/* ── Middleware global ── */
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:3300",
    "http://localhost:3000",
    /\.zentto\.net$/,
  ],
  credentials: true,
}));
app.use(morgan("short"));
app.use(express.json({ limit: "10mb" }));

/* ── Health check (público) ── */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "zentto-tickets", timestamp: new Date().toISOString() });
});

/* ── Rutas protegidas (JWT de zentto-web) ── */
app.use("/v1/venues", requireJwt, venueRouter);
app.use("/v1/events", requireJwt, eventRouter);
app.use("/v1/orders", requireJwt, orderRouter);
app.use("/v1/scan", requireJwt, scanRouter);
app.use("/v1/races", requireJwt, raceRouter);

/* ── 404 ── */
app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

export { app };
