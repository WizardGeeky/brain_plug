import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "brain_plug_jwt_super_secret_key_32bytes_min_2026"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("bp_session")?.value;

  let payload: any = null;
  if (token) {
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch {
      payload = null;
    }
  }

  const isAuthRoute = pathname === "/login" || pathname === "/onboarding";

  // If user already has an active valid JWT session and opens /login, redirect directly to dashboard
  if (isAuthRoute && payload) {
    if (payload.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }

  // Protect /admin routes (requires SUPER_ADMIN)
  if (pathname.startsWith("/admin") && (!payload || payload.role !== "SUPER_ADMIN")) {
    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL("/client/dashboard", request.url));
  }

  // Protect /client routes (requires valid session)
  if (pathname.startsWith("/client") && !payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/onboarding",
    "/admin/:path*",
    "/client/:path*",
  ],
};
