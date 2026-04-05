import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";

/**
 * POST /api/auth/set-token — Cookie proxy: setea JWT como cookie HttpOnly
 * DELETE /api/auth/set-token — Limpia cookie (logout)
 */
export async function POST(req: NextRequest) {
  const session = await auth() as Record<string, unknown> | null;
  const token = (session as any)?._accessToken || (session as any)?.accessToken;
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  const isProduction = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });
  response.cookies.set("zentto_token", String(token), {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: isProduction ? ".zentto.net" : undefined,
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}

export async function DELETE() {
  const isProduction = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });
  response.cookies.set("zentto_token", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: isProduction ? ".zentto.net" : undefined,
    path: "/",
    maxAge: 0,
  });
  return response;
}
