/**
 * query.ts — Capa de abstracción BD para zentto-tickets
 *
 * Adaptado del ERP principal (zentto-web). Solo PostgreSQL.
 * API: callSp / callSpOut con named args y normalización PascalCase.
 */

import { pool } from "./pool.js";

// ── Utilidades de conversión de nombres ───────────────────────────────────────

/**
 * PascalCase → p_snake_case
 * CompanyId   → p_company_id
 * EventDate   → p_event_date
 */
function toSnakeParam(key: string): string {
  const snake = key
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase()
    .replace(/^_/, "");
  return `p_${snake}`;
}

/**
 * p_snake_case → PascalCase
 * p_company_id → CompanyId
 */
function toPascalKey(col: string): string {
  const stripped = col.startsWith("p_") ? col.slice(2) : col;
  return stripped
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

/**
 * Normaliza una fila PG: convierte snake_case / p_snake → PascalCase.
 * Columnas que ya tienen mayúsculas (PascalCase con comillas dobles) se dejan intactas.
 */
function normalizePgRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const needsNormalize =
      k.startsWith("p_") ||
      (k === k.toLowerCase() && k.includes("_"));
    out[needsNormalize ? toPascalKey(k) : k] = v;
  }
  return out;
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Ejecuta una función PL/pgSQL y retorna el recordset.
 * Uso: const rows = await callSp("usp_tkt_venue_list", { CompanyId: 1, Search: "" });
 */
export async function callSp<T = Record<string, unknown>>(
  spName: string,
  inputs?: Record<string, unknown>
): Promise<T[]> {
  const entries = inputs
    ? Object.entries(inputs).filter(([, v]) => v !== undefined)
    : [];

  const namedArgs = entries
    .map(([key, _], i) => `${toSnakeParam(key)} => $${i + 1}`)
    .join(", ");
  const values = entries.map(([, v]) => v);

  const sql = `SELECT * FROM ${spName}(${namedArgs})`;
  const result = await pool.query(sql, values);
  return result.rows.map(normalizePgRow) as T[];
}

/**
 * Ejecuta una función PL/pgSQL con parámetros OUTPUT.
 * El primer row del resultado se usa como output record.
 */
export async function callSpOut<T = Record<string, unknown>>(
  spName: string,
  inputs?: Record<string, unknown>,
  outputs?: Record<string, unknown>
): Promise<{ rows: T[]; output: Record<string, unknown>; rowsAffected: number }> {
  const entries = inputs
    ? Object.entries(inputs).filter(([, v]) => v !== undefined)
    : [];

  const namedArgs = entries
    .map(([key, _], i) => `${toSnakeParam(key)} => $${i + 1}`)
    .join(", ");
  const values = entries.map(([, v]) => v);

  const sql = `SELECT * FROM ${spName}(${namedArgs})`;
  const result = await pool.query(sql, values);
  const firstRow = result.rows[0] ?? {};
  const normalizedRow = normalizePgRow(firstRow as Record<string, unknown>);

  const outputRecord: Record<string, unknown> = {};
  if (outputs) {
    for (const key of Object.keys(outputs)) {
      outputRecord[key] = normalizedRow[key] ?? firstRow[toSnakeParam(key)] ?? null;
    }
  }

  const rows = result.rows.map(normalizePgRow) as T[];

  return {
    rows,
    output: outputRecord,
    rowsAffected: result.rowCount ?? 0,
  };
}

export { toSnakeParam, toPascalKey, normalizePgRow };
