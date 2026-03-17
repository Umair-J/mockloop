import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import TimezonePrompt from "@/components/TimezonePrompt";

export const metadata: Metadata = {
  title: "MockLoop",
  description: "AI-Powered Mock Interview Practice Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  // Don't show sidebar on sign-in page or when not authenticated
  const showSidebar = !!session?.user;

  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {showSidebar ? (
          <div className="flex min-h-screen">
            <Sidebar
              userName={session.user.name}
              userRole={session.user.role}
            />
            <main className="flex-1 lg:ml-64 p-6">
              <TimezonePrompt />
              {children}
            </main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
