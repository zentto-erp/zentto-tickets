import { Router, Request, Response } from "express";
import crypto from "crypto";
import { callSp } from "../../db/query.js";
import { env } from "../../config/env.js";

export const scanRouter = Router();

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 300_000);

scanRouter.post("/validate", async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ valid: false, error: "rate_limited" });
    }

    const { barcode } = req.body;
    if (!barcode) return res.status(400).json({ valid: false, error: "missing_barcode" });

    const raw = String(barcode).replace(/^ZT-/, "");
    const parts = raw.split("|");
    if (parts.length !== 5) {
      return res.json({ valid: false, error: "invalid_format" });
    }

    const [orderId, eventId, seatId, timestamp, hmac] = parts;
    const payload = `${orderId}|${eventId}|${seatId}|${timestamp}`;
    const expected = crypto
      .createHmac("sha256", env.jwt.secret)
      .update(payload)
      .digest("hex")
      .slice(0, 16);

    if (hmac !== expected) {
      return res.json({ valid: false, error: "tampered_barcode" });
    }

    // Validate ticket via PL/pgSQL function
    const rows = await callSp("usp_tkt_scan_validate", { Barcode: barcode });
    const result = rows[0] as Record<string, unknown>;

    if (!result?.ok) {
      return res.json({
        valid: false,
        error: result?.error ?? "ticket_not_found",
        ...(result?.TicketId ? { ticket: result, scannedAt: result.ScannedAt } : {}),
      });
    }

    return res.json({
      valid: true,
      ticket: result,
    });
  } catch (err: unknown) {
    res.status(500).json({ valid: false, error: String(err) });
  }
});
