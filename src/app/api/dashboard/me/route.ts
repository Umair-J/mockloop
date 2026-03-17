/**
 * GET /api/dashboard/me
 *
 * Returns the authenticated user's personal dashboard data:
 * - Aggregated scores across all sessions
 * - Trend (comparing last 2 sessions)
 * - Top strengths and growth areas
 * - Session history summary
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

const SCORE_LABELS: Record<string, string> = {
  star_structure: "STAR Structure",
  clarity: "Clarity & Conciseness",
  depth: "Depth of Examples",
  confidence: "Confidence & Delivery",
  strategic_thinking: "Strategic Thinking",
  active_listening: "Active Listening",
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all sessions where user was interviewee (they're the one being scored)
    const sessions = await prisma.session.findMany({
      where: {
        intervieweeId: userId,
        analysisStatus: "COMPLETED",
      },
      include: {
        analysis: true,
        interviewer: { select: { name: true } },
      },
      orderBy: { sessionDate: "asc" },
    });

    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return NextResponse.json({
        isAdmin: session.user.role === "ADMIN",
        totalSessions: 0,
        isEmpty: true,
        message: "No completed sessions yet",
      });
    }

    // Build per-session score history for trend charts
    const sessionHistory = sessions.map((s) => {
      const scores = s.analysis?.scores as unknown as ScoreEntry | null;
      return {
        sessionId: s.id,
        date: s.sessionDate.toISOString(),
        interviewer: s.interviewer?.name ?? "Unknown",
        scores: scores ?? null,
        average: scores
          ? SCORE_KEYS.reduce((sum, k) => sum + (scores[k] ?? 0), 0) /
            SCORE_KEYS.length
          : null,
      };
    });

    // Compute overall averages
    const avgScores: Record<string, number> = {};
    for (const key of SCORE_KEYS) {
      const values = sessions
        .map((s) => {
          const scores = s.analysis?.scores as unknown as ScoreEntry | null;
          return scores?.[key] ?? null;
        })
        .filter((v): v is number => v !== null);
      avgScores[key] =
        values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0;
    }

    const overallAverage =
      SCORE_KEYS.reduce((sum, k) => sum + avgScores[k], 0) / SCORE_KEYS.length;

    // Trend: compare last 2 sessions
    let trend: "improving" | "declining" | "stable" | "insufficient" =
      "insufficient";
    let trendDelta = 0;

    if (totalSessions >= 2) {
      const lastTwo = sessionHistory.slice(-2);
      const prev = lastTwo[0].average ?? 0;
      const curr = lastTwo[1].average ?? 0;
      trendDelta = curr - prev;

      if (trendDelta > 0.3) trend = "improving";
      else if (trendDelta < -0.3) trend = "declining";
      else trend = "stable";
    }

    // Top strengths (highest avg scores) and growth areas (lowest avg scores)
    const sortedScores = SCORE_KEYS.map((key) => ({
      key,
      label: SCORE_LABELS[key],
      average: avgScores[key],
    })).sort((a, b) => b.average - a.average);

    const topStrengths = sortedScores.slice(0, 3);
    const growthAreas = sortedScores.slice(-3).reverse();

    // Upcoming sessions (as interviewee or interviewer)
    const upcoming = await prisma.session.findMany({
      where: {
        OR: [{ intervieweeId: userId }, { interviewerId: userId }],
        sessionDate: { gt: new Date() },
      },
      include: {
        interviewer: { select: { name: true, email: true } },
        interviewee: { select: { name: true, email: true } },
      },
      orderBy: { sessionDate: "asc" },
      take: 3,
    });

    return NextResponse.json({
      isAdmin: session.user.role === "ADMIN",
      totalSessions,
      isEmpty: false,
      overallAverage: Math.round(overallAverage * 10) / 10,
      avgScores,
      trend,
      trendDelta: Math.round(trendDelta * 10) / 10,
      topStrengths,
      growthAreas,
      sessionHistory,
      upcoming: upcoming.map((s) => ({
        id: s.id,
        date: s.sessionDate.toISOString(),
        interviewer: s.interviewer?.name ?? s.interviewer?.email ?? "TBD",
        interviewee: s.interviewee?.name ?? s.interviewee?.email ?? "TBD",
        isInterviewer: s.interviewerId === userId,
      })),
    });
  } catch (error) {
    console.error("GET /api/dashboard/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
