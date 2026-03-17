"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PairingEntry {
  id: string;
  userA: { id: string; name: string | null; email: string };
  userB: { id: string; name: string | null; email: string };
  roleA: string;
  roleB: string;
  sessionId: string | null;
  meetLink: string | null;
  transcriptStatus: string | null;
  analysisStatus: string | null;
}

interface Round {
  date: string;
  pairings: PairingEntry[];
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  COMPLETED: {
    label: "Complete",
    className: "bg-green-100 text-green-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-yellow-100 text-yellow-700",
  },
  PENDING: {
    label: "Pending",
    className: "bg-gray-100 text-gray-500",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-700",
  },
};

export default function ScheduleHistoryPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/schedule/history");
        if (res.ok) {
          const data = await res.json();
          setRounds(data.rounds);
          setTotal(data.total);
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#3D7AB5]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C] mb-1">
            Schedule History
          </h1>
          <p className="text-gray-500 text-sm">
            {total} total pairings across {rounds.length} rounds.
          </p>
        </div>
        <Link
          href="/admin/schedule"
          className="text-sm text-[#3D7AB5] hover:text-[#1B3A5C] font-medium"
        >
          ← Back to Scheduler
        </Link>
      </div>

      {rounds.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
          <div className="text-4xl mb-3">📅</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No History Yet
          </h2>
          <p className="text-sm text-gray-500">
            Confirmed pairings will appear here after you generate and confirm
            your first round of sessions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {rounds.map((round) => (
            <div
              key={round.date}
              className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
            >
              {/* Round header */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  📆{" "}
                  {new Date(round.date + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </h3>
                <span className="text-xs text-gray-400">
                  {round.pairings.length} pair
                  {round.pairings.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Pairing rows */}
              <div className="divide-y divide-gray-100">
                {round.pairings.map((p) => {
                  const interviewer =
                    p.roleA === "INTERVIEWER" ? p.userA : p.userB;
                  const interviewee =
                    p.roleA === "INTERVIEWEE" ? p.userA : p.userB;

                  return (
                    <div
                      key={p.id}
                      className="px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            🎤 Interviewer
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {interviewer.name ?? interviewer.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                            🎯 Interviewee
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {interviewee.name ?? interviewee.email}
                          </span>
                        </div>
                      </div>

                      {/* Status badges */}
                      <div className="flex items-center gap-2 shrink-0">
                        {p.transcriptStatus && (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[p.transcriptStatus]?.className ?? "bg-gray-100 text-gray-500"}`}
                          >
                            📝{" "}
                            {STATUS_BADGE[p.transcriptStatus]?.label ??
                              p.transcriptStatus}
                          </span>
                        )}
                        {p.analysisStatus && (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[p.analysisStatus]?.className ?? "bg-gray-100 text-gray-500"}`}
                          >
                            🤖{" "}
                            {STATUS_BADGE[p.analysisStatus]?.label ??
                              p.analysisStatus}
                          </span>
                        )}
                        {p.sessionId && (
                          <Link
                            href={`/sessions/${p.sessionId}`}
                            className="text-xs text-[#3D7AB5] hover:text-[#1B3A5C] font-medium"
                          >
                            View →
                          </Link>
                        )}
                        {p.meetLink && (
                          <a
                            href={p.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:text-green-800 font-medium"
                          >
                            Meet ↗
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
