"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import TranscriptViewer from "@/components/sessions/TranscriptViewer";
import AnalysisPanel from "@/components/sessions/AnalysisPanel";

interface SessionDetail {
  id: string;
  sessionDate: string;
  transcriptStatus: string;
  analysisStatus: string;
  meetLink: string | null;
  interviewer: { id: string; name: string | null; email: string };
  interviewee: { id: string; name: string | null; email: string };
  transcript: {
    content: Array<{
      speaker: string;
      start_time: number;
      end_time: number;
      text: string;
    }>;
    wordCount: number;
    durationSeconds: number;
    whisperModel: string;
  } | null;
  analysis: {
    scores: {
      star_structure: number;
      clarity: number;
      depth: number;
      confidence: number;
      strategic_thinking: number;
      active_listening: number;
    };
    strengths: Array<{ text: string; evidence: string; timestamp_range?: string }>;
    weaknesses: Array<{ text: string; evidence: string; timestamp_range?: string }>;
    recommendations: Array<{ text: string; priority: "high" | "medium" | "low" }>;
    overallSummary: string;
    claudeModel: string;
    promptVersion: string;
    createdAt: string;
  } | null;
  _viewer: {
    role: string;
    isAdmin: boolean;
    isParticipant: boolean;
  };
  comments: Array<{
    id: string;
    commentText: string;
    commentType: string;
    timestampSeconds: number | null;
    sectionLabel: string | null;
    isFinalized: boolean;
    author: { id: string; name: string | null };
  }>;
}

function statusVariant(
  status: string
): "pending" | "processing" | "completed" | "failed" {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "PROCESSING":
      return "processing";
    case "FAILED":
      return "failed";
    default:
      return "pending";
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function SessionDetailPage() {
  const params = useParams();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${params.id}`);
        if (res.status === 404) {
          setError("Session not found.");
          return;
        }
        if (res.status === 403) {
          setError("You don't have permission to view this session.");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        setSession(await res.json());
      } catch {
        setError("Failed to load session.");
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#3D7AB5]" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        {error ?? "Session not found."}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-1">
          Session Detail
        </h1>
        <p className="text-gray-500 text-sm">
          {new Date(session.sessionDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Session info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Interviewer
          </p>
          <p className="font-medium text-gray-900">
            {session.interviewer.name ?? session.interviewer.email}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Interviewee
          </p>
          <p className="font-medium text-gray-900">
            {session.interviewee.name ?? session.interviewee.email}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Status
          </p>
          <div className="flex gap-2 mt-1">
            <Badge variant={statusVariant(session.transcriptStatus)}>
              Transcript: {session.transcriptStatus}
            </Badge>
            <Badge variant={statusVariant(session.analysisStatus)}>
              Analysis: {session.analysisStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Transcript section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Transcript</h2>
          {session.transcript && (
            <div className="flex gap-3 text-xs text-gray-500">
              <span>
                {session.transcript.wordCount.toLocaleString()} words
              </span>
              <span>
                {formatDuration(session.transcript.durationSeconds)}
              </span>
              <span>Model: {session.transcript.whisperModel}</span>
            </div>
          )}
        </div>
        <div className="p-4">
          {session.transcript ? (
            <TranscriptViewer
              content={
                session.transcript.content as Array<{
                  speaker: string;
                  start_time: number;
                  end_time: number;
                  text: string;
                }>
              }
            />
          ) : (
            <div className="text-center text-gray-400 text-sm py-8">
              {session.transcriptStatus === "PENDING"
                ? "Transcript not yet available. It will appear here once the recording is processed."
                : session.transcriptStatus === "PROCESSING"
                ? "Transcript is being processed..."
                : "Transcript processing failed."}
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      <div className="mb-6">
        <AnalysisPanel
          sessionId={session.id}
          analysis={session.analysis}
          analysisStatus={session.analysisStatus}
          isAdmin={session._viewer?.isAdmin ?? false}
        />
      </div>

      {/* Comments placeholder (Phase 4) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">
            Interviewer Comments
          </h2>
        </div>
        <div className="p-4">
          {session.comments.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              No comments yet. Comments will be available in Phase 4.
            </div>
          ) : (
            <div className="space-y-3">
              {session.comments.map((c) => (
                <div
                  key={c.id}
                  className="border border-gray-100 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {c.author.name ?? "Unknown"}
                    </span>
                    <Badge variant="default">{c.commentType}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{c.commentText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
