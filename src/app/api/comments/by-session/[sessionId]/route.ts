/**
 * GET /api/comments/by-session/[sessionId]
 *
 * List all comments for a session.
 * Access: interviewer, interviewee (only finalized), or admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    const interviewSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { interviewerId: true, intervieweeId: true },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const isInterviewer = interviewSession.interviewerId === session.user.id;
    const isInterviewee = interviewSession.intervieweeId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isInterviewer && !isInterviewee && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const comments = await prisma.interviewerComment.findMany({
      where: {
        sessionId,
        // Interviewee only sees finalized comments
        ...(isInterviewee && !isAdmin ? { isFinalized: true } : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/comments/by-session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
