import { query } from "../../db/pool.js";

/* ── EVENTS ── */

interface ListEventsParams {
  companyId: number;
  search?: string;
  status?: string;
  venueId?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function listEvents(params: ListEventsParams) {
  const { companyId, search, status, venueId, from, to, page = 1, limit = 50 } = params;
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT e.*, v."Name" AS "VenueName", v."City", v."Country",
       vc."Name" AS "ConfigurationName",
       COUNT(*) OVER() AS "TotalCount"
     FROM tkt.event e
     JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
     JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
     WHERE e."CompanyId" = $1
       AND ($2 = '' OR e."Name" ILIKE '%' || $2 || '%')
       AND ($3 = '' OR e."Status" = $3)
       AND ($4::INT IS NULL OR vc."VenueId" = $4)
       AND ($5::TIMESTAMPTZ IS NULL OR e."EventDate" >= $5::TIMESTAMPTZ)
       AND ($6::TIMESTAMPTZ IS NULL OR e."EventDate" <= $6::TIMESTAMPTZ)
     ORDER BY e."EventDate" DESC
     LIMIT $7 OFFSET $8`,
    [companyId, search ?? "", status ?? "", venueId ?? null, from ?? null, to ?? null, limit, offset]
  );

  const total = result.rows[0]?.TotalCount ?? 0;
  return { rows: result.rows, total: Number(total), page, limit };
}

export async function getEvent(eventId: number) {
  const result = await query(
    `SELECT e.*, v."Name" AS "VenueName", v."City", v."Country",
       vc."Name" AS "ConfigurationName"
     FROM tkt.event e
     JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
     JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
     WHERE e."EventId" = $1`,
    [eventId]
  );
  return result.rows[0] ?? null;
}

export async function upsertEvent(data: Record<string, unknown>) {
  const { eventId, companyId, createdBy, updatedBy, ...f } = data;

  if (eventId) {
    const result = await query(
      `UPDATE tkt.event SET
        "Name" = $1, "Description" = $2, "ConfigurationId" = $3,
        "EventDate" = $4, "DoorsOpen" = $5, "Status" = $6,
        "EventType" = $7, "ImageUrl" = $8, "MaxTicketsPerOrder" = $9,
        "IsPublished" = $10, "UpdatedBy" = $11, "UpdatedAt" = NOW()
       WHERE "EventId" = $12
       RETURNING *`,
      [
        f.name, f.description, f.configurationId,
        f.eventDate, f.doorsOpen, f.status,
        f.eventType, f.imageUrl, f.maxTicketsPerOrder ?? 6,
        f.isPublished ?? false, updatedBy, eventId,
      ]
    );
    return { success: true, event: result.rows[0] };
  }

  const result = await query(
    `INSERT INTO tkt.event
      ("CompanyId", "Name", "Description", "ConfigurationId",
       "EventDate", "DoorsOpen", "Status", "EventType",
       "ImageUrl", "MaxTicketsPerOrder", "IsPublished", "CreatedBy")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      companyId, f.name, f.description, f.configurationId,
      f.eventDate, f.doorsOpen, f.status ?? "draft",
      f.eventType ?? "general", f.imageUrl, f.maxTicketsPerOrder ?? 6,
      f.isPublished ?? false, createdBy,
    ]
  );
  return { success: true, event: result.rows[0] };
}

/* ── PRICING ZONES ── */

export async function listPricingZones(eventId: number) {
  const result = await query(
    `SELECT pz.*, array_agg(pzs."SectionId") FILTER (WHERE pzs."SectionId" IS NOT NULL) AS "SectionIds"
     FROM tkt.pricing_zone pz
     LEFT JOIN tkt.pricing_zone_section pzs ON pzs."ZoneId" = pz."ZoneId"
     WHERE pz."EventId" = $1
     GROUP BY pz."ZoneId"
     ORDER BY pz."Price" DESC`,
    [eventId]
  );
  return result.rows;
}

