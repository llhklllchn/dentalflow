"use server";

import { z } from "zod";

import { appointmentFormSchema } from "@/features/appointments/schemas/appointment-form.schema";
import {
  assertAppointmentStatusTransition,
  ensureValidAppointmentWindow,
  hasAppointmentOverlap
} from "@/lib/appointments/scheduling";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { fromDatabaseEnum, toDatabaseEnum } from "@/lib/domain/mappers";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";
import { AppointmentStatus } from "@/types/domain";

const updateAppointmentSchema = appointmentFormSchema.extend({
  appointmentId: z.string().min(1, "Appointment id is required.")
});

export async function updateAppointment(input: unknown) {
  const parsed = updateAppointmentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من تعديل الموعد. وضع الديمو لا يحفظه فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "appointments:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتعديل المواعيد."
      };
    }

    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = new Date(parsed.data.endsAt);
    ensureValidAppointmentWindow(startsAt, endsAt);

    const [existingAppointment, patient, dentist, service, existingAppointments] = await Promise.all([
      prisma.appointment.findFirst({
        where: {
          id: parsed.data.appointmentId,
          clinicId: user.clinicId
        }
      }),
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
          id: {
            not: parsed.data.appointmentId
          },
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

    if (!existingAppointment) {
      return {
        ok: false,
        message: "الموعد غير موجود داخل العيادة الحالية."
      };
    }

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

    const currentStatus = fromDatabaseEnum<AppointmentStatus>(existingAppointment.status);
    const nextStatus = parsed.data.status;

    if (currentStatus !== nextStatus) {
      assertAppointmentStatusTransition(currentStatus, nextStatus);
    }

    const updatedAppointment = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.update({
        where: {
          id: existingAppointment.id
        },
        data: {
          patientId: parsed.data.patientId,
          dentistId: parsed.data.dentistId,
          serviceId: parsed.data.serviceId,
          startsAt,
          endsAt,
          status: toDatabaseEnum(nextStatus) as
            | "SCHEDULED"
            | "CONFIRMED"
            | "CHECKED_IN"
            | "IN_PROGRESS"
            | "COMPLETED"
            | "CANCELLED"
            | "NO_SHOW",
          confirmationStatus:
            nextStatus === "confirmed"
              ? "confirmed"
              : nextStatus === "scheduled"
                ? "pending"
                : existingAppointment.confirmationStatus,
          notes: parsed.data.notes || null,
          updatedBy: user.id,
          cancelledAt: nextStatus === "cancelled" ? new Date() : null,
          completedAt: nextStatus === "completed" ? new Date() : null
        }
      });

      if (currentStatus !== nextStatus) {
        await tx.appointmentStatusLog.create({
          data: {
            clinicId: user.clinicId,
            appointmentId: appointment.id,
            oldStatus: existingAppointment.status,
            newStatus: appointment.status,
            changedBy: user.id
          }
        });
      }

      return appointment;
    });

    await writeAuditLog({
      entityType: "appointment",
      entityId: updatedAppointment.id,
      action: "update",
      oldValuesJson: {
        patientId: existingAppointment.patientId,
        dentistId: existingAppointment.dentistId,
        serviceId: existingAppointment.serviceId,
        startsAt: existingAppointment.startsAt.toISOString(),
        endsAt: existingAppointment.endsAt.toISOString(),
        status: currentStatus,
        notes: existingAppointment.notes
      },
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم تحديث الموعد بنجاح."
    };
  } catch (error) {
    return {
      ok: false,
        message: error instanceof Error ? error.message : "تعذر تحديث الموعد."
    };
  }
}
