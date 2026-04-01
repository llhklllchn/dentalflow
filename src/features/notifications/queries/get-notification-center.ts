import { notificationCenter } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { formatDate, formatFullName, fromDatabaseEnum } from "@/lib/domain/mappers";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { NotificationChannel, NotificationDeliveryStatus } from "@/types/domain";

import { getReminderLeadTimeLabel } from "../services/delivery-scheduling";

type GetNotificationCenterOptions = {
  search?: string;
  status?: string;
  channel?: string;
};

const notificationStatuses = ["all", "pending", "sent", "failed"] as const;
const notificationChannels = ["all", "whatsapp", "sms", "email"] as const;

function normalizeNotificationStatus(
  value: string | undefined
): (typeof notificationStatuses)[number] {
  return notificationStatuses.includes(value as (typeof notificationStatuses)[number])
    ? (value as (typeof notificationStatuses)[number])
    : "all";
}

function normalizeNotificationChannel(
  value: string | undefined
): (typeof notificationChannels)[number] {
  return notificationChannels.includes(value as (typeof notificationChannels)[number])
    ? (value as (typeof notificationChannels)[number])
    : "all";
}

export async function getNotificationCenter(options?: GetNotificationCenterOptions) {
  const search = options?.search?.trim().toLowerCase();
  const status = normalizeNotificationStatus(options?.status?.trim().toLowerCase());
  const channel = normalizeNotificationChannel(options?.channel?.trim().toLowerCase());

  return await runWithDataSource({
    demo: async () => {
      const logs = notificationCenter.logs.filter((log) => {
        const matchesSearch = search
          ? `${log.patientName} ${log.templateKey}`.toLowerCase().includes(search)
          : true;
        const matchesStatus = status === "all" ? true : log.status === status;
        const matchesChannel = channel === "all" ? true : log.channel === channel;

        return matchesSearch && matchesStatus && matchesChannel;
      });

      const primaryTemplate =
        notificationCenter.templates.find((template) => template.active) ??
        notificationCenter.templates[0];

      return {
        ...notificationCenter,
        logs,
        reminderSettings: {
          ...notificationCenter.reminderSettings,
          leadTime: getReminderLeadTimeLabel(primaryTemplate?.templateKey),
          channel: primaryTemplate?.channel ?? notificationCenter.reminderSettings.channel,
          messagePreview:
            primaryTemplate?.body ?? notificationCenter.reminderSettings.messagePreview
        }
      };
    },
    live: async () => {
      const clinicId = await getSessionClinicId();
      const [templates, logs] = await Promise.all([
        prisma.notificationTemplate.findMany({
          where: {
            clinicId
          },
          orderBy: {
            createdAt: "asc"
          }
        }),
        prisma.notification.findMany({
          where: {
            clinicId,
            ...(status !== "all"
              ? {
                  status: status.toUpperCase() as "PENDING" | "SENT" | "FAILED"
                }
              : {}),
            ...(channel !== "all"
              ? {
                  channel: channel.toUpperCase() as "SMS" | "EMAIL" | "WHATSAPP"
                }
              : {}),
            ...(search
              ? {
                  OR: [
                    {
                      templateKey: {
                        contains: search,
                        mode: "insensitive"
                      }
                    },
                    {
                      patient: {
                        is: {
                          firstName: {
                            contains: search,
                            mode: "insensitive"
                          }
                        }
                      }
                    },
                    {
                      patient: {
                        is: {
                          lastName: {
                            contains: search,
                            mode: "insensitive"
                          }
                        }
                      }
                    },
                    {
                      patient: {
                        is: {
                          phone: {
                            contains: search,
                            mode: "insensitive"
                          }
                        }
                      }
                    }
                  ]
                }
              : {})
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 24,
          include: {
            patient: true
          }
        })
      ]);

      const primaryTemplate =
        templates.find((template) => template.isActive) ?? templates[0];

      return {
        templates: templates.map((template) => ({
          id: template.id,
          name: template.name,
          channel: fromDatabaseEnum<NotificationChannel>(template.channel),
          templateKey: template.templateKey,
          subject: template.subject ?? "",
          body: template.body,
          active: template.isActive
        })),
        logs: logs.map((log) => ({
          id: log.id,
          patientName: log.patient
            ? formatFullName(log.patient.firstName, log.patient.lastName)
            : "مريض غير محدد",
          channel: fromDatabaseEnum<NotificationChannel>(log.channel),
          templateKey: log.templateKey ?? "manual_message",
          status: fromDatabaseEnum<NotificationDeliveryStatus>(log.status),
          scheduledFor: formatDate(log.scheduledFor ?? log.createdAt),
          sentAt: formatDate(log.sentAt),
          errorMessage: log.errorMessage?.trim() || undefined
        })),
        reminderSettings: {
          enabled: templates.some((template) => template.isActive),
          leadTime: getReminderLeadTimeLabel(primaryTemplate?.templateKey),
          channel: primaryTemplate
            ? fromDatabaseEnum<NotificationChannel>(primaryTemplate.channel)
            : "whatsapp",
          messagePreview:
            primaryTemplate?.body ??
            "مرحبًا {patient_name}، لديك موعد قريب في العيادة. نرجو تأكيد الحضور."
        }
      };
    }
  });
}
