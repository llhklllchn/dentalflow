import { NotificationChannel } from "@/types/domain";

type SendWebhookNotificationInput = {
  channel: Exclude<NotificationChannel, "email">;
  to: string;
  subject?: string;
  messageBody: string;
  clinicId: string;
  patientId?: string | null;
  appointmentId?: string | null;
  notificationId: string;
};

function getWebhookConfig() {
  const url = process.env.NOTIFICATION_WEBHOOK_URL?.trim();
  const secret = process.env.NOTIFICATION_WEBHOOK_SECRET?.trim();

  if (!url || !secret) {
    throw new Error("Notification webhook is not fully configured.");
  }

  return { url, secret };
}

export function isNotificationWebhookConfigured() {
  try {
    getWebhookConfig();
    return true;
  } catch {
    return false;
  }
}

export async function sendWebhookNotification(input: SendWebhookNotificationInput) {
  const config = getWebhookConfig();
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.secret}`
    },
    body: JSON.stringify(input),
    cache: "no-store"
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Notification webhook returned ${response.status}: ${responseText || "Unexpected response."}`
    );
  }
}
