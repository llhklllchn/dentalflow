import { NextResponse } from "next/server";

import { getLaunchReadinessSummary } from "@/lib/config/launch-readiness";
import { shouldUseDemoData } from "@/lib/db/data-source";

export async function GET() {
  const now = new Date().toISOString();
  const launchReadiness = getLaunchReadinessSummary();

  if (shouldUseDemoData()) {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      database: "skipped",
      time: now,
      launchReadiness: {
        score: launchReadiness.score,
        ready: launchReadiness.ready
      }
    });
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      mode: "live",
      database: "ok",
      time: now,
      launchReadiness: {
        score: launchReadiness.score,
        ready: launchReadiness.ready
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        mode: "live",
        database: "error",
        time: now,
        launchReadiness: {
          score: launchReadiness.score,
          ready: launchReadiness.ready
        },
        message: error instanceof Error ? error.message : "Health check failed."
      },
      { status: 503 }
    );
  }
}
