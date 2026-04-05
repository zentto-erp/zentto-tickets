import { Router, Request, Response } from "express";
import crypto from "crypto";
import { query } from "../../db/pool.js";
import { env } from "../../config/env.js";

export const scanRouter = Router();

/**
 * POST /v1/scan/validate
 * Valida un barcode/QR de ticket en puerta.
 * Body: { barcode: string }
 */
scanRouter.post("/validate", async (req: Request, res: Response) => {
  try {
    const { barcode } = req.body;
    if (!barcode) return res.status(400).json({ valid: false, error: "missing_barcode" });

    // Formato: ZT-orderId|eventId|seatId|timestamp|hmac
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

    // Buscar ticket en BD
    const ticket = await query(
      `SELECT t.*, e."Name" AS "EventName", e."EventDate",
         s."Name" AS "SectionName", r."Label" AS "RowLabel", st."Number" AS "SeatNumber",
         o."BuyerName"
       FROM tkt.ticket t
       JOIN tkt."order" o ON o."OrderId" = t."OrderId"
       JOIN tkt.event e ON e."EventId" = t."EventId"
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

    if (t.Status === "cancelled") {
      return res.json({ valid: false, error: "ticket_cancelled", ticket: t });
    }
    if (t.ScannedAt) {
      return res.json({
        valid: false,
        error: "already_scanned",
        scannedAt: t.ScannedAt,
        ticket: t,
      });
    }

    // Marcar como escaneado
    await query(
      `UPDATE tkt.ticket SET "ScannedAt" = NOW() WHERE "TicketId" = $1`,
      [t.TicketId]
    );

    return res.json({
      valid: true,
      ticket: {
        ...t,
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ valid: false, error: String(err) });
  }
});
