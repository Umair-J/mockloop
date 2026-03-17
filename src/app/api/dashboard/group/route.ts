/**
 * GET /api/dashboard/group
 *
 * Admin-only endpoint returning group-level dashboard data:
 * - Per-member session count, average scores, trend arrow
 * - Overall group stats
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ScoreEntry {
  star_structure: number;
  clarity: number;
  depth: number;
  confidence: number;
  strategic_thinking: number;
  active_listening: number;
}

const SCORE_KEYS: (keyof ScoreEntry)[] = [
  "star_structure",
  "clarity",
  "depth",
  "confidence",
  "strategic_thinking",
  "active_listening",
];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, image: true },
    });

    // Get all completed sessions with analysis
    const sessions = await prisma.session.findMany({
      where: { analysisStatus: "COMPLETED" },
      include: { analysis: true },
      orderBy: { sessionDate: "asc" },
    });

    // Build per-member stats
    const memberStats = users.map((user) => {
      const userSessions = sessions.filter(
        (s) => s.intervieweeId === user.id
      );
      const count = userSessions.length;

      if (count === 0) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          sessionCount: 0,
          averageScore: null,
          trend: "insufficient" as const,
        };
      }

      // Average across all sessions
      const allScores = userSessions
        .map((s) => {
          const scores = s.analysis?.scores as unknown as ScoreEntry | null;
          if (!scores) return null;
          return (
            SCORE_KEYS.reduce((sum, k) => sum + (scores[k] ?? 0), 0) /
            SCORE_KEYS.length
          );
        })
        .filter((v): v is number => v !== null);

      const averageScore =
        allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : null;

      // Trend from last 2 sessions
      let trend: "improving" | "declining" | "stable" | "insufficient" =
        "insufficient";
      if (allScores.length >= 2) {
        const last = allScores[allScores.length - 1];
        const prev = allScores[allScores.length - 2];
        const delta = last - prev;
        if (delta > 0.3) trend = "improving";
        else if (delta < -0.3) trend = "declining";
        else trend = "stable";
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        sessionCount: count,
        averageScore: averageScore
          ? Math.round(averageScore * 10) / 10
          : null,
        trend,
      };
    });

    // Group totals
    const totalSessions = sessions.length;
    const activeMemberCount = memberStats.filter(
      (m) => m.sessionCount > 0
    ).length;
    const groupAverage =
      memberStats
        .filter((m) => m.averageScore !== null)
        .reduce((sum, m) => sum + (m.averageScore ?? 0), 0) /
        (memberStats.filter((m) => m.averageScore !== null).length || 1);

    return NextResponse.json({
      totalMembers: users.length,
      activeMembers: activeMemberCount,
      totalSessions,
      groupAverage: Math.round(groupAverage * 10) / 10,
      members: memberStats.sort(
        (a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0)
      ),
    });
  } catch (error) {
    console.error("GET /api/dashboard/group error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
