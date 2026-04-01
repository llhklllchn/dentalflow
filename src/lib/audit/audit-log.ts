import { Prisma } from "@prisma/client";
import { headers } from "next/headers";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { shouldUseDemoData } from "@/lib/db/data-source";

type WriteAuditLogInput = {
  entityType: string;
  entityId: string;
  action: string;
  oldValuesJson?: Record<string, unknown> | null;
  newValuesJson?: Record<string, unknown> | null;
};

async function resolveIpAddress() {
  const headerStore = await Promise.resolve(headers());
  const forwardedFor = headerStore.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return headerStore.get("x-real-ip") ?? undefined;
}

export async function writeAuditLog(input: WriteAuditLogInput) {
  if (shouldUseDemoData()) {
    return null;
  }

  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  await prisma.auditLog.create({
    data: {
      clinicId: user.clinicId,
      userId: user.id,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      oldValuesJson:
        (input.oldValuesJson ?? undefined) as
          | Prisma.InputJsonValue
          | Prisma.NullableJsonNullValueInput
          | undefined,
      newValuesJson:
        (input.newValuesJson ?? undefined) as
          | Prisma.InputJsonValue
          | Prisma.NullableJsonNullValueInput
          | undefined,
      ipAddress: await resolveIpAddress()
    }
  });
}
