import { Router, Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.js";
import * as svc from "./service.js";

export const orderRouter = Router();

/* ── LIST MY ORDERS ── */
orderRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = (req as AuthenticatedRequest).scope;
    const { page, limit } = req.query;
    const rows = await svc.listOrders({
      userId,
      companyId,
      page: Number(page ?? 1),
      limit: Number(limit ?? 20),
    });
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── GET ORDER ── */
orderRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const order = await svc.getOrder(Number(req.params.id), userId);
    if (!order) return res.status(404).json({ error: "order_not_found" });
    res.json(order);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── CHECKOUT (held seats → order + tickets) ── */
orderRouter.post("/checkout", async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = (req as AuthenticatedRequest).scope;
    const { eventId, seatIds, buyerName, buyerEmail, buyerPhone } = req.body;

    const result = await svc.checkout({
      eventId,
      seatIds,
      userId,
      companyId,
      buyerName,
      buyerEmail,
      buyerPhone,
    });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── CONFIRM PAYMENT (webhook / manual) ── */
orderRouter.post("/:id/confirm-payment", async (req: Request, res: Response) => {
  try {
    const { paymentRef, paymentMethod } = req.body;
    const result = await svc.confirmPayment(
      Number(req.params.id),
      paymentRef,
      paymentMethod
    );
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── CANCEL ORDER ── */
orderRouter.post("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const result = await svc.cancelOrder(Number(req.params.id), userId);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── ORDER TICKETS (con QR) ── */
orderRouter.get("/:id/tickets", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const tickets = await svc.getOrderTickets(Number(req.params.id), userId);
    res.json(tickets);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});
