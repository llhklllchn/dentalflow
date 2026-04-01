import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { authorizeJobsRequest } from "@/lib/jobs/authorization";
import { queueAppointmentRemindersForClinic } from "@/features/notifications/services/queue-appointment-reminders-for-clinic";

async function handleReminderRequest(request: NextRequest) {
  const auth = authorizeJobsRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get("clinicId") ?? undefined;
  const hoursAheadRaw = Number(searchParams.get("hoursAhead") ?? 24);
  const hoursAhead =
    Number.isInteger(hoursAheadRaw) && hoursAheadRaw > 0 && hoursAheadRaw <= 168
      ? hoursAheadRaw
      : null;

  if (hoursAhead === null) {
    return NextResponse.json(
      {
        ok: false,
        message: "hoursAhead must be an integer between 1 and 168."
      },
      { status: 400 }
    );
  }

  try {
    const clinicIds = clinicId
      ? [clinicId]
      : shouldUseDemoData()
        ? ["cln_001"]
        : (await prisma.clinic.findMany({
            select: {
              id: true
            }
          })).map((clinic) => clinic.id);

    const results = [];

    for (const targetClinicId of clinicIds) {
      const result = await queueAppointmentRemindersForClinic({
        clinicId: targetClinicId,
        hoursAhead
      });

      results.push(result);
    }

    return NextResponse.json({
      ok: true,
      processedClinics: results.length,
      queuedCount: results.reduce((sum, item) => sum + item.queuedCount, 0),
      skippedCount: results.reduce((sum, item) => sum + item.skippedCount, 0),
      results
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to queue reminders."
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleReminderRequest(request);
}

export async function POST(request: NextRequest) {
  return handleReminderRequest(request);
}
