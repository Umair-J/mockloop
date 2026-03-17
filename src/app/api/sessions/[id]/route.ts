import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const interviewSession = await prisma.session.findUnique({
      where: { id },
      include: {
        interviewer: { select: { id: true, name: true, email: true } },
        interviewee: { select: { id: true, name: true, email: true } },
        transcript: true,
        analysis: true,
        comments: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!interviewSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Access control: only interviewer, interviewee, or admin
    const isParticipant =
      interviewSession.interviewerId === session.user.id ||
      interviewSession.intervieweeId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If interviewee, hide comments that aren't finalized
    if (interviewSession.intervieweeId === session.user.id && !isAdmin) {
      interviewSession.comments = interviewSession.comments.filter(
        (c) => c.isFinalized
      );
    }

    return NextResponse.json({
      ...interviewSession,
      _viewer: {
        role: session.user.role,
        isAdmin,
        isParticipant,
      },
    });
  } catch (error) {
    console.error("GET /api/sessions/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
