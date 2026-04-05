import { Router, Request, Response } from "express";
import crypto from "crypto";
import { callSp } from "../../db/query.js";
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
