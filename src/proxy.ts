import { NextRequest, NextResponse } from "next/server";

const DASHBOARD = ["/home", "/crm", "/settings", "/marketing", "/chat"];
const ONBOARDING = ["/create-workspace"];
const AUTH = ["/login", "/signup", "/recovery-password", "/reset-password"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session_token")?.value;
  const workspaceId = req.cookies.get("workspace_id")?.value;

  const isDashboard = DASHBOARD.some((p) => pathname.startsWith(p));
  const isOnboarding = ONBOARDING.some((p) => pathname.startsWith(p));
  const isAuth = AUTH.some((p) => pathname.startsWith(p));

  if ((isDashboard || isOnboarding) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuth && token) {
    const dest = workspaceId ? "/chat" : "/create-workspace";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (isDashboard && token && !workspaceId) {
    return NextResponse.redirect(new URL("/create-workspace", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|api/).*)"],
};
