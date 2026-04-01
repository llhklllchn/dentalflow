import { prisma } from "@/lib/db/prisma";
import { buildNotificationEmail } from "@/lib/communications/templates";
import { sendEmail } from "@/lib/communications/email";
import { sendWebhookNotification } from "@/lib/communications/webhook";
import { fromDatabaseEnum } from "@/lib/domain/mappers";
import { NotificationChannel } from "@/types/domain";

import {
  buildNotificationSubject,
  normalizeDeliveryError,
  resolveNotificationRecipient
} from "./delivery-helpers";
import { isNotificationReadyForDelivery } from "./delivery-scheduling";

export async function deliverPendingNotificationsForClinic(input: {
  clinicId: string;
  take?: number;
}) {
  const now = new Date();
  const pendingNotifications = await prisma.notification.findMany({
    where: {
      clinicId: input.clinicId,
      status: "PENDING",
      OR: [
        {
          scheduledFor: null
        },
        {
          scheduledFor: {
            lte: now
          }
        }
      ]
    },
    orderBy: [
      {
        scheduledFor: "asc"
      },
      {
        createdAt: "asc"
      }
    ],
    take: input.take ?? 50,
    include: {
      patient: true
    }
  });

  const templates = await prisma.notificationTemplate.findMany({
    where: {
      clinicId: input.clinicId
    }
  });

  const clinic = await prisma.clinic.findUnique({
    where: {
      id: input.clinicId
    },
    select: {
      name: true
    }
  });

  const templateMap = new Map(
    templates.map((template) => [
      `${template.templateKey}:${template.channel}`,
      template
    ])
  );

  let sentCount = 0;
  let failedCount = 0;

  for (const notification of pendingNotifications) {
    if (!isNotificationReadyForDelivery(notification.scheduledFor, now)) {
      continue;
    }

    const channel = fromDatabaseEnum<NotificationChannel>(notification.channel);
    const recipient = resolveNotificationRecipient({
      channel,
      email: notification.patient?.email,
      phone: notification.patient?.phone,
      whatsappPhone: notification.patient?.whatsappPhone
    });

    if (!recipient) {
      failedCount += 1;
      await prisma.notification.update({
        where: {
          id: notification.id
        },
        data: {
          status: "FAILED",
          errorMessage: "No valid recipient found for this notification."
        }
      });
      continue;
    }

    const template = templateMap.get(`${notification.templateKey}:${notification.channel}`);

    try {
      if (channel === "email") {
        const emailMessage = buildNotificationEmail({
          clinicName: clinic?.name ?? "DentFlow",
          subject: buildNotificationSubject(template?.subject),
          heading: buildNotificationSubject(template?.subject),
          messageBody: notification.messageBody
        });

        await sendEmail({
          to: recipient,
          subject: emailMessage.subject,
          text: emailMessage.text,
          html: emailMessage.html
        });
      } else {
        await sendWebhookNotification({
          channel,
          to: recipient,
          subject: template?.subject ?? undefined,
          messageBody: notification.messageBody,
          clinicId: input.clinicId,
          patientId: notification.patientId,
          appointmentId: notification.appointmentId,
          notificationId: notification.id
        });
      }

      sentCount += 1;
      await prisma.notification.update({
        where: {
          id: notification.id
        },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null
        }
      });
    } catch (error) {
      failedCount += 1;
      await prisma.notification.update({
        where: {
          id: notification.id
        },
        data: {
          status: "FAILED",
          errorMessage: normalizeDeliveryError(error)
        }
      });
    }
  }

  return {
    clinicId: input.clinicId,
    processedCount: pendingNotifications.length,
    sentCount,
    failedCount
  };
}
