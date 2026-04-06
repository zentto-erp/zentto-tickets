-- +goose Up
-- Tabla de cola de sincronización con el ERP contable (zentto-web)

CREATE TABLE IF NOT EXISTS tkt.erp_sync_queue (
    "SyncId"      SERIAL PRIMARY KEY,
    "OrderId"     INTEGER NOT NULL REFERENCES tkt."order"("OrderId"),
    "EventType"   VARCHAR(50) NOT NULL CHECK ("EventType" IN ('order_completed','payment_received','refund')),
    "Payload"     JSONB NOT NULL DEFAULT '{}',
    "Status"      VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK ("Status" IN ('pending','synced','failed')),
    "Attempts"    INTEGER NOT NULL DEFAULT 0,
    "LastError"   TEXT,
    "CompanyId"   INTEGER NOT NULL,
    "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "SyncedAt"    TIMESTAMPTZ
);

CREATE INDEX idx_erp_sync_queue_status ON tkt.erp_sync_queue ("Status", "CreatedAt");
CREATE INDEX idx_erp_sync_queue_company ON tkt.erp_sync_queue ("CompanyId", "Status");
CREATE INDEX idx_erp_sync_queue_order ON tkt.erp_sync_queue ("OrderId");

-- ── usp_tkt_erp_sync_enqueue ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION usp_tkt_erp_sync_enqueue(
    p_order_id   INTEGER,
    p_event_type VARCHAR(50),
    p_payload    JSONB DEFAULT '{}',
    p_company_id INTEGER DEFAULT 0
)
RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR, "SyncId" INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
    v_sync_id INTEGER;
    v_cid     INTEGER;
BEGIN
    -- Si no viene CompanyId, buscarlo de la orden via evento
    IF p_company_id = 0 THEN
        SELECT e."CompanyId" INTO v_cid
          FROM tkt."order" o
          JOIN tkt.event e ON e."EventId" = o."EventId"
         WHERE o."OrderId" = p_order_id;
    ELSE
        v_cid := p_company_id;
    END IF;

    INSERT INTO tkt.erp_sync_queue ("OrderId", "EventType", "Payload", "CompanyId")
    VALUES (p_order_id, p_event_type, p_payload, COALESCE(v_cid, 0))
    RETURNING "SyncId" INTO v_sync_id;

    RETURN QUERY SELECT TRUE, 'enqueued'::VARCHAR, v_sync_id;
END;
$$;

-- ── usp_tkt_erp_sync_list_pending ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION usp_tkt_erp_sync_list_pending(
    p_company_id INTEGER DEFAULT 0,
    p_limit      INTEGER DEFAULT 50
)
RETURNS TABLE(
    "SyncId"    INTEGER,
    "OrderId"   INTEGER,
    "EventType" VARCHAR,
    "Payload"   JSONB,
    "Status"    VARCHAR,
    "Attempts"  INTEGER,
    "LastError" TEXT,
    "CompanyId" INTEGER,
    "CreatedAt" TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT q."SyncId", q."OrderId", q."EventType"::VARCHAR, q."Payload",
           q."Status"::VARCHAR, q."Attempts", q."LastError", q."CompanyId", q."CreatedAt"
      FROM tkt.erp_sync_queue q
     WHERE q."Status" IN ('pending', 'failed')
       AND (p_company_id = 0 OR q."CompanyId" = p_company_id)
     ORDER BY q."CreatedAt" ASC
     LIMIT p_limit;
END;
$$;

-- ── usp_tkt_erp_sync_mark_done ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION usp_tkt_erp_sync_mark_done(
    p_sync_id INTEGER,
    p_success BOOLEAN DEFAULT TRUE,
    p_error   TEXT DEFAULT NULL
)
RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR)
LANGUAGE plpgsql AS $$
BEGIN
    IF p_success THEN
        UPDATE tkt.erp_sync_queue
           SET "Status"   = 'synced',
               "SyncedAt" = NOW(),
               "Attempts" = "Attempts" + 1
         WHERE "SyncId" = p_sync_id;
    ELSE
        UPDATE tkt.erp_sync_queue
           SET "Status"    = CASE WHEN "Attempts" + 1 >= 5 THEN 'failed' ELSE 'pending' END,
               "Attempts"  = "Attempts" + 1,
               "LastError" = COALESCE(p_error, 'unknown_error')
         WHERE "SyncId" = p_sync_id;
    END IF;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'sync_not_found'::VARCHAR;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'updated'::VARCHAR;
END;
$$;

-- ── usp_tkt_erp_sync_stats ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION usp_tkt_erp_sync_stats(
    p_company_id INTEGER DEFAULT 0
)
RETURNS TABLE(
    "Pending"     BIGINT,
    "SyncedToday" BIGINT,
    "Failed"      BIGINT,
    "Total"       BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE q."Status" = 'pending'),
        COUNT(*) FILTER (WHERE q."Status" = 'synced' AND q."SyncedAt"::DATE = CURRENT_DATE),
        COUNT(*) FILTER (WHERE q."Status" = 'failed'),
        COUNT(*)
      FROM tkt.erp_sync_queue q
     WHERE (p_company_id = 0 OR q."CompanyId" = p_company_id);
END;
$$;

-- ── usp_tkt_erp_sync_recent ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION usp_tkt_erp_sync_recent(
    p_company_id INTEGER DEFAULT 0,
    p_limit      INTEGER DEFAULT 20
)
RETURNS TABLE(
    "SyncId"    INTEGER,
    "OrderId"   INTEGER,
    "EventType" VARCHAR,
    "Status"    VARCHAR,
    "Attempts"  INTEGER,
    "LastError" TEXT,
    "CreatedAt" TIMESTAMPTZ,
    "SyncedAt"  TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT q."SyncId", q."OrderId", q."EventType"::VARCHAR, q."Status"::VARCHAR,
           q."Attempts", q."LastError", q."CreatedAt", q."SyncedAt"
      FROM tkt.erp_sync_queue q
     WHERE (p_company_id = 0 OR q."CompanyId" = p_company_id)
     ORDER BY q."CreatedAt" DESC
     LIMIT p_limit;
END;
$$;

-- +goose Down
DROP FUNCTION IF EXISTS usp_tkt_erp_sync_recent;
DROP FUNCTION IF EXISTS usp_tkt_erp_sync_stats;
DROP FUNCTION IF EXISTS usp_tkt_erp_sync_mark_done;
DROP FUNCTION IF EXISTS usp_tkt_erp_sync_list_pending;
DROP FUNCTION IF EXISTS usp_tkt_erp_sync_enqueue;
DROP TABLE IF EXISTS tkt.erp_sync_queue;
