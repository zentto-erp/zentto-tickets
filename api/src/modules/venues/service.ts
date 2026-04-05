import { callSp, callSpOut } from "../../db/query.js";

/* ── VENUES ── */

interface ListVenuesParams {
  companyId: number;
  search?: string;
  city?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export async function listVenues(params: ListVenuesParams) {
  const { companyId, search, city, country, page = 1, limit = 50 } = params;

  const rows = await callSp("usp_tkt_venue_list", {
    CompanyId: companyId,
    Search: search ?? "",
    City: city ?? "",
    Country: country ?? "",
    Page: page,
    Limit: limit,
  });

  const total = Number((rows[0] as Record<string, unknown>)?.TotalCount ?? 0);
  return { rows, total, page, limit };
}

export async function getVenue(venueId: number) {
  const rows = await callSp("usp_tkt_venue_get", { VenueId: venueId });
  return rows[0] ?? null;
}

export async function upsertVenue(data: Record<string, unknown>) {
  const rows = await callSp("usp_tkt_venue_upsert", {
    VenueId: data.venueId ?? null,
    CompanyId: data.companyId ?? null,
    Name: data.name ?? null,
    Address: data.address ?? null,
    City: data.city ?? null,
    Country: data.country ?? null,
    Capacity: data.capacity ?? 0,
    TimeZone: data.timeZone ?? "UTC",
    ImageUrl: data.imageUrl ?? null,
    SvgTemplate: data.svgTemplate ?? null,
    CreatedBy: data.createdBy ?? null,
    UpdatedBy: data.updatedBy ?? null,
  });

  const result = rows[0] as Record<string, unknown>;
  // Fetch full venue record for backward compat
  const venue = await getVenue(Number(result.VenueId));
  return { success: true, venue };
}

export async function deleteVenue(venueId: number) {
  await callSp("usp_tkt_venue_delete", { VenueId: venueId });
  return { success: true };
}

/* ── VENUE CONFIGURATIONS ── */

export async function listVenueConfigurations(venueId: number) {
  return callSp("usp_tkt_venue_config_list", { VenueId: venueId });
}

export async function upsertVenueConfiguration(data: Record<string, unknown>) {
  const rows = await callSp("usp_tkt_venue_config_upsert", {
    ConfigurationId: data.configurationId ?? null,
    VenueId: data.venueId ?? null,
    Name: data.name ?? null,
    Description: data.description ?? null,
    SvgOverlay: data.svgOverlay ?? null,
  });

  const result = rows[0] as Record<string, unknown>;
  return { success: true, configuration: result };
}

/* ── SECTIONS ── */

export async function listSections(configurationId: number) {
  return callSp("usp_tkt_section_list", { ConfigurationId: configurationId });
}

export async function upsertSection(data: Record<string, unknown>) {
  const rows = await callSp("usp_tkt_section_upsert", {
    SectionId: data.sectionId ?? null,
    ConfigurationId: data.configurationId ?? null,
    Name: data.name ?? null,
    Code: data.code ?? null,
    Category: data.category ?? "standard",
    Color: data.color ?? "#3B82F6",
    Polygon: data.polygon ? (typeof data.polygon === "string" ? data.polygon : JSON.stringify(data.polygon)) : null,
    SortOrder: data.sortOrder ?? 0,
    IsGeneralAdmission: data.isGeneralAdmission ?? false,
    GaCapacity: data.gaCapacity ?? 0,
  });

  const result = rows[0] as Record<string, unknown>;
  return { success: true, section: result };
}

/* ── SEAT GENERATION ── */

interface GenerateSeatsParams {
  sectionId: number;
  rows: number;
  seatsPerRow: number;
  startLabel?: string;
}

export async function generateSeats(params: GenerateSeatsParams) {
  const { sectionId, rows, seatsPerRow, startLabel = "A" } = params;

  const result = await callSp("usp_tkt_venue_generate_seats", {
    SectionId: sectionId,
    Rows: rows,
    SeatsPerRow: seatsPerRow,
    StartLabel: startLabel,
  });

  const row = result[0] as Record<string, unknown>;
  return { success: true, rows, seatsPerRow, totalSeats: Number(row?.TotalSeats ?? 0) };
}

/* ── FULL SEAT MAP ── */

export async function getFullSeatMap(configurationId: number) {
  const rows = await callSp("usp_tkt_venue_get_seatmap", {
    ConfigurationId: configurationId,
  });

  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return { configuration: null, sections: [] };

  return {
    configuration: {
      ConfigurationId: row.ConfigurationId,
      VenueId: row.VenueId,
      Name: row.ConfigName,
      Description: row.Description,
      SvgOverlay: row.SvgOverlay,
      VenueName: row.VenueName,
      SvgTemplate: row.SvgTemplate,
    },
    sections: row.Sections ?? [],
  };
}
