import crypto from "crypto";
import { query } from "../../db/pool.js";
import { notify, TEMPLATES } from "../../notifications/notify.js";
import { env } from "../../config/env.js";

/* ── RACES ── */

export async function listRaces(params: { companyId: number; search?: string; page?: number; limit?: number }) {
  const { companyId, search, page = 1, limit = 50 } = params;
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT r.*, e."Name" AS "EventName", e."EventDate", e."Status" AS "EventStatus",
       COUNT(*) OVER() AS "TotalCount",
       (SELECT COUNT(*) FROM tkt.race_registration rr WHERE rr."RaceId" = r."RaceId") AS "RegisteredCount"
     FROM tkt.race r JOIN tkt.event e ON e."EventId" = r."EventId"
     WHERE e."CompanyId" = $1
       AND ($2 = '' OR e."Name" ILIKE '%' || $2 || '%' OR r."Distance" ILIKE '%' || $2 || '%')
     ORDER BY e."EventDate" DESC LIMIT $3 OFFSET $4`,
    [companyId, search ?? "", limit, offset]
  );
  return { rows: result.rows, total: Number(result.rows[0]?.TotalCount ?? 0), page, limit };
}

export async function getRace(raceId: number) {
  const result = await query(
    `SELECT r.*, e."Name" AS "EventName", e."EventDate", e."ImageUrl",
       v."Name" AS "VenueName", v."City",
       (SELECT COUNT(*) FROM tkt.race_registration WHERE "RaceId" = r."RaceId") AS "RegisteredCount"
     FROM tkt.race r JOIN tkt.event e ON e."EventId" = r."EventId"
     LEFT JOIN tkt.venue_configuration vc ON vc."ConfigurationId" = e."ConfigurationId"
     LEFT JOIN tkt.venue v ON v."VenueId" = vc."VenueId"
     WHERE r."RaceId" = $1`,
    [raceId]
  );
  return result.rows[0] ?? null;
}

export async function upsertRace(data: Record<string, unknown>) {
  const { raceId, ...f } = data;
  if (raceId) {
    const result = await query(`UPDATE tkt.race SET "Distance" = $1, "MaxParticipants" = $2, "RegistrationDeadline" = $3, "StartTime" = $4, "RouteMapUrl" = $5 WHERE "RaceId" = $6 RETURNING *`, [f.distance, f.maxParticipants, f.registrationDeadline, f.startTime, f.routeMapUrl, raceId]);
    return { success: true, race: result.rows[0] };
  }
  const result = await query(`INSERT INTO tkt.race ("EventId", "Distance", "MaxParticipants", "RegistrationDeadline", "StartTime", "RouteMapUrl") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [f.eventId, f.distance, f.maxParticipants, f.registrationDeadline, f.startTime, f.routeMapUrl]);
  return { success: true, race: result.rows[0] };
}

/* ── CATEGORIES ── */

export async function listCategories(raceId: number) {
  const result = await query(`SELECT * FROM tkt.race_category WHERE "RaceId" = $1 ORDER BY "AgeMin"`, [raceId]);
  return result.rows;
}

export async function upsertCategory(data: Record<string, unknown>) {
  const { categoryId, raceId, ...f } = data;
  if (categoryId) {
    const result = await query(`UPDATE tkt.race_category SET "Name" = $1, "AgeMin" = $2, "AgeMax" = $3, "Gender" = $4, "Price" = $5, "Currency" = $6 WHERE "CategoryId" = $7 RETURNING *`, [f.name, f.ageMin, f.ageMax, f.gender, f.price, f.currency ?? "USD", categoryId]);
    return { success: true, category: result.rows[0] };
  }
  const result = await query(`INSERT INTO tkt.race_category ("RaceId", "Name", "AgeMin", "AgeMax", "Gender", "Price", "Currency") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [raceId, f.name, f.ageMin, f.ageMax, f.gender ?? "X", f.price, f.currency ?? "USD"]);
  return { success: true, category: result.rows[0] };
}

/* ── REGISTRATIONS ── */

export async function listRegistrations(params: { raceId: number; status?: string; page?: number; limit?: number }) {
  const { raceId, status, page = 1, limit = 100 } = params;
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT rr.*, rc."Name" AS "CategoryName", COUNT(*) OVER() AS "TotalCount"
     FROM tkt.race_registration rr LEFT JOIN tkt.race_category rc ON rc."CategoryId" = rr."CategoryId"
     WHERE rr."RaceId" = $1 AND ($2 = '' OR rr."Status" = $2)
     ORDER BY rr."BibNumber"::INT NULLS LAST LIMIT $3 OFFSET $4`,
    [raceId, status ?? "", limit, offset]
  );
  return { rows: result.rows, total: Number(result.rows[0]?.TotalCount ?? 0), page, limit };
}

