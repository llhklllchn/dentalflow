import {
  AppointmentStatus,
  InvoiceStatus,
  NotificationChannel,
  Role,
  TreatmentPlanStatus
} from "@/types/domain";

type NotificationStatus = "pending" | "sent" | "failed";

type BadgeStatus =
  | AppointmentStatus
  | InvoiceStatus
  | TreatmentPlanStatus
  | NotificationStatus
  | "draft"
  | "active"
  | "inactive"
  | "invited";

const roleLabels: Record<Role, string> = {
  owner: "مالك العيادة",
  admin: "مدير النظام",
  dentist: "طبيب الأسنان",
  receptionist: "الاستقبال",
  accountant: "المحاسب",
  assistant: "المساعد"
};

const notificationChannelLabels: Record<NotificationChannel, string> = {
  whatsapp: "واتساب",
  sms: "رسالة نصية",
  email: "بريد إلكتروني"
};

const statusLabels: Record<BadgeStatus, string> = {
  scheduled: "مجدول",
  confirmed: "مؤكد",
  checked_in: "تم تسجيل الحضور",
  in_progress: "جارٍ الآن",
  completed: "مكتمل",
  cancelled: "ملغي",
  no_show: "لم يحضر",
  draft: "مسودة",
  issued: "صادرة",
  partially_paid: "مدفوعة جزئيًا",
  paid: "مدفوعة",
  overdue: "متأخرة",
  planned: "مخططة",
  approved: "معتمدة",
  pending: "قيد الانتظار",
  sent: "تم الإرسال",
  failed: "فشل الإرسال",
  active: "نشط",
  inactive: "معطل",
  invited: "دعوة معلقة"
};

export function getRoleLabel(role: Role) {
  return roleLabels[role];
}

export function getNotificationChannelLabel(channel: NotificationChannel) {
  return notificationChannelLabels[channel];
}

export function getStatusLabel(status: BadgeStatus) {
  return statusLabels[status];
}

export function getAppointmentStatusOptions() {
  return [
    { value: "scheduled", label: statusLabels.scheduled },
    { value: "confirmed", label: statusLabels.confirmed },
    { value: "checked_in", label: statusLabels.checked_in },
    { value: "in_progress", label: statusLabels.in_progress },
    { value: "completed", label: statusLabels.completed },
    { value: "cancelled", label: statusLabels.cancelled },
    { value: "no_show", label: statusLabels.no_show }
  ] as const;
}

export function getInvoiceStatusOptions() {
  return [
    { value: "issued", label: statusLabels.issued },
    { value: "partially_paid", label: statusLabels.partially_paid },
    { value: "paid", label: statusLabels.paid },
    { value: "overdue", label: statusLabels.overdue },
    { value: "cancelled", label: statusLabels.cancelled }
  ] as const;
}
