import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_URL!;
// Detrás del proxy de Railway, req.url resuelve al origen interno del contenedor
// (localhost:PORT), no al dominio público — por eso las redirects usan esta base
// en vez de req.url.
const APP_URL = process.env.NEXT_PUBLIC_WIDGET_BASE_URL!;

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const MAX_AGE = 90 * 24 * 60 * 60; // Google auth siempre "recuérdame" — 90 días

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");
  const isNewUser = searchParams.get("newUser") === "true";

  if (errorParam || !token) {
    const msg = searchParams.get("message") ?? "google_auth_failed";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, APP_URL));
  }

  try {
    const res = await fetch(`${API}/api/auth/google/user`, {
      headers: { "x-access-token": token },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/login?error=auth_failed", APP_URL));
    }

    const data = await res.json();

    if (!data.success || !data.user) {
      return NextResponse.redirect(new URL("/login?error=invalid_user", APP_URL));
    }

    const jar = await cookies();
    jar.set("session_token", token, { ...COOKIE_BASE, maxAge: MAX_AGE });

    const workspaceId =
      data.user?.user_workspace?.[0]?.workspace_id ??
      data.defaultWorkspace?.id ??
      null;

    if (workspaceId && !isNewUser) {
      jar.set("workspace_id", String(workspaceId), { ...COOKIE_BASE, maxAge: MAX_AGE });
      return NextResponse.redirect(new URL("/chat?welcome=google", APP_URL));
    }

    return NextResponse.redirect(new URL("/create-workspace", APP_URL));
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth_failed", APP_URL));
  }
}
