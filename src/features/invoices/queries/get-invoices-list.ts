import { type InvoiceDetails, invoices } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import {
  formatCurrency,
  formatFullName,
  fromDatabaseEnum
} from "@/lib/domain/mappers";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { InvoiceStatus } from "@/types/domain";
import { extractFormattedAmount } from "@/lib/utils/formatted-value";
import { normalizeInvoiceView, InvoiceView } from "@/lib/filters/list-presets";

type GetInvoicesListOptions = {
  search?: string;
  status?: string;
  view?: InvoiceView | string;
};

export async function getInvoicesList(
  options?: GetInvoicesListOptions
): Promise<InvoiceDetails[]> {
  const search = options?.search?.trim();
  const status = options?.status?.trim().toLowerCase();
  const view = normalizeInvoiceView(options?.view?.trim().toLowerCase());
  const allowedStatuses =
    status && status !== "all"
      ? [status]
      : view === "settled"
        ? ["paid"]
        : view === "attention"
          ? ["issued", "partially_paid", "overdue"]
          : null;

  return await runWithDataSource({
    demo: async () =>
      invoices.filter((invoice) => {
        const matchesStatus = allowedStatuses ? allowedStatuses.includes(invoice.status) : true;
        const matchesView =
          view === "open_balance"
            ? extractFormattedAmount(invoice.balance) > 0 && invoice.status !== "cancelled"
            : true;

        if (!search) {
          return matchesStatus && matchesView;
        }

        return (
          matchesView &&
          matchesStatus &&
          `${invoice.id} ${invoice.patient}`.toLowerCase().includes(search.toLowerCase())
        );
      }),
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinic = await getClinicContext();
      const records = await prisma.invoice.findMany({
        where: {
          clinicId,
          ...(allowedStatuses
            ? {
                status: {
                  in: allowedStatuses.map((item) =>
                    item.toUpperCase()
                  ) as Array<
                    | "DRAFT"
                    | "ISSUED"
                    | "PARTIALLY_PAID"
                    | "PAID"
                    | "OVERDUE"
                    | "CANCELLED"
                  >
                }
              }
            : {}),
          ...(view === "open_balance"
            ? {
                balance: {
                  gt: 0
                },
                status: {
                  not: "CANCELLED"
                }
              }
            : {}),
          ...(search
            ? {
                OR: [
                  {
                    invoiceNumber: {
                      contains: search,
                      mode: "insensitive"
                    }
                  },
                  {
                    patient: {
                      is: {
                        firstName: {
                          contains: search,
                          mode: "insensitive"
                        }
                      }
                    }
                  },
                  {
                    patient: {
                      is: {
                        lastName: {
                          contains: search,
                          mode: "insensitive"
                        }
                      }
                    }
                  },
                  {
                    patient: {
                      is: {
                        phone: {
                          contains: search,
                          mode: "insensitive"
                        }
                      }
                    }
                  }
                ]
              }
            : {})
        },
        orderBy: {
          issueDate: "desc"
        },
        include: {
          patient: true
        }
      });

      return records.map((invoice) => ({
        id: invoice.invoiceNumber,
        patientId: invoice.patientId,
        patientPhone: invoice.patient.phone,
        patient: formatFullName(invoice.patient.firstName, invoice.patient.lastName),
        total: formatCurrency(invoice.total, clinic.currency),
        paid: formatCurrency(invoice.paidAmount, clinic.currency),
        balance: formatCurrency(invoice.balance, clinic.currency),
        status: fromDatabaseEnum<InvoiceStatus>(invoice.status),
        issueDate: invoice.issueDate.toISOString().slice(0, 10),
        items: [] as InvoiceDetails["items"]
      }));
    }
  });
}
