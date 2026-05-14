import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// POST — set session cookies after login / verify-email
export async function POST(req: Request) {
  const { token, workspaceId, rememberMe } = await req.json();
  const jar = await cookies();
  const maxAge = rememberMe ? 90 * 24 * 60 * 60 : 30 * 24 * 60 * 60;

  jar.set("session_token", token, { ...BASE, maxAge });
  if (workspaceId) jar.set("workspace_id", String(workspaceId), { ...BASE, maxAge });

  return NextResponse.json({ success: true });
}

// PATCH — update workspace_id after workspace creation
export async function PATCH(req: Request) {
  const { workspaceId } = await req.json();
  const jar = await cookies();
  if (!jar.get("session_token")) return NextResponse.json({ success: false }, { status: 401 });

  jar.set("workspace_id", String(workspaceId), { ...BASE, maxAge: 30 * 24 * 60 * 60 });
  return NextResponse.json({ success: true });
}

// DELETE — logout, clear all session cookies
export async function DELETE() {
  const jar = await cookies();
  jar.delete("session_token");
  jar.delete("workspace_id");
  return NextResponse.json({ success: true });
}
