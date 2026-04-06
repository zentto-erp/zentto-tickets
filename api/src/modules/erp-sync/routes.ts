import { Router, Request, Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.js";
import * as svc from "./service.js";

export const erpSyncRouter = Router();

/* GET /v1/erp-sync/pending — lista eventos pendientes de sincronización */
erpSyncRouter.get("/pending", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    const limit = Number(req.query.limit ?? 50);
    const rows = await svc.listPending(companyId, limit);
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* PATCH /v1/erp-sync/:id/synced — el ERP marca como procesado */
erpSyncRouter.patch("/:id/synced", async (req: Request, res: Response) => {
  try {
    const syncId = Number(req.params.id);
    const { success = true, error } = req.body ?? {};
    const result = await svc.markSynced(syncId, success, error);
    if (!result.ok) return res.status(404).json({ error: result.mensaje });
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* GET /v1/erp-sync/stats — conteo por estado */
erpSyncRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    res.json(await svc.getStats(companyId));
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});

/* GET /v1/erp-sync/recent — últimas sincronizaciones */
erpSyncRouter.get("/recent", async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as AuthenticatedRequest).scope;
    const limit = Number(req.query.limit ?? 20);
    res.json(await svc.getRecent(companyId, limit));
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});
