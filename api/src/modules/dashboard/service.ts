import { query } from "../../db/pool.js";

export async function getStats(companyId: number) {
  const events = await query(
    `SELECT COUNT(*) FILTER (WHERE "Status" IN ('published','on_sale')) AS "ActiveEvents",
       COUNT(*) FILTER (WHERE "EventType" = 'race') AS "TotalRaces",
       COUNT(*) AS "TotalEvents"
     FROM tkt.event WHERE "CompanyId" = $1`,
    [companyId]
  );
  const tickets = await query(
    `SELECT COUNT(*) FILTER (WHERE t."Status" = 'active') AS "TotalTicketsSold",
       COUNT(*) FILTER (WHERE t."ScannedAt" IS NOT NULL AND t."ScannedAt"::DATE = CURRENT_DATE) AS "ScannedToday"
     FROM tkt.ticket t JOIN tkt."order" o ON o."OrderId" = t."OrderId"
     JOIN tkt.event e ON e."EventId" = t."EventId"
     WHERE e."CompanyId" = $1 AND o."Status" = 'paid'`,
    [companyId]
  );
  const revenue = await query(
    `SELECT COALESCE(SUM(o."Total"), 0) AS "TotalRevenue",
       COALESCE(SUM(o."Total") FILTER (WHERE o."PaidAt"::DATE = CURRENT_DATE), 0) AS "RevenueToday",
       COALESCE(SUM(o."Total") FILTER (WHERE o."PaidAt" >= DATE_TRUNC('week', CURRENT_DATE)), 0) AS "RevenueWeek",
       COALESCE(SUM(o."Total") FILTER (WHERE o."PaidAt" >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS "RevenueMonth"
     FROM tkt."order" o JOIN tkt.event e ON e."EventId" = o."EventId"
     WHERE e."CompanyId" = $1 AND o."Status" = 'paid'`,
    [companyId]
  );
  const venues = await query(`SELECT COUNT(*) AS "TotalVenues" FROM tkt.venue WHERE "CompanyId" = $1 AND "IsActive" = true`, [companyId]);
  const raceRegs = await query(`SELECT COUNT(*) AS "TotalRegistrations" FROM tkt.race_registration rr JOIN tkt.race r ON r."RaceId" = rr."RaceId" JOIN tkt.event e ON e."EventId" = r."EventId" WHERE e."CompanyId" = $1`, [companyId]);
  return {
    activeEvents: Number(events.rows[0]?.ActiveEvents ?? 0),
    totalRaces: Number(events.rows[0]?.TotalRaces ?? 0),
    totalEvents: Number(events.rows[0]?.TotalEvents ?? 0),
    totalTicketsSold: Number(tickets.rows[0]?.TotalTicketsSold ?? 0),
    scannedToday: Number(tickets.rows[0]?.ScannedToday ?? 0),
    totalRevenue: Number(revenue.rows[0]?.TotalRevenue ?? 0),
    revenueToday: Number(revenue.rows[0]?.RevenueToday ?? 0),
    revenueWeek: Number(revenue.rows[0]?.RevenueWeek ?? 0),
    revenueMonth: Number(revenue.rows[0]?.RevenueMonth ?? 0),
    totalVenues: Number(venues.rows[0]?.TotalVenues ?? 0),
    totalRaceRegistrations: Number(raceRegs.rows[0]?.TotalRegistrations ?? 0),
  };
}

export async function getSales(companyId: number, period: string) {
  const interval = period === "week" ? "7 days" : period === "year" ? "365 days" : "30 days";
  const dateFormat = period === "year" ? "YYYY-MM" : "YYYY-MM-DD";
  const result = await query(
    `SELECT TO_CHAR(o."PaidAt", $3) AS "Date", COUNT(*) AS "Orders",
       COALESCE(SUM(o."Total"), 0) AS "Revenue",
       SUM((SELECT COUNT(*) FROM tkt.ticket t WHERE t."OrderId" = o."OrderId")) AS "Tickets"
     FROM tkt."order" o JOIN tkt.event e ON e."EventId" = o."EventId"
     WHERE e."CompanyId" = $1 AND o."Status" = 'paid' AND o."PaidAt" >= NOW() - ($2)::INTERVAL
     GROUP BY TO_CHAR(o."PaidAt", $3) ORDER BY "Date"`,
    [companyId, interval, dateFormat]
  );
  return result.rows.map((r) => ({ date: r.Date, orders: Number(r.Orders), revenue: Number(r.Revenue), tickets: Number(r.Tickets) }));
}

