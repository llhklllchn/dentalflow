"use server";

import { z } from "zod";

import { serviceFormSchema } from "@/features/services-catalog/schemas/service-form.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

const updateServiceSchema = serviceFormSchema.extend({
  serviceId: z.string().min(1, "Service id is required.")
});

export async function updateService(input: unknown) {
  const parsed = updateServiceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من تعديل الخدمة. وضع الديمو لا يحفظها فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "services:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتعديل الخدمات."
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

    const duplicate = await prisma.service.findFirst({
      where: {
        clinicId: user.clinicId,
        name: parsed.data.name,
        NOT: {
          id: parsed.data.serviceId
        }
      },
      select: {
        id: true
      }
    });

    if (duplicate) {
      return {
        ok: false,
        message: "توجد خدمة أخرى بنفس الاسم داخل العيادة."
      };
    }

    const updatedService = await prisma.service.update({
      where: {
        id: parsed.data.serviceId
      },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        defaultDurationMinutes: parsed.data.defaultDurationMinutes,
        price: parsed.data.price
      }
    });

    await writeAuditLog({
      entityType: "service",
      entityId: updatedService.id,
      action: "update",
      oldValuesJson: {
        name: service.name,
        description: service.description,
        defaultDurationMinutes: service.defaultDurationMinutes,
        price: Number(service.price),
        isActive: service.isActive
      },
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم تحديث الخدمة بنجاح."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to update service."
    };
  }
}
