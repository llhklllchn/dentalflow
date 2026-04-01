import { Role } from "@/types/domain";

export const permissionsByRole: Record<Role, string[]> = {
  owner: ["*"],
  admin: [
    "dashboard:view",
    "patients:*",
    "appointments:*",
    "dentists:*",
    "staff:*",
    "services:*",
    "dental-records:*",
    "treatment-plans:*",
    "invoices:*",
    "payments:*",
    "reports:view",
    "settings:view",
    "settings:update"
  ],
  dentist: [
    "dashboard:view",
    "patients:view",
    "appointments:view",
    "appointments:update-status",
    "dental-records:*",
    "treatment-plans:*"
  ],
  receptionist: [
    "dashboard:view",
    "patients:*",
    "appointments:*",
    "services:view",
    "invoices:view"
  ],
  accountant: [
    "dashboard:view",
    "patients:view",
    "invoices:*",
    "payments:*",
    "reports:view-financial"
  ],
  assistant: [
    "dashboard:view",
    "patients:view",
    "appointments:view"
  ]
};

const permissionScopeLabels: Record<string, string> = {
  dashboard: "لوحة التحكم",
  patients: "قسم المرضى",
  appointments: "قسم المواعيد",
  dentists: "ملفات الأطباء",
  staff: "إدارة الموظفين",
  services: "كتالوج الخدمات",
  "dental-records": "السجلات الطبية",
  "treatment-plans": "خطط العلاج",
  invoices: "الفواتير",
  payments: "المدفوعات",
  reports: "التقارير",
  settings: "الإعدادات"
};

export function hasPermission(role: Role, permission: string) {
  const permissions = permissionsByRole[role];

  if (permissions.includes("*")) {
    return true;
  }

  if (permissions.includes(permission)) {
    return true;
  }

  const sectionPermission = `${permission.split(":")[0]}:*`;
  return permissions.includes(sectionPermission);
}

export function getPermissionScopeLabel(permission: string) {
  const section = permission.split(":")[0];
  return permissionScopeLabels[section] ?? "هذه الصفحة";
}
