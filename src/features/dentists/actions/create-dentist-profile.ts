"use server";

import { dentistProfileFormSchema } from "@/features/dentists/schemas/dentist-profile.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

export async function createDentistProfile(input: unknown) {
  const parsed = dentistProfileFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من بيانات الطبيب. وضع الديمو لا يحفظ الملف فعليًا.",
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

    const targetUser = await prisma.user.findFirst({
      where: {
        id: parsed.data.userId,
        clinicId: user.clinicId,
        role: "DENTIST",
        status: "ACTIVE"
      },
      include: {
        dentistProfile: true
      }
    });

    if (!targetUser) {
      return {
        ok: false,
        message: "المستخدم المحدد غير متاح كطبيب نشط داخل هذه العيادة."
      };
    }

    if (targetUser.dentistProfile) {
      return {
        ok: false,
        message: "هذا المستخدم مرتبط بالفعل بملف طبيب."
      };
    }

    const dentist = await prisma.dentist.create({
      data: {
        clinicId: user.clinicId,
        userId: parsed.data.userId,
        specialty: parsed.data.specialty || null,
        licenseNumber: parsed.data.licenseNumber || null,
        colorCode: parsed.data.colorCode || "#0F766E",
        defaultAppointmentDuration: parsed.data.defaultAppointmentDuration,
        workingDaysJson: ["sunday", "monday", "tuesday", "wednesday", "thursday"],
        workingHoursJson: {
          start: parsed.data.startTime,
          end: parsed.data.endTime
        }
      }
    });

    await writeAuditLog({
      entityType: "dentist",
      entityId: dentist.id,
      action: "create",
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم إنشاء ملف الطبيب بنجاح.",
      data: {
        id: dentist.id
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر إنشاء ملف الطبيب."
    };
  }
}
