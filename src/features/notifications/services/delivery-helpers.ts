import { NotificationChannel } from "@/types/domain";

type NotificationRecipientInput = {
  channel: NotificationChannel;
  email?: string | null;
  phone?: string | null;
  whatsappPhone?: string | null;
};

export function resolveNotificationRecipient(input: NotificationRecipientInput) {
  if (input.channel === "email") {
    return input.email?.trim() || null;
  }

  if (input.channel === "whatsapp") {
    return input.whatsappPhone?.trim() || input.phone?.trim() || null;
  }

  return input.phone?.trim() || null;
}

export function buildNotificationSubject(templateSubject: string | null | undefined) {
  return templateSubject?.trim() || "إشعار من العيادة";
}

export function normalizeDeliveryError(error: unknown) {
  const message = error instanceof Error ? error.message : "تعذر تسليم الإشعار.";
  return message.slice(0, 500);
}
