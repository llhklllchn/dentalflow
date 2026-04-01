import { describe, expect, it } from "vitest";

import { getVisibleNavigationItems, getVisibleQuickActions } from "./navigation";

describe("navigation visibility", () => {
  it("shows dentists only the sections they can truly use", () => {
    const items = getVisibleNavigationItems("dentist").map((item) => item.href);

    expect(items).toContain("/dashboard");
    expect(items).toContain("/patients");
    expect(items).toContain("/appointments");
    expect(items).toContain("/treatment-plans");
    expect(items).toContain("/dental-records");
    expect(items).not.toContain("/payments");
    expect(items).not.toContain("/staff");
    expect(items).not.toContain("/settings");
  });

  it("shows accountants finance-focused sections", () => {
    const items = getVisibleNavigationItems("accountant").map((item) => item.href);

    expect(items).toEqual(["/dashboard", "/patients", "/invoices", "/payments", "/reports"]);
  });

  it("limits receptionist quick actions to allowed write flows", () => {
    const items = getVisibleQuickActions("receptionist").map((item) => item.href);

    expect(items).toEqual(["/patients/new", "/appointments/new"]);
  });
});
