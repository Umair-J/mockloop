import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Use lightweight auth config (no Prisma) for Edge middleware
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow auth routes and sign-in page without authentication
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/sign-in" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Allow the transcripts API endpoint (uses API key auth, not NextAuth)
  if (pathname === "/api/transcripts") {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign-in
  if (!req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
