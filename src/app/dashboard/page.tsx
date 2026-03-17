"use client";

import { useEffect, useState } from "react";
import TrendChart from "@/components/dashboard/TrendChart";
import StrengthsCard from "@/components/dashboard/StrengthsCard";
import UpcomingSession from "@/components/dashboard/UpcomingSession";
import GroupOverview from "@/components/dashboard/GroupOverview";

interface DashboardData {
  isAdmin?: boolean;
  totalSessions: number;
  isEmpty: boolean;
  overallAverage?: number;
  avgScores?: Record<string, number>;
  trend?: "improving" | "declining" | "stable" | "insufficient";
  trendDelta?: number;
  topStrengths?: Array<{ key: string; label: string; average: number }>;
  growthAreas?: Array<{ key: string; label: string; average: number }>;
  sessionHistory?: Array<{
    sessionId: string;
    date: string;
    interviewer: string;
    scores: Record<string, number> | null;
    average: number | null;
  }>;
  upcoming?: Array<{
    id: string;
    date: string;
    interviewer: string;
    interviewee: string;
    isInterviewer: boolean;
  }>;
}

const TREND_DISPLAY = {
  improving: { icon: "📈", text: "Improving", color: "text-green-600" },
  declining: { icon: "📉", text: "Declining", color: "text-red-600" },
  stable: { icon: "➡️", text: "Stable", color: "text-blue-600" },
  insufficient: { icon: "📊", text: "Not enough data", color: "text-gray-400" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDimensions, setShowDimensions] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard/me");
        if (res.ok) setData(await res.json());
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#3D7AB5]" />
      </div>
    );
  }

  // Empty state: fewer than 2 sessions
  if (!data || data.isEmpty || data.totalSessions < 2) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your performance tracking hub.
        </p>

        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center max-w-lg mx-auto">
          <div className="text-4xl mb-4">🎯</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Getting Started
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Complete at least 2 mock interview sessions as the interviewee to
            see your performance trends, strengths, and areas for growth.
          </p>
          <div className="space-y-3 text-left max-w-xs mx-auto">
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${data && data.totalSessions >= 1 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                {data && data.totalSessions >= 1 ? "✓" : "1"}
              </span>
              <span className="text-sm text-gray-600">
                Complete your first mock interview
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-400">
                2
              </span>
              <span className="text-sm text-gray-600">
                Complete a second session to unlock trends
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-400">
                3
              </span>
              <span className="text-sm text-gray-600">
                Track your improvement over time
              </span>
            </div>
          </div>
        </div>

        {/* Still show upcoming sessions if any */}
        {data?.upcoming && data.upcoming.length > 0 && (
          <div className="mt-6 max-w-lg mx-auto">
            <UpcomingSession sessions={data.upcoming} />
          </div>
        )}

        {/* Admin group overview even on empty state */}
        {data?.isAdmin && (
          <div className="mt-6">
            <GroupOverview />
          </div>
        )}
      </div>
    );
  }

  // Full dashboard
  const trendInfo = TREND_DISPLAY[data.trend ?? "insufficient"];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Your interview performance over {data.totalSessions} sessions.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Sessions
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {data.totalSessions}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Overall Score
          </p>
          <p className="text-2xl font-bold text-indigo-600">
            {data.overallAverage?.toFixed(1)}
            <span className="text-sm font-normal text-gray-400">/10</span>
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Trend
          </p>
          <p className={`text-lg font-semibold ${trendInfo.color}`}>
            {trendInfo.icon} {trendInfo.text}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            Last Delta
          </p>
          <p
            className={`text-lg font-semibold ${
              (data.trendDelta ?? 0) > 0
                ? "text-green-600"
                : (data.trendDelta ?? 0) < 0
                  ? "text-red-600"
                  : "text-gray-500"
            }`}
          >
            {(data.trendDelta ?? 0) > 0 ? "+" : ""}
            {data.trendDelta?.toFixed(1) ?? "—"}
          </p>
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Score Trend Over Time
          </h2>
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            {showDimensions ? "Hide dimensions" : "Show all dimensions"}
          </button>
        </div>
        <TrendChart
          data={data.sessionHistory ?? []}
          showDimensions={showDimensions}
        />
      </div>

      {/* Strengths + Growth areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StrengthsCard
          title="Top Strengths"
          items={data.topStrengths ?? []}
          variant="strength"
        />
        <StrengthsCard
          title="Growth Areas"
          items={data.growthAreas ?? []}
          variant="growth"
        />
      </div>

      {/* Upcoming sessions */}
      <div className="mb-6">
        <UpcomingSession sessions={data.upcoming ?? []} />
      </div>

      {/* Admin group overview */}
      {data.isAdmin && (
        <div className="mt-6">
          <GroupOverview />
        </div>
      )}
    </div>
  );
}
