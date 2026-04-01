"use server";

import { patientFormSchema } from "@/features/patients/schemas/patient-form.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

export async function createPatient(input: unknown) {
  const parsed = patientFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من بيانات المريض. وضع الديمو لا يحفظ البيانات فعليًا.",
      data: {
        id: "demo-patient"
      }
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "patients:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإضافة المرضى."
      };
    }

    const existingPatient = await prisma.patient.findFirst({
      where: {
        clinicId: user.clinicId,
        phone: parsed.data.phone,
        archivedAt: null
      },
      select: {
        id: true
      }
    });

    if (existingPatient) {
      return {
        ok: false,
        message: "يوجد مريض آخر مسجل بنفس رقم الهاتف داخل هذه العيادة."
      };
    }

    const createdPatient = await prisma.patient.create({
      data: {
        clinicId: user.clinicId,
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
      entityId: createdPatient.id,
      action: "create",
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم إنشاء المريض بنجاح.",
      data: {
        id: createdPatient.id
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to create patient."
    };
  }
}
