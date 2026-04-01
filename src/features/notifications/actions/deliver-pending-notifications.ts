"use server";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

import { deliverPendingNotificationsForClinic } from "@/features/notifications/services/deliver-pending-notifications-for-clinic";

export async function deliverPendingNotifications(limit = 50) {
  try {
    const user = await getScopedSessionUser();

    if (
      !hasPermission(user.role, "settings:update") &&
      !hasPermission(user.role, "appointments:*")
    ) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتسليم الإشعارات."
      };
    }

    const result = await deliverPendingNotificationsForClinic({
      clinicId: user.clinicId,
      take: limit
    });

    await writeAuditLog({
      entityType: "notification",
      entityId: user.clinicId,
      action: "deliver_pending",
      newValuesJson: result
    });

    return {
      ok: true,
      message: `تمت معالجة ${result.processedCount} إشعارات. نجح ${result.sentCount} وفشل ${result.failedCount}.`,
      data: result
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر تسليم الإشعارات."
    };
  }
}
