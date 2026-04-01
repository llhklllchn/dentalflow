"use server";

import { Prisma } from "@prisma/client";

import { clinicSettingsSchema } from "@/features/clinics/schemas/clinic-settings.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

function toStructuredScheduleValue(value?: string) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  const items = normalized
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length <= 1) {
    return items[0] ?? normalized;
  }

  return items;
}

export async function updateClinicSettings(input: unknown) {
  const parsed = clinicSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من الإعدادات. وضع الديمو لا يحفظها فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "settings:update")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتعديل إعدادات العيادة."
      };
    }

    const clinic = await prisma.clinic.findUnique({
      where: {
        id: user.clinicId
      }
    });

    if (!clinic) {
      return {
        ok: false,
        message: "تعذر العثور على العيادة الحالية."
      };
    }

    const workingDaysJson = toStructuredScheduleValue(parsed.data.workingDays);
    const workingHoursJson = toStructuredScheduleValue(parsed.data.workingHours);

    const updatedClinic = await prisma.clinic.update({
      where: {
        id: user.clinicId
      },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email?.toLowerCase() || null,
        city: parsed.data.city || null,
        address: parsed.data.address || null,
        currency: parsed.data.currency,
        timezone: parsed.data.timezone,
        language: parsed.data.language,
        workingDaysJson: workingDaysJson ?? Prisma.DbNull,
        workingHoursJson: workingHoursJson ?? Prisma.DbNull,
        defaultAppointmentDuration: parsed.data.defaultAppointmentDuration
      }
    });

    await writeAuditLog({
      entityType: "clinic",
      entityId: updatedClinic.id,
      action: "update_settings",
      oldValuesJson: {
        name: clinic.name,
        phone: clinic.phone,
        email: clinic.email,
        city: clinic.city,
        address: clinic.address,
        currency: clinic.currency,
        timezone: clinic.timezone,
        language: clinic.language,
        workingDaysJson: clinic.workingDaysJson,
        workingHoursJson: clinic.workingHoursJson,
        defaultAppointmentDuration: clinic.defaultAppointmentDuration
      },
      newValuesJson: {
        ...parsed.data,
        workingDaysJson,
        workingHoursJson
      }
    });

    return {
      ok: true,
      message: "تم تحديث إعدادات العيادة بنجاح."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to update clinic settings."
    };
  }
}
