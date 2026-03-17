/**
 * POST /api/schedule/generate
 *
 * Admin-only. Runs the pairing algorithm and returns proposed pairings
 * without creating calendar events (preview only).
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePairings } from "@/lib/scheduling";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    });

    if (users.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 active users to generate pairings" },
        { status: 400 }
      );
    }

    // Get pairing history
    const history = await prisma.pairingHistory.findMany({
      orderBy: { scheduledDate: "desc" },
      take: 100, // last 100 pairings should be enough context
    });

    const pairings = generatePairings(
      users,
      history.map((h) => ({
        userAId: h.userAId,
        userBId: h.userBId,
        roleA: h.roleA,
        roleB: h.roleB,
        scheduledDate: h.scheduledDate,
      }))
    );

    return NextResponse.json({
      pairings: pairings.map((p) => ({
        userA: p.userA,
        userB: p.userB,
        roleA: p.roleA,
        roleB: p.roleB,
      })),
      totalUsers: users.length,
      paired: pairings.length * 2,
      sittingOut: users.length - pairings.length * 2,
    });
  } catch (error) {
    console.error("POST /api/schedule/generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
