import {
  AppointmentStatus,
  InvoiceStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  Role,
  ToothStatus,
  TreatmentPlanStatus
} from "@/types/domain";

type DecimalLike =
  | number
  | string
  | null
  | undefined
  | {
      toNumber?: () => number;
      toString: () => string;
    };

type DomainEnum =
  | Role
  | AppointmentStatus
  | InvoiceStatus
  | TreatmentPlanStatus
  | ToothStatus
  | NotificationChannel
  | NotificationDeliveryStatus;

export function toDatabaseEnum<T extends string>(value: T) {
  return value.toUpperCase();
}

export function fromDatabaseEnum<T extends DomainEnum>(value: string) {
  return value.toLowerCase() as T;
}

export function formatFullName(firstName?: string | null, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

export function toMoneyNumber(value: DecimalLike) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === "object") {
    if (typeof value.toNumber === "function") {
      return value.toNumber();
    }

    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function formatCurrency(value: DecimalLike, currency = "JOD") {
  return `${toMoneyNumber(value).toFixed(2)} ${currency}`;
}

export function formatDate(value?: Date | string | null) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toISOString().slice(0, 10);
}

export function formatTime(value?: Date | string | null) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

export function formatTimeRange(startsAt?: Date | string | null, endsAt?: Date | string | null) {
  return `${formatTime(startsAt)} - ${formatTime(endsAt)}`;
}

export function buildMedicalSummary(input: {
  allergies?: string | null;
  chronicConditions?: string | null;
  currentMedications?: string | null;
  smokingStatus?: string | null;
  pregnancyStatus?: string | null;
  medicalNotes?: string | null;
}) {
  const parts = [
    input.allergies ? `الحساسية: ${input.allergies}` : null,
    input.chronicConditions ? `الأمراض المزمنة: ${input.chronicConditions}` : null,
    input.currentMedications ? `الأدوية الحالية: ${input.currentMedications}` : null,
    input.smokingStatus ? `التدخين: ${input.smokingStatus}` : null,
    input.pregnancyStatus ? `الحمل: ${input.pregnancyStatus}` : null,
    input.medicalNotes ? `ملاحظات: ${input.medicalNotes}` : null
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : "لا توجد ملاحظات طبية مسجلة بعد.";
}