export async function upsertPricingZone(data: Record<string, unknown>) {
  const { zoneId, eventId, sectionIds, ...f } = data;

  let zone;
  if (zoneId) {
    const result = await query(
      `UPDATE tkt.pricing_zone SET
        "Name" = $1, "Color" = $2, "Price" = $3, "Currency" = $4
       WHERE "ZoneId" = $5 RETURNING *`,
      [f.name, f.color, f.price, f.currency ?? "USD", zoneId]
    );
    zone = result.rows[0];
  } else {
    const result = await query(
      `INSERT INTO tkt.pricing_zone ("EventId", "Name", "Color", "Price", "Currency")
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [eventId, f.name, f.color, f.price, f.currency ?? "USD"]
    );
    zone = result.rows[0];
  }

  // Sync section associations
  if (Array.isArray(sectionIds)) {
    const id = zone.ZoneId;
    await query(`DELETE FROM tkt.pricing_zone_section WHERE "ZoneId" = $1`, [id]);
    for (const secId of sectionIds as number[]) {
      await query(
        `INSERT INTO tkt.pricing_zone_section ("ZoneId", "SectionId") VALUES ($1, $2)`,
        [id, secId]
      );
    }
  }

  return { success: true, zone };
}

/* ── INVENTORY ── */

export async function initializeEventInventory(eventId: number) {
  // Obtener la config del evento
  const ev = await query(
    `SELECT "ConfigurationId" FROM tkt.event WHERE "EventId" = $1`,
    [eventId]
  );
  if (!ev.rows.length) throw new Error("event_not_found");

  const configId = ev.rows[0].ConfigurationId;

  // Insertar inventario para cada asiento de la configuración
  const result = await query(
    `INSERT INTO tkt.event_inventory ("EventId", "SeatId", "SectionId", "Status")
     SELECT $1, st."SeatId", s."SectionId", 'available'
     FROM tkt.section s
     JOIN tkt.row r ON r."SectionId" = s."SectionId"
     JOIN tkt.seat st ON st."RowId" = r."RowId"
     WHERE s."ConfigurationId" = $2
       AND NOT s."IsGeneralAdmission"
     ON CONFLICT ("EventId", "SeatId") DO NOTHING`,
    [eventId, configId]
  );

  // Inicializar GA inventory
  await query(
    `INSERT INTO tkt.event_ga_inventory ("EventId", "SectionId", "TotalCapacity", "SoldCount")
     SELECT $1, s."SectionId", s."GaCapacity", 0
     FROM tkt.section s
     WHERE s."ConfigurationId" = $2
       AND s."IsGeneralAdmission" = true
     ON CONFLICT ("EventId", "SectionId") DO NOTHING`,
    [eventId, configId]
  );

  return { success: true, seatsCreated: result.rowCount };
}

/* ── AVAILABILITY ── */

export async function getSeatAvailability(eventId: number, sectionId?: number) {
  if (sectionId) {
    // Detalle por asiento de una sección
    const result = await query(
      `SELECT ei."SeatId", ei."Status", ei."HeldUntil",
         r."Label" AS "RowLabel", st."Number" AS "SeatNumber",
         st."SeatType", st."IsAccessible",
         COALESCE(pz."Price", 0) AS "Price",
         COALESCE(pz."Currency", 'USD') AS "Currency"
       FROM tkt.event_inventory ei
       JOIN tkt.seat st ON st."SeatId" = ei."SeatId"
       JOIN tkt.row r ON r."RowId" = st."RowId"
       LEFT JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = ei."SectionId"
       LEFT JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = ei."EventId"
       WHERE ei."EventId" = $1 AND ei."SectionId" = $2
       ORDER BY r."SortOrder", st."Number"`,
      [eventId, sectionId]
    );
    return { seats: result.rows };
  }

  // Resumen por sección
  const result = await query(
    `SELECT s."SectionId", s."Name", s."Code", s."Category", s."Color",
       s."Polygon", s."IsGeneralAdmission",
       COUNT(ei.*) FILTER (WHERE ei."Status" = 'available') AS "Available",
       COUNT(ei.*) FILTER (WHERE ei."Status" = 'held') AS "Held",
       COUNT(ei.*) FILTER (WHERE ei."Status" = 'sold') AS "Sold",
       COUNT(ei.*) AS "Total",
       COALESCE(MIN(pz."Price"), 0) AS "MinPrice"
     FROM tkt.section s
     LEFT JOIN tkt.event_inventory ei ON ei."SectionId" = s."SectionId" AND ei."EventId" = $1
     LEFT JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = s."SectionId"
     LEFT JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = $1
     WHERE s."ConfigurationId" = (SELECT "ConfigurationId" FROM tkt.event WHERE "EventId" = $1)
     GROUP BY s."SectionId"
     ORDER BY s."SortOrder"`,
    [eventId]
  );

  // GA sections
  const ga = await query(
    `SELECT egi."SectionId", egi."TotalCapacity", egi."SoldCount",
       (egi."TotalCapacity" - egi."SoldCount") AS "Available"
     FROM tkt.event_ga_inventory egi
     WHERE egi."EventId" = $1`,
    [eventId]
  );

  return { sections: result.rows, generalAdmission: ga.rows };
}

/* ── HOLD / RELEASE ── */

const HOLD_TTL_MINUTES = 10;

export async function holdSeats(eventId: number, seatIds: number[], userId: string) {
  const result = await query(
    `UPDATE tkt.event_inventory SET
      "Status" = 'held',
      "HeldBy" = $1,
      "HeldUntil" = NOW() + INTERVAL '${HOLD_TTL_MINUTES} minutes'
     WHERE "EventId" = $2
       AND "SeatId" = ANY($3::INT[])
       AND "Status" = 'available'
     RETURNING "SeatId"`,
    [userId, eventId, seatIds]
  );

  return {
    success: true,
    heldSeats: result.rows.map((r) => r.SeatId),
    heldCount: result.rowCount,
    expiresInMinutes: HOLD_TTL_MINUTES,
  };
}

export async function releaseSeats(eventId: number, seatIds: number[], userId: string) {
  const result = await query(
    `UPDATE tkt.event_inventory SET
      "Status" = 'available', "HeldBy" = NULL, "HeldUntil" = NULL
     WHERE "EventId" = $1
       AND "SeatId" = ANY($2::INT[])
       AND "HeldBy" = $3
       AND "Status" = 'held'
     RETURNING "SeatId"`,
    [eventId, seatIds, userId]
  );
  return { success: true, releasedCount: result.rowCount };
}

/**
 * Liberar holds expirados — llamar via cron cada 30s.
 */
export async function releaseExpiredHolds() {
  const result = await query(
    `UPDATE tkt.event_inventory SET
      "Status" = 'available', "HeldBy" = NULL, "HeldUntil" = NULL
     WHERE "Status" = 'held' AND "HeldUntil" < NOW()
     RETURNING "EventId", "SeatId"`
  );
  return result.rows;
}


/* ── EVENT SEATMAP ── */
export async function getEventSeatMap(eventId: number) {
  const ev = await query(`SELECT e.*, v."Name" AS "VenueName", vc."ConfigurationId" FROM tkt.event e JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId" JOIN tkt.venue v ON v."VenueId" = vc."VenueId" WHERE e."EventId" = $1`, [eventId]);
  if (!ev.rows.length) throw new Error("event_not_found");
  const event = ev.rows[0];
  const sections = await query(
    `SELECT s.*, COALESCE(MIN(pz."Price"), 0) AS "Price", COALESCE(MIN(pz."Currency"), 'USD') AS "Currency",
       json_agg(json_build_object('RowId', r."RowId", 'Label', r."Label", 'SeatCount', r."SeatCount",
         'seats', (SELECT json_agg(json_build_object('SeatId', st."SeatId", 'Number', st."Number", 'SeatType', st."SeatType", 'IsAccessible', st."IsAccessible", 'Status', COALESCE(ei."Status", 'available')) ORDER BY st."Number") FROM tkt.seat st LEFT JOIN tkt.event_inventory ei ON ei."SeatId" = st."SeatId" AND ei."EventId" = $1 WHERE st."RowId" = r."RowId")
       ) ORDER BY r."SortOrder") FILTER (WHERE r."RowId" IS NOT NULL) AS "Rows"
     FROM tkt.section s LEFT JOIN tkt.row r ON r."SectionId" = s."SectionId"
     LEFT JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = s."SectionId"
     LEFT JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = $1
     WHERE s."ConfigurationId" = $2 GROUP BY s."SectionId" ORDER BY s."SortOrder"`,
    [eventId, event.ConfigurationId]);
  return { event, sections: sections.rows };
}
