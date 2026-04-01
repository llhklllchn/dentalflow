import { describe, expect, it } from "vitest";

import {
  assertAppointmentStatusTransition,
  ensureValidAppointmentWindow,
  hasAppointmentOverlap
} from "./scheduling";

describe("appointment scheduling", () => {
  it("rejects invalid appointment windows", () => {
    expect(() =>
      ensureValidAppointmentWindow(
        new Date("2026-03-30T10:00:00.000Z"),
        new Date("2026-03-30T09:59:00.000Z")
      )
    ).toThrow("Appointment end time must be after the start time.");
  });

  it("detects overlapping appointments", () => {
    expect(
      hasAppointmentOverlap({
        startsAt: new Date("2026-03-30T10:15:00.000Z"),
        endsAt: new Date("2026-03-30T10:45:00.000Z"),
        existingAppointments: [
          {
            startsAt: new Date("2026-03-30T10:00:00.000Z"),
            endsAt: new Date("2026-03-30T10:30:00.000Z")
          }
        ]
      })
    ).toBe(true);
  });

  it("allows valid status transitions and rejects invalid ones", () => {
    expect(() => assertAppointmentStatusTransition("confirmed", "checked_in")).not.toThrow();
    expect(() => assertAppointmentStatusTransition("completed", "scheduled")).toThrow(
      "Appointment status cannot move from completed to scheduled."
    );
  });
});
