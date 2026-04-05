import { callSp } from "../../db/query.js";

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

  const rows = await callSp("usp_tkt_event_list", {
    CompanyId: companyId,
    Search: search ?? "",
    Status: status ?? "",
    VenueId: venueId ?? null,
    From: from ?? null,
    To: to ?? null,
    Page: page,
    Limit: limit,
  });

  const total = Number((rows[0] as Record<string, unknown>)?.TotalCount ?? 0);
  return { rows, total, page, limit };
}

export async function getEvent(eventId: number) {
  const rows = await callSp("usp_tkt_event_get", { EventId: eventId });
  return rows[0] ?? null;
}

export async function upsertEvent(data: Record<string, unknown>) {
  const rows = await callSp("usp_tkt_event_upsert", {
    EventId: data.eventId ?? null,
    CompanyId: data.companyId ?? null,
    Name: data.name ?? null,
    Description: data.description ?? null,
    ConfigurationId: data.configurationId ?? null,
    EventDate: data.eventDate ?? null,
    DoorsOpen: data.doorsOpen ?? null,
    Status: data.status ?? "draft",
    EventType: data.eventType ?? "general",
    ImageUrl: data.imageUrl ?? null,
    MaxTicketsPerOrder: data.maxTicketsPerOrder ?? 6,
    IsPublished: data.isPublished ?? false,
    CreatedBy: data.createdBy ?? null,
    UpdatedBy: data.updatedBy ?? null,
  });

  const result = rows[0] as Record<string, unknown>;
  const event = await getEvent(Number(result.EventId));
  return { success: true, event };
}

/* ── PRICING ZONES ── */

export async function listPricingZones(eventId: number) {
  return callSp("usp_tkt_event_pricingzone_list", { EventId: eventId });
}

export async function upsertPricingZone(data: Record<string, unknown>) {
  const rows = await callSp("usp_tkt_event_pricingzone_upsert", {
    ZoneId: data.zoneId ?? null,
    EventId: data.eventId ?? null,
    Name: data.name ?? null,
    Color: data.color ?? "#10B981",
    Price: data.price ?? 0,
    Currency: data.currency ?? "USD",
    SectionIds: Array.isArray(data.sectionIds) ? data.sectionIds : null,
  });

  const result = rows[0] as Record<string, unknown>;
  return { success: true, zone: result };
}

/* ── INVENTORY ── */

export async function initializeEventInventory(eventId: number) {
  const rows = await callSp("usp_tkt_event_initialize_inventory", {
    EventId: eventId,
  });

  const result = rows[0] as Record<string, unknown>;
  if (!result?.ok) throw new Error(String(result?.mensaje ?? "event_not_found"));
  return { success: true, seatsCreated: Number(result.SeatsCreated) };
}

/* ── AVAILABILITY ── */

export async function getSeatAvailability(eventId: number, sectionId?: number) {
  const rows = await callSp("usp_tkt_event_get_availability", {
    EventId: eventId,
    SectionId: sectionId ?? null,
  });

  if (sectionId) {
    return { seats: rows };
  }

  // Separate GA and seated sections
  const sections = rows.filter((r: Record<string, unknown>) => !r.IsGeneralAdmission);
  const generalAdmission = rows
    .filter((r: Record<string, unknown>) => r.IsGeneralAdmission)
    .map((r: Record<string, unknown>) => ({
      SectionId: r.SectionId,
      TotalCapacity: r.TotalCapacity,
      SoldCount: r.SoldCount,
      Available: r.GaAvailable,
    }));

  return { sections, generalAdmission };
}

/* ── HOLD / RELEASE ── */

export async function holdSeats(eventId: number, seatIds: number[], userId: string) {
  const rows = await callSp("usp_tkt_event_hold_seats", {
    EventId: eventId,
    SeatIds: seatIds,
    UserId: userId,
  });

  const result = rows[0] as Record<string, unknown>;
  return {
    success: true,
    heldCount: Number(result?.HeldCount ?? 0),
    expiresInMinutes: Number(result?.ExpiresInMinutes ?? 10),
  };
}

export async function releaseSeats(eventId: number, seatIds: number[], userId: string) {
  const rows = await callSp("usp_tkt_event_release_seats", {
    EventId: eventId,
    SeatIds: seatIds,
    UserId: userId,
  });

  const result = rows[0] as Record<string, unknown>;
  return { success: true, releasedCount: Number(result?.ReleasedCount ?? 0) };
}

/**
 * Liberar holds expirados — llamar via cron cada 30s.
 */
export async function releaseExpiredHolds() {
  return callSp("usp_tkt_event_release_expired", {});
}

/* ── EVENT SEATMAP ── */

export async function getEventSeatMap(eventId: number) {
  const rows = await callSp("usp_tkt_event_get_seatmap", {
    EventId: eventId,
  });

  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) throw new Error("event_not_found");

  return {
    event: {
      EventId: row.EventId,
      Name: row.EventName,
      EventDate: row.EventDate,
      Status: row.Status,
      ConfigurationId: row.ConfigurationId,
      VenueName: row.VenueName,
    },
    sections: row.Sections ?? [],
  };
}
