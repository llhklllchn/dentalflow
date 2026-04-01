import { describe, expect, it } from "vitest";

import {
  getAppointmentStatusesForView,
  getPaymentRangeBounds,
  matchesIsoDateRange,
  normalizeAppointmentView,
  normalizeInvoiceView,
  normalizePatientSegment,
  normalizePaymentRange
} from "@/lib/filters/list-presets";

describe("list preset helpers", () => {
  it("normalizes incoming preset values", () => {
    expect(normalizePatientSegment("open_balance")).toBe("open_balance");
    expect(normalizePatientSegment("something-else")).toBe("all");
    expect(normalizeAppointmentView("ready")).toBe("ready");
    expect(normalizeInvoiceView("attention")).toBe("attention");
    expect(normalizePaymentRange("7d")).toBe("7d");
    expect(normalizePaymentRange("year")).toBe("all");
  });

  it("maps appointment views to grouped statuses", () => {
    expect(getAppointmentStatusesForView("ready")).toEqual(["confirmed", "checked_in"]);
    expect(getAppointmentStatusesForView("active")).toEqual(["in_progress"]);
    expect(getAppointmentStatusesForView("all")).toBeNull();
  });

  it("builds payment date windows from the current day", () => {
    const now = new Date("2026-04-01T10:30:00.000Z");

    expect(getPaymentRangeBounds("today", now)).toEqual({
      dateFrom: "2026-04-01",
      dateTo: "2026-04-01"
    });
    expect(getPaymentRangeBounds("7d", now)).toEqual({
      dateFrom: "2026-03-26",
      dateTo: "2026-04-01"
    });
    expect(getPaymentRangeBounds("30d", now)).toEqual({
      dateFrom: "2026-03-03",
      dateTo: "2026-04-01"
    });
  });

  it("matches ISO dates against optional bounds", () => {
    expect(matchesIsoDateRange("2026-03-29", "2026-03-26", "2026-04-01")).toBe(true);
    expect(matchesIsoDateRange("2026-03-20", "2026-03-26", "2026-04-01")).toBe(false);
    expect(matchesIsoDateRange("2026-04-05", "2026-03-26", "2026-04-01")).toBe(false);
  });
});
