import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const transcriptSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.array(
    z.object({
      speaker: z.string(),
      start_time: z.number(),
      end_time: z.number(),
      text: z.string(),
    })
  ),
  wordCount: z.number().int().positive(),
  durationSeconds: z.number().int().positive(),
  whisperModel: z.string().default("large-v3"),
});

export async function POST(req: NextRequest) {
  try {
    // API key auth (not NextAuth) — this is the only route with this pattern
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.TRANSCRIPTION_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = transcriptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: parsed.data.sessionId },
    });
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if transcript already exists
    const existing = await prisma.transcript.findUnique({
      where: { sessionId: parsed.data.sessionId },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Transcript already exists for this session" },
        { status: 409 }
      );
    }

    // Create transcript and update session status in a transaction
    const transcript = await prisma.$transaction(async (tx) => {
      const t = await tx.transcript.create({
        data: {
          sessionId: parsed.data.sessionId,
          content: parsed.data.content,
          wordCount: parsed.data.wordCount,
          durationSeconds: parsed.data.durationSeconds,
          whisperModel: parsed.data.whisperModel,
        },
      });

      await tx.session.update({
        where: { id: parsed.data.sessionId },
        data: { transcriptStatus: "COMPLETED" },
      });

      return t;
    });

    return NextResponse.json(transcript, { status: 201 });
  } catch (error) {
    console.error("POST /api/transcripts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
