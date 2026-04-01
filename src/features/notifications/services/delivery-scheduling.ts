export function isNotificationReadyForDelivery(
  scheduledFor: Date | null | undefined,
  now = new Date()
) {
  return !scheduledFor || scheduledFor.getTime() <= now.getTime();
}

function formatHoursLabel(hours: number) {
  if (hours === 1) {
    return "ساعة واحدة";
  }

  if (hours === 2) {
    return "ساعتين";
  }

  if (hours >= 3 && hours <= 10) {
    return `${hours} ساعات`;
  }

  return `${hours} ساعة`;
}

export function getReminderLeadTimeLabel(templateKey?: string | null) {
  if (!templateKey) {
    return "24 ساعة";
  }

  if (templateKey.includes("same_day")) {
    return formatHoursLabel(3);
  }

  const exactHoursMatch = templateKey.match(/(\d+)\s*(?:h|hr|hrs|hour|hours)/i);

  if (exactHoursMatch) {
    return formatHoursLabel(Number(exactHoursMatch[1]));
  }

  return "24 ساعة";
}
