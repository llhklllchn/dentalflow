import { describe, expect, it } from "vitest";

import {
  buildNotificationSubject,
  normalizeDeliveryError,
  resolveNotificationRecipient
} from "./delivery-helpers";

describe("notification delivery helpers", () => {
  it("resolves the correct recipient for each channel", () => {
    expect(
      resolveNotificationRecipient({
        channel: "email",
        email: "patient@example.com",
        phone: "+962790000001",
        whatsappPhone: "+962790000099"
      })
    ).toBe("patient@example.com");

    expect(
      resolveNotificationRecipient({
        channel: "whatsapp",
        email: "patient@example.com",
        phone: "+962790000001",
        whatsappPhone: "+962790000099"
      })
    ).toBe("+962790000099");

    expect(
      resolveNotificationRecipient({
        channel: "sms",
        phone: "+962790000001"
      })
    ).toBe("+962790000001");
  });

  it("builds a fallback subject and truncates delivery errors", () => {
    expect(buildNotificationSubject("")).toBe("إشعار من العيادة");
    expect(normalizeDeliveryError(new Error("x".repeat(700)))).toHaveLength(500);
  });
});