export async function registerParticipant(data: Record<string, unknown>) {
  const { raceId, userId, ...f } = data;
  const raceCheck = await query(`SELECT r."MaxParticipants", (SELECT COUNT(*) FROM tkt.race_registration WHERE "RaceId" = $1) AS "CurrentCount" FROM tkt.race r WHERE r."RaceId" = $1`, [raceId]);
  if (!raceCheck.rows.length) throw new Error("race_not_found");
  if (Number(raceCheck.rows[0].CurrentCount) >= Number(raceCheck.rows[0].MaxParticipants)) throw new Error("race_full");

  const bibResult = await query(`SELECT COALESCE(MAX("BibNumber"::INT), 0) + 1 AS "NextBib" FROM tkt.race_registration WHERE "RaceId" = $1`, [raceId]);
  const bibNumber = String(bibResult.rows[0].NextBib).padStart(4, "0");
  const barcode = generateRaceBarcode(Number(raceId), bibNumber);

  const result = await query(
    `INSERT INTO tkt.race_registration ("RaceId", "UserId", "BibNumber", "CategoryId", "FullName", "IdDocument", "DateOfBirth", "Gender", "EmergencyContact", "EmergencyPhone", "TShirtSize", "Status", "Barcode", "Email")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'registered',$12,$13) RETURNING *`,
    [raceId, userId, bibNumber, f.categoryId, f.fullName, f.idDocument, f.dateOfBirth, f.gender, f.emergencyContact, f.emergencyPhone, f.tShirtSize ?? "M", barcode, f.email ?? null]
  );
  const reg = result.rows[0];

  if (env.notifyApiKey && f.fullName) {
    const ri = await query(`SELECT r."Distance", r."StartTime", e."Name" AS "EventName", e."EventDate" FROM tkt.race r JOIN tkt.event e ON e."EventId" = r."EventId" WHERE r."RaceId" = $1`, [raceId]);
    const cat = await query(`SELECT "Name" FROM tkt.race_category WHERE "CategoryId" = $1`, [f.categoryId]);
    const r = ri.rows[0];
    notify.email.send({ to: f.email ? String(f.email) : `${userId}@zentto.net`, templateId: TEMPLATES.RACE_REGISTRATION, variables: { fullName: String(f.fullName), eventName: String(r?.EventName ?? ""), distance: String(r?.Distance ?? ""), bibNumber, categoryName: String(cat.rows[0]?.Name ?? ""), eventDate: r?.EventDate ? new Date(String(r.EventDate)).toLocaleDateString("es") : "", startTime: r?.StartTime ? new Date(String(r.StartTime)).toLocaleTimeString("es") : "" } }).catch(() => {});
  }
  return { success: true, registration: reg };
}

export async function updateRegistration(registrationId: number, data: Record<string, unknown>) {
  const sets: string[] = []; const values: unknown[] = []; let idx = 1;
  for (const key of ["BibNumber", "Status", "FinishTime", "ChipTime", "Position", "CategoryPosition"]) {
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    if (data[camel] !== undefined) { sets.push(`"${key}" = $${idx}`); values.push(data[camel]); idx++; }
  }
  if (sets.length === 0) return { success: false, message: "no_fields" };
  values.push(registrationId);
  const result = await query(`UPDATE tkt.race_registration SET ${sets.join(", ")} WHERE "RegistrationId" = $${idx} RETURNING *`, values);
  return { success: true, registration: result.rows[0] };
}

/* ── RESULTS ── */

export async function getResults(raceId: number, categoryId?: number) {
  const result = await query(`SELECT rr.*, rc."Name" AS "CategoryName" FROM tkt.race_registration rr LEFT JOIN tkt.race_category rc ON rc."CategoryId" = rr."CategoryId" WHERE rr."RaceId" = $1 AND rr."Status" = 'finished' AND ($2::INT IS NULL OR rr."CategoryId" = $2) ORDER BY rr."Position" NULLS LAST, rr."ChipTime" NULLS LAST`, [raceId, categoryId ?? null]);
  return result.rows;
}

/* ── FINISH ── */

export async function recordFinish(registrationId: number, finishTime: string, chipTime?: string) {
  const reg = await query(`SELECT "RaceId", "CategoryId" FROM tkt.race_registration WHERE "RegistrationId" = $1`, [registrationId]);
  if (!reg.rows.length) throw new Error("registration_not_found");
  const { RaceId, CategoryId } = reg.rows[0];
  const position = Number((await query(`SELECT COUNT(*) + 1 AS "Position" FROM tkt.race_registration WHERE "RaceId" = $1 AND "Status" = 'finished'`, [RaceId])).rows[0].Position);
  const categoryPosition = Number((await query(`SELECT COUNT(*) + 1 AS "CatPosition" FROM tkt.race_registration WHERE "RaceId" = $1 AND "CategoryId" = $2 AND "Status" = 'finished'`, [RaceId, CategoryId])).rows[0].CatPosition);
  const result = await query(`UPDATE tkt.race_registration SET "Status" = 'finished', "FinishTime" = $1, "ChipTime" = $2, "Position" = $3, "CategoryPosition" = $4 WHERE "RegistrationId" = $5 RETURNING *`, [finishTime, chipTime ?? finishTime, position, categoryPosition, registrationId]);
  return { success: true, registration: result.rows[0] };
}

