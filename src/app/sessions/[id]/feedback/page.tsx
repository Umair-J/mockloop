"use client";

/**
 * Unified Feedback Report — /sessions/[id]/feedback
 *
 * Read-only page merging AI analysis + human interviewer comments.
 * Accessible to interviewee only after comments are finalized.
 * Accessible to interviewer/admin anytime.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ScoreCard from "@/components/sessions/ScoreCard";

interface AnalysisData {
  scores: Record<string, number>;
  strengths: Array<{ text: string; evidence: string; timestamp_range?: string }>;
  weaknesses: Array<{ text: string; evidence: string; timestamp_range?: string }>;
  recommendations: Array<{ text: string; priority: string }>;
  overallSummary: string;
}

interface CommentData {
  id: string;
  commentText: string;
  commentType: string;
  timestampSeconds: number | null;
  sectionLabel: string | null;
  isFinalized: boolean;
  author: { name: string | null };
}

interface SessionData {
  id: string;
  sessionDate: string;
  interviewer: { name: string | null; email: string };
  interviewee: { name: string | null; email: string };
  analysisStatus: string;
  analysis: AnalysisData | null;
  comments: CommentData[];
  _viewer: {
    isAdmin: boolean;
    isInterviewer: boolean;
    isParticipant: boolean;
  };
}

const SCORE_LABELS: Record<string, string> = {
  star_structure: "STAR Structure",
  clarity: "Clarity & Conciseness",
  depth: "Depth of Examples",
  confidence: "Confidence & Delivery",
  strategic_thinking: "Strategic Thinking",
  active_listening: "Active Listening",
};

const COMMENT_TYPE_COLORS: Record<string, string> = {
  STRENGTH: "border-l-green-500 bg-green-50",
  WEAKNESS: "border-l-red-500 bg-red-50",
  SUGGESTION: "border-l-blue-500 bg-blue-50",
  GENERAL: "border-l-gray-400 bg-gray-50",
};

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800",
};

export default function FeedbackReportPage() {
  const params = useParams();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch_data() {
      try {
        const res = await fetch(`/api/sessions/${params.id}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load");
          return;
        }
        const data = await res.json();

        // Visibility gate: interviewee can only see if comments are finalized
        const isIntervieweeOnly =
          !data._viewer?.isAdmin && !data._viewer?.isInterviewer;
        const hasFinalized = data.comments?.some(
          (c: CommentData) => c.isFinalized
        );

        if (isIntervieweeOnly && !hasFinalized) {
          setError(
            "Feedback is not yet available. Your interviewer has not finalized their comments."
          );
          return;
        }

        setSession(data);
      } catch {
        setError("Failed to load feedback report.");
      } finally {
        setLoading(false);
      }
    }
    fetch_data();
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
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-800">
          {error ?? "Report not available."}
        </div>
        <Link
          href={`/sessions/${params.id}`}
          className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
        >
          ← Back to session
        </Link>
      </div>
    );
  }

  const analysis = session.analysis;
  const comments = session.comments.filter((c) => c.isFinalized);
  const strengthComments = comments.filter((c) => c.commentType === "STRENGTH");
  const weaknessComments = comments.filter((c) => c.commentType === "WEAKNESS");
  const suggestionComments = comments.filter(
    (c) => c.commentType === "SUGGESTION"
  );
  const generalComments = comments.filter((c) => c.commentType === "GENERAL");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/sessions/${session.id}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back to session
        </Link>
        <h1 className="text-2xl font-bold text-[#1B3A5C] mt-2">
          Feedback Report
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {session.interviewee.name ?? session.interviewee.email} ·{" "}
          {new Date(session.sessionDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* AI Analysis Section */}
      {analysis && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              AI Analysis
            </h2>
            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
              AI-Generated
            </span>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-5 mb-4">
            <p className="text-gray-700">{analysis.overallSummary}</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {Object.entries(analysis.scores).map(([key, score]) => (
              <ScoreCard
                key={key}
                label={SCORE_LABELS[key] ?? key}
                score={score}
              />
            ))}
          </div>

          {/* AI Strengths */}
          {analysis.strengths.length > 0 && (
            <div className="bg-white rounded-lg shadow p-5 mb-4">
              <h3 className="text-sm font-semibold text-green-700 mb-3">
                AI-Identified Strengths
              </h3>
              <div className="space-y-3">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="border-l-4 border-green-400 pl-3">
                    <p className="font-medium text-sm text-gray-900">{s.text}</p>
                    <p className="text-xs text-gray-500 italic mt-1">
                      &ldquo;{s.evidence}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <div className="bg-white rounded-lg shadow p-5 mb-4">
              <h3 className="text-sm font-semibold text-red-700 mb-3">
                AI-Identified Areas for Improvement
              </h3>
              <div className="space-y-3">
                {analysis.weaknesses.map((w, i) => (
                  <div key={i} className="border-l-4 border-red-400 pl-3">
                    <p className="font-medium text-sm text-gray-900">{w.text}</p>
                    <p className="text-xs text-gray-500 italic mt-1">
                      &ldquo;{w.evidence}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-5 mb-4">
              <h3 className="text-sm font-semibold text-indigo-700 mb-3">
                AI Recommendations
              </h3>
              <div className="space-y-2">
                {analysis.recommendations.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 bg-gray-50 rounded"
                  >
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        PRIORITY_BADGE[r.priority] ?? PRIORITY_BADGE.medium
                      }`}
                    >
                      {r.priority}
                    </span>
                    <p className="text-sm text-gray-700">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Human Feedback Section */}
      {comments.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Interviewer Feedback
            </h2>
            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
              Human
            </span>
          </div>

          {/* Group by type */}
          {[
            { label: "Strengths", items: strengthComments, type: "STRENGTH" },
            { label: "Areas for Improvement", items: weaknessComments, type: "WEAKNESS" },
            { label: "Suggestions", items: suggestionComments, type: "SUGGESTION" },
            { label: "General Comments", items: generalComments, type: "GENERAL" },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <div key={group.type} className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  {group.label}
                </h3>
                <div className="space-y-2">
                  {group.items.map((comment) => (
                    <div
                      key={comment.id}
                      className={`border-l-4 rounded-lg p-3 ${
                        COMMENT_TYPE_COLORS[comment.commentType] ??
                        COMMENT_TYPE_COLORS.GENERAL
                      }`}
                    >
                      <p className="text-sm text-gray-700">
                        {comment.commentText}
                      </p>
                      <div className="flex gap-2 mt-1 text-xs text-gray-400">
                        {comment.sectionLabel && (
                          <span>{comment.sectionLabel}</span>
                        )}
                        {comment.timestampSeconds != null && (
                          <span>
                            @{Math.floor(comment.timestampSeconds / 60)}:
                            {(comment.timestampSeconds % 60)
                              .toString()
                              .padStart(2, "0")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Empty state */}
      {!analysis && comments.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400">
          No feedback available yet.
        </div>
      )}
    </div>
  );
}
