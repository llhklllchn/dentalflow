import { describe, expect, it } from "vitest";

import {
  getAppointmentNextStep,
  getInvoiceNextStep,
  getPatientNextStep
} from "@/lib/recommendations/next-step";

describe("next-step recommendations", () => {
  it("recommends financial follow-up for patients with open balance", () => {
    expect(
      getPatientNextStep({
        balance: "120 JOD",
        lastVisit: "2026-04-01"
      })
    ).toMatchObject({
      tone: "amber",
      actionKey: "open_patient"
    });
  });

  it("recommends a first appointment when the patient has no visit", () => {
    expect(
      getPatientNextStep({
        balance: "0 JOD",
        lastVisit: "—"
      })
    ).toMatchObject({
      tone: "brand",
      actionKey: "new_appointment"
    });
  });

  it("recommends a clinical note for checked-in appointments", () => {
    expect(getAppointmentNextStep("checked_in")).toMatchObject({
      tone: "brand",
      actionKey: "new_record"
    });
  });

  it("recommends rebooking after no-show", () => {
    expect(getAppointmentNextStep("no_show")).toMatchObject({
      tone: "rose",
      actionKey: "new_appointment"
    });
  });

  it("recommends recording payments for overdue invoices", () => {
    expect(
      getInvoiceNextStep({
        status: "overdue",
        balance: "200 JOD"
      })
    ).toMatchObject({
      tone: "rose",
      actionKey: "record_payment"
    });
  });

  it("recommends opening the patient for paid invoices", () => {
    expect(
      getInvoiceNextStep({
        status: "paid",
        balance: "0 JOD"
      })
    ).toMatchObject({
      tone: "emerald",
      actionKey: "open_patient"
    });
  });
});
