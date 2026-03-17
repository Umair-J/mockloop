"use client";

/**
 * GroupOverview — Admin-only component showing all members with
 * session count, average score, and trend arrow.
 */

import { useEffect, useState } from "react";

interface MemberStat {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  sessionCount: number;
  averageScore: number | null;
  trend: "improving" | "declining" | "stable" | "insufficient";
}

interface GroupData {
  totalMembers: number;
  activeMembers: number;
  totalSessions: number;
  groupAverage: number;
  members: MemberStat[];
}

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  improving: { icon: "↑", color: "text-green-600" },
  declining: { icon: "↓", color: "text-red-600" },
  stable: { icon: "→", color: "text-blue-500" },
  insufficient: { icon: "—", color: "text-gray-400" },
};

export default function GroupOverview() {
  const [data, setData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGroup() {
      try {
        const res = await fetch("/api/dashboard/group");
        if (res.ok) setData(await res.json());
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchGroup();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header with group stats */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          👥 Group Overview
        </h2>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-gray-400">Members</p>
            <p className="text-lg font-bold text-gray-900">
              {data.totalMembers}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Active</p>
            <p className="text-lg font-bold text-gray-900">
              {data.activeMembers}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Sessions</p>
            <p className="text-lg font-bold text-gray-900">
              {data.totalSessions}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Group Avg</p>
            <p className="text-lg font-bold text-indigo-600">
              {data.groupAverage.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Member grid */}
      <div className="divide-y divide-gray-50">
        {data.members.map((member) => {
          const trend = TREND_ICONS[member.trend];
          return (
            <div
              key={member.id}
              className="px-5 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                  {(member.name ?? member.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {member.name ?? member.email}
                  </p>
                  {member.name && (
                    <p className="text-xs text-gray-400">{member.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Sessions</p>
                  <p className="font-medium">{member.sessionCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Avg Score</p>
                  <p className="font-medium">
                    {member.averageScore?.toFixed(1) ?? "—"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Trend</p>
                  <p className={`font-bold text-lg ${trend.color}`}>
                    {trend.icon}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
