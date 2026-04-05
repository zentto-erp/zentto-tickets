import { Router, Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.js";
import * as svc from "./service.js";

export const dashboardRouter = Router();

dashboardRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    res.json(await svc.getStats(companyId));
  } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

dashboardRouter.get("/sales", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    res.json(await svc.getSales(companyId, String(req.query.period ?? "month")));
  } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

dashboardRouter.get("/events", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    res.json(await svc.getUpcomingEvents(companyId, Number(req.query.limit ?? 5)));
  } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

dashboardRouter.get("/races", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    res.json(await svc.getRaceStats(companyId));
  } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

dashboardRouter.get("/venues", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    res.json(await svc.getVenueOccupancy(companyId));
  } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});
