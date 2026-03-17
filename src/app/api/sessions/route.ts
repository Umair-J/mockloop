import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // Also support API key auth for the transcription script
    const apiKey = req.headers.get("x-api-key");
    const isScriptAuth =
      apiKey && apiKey === process.env.TRANSCRIPTION_API_KEY;

    const where: Record<string, unknown> = {};

    if (status) {
      where.transcriptStatus = status.toUpperCase();
    }

    // Non-admin, non-script users only see their own sessions
    if (session.user.role !== "ADMIN" && !isScriptAuth) {
      where.OR = [
        { interviewerId: session.user.id },
        { intervieweeId: session.user.id },
      ];
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        interviewer: { select: { id: true, name: true, email: true } },
        interviewee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { sessionDate: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const createSessionSchema = z.object({
  interviewerEmail: z.string().email(),
  intervieweeEmail: z.string().email(),
  sessionDate: z.string().datetime(),
  recordingFileKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const interviewer = await prisma.user.findUnique({
      where: { email: parsed.data.interviewerEmail },
    });
    const interviewee = await prisma.user.findUnique({
      where: { email: parsed.data.intervieweeEmail },
    });

    if (!interviewer || !interviewee) {
      return NextResponse.json(
        { error: "One or both users not found" },
        { status: 404 }
      );
    }

    const newSession = await prisma.session.create({
      data: {
        interviewerId: interviewer.id,
        intervieweeId: interviewee.id,
        sessionDate: new Date(parsed.data.sessionDate),
        recordingFileKey: parsed.data.recordingFileKey,
        transcriptStatus: "PENDING",
        analysisStatus: "PENDING",
      },
      include: {
        interviewer: { select: { id: true, name: true, email: true } },
        interviewee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
