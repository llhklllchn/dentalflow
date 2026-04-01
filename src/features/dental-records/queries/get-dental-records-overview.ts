import { dentalRecordsOverview } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import {
  formatDate,
  formatFullName,
  fromDatabaseEnum
} from "@/lib/domain/mappers";
import { daysAgo } from "@/lib/domain/presentation";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { ToothStatus } from "@/types/domain";

export async function getDentalRecordsOverview() {
  return await runWithDataSource({
    demo: async () => dentalRecordsOverview,
    live: async () => {
      const clinicId = await getSessionClinicId();
      const [records, recentCount, toothRecords] = await Promise.all([
        prisma.dentalRecord.findMany({
          where: {
            clinicId
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 8,
          include: {
            patient: true,
            dentist: {
              include: {
                user: true
              }
            },
            appointment: true
          }
        }),
        prisma.dentalRecord.count({
          where: {
            clinicId,
            createdAt: {
              gte: daysAgo(30)
            }
          }
        }),
        prisma.toothRecord.findMany({
          where: {
            clinicId
          },
          orderBy: {
            updatedAt: "desc"
          },
          take: 9
        })
      ]);

      return {
        metrics: [
          {
            label: "سجلات آخر 30 يومًا",
            value: String(recentCount),
            hint: "عدد الزيارات السريرية الموثقة"
          },
          {
            label: "سجلات مع متابعة",
            value: String(records.filter((record) => record.followUpNotes).length),
            hint: "من السجلات المعروضة حاليًا"
          },
          {
            label: "أسنان موثقة",
            value: String(toothRecords.length),
            hint: "آخر تحديثات الـ odontogram"
          }
        ],
        records: records.map((record) => ({
          id: record.id,
          patientId: record.patientId,
          patientName: formatFullName(record.patient.firstName, record.patient.lastName),
          dentistName: formatFullName(record.dentist.user.firstName, record.dentist.user.lastName),
          appointmentDate: formatDate(record.appointment?.startsAt ?? record.createdAt),
          chiefComplaint: record.chiefComplaint ?? "—",
          diagnosis: record.diagnosis ?? "—",
          procedureDone: record.procedureDone ?? "—",
          prescription: record.prescription ?? "—",
          followUpNotes: record.followUpNotes ?? "—"
        })),
        odontogram: toothRecords.map((tooth) => ({
          toothNumber: tooth.toothNumber,
          status: fromDatabaseEnum<ToothStatus>(tooth.status),
          note: tooth.notes ?? ""
        }))
      };
    }
  });
}
