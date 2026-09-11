import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "myfolks_session";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("Please define AUTH_SECRET in .env.local");
}

const secretKey = new TextEncoder().encode(secret);

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);

    return typeof payload.userId === "string";
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authenticated = await hasValidSession(request);

  /*
   * Public authentication pages.
   *
   * If the user is already authenticated, there is no reason to
   * show Login or Sign Up again. Send them back to Discover.
   */
  if (pathname === "/login" || pathname === "/signup") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  /*
   * These pages require an authenticated session.
   */
  const protectedRoutes = [
    "/",
    "/create-profile",
    "/friends",
    "/messages",
    "/profile",
    "/settings",
  ];

  const isProtectedRoute =
    protectedRoutes.includes(pathname) ||
    protectedRoutes.some((route) =>
      pathname.startsWith(`${route}/`)
    );

  if (isProtectedRoute && !authenticated) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/create-profile/:path*",
    "/friends/:path*",
    "/messages/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};