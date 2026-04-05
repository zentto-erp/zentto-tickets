-- +goose Up
-- Zentto Tickets — Schema completo para ticketing y eventos

CREATE SCHEMA IF NOT EXISTS tkt;

-- ══════════════════════════════════════════════════════
-- VENUE — Lugar físico (estadio, arena, teatro, etc.)
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.venue (
    "VenueId"       SERIAL PRIMARY KEY,
    "CompanyId"     INT NOT NULL,
    "Name"          VARCHAR(200) NOT NULL,
    "Address"       VARCHAR(500),
    "City"          VARCHAR(100),
    "Country"       VARCHAR(5),               -- ISO 3166-1 alpha-2
    "Capacity"      INT NOT NULL DEFAULT 0,
    "TimeZone"      VARCHAR(50) DEFAULT 'UTC',
    "ImageUrl"      VARCHAR(500),
    "SvgTemplate"   TEXT,                      -- SVG base del venue (estructura macro)
    "IsActive"      BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedBy"     VARCHAR(50),
    "CreatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedBy"     VARCHAR(50),
    "UpdatedAt"     TIMESTAMPTZ
);

CREATE INDEX ix_tkt_venue_company ON tkt.venue ("CompanyId");

-- ══════════════════════════════════════════════════════
-- VENUE CONFIGURATION — Un venue puede tener múltiples layouts
-- (ej: concierto end-stage, concierto center-stage, deporte, media sala)
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.venue_configuration (
    "ConfigurationId" SERIAL PRIMARY KEY,
    "VenueId"         INT NOT NULL REFERENCES tkt.venue("VenueId"),
    "Name"            VARCHAR(200) NOT NULL,  -- "Concierto End-Stage", "Fútbol", etc.
    "Description"     TEXT,
    "SvgOverlay"      TEXT,                   -- SVG overlay para esta config
    "IsActive"        BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt"       TIMESTAMPTZ
);

CREATE INDEX ix_tkt_venueconfig_venue ON tkt.venue_configuration ("VenueId");

