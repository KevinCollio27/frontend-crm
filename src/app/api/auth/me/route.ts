import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API = process.env.API_URL!;

export async function GET() {
  const jar = await cookies();
  const token = jar.get("session_token")?.value;

  if (!token) return NextResponse.json({ user: null });

  try {
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { "x-access-token": token },
      cache: "no-store",
    });

    if (!res.ok) {
      jar.delete("session_token");
      jar.delete("workspace_id");
      return NextResponse.json({ user: null });
    }

    const data = await res.json();
    const wsId = jar.get("workspace_id")?.value;
    return NextResponse.json({
      user: data.user ?? null,
      workspaceId: wsId ? parseInt(wsId, 10) : null,
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
