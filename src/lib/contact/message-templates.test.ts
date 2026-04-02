import { describe, expect, it } from "vitest";

import {
  getAppointmentMessagePresets,
  getInvoiceMessagePresets,
  getPatientMessagePresets
} from "@/lib/contact/message-templates";

describe("contact message templates", () => {
  it("creates patient follow-up templates based on balance", () => {
    expect(
      getPatientMessagePresets({
        patientName: "سارة",
        balance: "120 JOD",
        lastVisit: "2026-04-02"
      })[0].label
    ).toBe("متابعة الرصيد");
  });

  it("creates first-visit template when no visit exists", () => {
    expect(
      getPatientMessagePresets({
        patientName: "محمد",
        balance: "0 JOD",
        lastVisit: "—"
      }).some((item) => item.label === "حجز أول موعد")
    ).toBe(true);
  });

  it("creates appointment reminder templates", () => {
    expect(
      getAppointmentMessagePresets({
        patientName: "لجين",
        dentistName: "د. ليث",
        service: "فحص",
        time: "11:30 - 12:00"
      })
    ).toHaveLength(2);
  });

  it("creates invoice reminder templates for open balances", () => {
    expect(
      getInvoiceMessagePresets({
        patientName: "سارة",
        invoiceId: "inv_001",
        balance: "80 JOD",
        status: "issued"
      })[0].label
    ).toBe("متابعة الفاتورة");
  });

  it("creates thank-you template for paid invoices", () => {
    expect(
      getInvoiceMessagePresets({
        patientName: "محمد",
        invoiceId: "inv_002",
        balance: "0 JOD",
        status: "paid"
      })[0].label
    ).toBe("تأكيد السداد");
  });
});
