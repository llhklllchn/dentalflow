import { describe, expect, it, vi, afterEach } from "vitest";

import {
  assertPaymentDoesNotExceedBalance,
  calculateInvoiceTotals,
  calculateLineTotal,
  deriveInvoiceStatus
} from "./invoice-calculations";

afterEach(() => {
  vi.useRealTimers();
});

describe("invoice calculations", () => {
  it("calculates line totals and invoice totals accurately", () => {
    const totals = calculateInvoiceTotals({
      items: [
        {
          quantity: 2,
          unitPrice: 10.125
        },
        {
          quantity: 1,
          unitPrice: 4.2
        }
      ],
      discount: 2.45,
      tax: 1.3,
      paidAmount: 5
    });

    expect(calculateLineTotal({ quantity: 2, unitPrice: 10.125 })).toBe(20.25);
    expect(totals).toMatchObject({
      subtotal: 24.45,
      discount: 2.45,
      tax: 1.3,
      total: 23.3,
      paidAmount: 5,
      balance: 18.3,
      status: "partially_paid"
    });
  });

  it("marks unpaid past-due invoices as overdue", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T10:00:00.000Z"));

    expect(
      deriveInvoiceStatus({
        paidAmount: 0,
        balance: 120,
        dueDate: new Date("2026-03-31T10:00:00.000Z")
      })
    ).toBe("overdue");
  });

  it("throws when the payment exceeds the balance", () => {
    expect(() => assertPaymentDoesNotExceedBalance(101, 100)).toThrow(
      "Payment amount cannot exceed the remaining invoice balance."
    );
  });
});
