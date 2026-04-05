import { Router, Request, Response } from "express";
import { requireAdmin, AuthenticatedRequest } from "../../middleware/auth.js";
import * as svc from "./service.js";

export const raceRouter = Router();

raceRouter.get("/", async (req: Request, res: Response) => {
  try { const { companyId } = (req as AuthenticatedRequest).scope; const { search, page, limit } = req.query; res.json(await svc.listRaces({ companyId, search: String(search ?? ""), page: Number(page ?? 1), limit: Number(limit ?? 50) })); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.get("/:id", async (req: Request, res: Response) => {
  try { const race = await svc.getRace(Number(req.params.id)); if (!race) return res.status(404).json({ error: "race_not_found" }); res.json(race); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.post("/", requireAdmin, async (req: Request, res: Response) => {
  try { const { companyId, userId } = (req as AuthenticatedRequest).scope; res.status(201).json(await svc.upsertRace({ ...req.body, companyId, createdBy: userId })); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try { res.json(await svc.upsertRace({ ...req.body, raceId: Number(req.params.id) })); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.get("/:id/categories", async (req: Request, res: Response) => {
  try { res.json(await svc.listCategories(Number(req.params.id))); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.post("/:id/categories", requireAdmin, async (req: Request, res: Response) => {
  try { res.status(201).json(await svc.upsertCategory({ ...req.body, raceId: Number(req.params.id) })); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.get("/:id/registrations", async (req: Request, res: Response) => {
  try { const { page, limit, status } = req.query; res.json(await svc.listRegistrations({ raceId: Number(req.params.id), status: String(status ?? ""), page: Number(page ?? 1), limit: Number(limit ?? 100) })); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.post("/:id/register", async (req: Request, res: Response) => {
  try { const { userId } = (req as AuthenticatedRequest).scope; res.status(201).json(await svc.registerParticipant({ ...req.body, raceId: Number(req.params.id), userId })); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.patch("/registrations/:regId", requireAdmin, async (req: Request, res: Response) => {
  try { res.json(await svc.updateRegistration(Number(req.params.regId), req.body)); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.get("/:id/results", async (req: Request, res: Response) => {
  try { res.json(await svc.getResults(Number(req.params.id), req.query.categoryId ? Number(req.query.categoryId) : undefined)); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.post("/registrations/:regId/finish", async (req: Request, res: Response) => {
  try { res.json(await svc.recordFinish(Number(req.params.regId), req.body.finishTime, req.body.chipTime)); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.get("/:id/leaderboard", async (req: Request, res: Response) => {
  try { res.json(await svc.getLeaderboard(Number(req.params.id), req.query.categoryId ? Number(req.query.categoryId) : undefined)); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});

raceRouter.post("/scan", async (req: Request, res: Response) => {
  try { res.json(await svc.scanRegistrationQR(req.body.barcode)); } catch (err: unknown) { res.status(500).json({ valid: false, error: String(err) }); }
});

raceRouter.post("/registrations/:regId/pay", async (req: Request, res: Response) => {
  try { res.json(await svc.confirmRacePayment(Number(req.params.regId), req.body.paymentRef)); } catch (err: unknown) { res.status(500).json({ error: String(err) }); }
});
