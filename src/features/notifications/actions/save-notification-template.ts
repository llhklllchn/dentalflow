"use server";

import { notificationTemplateFormSchema } from "@/features/notifications/schemas/notification-template.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { toDatabaseEnum } from "@/lib/domain/mappers";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

export async function saveNotificationTemplate(input: unknown) {
  const parsed = notificationTemplateFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من القالب. وضع الديمو لا يحفظه فعليًا.",
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

    const template = await prisma.notificationTemplate.upsert({
      where: {
        clinicId_templateKey_channel: {
          clinicId: user.clinicId,
          templateKey: parsed.data.templateKey,
          channel: toDatabaseEnum(parsed.data.channel) as "SMS" | "EMAIL" | "WHATSAPP"
        }
      },
      update: {
        name: parsed.data.name,
        subject: parsed.data.subject || null,
        body: parsed.data.body,
        isActive: true
      },
      create: {
        clinicId: user.clinicId,
        name: parsed.data.name,
        channel: toDatabaseEnum(parsed.data.channel) as "SMS" | "EMAIL" | "WHATSAPP",
        templateKey: parsed.data.templateKey,
        subject: parsed.data.subject || null,
        body: parsed.data.body,
        isActive: true
      }
    });

    await writeAuditLog({
      entityType: "notification_template",
      entityId: template.id,
      action: "upsert",
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم حفظ القالب بنجاح.",
      data: {
        id: template.id
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to save template."
    };
  }
}
