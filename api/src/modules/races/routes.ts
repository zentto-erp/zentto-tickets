import { Router, Request, Response } from "express";
import { requireAdmin, AuthenticatedRequest } from "../../middleware/auth.js";
import * as svc from "./service.js";

export const raceRouter = Router();

/* ── LIST RACES ── */
raceRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    const { search, page, limit } = req.query;
    const rows = await svc.listRaces({
      companyId,
      search: String(search ?? ""),
      page: Number(page ?? 1),
      limit: Number(limit ?? 50),
    });
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── GET RACE ── */
raceRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const race = await svc.getRace(Number(req.params.id));
    if (!race) return res.status(404).json({ error: "race_not_found" });
    res.json(race);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── CREATE RACE ── */
raceRouter.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = (req as AuthenticatedRequest).scope;
    const result = await svc.upsertRace({ ...req.body, companyId, createdBy: userId });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── UPDATE RACE ── */
raceRouter.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await svc.upsertRace({ ...req.body, raceId: Number(req.params.id) });
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── CATEGORIES ── */
raceRouter.get("/:id/categories", async (req: Request, res: Response) => {
  try {
    const rows = await svc.listCategories(Number(req.params.id));
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

raceRouter.post("/:id/categories", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await svc.upsertCategory({ ...req.body, raceId: Number(req.params.id) });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── REGISTRATIONS (inscripciones) ── */
raceRouter.get("/:id/registrations", async (req: Request, res: Response) => {
  try {
    const { page, limit, status } = req.query;
    const rows = await svc.listRegistrations({
      raceId: Number(req.params.id),
      status: String(status ?? ""),
      page: Number(page ?? 1),
      limit: Number(limit ?? 100),
    });
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── REGISTER (inscribirse) ── */
raceRouter.post("/:id/register", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).scope;
    const result = await svc.registerParticipant({
      ...req.body,
      raceId: Number(req.params.id),
      userId,
    });
    res.status(201).json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── UPDATE RESULT (dorsal, tiempo, posición) ── */
raceRouter.patch("/registrations/:regId", requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await svc.updateRegistration(Number(req.params.regId), req.body);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── RESULTS / CLASIFICACIÓN ── */
raceRouter.get("/:id/results", async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;
    const rows = await svc.getResults(Number(req.params.id), categoryId ? Number(categoryId) : undefined);
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* ── BIB SCAN (escanear dorsal con chip/QR) ── */
raceRouter.post("/registrations/:regId/finish", async (req: Request, res: Response) => {
  try {
    const { finishTime, chipTime } = req.body;
    const result = await svc.recordFinish(Number(req.params.regId), finishTime, chipTime);
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});
