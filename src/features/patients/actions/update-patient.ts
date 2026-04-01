"use server";

import { patientFormSchema } from "@/features/patients/schemas/patient-form.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

export async function updatePatient(patientId: string, input: unknown) {
  const parsed = patientFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (!patientId) {
    return {
      ok: false,
      message: "معرف المريض مطلوب."
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من بيانات المريض. وضع الديمو لا يحفظ التعديل فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "patients:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتعديل المرضى."
      };
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        clinicId: user.clinicId,
        archivedAt: null
      }
    });

    if (!patient) {
      return {
        ok: false,
        message: "المريض غير موجود داخل العيادة الحالية."
      };
    }

    const duplicatePhone = await prisma.patient.findFirst({
      where: {
        clinicId: user.clinicId,
        id: {
          not: patientId
        },
        phone: parsed.data.phone,
        archivedAt: null
      },
      select: {
        id: true
      }
    });

    if (duplicatePhone) {
      return {
        ok: false,
        message: "يوجد مريض آخر مسجل بنفس رقم الهاتف داخل هذه العيادة."
      };
    }

    await prisma.patient.update({
      where: {
        id: patientId
      },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        gender: parsed.data.gender ?? null,
        dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
        phone: parsed.data.phone,
        whatsappPhone: parsed.data.whatsappPhone || null,
        email: parsed.data.email || null,
        nationalId: parsed.data.nationalId || null,
        city: parsed.data.city || null,
        address: parsed.data.address || null,
        notes: parsed.data.notes || null
      }
    });

    await writeAuditLog({
      entityType: "patient",
      entityId: patientId,
      action: "update",
      oldValuesJson: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        email: patient.email
      },
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم تحديث بيانات المريض بنجاح."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر تحديث بيانات المريض."
    };
  }
}
