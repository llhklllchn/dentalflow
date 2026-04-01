import { AppointmentStatus } from "@/types/domain";

export const patientSegments = ["all", "open_balance", "recent_visit", "no_visit"] as const;
export type PatientSegment = (typeof patientSegments)[number];

export const appointmentViews = ["all", "ready", "active", "follow_up", "completed"] as const;
export type AppointmentView = (typeof appointmentViews)[number];

export const invoiceViews = ["all", "open_balance", "attention", "settled"] as const;
export type InvoiceView = (typeof invoiceViews)[number];

export const paymentRanges = ["all", "today", "7d", "30d"] as const;
export type PaymentRange = (typeof paymentRanges)[number];

function normalizeValue<T extends readonly string[]>(
  options: T,
  value: string | undefined
): T[number] {
  return options.includes(value as T[number]) ? (value as T[number]) : options[0];
}

export function normalizePatientSegment(value: string | undefined) {
  return normalizeValue(patientSegments, value);
}

export function normalizeAppointmentView(value: string | undefined) {
  return normalizeValue(appointmentViews, value);
}

export function normalizeInvoiceView(value: string | undefined) {
  return normalizeValue(invoiceViews, value);
}

export function normalizePaymentRange(value: string | undefined) {
  return normalizeValue(paymentRanges, value);
}

export function getAppointmentStatusesForView(view: AppointmentView): AppointmentStatus[] | null {
  switch (view) {
    case "ready":
      return ["confirmed", "checked_in"];
    case "active":
      return ["in_progress"];
    case "follow_up":
      return ["scheduled", "no_show"];
    case "completed":
      return ["completed"];
    default:
      return null;
  }
}

function formatDateInput(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

function addUtcDays(date: Date, days: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days)
  );
}

export function getPaymentRangeBounds(range: PaymentRange, now = new Date()) {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  switch (range) {
    case "today":
      return {
        dateFrom: formatDateInput(today),
        dateTo: formatDateInput(today)
      };
    case "7d":
      return {
        dateFrom: formatDateInput(addUtcDays(today, -6)),
        dateTo: formatDateInput(today)
      };
    case "30d":
      return {
        dateFrom: formatDateInput(addUtcDays(today, -29)),
        dateTo: formatDateInput(today)
      };
    default:
      return {
        dateFrom: "",
        dateTo: ""
      };
  }
}

export function matchesIsoDateRange(value: string, dateFrom?: string, dateTo?: string) {
  if (dateFrom && value < dateFrom) {
    return false;
  }

  if (dateTo && value > dateTo) {
    return false;
  }

  return true;
}
