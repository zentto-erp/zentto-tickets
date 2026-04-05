-- +goose Up
-- Seed: Datos iniciales para desarrollo y demo

-- Venue configurations
INSERT INTO tkt.venue_configuration ("VenueId", "Name", "Description") VALUES
  (1, 'Concierto End-Stage', 'Escenario en un extremo del estadio'),
  (2, 'Futbol Standard', 'Configuracion estandar para futbol'),
  (3, 'Beisbol', 'Configuracion para beisbol'),
  (8, 'Concierto 360', 'Escenario central Santiago Bernabeu'),
  (13, 'Beisbol MLB', 'Configuracion Dodger Stadium')
ON CONFLICT DO NOTHING;

-- Secciones para Estadio Monumental (ConfigId=1)
INSERT INTO tkt.section ("ConfigurationId", "Name", "Code", "Category", "Color", "SortOrder", "IsGeneralAdmission", "GaCapacity") VALUES
  (1, 'VIP Tribuna Principal', 'VIP-A', 'vip', '#EF4444', 1, false, 0),
  (1, 'Preferencial Este', 'PREF-E', 'preferencial', '#F59E0B', 2, false, 0),
  (1, 'Preferencial Oeste', 'PREF-O', 'preferencial', '#F59E0B', 3, false, 0),
  (1, 'General Norte', 'GEN-N', 'general', '#10B981', 4, true, 5000),
  (1, 'General Sur', 'GEN-S', 'general', '#10B981', 5, true, 5000),
  (1, 'Palcos VIP', 'PALCO', 'palco', '#8B5CF6', 6, false, 0)
ON CONFLICT DO NOTHING;

-- Eventos
INSERT INTO tkt.event ("CompanyId", "Name", "Description", "ConfigurationId", "EventDate", "DoorsOpen", "Status", "EventType", "MaxTicketsPerOrder", "IsPublished") VALUES
  (1, 'Festival Electronica 2026', 'El festival de musica electronica mas grande de Venezuela', 1, '2026-04-12 21:00+00', '2026-04-12 18:00+00', 'on_sale', 'concert', 6, true),
  (1, 'Venezuela vs Colombia — Eliminatorias', 'Partido clasificatorio al Mundial 2030', 2, '2026-04-20 20:00+00', '2026-04-20 17:00+00', 'on_sale', 'sports', 4, true),
  (1, 'Maraton Caracas 10K', 'Carrera de calle 10K por las calles de Caracas', 1, '2026-05-01 07:00+00', '2026-05-01 06:00+00', 'on_sale', 'race', 1, true),
  (1, 'Real Madrid vs Barcelona — La Liga', 'El Clasico en el nuevo Bernabeu', 4, '2026-05-15 21:00+00', '2026-05-15 19:00+00', 'on_sale', 'sports', 4, true),
  (1, 'Concierto Sinfonico Nacional', 'Orquesta Sinfonica en el Teresa Carreno', 3, '2026-06-05 20:00+00', '2026-06-05 19:00+00', 'published', 'concert', 8, true),
  (1, 'Tech Summit Venezuela 2026', 'Conferencia de tecnologia y startups', 1, '2026-06-20 09:00+00', '2026-06-20 08:00+00', 'draft', 'general', 2, false),
  (1, 'Dodgers vs Yankees — Serie Mundial', 'Juego 1 de la Serie Mundial', 5, '2026-10-22 20:00+00', '2026-10-22 17:00+00', 'on_sale', 'sports', 4, true)
ON CONFLICT DO NOTHING;

-- Pricing zones
INSERT INTO tkt.pricing_zone ("EventId", "Name", "Color", "Price", "Currency") VALUES
  (1, 'VIP', '#EF4444', 150.00, 'USD'),
  (1, 'Preferencial', '#F59E0B', 80.00, 'USD'),
  (1, 'General', '#10B981', 45.00, 'USD'),
  (2, 'Tribuna', '#3B82F6', 100.00, 'USD'),
  (2, 'General', '#10B981', 35.00, 'USD'),
  (4, 'VIP Bernabeu', '#EF4444', 500.00, 'EUR'),
  (4, 'Grada', '#3B82F6', 120.00, 'EUR'),
  (5, 'Platea', '#8B5CF6', 60.00, 'USD'),
  (5, 'Balcon', '#3B82F6', 35.00, 'USD'),
  (7, 'Field Level', '#EF4444', 350.00, 'USD'),
  (7, 'Reserve', '#F59E0B', 150.00, 'USD'),
  (7, 'Top Deck', '#10B981', 80.00, 'USD')
ON CONFLICT DO NOTHING;

-- Carrera
INSERT INTO tkt.race ("EventId", "Distance", "MaxParticipants", "RegistrationDeadline", "StartTime") VALUES
  (3, '10K', 2000, '2026-04-28 23:59+00', '2026-05-01 07:00+00')
ON CONFLICT DO NOTHING;

INSERT INTO tkt.race_category ("RaceId", "Name", "AgeMin", "AgeMax", "Gender", "Price", "Currency") VALUES
  (1, 'Elite', 18, 40, 'X', 0.00, 'USD'),
  (1, 'General', 18, 65, 'X', 25.00, 'USD'),
  (1, 'Sub-23', 18, 23, 'X', 15.00, 'USD'),
  (1, 'Veteranos', 40, 70, 'X', 20.00, 'USD')
ON CONFLICT DO NOTHING;

-- +goose Down
DELETE FROM tkt.race_category WHERE "RaceId" = 1;
DELETE FROM tkt.race WHERE "EventId" = 3;
DELETE FROM tkt.pricing_zone WHERE "EventId" IN (1,2,4,5,7);
DELETE FROM tkt.event WHERE "CompanyId" = 1;
DELETE FROM tkt.section WHERE "ConfigurationId" = 1;
DELETE FROM tkt.venue_configuration WHERE "VenueId" IN (1,2,3,8,13);
