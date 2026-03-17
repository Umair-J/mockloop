/**
 * GET /api/schedule/config — Fetch schedule configuration
 * PUT /api/schedule/config — Update schedule configuration
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateConfigSchema = z.object({
  cadence: z.enum(["WEEKLY", "BIWEEKLY"]).optional(),
  preferredDay: z.string().optional(), // e.g. "Monday", "Saturday"
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), // HH:MM
  sessionDurationMinutes: z.number().int().min(15).max(180).optional(),
  pairingAlgorithm: z.enum(["ROUND_ROBIN", "RANDOM_NO_REPEAT"]).optional(),
  timezone: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get or create default config
    let config = await prisma.scheduleConfig.findFirst();
    if (!config) {
      config = await prisma.scheduleConfig.create({
        data: {
          cadence: "WEEKLY",
          preferredDay: "Wednesday",
          preferredTime: "10:00",
          sessionDurationMinutes: 45,
          pairingAlgorithm: "ROUND_ROBIN",
          timezone: "America/Los_Angeles",
          isActive: false,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/schedule/config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get or create
    let config = await prisma.scheduleConfig.findFirst();
    if (!config) {
      config = await prisma.scheduleConfig.create({
        data: {
          cadence: "WEEKLY",
          preferredDay: "Wednesday",
          preferredTime: "10:00",
          sessionDurationMinutes: 45,
          pairingAlgorithm: "ROUND_ROBIN",
          timezone: "America/Los_Angeles",
          isActive: false,
          ...parsed.data,
        },
      });
    } else {
      config = await prisma.scheduleConfig.update({
        where: { id: config.id },
        data: parsed.data,
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("PUT /api/schedule/config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
