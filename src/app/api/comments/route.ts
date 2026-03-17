/**
 * POST /api/comments
 *
 * Create a new interviewer comment on a session.
 * Only the interviewer (or admin) for that session can add comments.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateCommentSchema = z.object({
  sessionId: z.string().uuid(),
  commentText: z.string().min(1).max(5000),
  commentType: z.enum(["STRENGTH", "WEAKNESS", "SUGGESTION", "GENERAL"]).default("GENERAL"),
  timestampSeconds: z.number().int().min(0).optional(),
  sectionLabel: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, commentText, commentType, timestampSeconds, sectionLabel } = parsed.data;

    // Verify session exists and user is the interviewer or admin
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
        { error: "Only the interviewer or admin can add comments" },
        { status: 403 }
      );
    }

    const comment = await prisma.interviewerComment.create({
      data: {
        sessionId,
        authorId: session.user.id,
        commentText,
        commentType,
        timestampSeconds: timestampSeconds ?? null,
        sectionLabel: sectionLabel ?? null,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
