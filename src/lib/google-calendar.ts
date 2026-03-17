/**
 * Google Calendar integration for MockLoop.
 *
 * Uses the admin's stored OAuth tokens to create Google Calendar events
 * with Google Meet links for confirmed mock-interview pairings.
 */

import { google } from "googleapis";

interface CalendarEventInput {
  summary: string;
  description: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  timezone: string;
  attendeeEmails: string[];
}

interface CalendarEventResult {
  eventId: string;
  meetLink: string | null;
  htmlLink: string;
}

/**
 * Create a Google Calendar event with a Meet link.
 *
 * @param accessToken  The admin's Google OAuth access token
 * @param refreshToken The admin's Google OAuth refresh token
 * @param input        Event details
 * @returns            Created event info including Meet link
 */
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  input: CalendarEventInput
): Promise<CalendarEventResult> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: {
        dateTime: input.startTime,
        timeZone: input.timezone,
      },
      end: {
        dateTime: input.endTime,
        timeZone: input.timezone,
      },
      attendees: input.attendeeEmails.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `mockloop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    },
  });

  return {
    eventId: event.data.id ?? "",
    meetLink: event.data.conferenceData?.entryPoints?.[0]?.uri ?? null,
    htmlLink: event.data.htmlLink ?? "",
  };
}

/**
 * Build the start/end time for a session on a given date.
 *
 * @param preferredDay  e.g. "Wednesday"
 * @param preferredTime e.g. "10:00" (HH:MM)
 * @param durationMin   Session length in minutes
 * @param timezone      IANA timezone string
 * @returns             { startTime, endTime } as ISO strings
 */
export function computeNextSessionTime(
  preferredDay: string,
  preferredTime: string,
  durationMin: number,
  timezone: string
): { startTime: string; endTime: string } {
  const dayIndex: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const targetDay = dayIndex[preferredDay] ?? 3; // default Wednesday
  const [hours, minutes] = preferredTime.split(":").map(Number);

  // Find the next occurrence of the preferred day
  const now = new Date();
  const current = now.getDay();
  let daysUntil = targetDay - current;
  if (daysUntil <= 0) daysUntil += 7; // always schedule for next week at minimum

  const sessionDate = new Date(now);
  sessionDate.setDate(now.getDate() + daysUntil);
  sessionDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(sessionDate.getTime() + durationMin * 60 * 1000);

  // Format as ISO with timezone info
  // We'll pass the timezone to Calendar API which handles DST correctly
  const formatLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}:00`;
  };

  return {
    startTime: formatLocal(sessionDate),
    endTime: formatLocal(endDate),
  };
}
