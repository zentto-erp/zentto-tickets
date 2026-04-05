-- +goose Up
-- Zentto Tickets — Módulo de carreras, inscripciones y control de tiempos

-- ══════════════════════════════════════════════════════
-- RACE — Carrera asociada a un evento
-- (5K, 10K, 21K, 42K, ultras, trail, etc.)
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.race (
    "RaceId"                SERIAL PRIMARY KEY,
    "EventId"               INT NOT NULL REFERENCES tkt.event("EventId"),
    "Distance"              VARCHAR(20) NOT NULL,    -- "5K", "10K", "21K", "42K", "100M"
    "MaxParticipants"       INT NOT NULL DEFAULT 500,
    "RegistrationDeadline"  TIMESTAMPTZ,
    "StartTime"             TIMESTAMPTZ,
    "RouteMapUrl"           VARCHAR(500),            -- URL del mapa de ruta
    "CreatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tkt_race_event ON tkt.race ("EventId");

-- ══════════════════════════════════════════════════════
-- RACE CATEGORY — Categorías por edad/género
-- (Elite, Sub-23, General, Veteranos, etc.)
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.race_category (
    "CategoryId"  SERIAL PRIMARY KEY,
    "RaceId"      INT NOT NULL REFERENCES tkt.race("RaceId") ON DELETE CASCADE,
    "Name"        VARCHAR(100) NOT NULL,
    "AgeMin"      INT DEFAULT 0,
    "AgeMax"      INT DEFAULT 99,
    "Gender"      VARCHAR(1) DEFAULT 'X',   -- M, F, X (mixto)
    "Price"       DECIMAL(12,2) NOT NULL DEFAULT 0,
    "Currency"    VARCHAR(3) DEFAULT 'USD'
);

CREATE INDEX ix_tkt_racecat_race ON tkt.race_category ("RaceId");

-- ══════════════════════════════════════════════════════
-- RACE REGISTRATION — Inscripción de participantes
-- (dorsal, datos personales, tiempos, posición)
-- ══════════════════════════════════════════════════════
CREATE TABLE tkt.race_registration (
    "RegistrationId"   SERIAL PRIMARY KEY,
    "RaceId"           INT NOT NULL REFERENCES tkt.race("RaceId"),
    "UserId"           VARCHAR(50) NOT NULL,
    "BibNumber"        VARCHAR(10) NOT NULL,          -- Dorsal
    "CategoryId"       INT REFERENCES tkt.race_category("CategoryId"),
    "FullName"         VARCHAR(200) NOT NULL,
    "IdDocument"       VARCHAR(30),                   -- Cédula / DNI / pasaporte
    "DateOfBirth"      DATE,
    "Gender"           VARCHAR(1) DEFAULT 'X',
    "EmergencyContact" VARCHAR(200),
    "EmergencyPhone"   VARCHAR(50),
    "TShirtSize"       VARCHAR(5) DEFAULT 'M',        -- XS, S, M, L, XL, XXL
    "Status"           VARCHAR(20) DEFAULT 'registered', -- registered, confirmed, dns, dnf, finished
    "FinishTime"       VARCHAR(20),                   -- HH:MM:SS.ms (tiempo oficial)
    "ChipTime"         VARCHAR(20),                   -- HH:MM:SS.ms (chip/neto)
    "Position"         INT,                           -- Posición general
    "CategoryPosition" INT,                           -- Posición en categoría
    "CreatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tkt_racereg_race ON tkt.race_registration ("RaceId");
CREATE INDEX ix_tkt_racereg_user ON tkt.race_registration ("UserId");
CREATE UNIQUE INDEX ux_tkt_racereg_bib ON tkt.race_registration ("RaceId", "BibNumber");

-- +goose Down
DROP TABLE IF EXISTS tkt.race_registration CASCADE;
DROP TABLE IF EXISTS tkt.race_category CASCADE;
DROP TABLE IF EXISTS tkt.race CASCADE;