export async function getUpcomingEvents(companyId: number, limit = 5) {
  const result = await query(
    `SELECT e."EventId", e."Name", e."EventDate", e."Status", e."EventType", e."ImageUrl",
       v."Name" AS "VenueName", v."City",
       COALESCE(tk."SoldCount", 0) AS "SoldCount", COALESCE(tk."Revenue", 0) AS "Revenue"
     FROM tkt.event e
     JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
     JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS "SoldCount", COALESCE(SUM(o."Total"), 0) AS "Revenue"
       FROM tkt."order" o WHERE o."EventId" = e."EventId" AND o."Status" = 'paid'
     ) tk ON TRUE
     WHERE e."CompanyId" = $1 AND e."EventDate" >= NOW() AND e."Status" IN ('published','on_sale')
     ORDER BY e."EventDate" ASC LIMIT $2`,
    [companyId, limit]
  );
  return result.rows.map((r) => ({
    eventId: r.EventId, name: r.Name, eventDate: r.EventDate, status: r.Status,
    eventType: r.EventType, imageUrl: r.ImageUrl, venueName: r.VenueName, city: r.City,
    ticketsSold: Number(r.SoldCount), revenue: Number(r.Revenue),
  }));
}

export async function getRaceStats(companyId: number) {
  const result = await query(
    `SELECT r."RaceId", e."Name" AS "EventName", r."Distance", r."MaxParticipants", e."EventDate",
       COUNT(rr."RegistrationId") AS "RegisteredCount",
       COUNT(rr."RegistrationId") FILTER (WHERE rr."Status" = 'confirmed') AS "ConfirmedCount",
       COUNT(rr."RegistrationId") FILTER (WHERE rr."Status" = 'finished') AS "FinishedCount"
     FROM tkt.race r JOIN tkt.event e ON e."EventId" = r."EventId"
     LEFT JOIN tkt.race_registration rr ON rr."RaceId" = r."RaceId"
     WHERE e."CompanyId" = $1
     GROUP BY r."RaceId", e."Name", r."Distance", r."MaxParticipants", e."EventDate"
     ORDER BY e."EventDate" DESC`,
    [companyId]
  );
  return result.rows.map((r) => ({
    raceId: r.RaceId, eventName: r.EventName, distance: r.Distance,
    maxParticipants: Number(r.MaxParticipants), eventDate: r.EventDate,
    registeredCount: Number(r.RegisteredCount), confirmedCount: Number(r.ConfirmedCount), finishedCount: Number(r.FinishedCount),
  }));
}

export async function getVenueOccupancy(companyId: number) {
  const result = await query(
    `SELECT v."VenueId", v."Name" AS "VenueName", v."City", v."Capacity",
       COUNT(DISTINCT e."EventId") AS "EventCount",
       COALESCE(SUM(inv."SoldCount"), 0) AS "TotalSold", COALESCE(SUM(inv."TotalSeats"), 0) AS "TotalSeats"
     FROM tkt.venue v
     LEFT JOIN tkt.venue_configuration vc ON vc."VenueId" = v."VenueId"
     LEFT JOIN tkt.event e ON e."ConfigurationId" = vc."ConfigurationId" AND e."EventDate" >= NOW() AND e."Status" IN ('published','on_sale')
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS "TotalSeats", COUNT(*) FILTER (WHERE ei."Status" = 'sold') AS "SoldCount"
       FROM tkt.event_inventory ei WHERE ei."EventId" = e."EventId"
     ) inv ON TRUE
     WHERE v."CompanyId" = $1 AND v."IsActive" = true
     GROUP BY v."VenueId", v."Name", v."City", v."Capacity" ORDER BY v."Name"`,
    [companyId]
  );
  return result.rows.map((r) => ({
    venueId: r.VenueId, venueName: r.VenueName, city: r.City, capacity: Number(r.Capacity),
    eventCount: Number(r.EventCount), totalSold: Number(r.TotalSold), totalSeats: Number(r.TotalSeats),
    occupancyPct: Number(r.TotalSeats) > 0 ? Math.round((Number(r.TotalSold) / Number(r.TotalSeats)) * 100) : 0,
  }));
}
