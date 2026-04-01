import { describe, expect, it } from "vitest";

import { getVisibleNavigationItems, getVisibleQuickActions } from "./navigation";
import { getRoleWorkspace } from "./role-workspace";

describe("role workspace", () => {
  it("builds a clinical journey for dentists", () => {
    const workspace = getRoleWorkspace(
      "dentist",
      getVisibleNavigationItems("dentist"),
      getVisibleQuickActions("dentist")
    );

    expect(workspace.journeySteps.map((step) => step.href)).toEqual([
      "/appointments",
      "/dental-records",
      "/treatment-plans"
    ]);
    expect(workspace.searchPlaceholder).toContain("سجل طبي");
  });

  it("falls back to accessible navigation shortcuts when a role has no write quick actions", () => {
    const workspace = getRoleWorkspace(
      "assistant",
      getVisibleNavigationItems("assistant"),
      getVisibleQuickActions("assistant")
    );

    expect(workspace.shortcuts.map((shortcut) => shortcut.href)).toContain("/appointments");
    expect(workspace.shortcuts.map((shortcut) => shortcut.href)).toContain("/patients");
  });

  it("keeps finance-focused shortcuts for accountants", () => {
    const workspace = getRoleWorkspace(
      "accountant",
      getVisibleNavigationItems("accountant"),
      getVisibleQuickActions("accountant")
    );

    expect(workspace.shortcuts.map((shortcut) => shortcut.href)).toEqual([
      "/payments/new",
      "/invoices",
      "/payments",
      "/reports"
    ]);
  });
});
