import { query } from "../../db/pool.js";

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
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT v.*, COUNT(*) OVER() AS "TotalCount"
     FROM tkt.venue v
     WHERE v."CompanyId" = $1
       AND ($2 = '' OR v."Name" ILIKE '%' || $2 || '%')
       AND ($3 = '' OR v."City" ILIKE '%' || $3 || '%')
       AND ($4 = '' OR v."Country" = $4)
       AND v."IsActive" = true
     ORDER BY v."Name"
     LIMIT $5 OFFSET $6`,
    [companyId, search ?? "", city ?? "", country ?? "", limit, offset]
  );

  const total = result.rows[0]?.TotalCount ?? 0;
  return { rows: result.rows, total: Number(total), page, limit };
}

export async function getVenue(venueId: number) {
  const result = await query(
    `SELECT * FROM tkt.venue WHERE "VenueId" = $1`,
    [venueId]
  );
  return result.rows[0] ?? null;
}

export async function upsertVenue(data: Record<string, unknown>) {
  const { venueId, companyId, createdBy, updatedBy, ...fields } = data;

  if (venueId) {
    const result = await query(
      `UPDATE tkt.venue SET
        "Name" = $1, "Address" = $2, "City" = $3, "Country" = $4,
        "Capacity" = $5, "TimeZone" = $6, "ImageUrl" = $7,
        "SvgTemplate" = $8, "UpdatedBy" = $9, "UpdatedAt" = NOW()
       WHERE "VenueId" = $10
       RETURNING *`,
      [
        fields.name, fields.address, fields.city, fields.country,
        fields.capacity, fields.timeZone, fields.imageUrl,
        fields.svgTemplate, updatedBy, venueId,
      ]
    );
    return { success: true, venue: result.rows[0] };
  }

  const result = await query(
    `INSERT INTO tkt.venue
      ("CompanyId", "Name", "Address", "City", "Country", "Capacity",
       "TimeZone", "ImageUrl", "SvgTemplate", "CreatedBy")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      companyId, fields.name, fields.address, fields.city, fields.country,
      fields.capacity, fields.timeZone, fields.imageUrl,
      fields.svgTemplate, createdBy,
    ]
  );
  return { success: true, venue: result.rows[0] };
}

export async function deleteVenue(venueId: number) {
  await query(
    `UPDATE tkt.venue SET "IsActive" = false WHERE "VenueId" = $1`,
    [venueId]
  );
  return { success: true };
}

/* ── VENUE CONFIGURATIONS ── */

export async function listVenueConfigurations(venueId: number) {
  const result = await query(
    `SELECT * FROM tkt.venue_configuration
     WHERE "VenueId" = $1 AND "IsActive" = true
     ORDER BY "Name"`,
    [venueId]
  );
  return result.rows;
}

