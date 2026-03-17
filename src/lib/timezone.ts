/**
 * Timezone utilities for MockLoop.
 *
 * Uses built-in Intl API — no external timezone library needed.
 * Works in both Node.js and browser environments.
 */

/**
 * Convert an ISO datetime string to a human-readable local time string.
 *
 * @param isoString  e.g. "2026-03-21T10:00:00"
 * @param timezone   IANA timezone, e.g. "America/New_York"
 * @returns          e.g. "Sat, Mar 21 at 10:00 AM EDT"
 */
export function convertToLocalTime(
  isoString: string,
  timezone: string
): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return isoString; // fallback if timezone is invalid
  }
}

/**
 * Check if a session time falls outside comfortable hours (7 AM – 10 PM)
 * in a given timezone.
 *
 * @param isoString  Session start time in ISO format
 * @param timezone   IANA timezone string
 * @returns          true if the time is before 7 AM or after 10 PM local
 */
export function isUnsociableHour(
  isoString: string,
  timezone: string
): boolean {
  try {
    const date = new Date(isoString);
    // Extract hour in the target timezone
    const hourStr = date.toLocaleString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    });
    const hour = parseInt(hourStr, 10);
    return hour < 7 || hour >= 22;
  } catch {
    return false; // can't determine, assume OK
  }
}

/**
 * Curated list of common IANA timezones with friendly labels.
 * Used for the timezone picker dropdown.
 *
 * Designed to cover major population centers. Future Option 3
 * could switch to Intl.supportedValuesOf('timeZone') for full list.
 */
export function getCommonTimezones(): { value: string; label: string }[] {
  return [
    { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
    { value: "America/Anchorage", label: "Alaska (AKST)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PST)" },
    { value: "America/Denver", label: "Mountain Time (MST)" },
    { value: "America/Chicago", label: "Central Time (CST)" },
    { value: "America/New_York", label: "Eastern Time (EST)" },
    { value: "America/Halifax", label: "Atlantic Time (AST)" },
    { value: "America/Sao_Paulo", label: "Brasilia (BRT)" },
    { value: "Atlantic/Reykjavik", label: "Iceland (GMT)" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Central Europe (CET)" },
    { value: "Europe/Helsinki", label: "Eastern Europe (EET)" },
    { value: "Europe/Moscow", label: "Moscow (MSK)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Karachi", label: "Pakistan (PKT)" },
    { value: "Asia/Kolkata", label: "India (IST)" },
    { value: "Asia/Dhaka", label: "Bangladesh (BST)" },
    { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
    { value: "Asia/Shanghai", label: "China (CST)" },
    { value: "Asia/Tokyo", label: "Japan (JST)" },
    { value: "Asia/Seoul", label: "Korea (KST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST)" },
    { value: "Australia/Perth", label: "Perth (AWST)" },
    { value: "Pacific/Auckland", label: "New Zealand (NZST)" },
  ];
}
