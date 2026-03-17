"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

interface SessionRecord {
  id: string;
  sessionDate: string;
  transcriptStatus: string;
  analysisStatus: string;
  interviewer: { name: string | null; email: string };
  interviewee: { name: string | null; email: string };
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

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/sessions");
        if (!res.ok) throw new Error("Failed to fetch");
        setSessions(await res.json());
      } catch {
        setError("Failed to load sessions.");
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#3D7AB5]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-1">Sessions</h1>
      <p className="text-gray-500 text-sm mb-8">
        Your interview sessions.
      </p>

      {sessions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
          <p className="text-gray-400 text-sm">
            No sessions yet. Sessions will appear here once interviews are
            scheduled and recorded.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-[#3D7AB5]/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {s.interviewer.name ?? s.interviewer.email} interviews{" "}
                    {s.interviewee.name ?? s.interviewee.email}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(s.sessionDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={statusVariant(s.transcriptStatus)}>
                    Transcript: {s.transcriptStatus}
                  </Badge>
                  <Badge variant={statusVariant(s.analysisStatus)}>
                    Analysis: {s.analysisStatus}
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
