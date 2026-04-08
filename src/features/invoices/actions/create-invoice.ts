"use server";

import { invoiceFormSchema } from "@/features/invoices/schemas/invoice-form.schema";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { calculateInvoiceTotals } from "@/lib/billing/invoice-calculations";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

async function generateInvoiceNumber(clinicId: string) {
  const currentYear = new Date().getFullYear();
  const count = (await prisma.invoice.count({ where: { clinicId } })) + 1;
  return `INV-${currentYear}-${String(count).padStart(4, "0")}`;
}

export async function createInvoice(input: unknown) {
  const parsed = invoiceFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من بيانات الفاتورة. وضع الديمو لا يحفظها فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "invoices:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإنشاء الفواتير."
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
      paidAmount: 0,
      issueDate: new Date(parsed.data.issueDate),
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null
    });

    const invoiceNumber = await generateInvoiceNumber(user.clinicId);

    const createdInvoice = await prisma.$transaction(async (tx) => {
      return await tx.invoice.create({
        data: {
          clinicId: user.clinicId,
          patientId: parsed.data.patientId,
          invoiceNumber,
          issueDate: new Date(parsed.data.issueDate),
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
          status: "ISSUED",
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          total: totals.total,
          paidAmount: 0,
          balance: totals.balance,
          notes: parsed.data.notes || null,
          createdBy: user.id,
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
      entityId: createdInvoice.id,
      action: "create",
      newValuesJson: {
        ...parsed.data,
        invoiceNumber
      }
    });

    return {
      ok: true,
      message: "تم إنشاء الفاتورة بنجاح.",
      data: {
        id: createdInvoice.id,
        invoiceNumber
      }
    };
  } catch (error) {
    return {
      ok: false,
        message: error instanceof Error ? error.message : "تعذر إنشاء الفاتورة."
    };
  }
}
