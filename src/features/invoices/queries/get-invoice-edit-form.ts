import { invoices } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { toMoneyNumber } from "@/lib/domain/mappers";
import { getSessionClinicId } from "@/lib/tenant/scope";

export async function getInvoiceEditForm(invoiceId: string) {
  return await runWithDataSource({
    demo: async () => {
      const invoice = invoices.find((item) => item.id === invoiceId) ?? invoices[0];
      const firstItem = invoice.items[0];

      return {
        lookupId: invoice.id,
        patientId: invoice.patientId,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate ?? "",
        notes: invoice.notes ?? "",
        serviceName: firstItem?.name ?? "",
        description: "",
        quantity: firstItem?.quantity ?? 1,
        unitPrice: toMoneyNumber(firstItem?.unitPrice),
        discount: 0,
        tax: 0,
        paidAmount: toMoneyNumber(invoice.paid),
        balance: toMoneyNumber(invoice.balance),
        status: invoice.status
      };
    },
    live: async () => {
      const clinicId = await getSessionClinicId();
      const invoice = await prisma.invoice.findFirst({
        where: {
          clinicId,
          OR: [{ id: invoiceId }, { invoiceNumber: invoiceId }]
        },
        include: {
          items: {
            orderBy: {
              createdAt: "asc"
            },
            take: 1
          }
        }
      });

      if (!invoice) {
        return null;
      }

      const firstItem = invoice.items[0];

      return {
        lookupId: invoice.id,
        patientId: invoice.patientId,
        issueDate: invoice.issueDate.toISOString().slice(0, 10),
        dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : "",
        notes: invoice.notes ?? "",
        serviceName: firstItem?.serviceName ?? "",
        description: firstItem?.description ?? "",
        quantity: firstItem?.quantity ?? 1,
        unitPrice: toMoneyNumber(firstItem?.unitPrice),
        discount: toMoneyNumber(invoice.discount),
        tax: toMoneyNumber(invoice.tax),
        paidAmount: toMoneyNumber(invoice.paidAmount),
        balance: toMoneyNumber(invoice.balance),
        status: invoice.status.toLowerCase()
      };
    }
  });
}
