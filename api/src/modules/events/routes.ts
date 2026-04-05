import { Router, Request, Response } from "express";
import { requireAdmin, AuthenticatedRequest } from "../../middleware/auth.js";
import * as svc from "./service.js";

export const eventRouter = Router();

/* ── LIST ── */
eventRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    const { search, status, venueId, from, to, page, limit } = req.query;
    const rows = await svc.listEvents({
      companyId,
      search: String(search ?? ""),
      status: String(status ?? ""),
      venueId: venueId ? Number(venueId) : undefined,
      from: from ? String(from) : undefined,
      to: to ? String(to) : undefined,
      page: Number(page ?? 1),
      limit: Number(limit ?? 50),
    });
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── GET BY ID ── */
eventRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const event = await svc.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ error: "event_not_found" });
    res.json(event);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── CREATE ── */
eventRouter.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = (req as AuthenticatedRequest).scope;
    const result = await svc.upsertEvent({ ...req.body, companyId, createdBy: userId });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── UPDATE ── */
eventRouter.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const result = await svc.upsertEvent({
      ...req.body,
      eventId: Number(req.params.id),
      updatedBy: userId,
    });
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── PRICING ZONES ── */
eventRouter.get("/:id/pricing-zones", async (req: Request, res: Response) => {
  try {
    const rows = await svc.listPricingZones(Number(req.params.id));
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

eventRouter.post("/:id/pricing-zones", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await svc.upsertPricingZone({
      ...req.body,
      eventId: Number(req.params.id),
    });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── INITIALIZE INVENTORY (crea event_inventory para cada asiento) ── */
eventRouter.post("/:id/initialize-inventory", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await svc.initializeEventInventory(Number(req.params.id));
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── SEAT AVAILABILITY (mapa de disponibilidad) ── */
eventRouter.get("/:id/availability", async (req: Request, res: Response) => {
  try {
    const { sectionId } = req.query;
    const data = await svc.getSeatAvailability(
      Number(req.params.id),
      sectionId ? Number(sectionId) : undefined
    );
    res.json(data);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── HOLD SEATS ── */
eventRouter.post("/:id/hold", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const { seatIds } = req.body;
    const result = await svc.holdSeats(Number(req.params.id), seatIds, userId);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── RELEASE SEATS ── */
eventRouter.post("/:id/release", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const { seatIds } = req.body;
    const result = await svc.releaseSeats(Number(req.params.id), seatIds, userId);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});
