"use client";

/**
 * UpcomingSession — Card showing upcoming scheduled sessions.
 */

interface UpcomingSessionData {
  id: string;
  date: string;
  interviewer: string;
  interviewee: string;
  isInterviewer: boolean;
}

interface UpcomingSessionProps {
  sessions: UpcomingSessionData[];
}

export default function UpcomingSession({ sessions }: UpcomingSessionProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          📅 Upcoming Sessions
        </h3>
        <p className="text-sm text-gray-400">
          No upcoming sessions scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        📅 Upcoming Sessions
      </h3>
      <div className="space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {new Date(s.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-500">
                {s.isInterviewer
                  ? `You interview ${s.interviewee}`
                  : `${s.interviewer} interviews you`}
              </p>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full font-medium ${
                s.isInterviewer
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {s.isInterviewer ? "Interviewer" : "Interviewee"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