/* ── LEADERBOARD ── */

export async function getLeaderboard(raceId: number, categoryId?: number) {
  const result = await query(
    `SELECT rr."RegistrationId", rr."BibNumber", rr."FullName", rr."Gender", rr."Status", rr."FinishTime", rr."ChipTime", rr."Position", rr."CategoryPosition", rc."Name" AS "CategoryName", rc."CategoryId"
     FROM tkt.race_registration rr LEFT JOIN tkt.race_category rc ON rc."CategoryId" = rr."CategoryId"
     WHERE rr."RaceId" = $1 AND ($2::INT IS NULL OR rr."CategoryId" = $2) AND rr."Status" IN ('finished','registered','confirmed')
     ORDER BY CASE WHEN rr."Status" = 'finished' THEN 0 ELSE 1 END, rr."Position" NULLS LAST, rr."ChipTime" NULLS LAST, rr."BibNumber"`,
    [raceId, categoryId ?? null]
  );
  const leader = result.rows.find((r) => r.Position === 1);
  return result.rows.map((r) => ({
    registrationId: r.RegistrationId, bibNumber: r.BibNumber, fullName: r.FullName, gender: r.Gender,
    status: r.Status, finishTime: r.FinishTime, chipTime: r.ChipTime, position: r.Position,
    categoryPosition: r.CategoryPosition, categoryName: r.CategoryName, categoryId: r.CategoryId,
    gap: r.ChipTime && leader?.ChipTime ? calculateGap(leader.ChipTime, r.ChipTime) : null,
  }));
}

function calculateGap(leaderTime: string, runnerTime: string): string {
  const toMs = (t: string) => { const p = t.split(":"); const s = (p[2] || "0").split("."); return (parseInt(p[0])||0)*3600000 + (parseInt(p[1])||0)*60000 + (parseInt(s[0])||0)*1000 + parseInt((s[1]||"0").padEnd(3,"0").slice(0,3))||0; };
  const diff = toMs(runnerTime) - toMs(leaderTime);
  if (diff <= 0) return "";
  const m = Math.floor(diff / 60000); const s = Math.floor((diff % 60000) / 1000);
  return m > 0 ? `+${m}:${String(s).padStart(2,"0")}` : `+${s}s`;
}

/* ── SCAN QR ── */

export async function scanRegistrationQR(barcode: string) {
  if (!barcode) throw new Error("missing_barcode");
  const raw = String(barcode).replace(/^ZR-/, "");
  const parts = raw.split("|");
  if (parts.length !== 4) throw new Error("invalid_format");
  const expected = crypto.createHmac("sha256", env.jwt.secret).update(parts.slice(0,3).join("|")).digest("hex").slice(0, 16);
  if (parts[3] !== expected) throw new Error("tampered_barcode");
  const reg = await query(`SELECT rr.*, rc."Name" AS "CategoryName", r."Distance", e."Name" AS "EventName", e."EventDate" FROM tkt.race_registration rr LEFT JOIN tkt.race_category rc ON rc."CategoryId" = rr."CategoryId" JOIN tkt.race r ON r."RaceId" = rr."RaceId" JOIN tkt.event e ON e."EventId" = r."EventId" WHERE rr."Barcode" = $1`, [barcode]);
  if (!reg.rows.length) throw new Error("registration_not_found");
  const registration = reg.rows[0];
  if (registration.Status === "registered") {
    await query(`UPDATE tkt.race_registration SET "Status" = 'confirmed' WHERE "RegistrationId" = $1`, [registration.RegistrationId]);
    return { valid: true, action: "kit_pickup", registration: { ...registration, Status: "confirmed" } };
  }
  return { valid: true, action: registration.Status === "confirmed" ? "already_confirmed" : "info", registration };
}

/* ── PAYMENT ── */

export async function confirmRacePayment(registrationId: number, paymentRef: string) {
  const result = await query(`UPDATE tkt.race_registration SET "PaymentStatus" = 'paid', "PaymentRef" = $1, "PaidAt" = NOW() WHERE "RegistrationId" = $2 RETURNING *`, [paymentRef, registrationId]);
  if (!result.rows.length) throw new Error("registration_not_found");
  return { success: true, registration: result.rows[0] };
}

/* ── QR GENERATOR ── */

function generateRaceBarcode(raceId: number, bibNumber: string): string {
  const payload = `${raceId}|${bibNumber}|${Date.now()}`;
  return `ZR-${payload}|${crypto.createHmac("sha256", env.jwt.secret).update(payload).digest("hex").slice(0, 16)}`;
}
