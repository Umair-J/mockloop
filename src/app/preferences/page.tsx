"use client";

import { useEffect, useState } from "react";
import { getCommonTimezones } from "@/lib/timezone";

const TIMEZONES = getCommonTimezones();

export default function PreferencesPage() {
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    async function fetchPrefs() {
      try {
        const res = await fetch("/api/me/preferences");
        if (res.ok) {
          const data = await res.json();
          setTimezone(data.timezone ?? "");
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchPrefs();
  }, []);

  async function handleSave() {
    if (!timezone) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Preferences saved!" });
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.error || "Failed to save preferences.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save preferences." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#3D7AB5]" />
      </div>
    );
  }

  const isCommon = TIMEZONES.some((tz) => tz.value === timezone);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-1">Preferences</h1>
      <p className="text-gray-500 text-sm mb-6">
        Set your timezone so session times display correctly for you.
      </p>

      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded-lg text-sm border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 max-w-lg">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Timezone
        </h2>

        {/* Browser-detected suggestion */}
        {!timezone && detectedTz && (
          <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center justify-between">
            <span>
              We detected your timezone as{" "}
              <strong>{detectedTz}</strong>
            </span>
            <button
              onClick={() => setTimezone(detectedTz)}
              className="ml-3 text-xs font-medium text-blue-600 hover:text-blue-800 underline"
            >
              Use this
            </button>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Select your timezone
            </label>
            <select
              value={isCommon ? timezone : "__custom"}
              onChange={(e) => {
                if (e.target.value === "__custom") return;
                setTimezone(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            >
              <option value="">— Choose —</option>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
              {!isCommon && timezone && (
                <option value="__custom">Other: {timezone}</option>
              )}
            </select>
          </div>

          {/* Manual input for unlisted timezones */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Or type an IANA timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Asia/Karachi"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
            <p className="text-xs text-gray-400 mt-1">
              Full list at{" "}
              <a
                href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Wikipedia
              </a>
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !timezone}
          className="mt-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
