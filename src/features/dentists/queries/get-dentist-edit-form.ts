import { dentists } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { getSessionClinicId } from "@/lib/tenant/scope";

export async function getDentistEditForm(dentistId: string) {
  return await runWithDataSource({
    demo: async () => {
      const dentist = dentists.find((item) => item.id === dentistId) ?? dentists[0];

      return {
        id: dentist.id,
        specialty: dentist.specialty,
        licenseNumber: dentist.licenseNumber ?? "",
        colorCode: dentist.color,
        defaultAppointmentDuration: dentist.defaultAppointmentDuration ?? 30,
        startTime: dentist.startTime ?? "09:00",
        endTime: dentist.endTime ?? "17:00"
      };
    },
    live: async () => {
      const clinicId = await getSessionClinicId();
      const dentist = await prisma.dentist.findFirst({
        where: {
          id: dentistId,
          clinicId
        }
      });

      if (!dentist) {
        const fallback = dentists[0];

        return {
          id: fallback?.id ?? dentistId,
          specialty: fallback?.specialty ?? "",
          licenseNumber: fallback?.licenseNumber ?? "",
          colorCode: fallback?.color ?? "#0F766E",
          defaultAppointmentDuration: fallback?.defaultAppointmentDuration ?? 30,
          startTime: fallback?.startTime ?? "09:00",
          endTime: fallback?.endTime ?? "17:00"
        };
      }

      const workingHours = (dentist.workingHoursJson ?? null) as
        | { start?: string; end?: string }
        | null;

      return {
        id: dentist.id,
        specialty: dentist.specialty ?? "",
        licenseNumber: dentist.licenseNumber ?? "",
        colorCode: dentist.colorCode ?? "#0F766E",
        defaultAppointmentDuration: dentist.defaultAppointmentDuration ?? 30,
        startTime: workingHours?.start ?? "09:00",
        endTime: workingHours?.end ?? "17:00"
      };
    }
  });
}
