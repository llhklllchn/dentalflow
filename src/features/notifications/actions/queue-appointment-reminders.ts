"use server";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";
import { queueAppointmentRemindersForClinic } from "@/features/notifications/services/queue-appointment-reminders-for-clinic";

export async function queueAppointmentReminders(hoursAhead = 24) {
  try {
    const user = await getScopedSessionUser();

    if (
      !hasPermission(user.role, "settings:update") &&
      !hasPermission(user.role, "appointments:*")
    ) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإعداد التذكيرات."
      };
    }

    const result = await queueAppointmentRemindersForClinic({
      clinicId: user.clinicId,
      hoursAhead
    });

    await writeAuditLog({
      entityType: "notification",
      entityId: result.templateId ?? result.templateKey ?? "appointment_reminders",
      action: "queue_reminders",
      newValuesJson: {
        hoursAhead,
        queuedCount: result.queuedCount,
        skippedCount: result.skippedCount
      }
    });

    return {
      ok: true,
      message: `تمت جدولة ${result.queuedCount} تذكيرات بنجاح.`,
      data: {
        queuedCount: result.queuedCount,
        skippedCount: result.skippedCount
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر تجهيز التذكيرات."
    };
  }
}
