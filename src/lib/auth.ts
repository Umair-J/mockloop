import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      // Task 1.4: Allowed-email gate
      if (!user.email) return false;

      const allowed = await prisma.allowedEmail.findUnique({
        where: { email: user.email },
      });

      // Also allow the admin email even if not in the allowed list
      if (!allowed && user.email !== process.env.ADMIN_EMAIL) {
        return false;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // First sign-in: look up or detect role
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        });

        // Task 1.5: Admin role detection
        if (token.email === process.env.ADMIN_EMAIL) {
          token.role = "ADMIN";
          // Also update DB if not already admin
          if (dbUser && dbUser.role !== "ADMIN") {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { role: "ADMIN" },
            });
          }
        } else {
          token.role = dbUser?.role ?? "MEMBER";
        }

        token.id = dbUser?.id ?? user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "MEMBER";
      }
      return session;
    },
  },
});
