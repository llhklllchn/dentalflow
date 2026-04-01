import { InvoiceStatus } from "@/types/domain";

type InvoiceLineInput = {
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLineTotal(item: InvoiceLineInput) {
  return roundMoney(item.lineTotal ?? item.quantity * item.unitPrice);
}

export function calculateInvoiceTotals(input: {
  items: InvoiceLineInput[];
  discount?: number;
  tax?: number;
  paidAmount?: number;
  issueDate?: Date;
  dueDate?: Date | null;
}) {
  const subtotal = roundMoney(
    input.items.reduce((sum, item) => sum + calculateLineTotal(item), 0)
  );
  const discount = roundMoney(input.discount ?? 0);
  const tax = roundMoney(input.tax ?? 0);
  const total = roundMoney(Math.max(subtotal - discount, 0) + tax);
  const paidAmount = roundMoney(input.paidAmount ?? 0);
  const balance = roundMoney(Math.max(total - paidAmount, 0));

  return {
    subtotal,
    discount,
    tax,
    total,
    paidAmount,
    balance,
    status: deriveInvoiceStatus({
      paidAmount,
      balance,
      dueDate: input.dueDate ?? null,
      issueDate: input.issueDate ?? new Date()
    })
  };
}

export function deriveInvoiceStatus(input: {
  paidAmount: number;
  balance: number;
  issueDate?: Date;
  dueDate?: Date | null;
  cancelled?: boolean;
}): InvoiceStatus {
  if (input.cancelled) {
    return "cancelled";
  }

  if (input.balance <= 0) {
    return "paid";
  }

  if (input.paidAmount > 0 && input.balance > 0) {
    return "partially_paid";
  }

  if (input.dueDate && input.dueDate.getTime() < Date.now()) {
    return "overdue";
  }

  return "issued";
}

export function assertPaymentDoesNotExceedBalance(amount: number, balance: number) {
  if (amount > balance) {
    throw new Error("Payment amount cannot exceed the remaining invoice balance.");
  }
}
