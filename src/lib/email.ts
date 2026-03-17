/**
 * Email notification service for MockLoop.
 *
 * Uses Resend for transactional emails. Falls back gracefully
 * if RESEND_API_KEY is not configured (logs instead of sending).
 *
 * Email types:
 * 1. Pairing confirmation — sent when admin confirms pairings
 * 2. Feedback finalized — sent when interviewer finalizes feedback
 * 3. Session reminder — sent before upcoming sessions (future: cron)
 */

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM ?? "MockLoop <notifications@mockloop.dev>";

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Send an email. If Resend is not configured, logs to console instead.
 */
async function sendEmail(input: SendEmailInput): Promise<boolean> {
  if (!resend) {
    console.log(
      `[EMAIL PREVIEW] To: ${input.to}\nSubject: ${input.subject}\n${input.html}`
    );
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
    });
    if (error) {
      console.error("Email send error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send exception:", err);
    return false;
  }
}

// ─── Email Templates ────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1B3A5C; font-size: 24px; margin: 0;">MockLoop</h1>
      </div>
      ${content}
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          MockLoop — AI-powered mock interview practice
        </p>
      </div>
    </div>
  `;
}

// ─── 1. Pairing Confirmation ────────────────────────────────────────

interface PairingEmailData {
  participantName: string;
  partnerName: string;
  role: "INTERVIEWER" | "INTERVIEWEE";
  sessionDate: string; // formatted date string
  sessionTime: string; // formatted time string
  meetLink?: string | null;
}

export async function sendPairingConfirmation(
  to: string,
  data: PairingEmailData
): Promise<boolean> {
  const roleLabel =
    data.role === "INTERVIEWER" ? "Interviewer" : "Interviewee";
  const roleColor =
    data.role === "INTERVIEWER" ? "#7c3aed" : "#2563eb";

  const meetSection = data.meetLink
    ? `<p style="margin: 16px 0;">
        <a href="${data.meetLink}" style="display: inline-block; padding: 10px 20px; background-color: #1B3A5C; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
          Join Google Meet
        </a>
       </p>`
    : "";

  return sendEmail({
    to,
    subject: `Mock Interview Scheduled — You're the ${roleLabel}`,
    html: baseTemplate(`
      <p style="color: #374151; font-size: 15px;">Hi ${data.participantName},</p>
      <p style="color: #374151; font-size: 15px;">
        You've been paired for a mock interview session:
      </p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px; color: #374151;">
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Partner</td>
            <td style="padding: 4px 0;">${data.partnerName}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Your Role</td>
            <td style="padding: 4px 0;">
              <span style="background: ${roleColor}15; color: ${roleColor}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                ${roleLabel}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Date</td>
            <td style="padding: 4px 0;">${data.sessionDate}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-weight: 600;">Time</td>
            <td style="padding: 4px 0;">${data.sessionTime}</td>
          </tr>
        </table>
      </div>
      ${meetSection}
      <p style="color: #6b7280; font-size: 13px;">
        Good luck with your practice session!
      </p>
    `),
  });
}

// ─── 2. Feedback Finalized ──────────────────────────────────────────

interface FeedbackEmailData {
  intervieweeName: string;
  interviewerName: string;
  sessionDate: string;
  feedbackUrl: string;
}

export async function sendFeedbackFinalized(
  to: string,
  data: FeedbackEmailData
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Feedback Ready — ${data.sessionDate} Session`,
    html: baseTemplate(`
      <p style="color: #374151; font-size: 15px;">Hi ${data.intervieweeName},</p>
      <p style="color: #374151; font-size: 15px;">
        <strong>${data.interviewerName}</strong> has finalized their feedback from your mock interview on <strong>${data.sessionDate}</strong>.
      </p>
      <p style="margin: 16px 0;">
        <a href="${data.feedbackUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1B3A5C; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
          View Your Feedback
        </a>
      </p>
      <p style="color: #6b7280; font-size: 13px;">
        Review your feedback to track your progress and identify areas for improvement.
      </p>
    `),
  });
}

// ─── 3. Session Reminder ────────────────────────────────────────────

interface ReminderEmailData {
  participantName: string;
  partnerName: string;
  role: "INTERVIEWER" | "INTERVIEWEE";
  sessionDate: string;
  sessionTime: string;
  meetLink?: string | null;
}

export async function sendSessionReminder(
  to: string,
  data: ReminderEmailData
): Promise<boolean> {
  const roleLabel =
    data.role === "INTERVIEWER" ? "Interviewer" : "Interviewee";

  const meetSection = data.meetLink
    ? `<p style="margin: 16px 0;">
        <a href="${data.meetLink}" style="display: inline-block; padding: 10px 20px; background-color: #1B3A5C; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
          Join Google Meet
        </a>
       </p>`
    : "";

  return sendEmail({
    to,
    subject: `Reminder: Mock Interview Tomorrow`,
    html: baseTemplate(`
      <p style="color: #374151; font-size: 15px;">Hi ${data.participantName},</p>
      <p style="color: #374151; font-size: 15px;">
        Just a reminder — you have a mock interview session tomorrow:
      </p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px; color: #374151;">
          <strong>Partner:</strong> ${data.partnerName}<br/>
          <strong>Role:</strong> ${roleLabel}<br/>
          <strong>Date:</strong> ${data.sessionDate}<br/>
          <strong>Time:</strong> ${data.sessionTime}
        </p>
      </div>
      ${meetSection}
      <p style="color: #6b7280; font-size: 13px;">
        Make sure to prepare and be on time. Good luck!
      </p>
    `),
  });
}
