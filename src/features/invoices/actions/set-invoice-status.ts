"use server";

import { z } from "zod";

import { writeAuditLog } from "@/lib/audit/audit-log";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { fromDatabaseEnum, toDatabaseEnum, toMoneyNumber } from "@/lib/domain/mappers";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";
import { InvoiceStatus } from "@/types/domain";

const setInvoiceStatusSchema = z.object({
  invoiceId: z.string().min(1, "Invoice id is required."),
  nextStatus: z.enum(["cancelled"])
});

export async function setInvoiceStatus(input: unknown) {
  const parsed = setInvoiceStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من حالة الفاتورة. وضع الديمو لا يطبق التغيير فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();

    if (!hasPermission(user.role, "invoices:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لتعديل حالة الفواتير."
      };
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        clinicId: user.clinicId,
        OR: [{ id: parsed.data.invoiceId }, { invoiceNumber: parsed.data.invoiceId }]
      }
    });

    if (!invoice) {
      return {
        ok: false,
        message: "الفاتورة غير موجودة داخل العيادة الحالية."
      };
    }

    const currentStatus = fromDatabaseEnum<InvoiceStatus>(invoice.status);

    if (currentStatus === parsed.data.nextStatus) {
      return {
        ok: true,
        message: "حالة الفاتورة محدثة مسبقًا."
      };
    }

    if (parsed.data.nextStatus === "cancelled") {
      if (toMoneyNumber(invoice.paidAmount) > 0) {
        return {
          ok: false,
          message: "لا يمكن إلغاء فاتورة عليها دفعات مسجلة."
        };
      }

      await prisma.invoice.update({
        where: {
          id: invoice.id
        },
        data: {
          status: toDatabaseEnum(parsed.data.nextStatus) as "CANCELLED",
          balance: 0
        }
      });
    }

    await writeAuditLog({
      entityType: "invoice",
      entityId: invoice.id,
      action: "update-status",
      oldValuesJson: {
        status: currentStatus,
        balance: toMoneyNumber(invoice.balance)
      },
      newValuesJson: {
        status: parsed.data.nextStatus,
        balance: parsed.data.nextStatus === "cancelled" ? 0 : toMoneyNumber(invoice.balance)
      }
    });

    return {
      ok: true,
      message:
        parsed.data.nextStatus === "cancelled"
          ? "تم إلغاء الفاتورة بنجاح."
          : "تم تحديث حالة الفاتورة بنجاح."
    };
  } catch (error) {
    return {
      ok: false,
        message: error instanceof Error ? error.message : "تعذر تحديث حالة الفاتورة."
    };
  }
}
