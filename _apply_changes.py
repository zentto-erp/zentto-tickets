import os, subprocess

base = "d:/DatqBoxWorkspace/zentto-tickets"

# 1. Migration
with open(f"{base}/migrations/postgres/00005_generate_seats_and_inventory.sql", "w", encoding="utf-8") as f:
    f.write("""-- +goose Up
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
""")

# 2. service.ts - add Price/Currency and getEventSeatMap
with open(f"{base}/api/src/modules/events/service.ts", "r", encoding="utf-8") as f:
    svc = f.read()

svc = svc.replace(
    '''st."IsAccessible"
       FROM tkt.event_inventory ei
       JOIN tkt.seat st ON st."SeatId" = ei."SeatId"
       JOIN tkt.row r ON r."RowId" = st."RowId"
       WHERE ei."EventId" = $1 AND ei."SectionId" = $2''',
    '''st."IsAccessible",
         COALESCE(pz."Price", 0) AS "Price",
         COALESCE(pz."Currency", 'USD') AS "Currency"
       FROM tkt.event_inventory ei
       JOIN tkt.seat st ON st."SeatId" = ei."SeatId"
       JOIN tkt.row r ON r."RowId" = st."RowId"
       LEFT JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = ei."SectionId"
       LEFT JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = ei."EventId"
       WHERE ei."EventId" = $1 AND ei."SectionId" = $2'''
)

if "getEventSeatMap" not in svc:
    seatmap_fn = '''

export async function getEventSeatMap(eventId: number) {
  const ev = await query(
    `SELECT e.*, v."Name" AS "VenueName", vc."ConfigurationId"
     FROM tkt.event e
     JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
     JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
     WHERE e."EventId" = $1`,
    [eventId]
  );
  if (!ev.rows.length) throw new Error("event_not_found");
  const event = ev.rows[0];

  const sections = await query(
    `SELECT s.*,
       COALESCE(MIN(pz."Price"), 0) AS "Price",
       COALESCE(MIN(pz."Currency"), 'USD') AS "Currency",
       json_agg(
         json_build_object(
           'RowId', r."RowId", 'Label', r."Label", 'SeatCount', r."SeatCount",
           'seats', (
             SELECT json_agg(
               json_build_object(
                 'SeatId', st."SeatId", 'Number', st."Number",
                 'SeatType', st."SeatType", 'IsAccessible', st."IsAccessible",
                 'Status', COALESCE(ei."Status", 'available')
               ) ORDER BY st."Number"
             )
             FROM tkt.seat st
             LEFT JOIN tkt.event_inventory ei ON ei."SeatId" = st."SeatId" AND ei."EventId" = $1
             WHERE st."RowId" = r."RowId"
           )
         ) ORDER BY r."SortOrder"
       ) FILTER (WHERE r."RowId" IS NOT NULL) AS "Rows"
     FROM tkt.section s
     LEFT JOIN tkt.row r ON r."SectionId" = s."SectionId"
     LEFT JOIN tkt.pricing_zone_section pzs ON pzs."SectionId" = s."SectionId"
     LEFT JOIN tkt.pricing_zone pz ON pz."ZoneId" = pzs."ZoneId" AND pz."EventId" = $1
     WHERE s."ConfigurationId" = $2
     GROUP BY s."SectionId"
     ORDER BY s."SortOrder"`,
    [eventId, event.ConfigurationId]
  );

  return { event, sections: sections.rows };
}
'''
    svc = svc.rstrip() + seatmap_fn

with open(f"{base}/api/src/modules/events/service.ts", "w", encoding="utf-8") as f:
    f.write(svc)

# 3. routes.ts
with open(f"{base}/api/src/modules/events/routes.ts", "r", encoding="utf-8") as f:
    routes = f.read()

if "getEventSeatMap" not in routes:
    route_code = '''

eventRouter.get("/:id/seatmap", async (req: Request, res: Response) => {
  try {
    const data = await svc.getEventSeatMap(Number(req.params.id));
    res.json(data);
  } catch (err: unknown) {
    res.status(500).json({ error: String(err) });
  }
});
'''
    routes = routes.rstrip() + route_code
    with open(f"{base}/api/src/modules/events/routes.ts", "w", encoding="utf-8") as f:
        f.write(routes)

# 4. types/index.ts
with open(f"{base}/frontend/src/types/index.ts", "r", encoding="utf-8") as f:
    types = f.read()
if "Price?: number" not in types:
    types = types.replace(
        "  IsAccessible: boolean;\n}\n\nexport interface SectionAvailability",
        "  IsAccessible: boolean;\n  Price?: number;\n  Currency?: string;\n}\n\nexport interface SectionAvailability"
    )
    with open(f"{base}/frontend/src/types/index.ts", "w", encoding="utf-8") as f:
        f.write(types)

# 5. hooks/useEvents.ts
with open(f"{base}/frontend/src/hooks/useEvents.ts", "r", encoding="utf-8") as f:
    hooks = f.read()
if "useEventSeatMap" not in hooks:
    hook = '''

export function useEventSeatMap(eventId: number) {
  return useQuery({
    queryKey: ["events", eventId, "seatmap"],
    queryFn: () => api.get<{
      event: Event;
      sections: Array<{ SectionId: number; Name: string; Code: string; Price: number; Currency: string }>;
    }>("/v1/events/" + eventId + "/seatmap"),
    enabled: eventId > 0,
  });
}
'''
    hooks = hooks.rstrip() + hook
    with open(f"{base}/frontend/src/hooks/useEvents.ts", "w", encoding="utf-8") as f:
        f.write(hooks)

# 6. Git add + commit
os.chdir(base)
subprocess.run(["git", "add",
    "migrations/postgres/00005_generate_seats_and_inventory.sql",
    "api/src/modules/events/service.ts",
    "api/src/modules/events/routes.ts",
    "frontend/src/types/index.ts",
    "frontend/src/hooks/useEvents.ts",
], check=True)

r = subprocess.run(["git", "commit", "-m",
    "feat: generacion de asientos, inventario y endpoints mejorados\n\n"
    "- Migracion goose 00005: genera asientos para secciones seed VIP/PREF/PALCO,\n"
    "  vincula pricing zones con sections, inicializa inventario evento 1\n"
    "- API: endpoint GET /v1/events/:id/seatmap (secciones+filas+asientos+status)\n"
    "- API: availability incluye Price/Currency por asiento\n"
    "- Frontend: tipo SeatAvailability con Price/Currency\n"
    "- Frontend: hook useEventSeatMap"
], capture_output=True, text=True)
print("COMMIT:", r.returncode, r.stdout[:200], r.stderr[:200])
