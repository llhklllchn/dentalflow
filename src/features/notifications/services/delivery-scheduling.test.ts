import { describe, expect, it } from "vitest";

import {
  getReminderLeadTimeLabel,
  isNotificationReadyForDelivery
} from "./delivery-scheduling";

describe("delivery scheduling helpers", () => {
  it("delivers only notifications that are due", () => {
    const now = new Date("2026-03-30T12:00:00.000Z");

    expect(isNotificationReadyForDelivery(undefined, now)).toBe(true);
    expect(isNotificationReadyForDelivery(null, now)).toBe(true);
    expect(isNotificationReadyForDelivery(new Date("2026-03-30T11:59:59.000Z"), now)).toBe(
      true
    );
    expect(isNotificationReadyForDelivery(new Date("2026-03-30T12:00:01.000Z"), now)).toBe(
      false
    );
  });

  it("derives reminder lead time labels from the template key", () => {
    expect(getReminderLeadTimeLabel("appointment_same_day")).toBe("3 ساعات");
    expect(getReminderLeadTimeLabel("appointment_reminder_24h")).toBe("24 ساعة");
    expect(getReminderLeadTimeLabel("appointment_reminder_2h")).toBe("ساعتين");
    expect(getReminderLeadTimeLabel("appointment_reminder")).toBe("24 ساعة");
  });
});
