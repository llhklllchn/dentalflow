import { describe, expect, it } from "vitest";

import { getFormGuide } from "./form-guides";

describe("form guides", () => {
  it("guides appointment creation toward schedule and record actions", () => {
    const guide = getFormGuide("appointment");

    expect(guide.afterSaveActions.map((action) => action.href)).toEqual([
      "/appointments",
      "/patients",
      "/dental-records/new"
    ]);
  });

  it("keeps invoice guide focused on payment and reporting", () => {
    const guide = getFormGuide("invoice");

    expect(guide.afterSaveActions.map((action) => action.href)).toContain("/payments/new");
    expect(guide.afterSaveActions.map((action) => action.href)).toContain("/reports");
  });

  it("uses a practical readiness label for patient creation", () => {
    const guide = getFormGuide("patient");

    expect(guide.readinessLabel).toContain("اسم");
    expect(guide.firstSteps).toHaveLength(3);
  });
});
