export type Role =
  | "owner"
  | "admin"
  | "dentist"
  | "receptionist"
  | "accountant"
  | "assistant";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export type TreatmentPlanStatus =
  | "draft"
  | "planned"
  | "approved"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ToothStatus =
  | "healthy"
  | "decay"
  | "filling"
  | "missing"
  | "root_canal"
  | "crown"
  | "extracted"
  | "implant"
  | "under_observation";

export type NotificationChannel = "sms" | "email" | "whatsapp";

export type NotificationDeliveryStatus = "pending" | "sent" | "failed";

export type QuickAction = {
  href: string;
  label: string;
  description: string;
  permissions?: string[];
};

export type NavigationItem = {
  href: string;
  label: string;
  roles?: Role[];
  permissions?: string[];
};

export type SessionUser = {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
};

export type ClinicContext = {
  clinicId: string;
  clinicName: string;
  timezone: string;
  currency: string;
  locale: string;
};
