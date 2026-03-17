/**
 * POST /api/analysis/trigger
 *
 * Admin-only endpoint to manually trigger AI analysis for a session.
 * Requires a completed transcript. Runs analysis asynchronously and
 * updates the session's analysisStatus.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeTranscript } from "@/lib/claude";
import type { TranscriptEntry } from "@/lib/prompts/analysis-v1";
import { z } from "zod";

const TriggerSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = TriggerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sessionId } = parsed.data;

  // Fetch session with transcript
  const interviewSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      transcript: true,
      interviewer: { select: { name: true } },
      interviewee: { select: { name: true } },
    },
  });

  if (!interviewSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!interviewSession.transcript) {
    return NextResponse.json(
      { error: "No transcript found for this session" },
      { status: 400 }
    );
  }

  if (interviewSession.transcriptStatus !== "COMPLETED") {
    return NextResponse.json(
      { error: "Transcript is not yet completed" },
      { status: 400 }
    );
  }

  // Check if analysis already exists
  const existingAnalysis = await prisma.aiAnalysis.findUnique({
    where: { sessionId },
  });

  if (existingAnalysis && interviewSession.analysisStatus === "COMPLETED") {
    return NextResponse.json(
      { error: "Analysis already exists. Delete it first to re-run." },
      { status: 409 }
    );
  }

  // Mark as processing
  await prisma.session.update({
    where: { id: sessionId },
    data: { analysisStatus: "PROCESSING" },
  });

  // Run analysis (don't await in the response — but for manual trigger we do
  // await so the admin sees success/failure immediately)
  try {
    const transcriptData = interviewSession.transcript.content as unknown as TranscriptEntry[];
    const result = await analyzeTranscript(
      transcriptData,
      interviewSession.interviewee?.name ?? undefined
    );

    // Upsert analysis record
    await prisma.aiAnalysis.upsert({
      where: { sessionId },
      create: {
        sessionId,
        scores: result.analysis.scores as unknown as Record<string, unknown>,
        strengths: result.analysis.strengths as unknown as Record<string, unknown>[],
        weaknesses: result.analysis.weaknesses as unknown as Record<string, unknown>[],
        recommendations: result.analysis.recommendations as unknown as Record<string, unknown>[],
        overallSummary: result.analysis.overall_summary,
        claudeModel: result.model,
        promptVersion: result.promptVersion,
        rawResponse: result.rawResponse as unknown as Record<string, unknown>,
      },
      update: {
        scores: result.analysis.scores as unknown as Record<string, unknown>,
        strengths: result.analysis.strengths as unknown as Record<string, unknown>[],
        weaknesses: result.analysis.weaknesses as unknown as Record<string, unknown>[],
        recommendations: result.analysis.recommendations as unknown as Record<string, unknown>[],
        overallSummary: result.analysis.overall_summary,
        claudeModel: result.model,
        promptVersion: result.promptVersion,
        rawResponse: result.rawResponse as unknown as Record<string, unknown>,
      },
    });

    // Mark completed
    await prisma.session.update({
      where: { id: sessionId },
      data: { analysisStatus: "COMPLETED" },
    });

    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      model: result.model,
      promptVersion: result.promptVersion,
    });
  } catch (error) {
    // Mark failed
    await prisma.session.update({
      where: { id: sessionId },
      data: { analysisStatus: "FAILED" },
    });

    console.error("[Analysis Trigger] Failed:", error);
    return NextResponse.json(
      {
        error: "Analysis failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
