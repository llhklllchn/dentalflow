import { patients } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import {
  buildMedicalSummary,
  formatCurrency,
  formatDate,
  formatFullName,
  fromDatabaseEnum
} from "@/lib/domain/mappers";
import { splitNotes } from "@/lib/domain/presentation";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { InvoiceStatus } from "@/types/domain";

export async function getPatientById(patientId: string) {
  return await runWithDataSource({
    demo: async () => patients.find((patient) => patient.id === patientId) ?? null,
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinic = await getClinicContext();
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          clinicId
        },
        include: {
          medicalHistory: true,
          appointments: {
            orderBy: {
              startsAt: "desc"
            },
            take: 5,
            include: {
              service: {
                select: {
                  name: true
                }
              },
              dentist: {
                include: {
                  user: true
                }
              }
            }
          },
          invoices: {
            orderBy: {
              issueDate: "desc"
            },
            take: 5,
            select: {
              invoiceNumber: true,
              issueDate: true,
              total: true,
              status: true
            }
          }
        }
      });

      if (!patient) {
        return null;
      }

      const totalBalance = await prisma.invoice.aggregate({
        where: {
          clinicId,
          patientId: patient.id,
          status: {
            not: "CANCELLED"
          }
        },
        _sum: {
          balance: true
        }
      });

      const latestAppointment = patient.appointments[0];

      return {
        id: patient.id,
        fullName: formatFullName(patient.firstName, patient.lastName),
        phone: patient.phone,
        gender: patient.gender ?? "—",
        dateOfBirth: formatDate(patient.dateOfBirth),
        lastVisit: formatDate(latestAppointment?.startsAt),
        balance: formatCurrency(totalBalance._sum.balance, clinic.currency),
        dentistName: latestAppointment
          ? formatFullName(
              latestAppointment.dentist.user.firstName,
              latestAppointment.dentist.user.lastName
            )
          : "غير محدد",
        email: patient.email ?? "—",
        city: patient.city ?? "—",
        address: patient.address ?? "—",
        notes: splitNotes(patient.notes),
        medicalSummary: buildMedicalSummary(patient.medicalHistory ?? {}),
        recentAppointments: patient.appointments.map((appointment) => ({
          date: formatDate(appointment.startsAt),
          title: appointment.service?.name ?? "زيارة"
        })),
        recentInvoices: patient.invoices.map((invoice) => ({
          id: invoice.invoiceNumber,
          issueDate: formatDate(invoice.issueDate),
          total: formatCurrency(invoice.total, clinic.currency),
          status: fromDatabaseEnum<InvoiceStatus>(invoice.status)
        }))
      };
    }
  });
}
