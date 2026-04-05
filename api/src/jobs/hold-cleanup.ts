import { releaseExpiredHolds } from "../modules/events/service.js";

const CLEANUP_INTERVAL_MS = 30_000; // 30 segundos

export function startHoldCleanup() {
  console.log("[hold-cleanup] Iniciando job cada 30s");

  setInterval(async () => {
    try {
      const released = await releaseExpiredHolds();
      if (released.length > 0) {
        console.log(`[hold-cleanup] Liberados ${released.length} asientos expirados`);
        // TODO: notificar via WebSocket a clientes conectados
      }
    } catch (err) {
      console.error("[hold-cleanup] Error:", err);
    }
  }, CLEANUP_INTERVAL_MS);
}
