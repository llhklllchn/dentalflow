import { describe, expect, it } from "vitest";

import { getWorkflowGuide } from "./workflow-guides";

describe("workflow guides", () => {
  it("returns receptionist actions for patients page", () => {
    const guide = getWorkflowGuide("patients", "receptionist");

    expect(guide.actions.map((action) => action.href)).toEqual([
      "/patients/new",
      "/appointments/new",
      "/appointments"
    ]);
    expect(guide.focusLabel).toContain("الحجز");
  });

  it("keeps finance-oriented actions for accountant invoice workflow", () => {
    const guide = getWorkflowGuide("invoices", "accountant");

    expect(guide.actions.map((action) => action.href)).toEqual([
      "/payments/new",
      "/payments",
      "/reports"
    ]);
  });

  it("provides clinical next steps for dentists on appointments page", () => {
    const guide = getWorkflowGuide("appointments", "dentist");

    expect(guide.actions.map((action) => action.href)).toContain("/dental-records");
    expect(guide.actions.map((action) => action.href)).toContain("/treatment-plans");
  });
});
