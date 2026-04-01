import { describe, expect, it } from "vitest";

import { getPermissionScopeLabel, hasPermission } from "./permissions";

describe("permissions", () => {
  it("allows wildcard access for owner and admin sections", () => {
    expect(hasPermission("owner", "settings:update")).toBe(true);
    expect(hasPermission("admin", "patients:view")).toBe(true);
    expect(hasPermission("admin", "appointments:update-status")).toBe(true);
  });

  it("keeps dentist access focused on clinical work", () => {
    expect(hasPermission("dentist", "appointments:update-status")).toBe(true);
    expect(hasPermission("dentist", "dental-records:*")).toBe(true);
    expect(hasPermission("dentist", "invoices:*")).toBe(false);
    expect(hasPermission("dentist", "staff:*")).toBe(false);
  });

  it("keeps accountant access focused on finance", () => {
    expect(hasPermission("accountant", "payments:*")).toBe(true);
    expect(hasPermission("accountant", "reports:view-financial")).toBe(true);
    expect(hasPermission("accountant", "patients:*")).toBe(false);
  });

  it("returns friendly labels for permission scopes", () => {
    expect(getPermissionScopeLabel("patients:view")).toBe("قسم المرضى");
    expect(getPermissionScopeLabel("settings:update")).toBe("الإعدادات");
    expect(getPermissionScopeLabel("unknown:action")).toBe("هذه الصفحة");
  });
});
