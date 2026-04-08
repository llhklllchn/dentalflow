"use server";

import { z } from "zod";

import { dentistProfileFieldsSchema } from "@/features/dentists/schemas/dentist-profile.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

const updateDentistProfileSchema = dentistProfileFieldsSchema
  .omit({ userId: true })
  .extend({
    dentistId: z.string().min(1, "معرف الطبيب مطلوب.")
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "وقت النهاية يجب أن يكون بعد وقت البداية.",
    path: ["endTime"]
  });

export async function updateDentistProfile(input: unknown) {
  const parsed = updateDentistProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من تعديل ملف الطبيب. وضع الديمو لا يحفظه فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "dentists:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإدارة ملفات الأطباء."
      };
    }

    const dentist = await prisma.dentist.findFirst({
      where: {
        id: parsed.data.dentistId,
        clinicId: user.clinicId
      }
    });

    if (!dentist) {
      return {
        ok: false,
        message: "ملف الطبيب غير موجود داخل العيادة الحالية."
      };
    }

    const updatedDentist = await prisma.dentist.update({
      where: {
        id: dentist.id
      },
      data: {
        specialty: parsed.data.specialty || null,
        licenseNumber: parsed.data.licenseNumber || null,
        colorCode: parsed.data.colorCode || "#0F766E",
        defaultAppointmentDuration: parsed.data.defaultAppointmentDuration,
        workingHoursJson: {
          start: parsed.data.startTime,
          end: parsed.data.endTime
        }
      }
    });

    await writeAuditLog({
      entityType: "dentist",
      entityId: updatedDentist.id,
      action: "update",
      oldValuesJson: {
        specialty: dentist.specialty,
        licenseNumber: dentist.licenseNumber,
        colorCode: dentist.colorCode,
        defaultAppointmentDuration: dentist.defaultAppointmentDuration,
        workingHoursJson: dentist.workingHoursJson
      },
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم تحديث ملف الطبيب بنجاح.",
      data: {
        id: updatedDentist.id
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر تحديث ملف الطبيب."
    };
  }
}
