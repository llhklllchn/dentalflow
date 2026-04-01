import {
  appointmentsBoard,
  dentists,
  services
} from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { formatTime, fromDatabaseEnum } from "@/lib/domain/mappers";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { AppointmentStatus } from "@/types/domain";

function parseDemoTimeRange(range: string) {
  const [startTime = "", endTime = ""] = range.split("-").map((value) => value.trim());
  return { startTime, endTime };
}

export async function getAppointmentEditForm(appointmentId: string) {
  return await runWithDataSource({
    demo: async () => {
      const appointment = appointmentsBoard.find((item) => item.id === appointmentId);

      if (!appointment) {
        return null;
      }

      const matchedDentist = dentists.find((item) => item.name === appointment.dentist);
      const matchedService = services.find((item) => item.name === appointment.service);
      const { startTime, endTime } = parseDemoTimeRange(appointment.time);

      return {
        id: appointment.id,
        patientId: appointment.patientId,
        dentistId: matchedDentist?.id ?? dentists[0]?.id ?? "",
        serviceId: matchedService?.id ?? services[0]?.id ?? "",
        status: appointment.status,
        appointmentDate: "2026-03-29",
        startTime,
        endTime,
        notes: ""
      };
    },
    live: async () => {
      const clinicId = await getSessionClinicId();
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          clinicId
        }
      });

      if (!appointment) {
        return null;
      }

      return {
        id: appointment.id,
        patientId: appointment.patientId,
        dentistId: appointment.dentistId,
        serviceId: appointment.serviceId,
        status: fromDatabaseEnum(appointment.status) as AppointmentStatus,
        appointmentDate: appointment.startsAt.toISOString().slice(0, 10),
        startTime: formatTime(appointment.startsAt),
        endTime: formatTime(appointment.endsAt),
        notes: appointment.notes ?? ""
      };
    }
  });
}
