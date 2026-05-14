import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_URL!;

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
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.url));
  }

  try {
    const res = await fetch(`${API}/api/auth/google/user`, {
      headers: { "x-access-token": token },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
    }

    const data = await res.json();

    if (!data.success || !data.user) {
      return NextResponse.redirect(new URL("/login?error=invalid_user", req.url));
    }

    const jar = await cookies();
    jar.set("session_token", token, { ...COOKIE_BASE, maxAge: MAX_AGE });

    const workspaceId =
      data.user?.user_workspace?.[0]?.workspace_id ??
      data.defaultWorkspace?.id ??
      null;

    if (workspaceId && !isNewUser) {
      jar.set("workspace_id", String(workspaceId), { ...COOKIE_BASE, maxAge: MAX_AGE });
      return NextResponse.redirect(new URL("/chat?welcome=google", req.url));
    }

    return NextResponse.redirect(new URL("/create-workspace", req.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
  }
}
