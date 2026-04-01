import { describe, expect, it } from "vitest";

import {
  buildAppointmentCreatePath,
  buildDentalRecordCreatePath,
  buildInvoiceCreatePath,
  buildPaymentCreatePath,
  buildTreatmentPlanCreatePath
} from "@/lib/navigation/create-flow";

describe("create flow navigation", () => {
  it("builds an appointment path with only the provided fields", () => {
    expect(
      buildAppointmentCreatePath({
        patientId: "pat_001",
        status: "confirmed",
        notes: "Needs follow-up"
      })
    ).toBe(
      "/appointments/new?patientId=pat_001&status=confirmed&notes=Needs+follow-up"
    );
  });

  it("skips empty invoice values while preserving numbers", () => {
    expect(
      buildInvoiceCreatePath({
        patientId: "pat_001",
        serviceName: "Root Canal",
        unitPrice: 95,
        quantity: 1,
        notes: "   "
      })
    ).toBe(
      "/invoices/new?patientId=pat_001&serviceName=Root+Canal&unitPrice=95&quantity=1"
    );
  });

  it("builds payment links with invoice context", () => {
    expect(
      buildPaymentCreatePath({
        invoiceId: "INV-2026-0007",
        patientId: "pat_002"
      })
    ).toBe("/payments/new?invoiceId=INV-2026-0007&patientId=pat_002");
  });

  it("builds dental record links with clinical context", () => {
    expect(
      buildDentalRecordCreatePath({
        patientId: "pat_003",
        appointmentDate: "2026-04-10",
        toothNumbers: "14, 16"
      })
    ).toBe(
      "/dental-records/new?patientId=pat_003&appointmentDate=2026-04-10&toothNumbers=14%2C+16"
    );
  });

  it("builds treatment plan links with numeric values", () => {
    expect(
      buildTreatmentPlanCreatePath({
        patientId: "pat_004",
        title: "Upper restoration",
        estimatedCost: 180,
        sessionOrder: 2
      })
    ).toBe(
      "/treatment-plans/new?patientId=pat_004&title=Upper+restoration&estimatedCost=180&sessionOrder=2"
    );
  });
});
