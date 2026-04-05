-- +goose Up
DO $$ DECLARE v_sid INT; v_rid INT; r INT; s INT; BEGIN
  SELECT "SectionId" INTO v_sid FROM tkt.section WHERE "Code"='VIP-A' AND "ConfigurationId"=1;
  IF v_sid IS NOT NULL THEN FOR r IN 0..9 LOOP
    INSERT INTO tkt.row ("SectionId","Label","SeatCount","SortOrder") VALUES (v_sid,chr(65+r),20,r+1) RETURNING "RowId" INTO v_rid;
    FOR s IN 1..20 LOOP INSERT INTO tkt.seat ("RowId","Number","SeatType","IsAccessible") VALUES (v_rid,s,'seat',false); END LOOP;
  END LOOP; END IF; END $$;

DO $$ DECLARE v_sid INT; v_rid INT; r INT; s INT; BEGIN
  SELECT "SectionId" INTO v_sid FROM tkt.section WHERE "Code"='PREF-E' AND "ConfigurationId"=1;
  IF v_sid IS NOT NULL THEN FOR r IN 0..14 LOOP
    INSERT INTO tkt.row ("SectionId","Label","SeatCount","SortOrder") VALUES (v_sid,chr(65+r),30,r+1) RETURNING "RowId" INTO v_rid;
    FOR s IN 1..30 LOOP INSERT INTO tkt.seat ("RowId","Number","SeatType","IsAccessible") VALUES (v_rid,s,'seat',false); END LOOP;
  END LOOP; END IF; END $$;

DO $$ DECLARE v_sid INT; v_rid INT; r INT; s INT; BEGIN
  SELECT "SectionId" INTO v_sid FROM tkt.section WHERE "Code"='PREF-O' AND "ConfigurationId"=1;
  IF v_sid IS NOT NULL THEN FOR r IN 0..14 LOOP
    INSERT INTO tkt.row ("SectionId","Label","SeatCount","SortOrder") VALUES (v_sid,chr(65+r),30,r+1) RETURNING "RowId" INTO v_rid;
    FOR s IN 1..30 LOOP INSERT INTO tkt.seat ("RowId","Number","SeatType","IsAccessible") VALUES (v_rid,s,'seat',false); END LOOP;
  END LOOP; END IF; END $$;

DO $$ DECLARE v_sid INT; v_rid INT; r INT; s INT; BEGIN
  SELECT "SectionId" INTO v_sid FROM tkt.section WHERE "Code"='PALCO' AND "ConfigurationId"=1;
  IF v_sid IS NOT NULL THEN FOR r IN 0..3 LOOP
    INSERT INTO tkt.row ("SectionId","Label","SeatCount","SortOrder") VALUES (v_sid,chr(65+r),8,r+1) RETURNING "RowId" INTO v_rid;
    FOR s IN 1..8 LOOP INSERT INTO tkt.seat ("RowId","Number","SeatType","IsAccessible") VALUES (v_rid,s,'seat',false); END LOOP;
  END LOOP; END IF; END $$;

INSERT INTO tkt.pricing_zone_section ("ZoneId","SectionId") SELECT pz."ZoneId",s."SectionId" FROM tkt.pricing_zone pz,tkt.section s WHERE pz."EventId"=1 AND pz."Name"='VIP' AND s."ConfigurationId"=1 AND s."Code" IN ('VIP-A','PALCO') ON CONFLICT DO NOTHING;
INSERT INTO tkt.pricing_zone_section ("ZoneId","SectionId") SELECT pz."ZoneId",s."SectionId" FROM tkt.pricing_zone pz,tkt.section s WHERE pz."EventId"=1 AND pz."Name"='Preferencial' AND s."ConfigurationId"=1 AND s."Code" IN ('PREF-E','PREF-O') ON CONFLICT DO NOTHING;
INSERT INTO tkt.pricing_zone_section ("ZoneId","SectionId") SELECT pz."ZoneId",s."SectionId" FROM tkt.pricing_zone pz,tkt.section s WHERE pz."EventId"=1 AND pz."Name"='General' AND s."ConfigurationId"=1 AND s."Code" IN ('GEN-N','GEN-S') ON CONFLICT DO NOTHING;

INSERT INTO tkt.event_inventory ("EventId","SeatId","SectionId","Status") SELECT 1,st."SeatId",s."SectionId",'available' FROM tkt.section s JOIN tkt.row r ON r."SectionId"=s."SectionId" JOIN tkt.seat st ON st."RowId"=r."RowId" WHERE s."ConfigurationId"=1 AND NOT s."IsGeneralAdmission" ON CONFLICT ("EventId","SeatId") DO NOTHING;
INSERT INTO tkt.event_ga_inventory ("EventId","SectionId","TotalCapacity","SoldCount") SELECT 1,s."SectionId",s."GaCapacity",0 FROM tkt.section s WHERE s."ConfigurationId"=1 AND s."IsGeneralAdmission"=true ON CONFLICT ("EventId","SectionId") DO NOTHING;

UPDATE tkt.event_inventory SET "Status"='sold' WHERE "EventId"=1 AND "SeatId" IN (SELECT "SeatId" FROM tkt.event_inventory WHERE "EventId"=1 AND "Status"='available' ORDER BY random() LIMIT 50);
UPDATE tkt.event_inventory SET "Status"='held',"HeldUntil"=NOW()+INTERVAL '30 minutes' WHERE "EventId"=1 AND "SeatId" IN (SELECT "SeatId" FROM tkt.event_inventory WHERE "EventId"=1 AND "Status"='available' ORDER BY random() LIMIT 20);

-- +goose Down
DELETE FROM tkt.event_ga_inventory WHERE "EventId"=1;
DELETE FROM tkt.event_inventory WHERE "EventId"=1;
DELETE FROM tkt.pricing_zone_section WHERE "ZoneId" IN (SELECT "ZoneId" FROM tkt.pricing_zone WHERE "EventId"=1);
DELETE FROM tkt.seat WHERE "RowId" IN (SELECT r."RowId" FROM tkt.row r JOIN tkt.section s ON s."SectionId"=r."SectionId" WHERE s."ConfigurationId"=1);
DELETE FROM tkt.row WHERE "SectionId" IN (SELECT "SectionId" FROM tkt.section WHERE "ConfigurationId"=1);
