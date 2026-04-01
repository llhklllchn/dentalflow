import { payments } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency, formatDate, formatFullName } from "@/lib/domain/mappers";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";

type GetPaymentsListOptions = {
  search?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
};

const paymentMethods = ["all", "cash", "card", "transfer", "mixed"] as const;

function normalizePaymentMethod(
  value: string | undefined
): (typeof paymentMethods)[number] {
  return paymentMethods.includes(value as (typeof paymentMethods)[number])
    ? (value as (typeof paymentMethods)[number])
    : "all";
}

function isIsoDateInput(value: string | undefined) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function getPaymentsList(options?: GetPaymentsListOptions) {
  const search = options?.search?.trim().toLowerCase();
  const method = normalizePaymentMethod(options?.method?.trim().toLowerCase());
  const dateFrom = isIsoDateInput(options?.dateFrom?.trim()) ? options?.dateFrom?.trim() : "";
  const dateTo = isIsoDateInput(options?.dateTo?.trim()) ? options?.dateTo?.trim() : "";

  return await runWithDataSource({
    demo: async () =>
      payments.filter((payment) => {
        const matchesSearch = search
          ? `${payment.patient} ${payment.invoiceId}`.toLowerCase().includes(search)
          : true;
        const matchesMethod = method === "all" ? true : payment.method === method;
        const matchesFrom = dateFrom ? payment.date >= dateFrom : true;
        const matchesTo = dateTo ? payment.date <= dateTo : true;

        return matchesSearch && matchesMethod && matchesFrom && matchesTo;
      }),
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinic = await getClinicContext();
      const records = await prisma.payment.findMany({
        where: {
          clinicId,
          ...(method !== "all"
            ? {
                paymentMethod: method.toUpperCase() as "CASH" | "CARD" | "TRANSFER" | "MIXED"
              }
            : {}),
          ...(dateFrom || dateTo
            ? {
                paidAt: {
                  ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
                  ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {})
                }
              }
            : {}),
          ...(search
            ? {
                OR: [
                  {
                    invoice: {
                      is: {
                        invoiceNumber: {
                          contains: search,
                          mode: "insensitive"
                        }
                      }
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
          paidAt: "desc"
        },
        include: {
          patient: true,
          invoice: {
            select: {
              invoiceNumber: true
            }
          }
        }
      });

      return records.map((payment) => ({
        id: payment.id,
        patientId: payment.patientId,
        patient: formatFullName(payment.patient.firstName, payment.patient.lastName),
        invoiceId: payment.invoice.invoiceNumber,
        amount: formatCurrency(payment.amount, clinic.currency),
        method: payment.paymentMethod.toLowerCase(),
        date: formatDate(payment.paidAt)
      }));
    }
  });
}
