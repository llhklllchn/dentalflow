import { describe, expect, it } from "vitest";

import {
  buildTelHref,
  buildWhatsAppHref,
  normalizeContactPhone
} from "@/lib/contact/contact-links";

describe("contact links", () => {
  it("normalizes phone numbers while keeping the leading plus", () => {
    expect(normalizeContactPhone("+962 79-000-0001")).toBe("+962790000001");
    expect(normalizeContactPhone("079-000-0001")).toBe("0790000001");
  });

  it("builds dialing links", () => {
    expect(buildTelHref("+962 79 000 0001")).toBe("tel:+962790000001");
    expect(buildTelHref("")).toBe("");
  });

  it("builds whatsapp links with optional message", () => {
    expect(buildWhatsAppHref("+962 79 000 0001")).toBe("https://wa.me/962790000001");
    expect(buildWhatsAppHref("+962 79 000 0001", "موعدك غدًا")).toBe(
      "https://wa.me/962790000001?text=%D9%85%D9%88%D8%B9%D8%AF%D9%83%20%D8%BA%D8%AF%D9%8B%D8%A7"
    );
  });
});
