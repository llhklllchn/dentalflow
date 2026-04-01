"use server";

import { assertAppointmentStatusTransition } from "@/lib/appointments/scheduling";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { fromDatabaseEnum, toDatabaseEnum } from "@/lib/domain/mappers";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";
import { AppointmentStatus } from "@/types/domain";

export async function updateAppointmentStatus(
  appointmentId: string,
  nextStatus: AppointmentStatus
) {
  if (!appointmentId) {
    return {
      ok: false,
      message: "معرف الموعد مطلوب."
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من تغيير الحالة. وضع الديمو لا يحفظ التغيير فعليًا."
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (
      !hasPermission(user.role, "appointments:*") &&
      !hasPermission(user.role, "appointments:update-status")
    ) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتحديث حالة الموعد."
      };
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        clinicId: user.clinicId
      },
      include: {
        dentist: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!appointment) {
      return {
        ok: false,
        message: "الموعد غير موجود داخل العيادة الحالية."
      };
    }

    if (
      user.role === "dentist" &&
      appointment.dentist.userId !== user.id &&
      !hasPermission(user.role, "appointments:*")
    ) {
      return {
        ok: false,
        message: "يمكن للطبيب تعديل حالات مواعيده فقط."
      };
    }

    const currentStatus = fromDatabaseEnum<AppointmentStatus>(appointment.status);
    assertAppointmentStatusTransition(currentStatus, nextStatus);

    const now = new Date();
    const updatedAppointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: {
          id: appointment.id
        },
        data: {
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
                : appointment.confirmationStatus,
          cancelledAt: nextStatus === "cancelled" ? now : appointment.cancelledAt,
          completedAt: nextStatus === "completed" ? now : appointment.completedAt,
          updatedBy: user.id
        }
      });

      await tx.appointmentStatusLog.create({
        data: {
          clinicId: user.clinicId,
          appointmentId: appointment.id,
          oldStatus: appointment.status,
          newStatus: updated.status,
          changedBy: user.id
        }
      });

      return updated;
    });

    await writeAuditLog({
      entityType: "appointment",
      entityId: updatedAppointment.id,
      action: "update_status",
      oldValuesJson: {
        status: currentStatus
      },
      newValuesJson: {
        status: nextStatus
      }
    });

    return {
      ok: true,
      message: "تم تحديث حالة الموعد بنجاح."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر تحديث حالة الموعد."
    };
  }
}
