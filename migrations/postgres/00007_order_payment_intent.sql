-- +goose Up
-- Agregar columna PaymentIntentId a la tabla order para rastrear pagos Stripe

ALTER TABLE tkt."order"
    ADD COLUMN IF NOT EXISTS "PaymentIntentId" VARCHAR(200);

CREATE INDEX IF NOT EXISTS ix_tkt_order_payment_intent
    ON tkt."order" ("PaymentIntentId")
    WHERE "PaymentIntentId" IS NOT NULL;

-- SP para asociar PaymentIntentId a una orden
CREATE OR REPLACE FUNCTION tkt.usp_tkt_order_set_payment_intent(
    p_OrderId INT,
    p_PaymentIntentId VARCHAR
)
RETURNS TABLE("ok" BOOLEAN, "mensaje" VARCHAR) AS $$
BEGIN
    UPDATE tkt."order"
    SET "PaymentIntentId" = p_PaymentIntentId
    WHERE "OrderId" = p_OrderId
      AND "Status" = 'pending_payment';

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'order_not_found_or_not_pending'::VARCHAR;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'ok'::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- +goose Down
DROP FUNCTION IF EXISTS tkt.usp_tkt_order_set_payment_intent(INT, VARCHAR);
DROP INDEX IF EXISTS tkt.ix_tkt_order_payment_intent;
ALTER TABLE tkt."order" DROP COLUMN IF EXISTS "PaymentIntentId";