export async function upsertVenueConfiguration(data: Record<string, unknown>) {
  const { configurationId, venueId, ...fields } = data;

  if (configurationId) {
    const result = await query(
      `UPDATE tkt.venue_configuration SET
        "Name" = $1, "Description" = $2, "SvgOverlay" = $3, "UpdatedAt" = NOW()
       WHERE "ConfigurationId" = $4
       RETURNING *`,
      [fields.name, fields.description, fields.svgOverlay, configurationId]
    );
    return { success: true, configuration: result.rows[0] };
  }

  const result = await query(
    `INSERT INTO tkt.venue_configuration ("VenueId", "Name", "Description", "SvgOverlay")
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [venueId, fields.name, fields.description, fields.svgOverlay]
  );
  return { success: true, configuration: result.rows[0] };
}

/* ── SECTIONS ── */

export async function listSections(configurationId: number) {
  const result = await query(
    `SELECT s.*, COUNT(st.*) AS "SeatCount"
     FROM tkt.section s
     LEFT JOIN tkt.row r ON r."SectionId" = s."SectionId"
     LEFT JOIN tkt.seat st ON st."RowId" = r."RowId"
     WHERE s."ConfigurationId" = $1
     GROUP BY s."SectionId"
     ORDER BY s."SortOrder", s."Name"`,
    [configurationId]
  );
  return result.rows;
}

export async function upsertSection(data: Record<string, unknown>) {
  const { sectionId, configurationId, ...fields } = data;

  if (sectionId) {
    const result = await query(
      `UPDATE tkt.section SET
        "Name" = $1, "Code" = $2, "Category" = $3, "Color" = $4,
        "Polygon" = $5, "SortOrder" = $6, "IsGeneralAdmission" = $7,
        "GaCapacity" = $8
       WHERE "SectionId" = $9
       RETURNING *`,
      [
        fields.name, fields.code, fields.category, fields.color,
        JSON.stringify(fields.polygon), fields.sortOrder,
        fields.isGeneralAdmission, fields.gaCapacity, sectionId,
      ]
    );
    return { success: true, section: result.rows[0] };
  }

  const result = await query(
    `INSERT INTO tkt.section
      ("ConfigurationId", "Name", "Code", "Category", "Color",
       "Polygon", "SortOrder", "IsGeneralAdmission", "GaCapacity")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      configurationId, fields.name, fields.code, fields.category,
      fields.color, JSON.stringify(fields.polygon), fields.sortOrder,
      fields.isGeneralAdmission, fields.gaCapacity,
    ]
  );
  return { success: true, section: result.rows[0] };
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

  // Limpiar asientos existentes
  await query(
    `DELETE FROM tkt.seat WHERE "RowId" IN
      (SELECT "RowId" FROM tkt.row WHERE "SectionId" = $1)`,
    [sectionId]
  );
  await query(`DELETE FROM tkt.row WHERE "SectionId" = $1`, [sectionId]);

  let totalSeats = 0;

  for (let r = 0; r < rows; r++) {
    const label = String.fromCharCode(startLabel.charCodeAt(0) + r);

    const rowResult = await query(
      `INSERT INTO tkt.row ("SectionId", "Label", "SeatCount", "SortOrder")
       VALUES ($1, $2, $3, $4) RETURNING "RowId"`,
      [sectionId, label, seatsPerRow, r + 1]
    );
    const rowId = rowResult.rows[0].RowId;

    // Generar asientos en batch
    const seatValues: unknown[] = [];
    const seatPlaceholders: string[] = [];
    for (let s = 0; s < seatsPerRow; s++) {
      const idx = seatValues.length;
      seatPlaceholders.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4})`);
      seatValues.push(rowId, s + 1, `seat`, false);
    }

    if (seatPlaceholders.length > 0) {
      await query(
        `INSERT INTO tkt.seat ("RowId", "Number", "SeatType", "IsAccessible")
         VALUES ${seatPlaceholders.join(", ")}`,
        seatValues
      );
    }

    totalSeats += seatsPerRow;
  }

  return { success: true, rows, seatsPerRow, totalSeats };
}

/* ── FULL SEAT MAP ── */

export async function getFullSeatMap(configurationId: number) {
  const config = await query(
    `SELECT vc.*, v."Name" AS "VenueName", v."SvgTemplate"
     FROM tkt.venue_configuration vc
     JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
     WHERE vc."ConfigurationId" = $1`,
    [configurationId]
  );

  const sections = await query(
    `SELECT s.*,
       json_agg(
         json_build_object(
           'RowId', r."RowId", 'Label', r."Label", 'SeatCount', r."SeatCount",
           'seats', (
             SELECT json_agg(
               json_build_object(
                 'SeatId', st."SeatId", 'Number', st."Number",
                 'SeatType', st."SeatType", 'IsAccessible', st."IsAccessible"
               ) ORDER BY st."Number"
             )
             FROM tkt.seat st WHERE st."RowId" = r."RowId"
           )
         ) ORDER BY r."SortOrder"
       ) FILTER (WHERE r."RowId" IS NOT NULL) AS "Rows"
     FROM tkt.section s
     LEFT JOIN tkt.row r ON r."SectionId" = s."SectionId"
     WHERE s."ConfigurationId" = $1
     GROUP BY s."SectionId"
     ORDER BY s."SortOrder"`,
    [configurationId]
  );

  return {
    configuration: config.rows[0],
    sections: sections.rows,
  };
}
