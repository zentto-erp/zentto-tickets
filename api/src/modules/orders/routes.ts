import { Router, Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.js";
import * as svc from "./service.js";
import { holdSeats } from "../events/service.js";

export const orderRouter = Router();

orderRouter.post("/hold", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const { eventId, seatIds } = req.body;
    if (!eventId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: "missing_eventId_or_seatIds" });
    }
    const result = await holdSeats(Number(eventId), seatIds, userId);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

orderRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = (req as AuthenticatedRequest).scope;
    const { page, limit } = req.query;
    const rows = await svc.listOrders({ userId, companyId, page: Number(page ?? 1), limit: Number(limit ?? 20) });
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

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

orderRouter.post("/checkout", async (req: Request, res: Response) => {
  try {
    const { userId, companyId } = (req as AuthenticatedRequest).scope;
    const { eventId, seatIds, buyerName, buyerEmail, buyerPhone } = req.body;
    const result = await svc.checkout({ eventId, seatIds, userId, companyId, buyerName, buyerEmail, buyerPhone });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

orderRouter.post("/:id/confirm-payment", async (req: Request, res: Response) => {
  try {
    const { paymentRef, paymentMethod } = req.body;
    const result = await svc.confirmPayment(Number(req.params.id), paymentRef, paymentMethod);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

orderRouter.post("/:id/pay", async (req: Request, res: Response) => {
  try {
    const { paymentMethod, paymentRef } = req.body;
    const ref = paymentRef || `${(paymentMethod || "cash").toUpperCase()}-${Date.now()}`;
    const result = await svc.confirmPayment(Number(req.params.id), ref, paymentMethod || "cash");
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

orderRouter.post("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const result = await svc.cancelOrder(Number(req.params.id), userId);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

orderRouter.get("/:id/tickets", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const tickets = await svc.getOrderTickets(Number(req.params.id), userId);
    res.json(tickets);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});
