-- +goose Up
-- Zentto Tickets — Funciones PL/pgSQL para todos los módulos
-- Patrón: usp_tkt_[entity]_[action]
-- Lists: RETURNS TABLE con "TotalCount"
-- Writes: RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, ...)

-- ══════════════════════════════════════════════════════════════════════════════
-- VENUES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION usp_tkt_venue_list(
  p_company_id INT,
  p_search VARCHAR DEFAULT '',
  p_city VARCHAR DEFAULT '',
  p_country VARCHAR DEFAULT '',
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 50
) RETURNS TABLE(
  "VenueId" INT,
  "CompanyId" INT,
  "Name" VARCHAR,
  "Address" VARCHAR,
  "City" VARCHAR,
  "Country" VARCHAR,
  "Capacity" INT,
  "TimeZone" VARCHAR,
  "ImageUrl" VARCHAR,
  "SvgTemplate" TEXT,
  "IsActive" BOOLEAN,
  "CreatedBy" VARCHAR,
  "CreatedAt" TIMESTAMPTZ,
  "UpdatedBy" VARCHAR,
  "UpdatedAt" TIMESTAMPTZ,
  "TotalCount" BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT v."VenueId", v."CompanyId", v."Name"::VARCHAR, v."Address"::VARCHAR,
         v."City"::VARCHAR, v."Country"::VARCHAR, v."Capacity", v."TimeZone"::VARCHAR,
         v."ImageUrl"::VARCHAR, v."SvgTemplate", v."IsActive",
         v."CreatedBy"::VARCHAR, v."CreatedAt", v."UpdatedBy"::VARCHAR, v."UpdatedAt",
         COUNT(*) OVER()::BIGINT AS "TotalCount"
  FROM tkt.venue v
  WHERE v."CompanyId" = p_company_id
    AND (p_search = '' OR v."Name" ILIKE '%' || p_search || '%')
    AND (p_city = '' OR v."City" ILIKE '%' || p_city || '%')
    AND (p_country = '' OR v."Country" = p_country)
    AND v."IsActive" = true
  ORDER BY v."Name"
  LIMIT p_limit OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_venue_get(
  p_venue_id INT
) RETURNS TABLE(
  "VenueId" INT,
  "CompanyId" INT,
  "Name" VARCHAR,
  "Address" VARCHAR,
  "City" VARCHAR,
  "Country" VARCHAR,
  "Capacity" INT,
  "TimeZone" VARCHAR,
  "ImageUrl" VARCHAR,
  "SvgTemplate" TEXT,
  "IsActive" BOOLEAN,
  "CreatedBy" VARCHAR,
  "CreatedAt" TIMESTAMPTZ,
  "UpdatedBy" VARCHAR,
  "UpdatedAt" TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT v."VenueId", v."CompanyId", v."Name"::VARCHAR, v."Address"::VARCHAR,
         v."City"::VARCHAR, v."Country"::VARCHAR, v."Capacity", v."TimeZone"::VARCHAR,
         v."ImageUrl"::VARCHAR, v."SvgTemplate", v."IsActive",
         v."CreatedBy"::VARCHAR, v."CreatedAt", v."UpdatedBy"::VARCHAR, v."UpdatedAt"
  FROM tkt.venue v
  WHERE v."VenueId" = p_venue_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_venue_upsert(
  p_venue_id INT DEFAULT NULL,
  p_company_id INT DEFAULT NULL,
  p_name VARCHAR DEFAULT NULL,
  p_address VARCHAR DEFAULT NULL,
  p_city VARCHAR DEFAULT NULL,
  p_country VARCHAR DEFAULT NULL,
  p_capacity INT DEFAULT 0,
  p_time_zone VARCHAR DEFAULT 'UTC',
  p_image_url VARCHAR DEFAULT NULL,
  p_svg_template TEXT DEFAULT NULL,
  p_created_by VARCHAR DEFAULT NULL,
  p_updated_by VARCHAR DEFAULT NULL
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "VenueId" INT) AS $$
DECLARE v_id INT;
BEGIN
  IF p_venue_id IS NULL THEN
    INSERT INTO tkt.venue ("CompanyId","Name","Address","City","Country","Capacity",
      "TimeZone","ImageUrl","SvgTemplate","CreatedBy")
    VALUES (p_company_id, p_name, p_address, p_city, p_country, p_capacity,
      p_time_zone, p_image_url, p_svg_template, p_created_by)
    RETURNING tkt.venue."VenueId" INTO v_id;
  ELSE
    UPDATE tkt.venue SET
      "Name" = COALESCE(p_name, "Name"),
      "Address" = COALESCE(p_address, "Address"),
      "City" = COALESCE(p_city, "City"),
      "Country" = COALESCE(p_country, "Country"),
      "Capacity" = COALESCE(p_capacity, "Capacity"),
      "TimeZone" = COALESCE(p_time_zone, "TimeZone"),
      "ImageUrl" = COALESCE(p_image_url, "ImageUrl"),
      "SvgTemplate" = COALESCE(p_svg_template, "SvgTemplate"),
      "UpdatedBy" = p_updated_by,
      "UpdatedAt" = NOW()
    WHERE "VenueId" = p_venue_id;
    v_id := p_venue_id;
  END IF;
  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_venue_delete(
  p_venue_id INT
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR) AS $$
BEGIN
  UPDATE tkt.venue SET "IsActive" = false WHERE "VenueId" = p_venue_id;
  RETURN QUERY SELECT true, 'OK'::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_venue_config_list(
  p_venue_id INT
) RETURNS TABLE(
  "ConfigurationId" INT,
  "VenueId" INT,
  "Name" VARCHAR,
  "Description" TEXT,
  "SvgOverlay" TEXT,
  "IsActive" BOOLEAN,
  "CreatedAt" TIMESTAMPTZ,
  "UpdatedAt" TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT vc."ConfigurationId", vc."VenueId", vc."Name"::VARCHAR, vc."Description",
         vc."SvgOverlay", vc."IsActive", vc."CreatedAt", vc."UpdatedAt"
  FROM tkt.venue_configuration vc
  WHERE vc."VenueId" = p_venue_id AND vc."IsActive" = true
  ORDER BY vc."Name";
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_venue_config_upsert(
  p_configuration_id INT DEFAULT NULL,
  p_venue_id INT DEFAULT NULL,
  p_name VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_svg_overlay TEXT DEFAULT NULL
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "ConfigurationId" INT) AS $$
DECLARE v_id INT;
BEGIN
  IF p_configuration_id IS NULL THEN
    INSERT INTO tkt.venue_configuration ("VenueId","Name","Description","SvgOverlay")
    VALUES (p_venue_id, p_name, p_description, p_svg_overlay)
    RETURNING tkt.venue_configuration."ConfigurationId" INTO v_id;
  ELSE
    UPDATE tkt.venue_configuration SET
      "Name" = COALESCE(p_name, "Name"),
      "Description" = COALESCE(p_description, "Description"),
      "SvgOverlay" = COALESCE(p_svg_overlay, "SvgOverlay"),
      "UpdatedAt" = NOW()
    WHERE "ConfigurationId" = p_configuration_id;
    v_id := p_configuration_id;
  END IF;
  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_section_list(
  p_configuration_id INT
) RETURNS TABLE(
  "SectionId" INT,
  "ConfigurationId" INT,
  "Name" VARCHAR,
  "Code" VARCHAR,
  "Category" VARCHAR,
  "Color" VARCHAR,
  "Polygon" JSONB,
  "SortOrder" INT,
  "IsGeneralAdmission" BOOLEAN,
  "GaCapacity" INT,
  "CreatedAt" TIMESTAMPTZ,
  "SeatCount" BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT s."SectionId", s."ConfigurationId", s."Name"::VARCHAR, s."Code"::VARCHAR,
         s."Category"::VARCHAR, s."Color"::VARCHAR, s."Polygon", s."SortOrder",
         s."IsGeneralAdmission", s."GaCapacity", s."CreatedAt",
         COUNT(st.*)::BIGINT AS "SeatCount"
  FROM tkt.section s
  LEFT JOIN tkt.row r ON r."SectionId" = s."SectionId"
  LEFT JOIN tkt.seat st ON st."RowId" = r."RowId"
  WHERE s."ConfigurationId" = p_configuration_id
  GROUP BY s."SectionId"
  ORDER BY s."SortOrder", s."Name";
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_section_upsert(
  p_section_id INT DEFAULT NULL,
  p_configuration_id INT DEFAULT NULL,
  p_name VARCHAR DEFAULT NULL,
  p_code VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT 'standard',
  p_color VARCHAR DEFAULT '#3B82F6',
  p_polygon JSONB DEFAULT NULL,
  p_sort_order INT DEFAULT 0,
  p_is_general_admission BOOLEAN DEFAULT FALSE,
  p_ga_capacity INT DEFAULT 0
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "SectionId" INT) AS $$
DECLARE v_id INT;
BEGIN
  IF p_section_id IS NULL THEN
    INSERT INTO tkt.section ("ConfigurationId","Name","Code","Category","Color",
      "Polygon","SortOrder","IsGeneralAdmission","GaCapacity")
    VALUES (p_configuration_id, p_name, p_code, p_category, p_color,
      p_polygon, p_sort_order, p_is_general_admission, p_ga_capacity)
    RETURNING tkt.section."SectionId" INTO v_id;
  ELSE
    UPDATE tkt.section SET
      "Name" = COALESCE(p_name, "Name"),
      "Code" = COALESCE(p_code, "Code"),
      "Category" = COALESCE(p_category, "Category"),
      "Color" = COALESCE(p_color, "Color"),
      "Polygon" = COALESCE(p_polygon, "Polygon"),
      "SortOrder" = COALESCE(p_sort_order, "SortOrder"),
      "IsGeneralAdmission" = COALESCE(p_is_general_admission, "IsGeneralAdmission"),
      "GaCapacity" = COALESCE(p_ga_capacity, "GaCapacity")
    WHERE "SectionId" = p_section_id;
    v_id := p_section_id;
  END IF;
  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_venue_generate_seats(
  p_section_id INT,
  p_rows INT,
  p_seats_per_row INT,
  p_start_label VARCHAR DEFAULT 'A'
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "TotalSeats" INT) AS $$
DECLARE
  v_row_id INT;
  v_label VARCHAR;
  v_total INT := 0;
  r INT;
  s INT;
BEGIN
  -- Limpiar asientos existentes
  DELETE FROM tkt.seat WHERE "RowId" IN
    (SELECT "RowId" FROM tkt.row WHERE "SectionId" = p_section_id);
  DELETE FROM tkt.row WHERE "SectionId" = p_section_id;

  FOR r IN 0..(p_rows - 1) LOOP
    v_label := chr(ascii(p_start_label) + r);

    INSERT INTO tkt.row ("SectionId","Label","SeatCount","SortOrder")
    VALUES (p_section_id, v_label, p_seats_per_row, r + 1)
    RETURNING "RowId" INTO v_row_id;

    FOR s IN 1..p_seats_per_row LOOP
      INSERT INTO tkt.seat ("RowId","Number","SeatType","IsAccessible")
      VALUES (v_row_id, s, 'seat', false);
    END LOOP;

    v_total := v_total + p_seats_per_row;
  END LOOP;

  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_total;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_venue_get_seatmap(
  p_configuration_id INT
) RETURNS TABLE(
  "ConfigurationId" INT,
  "VenueId" INT,
  "ConfigName" VARCHAR,
  "Description" TEXT,
  "SvgOverlay" TEXT,
  "VenueName" VARCHAR,
  "SvgTemplate" TEXT,
  "Sections" JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT vc."ConfigurationId", vc."VenueId", vc."Name"::VARCHAR,
         vc."Description", vc."SvgOverlay",
         v."Name"::VARCHAR AS "VenueName", v."SvgTemplate",
         (
           SELECT json_agg(sec_row ORDER BY sec_row."SortOrder")
           FROM (
             SELECT s."SectionId", s."Name", s."Code", s."Category", s."Color",
                    s."Polygon", s."SortOrder", s."IsGeneralAdmission", s."GaCapacity",
                    (
                      SELECT json_agg(
                        json_build_object(
                          'RowId', r."RowId", 'Label', r."Label",
                          'SeatCount', r."SeatCount",
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
                      )
                      FROM tkt.row r WHERE r."SectionId" = s."SectionId"
                    ) AS "Rows"
             FROM tkt.section s
             WHERE s."ConfigurationId" = vc."ConfigurationId"
           ) sec_row
         ) AS "Sections"
  FROM tkt.venue_configuration vc
  JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
  WHERE vc."ConfigurationId" = p_configuration_id;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- EVENTS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION usp_tkt_event_list(
  p_company_id INT,
  p_search VARCHAR DEFAULT '',
  p_status VARCHAR DEFAULT '',
  p_venue_id INT DEFAULT NULL,
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to TIMESTAMPTZ DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 50
) RETURNS TABLE(
  "EventId" INT,
  "CompanyId" INT,
  "Name" VARCHAR,
  "Description" TEXT,
  "ConfigurationId" INT,
  "EventDate" TIMESTAMPTZ,
  "DoorsOpen" TIMESTAMPTZ,
  "Status" VARCHAR,
  "EventType" VARCHAR,
  "ImageUrl" VARCHAR,
  "MaxTicketsPerOrder" INT,
  "IsPublished" BOOLEAN,
  "CreatedBy" VARCHAR,
  "CreatedAt" TIMESTAMPTZ,
  "UpdatedBy" VARCHAR,
  "UpdatedAt" TIMESTAMPTZ,
  "VenueName" VARCHAR,
  "City" VARCHAR,
  "Country" VARCHAR,
  "ConfigurationName" VARCHAR,
  "TotalCount" BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT e."EventId", e."CompanyId", e."Name"::VARCHAR, e."Description",
         e."ConfigurationId", e."EventDate", e."DoorsOpen",
         e."Status"::VARCHAR, e."EventType"::VARCHAR, e."ImageUrl"::VARCHAR,
         e."MaxTicketsPerOrder", e."IsPublished",
         e."CreatedBy"::VARCHAR, e."CreatedAt", e."UpdatedBy"::VARCHAR, e."UpdatedAt",
         v."Name"::VARCHAR AS "VenueName", v."City"::VARCHAR, v."Country"::VARCHAR,
         vc."Name"::VARCHAR AS "ConfigurationName",
         COUNT(*) OVER()::BIGINT AS "TotalCount"
  FROM tkt.event e
  JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
  JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
  WHERE e."CompanyId" = p_company_id
    AND (p_search = '' OR e."Name" ILIKE '%' || p_search || '%')
    AND (p_status = '' OR e."Status" = p_status)
    AND (p_venue_id IS NULL OR vc."VenueId" = p_venue_id)
    AND (p_from IS NULL OR e."EventDate" >= p_from)
    AND (p_to IS NULL OR e."EventDate" <= p_to)
  ORDER BY e."EventDate" DESC
  LIMIT p_limit OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_event_get(
  p_event_id INT
) RETURNS TABLE(
  "EventId" INT,
  "CompanyId" INT,
  "Name" VARCHAR,
  "Description" TEXT,
  "ConfigurationId" INT,
  "EventDate" TIMESTAMPTZ,
  "DoorsOpen" TIMESTAMPTZ,
  "Status" VARCHAR,
  "EventType" VARCHAR,
  "ImageUrl" VARCHAR,
  "MaxTicketsPerOrder" INT,
  "IsPublished" BOOLEAN,
  "CreatedBy" VARCHAR,
  "CreatedAt" TIMESTAMPTZ,
  "UpdatedBy" VARCHAR,
  "UpdatedAt" TIMESTAMPTZ,
  "VenueName" VARCHAR,
  "City" VARCHAR,
  "Country" VARCHAR,
  "ConfigurationName" VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT e."EventId", e."CompanyId", e."Name"::VARCHAR, e."Description",
         e."ConfigurationId", e."EventDate", e."DoorsOpen",
         e."Status"::VARCHAR, e."EventType"::VARCHAR, e."ImageUrl"::VARCHAR,
         e."MaxTicketsPerOrder", e."IsPublished",
         e."CreatedBy"::VARCHAR, e."CreatedAt", e."UpdatedBy"::VARCHAR, e."UpdatedAt",
         v."Name"::VARCHAR AS "VenueName", v."City"::VARCHAR, v."Country"::VARCHAR,
         vc."Name"::VARCHAR AS "ConfigurationName"
  FROM tkt.event e
  JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
  JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
  WHERE e."EventId" = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_event_upsert(
  p_event_id INT DEFAULT NULL,
  p_company_id INT DEFAULT NULL,
  p_name VARCHAR DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_configuration_id INT DEFAULT NULL,
  p_event_date TIMESTAMPTZ DEFAULT NULL,
  p_doors_open TIMESTAMPTZ DEFAULT NULL,
  p_status VARCHAR DEFAULT 'draft',
  p_event_type VARCHAR DEFAULT 'general',
  p_image_url VARCHAR DEFAULT NULL,
  p_max_tickets_per_order INT DEFAULT 6,
  p_is_published BOOLEAN DEFAULT FALSE,
  p_created_by VARCHAR DEFAULT NULL,
  p_updated_by VARCHAR DEFAULT NULL
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "EventId" INT) AS $$
DECLARE v_id INT;
BEGIN
  IF p_event_id IS NULL THEN
    INSERT INTO tkt.event ("CompanyId","Name","Description","ConfigurationId",
      "EventDate","DoorsOpen","Status","EventType","ImageUrl",
      "MaxTicketsPerOrder","IsPublished","CreatedBy")
    VALUES (p_company_id, p_name, p_description, p_configuration_id,
      p_event_date, p_doors_open, p_status, p_event_type, p_image_url,
      p_max_tickets_per_order, p_is_published, p_created_by)
    RETURNING tkt.event."EventId" INTO v_id;
  ELSE
    UPDATE tkt.event SET
      "Name" = COALESCE(p_name, "Name"),
      "Description" = COALESCE(p_description, "Description"),
      "ConfigurationId" = COALESCE(p_configuration_id, "ConfigurationId"),
      "EventDate" = COALESCE(p_event_date, "EventDate"),
      "DoorsOpen" = COALESCE(p_doors_open, "DoorsOpen"),
      "Status" = COALESCE(p_status, "Status"),
      "EventType" = COALESCE(p_event_type, "EventType"),
      "ImageUrl" = COALESCE(p_image_url, "ImageUrl"),
      "MaxTicketsPerOrder" = COALESCE(p_max_tickets_per_order, "MaxTicketsPerOrder"),
      "IsPublished" = COALESCE(p_is_published, "IsPublished"),
      "UpdatedBy" = p_updated_by,
      "UpdatedAt" = NOW()
    WHERE "EventId" = p_event_id;
    v_id := p_event_id;
  END IF;
  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_event_pricingzone_list(
  p_event_id INT
) RETURNS TABLE(
  "ZoneId" INT,
  "EventId" INT,
  "Name" VARCHAR,
  "Color" VARCHAR,
  "Price" DECIMAL,
  "Currency" VARCHAR,
  "SectionIds" INT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT pz."ZoneId", pz."EventId", pz."Name"::VARCHAR, pz."Color"::VARCHAR,
         pz."Price", pz."Currency"::VARCHAR,
         array_agg(pzs."SectionId") FILTER (WHERE pzs."SectionId" IS NOT NULL) AS "SectionIds"
  FROM tkt.pricing_zone pz
  LEFT JOIN tkt.pricing_zone_section pzs ON pzs."ZoneId" = pz."ZoneId"
  WHERE pz."EventId" = p_event_id
  GROUP BY pz."ZoneId"
  ORDER BY pz."Price" DESC;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_event_pricingzone_upsert(
  p_zone_id INT DEFAULT NULL,
  p_event_id INT DEFAULT NULL,
  p_name VARCHAR DEFAULT NULL,
  p_color VARCHAR DEFAULT '#10B981',
  p_price DECIMAL DEFAULT 0,
  p_currency VARCHAR DEFAULT 'USD',
  p_section_ids INT[] DEFAULT NULL
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "ZoneId" INT) AS $$
DECLARE v_id INT; v_sec_id INT;
BEGIN
  IF p_zone_id IS NULL THEN
    INSERT INTO tkt.pricing_zone ("EventId","Name","Color","Price","Currency")
    VALUES (p_event_id, p_name, p_color, p_price, p_currency)
    RETURNING tkt.pricing_zone."ZoneId" INTO v_id;
  ELSE
    UPDATE tkt.pricing_zone SET
      "Name" = COALESCE(p_name, "Name"),
      "Color" = COALESCE(p_color, "Color"),
      "Price" = COALESCE(p_price, "Price"),
      "Currency" = COALESCE(p_currency, "Currency")
    WHERE "ZoneId" = p_zone_id;
    v_id := p_zone_id;
  END IF;

  -- Sync section associations
  IF p_section_ids IS NOT NULL THEN
    DELETE FROM tkt.pricing_zone_section WHERE "ZoneId" = v_id;
    FOREACH v_sec_id IN ARRAY p_section_ids LOOP
      INSERT INTO tkt.pricing_zone_section ("ZoneId","SectionId") VALUES (v_id, v_sec_id);
    END LOOP;
  END IF;

  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_event_initialize_inventory(
  p_event_id INT
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "SeatsCreated" INT) AS $$
DECLARE v_config_id INT; v_count INT;
BEGIN
  SELECT "ConfigurationId" INTO v_config_id
  FROM tkt.event WHERE "EventId" = p_event_id;

  IF v_config_id IS NULL THEN
    RETURN QUERY SELECT false, 'event_not_found'::VARCHAR, 0;
    RETURN;
  END IF;

  -- Seated inventory
  INSERT INTO tkt.event_inventory ("EventId","SeatId","SectionId","Status")
  SELECT p_event_id, st."SeatId", s."SectionId", 'available'
  FROM tkt.section s
  JOIN tkt.row r ON r."SectionId" = s."SectionId"
  JOIN tkt.seat st ON st."RowId" = r."RowId"
  WHERE s."ConfigurationId" = v_config_id
    AND NOT s."IsGeneralAdmission"
  ON CONFLICT ("EventId","SeatId") DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- GA inventory
  INSERT INTO tkt.event_ga_inventory ("EventId","SectionId","TotalCapacity","SoldCount")
  SELECT p_event_id, s."SectionId", s."GaCapacity", 0
  FROM tkt.section s
  WHERE s."ConfigurationId" = v_config_id
    AND s."IsGeneralAdmission" = true
  ON CONFLICT ("EventId","SectionId") DO NOTHING;

  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_count;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_event_get_availability(
  p_event_id INT,
  p_section_id INT DEFAULT NULL
) RETURNS TABLE(
  "SectionId" INT,
  "Name" VARCHAR,
  "Code" VARCHAR,
  "Category" VARCHAR,
  "Color" VARCHAR,
  "Polygon" JSONB,
  "IsGeneralAdmission" BOOLEAN,
  "Available" BIGINT,
  "Held" BIGINT,
  "Sold" BIGINT,
  "Total" BIGINT,
  "MinPrice" DECIMAL,
  -- seat-level fields (only when p_section_id specified)
  "SeatId" INT,
  "Status" VARCHAR,
  "HeldUntil" TIMESTAMPTZ,
  "RowLabel" VARCHAR,
  "SeatNumber" INT,
  "SeatType" VARCHAR,
  "IsAccessible" BOOLEAN,
  "Price" DECIMAL,
  "Currency" VARCHAR,
  -- GA fields
  "TotalCapacity" INT,
  "SoldCount" INT,
  "GaAvailable" INT
) AS $$
BEGIN
  IF p_section_id IS NOT NULL THEN
    -- Seat-level detail for a specific section
    RETURN QUERY
    SELECT ei."SectionId",
           NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR,
           NULL::JSONB, NULL::BOOLEAN,
           NULL::BIGINT, NULL::BIGINT, NULL::BIGINT, NULL::BIGINT, NULL::DECIMAL,
           ei."SeatId", ei."Status"::VARCHAR, ei."HeldUntil",
           r."Label"::VARCHAR AS "RowLabel", st."Number" AS "SeatNumber",
           st."SeatType"::VARCHAR, st."IsAccessible",
           COALESCE(pz."Price", 0::DECIMAL) AS "Price",
           COALESCE(pz."Currency", 'USD')::VARCHAR AS "Currency",
           NULL::INT, NULL::INT, NULL::INT
    FROM tkt.event_inventory ei
    JOIN tkt.seat st ON st."SeatId" = ei."SeatId"
    JOIN tkt.row r ON r."RowId" = st."RowId"
    LEFT JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = ei."SectionId"
    LEFT JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = ei."EventId"
    WHERE ei."EventId" = p_event_id AND ei."SectionId" = p_section_id
    ORDER BY r."SortOrder", st."Number";
  ELSE
    -- Section-level summary
    RETURN QUERY
    SELECT s."SectionId", s."Name"::VARCHAR, s."Code"::VARCHAR,
           s."Category"::VARCHAR, s."Color"::VARCHAR,
           s."Polygon", s."IsGeneralAdmission",
           COUNT(ei.*) FILTER (WHERE ei."Status" = 'available')::BIGINT AS "Available",
           COUNT(ei.*) FILTER (WHERE ei."Status" = 'held')::BIGINT AS "Held",
           COUNT(ei.*) FILTER (WHERE ei."Status" = 'sold')::BIGINT AS "Sold",
           COUNT(ei.*)::BIGINT AS "Total",
           COALESCE(MIN(pz."Price"), 0::DECIMAL) AS "MinPrice",
           NULL::INT, NULL::VARCHAR, NULL::TIMESTAMPTZ,
           NULL::VARCHAR, NULL::INT, NULL::VARCHAR, NULL::BOOLEAN,
           NULL::DECIMAL, NULL::VARCHAR,
           egi."TotalCapacity",
           egi."SoldCount",
           (COALESCE(egi."TotalCapacity", 0) - COALESCE(egi."SoldCount", 0))::INT AS "GaAvailable"
    FROM tkt.section s
    LEFT JOIN tkt.event_inventory ei ON ei."SectionId" = s."SectionId" AND ei."EventId" = p_event_id
    LEFT JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = s."SectionId"
    LEFT JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = p_event_id
    LEFT JOIN tkt.event_ga_inventory egi ON egi."SectionId" = s."SectionId" AND egi."EventId" = p_event_id
    WHERE s."ConfigurationId" = (SELECT "ConfigurationId" FROM tkt.event WHERE "EventId" = p_event_id)
    GROUP BY s."SectionId", egi."TotalCapacity", egi."SoldCount"
    ORDER BY s."SortOrder";
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_event_hold_seats(
  p_event_id INT,
  p_seat_ids INT[],
  p_user_id VARCHAR,
  p_ttl_minutes INT DEFAULT 10
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "HeldCount" INT, "ExpiresInMinutes" INT) AS $$
DECLARE v_count INT;
BEGIN
  UPDATE tkt.event_inventory SET
    "Status" = 'held',
    "HeldBy" = p_user_id,
    "HeldUntil" = NOW() + (p_ttl_minutes || ' minutes')::INTERVAL
  WHERE "EventId" = p_event_id
    AND "SeatId" = ANY(p_seat_ids)
    AND "Status" = 'available';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_count, p_ttl_minutes;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_event_release_seats(
  p_event_id INT,
  p_seat_ids INT[],
  p_user_id VARCHAR
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "ReleasedCount" INT) AS $$
DECLARE v_count INT;
BEGIN
  UPDATE tkt.event_inventory SET
    "Status" = 'available', "HeldBy" = NULL, "HeldUntil" = NULL
  WHERE "EventId" = p_event_id
    AND "SeatId" = ANY(p_seat_ids)
    AND "HeldBy" = p_user_id
    AND "Status" = 'held';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_count;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_event_release_expired() RETURNS TABLE(
  "EventId" INT,
  "SeatId" INT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE tkt.event_inventory SET
    "Status" = 'available', "HeldBy" = NULL, "HeldUntil" = NULL
  WHERE "Status" = 'held' AND "HeldUntil" < NOW()
  RETURNING tkt.event_inventory."EventId", tkt.event_inventory."SeatId";
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_event_get_seatmap(
  p_event_id INT
) RETURNS TABLE(
  "EventId" INT,
  "EventName" VARCHAR,
  "EventDate" TIMESTAMPTZ,
  "Status" VARCHAR,
  "ConfigurationId" INT,
  "VenueName" VARCHAR,
  "Sections" JSON
) AS $$
DECLARE v_config_id INT;
BEGIN
  SELECT e."ConfigurationId" INTO v_config_id
  FROM tkt.event e WHERE e."EventId" = p_event_id;

  IF v_config_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT e."EventId", e."Name"::VARCHAR AS "EventName", e."EventDate",
         e."Status"::VARCHAR, e."ConfigurationId",
         v."Name"::VARCHAR AS "VenueName",
         (
           SELECT json_agg(sec_row ORDER BY sec_row."SortOrder")
           FROM (
             SELECT s."SectionId", s."Name", s."Code", s."Category", s."Color",
                    s."Polygon", s."SortOrder", s."IsGeneralAdmission",
                    COALESCE(MIN(pz."Price"), 0) AS "Price",
                    COALESCE(MIN(pz."Currency"), 'USD') AS "Currency",
                    (
                      SELECT json_agg(
                        json_build_object(
                          'RowId', r."RowId", 'Label', r."Label",
                          'SeatCount', r."SeatCount",
                          'seats', (
                            SELECT json_agg(
                              json_build_object(
                                'SeatId', st."SeatId", 'Number', st."Number",
                                'SeatType', st."SeatType", 'IsAccessible', st."IsAccessible",
                                'Status', COALESCE(ei."Status", 'available')
                              ) ORDER BY st."Number"
                            )
                            FROM tkt.seat st
                            LEFT JOIN tkt.event_inventory ei ON ei."SeatId" = st."SeatId" AND ei."EventId" = p_event_id
                            WHERE st."RowId" = r."RowId"
                          )
                        ) ORDER BY r."SortOrder"
                      )
                      FROM tkt.row r WHERE r."SectionId" = s."SectionId"
                    ) AS "Rows"
             FROM tkt.section s
             LEFT JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = s."SectionId"
             LEFT JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = p_event_id
             WHERE s."ConfigurationId" = v_config_id
             GROUP BY s."SectionId"
           ) sec_row
         ) AS "Sections"
  FROM tkt.event e
  JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
  JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
  WHERE e."EventId" = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- ORDERS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION usp_tkt_order_list(
  p_user_id VARCHAR,
  p_company_id INT,
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 20
) RETURNS TABLE(
  "OrderId" INT,
  "CompanyId" INT,
  "EventId" INT,
  "UserId" VARCHAR,
  "BuyerName" VARCHAR,
  "BuyerEmail" VARCHAR,
  "BuyerPhone" VARCHAR,
  "Total" DECIMAL,
  "Currency" VARCHAR,
  "Status" VARCHAR,
  "PaymentRef" VARCHAR,
  "PaymentMethod" VARCHAR,
  "PaidAt" TIMESTAMPTZ,
  "CreatedAt" TIMESTAMPTZ,
  "EventName" VARCHAR,
  "EventDate" TIMESTAMPTZ,
  "VenueName" VARCHAR,
  "TicketCount" BIGINT,
  "TotalCount" BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT o."OrderId", o."CompanyId", o."EventId", o."UserId"::VARCHAR,
         o."BuyerName"::VARCHAR, o."BuyerEmail"::VARCHAR, o."BuyerPhone"::VARCHAR,
         o."Total", o."Currency"::VARCHAR, o."Status"::VARCHAR,
         o."PaymentRef"::VARCHAR, o."PaymentMethod"::VARCHAR,
         o."PaidAt", o."CreatedAt",
         e."Name"::VARCHAR AS "EventName", e."EventDate",
         v."Name"::VARCHAR AS "VenueName",
         (SELECT COUNT(*) FROM tkt.ticket t WHERE t."OrderId" = o."OrderId")::BIGINT AS "TicketCount",
         COUNT(*) OVER()::BIGINT AS "TotalCount"
  FROM tkt."order" o
  JOIN tkt.event e ON e."EventId" = o."EventId"
  JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
  JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
  WHERE o."UserId" = p_user_id AND o."CompanyId" = p_company_id
  ORDER BY o."CreatedAt" DESC
  LIMIT p_limit OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_order_get(
  p_order_id INT,
  p_user_id VARCHAR
) RETURNS TABLE(
  "OrderId" INT,
  "CompanyId" INT,
  "EventId" INT,
  "UserId" VARCHAR,
  "BuyerName" VARCHAR,
  "BuyerEmail" VARCHAR,
  "BuyerPhone" VARCHAR,
  "Total" DECIMAL,
  "Currency" VARCHAR,
  "Status" VARCHAR,
  "PaymentRef" VARCHAR,
  "PaymentMethod" VARCHAR,
  "PaidAt" TIMESTAMPTZ,
  "CreatedAt" TIMESTAMPTZ,
  "EventName" VARCHAR,
  "EventDate" TIMESTAMPTZ,
  "VenueName" VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT o."OrderId", o."CompanyId", o."EventId", o."UserId"::VARCHAR,
         o."BuyerName"::VARCHAR, o."BuyerEmail"::VARCHAR, o."BuyerPhone"::VARCHAR,
         o."Total", o."Currency"::VARCHAR, o."Status"::VARCHAR,
         o."PaymentRef"::VARCHAR, o."PaymentMethod"::VARCHAR,
         o."PaidAt", o."CreatedAt",
         e."Name"::VARCHAR AS "EventName", e."EventDate",
         v."Name"::VARCHAR AS "VenueName"
  FROM tkt."order" o
  JOIN tkt.event e ON e."EventId" = o."EventId"
  JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
  JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
  WHERE o."OrderId" = p_order_id AND o."UserId" = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_order_checkout(
  p_event_id INT,
  p_seat_ids INT[],
  p_user_id VARCHAR,
  p_company_id INT,
  p_buyer_name VARCHAR,
  p_buyer_email VARCHAR,
  p_buyer_phone VARCHAR DEFAULT NULL,
  p_jwt_secret VARCHAR DEFAULT ''
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "OrderId" INT, "Total" DECIMAL, "Currency" VARCHAR, "TicketCount" INT) AS $$
DECLARE
  v_order_id INT;
  v_total DECIMAL := 0;
  v_currency VARCHAR := 'USD';
  v_count INT := 0;
  v_seat RECORD;
  v_barcode VARCHAR;
  v_ts BIGINT;
BEGIN
  -- Validate held seats
  IF NOT EXISTS (
    SELECT 1 FROM tkt.event_inventory ei
    WHERE ei."EventId" = p_event_id
      AND ei."SeatId" = ANY(p_seat_ids)
      AND ei."HeldBy" = p_user_id
      AND ei."Status" = 'held'
    HAVING COUNT(*) = array_length(p_seat_ids, 1)
  ) THEN
    RETURN QUERY SELECT false, 'some_seats_not_held'::VARCHAR, NULL::INT, NULL::DECIMAL, NULL::VARCHAR, NULL::INT;
    RETURN;
  END IF;

  -- Calculate total
  SELECT COALESCE(SUM(pz."Price"), 0), COALESCE(MIN(pz."Currency"), 'USD')
  INTO v_total, v_currency
  FROM tkt.event_inventory ei
  JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = ei."SectionId"
  JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = ei."EventId"
  WHERE ei."EventId" = p_event_id AND ei."SeatId" = ANY(p_seat_ids);

  -- Create order
  INSERT INTO tkt."order" ("CompanyId","EventId","UserId","BuyerName","BuyerEmail","BuyerPhone","Total","Currency","Status")
  VALUES (p_company_id, p_event_id, p_user_id, p_buyer_name, p_buyer_email, p_buyer_phone, v_total, v_currency, 'pending_payment')
  RETURNING tkt."order"."OrderId" INTO v_order_id;

  -- Create tickets
  v_ts := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  FOR v_seat IN
    SELECT ei."SeatId", pz."Price", pz."Currency"
    FROM tkt.event_inventory ei
    JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = ei."SectionId"
    JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = ei."EventId"
    WHERE ei."EventId" = p_event_id AND ei."SeatId" = ANY(p_seat_ids)
  LOOP
    v_barcode := 'ZT-' || v_order_id || '|' || p_event_id || '|' || v_seat."SeatId" || '|' || v_ts || '|'
      || substr(encode(hmac(v_order_id || '|' || p_event_id || '|' || v_seat."SeatId" || '|' || v_ts, p_jwt_secret, 'sha256'), 'hex'), 1, 16);

    INSERT INTO tkt.ticket ("OrderId","EventId","SeatId","Barcode","Price","Currency","Status")
    VALUES (v_order_id, p_event_id, v_seat."SeatId", v_barcode, v_seat."Price", v_seat."Currency", 'active');
    v_count := v_count + 1;
  END LOOP;

  -- Mark seats as sold
  UPDATE tkt.event_inventory SET
    "Status" = 'sold', "OrderId" = v_order_id, "HeldBy" = NULL, "HeldUntil" = NULL
  WHERE "EventId" = p_event_id AND "SeatId" = ANY(p_seat_ids);

  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_order_id, v_total, v_currency, v_count;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_order_confirm_payment(
  p_order_id INT,
  p_payment_ref VARCHAR,
  p_payment_method VARCHAR
) RETURNS TABLE(
  "ok" BOOLEAN,
  "mensaje" VARCHAR,
  "OrderId" INT,
  "EventId" INT,
  "BuyerName" VARCHAR,
  "BuyerEmail" VARCHAR,
  "Total" DECIMAL,
  "Currency" VARCHAR
) AS $$
DECLARE v_row RECORD;
BEGIN
  UPDATE tkt."order" SET
    "Status" = 'paid', "PaymentRef" = p_payment_ref,
    "PaymentMethod" = p_payment_method, "PaidAt" = NOW()
  WHERE "OrderId" = p_order_id AND "Status" = 'pending_payment'
  RETURNING * INTO v_row;

  IF v_row IS NULL THEN
    RETURN QUERY SELECT false, 'order_not_found_or_already_paid'::VARCHAR,
      NULL::INT, NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::DECIMAL, NULL::VARCHAR;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'OK'::VARCHAR,
    v_row."OrderId", v_row."EventId",
    v_row."BuyerName"::VARCHAR, v_row."BuyerEmail"::VARCHAR,
    v_row."Total", v_row."Currency"::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_order_cancel(
  p_order_id INT,
  p_user_id VARCHAR
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "EventId" INT, "BuyerName" VARCHAR, "BuyerEmail" VARCHAR, "Total" DECIMAL, "Currency" VARCHAR) AS $$
DECLARE v_row RECORD;
BEGIN
  SELECT * INTO v_row FROM tkt."order" WHERE "OrderId" = p_order_id AND "UserId" = p_user_id;
  IF v_row IS NULL THEN
    RETURN QUERY SELECT false, 'order_not_found'::VARCHAR, NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::DECIMAL, NULL::VARCHAR;
    RETURN;
  END IF;

  -- Release seats
  UPDATE tkt.event_inventory SET
    "Status" = 'available', "OrderId" = NULL, "HeldBy" = NULL, "HeldUntil" = NULL
  WHERE "OrderId" = p_order_id;

  -- Cancel tickets
  UPDATE tkt.ticket SET "Status" = 'cancelled' WHERE "OrderId" = p_order_id;

  -- Cancel order
  UPDATE tkt."order" SET "Status" = 'cancelled' WHERE "OrderId" = p_order_id;

  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_row."EventId",
    v_row."BuyerName"::VARCHAR, v_row."BuyerEmail"::VARCHAR,
    v_row."Total", v_row."Currency"::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_order_get_tickets(
  p_order_id INT,
  p_user_id VARCHAR
) RETURNS TABLE(
  "TicketId" INT,
  "OrderId" INT,
  "EventId" INT,
  "SeatId" INT,
  "Barcode" VARCHAR,
  "Price" DECIMAL,
  "Currency" VARCHAR,
  "Status" VARCHAR,
  "ScannedAt" TIMESTAMPTZ,
  "CreatedAt" TIMESTAMPTZ,
  "RowLabel" VARCHAR,
  "SeatNumber" INT,
  "SectionName" VARCHAR,
  "SectionCode" VARCHAR,
  "EventName" VARCHAR,
  "EventDate" TIMESTAMPTZ,
  "VenueName" VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT t."TicketId", t."OrderId", t."EventId", t."SeatId",
         t."Barcode"::VARCHAR, t."Price", t."Currency"::VARCHAR,
         t."Status"::VARCHAR, t."ScannedAt", t."CreatedAt",
         r."Label"::VARCHAR AS "RowLabel", st."Number" AS "SeatNumber",
         s."Name"::VARCHAR AS "SectionName", s."Code"::VARCHAR AS "SectionCode",
         e."Name"::VARCHAR AS "EventName", e."EventDate",
         v."Name"::VARCHAR AS "VenueName"
  FROM tkt.ticket t
  JOIN tkt."order" o ON o."OrderId" = t."OrderId"
  JOIN tkt.event e ON e."EventId" = t."EventId"
  JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
  JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
  LEFT JOIN tkt.seat st ON st."SeatId" = t."SeatId"
  LEFT JOIN tkt.row r ON r."RowId" = st."RowId"
  LEFT JOIN tkt.section s ON s."SectionId" = r."SectionId"
  WHERE t."OrderId" = p_order_id AND o."UserId" = p_user_id
  ORDER BY s."SortOrder", r."SortOrder", st."Number";
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- RACES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION usp_tkt_race_list(
  p_company_id INT,
  p_search VARCHAR DEFAULT '',
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 50
) RETURNS TABLE(
  "RaceId" INT,
  "EventId" INT,
  "Distance" VARCHAR,
  "MaxParticipants" INT,
  "RegistrationDeadline" TIMESTAMPTZ,
  "StartTime" TIMESTAMPTZ,
  "RouteMapUrl" VARCHAR,
  "CreatedAt" TIMESTAMPTZ,
  "EventName" VARCHAR,
  "EventDate" TIMESTAMPTZ,
  "EventStatus" VARCHAR,
  "RegisteredCount" BIGINT,
  "TotalCount" BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT r."RaceId", r."EventId", r."Distance"::VARCHAR, r."MaxParticipants",
         r."RegistrationDeadline", r."StartTime", r."RouteMapUrl"::VARCHAR,
         r."CreatedAt",
         e."Name"::VARCHAR AS "EventName", e."EventDate",
         e."Status"::VARCHAR AS "EventStatus",
         (SELECT COUNT(*) FROM tkt.race_registration rr WHERE rr."RaceId" = r."RaceId")::BIGINT AS "RegisteredCount",
         COUNT(*) OVER()::BIGINT AS "TotalCount"
  FROM tkt.race r
  JOIN tkt.event e ON e."EventId" = r."EventId"
  WHERE e."CompanyId" = p_company_id
    AND (p_search = '' OR e."Name" ILIKE '%' || p_search || '%' OR r."Distance" ILIKE '%' || p_search || '%')
  ORDER BY e."EventDate" DESC
  LIMIT p_limit OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_race_get(
  p_race_id INT
) RETURNS TABLE(
  "RaceId" INT,
  "EventId" INT,
  "Distance" VARCHAR,
  "MaxParticipants" INT,
  "RegistrationDeadline" TIMESTAMPTZ,
  "StartTime" TIMESTAMPTZ,
  "RouteMapUrl" VARCHAR,
  "CreatedAt" TIMESTAMPTZ,
  "EventName" VARCHAR,
  "EventDate" TIMESTAMPTZ,
  "ImageUrl" VARCHAR,
  "VenueName" VARCHAR,
  "City" VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT r."RaceId", r."EventId", r."Distance"::VARCHAR, r."MaxParticipants",
         r."RegistrationDeadline", r."StartTime", r."RouteMapUrl"::VARCHAR,
         r."CreatedAt",
         e."Name"::VARCHAR AS "EventName", e."EventDate", e."ImageUrl"::VARCHAR,
         v."Name"::VARCHAR AS "VenueName", v."City"::VARCHAR
  FROM tkt.race r
  JOIN tkt.event e ON e."EventId" = r."EventId"
  LEFT JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
  LEFT JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
  WHERE r."RaceId" = p_race_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_race_upsert(
  p_race_id INT DEFAULT NULL,
  p_event_id INT DEFAULT NULL,
  p_distance VARCHAR DEFAULT NULL,
  p_max_participants INT DEFAULT 500,
  p_registration_deadline TIMESTAMPTZ DEFAULT NULL,
  p_start_time TIMESTAMPTZ DEFAULT NULL,
  p_route_map_url VARCHAR DEFAULT NULL
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "RaceId" INT) AS $$
DECLARE v_id INT;
BEGIN
  IF p_race_id IS NULL THEN
    INSERT INTO tkt.race ("EventId","Distance","MaxParticipants","RegistrationDeadline","StartTime","RouteMapUrl")
    VALUES (p_event_id, p_distance, p_max_participants, p_registration_deadline, p_start_time, p_route_map_url)
    RETURNING tkt.race."RaceId" INTO v_id;
  ELSE
    UPDATE tkt.race SET
      "Distance" = COALESCE(p_distance, "Distance"),
      "MaxParticipants" = COALESCE(p_max_participants, "MaxParticipants"),
      "RegistrationDeadline" = COALESCE(p_registration_deadline, "RegistrationDeadline"),
      "StartTime" = COALESCE(p_start_time, "StartTime"),
      "RouteMapUrl" = COALESCE(p_route_map_url, "RouteMapUrl")
    WHERE "RaceId" = p_race_id;
    v_id := p_race_id;
  END IF;
  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_race_category_list(
  p_race_id INT
) RETURNS TABLE(
  "CategoryId" INT,
  "RaceId" INT,
  "Name" VARCHAR,
  "AgeMin" INT,
  "AgeMax" INT,
  "Gender" VARCHAR,
  "Price" DECIMAL,
  "Currency" VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT rc."CategoryId", rc."RaceId", rc."Name"::VARCHAR,
         rc."AgeMin", rc."AgeMax", rc."Gender"::VARCHAR,
         rc."Price", rc."Currency"::VARCHAR
  FROM tkt.race_category rc
  WHERE rc."RaceId" = p_race_id
  ORDER BY rc."AgeMin";
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_race_category_upsert(
  p_category_id INT DEFAULT NULL,
  p_race_id INT DEFAULT NULL,
  p_name VARCHAR DEFAULT NULL,
  p_age_min INT DEFAULT 0,
  p_age_max INT DEFAULT 99,
  p_gender VARCHAR DEFAULT 'X',
  p_price DECIMAL DEFAULT 0,
  p_currency VARCHAR DEFAULT 'USD'
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "CategoryId" INT) AS $$
DECLARE v_id INT;
BEGIN
  IF p_category_id IS NULL THEN
    INSERT INTO tkt.race_category ("RaceId","Name","AgeMin","AgeMax","Gender","Price","Currency")
    VALUES (p_race_id, p_name, p_age_min, p_age_max, p_gender, p_price, p_currency)
    RETURNING tkt.race_category."CategoryId" INTO v_id;
  ELSE
    UPDATE tkt.race_category SET
      "Name" = COALESCE(p_name, "Name"),
      "AgeMin" = COALESCE(p_age_min, "AgeMin"),
      "AgeMax" = COALESCE(p_age_max, "AgeMax"),
      "Gender" = COALESCE(p_gender, "Gender"),
      "Price" = COALESCE(p_price, "Price"),
      "Currency" = COALESCE(p_currency, "Currency")
    WHERE "CategoryId" = p_category_id;
    v_id := p_category_id;
  END IF;
  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_race_registration_list(
  p_race_id INT,
  p_status VARCHAR DEFAULT '',
  p_page INT DEFAULT 1,
  p_limit INT DEFAULT 100
) RETURNS TABLE(
  "RegistrationId" INT,
  "RaceId" INT,
  "UserId" VARCHAR,
  "BibNumber" VARCHAR,
  "CategoryId" INT,
  "FullName" VARCHAR,
  "IdDocument" VARCHAR,
  "DateOfBirth" DATE,
  "Gender" VARCHAR,
  "EmergencyContact" VARCHAR,
  "EmergencyPhone" VARCHAR,
  "TShirtSize" VARCHAR,
  "Status" VARCHAR,
  "FinishTime" VARCHAR,
  "ChipTime" VARCHAR,
  "Position" INT,
  "CategoryPosition" INT,
  "CreatedAt" TIMESTAMPTZ,
  "CategoryName" VARCHAR,
  "TotalCount" BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT rr."RegistrationId", rr."RaceId", rr."UserId"::VARCHAR,
         rr."BibNumber"::VARCHAR, rr."CategoryId", rr."FullName"::VARCHAR,
         rr."IdDocument"::VARCHAR, rr."DateOfBirth", rr."Gender"::VARCHAR,
         rr."EmergencyContact"::VARCHAR, rr."EmergencyPhone"::VARCHAR,
         rr."TShirtSize"::VARCHAR, rr."Status"::VARCHAR,
         rr."FinishTime"::VARCHAR, rr."ChipTime"::VARCHAR,
         rr."Position", rr."CategoryPosition", rr."CreatedAt",
         rc."Name"::VARCHAR AS "CategoryName",
         COUNT(*) OVER()::BIGINT AS "TotalCount"
  FROM tkt.race_registration rr
  LEFT JOIN tkt.race_category rc ON rc."CategoryId" = rr."CategoryId"
  WHERE rr."RaceId" = p_race_id
    AND (p_status = '' OR rr."Status" = p_status)
  ORDER BY rr."BibNumber"::INT NULLS LAST
  LIMIT p_limit OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_race_register(
  p_race_id INT,
  p_user_id VARCHAR,
  p_category_id INT DEFAULT NULL,
  p_full_name VARCHAR DEFAULT NULL,
  p_id_document VARCHAR DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_gender VARCHAR DEFAULT 'X',
  p_emergency_contact VARCHAR DEFAULT NULL,
  p_emergency_phone VARCHAR DEFAULT NULL,
  p_t_shirt_size VARCHAR DEFAULT 'M'
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "RegistrationId" INT, "BibNumber" VARCHAR) AS $$
DECLARE
  v_max INT; v_current INT; v_bib VARCHAR; v_id INT;
BEGIN
  -- Check capacity
  SELECT r."MaxParticipants" INTO v_max FROM tkt.race r WHERE r."RaceId" = p_race_id;
  IF v_max IS NULL THEN
    RETURN QUERY SELECT false, 'race_not_found'::VARCHAR, NULL::INT, NULL::VARCHAR;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_current FROM tkt.race_registration WHERE "RaceId" = p_race_id;
  IF v_current >= v_max THEN
    RETURN QUERY SELECT false, 'race_full'::VARCHAR, NULL::INT, NULL::VARCHAR;
    RETURN;
  END IF;

  -- Assign bib number
  SELECT LPAD((COALESCE(MAX("BibNumber"::INT), 0) + 1)::TEXT, 4, '0') INTO v_bib
  FROM tkt.race_registration WHERE "RaceId" = p_race_id;

  INSERT INTO tkt.race_registration
    ("RaceId","UserId","BibNumber","CategoryId","FullName","IdDocument",
     "DateOfBirth","Gender","EmergencyContact","EmergencyPhone","TShirtSize","Status")
  VALUES (p_race_id, p_user_id, v_bib, p_category_id, p_full_name, p_id_document,
    p_date_of_birth, p_gender, p_emergency_contact, p_emergency_phone, p_t_shirt_size, 'registered')
  RETURNING "RegistrationId" INTO v_id;

  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_id, v_bib;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_race_update_registration(
  p_registration_id INT,
  p_bib_number VARCHAR DEFAULT NULL,
  p_status VARCHAR DEFAULT NULL,
  p_finish_time VARCHAR DEFAULT NULL,
  p_chip_time VARCHAR DEFAULT NULL,
  p_position INT DEFAULT NULL,
  p_category_position INT DEFAULT NULL
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "RegistrationId" INT) AS $$
BEGIN
  UPDATE tkt.race_registration SET
    "BibNumber" = COALESCE(p_bib_number, "BibNumber"),
    "Status" = COALESCE(p_status, "Status"),
    "FinishTime" = COALESCE(p_finish_time, "FinishTime"),
    "ChipTime" = COALESCE(p_chip_time, "ChipTime"),
    "Position" = COALESCE(p_position, "Position"),
    "CategoryPosition" = COALESCE(p_category_position, "CategoryPosition")
  WHERE "RegistrationId" = p_registration_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'registration_not_found'::VARCHAR, NULL::INT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'OK'::VARCHAR, p_registration_id;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_race_finish(
  p_registration_id INT,
  p_finish_time VARCHAR,
  p_chip_time VARCHAR DEFAULT NULL
) RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "Position" INT, "CategoryPosition" INT) AS $$
DECLARE
  v_race_id INT; v_cat_id INT; v_pos INT; v_cat_pos INT;
BEGIN
  SELECT "RaceId", "CategoryId" INTO v_race_id, v_cat_id
  FROM tkt.race_registration WHERE "RegistrationId" = p_registration_id;

  IF v_race_id IS NULL THEN
    RETURN QUERY SELECT false, 'registration_not_found'::VARCHAR, NULL::INT, NULL::INT;
    RETURN;
  END IF;

  -- General position
  SELECT COUNT(*) + 1 INTO v_pos
  FROM tkt.race_registration WHERE "RaceId" = v_race_id AND "Status" = 'finished';

  -- Category position
  SELECT COUNT(*) + 1 INTO v_cat_pos
  FROM tkt.race_registration WHERE "RaceId" = v_race_id AND "CategoryId" = v_cat_id AND "Status" = 'finished';

  UPDATE tkt.race_registration SET
    "Status" = 'finished',
    "FinishTime" = p_finish_time,
    "ChipTime" = COALESCE(p_chip_time, p_finish_time),
    "Position" = v_pos,
    "CategoryPosition" = v_cat_pos
  WHERE "RegistrationId" = p_registration_id;

  RETURN QUERY SELECT true, 'OK'::VARCHAR, v_pos, v_cat_pos;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION usp_tkt_race_get_results(
  p_race_id INT,
  p_category_id INT DEFAULT NULL
) RETURNS TABLE(
  "RegistrationId" INT,
  "RaceId" INT,
  "UserId" VARCHAR,
  "BibNumber" VARCHAR,
  "CategoryId" INT,
  "FullName" VARCHAR,
  "Gender" VARCHAR,
  "Status" VARCHAR,
  "FinishTime" VARCHAR,
  "ChipTime" VARCHAR,
  "Position" INT,
  "CategoryPosition" INT,
  "CategoryName" VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT rr."RegistrationId", rr."RaceId", rr."UserId"::VARCHAR,
         rr."BibNumber"::VARCHAR, rr."CategoryId", rr."FullName"::VARCHAR,
         rr."Gender"::VARCHAR, rr."Status"::VARCHAR,
         rr."FinishTime"::VARCHAR, rr."ChipTime"::VARCHAR,
         rr."Position", rr."CategoryPosition",
         rc."Name"::VARCHAR AS "CategoryName"
  FROM tkt.race_registration rr
  LEFT JOIN tkt.race_category rc ON rc."CategoryId" = rr."CategoryId"
  WHERE rr."RaceId" = p_race_id
    AND rr."Status" = 'finished'
    AND (p_category_id IS NULL OR rr."CategoryId" = p_category_id)
  ORDER BY rr."Position" NULLS LAST, rr."ChipTime" NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
-- SCAN
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION usp_tkt_scan_validate(
  p_barcode VARCHAR
) RETURNS TABLE(
  "ok" BOOLEAN,
  "error" VARCHAR,
  "TicketId" INT,
  "OrderId" INT,
  "EventId" INT,
  "SeatId" INT,
  "Barcode" VARCHAR,
  "Price" DECIMAL,
  "Currency" VARCHAR,
  "Status" VARCHAR,
  "ScannedAt" TIMESTAMPTZ,
  "EventName" VARCHAR,
  "EventDate" TIMESTAMPTZ,
  "SectionName" VARCHAR,
  "RowLabel" VARCHAR,
  "SeatNumber" INT,
  "BuyerName" VARCHAR
) AS $$
DECLARE v_ticket RECORD;
BEGIN
  SELECT t."TicketId", t."OrderId", t."EventId", t."SeatId",
         t."Barcode"::VARCHAR, t."Price", t."Currency"::VARCHAR,
         t."Status"::VARCHAR, t."ScannedAt",
         e."Name"::VARCHAR AS "EventName", e."EventDate",
         s."Name"::VARCHAR AS "SectionName", r."Label"::VARCHAR AS "RowLabel",
         st."Number" AS "SeatNumber",
         o."BuyerName"::VARCHAR
  INTO v_ticket
  FROM tkt.ticket t
  JOIN tkt."order" o ON o."OrderId" = t."OrderId"
  JOIN tkt.event e ON e."EventId" = t."EventId"
  LEFT JOIN tkt.seat st ON st."SeatId" = t."SeatId"
  LEFT JOIN tkt.row r ON r."RowId" = st."RowId"
  LEFT JOIN tkt.section s ON s."SectionId" = r."SectionId"
  WHERE t."Barcode" = p_barcode;

  IF v_ticket IS NULL THEN
    RETURN QUERY SELECT false, 'ticket_not_found'::VARCHAR,
      NULL::INT, NULL::INT, NULL::INT, NULL::INT, NULL::VARCHAR,
      NULL::DECIMAL, NULL::VARCHAR, NULL::VARCHAR, NULL::TIMESTAMPTZ,
      NULL::VARCHAR, NULL::TIMESTAMPTZ, NULL::VARCHAR, NULL::VARCHAR,
      NULL::INT, NULL::VARCHAR;
    RETURN;
  END IF;

  IF v_ticket."Status" = 'cancelled' THEN
    RETURN QUERY SELECT false, 'ticket_cancelled'::VARCHAR,
      v_ticket."TicketId", v_ticket."OrderId", v_ticket."EventId", v_ticket."SeatId",
      v_ticket."Barcode", v_ticket."Price", v_ticket."Currency",
      v_ticket."Status", v_ticket."ScannedAt",
      v_ticket."EventName", v_ticket."EventDate", v_ticket."SectionName",
      v_ticket."RowLabel", v_ticket."SeatNumber", v_ticket."BuyerName";
    RETURN;
  END IF;

  IF v_ticket."ScannedAt" IS NOT NULL THEN
    RETURN QUERY SELECT false, 'already_scanned'::VARCHAR,
      v_ticket."TicketId", v_ticket."OrderId", v_ticket."EventId", v_ticket."SeatId",
      v_ticket."Barcode", v_ticket."Price", v_ticket."Currency",
      v_ticket."Status", v_ticket."ScannedAt",
      v_ticket."EventName", v_ticket."EventDate", v_ticket."SectionName",
      v_ticket."RowLabel", v_ticket."SeatNumber", v_ticket."BuyerName";
    RETURN;
  END IF;

  -- Mark as scanned
  UPDATE tkt.ticket SET "ScannedAt" = NOW() WHERE "TicketId" = v_ticket."TicketId";

  RETURN QUERY SELECT true, NULL::VARCHAR,
    v_ticket."TicketId", v_ticket."OrderId", v_ticket."EventId", v_ticket."SeatId",
    v_ticket."Barcode", v_ticket."Price", v_ticket."Currency",
    v_ticket."Status", NOW()::TIMESTAMPTZ,
    v_ticket."EventName", v_ticket."EventDate", v_ticket."SectionName",
    v_ticket."RowLabel", v_ticket."SeatNumber", v_ticket."BuyerName";
END;
$$ LANGUAGE plpgsql;

-- +goose Down
DROP FUNCTION IF EXISTS usp_tkt_scan_validate(VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_race_get_results(INT, INT);
DROP FUNCTION IF EXISTS usp_tkt_race_finish(INT, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_race_update_registration(INT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INT, INT);
DROP FUNCTION IF EXISTS usp_tkt_race_register(INT, VARCHAR, INT, VARCHAR, VARCHAR, DATE, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_race_registration_list(INT, VARCHAR, INT, INT);
DROP FUNCTION IF EXISTS usp_tkt_race_category_upsert(INT, INT, VARCHAR, INT, INT, VARCHAR, DECIMAL, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_race_category_list(INT);
DROP FUNCTION IF EXISTS usp_tkt_race_upsert(INT, INT, VARCHAR, INT, TIMESTAMPTZ, TIMESTAMPTZ, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_race_get(INT);
DROP FUNCTION IF EXISTS usp_tkt_race_list(INT, VARCHAR, INT, INT);
DROP FUNCTION IF EXISTS usp_tkt_order_get_tickets(INT, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_order_cancel(INT, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_order_confirm_payment(INT, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_order_checkout(INT, INT[], VARCHAR, INT, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_order_get(INT, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_order_list(VARCHAR, INT, INT, INT);
DROP FUNCTION IF EXISTS usp_tkt_event_get_seatmap(INT);
DROP FUNCTION IF EXISTS usp_tkt_event_release_expired();
DROP FUNCTION IF EXISTS usp_tkt_event_release_seats(INT, INT[], VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_event_hold_seats(INT, INT[], VARCHAR, INT);
DROP FUNCTION IF EXISTS usp_tkt_event_get_availability(INT, INT);
DROP FUNCTION IF EXISTS usp_tkt_event_initialize_inventory(INT);
DROP FUNCTION IF EXISTS usp_tkt_event_pricingzone_upsert(INT, INT, VARCHAR, VARCHAR, DECIMAL, VARCHAR, INT[]);
DROP FUNCTION IF EXISTS usp_tkt_event_pricingzone_list(INT);
DROP FUNCTION IF EXISTS usp_tkt_event_upsert(INT, INT, VARCHAR, TEXT, INT, TIMESTAMPTZ, TIMESTAMPTZ, VARCHAR, VARCHAR, VARCHAR, INT, BOOLEAN, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_event_get(INT);
DROP FUNCTION IF EXISTS usp_tkt_event_list(INT, VARCHAR, VARCHAR, INT, TIMESTAMPTZ, TIMESTAMPTZ, INT, INT);
DROP FUNCTION IF EXISTS usp_tkt_venue_get_seatmap(INT);
DROP FUNCTION IF EXISTS usp_tkt_venue_generate_seats(INT, INT, INT, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_section_upsert(INT, INT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, INT, BOOLEAN, INT);
DROP FUNCTION IF EXISTS usp_tkt_section_list(INT);
DROP FUNCTION IF EXISTS usp_tkt_venue_config_upsert(INT, INT, VARCHAR, TEXT, TEXT);
DROP FUNCTION IF EXISTS usp_tkt_venue_config_list(INT);
DROP FUNCTION IF EXISTS usp_tkt_venue_delete(INT);
DROP FUNCTION IF EXISTS usp_tkt_venue_upsert(INT, INT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INT, VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS usp_tkt_venue_get(INT);
DROP FUNCTION IF EXISTS usp_tkt_venue_list(INT, VARCHAR, VARCHAR, VARCHAR, INT, INT);
