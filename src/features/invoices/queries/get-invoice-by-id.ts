import { invoices } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import {
  formatCurrency,
  formatDate,
  formatFullName,
  fromDatabaseEnum
} from "@/lib/domain/mappers";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { InvoiceStatus } from "@/types/domain";

export async function getInvoiceById(invoiceId: string) {
  return await runWithDataSource({
    demo: async () => {
      const invoice = invoices.find((item) => item.id === invoiceId) ?? invoices[0];

      return {
        lookupId: invoice.id,
        id: invoice.id,
        patientId: invoice.patientId,
        patientPhone: invoice.patientPhone,
        patient: invoice.patient,
        subtotal: invoice.subtotal ?? invoice.total,
        discount: invoice.discount ?? "0 JOD",
        tax: invoice.tax ?? "0 JOD",
        total: invoice.total,
        paid: invoice.paid,
        balance: invoice.balance,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate ?? invoice.issueDate,
        notes: invoice.notes ?? "",
        treatmentPlanTitle: invoice.treatmentPlanTitle ?? "",
        items: invoice.items,
        paymentHistory: (invoice.paymentHistory ?? []).map((payment) => ({
          ...payment,
          notes: payment.notes ?? ""
        }))
      };
    },
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinic = await getClinicContext();
      const invoice = await prisma.invoice.findFirst({
        where: {
          clinicId,
          OR: [
            {
              id: invoiceId
            },
            {
              invoiceNumber: invoiceId
            }
          ]
        },
        include: {
          patient: true,
          treatmentPlan: {
            select: {
              title: true
            }
          },
          items: {
            orderBy: {
              createdAt: "asc"
            }
          },
          payments: {
            orderBy: {
              paidAt: "desc"
            }
          }
        }
      });

      if (!invoice) {
        return null;
      }

      return {
        lookupId: invoice.id,
        id: invoice.invoiceNumber,
        patientId: invoice.patientId,
        patientPhone: invoice.patient.phone,
        patient: formatFullName(invoice.patient.firstName, invoice.patient.lastName),
        subtotal: formatCurrency(invoice.subtotal, clinic.currency),
        discount: formatCurrency(invoice.discount, clinic.currency),
        tax: formatCurrency(invoice.tax, clinic.currency),
        total: formatCurrency(invoice.total, clinic.currency),
        paid: formatCurrency(invoice.paidAmount, clinic.currency),
        balance: formatCurrency(invoice.balance, clinic.currency),
        status: fromDatabaseEnum<InvoiceStatus>(invoice.status),
        issueDate: formatDate(invoice.issueDate),
        dueDate: formatDate(invoice.dueDate),
        notes: invoice.notes ?? "",
        treatmentPlanTitle: invoice.treatmentPlan?.title ?? "",
        items: invoice.items.map((item) => ({
          name: item.serviceName,
          quantity: item.quantity,
          unitPrice: formatCurrency(item.unitPrice, clinic.currency),
          total: formatCurrency(item.lineTotal, clinic.currency)
        })),
        paymentHistory: invoice.payments.map((payment) => ({
          id: payment.id,
          amount: formatCurrency(payment.amount, clinic.currency),
          method: payment.paymentMethod.toLowerCase(),
          date: formatDate(payment.paidAt),
          notes: payment.notes ?? payment.reference ?? ""
        }))
      };
    }
  });
}
