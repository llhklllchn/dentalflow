"use server";

import { z } from "zod";

import { invoiceFormSchema } from "@/features/invoices/schemas/invoice-form.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { calculateInvoiceTotals } from "@/lib/billing/invoice-calculations";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { fromDatabaseEnum, toDatabaseEnum, toMoneyNumber } from "@/lib/domain/mappers";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";
import { InvoiceStatus } from "@/types/domain";

const updateInvoiceSchema = invoiceFormSchema.extend({
  invoiceId: z.string().min(1, "Invoice id is required.")
});

export async function updateInvoice(input: unknown) {
  const parsed = updateInvoiceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من تعديل الفاتورة. وضع الديمو لا يحفظها فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "invoices:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتعديل الفواتير."
      };
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        clinicId: user.clinicId,
        OR: [{ id: parsed.data.invoiceId }, { invoiceNumber: parsed.data.invoiceId }]
      },
      include: {
        items: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!invoice) {
      return {
        ok: false,
        message: "الفاتورة غير موجودة داخل العيادة الحالية."
      };
    }

    if (fromDatabaseEnum<InvoiceStatus>(invoice.status) === "cancelled") {
      return {
        ok: false,
        message: "لا يمكن تعديل فاتورة ملغاة."
      };
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: parsed.data.patientId,
        clinicId: user.clinicId,
        archivedAt: null
      },
      select: {
        id: true
      }
    });

    if (!patient) {
      return {
        ok: false,
        message: "المريض غير متاح داخل العيادة الحالية."
      };
    }

    const totals = calculateInvoiceTotals({
      items: parsed.data.items,
      discount: parsed.data.discount,
      tax: parsed.data.tax,
      paidAmount: toMoneyNumber(invoice.paidAmount),
      issueDate: new Date(parsed.data.issueDate),
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null
    });

    if (totals.total < toMoneyNumber(invoice.paidAmount)) {
      return {
        ok: false,
        message: "لا يمكن جعل إجمالي الفاتورة أقل من المدفوع المسجل عليها."
      };
    }

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: {
          invoiceId: invoice.id
        }
      });

      return await tx.invoice.update({
        where: {
          id: invoice.id
        },
        data: {
          patientId: parsed.data.patientId,
          issueDate: new Date(parsed.data.issueDate),
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          total: totals.total,
          paidAmount: toMoneyNumber(invoice.paidAmount),
          balance: totals.balance,
          status: toDatabaseEnum(totals.status) as
            | "DRAFT"
            | "ISSUED"
            | "PARTIALLY_PAID"
            | "PAID"
            | "OVERDUE"
            | "CANCELLED",
          notes: parsed.data.notes || null,
          items: {
            create: parsed.data.items.map((item) => ({
              clinicId: user.clinicId,
              serviceName: item.serviceName,
              description: item.description || null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal
            }))
          }
        }
      });
    });

    await writeAuditLog({
      entityType: "invoice",
      entityId: updatedInvoice.id,
      action: "update",
      oldValuesJson: {
        patientId: invoice.patientId,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate?.toISOString() ?? null,
        subtotal: toMoneyNumber(invoice.subtotal),
        discount: toMoneyNumber(invoice.discount),
        tax: toMoneyNumber(invoice.tax),
        total: toMoneyNumber(invoice.total),
        paidAmount: toMoneyNumber(invoice.paidAmount),
        balance: toMoneyNumber(invoice.balance),
        notes: invoice.notes,
        status: fromDatabaseEnum<InvoiceStatus>(invoice.status),
        items: invoice.items.map((item) => ({
          serviceName: item.serviceName,
          description: item.description,
          quantity: item.quantity,
          unitPrice: toMoneyNumber(item.unitPrice),
          lineTotal: toMoneyNumber(item.lineTotal)
        }))
      },
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم تحديث الفاتورة بنجاح.",
      data: {
        id: updatedInvoice.id
      }
    };
  } catch (error) {
    return {
      ok: false,
        message: error instanceof Error ? error.message : "تعذر تحديث الفاتورة."
    };
  }
}
