/**
 * PUT  /api/comments/[id] — Update a comment
 * DELETE /api/comments/[id] — Delete a comment
 *
 * Only the comment author (or admin) can edit/delete.
 * Cannot edit/delete finalized comments unless un-finalized first.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateCommentSchema = z.object({
  commentText: z.string().min(1).max(5000).optional(),
  commentType: z.enum(["STRENGTH", "WEAKNESS", "SUGGESTION", "GENERAL"]).optional(),
  timestampSeconds: z.number().int().min(0).nullable().optional(),
  sectionLabel: z.string().max(200).nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const comment = await prisma.interviewerComment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only author or admin
    const isAuthor = comment.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Block edits on finalized comments
    if (comment.isFinalized) {
      return NextResponse.json(
        { error: "Cannot edit a finalized comment. Un-finalize first." },
        { status: 409 }
      );
    }

    const updated = await prisma.interviewerComment.update({
      where: { id },
      data: parsed.data,
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/comments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const comment = await prisma.interviewerComment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isAuthor = comment.authorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (comment.isFinalized) {
      return NextResponse.json(
        { error: "Cannot delete a finalized comment. Un-finalize first." },
        { status: 409 }
      );
    }

    await prisma.interviewerComment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/comments/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
