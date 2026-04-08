"use server";

import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

const setStaffUserStatusSchema = z.object({
  userId: z.string().min(1, "User id is required."),
  nextStatus: z.enum(["ACTIVE", "INACTIVE"])
});

export async function setStaffUserStatus(input: unknown) {
  const parsed = setStaffUserStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message:
        parsed.data.nextStatus === "ACTIVE"
          ? "تم التحقق من إعادة تفعيل المستخدم."
          : "تم التحقق من تعطيل المستخدم.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "staff:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإدارة الموظفين."
      };
    }

    if (user.id === parsed.data.userId) {
      return {
        ok: false,
        message: "لا يمكنك تعديل حالة حسابك الحالي من هذه الشاشة."
      };
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: parsed.data.userId,
        clinicId: user.clinicId
      }
    });

    if (!targetUser) {
      return {
        ok: false,
        message: "المستخدم غير موجود داخل العيادة الحالية."
      };
    }

    if (targetUser.role === "OWNER") {
      return {
        ok: false,
        message: "لا يمكن تعطيل حساب المالك من هذه الشاشة."
      };
    }

    await prisma.user.update({
      where: {
        id: targetUser.id
      },
      data: {
        status: parsed.data.nextStatus
      }
    });

    await writeAuditLog({
      entityType: "user",
      entityId: targetUser.id,
      action: parsed.data.nextStatus === "ACTIVE" ? "reactivate" : "deactivate",
      oldValuesJson: {
        status: targetUser.status
      },
      newValuesJson: {
        status: parsed.data.nextStatus
      }
    });

    return {
      ok: true,
      message:
        parsed.data.nextStatus === "ACTIVE"
          ? "تمت إعادة تفعيل المستخدم."
          : "تم تعطيل المستخدم."
    };
  } catch (error) {
    return {
      ok: false,
        message: error instanceof Error ? error.message : "تعذر تحديث حالة المستخدم."
    };
  }
}
