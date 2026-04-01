import { hasPermission } from "@/lib/permissions/permissions";
import { NavigationItem, QuickAction, Role } from "@/types/domain";

export const mainNavigation: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "لوحة التحكم",
    permissions: ["dashboard:view"]
  },
  {
    href: "/appointments",
    label: "المواعيد",
    permissions: ["appointments:view"]
  },
  {
    href: "/patients",
    label: "المرضى",
    permissions: ["patients:view"]
  },
  {
    href: "/dentists",
    label: "الأطباء",
    permissions: ["dentists:*"]
  },
  {
    href: "/staff",
    label: "الموظفون",
    permissions: ["staff:*"]
  },
  {
    href: "/services",
    label: "الخدمات",
    permissions: ["services:*"]
  },
  {
    href: "/treatment-plans",
    label: "خطط العلاج",
    permissions: ["treatment-plans:view"]
  },
  {
    href: "/dental-records",
    label: "السجلات الطبية",
    permissions: ["dental-records:view"]
  },
  {
    href: "/invoices",
    label: "الفواتير",
    permissions: ["invoices:view"]
  },
  {
    href: "/payments",
    label: "المدفوعات",
    permissions: ["payments:view"]
  },
  {
    href: "/notifications",
    label: "الإشعارات",
    permissions: ["settings:update"]
  },
  {
    href: "/reports",
    label: "التقارير",
    permissions: ["reports:view", "reports:view-financial"]
  },
  {
    href: "/settings",
    label: "الإعدادات",
    permissions: ["settings:view"]
  }
];

export const quickActions: QuickAction[] = [
  {
    href: "/patients/new",
    label: "مريض جديد",
    description: "إضافة مريض وربطه بالعيادة الحالية",
    permissions: ["patients:*"]
  },
  {
    href: "/appointments/new",
    label: "موعد جديد",
    description: "حجز موعد مع طبيب وخدمة",
    permissions: ["appointments:*"]
  },
  {
    href: "/invoices/new",
    label: "فاتورة جديدة",
    description: "إنشاء فاتورة للمريض",
    permissions: ["invoices:*"]
  },
  {
    href: "/payments/new",
    label: "دفعة جديدة",
    description: "تسجيل دفعة على فاتورة",
    permissions: ["payments:*"]
  }
];

function canAccessItem(
  role: Role,
  item: {
    roles?: Role[];
    permissions?: string[];
  }
) {
  const matchesRole = item.roles ? item.roles.includes(role) : false;
  const matchesPermission = item.permissions
    ? item.permissions.some((permission) => hasPermission(role, permission))
    : false;

  return item.roles || item.permissions ? matchesRole || matchesPermission : true;
}

export function getVisibleNavigationItems(role: Role) {
  return mainNavigation.filter((item) => canAccessItem(role, item));
}

export function getVisibleQuickActions(role: Role) {
  return quickActions.filter((item) => canAccessItem(role, item));
}
