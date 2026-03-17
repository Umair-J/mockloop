/**
 * GET /api/schedule/history
 *
 * Admin-only. Returns past pairing history grouped by scheduled date,
 * newest first.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const history = await prisma.pairingHistory.findMany({
      include: {
        userA: { select: { id: true, name: true, email: true } },
        userB: { select: { id: true, name: true, email: true } },
        session: {
          select: {
            id: true,
            meetLink: true,
            transcriptStatus: true,
            analysisStatus: true,
          },
        },
      },
      orderBy: { scheduledDate: "desc" },
      take: 50,
    });

    // Group by date
    const grouped = new Map<
      string,
      Array<{
        id: string;
        userA: { id: string; name: string | null; email: string };
        userB: { id: string; name: string | null; email: string };
        roleA: string;
        roleB: string;
        sessionId: string | null;
        meetLink: string | null;
        transcriptStatus: string | null;
        analysisStatus: string | null;
      }>
    >();

    for (const h of history) {
      const dateKey = h.scheduledDate.toISOString().split("T")[0];
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)!.push({
        id: h.id,
        userA: h.userA,
        userB: h.userB,
        roleA: h.roleA,
        roleB: h.roleB,
        sessionId: h.sessionId,
        meetLink: h.session?.meetLink ?? null,
        transcriptStatus: h.session?.transcriptStatus ?? null,
        analysisStatus: h.session?.analysisStatus ?? null,
      });
    }

    const rounds = Array.from(grouped.entries()).map(([date, pairings]) => ({
      date,
      pairings,
    }));

    return NextResponse.json({ rounds, total: history.length });
  } catch (error) {
    console.error("GET /api/schedule/history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
