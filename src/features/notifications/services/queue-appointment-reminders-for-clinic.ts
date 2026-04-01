import { prepareAppointmentReminders } from "@/features/notifications/jobs/prepare-appointment-reminders";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";

function buildReminderMessage(
  templateBody: string | null | undefined,
  reminder: {
    patientName: string;
    dentistName: string;
    appointmentTime: string;
    messageBody: string;
  }
) {
  if (!templateBody) {
    return reminder.messageBody;
  }

  return templateBody
    .replaceAll("{patient_name}", reminder.patientName)
    .replaceAll("{dentist_name}", reminder.dentistName)
    .replaceAll("{appointment_time}", reminder.appointmentTime);
}

export async function queueAppointmentRemindersForClinic(input: {
  clinicId: string;
  hoursAhead?: number;
}) {
  const hoursAhead = input.hoursAhead ?? 24;
  const reminders = await prepareAppointmentReminders({
    clinicId: input.clinicId,
    hoursAhead
  });

  if (shouldUseDemoData()) {
    return {
      clinicId: input.clinicId,
      queuedCount: reminders.length,
      skippedCount: 0
    };
  }

  const templateKey = hoursAhead <= 3 ? "appointment_same_day" : "appointment_reminder_24h";
  const activeTemplate =
    (await prisma.notificationTemplate.findFirst({
      where: {
        clinicId: input.clinicId,
        templateKey,
        isActive: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })) ??
    (await prisma.notificationTemplate.findFirst({
      where: {
        clinicId: input.clinicId,
        isActive: true
      },
      orderBy: {
        createdAt: "desc"
      }
    }));

  const existingNotifications = await prisma.notification.findMany({
    where: {
      clinicId: input.clinicId,
      appointmentId: {
        in: reminders.map((reminder) => reminder.appointmentId)
      },
      templateKey: activeTemplate?.templateKey ?? templateKey,
      status: {
        in: ["PENDING", "SENT"]
      }
    },
    select: {
      appointmentId: true
    }
  });

  const existingAppointmentIds = new Set(
    existingNotifications
      .map((notification) => notification.appointmentId)
      .filter(Boolean)
  );

  const queueItems = reminders.filter(
    (reminder) => !existingAppointmentIds.has(reminder.appointmentId)
  );

  if (queueItems.length > 0) {
    const deliveryChannel = activeTemplate?.channel ?? "WHATSAPP";

    await prisma.notification.createMany({
      data: queueItems.map((reminder) => ({
        clinicId: input.clinicId,
        patientId: reminder.patientId,
        appointmentId: reminder.appointmentId,
        channel: deliveryChannel,
        templateKey: activeTemplate?.templateKey ?? templateKey,
        messageBody: buildReminderMessage(activeTemplate?.body, reminder),
        status: "PENDING",
        scheduledFor: new Date()
      }))
    });
  }

  return {
    clinicId: input.clinicId,
    queuedCount: queueItems.length,
    skippedCount: reminders.length - queueItems.length,
    templateKey: activeTemplate?.templateKey ?? templateKey,
    templateId: activeTemplate?.id ?? null
  };
}
