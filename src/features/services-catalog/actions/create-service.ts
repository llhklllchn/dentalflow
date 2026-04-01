"use server";

import { serviceFormSchema } from "@/features/services-catalog/schemas/service-form.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

export async function createService(input: unknown) {
  const parsed = serviceFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من بيانات الخدمة. وضع الديمو لا يحفظها فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "services:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإدارة الخدمات."
      };
    }

    const existing = await prisma.service.findFirst({
      where: {
        clinicId: user.clinicId,
        name: parsed.data.name
      },
      select: {
        id: true
      }
    });

    if (existing) {
      return {
        ok: false,
        message: "توجد خدمة أخرى بنفس الاسم داخل العيادة."
      };
    }

    const service = await prisma.service.create({
      data: {
        clinicId: user.clinicId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        defaultDurationMinutes: parsed.data.defaultDurationMinutes,
        price: parsed.data.price,
        isActive: true
      }
    });

    await writeAuditLog({
      entityType: "service",
      entityId: service.id,
      action: "create",
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم إنشاء الخدمة بنجاح.",
      data: {
        id: service.id
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to create service."
    };
  }
}
