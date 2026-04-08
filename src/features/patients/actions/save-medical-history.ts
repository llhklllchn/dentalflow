"use server";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";
import { medicalHistoryFormSchema } from "@/features/patients/schemas/medical-history.schema";

export async function saveMedicalHistory(input: unknown) {
  const parsed = medicalHistoryFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من السجل الطبي. وضع الديمو لا يحفظ البيانات فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "patients:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتحديث التاريخ الطبي للمريض."
      };
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: parsed.data.patientId,
        clinicId: user.clinicId,
        archivedAt: null
      },
      select: {
        id: true
      }
    });

    if (!patient) {
      return {
        ok: false,
        message: "المريض غير موجود داخل العيادة الحالية."
      };
    }

    const medicalHistory = await prisma.patientMedicalHistory.upsert({
      where: {
        patientId: parsed.data.patientId
      },
      update: {
        allergies: parsed.data.allergies || null,
        chronicConditions: parsed.data.chronicConditions || null,
        currentMedications: parsed.data.currentMedications || null,
        smokingStatus: parsed.data.smokingStatus || null,
        pregnancyStatus: parsed.data.pregnancyStatus || null,
        medicalNotes: parsed.data.medicalNotes || null,
        updatedBy: user.id
      },
      create: {
        clinicId: user.clinicId,
        patientId: parsed.data.patientId,
        allergies: parsed.data.allergies || null,
        chronicConditions: parsed.data.chronicConditions || null,
        currentMedications: parsed.data.currentMedications || null,
        smokingStatus: parsed.data.smokingStatus || null,
        pregnancyStatus: parsed.data.pregnancyStatus || null,
        medicalNotes: parsed.data.medicalNotes || null,
        updatedBy: user.id
      }
    });

    await writeAuditLog({
      entityType: "patient_medical_history",
      entityId: medicalHistory.id,
      action: "upsert",
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم حفظ التاريخ الطبي بنجاح.",
      data: {
        id: medicalHistory.id
      }
    };
  } catch (error) {
    return {
      ok: false,
        message: error instanceof Error ? error.message : "تعذر حفظ التاريخ الطبي."
    };
  }
}
