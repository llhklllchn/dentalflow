"use server";

import { appointmentFormSchema } from "@/features/appointments/schemas/appointment-form.schema";
import {
  ensureValidAppointmentWindow,
  hasAppointmentOverlap
} from "@/lib/appointments/scheduling";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { toDatabaseEnum } from "@/lib/domain/mappers";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

export async function createAppointment(input: unknown) {
  const parsed = appointmentFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من بيانات الموعد. وضع الديمو لا يحفظ أو يفحص التعارض فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "appointments:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإنشاء المواعيد."
      };
    }

    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = new Date(parsed.data.endsAt);

    ensureValidAppointmentWindow(startsAt, endsAt);

    const [patient, dentist, service, existingAppointments] = await Promise.all([
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
      prisma.service.findFirst({
        where: {
          id: parsed.data.serviceId,
          clinicId: user.clinicId
        },
        select: {
          id: true
        }
      }),
      prisma.appointment.findMany({
        where: {
          clinicId: user.clinicId,
          dentistId: parsed.data.dentistId,
          status: {
            in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"]
          },
          startsAt: {
            lt: endsAt
          },
          endsAt: {
            gt: startsAt
          }
        },
        select: {
          startsAt: true,
          endsAt: true
        }
      })
    ]);

    if (!patient || !dentist || !service) {
      return {
        ok: false,
        message: "المريض أو الطبيب أو الخدمة غير متاحين داخل العيادة الحالية."
      };
    }

    if (hasAppointmentOverlap({ startsAt, endsAt, existingAppointments })) {
      return {
        ok: false,
        message: "يوجد تعارض مع موعد آخر للطبيب في نفس الفترة."
      };
    }

    const createdAppointment = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          clinicId: user.clinicId,
          patientId: parsed.data.patientId,
          dentistId: parsed.data.dentistId,
          serviceId: parsed.data.serviceId,
          startsAt,
          endsAt,
          status: toDatabaseEnum(parsed.data.status) as
            | "SCHEDULED"
            | "CONFIRMED"
            | "CHECKED_IN"
            | "IN_PROGRESS"
            | "COMPLETED"
            | "CANCELLED"
            | "NO_SHOW",
          confirmationStatus:
            parsed.data.status === "confirmed" ? "confirmed" : "pending",
          notes: parsed.data.notes || null,
          createdBy: user.id,
          updatedBy: user.id
        }
      });

      await tx.appointmentStatusLog.create({
        data: {
          clinicId: user.clinicId,
          appointmentId: appointment.id,
          oldStatus: null,
          newStatus: appointment.status,
          changedBy: user.id
        }
      });

      return appointment;
    });

    await writeAuditLog({
      entityType: "appointment",
      entityId: createdAppointment.id,
      action: "create",
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم إنشاء الموعد بنجاح.",
      data: {
        id: createdAppointment.id
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to create appointment."
    };
  }
}
