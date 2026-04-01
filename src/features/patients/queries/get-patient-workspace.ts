import {
  dentalRecordsOverview,
  patients,
  payments,
  treatmentPlans
} from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import {
  formatCurrency,
  formatDate,
  formatFullName,
  fromDatabaseEnum
} from "@/lib/domain/mappers";
import { getStatusLabel } from "@/lib/domain/labels";
import { calculateCompletionPercentage } from "@/lib/domain/presentation";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { getPatientById } from "@/features/patients/queries/get-patient-by-id";
import { TreatmentPlanStatus } from "@/types/domain";

export type PatientTimelineEntry = {
  id: string;
  date: string;
  title: string;
  description: string;
  status:
    | "draft"
    | "issued"
    | "partially_paid"
    | "paid"
    | "overdue"
    | "cancelled"
    | "completed"
    | "scheduled"
    | "confirmed"
    | "checked_in"
    | "in_progress"
    | "approved"
    | "planned"
    | "no_show";
  tone: "brand" | "emerald" | "amber" | "slate";
  href?: string;
  hrefLabel?: string;
};

const paymentMethodLabels = {
  cash: "نقدًا",
  card: "بطاقة",
  transfer: "تحويل",
  mixed: "دفعات متعددة"
} as const;

function toTimelineTimestamp(value: string) {
  if (!value || value === "—") {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPaymentMethodLabel(value: string) {
  return paymentMethodLabels[value as keyof typeof paymentMethodLabels] ?? value;
}

function buildPatientTimeline(input: {
  patient: Awaited<ReturnType<typeof getPatientById>>;
  dentalRecords: {
    id: string;
    appointmentDate: string;
    diagnosis: string;
    procedureDone: string;
  }[];
  treatmentPlans: {
    id: string;
    title: string;
    status: TreatmentPlanStatus;
    progress: number;
    nextSession: string;
  }[];
  payments: {
    id: string;
    invoiceId: string;
    amount: string;
    method: string;
    date: string;
  }[];
}) {
  const appointmentEntries: PatientTimelineEntry[] = input.patient.recentAppointments.map(
    (appointment, index) => ({
      id: `appointment-${index}-${appointment.date}`,
      date: appointment.date,
      title: appointment.title,
      description: `آخر زيارة أو موعد ظاهر لهذا المريض كانت بتاريخ ${appointment.date}.`,
      status: "completed",
      tone: "brand",
      href: "/appointments",
      hrefLabel: "فتح المواعيد"
    })
  );

  const invoiceEntries: PatientTimelineEntry[] = input.patient.recentInvoices.map((invoice) => ({
    id: `invoice-${invoice.id}`,
    date: invoice.issueDate ?? "—",
    title: `فاتورة ${invoice.id}`,
    description: `قيمة الفاتورة ${invoice.total} وحالتها الحالية ${getStatusLabel(invoice.status)}.`,
    status: invoice.status,
    tone: invoice.status === "paid" ? "emerald" : "amber",
    href: `/invoices/${invoice.id}`,
    hrefLabel: "فتح الفاتورة"
  }));

  const recordEntries: PatientTimelineEntry[] = input.dentalRecords.map((record) => ({
    id: `record-${record.id}`,
    date: record.appointmentDate,
    title: "سجل طبي موثق",
    description: `${record.diagnosis} - ${record.procedureDone}`,
    status: "completed",
    tone: "emerald",
    href: "/dental-records",
    hrefLabel: "فتح السجلات"
  }));

  const paymentEntries: PatientTimelineEntry[] = input.payments.map((payment) => ({
    id: `payment-${payment.id}`,
    date: payment.date,
    title: `دفعة على ${payment.invoiceId}`,
    description: `تم تسجيل ${payment.amount} عبر ${getPaymentMethodLabel(payment.method)}.`,
    status: "paid",
    tone: "emerald",
    href: "/payments",
    hrefLabel: "فتح المدفوعات"
  }));

  const planEntries: PatientTimelineEntry[] = input.treatmentPlans.map((plan) => ({
    id: `plan-${plan.id}`,
    date: plan.nextSession !== "—" ? plan.nextSession : input.patient.lastVisit,
    title: plan.title,
    description:
      plan.nextSession !== "—"
        ? `الخطة بحالة ${getStatusLabel(plan.status)} وتقدمها ${plan.progress}% مع جلسة قادمة في ${plan.nextSession}.`
        : `الخطة بحالة ${getStatusLabel(plan.status)} وتقدمها ${plan.progress}% دون جلسة قادمة محددة بعد.`,
    status: plan.status,
    tone: plan.status === "approved" ? "brand" : "slate",
    href: `/treatment-plans/${plan.id}`,
    hrefLabel: "فتح الخطة"
  }));

  return [
    ...appointmentEntries,
    ...invoiceEntries,
    ...recordEntries,
    ...paymentEntries,
    ...planEntries
  ].sort((left, right) => toTimelineTimestamp(right.date) - toTimelineTimestamp(left.date));
}

export async function getPatientWorkspace(patientId: string) {
  return await runWithDataSource({
    demo: async () => {
      const fallbackPatient = patients[0];
      const patient = patients.find((item) => item.id === patientId) ?? fallbackPatient;
      const dentalRecords = dentalRecordsOverview.records.filter(
        (record) => record.patientId === patient.id
      );
      const patientTreatmentPlans = treatmentPlans.filter((plan) => plan.patientId === patient.id);
      const patientPayments = payments.filter((payment) => payment.patientId === patient.id);

      return {
        patient,
        dentalRecords,
        treatmentPlans: patientTreatmentPlans,
        payments: patientPayments,
        timeline: buildPatientTimeline({
          patient,
          dentalRecords,
          treatmentPlans: patientTreatmentPlans,
          payments: patientPayments
        })
      };
    },
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinic = await getClinicContext();
      const patient = await getPatientById(patientId);
      const [dentalRecords, planRecords, paymentRecords] = await Promise.all([
        prisma.dentalRecord.findMany({
          where: {
            clinicId,
            patientId
          },
          orderBy: {
            createdAt: "desc"
          },
          include: {
            dentist: {
              include: {
                user: true
              }
            },
            appointment: true
          }
        }),
        prisma.treatmentPlan.findMany({
          where: {
            clinicId,
            patientId
          },
          orderBy: {
            createdAt: "desc"
          },
          include: {
            dentist: {
              include: {
                user: true
              }
            },
            items: {
              orderBy: {
                sessionOrder: "asc"
              },
              include: {
                service: true
              }
            }
          }
        }),
        prisma.payment.findMany({
          where: {
            clinicId,
            patientId
          },
          orderBy: {
            paidAt: "desc"
          },
          include: {
            invoice: {
              select: {
                invoiceNumber: true
              }
            }
          }
        })
      ]);

      const mappedDentalRecords = dentalRecords.map((record) => ({
        id: record.id,
        patientId,
        patientName: patient.fullName,
        dentistName: formatFullName(record.dentist.user.firstName, record.dentist.user.lastName),
        appointmentDate: formatDate(record.appointment?.startsAt ?? record.createdAt),
        chiefComplaint: record.chiefComplaint ?? "—",
        diagnosis: record.diagnosis ?? "—",
        procedureDone: record.procedureDone ?? "—",
        prescription: record.prescription ?? "—",
        followUpNotes: record.followUpNotes ?? "—"
      }));

      const mappedTreatmentPlans = planRecords.map((plan) => {
        const completedItems = plan.items.filter(
          (item) => item.status === "COMPLETED"
        ).length;

        return {
          id: plan.id,
          patientId,
          patientName: patient.fullName,
          dentistName: formatFullName(plan.dentist.user.firstName, plan.dentist.user.lastName),
          title: plan.title,
          status: fromDatabaseEnum<TreatmentPlanStatus>(plan.status),
          estimatedTotalCost: formatCurrency(plan.estimatedTotalCost, clinic.currency),
          progress: calculateCompletionPercentage(plan.items.length, completedItems),
          nextSession: formatDate(
            plan.items.find((item) => item.plannedDate && !item.completedAt)?.plannedDate
          ),
          items: plan.items.map((item) => ({
            id: item.id,
            serviceName: item.service?.name ?? item.description ?? "خدمة علاجية",
            toothNumber: item.toothNumber ?? "—",
            description: item.description ?? "بدون وصف إضافي",
            estimatedCost: formatCurrency(item.estimatedCost, clinic.currency),
            status: fromDatabaseEnum<TreatmentPlanStatus>(item.status),
            sessionOrder: item.sessionOrder
          }))
        };
      });

      const mappedPayments = paymentRecords.map((payment) => ({
        id: payment.id,
        patientId,
        patient: patient.fullName,
        invoiceId: payment.invoice.invoiceNumber,
        amount: formatCurrency(payment.amount, clinic.currency),
        method: payment.paymentMethod.toLowerCase(),
        date: formatDate(payment.paidAt)
      }));

      return {
        patient,
        dentalRecords: mappedDentalRecords,
        treatmentPlans: mappedTreatmentPlans,
        payments: mappedPayments,
        timeline: buildPatientTimeline({
          patient,
          dentalRecords: mappedDentalRecords,
          treatmentPlans: mappedTreatmentPlans,
          payments: mappedPayments
        })
      };
    }
  });
}
