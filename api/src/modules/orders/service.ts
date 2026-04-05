import { callSp } from "../../db/query.js";
import { env } from "../../config/env.js";
import { notify, TEMPLATES } from "../../notifications/notify.js";

/* ── ORDERS ── */

interface ListOrdersParams {
  userId: string;
  companyId: number;
  page?: number;
  limit?: number;
}

export async function listOrders(params: ListOrdersParams) {
  const { userId, companyId, page = 1, limit = 20 } = params;

  const rows = await callSp("usp_tkt_order_list", {
    UserId: userId,
    CompanyId: companyId,
    Page: page,
    Limit: limit,
  });

  const total = Number((rows[0] as Record<string, unknown>)?.TotalCount ?? 0);
  return { rows, total, page, limit };
}

export async function getOrder(orderId: number, userId: string) {
  const rows = await callSp("usp_tkt_order_get", {
    OrderId: orderId,
    UserId: userId,
  });
  return rows[0] ?? null;
}

/* ── CHECKOUT ── */

interface CheckoutParams {
  eventId: number;
  seatIds: number[];
  userId: string;
  companyId: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
}

export async function checkout(params: CheckoutParams) {
  const { eventId, seatIds, userId, companyId, buyerName, buyerEmail, buyerPhone } = params;

  const rows = await callSp("usp_tkt_order_checkout", {
    EventId: eventId,
    SeatIds: seatIds,
    UserId: userId,
    CompanyId: companyId,
    BuyerName: buyerName,
    BuyerEmail: buyerEmail,
    BuyerPhone: buyerPhone ?? null,
    JwtSecret: env.jwt.secret,
  });

  const result = rows[0] as Record<string, unknown>;
  if (!result?.ok) throw new Error(String(result?.mensaje ?? "checkout_failed"));

  return {
    success: true,
    order: {
      OrderId: result.OrderId,
      Total: result.Total,
      Currency: result.Currency,
      ticketCount: Number(result.TicketCount),
    },
  };
}

/* ── CONFIRM PAYMENT ── */

export async function confirmPayment(orderId: number, paymentRef: string, paymentMethod: string) {
  const rows = await callSp("usp_tkt_order_confirm_payment", {
    OrderId: orderId,
    PaymentRef: paymentRef,
    PaymentMethod: paymentMethod,
  });

  const result = rows[0] as Record<string, unknown>;
  if (!result?.ok) throw new Error(String(result?.mensaje ?? "order_not_found_or_already_paid"));

  // Send confirmation email (fire and forget)
  sendOrderConfirmation(result).catch(() => {});

  return { success: true, order: result };
}

async function sendOrderConfirmation(order: Record<string, unknown>) {
  if (!env.notifyApiKey) return;

  // Get event details for email
  const events = await callSp("usp_tkt_event_get", { EventId: Number(order.EventId) });
  const ev = events[0] as Record<string, unknown> | undefined;
  if (!ev) return;

  const tickets = await callSp("usp_tkt_order_get_tickets", {
    OrderId: Number(order.OrderId),
    UserId: "", // admin context — the SP fetches all tickets for the order
  });

  try {
    await notify.email.send({
      to: String(order.BuyerEmail),
      templateId: TEMPLATES.ORDER_CONFIRMATION,
      variables: {
        buyerName: String(order.BuyerName),
        eventName: String(ev.Name),
        eventDate: new Date(String(ev.EventDate)).toLocaleDateString("es", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        }),
        venueName: String(ev.VenueName),
        ticketCount: String(tickets.length),
        total: Number(order.Total).toFixed(2),
        currency: String(order.Currency),
        orderId: String(order.OrderId),
      },
      track: true,
    });
  } catch (err) {
    console.error("[notify] Error enviando confirmacion:", err);
  }
}

/* ── CANCEL ── */

export async function cancelOrder(orderId: number, userId: string) {
  const rows = await callSp("usp_tkt_order_cancel", {
    OrderId: orderId,
    UserId: userId,
  });

  const result = rows[0] as Record<string, unknown>;
  if (!result?.ok) throw new Error(String(result?.mensaje ?? "order_not_found"));

  // Send cancellation email (fire and forget)
  if (env.notifyApiKey && result.BuyerEmail) {
    const events = await callSp("usp_tkt_event_get", { EventId: Number(result.EventId) });
    const ev = events[0] as Record<string, unknown> | undefined;

    notify.email.send({
      to: String(result.BuyerEmail),
      templateId: TEMPLATES.TICKET_CANCELLED,
      variables: {
        buyerName: String(result.BuyerName),
        eventName: String(ev?.Name ?? ""),
        orderId: String(orderId),
        total: Number(result.Total).toFixed(2),
        currency: String(result.Currency),
      },
    }).catch(() => {});
  }

  return { success: true };
}

/* ── TICKETS ── */

export async function getOrderTickets(orderId: number, userId: string) {
  return callSp("usp_tkt_order_get_tickets", {
    OrderId: orderId,
    UserId: userId,
  });
}
