/**
 * GET /api/analysis/[sessionId]
 *
 * Returns AI analysis for a given session.
 * Access: session participants or admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  // Verify access: must be participant or admin
  const interviewSession = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      interviewerId: true,
      intervieweeId: true,
    },
  });

  if (!interviewSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isParticipant =
    session.user.id === interviewSession.interviewerId ||
    session.user.id === interviewSession.intervieweeId;
  const isAdmin = session.user.role === "ADMIN";

  if (!isParticipant && !isAdmin) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const analysis = await prisma.aiAnalysis.findUnique({
    where: { sessionId },
  });

  if (!analysis) {
    return NextResponse.json(
      { error: "No analysis found for this session" },
      { status: 404 }
    );
  }

  // Don't expose raw response to non-admins
  return NextResponse.json({
    id: analysis.id,
    sessionId: analysis.sessionId,
    scores: analysis.scores,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    recommendations: analysis.recommendations,
    overallSummary: analysis.overallSummary,
    claudeModel: analysis.claudeModel,
    promptVersion: analysis.promptVersion,
    ...(isAdmin ? { rawResponse: analysis.rawResponse } : {}),
    createdAt: analysis.createdAt,
  });
}
