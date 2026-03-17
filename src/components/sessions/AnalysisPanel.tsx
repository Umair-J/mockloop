"use client";

/**
 * AnalysisPanel — Full AI analysis display with scores, strengths,
 * weaknesses, recommendations, and summary.
 */

import { useState } from "react";
import ScoreCard from "./ScoreCard";

interface StrengthOrWeakness {
  text: string;
  evidence: string;
  timestamp_range?: string;
}

interface Recommendation {
  text: string;
  priority: "high" | "medium" | "low";
}

interface AnalysisData {
  scores: {
    star_structure: number;
    clarity: number;
    depth: number;
    confidence: number;
    strategic_thinking: number;
    active_listening: number;
  };
  strengths: StrengthOrWeakness[];
  weaknesses: StrengthOrWeakness[];
  recommendations: Recommendation[];
  overallSummary: string;
  claudeModel: string;
  promptVersion: string;
  createdAt: string;
}

interface AnalysisPanelProps {
  sessionId: string;
  analysis: AnalysisData | null;
  analysisStatus: string;
  isAdmin: boolean;
}

const SCORE_LABELS: Record<string, { label: string; description: string }> = {
  star_structure: {
    label: "STAR Structure",
    description: "Situation → Task → Action → Result format",
  },
  clarity: {
    label: "Clarity & Conciseness",
    description: "Directness, absence of filler or rambling",
  },
  depth: {
    label: "Depth of Examples",
    description: "Concrete details, metrics, named tools",
  },
  confidence: {
    label: "Confidence & Delivery",
    description: "Assertive language, ownership of outcomes",
  },
  strategic_thinking: {
    label: "Strategic Thinking",
    description: "Tradeoff articulation, business awareness",
  },
  active_listening: {
    label: "Active Listening",
    description: "Responsiveness to follow-ups and cues",
  },
};

const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200",
};

export default function AnalysisPanel({
  sessionId,
  analysis,
  analysisStatus,
  isAdmin,
}: AnalysisPanelProps) {
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTrigger() {
    setTriggering(true);
    setError(null);
    try {
      const res = await fetch("/api/analysis/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to trigger analysis");
      }
      // Reload to show results
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setTriggering(false);
    }
  }

  // No analysis yet — show trigger button or status
  if (!analysis) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          AI Analysis
        </h2>

        {analysisStatus === "PROCESSING" && (
          <div className="flex items-center gap-3 text-blue-600">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Analysis in progress...</span>
          </div>
        )}

        {analysisStatus === "FAILED" && (
          <div className="space-y-3">
            <p className="text-red-600">
              Analysis failed. {isAdmin ? "You can retry below." : "Ask an admin to retry."}
            </p>
            {isAdmin && (
              <button
                onClick={handleTrigger}
                disabled={triggering}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {triggering ? "Retrying..." : "Retry Analysis"}
              </button>
            )}
          </div>
        )}

        {analysisStatus === "PENDING" && (
          <div className="space-y-3">
            <p className="text-gray-500">
              No analysis has been run yet.
              {isAdmin
                ? " Click below to trigger AI analysis."
                : " An admin can trigger analysis once the transcript is ready."}
            </p>
            {isAdmin && (
              <button
                onClick={handleTrigger}
                disabled={triggering}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {triggering ? "Running Analysis..." : "Run AI Analysis"}
              </button>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Analysis exists — show full results
  const avgScore =
    Object.values(analysis.scores).reduce((a, b) => a + b, 0) / 6;

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">
              {avgScore.toFixed(1)}
              <span className="text-sm font-normal text-gray-500">/10</span>
            </div>
            <div className="text-xs text-gray-400">Overall Average</div>
          </div>
        </div>
        <p className="text-gray-700">{analysis.overallSummary}</p>
        <div className="mt-3 flex gap-2 text-xs text-gray-400">
          <span>Model: {analysis.claudeModel}</span>
          <span>·</span>
          <span>Prompt: {analysis.promptVersion}</span>
          <span>·</span>
          <span>
            {new Date(analysis.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(analysis.scores).map(([key, score]) => (
          <ScoreCard
            key={key}
            label={SCORE_LABELS[key]?.label ?? key}
            score={score}
            description={SCORE_LABELS[key]?.description}
          />
        ))}
      </div>

      {/* Strengths */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-green-700 mb-4">
          💪 Strengths
        </h3>
        <div className="space-y-4">
          {analysis.strengths.map((item, i) => (
            <div key={i} className="border-l-4 border-green-400 pl-4">
              <p className="font-medium text-gray-900">{item.text}</p>
              <p className="text-sm text-gray-600 mt-1 italic">
                &ldquo;{item.evidence}&rdquo;
              </p>
              {item.timestamp_range && (
                <span className="text-xs text-gray-400 mt-1">
                  {item.timestamp_range}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-red-700 mb-4">
          🎯 Areas for Improvement
        </h3>
        <div className="space-y-4">
          {analysis.weaknesses.map((item, i) => (
            <div key={i} className="border-l-4 border-red-400 pl-4">
              <p className="font-medium text-gray-900">{item.text}</p>
              <p className="text-sm text-gray-600 mt-1 italic">
                &ldquo;{item.evidence}&rdquo;
              </p>
              {item.timestamp_range && (
                <span className="text-xs text-gray-400 mt-1">
                  {item.timestamp_range}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-md font-semibold text-indigo-700 mb-4">
          📋 Recommendations
        </h3>
        <div className="space-y-3">
          {analysis.recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded border ${PRIORITY_COLORS[rec.priority]}`}
              >
                {rec.priority}
              </span>
              <p className="text-sm text-gray-700">{rec.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Admin: re-run button */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {triggering ? "Re-running..." : "Re-run Analysis"}
          </button>
          {error && <p className="ml-3 text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
