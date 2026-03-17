"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Shows a banner prompting the user to set their timezone
 * if they haven't already. Dismissible for the session.
 */
export default function TimezonePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/me/preferences");
        if (res.ok) {
          const data = await res.json();
          if (!data.timezone) setShow(true);
        }
      } catch {
        // fail silently
      }
    }
    check();
  }, []);

  if (!show) return null;

  return (
    <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-amber-800">
        <span>🌍</span>
        <span>
          Set your timezone so session times display correctly.{" "}
          <Link
            href="/preferences"
            className="font-medium underline hover:text-amber-900"
          >
            Set timezone
          </Link>
        </span>
      </div>
      <button
        onClick={() => setShow(false)}
        className="text-amber-400 hover:text-amber-600 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
