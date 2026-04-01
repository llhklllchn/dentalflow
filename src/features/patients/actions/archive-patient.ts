"use server";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

export async function archivePatient(patientId: string) {
  if (!patientId) {
    return {
      ok: false,
      message: "معرف المريض مطلوب."
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من طلب الأرشفة. وضع الديمو لا يغير البيانات فعليًا."
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "patients:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لأرشفة المرضى."
      };
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        clinicId: user.clinicId,
        archivedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    });

    if (!patient) {
      return {
        ok: false,
        message: "المريض غير موجود أو تمت أرشفته مسبقًا."
      };
    }

    await prisma.patient.update({
      where: {
        id: patient.id
      },
      data: {
        archivedAt: new Date()
      }
    });

    await writeAuditLog({
      entityType: "patient",
      entityId: patient.id,
      action: "archive",
      newValuesJson: {
        archivedAt: new Date().toISOString()
      }
    });

    return {
      ok: true,
      message: "تمت أرشفة المريض بنجاح."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر أرشفة المريض."
    };
  }
}
