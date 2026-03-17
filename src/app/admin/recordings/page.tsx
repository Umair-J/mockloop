"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

interface SessionRecord {
  id: string;
  sessionDate: string;
  recordingFileKey: string | null;
  transcriptStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  analysisStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  interviewer: { id: string; name: string | null; email: string };
  interviewee: { id: string; name: string | null; email: string };
}

function statusVariant(
  status: string
): "pending" | "processing" | "completed" | "failed" {
  switch (status) {
    case "PENDING":
      return "pending";
    case "PROCESSING":
      return "processing";
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    default:
      return "pending";
  }
}

export default function AdminRecordingsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/sessions");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSessions(data);
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
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-1">Recordings</h1>
      <p className="text-gray-500 text-sm mb-8">
        All interview sessions and their processing status.
      </p>

      {sessions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
          <p className="text-gray-400 text-sm">
            No sessions yet. Sessions are created automatically when recordings
            are detected in Google Drive, or manually via the API.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Interviewer</th>
                <th className="px-4 py-3 font-medium">Interviewee</th>
                <th className="px-4 py-3 font-medium">Transcript</th>
                <th className="px-4 py-3 font-medium">Analysis</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-4 py-3 text-gray-900">
                    {new Date(s.sessionDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.interviewer.name ?? s.interviewer.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.interviewee.name ?? s.interviewee.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(s.transcriptStatus)}>
                      {s.transcriptStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(s.analysisStatus)}>
                      {s.analysisStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/sessions/${s.id}`}
                      className="text-xs text-[#3D7AB5] hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
