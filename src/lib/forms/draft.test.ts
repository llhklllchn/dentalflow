import { describe, expect, it } from "vitest";

import {
  buildDraftStorageKey,
  collectDraftValues,
  createDraftPayload,
  parseDraftPayload,
  shouldRestoreDraftValue
} from "@/lib/forms/draft";

describe("draft helpers", () => {
  it("builds a stable storage key", () => {
    expect(buildDraftStorageKey("patients:create")).toBe("dentflow:draft:patients:create");
  });

  it("collects only supported non-empty values", () => {
    expect(
      collectDraftValues([
        { name: "firstName", value: "سارة" },
        { name: "phone", value: "+962700000000" },
        { name: "notes", value: "   " },
        { name: "token", type: "hidden", value: "secret" },
        { name: "sendSms", type: "checkbox", value: "yes", checked: false },
        { name: "preferredContact", type: "radio", value: "whatsapp", checked: true }
      ])
    ).toEqual({
      firstName: "سارة",
      phone: "+962700000000",
      preferredContact: "whatsapp"
    });
  });

  it("restores only when there is a saved value and the current value is empty", () => {
    expect(shouldRestoreDraftValue("", "ألم في السن 16")).toBe(true);
    expect(shouldRestoreDraftValue("موجود", "قيمة أخرى")).toBe(false);
    expect(shouldRestoreDraftValue("", "")).toBe(false);
  });

  it("parses only valid payloads", () => {
    const payload = createDraftPayload({ amount: "120" }, 123456);

    expect(parseDraftPayload(JSON.stringify(payload))).toEqual(payload);
    expect(parseDraftPayload("{\"savedAt\":\"oops\"}")).toBeNull();
    expect(parseDraftPayload(null)).toBeNull();
  });
});
