import pg from "pg";
import { env } from "../config/env.js";

const pool = new pg.Pool({
  host: env.pg.host,
  port: env.pg.port,
  database: env.pg.database,
  user: env.pg.user,
  password: env.pg.password,
  max: 20,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("[DB] Pool error:", err.message);
});

export { pool };

/**
 * Ejecuta query parametrizado.
 */
export async function query<T extends pg.QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Ejecuta stored procedure / function con params nombrados.
 */
export async function callFn<T extends pg.QueryResultRow = Record<string, unknown>>(
  fnName: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const keys = Object.keys(params);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
  const namedArgs = keys.map((k, i) => `"${k}" => $${i + 1}`).join(", ");
  const values = keys.map((k) => params[k]);

  const sql = keys.length
    ? `SELECT * FROM ${fnName}(${namedArgs})`
    : `SELECT * FROM ${fnName}()`;

  const result = await pool.query<T>(sql, values);
  return result.rows;
}
