-- ============================================================
-- Seed idempotente para zentto-tickets
-- Los datos demo iniciales ya estan en migrations/postgres/00003_seed_data.sql
-- (aplicado como migracion one-shot). Este archivo es un placeholder
-- para nuevos seeds incrementales que evolucionan entre versiones.
--
-- REGLA: todo INSERT en este archivo DEBE usar ON CONFLICT DO NOTHING
-- para que sea re-ejecutable en cada deploy sin romper datos del cliente.
-- ============================================================

-- Marca presencia del sistema de seeds (no-op)
SELECT 1 WHERE FALSE;
