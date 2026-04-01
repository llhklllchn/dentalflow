import { patients } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import {
  formatCurrency,
  formatDate,
  formatFullName,
  toMoneyNumber
} from "@/lib/domain/mappers";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";

type GetPatientsListOptions = {
  search?: string;
};

export async function getPatientsList(options?: GetPatientsListOptions) {
  const search = options?.search?.trim();

  return await runWithDataSource({
    demo: async () => {
      const filteredPatients = !search
        ? patients
        : patients.filter((patient) => {
            const haystack = `${patient.fullName} ${patient.phone}`.toLowerCase();
            return haystack.includes(search.toLowerCase());
          });

      return filteredPatients;
    },
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinic = await getClinicContext();
      const records = await prisma.patient.findMany({
        where: {
          clinicId,
          archivedAt: null,
          ...(search
            ? {
                OR: [
                  {
                    firstName: {
                      contains: search,
                      mode: "insensitive"
                    }
                  },
                  {
                    lastName: {
                      contains: search,
                      mode: "insensitive"
                    }
                  },
                  {
                    phone: {
                      contains: search,
                      mode: "insensitive"
                    }
                  }
                ]
              }
            : {})
        },
        orderBy: {
          createdAt: "desc"
        },
        include: {
          appointments: {
            orderBy: {
              startsAt: "desc"
            },
            take: 1,
            include: {
              dentist: {
                include: {
                  user: true
                }
              }
            }
          },
          invoices: {
            where: {
              status: {
                not: "CANCELLED"
              }
            },
            select: {
              balance: true
            }
          }
        }
      });

      return records.map((patient) => {
        const latestAppointment = patient.appointments[0];
        const balance = patient.invoices.reduce(
          (sum, invoice) => sum + toMoneyNumber(invoice.balance),
          0
        );

        return {
          id: patient.id,
          fullName: formatFullName(patient.firstName, patient.lastName),
          phone: patient.phone,
          gender: patient.gender ?? "—",
          dateOfBirth: formatDate(patient.dateOfBirth),
          lastVisit: formatDate(latestAppointment?.startsAt),
          balance: formatCurrency(balance, clinic.currency),
          dentistName: latestAppointment
            ? formatFullName(
                latestAppointment.dentist.user.firstName,
                latestAppointment.dentist.user.lastName
              )
            : "غير محدد"
        };
      });
    }
  });
}
