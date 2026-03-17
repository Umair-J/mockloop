/**
 * POST /api/schedule/confirm
 *
 * Admin-only. Takes proposed pairings, creates Google Calendar events
 * with Meet links, creates Session records and PairingHistory entries.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import {
  createCalendarEvent,
  computeNextSessionTime,
} from "@/lib/google-calendar";
import { z } from "zod";

const PairingSchema = z.object({
  userA: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
  userB: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
  roleA: z.enum(["INTERVIEWER", "INTERVIEWEE"]),
  roleB: z.enum(["INTERVIEWER", "INTERVIEWEE"]),
});

const ConfirmSchema = z.object({
  pairings: z.array(PairingSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = ConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get admin's OAuth tokens from JWT
    const token = await getToken({ req });
    if (!token?.accessToken || !token?.refreshToken) {
      return NextResponse.json(
        {
          error:
            "Google Calendar tokens not available. Please sign out and sign back in to grant calendar access.",
        },
        { status: 401 }
      );
    }

    // Get schedule config for timing
    const config = await prisma.scheduleConfig.findFirst();
    if (!config) {
      return NextResponse.json(
        { error: "Schedule config not found. Please configure scheduling first." },
        { status: 400 }
      );
    }

    const { startTime, endTime } = computeNextSessionTime(
      config.preferredDay,
      config.preferredTime,
      config.sessionDurationMinutes,
      config.timezone
    );

    const results = [];

    for (const pairing of parsed.data.pairings) {
      const interviewer =
        pairing.roleA === "INTERVIEWER" ? pairing.userA : pairing.userB;
      const interviewee =
        pairing.roleA === "INTERVIEWEE" ? pairing.userA : pairing.userB;

      // Create Calendar event with Meet link
      let meetLink: string | null = null;
      let calendarEventId: string | null = null;

      try {
        const calResult = await createCalendarEvent(
          token.accessToken as string,
          token.refreshToken as string,
          {
            summary: `MockLoop: ${interviewer.name ?? interviewer.email} ↔ ${interviewee.name ?? interviewee.email}`,
            description: [
              "🎯 Mock Interview Session — MockLoop",
              "",
              `Interviewer: ${interviewer.name ?? interviewer.email}`,
              `Interviewee: ${interviewee.name ?? interviewee.email}`,
              "",
              "Tips:",
              "• Interviewer: Prepare 2–3 behavioral questions",
              "• Interviewee: Use STAR format for answers",
              "• Record the session in Google Meet for AI analysis",
            ].join("\n"),
            startTime,
            endTime,
            timezone: config.timezone,
            attendeeEmails: [interviewer.email, interviewee.email],
          }
        );

        meetLink = calResult.meetLink;
        calendarEventId = calResult.eventId;
      } catch (calError) {
        console.error("Calendar event creation failed:", calError);
        // Continue without Meet link — we still create the session
      }

      // Create Session record
      const sessionRecord = await prisma.session.create({
        data: {
          interviewerId: interviewer.id,
          intervieweeId: interviewee.id,
          sessionDate: new Date(startTime),
          meetLink,
        },
      });

      // Create PairingHistory record
      await prisma.pairingHistory.create({
        data: {
          userAId: pairing.userA.id,
          userBId: pairing.userB.id,
          roleA: pairing.roleA,
          roleB: pairing.roleB,
          scheduledDate: new Date(startTime),
          sessionId: sessionRecord.id,
        },
      });

      results.push({
        sessionId: sessionRecord.id,
        interviewer: interviewer.name ?? interviewer.email,
        interviewee: interviewee.name ?? interviewee.email,
        meetLink,
        calendarEventId,
        scheduledDate: startTime,
      });
    }

    // Update last run date
    await prisma.scheduleConfig.update({
      where: { id: config.id },
      data: { lastRunDate: new Date() },
    });

    return NextResponse.json({
      confirmed: results.length,
      sessions: results,
      scheduledDate: startTime,
    });
  } catch (error) {
    console.error("POST /api/schedule/confirm error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
