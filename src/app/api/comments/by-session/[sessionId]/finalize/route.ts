/**
 * POST /api/comments/by-session/[sessionId]/finalize
 *
 * Toggle finalization for ALL comments on a session.
 * - If comments are not finalized → finalize them all
 * - If comments are already finalized → un-finalize them all (for edits)
 * Only the interviewer or admin can finalize/un-finalize.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
      select: { interviewerId: true },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const isInterviewer = interviewSession.interviewerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isInterviewer && !isAdmin) {
      return NextResponse.json(
        { error: "Only the interviewer or admin can finalize comments" },
        { status: 403 }
      );
    }

    // Check current state — are there any comments, and are they finalized?
    const comments = await prisma.interviewerComment.findMany({
      where: { sessionId },
      select: { isFinalized: true },
    });

    if (comments.length === 0) {
      return NextResponse.json(
        { error: "No comments to finalize" },
        { status: 400 }
      );
    }

    const allFinalized = comments.every((c) => c.isFinalized);
    const newState = !allFinalized;

    // Toggle all comments
    const result = await prisma.interviewerComment.updateMany({
      where: { sessionId },
      data: { isFinalized: newState },
    });

    return NextResponse.json({
      finalized: newState,
      updatedCount: result.count,
      message: newState
        ? "All comments finalized. Interviewee can now see feedback."
        : "Comments un-finalized. Interviewee can no longer see feedback until re-finalized.",
    });
  } catch (error) {
    console.error("POST finalize error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
