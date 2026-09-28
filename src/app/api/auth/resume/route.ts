import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API = process.env.API_URL!;
// Mismo motivo que en google/callback: detrás del proxy de Railway req.url
// resuelve al origen interno del contenedor.
const APP_URL = process.env.NEXT_PUBLIC_WIDGET_BASE_URL!;

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// El proxy llega acá cuando hay session_token pero no workspace_id (la cookie
// de workspace venció o se perdió). En vez de asumir "usuario sin workspace",
// se le pregunta al backend: si tiene alguno, se repone la cookie y sigue al
// dashboard; solo si de verdad no tiene ninguno va a /create-workspace.
export async function GET() {
  const jar = await cookies();
  const token = jar.get("session_token")?.value;

  if (!token) return NextResponse.redirect(new URL("/login", APP_URL));

  try {
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { "x-access-token": token },
      cache: "no-store",
    });

    if (!res.ok) {
      jar.delete("session_token");
      jar.delete("workspace_id");
      return NextResponse.redirect(new URL("/login", APP_URL));
    }

    const data = await res.json();
    const workspaceId = data.user?.user_workspace?.[0]?.workspace_id;

    if (!workspaceId) return NextResponse.redirect(new URL("/create-workspace", APP_URL));

    jar.set("workspace_id", String(workspaceId), { ...COOKIE_BASE, maxAge: 90 * 24 * 60 * 60 });
    return NextResponse.redirect(new URL("/chat", APP_URL));
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth_failed", APP_URL));
  }
}
