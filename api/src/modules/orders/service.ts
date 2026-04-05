import crypto from "crypto";
import { query } from "../../db/pool.js";
import { env } from "../../config/env.js";

/* ── ORDERS ── */

interface ListOrdersParams {
  userId: string;
  companyId: number;
  page?: number;
  limit?: number;
}

export async function listOrders(params: ListOrdersParams) {
  const { userId, companyId, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT o.*, e."Name" AS "EventName", e."EventDate",
       v."Name" AS "VenueName",
       COUNT(*) OVER() AS "TotalCount",
       (SELECT COUNT(*) FROM tkt.ticket t WHERE t."OrderId" = o."OrderId") AS "TicketCount"
     FROM tkt."order" o
     JOIN tkt.event e ON e."EventId" = o."EventId"
     JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
     JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
     WHERE o."UserId" = $1 AND o."CompanyId" = $2
     ORDER BY o."CreatedAt" DESC
     LIMIT $3 OFFSET $4`,
    [userId, companyId, limit, offset]
  );

  const total = result.rows[0]?.TotalCount ?? 0;
  return { rows: result.rows, total: Number(total), page, limit };
}

export async function getOrder(orderId: number, userId: string) {
  const result = await query(
    `SELECT o.*, e."Name" AS "EventName", e."EventDate",
       v."Name" AS "VenueName"
     FROM tkt."order" o
     JOIN tkt.event e ON e."EventId" = o."EventId"
     JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
     JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
     WHERE o."OrderId" = $1 AND o."UserId" = $2`,
    [orderId, userId]
  );
  return result.rows[0] ?? null;
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

  // Validar que los asientos están held por este usuario
  const held = await query(
    `SELECT ei."SeatId", pz."Price", pz."Currency"
     FROM tkt.event_inventory ei
     JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = ei."SectionId"
     JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = ei."EventId"
     WHERE ei."EventId" = $1
       AND ei."SeatId" = ANY($2::INT[])
       AND ei."HeldBy" = $3
       AND ei."Status" = 'held'`,
    [eventId, seatIds, userId]
  );

  if (held.rows.length !== seatIds.length) {
    throw new Error("some_seats_not_held");
  }

  const total = held.rows.reduce((sum, r) => sum + Number(r.Price), 0);
  const currency = held.rows[0]?.Currency ?? "USD";

  // Crear orden
  const orderResult = await query(
    `INSERT INTO tkt."order"
      ("CompanyId", "EventId", "UserId", "BuyerName", "BuyerEmail", "BuyerPhone",
       "Total", "Currency", "Status")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending_payment')
     RETURNING *`,
    [companyId, eventId, userId, buyerName, buyerEmail, buyerPhone ?? null, total, currency]
  );
  const order = orderResult.rows[0];

  // Crear tickets con QR
  for (const seat of held.rows) {
    const barcode = generateBarcode(order.OrderId, eventId, seat.SeatId);
    await query(
      `INSERT INTO tkt.ticket
        ("OrderId", "EventId", "SeatId", "Barcode", "Price", "Currency", "Status")
       VALUES ($1,$2,$3,$4,$5,$6,'active')`,
      [order.OrderId, eventId, seat.SeatId, barcode, seat.Price, seat.Currency]
    );
  }

  // Marcar asientos como sold
  await query(
    `UPDATE tkt.event_inventory SET
      "Status" = 'sold', "OrderId" = $1, "HeldBy" = NULL, "HeldUntil" = NULL
     WHERE "EventId" = $2 AND "SeatId" = ANY($3::INT[])`,
    [order.OrderId, eventId, seatIds]
  );

  return {
    success: true,
    order: { ...order, ticketCount: seatIds.length },
  };
}

/* ── CONFIRM PAYMENT ── */

export async function confirmPayment(orderId: number, paymentRef: string, paymentMethod: string) {
  const result = await query(
    `UPDATE tkt."order" SET
      "Status" = 'paid', "PaymentRef" = $1, "PaymentMethod" = $2, "PaidAt" = NOW()
     WHERE "OrderId" = $3 AND "Status" = 'pending_payment'
     RETURNING *`,
    [paymentRef, paymentMethod, orderId]
  );

  if (!result.rows.length) throw new Error("order_not_found_or_already_paid");
  return { success: true, order: result.rows[0] };
}

/* ── CANCEL ── */

export async function cancelOrder(orderId: number, userId: string) {
  const order = await query(
    `SELECT * FROM tkt."order" WHERE "OrderId" = $1 AND "UserId" = $2`,
    [orderId, userId]
  );
  if (!order.rows.length) throw new Error("order_not_found");

  // Liberar asientos
  await query(
    `UPDATE tkt.event_inventory SET
      "Status" = 'available', "OrderId" = NULL, "HeldBy" = NULL, "HeldUntil" = NULL
     WHERE "OrderId" = $1`,
    [orderId]
  );

  // Cancelar tickets
  await query(
    `UPDATE tkt.ticket SET "Status" = 'cancelled' WHERE "OrderId" = $1`,
    [orderId]
  );

  // Cancelar orden
  await query(
    `UPDATE tkt."order" SET "Status" = 'cancelled' WHERE "OrderId" = $1`,
    [orderId]
  );

  return { success: true };
}

/* ── TICKETS ── */

export async function getOrderTickets(orderId: number, userId: string) {
  const result = await query(
    `SELECT t.*, r."Label" AS "RowLabel", st."Number" AS "SeatNumber",
       s."Name" AS "SectionName", s."Code" AS "SectionCode",
       e."Name" AS "EventName", e."EventDate",
       v."Name" AS "VenueName"
     FROM tkt.ticket t
     JOIN tkt."order" o ON o."OrderId" = t."OrderId"
     JOIN tkt.event e ON e."EventId" = t."EventId"
     JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
     JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
     LEFT JOIN tkt.seat st ON st."SeatId" = t."SeatId"
     LEFT JOIN tkt.row r ON r."RowId" = st."RowId"
     LEFT JOIN tkt.section s ON s."SectionId" = r."SectionId"
     WHERE t."OrderId" = $1 AND o."UserId" = $2
     ORDER BY s."SortOrder", r."SortOrder", st."Number"`,
    [orderId, userId]
  );
  return result.rows;
}

/* ── QR / BARCODE ── */

function generateBarcode(orderId: number, eventId: number, seatId: number): string {
  const timestamp = Date.now();
  const payload = `${orderId}|${eventId}|${seatId}|${timestamp}`;
  const hmac = crypto
    .createHmac("sha256", env.jwt.secret)
    .update(payload)
    .digest("hex")
    .slice(0, 16);
  return `ZT-${payload}|${hmac}`;
}
