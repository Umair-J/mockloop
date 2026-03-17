import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// This config is used by middleware (Edge runtime) — no Prisma, no DB access.
// The full auth config with Prisma adapter is in auth.ts.
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
} satisfies NextAuthConfig;
