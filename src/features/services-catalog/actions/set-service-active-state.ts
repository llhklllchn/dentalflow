"use server";

import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

const setServiceActiveStateSchema = z.object({
  serviceId: z.string().min(1, "Service id is required."),
  isActive: z.boolean()
});

export async function setServiceActiveState(input: unknown) {
  const parsed = setServiceActiveStateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: parsed.data.isActive ? "تم التحقق من إعادة تفعيل الخدمة." : "تم التحقق من تعطيل الخدمة.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "services:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإدارة حالة الخدمات."
      };
    }

    const service = await prisma.service.findFirst({
      where: {
        id: parsed.data.serviceId,
        clinicId: user.clinicId
      }
    });

    if (!service) {
      return {
        ok: false,
        message: "الخدمة غير موجودة داخل العيادة الحالية."
      };
    }

    await prisma.service.update({
      where: {
        id: parsed.data.serviceId
      },
      data: {
        isActive: parsed.data.isActive
      }
    });

    await writeAuditLog({
      entityType: "service",
      entityId: service.id,
      action: parsed.data.isActive ? "reactivate" : "deactivate",
      oldValuesJson: {
        isActive: service.isActive
      },
      newValuesJson: {
        isActive: parsed.data.isActive
      }
    });

    return {
      ok: true,
      message: parsed.data.isActive ? "تم إعادة تفعيل الخدمة." : "تم تعطيل الخدمة."
    };
  } catch (error) {
    return {
      ok: false,
        message: error instanceof Error ? error.message : "تعذر تحديث حالة الخدمة."
    };
  }
}
