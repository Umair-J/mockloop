"use client";

/**
 * Admin Schedule Page — Configure scheduling, generate pairings, confirm.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ScheduleConfig {
  id: string;
  cadence: string;
  preferredDay: string;
  preferredTime: string;
  sessionDurationMinutes: number;
  pairingAlgorithm: string;
  timezone: string;
  isActive: boolean;
}

interface ProposedPairing {
  userA: { id: string; name: string | null; email: string };
  userB: { id: string; name: string | null; email: string };
  roleA: string;
  roleB: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminSchedulePage() {
  const [config, setConfig] = useState<ScheduleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pairings, setPairings] = useState<ProposedPairing[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule/config");
      if (res.ok) setConfig(await res.json());
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/schedule/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cadence: config.cadence,
          preferredDay: config.preferredDay,
          preferredTime: config.preferredTime,
          sessionDurationMinutes: config.sessionDurationMinutes,
          pairingAlgorithm: config.pairingAlgorithm,
          timezone: config.timezone,
          isActive: config.isActive,
        }),
      });
      if (res.ok) {
        setConfig(await res.json());
        setMessage("Settings saved!");
      }
    } catch {
      setMessage("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function generatePairings() {
    setGenerating(true);
    setMessage(null);
    setPairings(null);
    try {
      const res = await fetch("/api/schedule/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPairings(data.pairings);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to generate pairings.");
      }
    } catch {
      setMessage("Failed to generate pairings.");
    } finally {
      setGenerating(false);
    }
  }

  async function confirmPairings() {
    if (!pairings) return;
    setConfirming(true);
    setMessage(null);
    try {
      const res = await fetch("/api/schedule/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairings }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(
          `Confirmed! ${data.confirmed} sessions scheduled for ${data.scheduledDate?.split("T")[0] ?? "next session"}.`
        );
        setPairings(null);
        fetchConfig();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to confirm.");
      }
    } catch {
      setMessage("Failed to confirm pairings.");
    } finally {
      setConfirming(false);
    }
  }

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
            Schedule Settings
          </h1>
          <p className="text-gray-500 text-sm">
            Configure mock interview scheduling and generate pairings.
          </p>
        </div>
        <Link
          href="/admin/schedule/history"
          className="text-sm text-[#3D7AB5] hover:text-[#1B3A5C] font-medium"
        >
          View History →
        </Link>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {message}
        </div>
      )}

      {/* Config form */}
      {config && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Cadence
              </label>
              <select
                value={config.cadence}
                onChange={(e) =>
                  setConfig({ ...config, cadence: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Biweekly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Preferred Day
              </label>
              <select
                value={config.preferredDay}
                onChange={(e) =>
                  setConfig({ ...config, preferredDay: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Preferred Time
              </label>
              <input
                type="time"
                value={config.preferredTime}
                onChange={(e) =>
                  setConfig({ ...config, preferredTime: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={15}
                max={180}
                value={config.sessionDurationMinutes}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    sessionDurationMinutes: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Pairing Algorithm
              </label>
              <select
                value={config.pairingAlgorithm}
                onChange={(e) =>
                  setConfig({ ...config, pairingAlgorithm: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="ROUND_ROBIN">Round Robin</option>
                <option value="RANDOM_NO_REPEAT">Random (No Repeat)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={config.timezone}
                onChange={(e) =>
                  setConfig({ ...config, timezone: e.target.value })
                }
                placeholder="e.g. America/New_York"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.isActive}
                onChange={(e) =>
                  setConfig({ ...config, isActive: e.target.checked })
                }
                className="rounded"
              />
              Scheduling active
            </label>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* Generate pairings */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Generate Pairings
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Run the pairing algorithm to create proposed interview pairs. You can
          review and confirm before calendar events are created.
        </p>
        <button
          onClick={generatePairings}
          disabled={generating}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Pairings"}
        </button>
      </div>

      {/* Pairing preview */}
      {pairings && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Proposed Pairings ({pairings.length} pairs)
          </h2>
          <div className="space-y-3 mb-4">
            {pairings.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {p.userA.name ?? p.userA.email}
                    </span>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {p.roleA === "INTERVIEWER" ? "Interviewer" : "Interviewee"}
                    </span>
                  </div>
                  <span className="text-gray-400">↔</span>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {p.userB.name ?? p.userB.email}
                    </span>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                      {p.roleB === "INTERVIEWER" ? "Interviewer" : "Interviewee"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={confirmPairings}
              disabled={confirming}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {confirming
                ? "Creating events..."
                : "Confirm & Create Calendar Events"}
            </button>
            <button
              onClick={() => setPairings(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
