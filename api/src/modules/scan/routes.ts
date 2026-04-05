import { Router, Request, Response } from "express";
import crypto from "crypto";
import { query } from "../../db/pool.js";
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

    const ticket = await query(
      `SELECT t.*, e."Name" AS "EventName", e."EventDate",
         v."Name" AS "VenueName",
         s."Name" AS "SectionName", r."Label" AS "RowLabel", st."Number" AS "SeatNumber",
         o."BuyerName", o."Status" AS "OrderStatus"
       FROM tkt.ticket t
       JOIN tkt."order" o ON o."OrderId" = t."OrderId"
       JOIN tkt.event e ON e."EventId" = t."EventId"
       JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
       JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
       LEFT JOIN tkt.seat st ON st."SeatId" = t."SeatId"
       LEFT JOIN tkt.row r ON r."RowId" = st."RowId"
       LEFT JOIN tkt.section s ON s."SectionId" = r."SectionId"
       WHERE t."Barcode" = $1`,
      [barcode]
    );

    if (!ticket.rows.length) {
      return res.json({ valid: false, error: "ticket_not_found" });
    }

    const t = ticket.rows[0];

    if (t.OrderStatus !== "paid") {
      return res.json({ valid: false, error: "order_not_paid", ticket: t });
    }

    if (t.Status === "cancelled") {
      return res.json({ valid: false, error: "ticket_cancelled", ticket: t });
    }

    if (t.ScannedAt) {
      return res.json({
        valid: false,
        error: "already_scanned",
        scannedAt: t.ScannedAt,
        ticket: {
          EventName: t.EventName, EventDate: t.EventDate, VenueName: t.VenueName,
          BuyerName: t.BuyerName, SectionName: t.SectionName,
          RowLabel: t.RowLabel, SeatNumber: t.SeatNumber,
        },
      });
    }

    await query(
      `UPDATE tkt.ticket SET "ScannedAt" = NOW(), "Status" = 'used' WHERE "TicketId" = $1`,
      [t.TicketId]
    );

    return res.json({
      valid: true,
      ticket: {
        EventName: t.EventName, EventDate: t.EventDate, VenueName: t.VenueName,
        BuyerName: t.BuyerName, SectionName: t.SectionName,
        RowLabel: t.RowLabel, SeatNumber: t.SeatNumber,
      },
      scannedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(500).json({ valid: false, error: String(err) });
  }
});
