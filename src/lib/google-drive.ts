import { google } from "googleapis";

function getServiceAccountAuth() {
  const keyBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyBase64) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set");
  }

  const keyJson = JSON.parse(Buffer.from(keyBase64, "base64").toString("utf-8"));

  return new google.auth.GoogleAuth({
    credentials: keyJson,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
}

/**
 * List video files in the configured shared Google Drive folder.
 */
export async function listRecordingFiles(): Promise<DriveFile[]> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set");
  }

  const auth = getServiceAccountAuth();
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/' and trashed = false`,
    fields: "files(id, name, mimeType, createdTime)",
    orderBy: "createdTime desc",
    pageSize: 100,
  });

  return (res.data.files ?? []) as DriveFile[];
}

/**
 * Parse a recording filename into its components.
 * Expected format: YYYY-MM-DD_user-at-domain_user-at-domain.mp4
 * The -at- in the email replaces @ to avoid filesystem issues.
 */
export function parseRecordingFilename(filename: string): {
  date: Date;
  interviewerEmail: string;
  intervieweeEmail: string;
} | null {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(mp4|webm|mov|avi|mkv)$/i, "");
  const parts = nameWithoutExt.split("_");

  // Expect exactly 3 parts: date, interviewer, interviewee
  if (parts.length < 3) return null;

  const datePart = parts[0];
  // Rejoin remaining parts in case domain has underscores, then split on the last occurrence
  // Actually, emails with -at- won't have underscores in them typically,
  // so we take index 1 and 2 (and any remaining parts indicate a parsing issue)
  const interviewerRaw = parts[1];
  const intervieweeRaw = parts.slice(2).join("_");

  // Validate date
  const dateMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const date = new Date(`${datePart}T00:00:00Z`);
  if (isNaN(date.getTime())) return null;

  // Convert -at- back to @
  const interviewerEmail = interviewerRaw.replace(/-at-/g, "@");
  const intervieweeEmail = intervieweeRaw.replace(/-at-/g, "@");

  // Basic email validation
  if (!interviewerEmail.includes("@") || !intervieweeEmail.includes("@")) {
    return null;
  }

  return { date, interviewerEmail, intervieweeEmail };
}
