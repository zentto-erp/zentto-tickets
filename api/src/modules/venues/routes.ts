import { Router, Request, Response } from "express";
import { requireAdmin, AuthenticatedRequest } from "../../middleware/auth.js";
import * as svc from "./service.js";

export const venueRouter = Router();

/* ── LIST ── */
venueRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    const { search, city, country, page, limit } = req.query;
    const rows = await svc.listVenues({
      companyId,
      search: String(search ?? ""),
      city: String(city ?? ""),
      country: String(country ?? ""),
      page: Number(page ?? 1),
      limit: Number(limit ?? 50),
    });
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── GET BY ID ── */
venueRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const venue = await svc.getVenue(Number(req.params.id));
    if (!venue) return res.status(404).json({ error: "venue_not_found" });
    res.json(venue);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── CREATE ── */
venueRouter.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = (req as AuthenticatedRequest).scope;
    const result = await svc.upsertVenue({ ...req.body, companyId, createdBy: userId });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── UPDATE ── */
venueRouter.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = (req as AuthenticatedRequest).scope;
    const result = await svc.upsertVenue({
      ...req.body,
      venueId: Number(req.params.id),
      companyId,
      updatedBy: userId,
    });
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── DELETE ── */
venueRouter.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await svc.deleteVenue(Number(req.params.id));
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── CONFIGURATIONS ── */
venueRouter.get("/:id/configurations", async (req: Request, res: Response) => {
  try {
    const rows = await svc.listVenueConfigurations(Number(req.params.id));
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

venueRouter.post("/:id/configurations", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await svc.upsertVenueConfiguration({
      ...req.body,
      venueId: Number(req.params.id),
    });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── SECTIONS (dentro de una configuración) ── */
venueRouter.get("/configurations/:configId/sections", async (req: Request, res: Response) => {
  try {
    const rows = await svc.listSections(Number(req.params.configId));
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

venueRouter.post("/configurations/:configId/sections", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await svc.upsertSection({
      ...req.body,
      configurationId: Number(req.params.configId),
    });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── SEAT GENERATION (genera asientos automáticos para una sección) ── */
venueRouter.post("/sections/:sectionId/generate-seats", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { rows: rowCount, seatsPerRow, startLabel } = req.body;
    const result = await svc.generateSeats({
      sectionId: Number(req.params.sectionId),
      rows: rowCount,
      seatsPerRow,
      startLabel: startLabel ?? "A",
    });
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── FULL SEAT MAP (venue config completo con secciones + asientos) ── */
venueRouter.get("/configurations/:configId/seatmap", async (req: Request, res: Response) => {
  try {
    const seatmap = await svc.getFullSeatMap(Number(req.params.configId));
    res.json(seatmap);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});
