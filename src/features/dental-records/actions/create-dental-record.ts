"use server";

import { dentalRecordFormSchema } from "@/features/dental-records/schemas/dental-record-form.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

function parseToothNumbers(value?: string) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createDentalRecord(input: unknown) {
  const parsed = dentalRecordFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من بيانات السجل الطبي. وضع الديمو لا يحفظ البيانات فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "dental-records:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإضافة السجلات الطبية."
      };
    }

    const visitDate = new Date(parsed.data.appointmentDate);
    const visitDateEnd = new Date(visitDate);
    visitDateEnd.setDate(visitDateEnd.getDate() + 1);

    const [patient, dentist, appointment] = await Promise.all([
      prisma.patient.findFirst({
        where: {
          id: parsed.data.patientId,
          clinicId: user.clinicId,
          archivedAt: null
        },
        select: {
          id: true
        }
      }),
      prisma.dentist.findFirst({
        where: {
          id: parsed.data.dentistId,
          clinicId: user.clinicId
        },
        select: {
          id: true
        }
      }),
      prisma.appointment.findFirst({
        where: {
          clinicId: user.clinicId,
          patientId: parsed.data.patientId,
          dentistId: parsed.data.dentistId,
          startsAt: {
            gte: visitDate,
            lt: visitDateEnd
          }
        },
        orderBy: {
          startsAt: "asc"
        },
        select: {
          id: true
        }
      })
    ]);

    if (!patient || !dentist) {
      return {
        ok: false,
        message: "المريض أو الطبيب غير متاحين داخل العيادة الحالية."
      };
    }

    const toothNumbers = parseToothNumbers(parsed.data.toothNumbers);

    const dentalRecord = await prisma.$transaction(async (tx) => {
      const createdRecord = await tx.dentalRecord.create({
        data: {
          clinicId: user.clinicId,
          patientId: parsed.data.patientId,
          dentistId: parsed.data.dentistId,
          appointmentId: appointment?.id ?? null,
          chiefComplaint: parsed.data.chiefComplaint || null,
          examinationNotes: parsed.data.examinationNotes || null,
          diagnosis: parsed.data.diagnosis || null,
          procedureDone: parsed.data.procedureDone || null,
          prescription: parsed.data.prescription || null,
          followUpNotes: parsed.data.followUpNotes || null
        }
      });

      for (const toothNumber of toothNumbers) {
        await tx.toothRecord.upsert({
          where: {
            patientId_toothNumber: {
              patientId: parsed.data.patientId,
              toothNumber
            }
          },
          update: {
            status: "UNDER_OBSERVATION",
            notes: parsed.data.followUpNotes || parsed.data.diagnosis || null,
            updatedBy: user.id
          },
          create: {
            clinicId: user.clinicId,
            patientId: parsed.data.patientId,
            toothNumber,
            status: "UNDER_OBSERVATION",
            notes: parsed.data.followUpNotes || parsed.data.diagnosis || null,
            updatedBy: user.id
          }
        });
      }

      return createdRecord;
    });

    await writeAuditLog({
      entityType: "dental_record",
      entityId: dentalRecord.id,
      action: "create",
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم حفظ السجل الطبي بنجاح.",
      data: {
        id: dentalRecord.id
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to create dental record."
    };
  }
}
