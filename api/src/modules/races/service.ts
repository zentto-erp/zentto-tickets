import { callSp } from "../../db/query.js";
import { notify, TEMPLATES } from "../../notifications/notify.js";
import { env } from "../../config/env.js";

/* ── RACES ── */

export async function listRaces(params: { companyId: number; search?: string; page?: number; limit?: number }) {
  const { companyId, search, page = 1, limit = 50 } = params;

  const rows = await callSp("usp_tkt_race_list", {
    CompanyId: companyId,
    Search: search ?? "",
    Page: page,
    Limit: limit,
  });

  const total = Number((rows[0] as Record<string, unknown>)?.TotalCount ?? 0);
  return { rows, total, page, limit };
}

export async function getRace(raceId: number) {
  const rows = await callSp("usp_tkt_race_get", { RaceId: raceId });
  return rows[0] ?? null;
}

export async function upsertRace(data: Record<string, unknown>) {
  const rows = await callSp("usp_tkt_race_upsert", {
    RaceId: data.raceId ?? null,
    EventId: data.eventId ?? null,
    Distance: data.distance ?? null,
    MaxParticipants: data.maxParticipants ?? 500,
    RegistrationDeadline: data.registrationDeadline ?? null,
    StartTime: data.startTime ?? null,
    RouteMapUrl: data.routeMapUrl ?? null,
  });

  const result = rows[0] as Record<string, unknown>;
  const race = await getRace(Number(result.RaceId));
  return { success: true, race };
}

/* ── CATEGORIES ── */

export async function listCategories(raceId: number) {
  return callSp("usp_tkt_race_category_list", { RaceId: raceId });
}

export async function upsertCategory(data: Record<string, unknown>) {
  const rows = await callSp("usp_tkt_race_category_upsert", {
    CategoryId: data.categoryId ?? null,
    RaceId: data.raceId ?? null,
    Name: data.name ?? null,
    AgeMin: data.ageMin ?? 0,
    AgeMax: data.ageMax ?? 99,
    Gender: data.gender ?? "X",
    Price: data.price ?? 0,
    Currency: data.currency ?? "USD",
  });

  const result = rows[0] as Record<string, unknown>;
  return { success: true, category: result };
}

/* ── REGISTRATIONS ── */

export async function listRegistrations(params: { raceId: number; status?: string; page?: number; limit?: number }) {
  const { raceId, status, page = 1, limit = 100 } = params;

  const rows = await callSp("usp_tkt_race_registration_list", {
    RaceId: raceId,
    Status: status ?? "",
    Page: page,
    Limit: limit,
  });

  const total = Number((rows[0] as Record<string, unknown>)?.TotalCount ?? 0);
  return { rows, total, page, limit };
}

export async function registerParticipant(data: Record<string, unknown>) {
  const { raceId, userId, ...f } = data;

  const rows = await callSp("usp_tkt_race_register", {
    RaceId: raceId as number,
    UserId: userId as string,
    CategoryId: f.categoryId ?? null,
    FullName: f.fullName ?? null,
    IdDocument: f.idDocument ?? null,
    DateOfBirth: f.dateOfBirth ?? null,
    Gender: f.gender ?? "X",
    EmergencyContact: f.emergencyContact ?? null,
    EmergencyPhone: f.emergencyPhone ?? null,
    TShirtSize: f.tShirtSize ?? "M",
  });

  const result = rows[0] as Record<string, unknown>;
  if (!result?.ok) throw new Error(String(result?.mensaje ?? "registration_failed"));

  // Send registration email (fire and forget)
  if (env.notifyApiKey && f.fullName) {
    sendRegistrationEmail(
      raceId as number,
      f,
      userId as string,
      String(result.BibNumber)
    ).catch(() => {});
  }

  return { success: true, registration: result };
}

async function sendRegistrationEmail(
  raceId: number,
  data: Record<string, unknown>,
  userId: string,
  bibNumber: string
) {
  const races = await callSp("usp_tkt_race_get", { RaceId: raceId });
  const race = races[0] as Record<string, unknown> | undefined;
  if (!race) return;

  const cats = await callSp("usp_tkt_race_category_list", { RaceId: raceId });
  const cat = (cats as Record<string, unknown>[]).find(
    (c) => Number(c.CategoryId) === Number(data.categoryId)
  );

  notify.email.send({
    to: String(data.fullName).includes("@") ? String(data.fullName) : `${userId}@zentto.net`,
    templateId: TEMPLATES.RACE_REGISTRATION,
    variables: {
      fullName: String(data.fullName),
      eventName: String(race.EventName ?? ""),
      distance: String(race.Distance ?? ""),
      bibNumber,
      categoryName: String(cat?.Name ?? ""),
      eventDate: race.EventDate ? new Date(String(race.EventDate)).toLocaleDateString("es") : "",
      startTime: race.StartTime ? new Date(String(race.StartTime)).toLocaleTimeString("es") : "",
    },
  }).catch(() => {});
}

export async function updateRegistration(registrationId: number, data: Record<string, unknown>) {
  const rows = await callSp("usp_tkt_race_update_registration", {
    RegistrationId: registrationId,
    BibNumber: data.bibNumber ?? null,
    Status: data.status ?? null,
    FinishTime: data.finishTime ?? null,
    ChipTime: data.chipTime ?? null,
    Position: data.position ?? null,
    CategoryPosition: data.categoryPosition ?? null,
  });

  const result = rows[0] as Record<string, unknown>;
  if (!result?.ok) return { success: false, message: String(result?.mensaje ?? "not_found") };
  return { success: true, registration: result };
}

/* ── RESULTS ── */

export async function getResults(raceId: number, categoryId?: number) {
  return callSp("usp_tkt_race_get_results", {
    RaceId: raceId,
    CategoryId: categoryId ?? null,
  });
}

/* ── FINISH ── */

export async function recordFinish(registrationId: number, finishTime: string, chipTime?: string) {
  const rows = await callSp("usp_tkt_race_finish", {
    RegistrationId: registrationId,
    FinishTime: finishTime,
    ChipTime: chipTime ?? null,
  });

  const result = rows[0] as Record<string, unknown>;
  if (!result?.ok) throw new Error(String(result?.mensaje ?? "registration_not_found"));

  return {
    success: true,
    registration: {
      Position: result.Position,
      CategoryPosition: result.CategoryPosition,
    },
  };
}
