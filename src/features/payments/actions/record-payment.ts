"use server";

import { paymentFormSchema } from "@/features/payments/schemas/payment-form.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import {
  assertPaymentDoesNotExceedBalance,
  deriveInvoiceStatus
} from "@/lib/billing/invoice-calculations";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { toMoneyNumber } from "@/lib/domain/mappers";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

export async function recordPayment(input: unknown) {
  const parsed = paymentFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من بيانات الدفعة. وضع الديمو لا يحدّث الفاتورة فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "payments:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتسجيل الدفعات."
      };
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        clinicId: user.clinicId,
        OR: [
          {
            id: parsed.data.invoiceId
          },
          {
            invoiceNumber: parsed.data.invoiceId
          }
        ]
      }
    });

    if (!invoice) {
      return {
        ok: false,
        message: "الفاتورة غير موجودة داخل العيادة الحالية."
      };
    }

    if (invoice.patientId !== parsed.data.patientId) {
      return {
        ok: false,
        message: "الفاتورة المحددة لا تعود إلى هذا المريض."
      };
    }

    const currentBalance = toMoneyNumber(invoice.balance);
    assertPaymentDoesNotExceedBalance(parsed.data.amount, currentBalance);

    const nextPaidAmount = toMoneyNumber(invoice.paidAmount) + parsed.data.amount;
    const nextBalance = Math.max(currentBalance - parsed.data.amount, 0);
    const nextStatus = deriveInvoiceStatus({
      paidAmount: nextPaidAmount,
      balance: nextBalance,
      dueDate: invoice.dueDate,
      issueDate: invoice.issueDate
    });

    const payment = await prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          clinicId: user.clinicId,
          invoiceId: invoice.id,
          patientId: parsed.data.patientId,
          amount: parsed.data.amount,
          paymentMethod: parsed.data.paymentMethod.toUpperCase() as
            | "CASH"
            | "CARD"
            | "TRANSFER"
            | "MIXED",
          reference: parsed.data.reference || null,
          notes: parsed.data.notes || null,
          paidAt: new Date(parsed.data.paidAt),
          recordedBy: user.id
        }
      });

      await tx.invoice.update({
        where: {
          id: invoice.id
        },
        data: {
          paidAmount: nextPaidAmount,
          balance: nextBalance,
          status: nextStatus.toUpperCase() as
            | "DRAFT"
            | "ISSUED"
            | "PARTIALLY_PAID"
            | "PAID"
            | "OVERDUE"
            | "CANCELLED"
        }
      });

      return createdPayment;
    });

    await writeAuditLog({
      entityType: "payment",
      entityId: payment.id,
      action: "create",
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم تسجيل الدفعة وتحديث الفاتورة بنجاح.",
      data: {
        id: payment.id,
        balance: nextBalance
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to record payment."
    };
  }
}
