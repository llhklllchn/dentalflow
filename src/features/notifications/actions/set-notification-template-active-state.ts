"use server";

import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

const setTemplateStateSchema = z.object({
  templateId: z.string().min(1, "معرف القالب مطلوب."),
  isActive: z.boolean()
});

export async function setNotificationTemplateActiveState(input: unknown) {
  const parsed = setTemplateStateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من حالة القالب. وضع الديمو لا يطبق التغيير فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "settings:update")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتعديل قوالب الإشعارات."
      };
    }

    const template = await prisma.notificationTemplate.findFirst({
      where: {
        id: parsed.data.templateId,
        clinicId: user.clinicId
      }
    });

    if (!template) {
      return {
        ok: false,
        message: "القالب غير موجود داخل العيادة الحالية."
      };
    }

    await prisma.notificationTemplate.update({
      where: {
        id: template.id
      },
      data: {
        isActive: parsed.data.isActive
      }
    });

    await writeAuditLog({
      entityType: "notification_template",
      entityId: template.id,
      action: "update-status",
      oldValuesJson: {
        isActive: template.isActive
      },
      newValuesJson: {
        isActive: parsed.data.isActive
      }
    });

    return {
      ok: true,
      message: parsed.data.isActive ? "تم تفعيل القالب بنجاح." : "تم إيقاف القالب بنجاح."
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "تعذر تحديث حالة القالب."
    };
  }
}
