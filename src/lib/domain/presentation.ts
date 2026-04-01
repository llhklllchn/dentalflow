export function splitNotes(value?: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function calculateCompletionPercentage(total: number, completed: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

export function formatWorkingHours(value: unknown) {
  if (!value) {
    return "حسب إعدادات العيادة";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.join(" | ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return "حسب إعدادات العيادة";
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfToday() {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
}

export function daysAgo(days: number) {
  const date = startOfToday();
  date.setDate(date.getDate() - days);
  return date;
}
