import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { authorizeJobsRequest } from "@/lib/jobs/authorization";
import { deliverPendingNotificationsForClinic } from "@/features/notifications/services/deliver-pending-notifications-for-clinic";

async function handleDeliveryRequest(request: NextRequest) {
  const auth = authorizeJobsRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get("clinicId") ?? undefined;
  const limitRaw = Number(searchParams.get("limit") ?? 50);
  const limit =
    Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 200 ? limitRaw : null;

  if (limit === null) {
    return NextResponse.json(
      {
        ok: false,
        message: "limit must be an integer between 1 and 200."
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
      results.push(
        await deliverPendingNotificationsForClinic({
          clinicId: targetClinicId,
          take: limit
        })
      );
    }

    return NextResponse.json({
      ok: true,
      processedClinics: results.length,
      processedCount: results.reduce((sum, item) => sum + item.processedCount, 0),
      sentCount: results.reduce((sum, item) => sum + item.sentCount, 0),
      failedCount: results.reduce((sum, item) => sum + item.failedCount, 0),
      results
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to deliver notifications."
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleDeliveryRequest(request);
}

export async function POST(request: NextRequest) {
  return handleDeliveryRequest(request);
}
