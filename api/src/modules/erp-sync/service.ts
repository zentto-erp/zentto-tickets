import { callSp } from "../../db/query.js";
import { query } from "../../db/pool.js";

/* ── Encolar evento de sincronización ERP ──────────────────────────────────── */

export async function enqueueSync(
  orderId: number,
  eventType: "order_completed" | "payment_received" | "refund",
  companyId = 0
) {
  // Construir payload con datos de la orden para que el ERP no tenga que consultar
  const orderRows = await callSp("usp_tkt_order_get", {
    OrderId: orderId,
    UserId: "", // contexto admin
  });
  const order = orderRows[0] as Record<string, unknown> | undefined;

  const payload = order
    ? {
        orderId,
        eventType,
        total: order.Total,
        currency: order.Currency,
        eventId: order.EventId,
        buyerName: order.BuyerName,
        buyerEmail: order.BuyerEmail,
        paidAt: order.PaidAt,
        paymentMethod: order.PaymentMethod,
        paymentRef: order.PaymentRef,
      }
    : { orderId, eventType };

  const rows = await callSp("usp_tkt_erp_sync_enqueue", {
    OrderId: orderId,
    EventType: eventType,
    Payload: JSON.stringify(payload),
    CompanyId: companyId,
  });

  return rows[0] as { ok: boolean; mensaje: string; SyncId: number };
}

/* ── Listar pendientes (el ERP hace polling) ───────────────────────────────── */

export async function listPending(companyId = 0, limit = 50) {
  return callSp("usp_tkt_erp_sync_list_pending", {
    CompanyId: companyId,
    Limit: limit,
  });
}

/* ── Marcar como sincronizado ──────────────────────────────────────────────── */

export async function markSynced(syncId: number, success = true, error?: string) {
  const rows = await callSp("usp_tkt_erp_sync_mark_done", {
    SyncId: syncId,
    Success: success,
    Error: error ?? null,
  });
  return rows[0] as { ok: boolean; mensaje: string };
}

/* ── Estadísticas ──────────────────────────────────────────────────────────── */

export async function getStats(companyId = 0) {
  const rows = await callSp("usp_tkt_erp_sync_stats", {
    CompanyId: companyId,
  });
  const r = rows[0] as Record<string, unknown> | undefined;
  return {
    pending: Number(r?.Pending ?? 0),
    syncedToday: Number(r?.SyncedToday ?? 0),
    failed: Number(r?.Failed ?? 0),
    total: Number(r?.Total ?? 0),
  };
}

/* ── Últimas sincronizaciones ──────────────────────────────────────────────── */

export async function getRecent(companyId = 0, limit = 20) {
  return callSp("usp_tkt_erp_sync_recent", {
    CompanyId: companyId,
    Limit: limit,
  });
}