-- ══════════════════════════════════════════════════════
-- SECTION — Sección/tribuna dentro de una configuración
-- (ej: "Tribuna Principal", "VIP", "Gradería General")
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.section (
    "SectionId"          SERIAL PRIMARY KEY,
    "ConfigurationId"    INT NOT NULL REFERENCES tkt.venue_configuration("ConfigurationId"),
    "Name"               VARCHAR(200) NOT NULL,
    "Code"               VARCHAR(20),           -- "SEC-A", "VIP-1", etc.
    "Category"           VARCHAR(50) DEFAULT 'standard',  -- vip, preferencial, general, palco
    "Color"              VARCHAR(7) DEFAULT '#3B82F6',    -- hex color para el mapa
    "Polygon"            JSONB,                 -- array de [x,y] para el polígono SVG
    "SortOrder"          INT DEFAULT 0,
    "IsGeneralAdmission" BOOLEAN DEFAULT FALSE,
    "GaCapacity"         INT DEFAULT 0,         -- capacidad si es GA
    "CreatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tkt_section_config ON tkt.section ("ConfigurationId");

-- ══════════════════════════════════════════════════════
-- ROW — Fila dentro de una sección
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.row (
    "RowId"     SERIAL PRIMARY KEY,
    "SectionId" INT NOT NULL REFERENCES tkt.section("SectionId") ON DELETE CASCADE,
    "Label"     VARCHAR(10) NOT NULL,   -- "A", "B", "1", "2", etc.
    "SeatCount" INT NOT NULL DEFAULT 0,
    "SortOrder" INT DEFAULT 0,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tkt_row_section ON tkt.row ("SectionId");

-- ══════════════════════════════════════════════════════
-- SEAT — Asiento individual
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.seat (
    "SeatId"       SERIAL PRIMARY KEY,
    "RowId"        INT NOT NULL REFERENCES tkt.row("RowId") ON DELETE CASCADE,
    "Number"       INT NOT NULL,
    "SeatType"     VARCHAR(20) DEFAULT 'seat',  -- seat, wheelchair, companion, obstructed
    "IsAccessible" BOOLEAN DEFAULT FALSE,
    "X"            REAL,                         -- coordenada X en el mapa (opcional)
    "Y"            REAL,                         -- coordenada Y en el mapa (opcional)
    "CreatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tkt_seat_row ON tkt.seat ("RowId");

-- ══════════════════════════════════════════════════════
-- EVENT — Evento (concierto, partido, carrera, etc.)
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.event (
    "EventId"            SERIAL PRIMARY KEY,
    "CompanyId"          INT NOT NULL,
    "Name"               VARCHAR(300) NOT NULL,
    "Description"        TEXT,
    "ConfigurationId"    INT NOT NULL REFERENCES tkt.venue_configuration("ConfigurationId"),
    "EventDate"          TIMESTAMPTZ NOT NULL,
    "DoorsOpen"          TIMESTAMPTZ,
    "Status"             VARCHAR(20) DEFAULT 'draft',  -- draft, published, on_sale, sold_out, completed, cancelled
    "EventType"          VARCHAR(50) DEFAULT 'general', -- general, concert, sports, theater, race, festival
    "ImageUrl"           VARCHAR(500),
    "MaxTicketsPerOrder" INT DEFAULT 6,
    "IsPublished"        BOOLEAN DEFAULT FALSE,
    "CreatedBy"          VARCHAR(50),
    "CreatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedBy"          VARCHAR(50),
    "UpdatedAt"          TIMESTAMPTZ
);

CREATE INDEX ix_tkt_event_company ON tkt.event ("CompanyId");
CREATE INDEX ix_tkt_event_date ON tkt.event ("EventDate");
CREATE INDEX ix_tkt_event_status ON tkt.event ("Status");

-- ══════════════════════════════════════════════════════
-- PRICING ZONE — Zona de precios por evento
-- (Una zona puede abarcar múltiples secciones)
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.pricing_zone (
    "ZoneId"   SERIAL PRIMARY KEY,
    "EventId"  INT NOT NULL REFERENCES tkt.event("EventId"),
    "Name"     VARCHAR(100) NOT NULL,  -- "VIP", "Preferencial", "General"
    "Color"    VARCHAR(7) DEFAULT '#10B981',
    "Price"    DECIMAL(12,2) NOT NULL,
    "Currency" VARCHAR(3) DEFAULT 'USD'
);

CREATE INDEX ix_tkt_pricingzone_event ON tkt.pricing_zone ("EventId");

-- Tabla intermedia: zona ↔ secciones
CREATE TABLE tkt.pricing_zone_section (
    "ZoneId"    INT NOT NULL REFERENCES tkt.pricing_zone("ZoneId") ON DELETE CASCADE,
    "SectionId" INT NOT NULL REFERENCES tkt.section("SectionId"),
    PRIMARY KEY ("ZoneId", "SectionId")
);

-- ══════════════════════════════════════════════════════
-- EVENT INVENTORY — Estado de cada asiento por evento
-- (available, held, sold, blocked)
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.event_inventory (
    "EventId"   INT NOT NULL REFERENCES tkt.event("EventId"),
    "SeatId"    INT NOT NULL REFERENCES tkt.seat("SeatId"),
    "SectionId" INT NOT NULL REFERENCES tkt.section("SectionId"),
    "Status"    VARCHAR(15) DEFAULT 'available',  -- available, held, sold, blocked
    "HeldBy"    VARCHAR(50),
    "HeldUntil" TIMESTAMPTZ,
    "OrderId"   INT,
    PRIMARY KEY ("EventId", "SeatId")
);

CREATE INDEX ix_tkt_eventinv_status ON tkt.event_inventory ("EventId", "Status");
CREATE INDEX ix_tkt_eventinv_held ON tkt.event_inventory ("HeldUntil") WHERE "Status" = 'held';

-- ══════════════════════════════════════════════════════
-- EVENT GA INVENTORY — Inventario General Admission
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.event_ga_inventory (
    "EventId"       INT NOT NULL REFERENCES tkt.event("EventId"),
    "SectionId"     INT NOT NULL REFERENCES tkt.section("SectionId"),
    "TotalCapacity" INT NOT NULL,
    "SoldCount"     INT NOT NULL DEFAULT 0,
    PRIMARY KEY ("EventId", "SectionId"),
    CONSTRAINT chk_ga_sold CHECK ("SoldCount" <= "TotalCapacity")
);

-- ══════════════════════════════════════════════════════
-- ORDER — Orden de compra
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt."order" (
    "OrderId"       SERIAL PRIMARY KEY,
    "CompanyId"     INT NOT NULL,
    "EventId"       INT NOT NULL REFERENCES tkt.event("EventId"),
    "UserId"        VARCHAR(50) NOT NULL,
    "BuyerName"     VARCHAR(200),
    "BuyerEmail"    VARCHAR(200),
    "BuyerPhone"    VARCHAR(50),
    "Total"         DECIMAL(12,2) NOT NULL,
    "Currency"      VARCHAR(3) DEFAULT 'USD',
    "Status"        VARCHAR(20) DEFAULT 'pending_payment', -- pending_payment, paid, cancelled, refunded
    "PaymentRef"    VARCHAR(200),
    "PaymentMethod" VARCHAR(50),
    "PaidAt"        TIMESTAMPTZ,
    "CreatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tkt_order_user ON tkt."order" ("UserId");
CREATE INDEX ix_tkt_order_event ON tkt."order" ("EventId");

-- ══════════════════════════════════════════════════════
-- TICKET — Boleto individual con QR
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.ticket (
    "TicketId"    SERIAL PRIMARY KEY,
    "OrderId"     INT NOT NULL REFERENCES tkt."order"("OrderId"),
    "EventId"     INT NOT NULL REFERENCES tkt.event("EventId"),
    "SeatId"      INT,                          -- NULL para GA
    "Barcode"     VARCHAR(200) UNIQUE NOT NULL,  -- QR/barcode con HMAC
    "Price"       DECIMAL(12,2) NOT NULL,
    "Currency"    VARCHAR(3) DEFAULT 'USD',
    "Status"      VARCHAR(20) DEFAULT 'active',  -- active, cancelled, transferred, used
    "ScannedAt"   TIMESTAMPTZ,                   -- fecha/hora de escaneo en puerta
    "TransferTo"  VARCHAR(200),                  -- email si fue transferido
    "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tkt_ticket_order ON tkt.ticket ("OrderId");
CREATE INDEX ix_tkt_ticket_event ON tkt.ticket ("EventId");
CREATE UNIQUE INDEX ux_tkt_ticket_event_seat ON tkt.ticket ("EventId", "SeatId") WHERE "SeatId" IS NOT NULL;

-- FK de event_inventory.OrderId
ALTER TABLE tkt.event_inventory
    ADD CONSTRAINT fk_eventinv_order FOREIGN KEY ("OrderId") REFERENCES tkt."order"("OrderId");

-- ══════════════════════════════════════════════════════
-- SEED: Venues de referencia
-- ══════════════════════════════════════════════════════

-- Venezuela
INSERT INTO tkt.venue ("CompanyId", "Name", "Address", "City", "Country", "Capacity", "TimeZone")
VALUES
  (1, 'Estadio Monumental Simón Bolívar', 'Caracas', 'Caracas', 'VE', 45000, 'America/Caracas'),
  (1, 'Estadio Universitario de Caracas (UCV)', 'Ciudad Universitaria', 'Caracas', 'VE', 26772, 'America/Caracas'),
  (1, 'Estadio Monumental de Maturín', 'Maturín', 'Maturín', 'VE', 52000, 'America/Caracas'),
  (1, 'Poliedro de Caracas', 'Autopista Valle-Coche', 'Caracas', 'VE', 15000, 'America/Caracas'),
  (1, 'Estadio José Bernardo Pérez', 'Valencia', 'Valencia', 'VE', 16000, 'America/Caracas'),
  (1, 'Estadio Luis Aparicio El Grande', 'Maracaibo', 'Maracaibo', 'VE', 25000, 'America/Caracas'),
  (1, 'Forum de Valencia', 'Valencia', 'Valencia', 'VE', 10000, 'America/Caracas');

-- España
INSERT INTO tkt.venue ("CompanyId", "Name", "Address", "City", "Country", "Capacity", "TimeZone")
VALUES
  (1, 'Santiago Bernabéu', 'Av. de Concha Espina, 1', 'Madrid', 'ES', 83186, 'Europe/Madrid'),
  (1, 'Spotify Camp Nou', 'C/ d''Arístides Maillol', 'Barcelona', 'ES', 105000, 'Europe/Madrid'),
  (1, 'Cívitas Metropolitano', 'Av. de Luis Aragones, 4', 'Madrid', 'ES', 68456, 'Europe/Madrid'),
  (1, 'Mestalla', 'Av. de Suecia, s/n', 'Valencia', 'ES', 49430, 'Europe/Madrid'),
  (1, 'WiZink Center', 'Av. Felipe II, s/n', 'Madrid', 'ES', 17000, 'Europe/Madrid');

-- USA
INSERT INTO tkt.venue ("CompanyId", "Name", "Address", "City", "Country", "Capacity", "TimeZone")
VALUES
  (1, 'Dodger Stadium', '1000 Vin Scully Ave', 'Los Angeles', 'US', 56000, 'America/Los_Angeles'),
  (1, 'SoFi Stadium', '1001 Stadium Dr', 'Inglewood', 'US', 70240, 'America/Los_Angeles'),
  (1, 'Madison Square Garden', '4 Pennsylvania Plaza', 'New York', 'US', 20789, 'America/New_York');

-- +goose Down
DROP SCHEMA IF EXISTS tkt CASCADE;
