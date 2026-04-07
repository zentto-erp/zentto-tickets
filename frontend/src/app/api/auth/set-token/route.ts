import { NextResponse } from "next/server";
import { auth } from "@/app/auth";

/**
 * Cookie con prefijo __Secure- para hardening:
 *   - Solo el browser la setea/envia sobre HTTPS
 *   - Bloquea cookie tossing desde HTTP/subdominios no seguros
 *   - Compatible con Domain attribute (a diferencia de __Host- que lo prohibe)
 *
 * Mantenemos el nombre legacy en el middleware del API para sesiones
 * existentes durante la transicion. Despues de unas semanas se elimina.
 */
const COOKIE_NAME = "__Secure-zentto_token";

/**
 * POST /api/auth/set-token — setea JWT como cookie HttpOnly Secure
 * DELETE /api/auth/set-token — limpia ambas cookies (legacy + nueva) en logout
 */
export async function POST() {
  const session = (await auth()) as Record<string, unknown> | null;
  const token =
    ((session as Record<string, unknown> | null)?._accessToken as string | undefined) ??
    ((session as Record<string, unknown> | null)?.accessToken as string | undefined);
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, String(token), {
    httpOnly: true,
    secure: true, // siempre HTTPS — todos los entornos pasan por Cloudflare
    sameSite: "lax",
    domain: ".zentto.net",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  for (const name of [COOKIE_NAME, "zentto_token"]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      domain: ".zentto.net",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
