import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_URL!;

const SESSION_ENDPOINTS = new Set([
  "auth/login",
  "auth/verify-email",
  "auth/accept-invite-user-to-workspace",
  "auth/accept-invite-link",
  "auth/join-by-invite-link",
]);

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  const jar = await cookies();

  const token = jar.get("session_token")?.value;
  const workspaceId = jar.get("workspace_id")?.value;

  const target = new URL(`${API}/api/${endpoint}`);
  req.nextUrl.searchParams.forEach((v, k) => target.searchParams.append(k, v));

  let bodyText: string | undefined;
  let bodyBlob: Blob | undefined;

  const ct = req.headers.get("content-type") ?? "";
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (ct.includes("application/json")) {
      bodyText = await req.text();
    } else {
      bodyBlob = await req.blob();
    }
  }

  const headers = new Headers();
  headers.set("content-type", ct || "application/json");
  if (token) headers.set("x-access-token", token);
  if (workspaceId) headers.set("workspace-id", workspaceId);
  const ua = req.headers.get("user-agent");
  if (ua) headers.set("user-agent", ua);

  let backendRes: Response;
  try {
    backendRes = await fetch(target, {
      method: req.method,
      headers,
      body: bodyText ?? bodyBlob,
    });
  } catch (err) {
    console.error(`[proxy] Network error reaching backend:`, err);
    return NextResponse.json(
      { success: false, message: "No se pudo conectar al servidor" },
      { status: 503 }
    );
  }

  let responseData: Record<string, unknown>;
  try {
    responseData = await backendRes.json();
  } catch {
    console.error(`[proxy] Backend returned non-JSON (status ${backendRes.status})`);
    return NextResponse.json(
      { success: false, message: "Respuesta inválida del servidor" },
      { status: 502 }
    );
  }

  if (SESSION_ENDPOINTS.has(endpoint) && responseData.success) {
    const sessionToken = (responseData.token ?? responseData.newToken) as string | undefined;

    if (sessionToken) {
      const rememberMe = bodyText ? (JSON.parse(bodyText).rememberMe ?? false) : false;
      const maxAge = rememberMe ? 90 * 24 * 60 * 60 : 30 * 24 * 60 * 60;

      jar.set("session_token", sessionToken, { ...COOKIE_BASE, maxAge });

      // El workspace explícito en la respuesta (join-by-invite-link, accept-invite-*) es siempre
      // el workspace correcto al que se acaba de unir — tiene prioridad sobre el primer
      // user_workspace del usuario, que puede ser cualquier otro workspace previo suyo.
      const wsId =
        (responseData.workspace as { id?: number })?.id ??
        (responseData.user as { user_workspace?: { workspace_id: number }[] })?.user_workspace?.[0]?.workspace_id;
      if (wsId) jar.set("workspace_id", String(wsId), { ...COOKIE_BASE, maxAge });

      const { token: _t, newToken: _nt, ...safeData } = responseData;
      return NextResponse.json(safeData, { status: backendRes.status });
    }
  }

  return NextResponse.json(responseData, { status: backendRes.status });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
