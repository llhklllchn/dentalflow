import { appointmentsBoard } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { formatFullName, formatTime } from "@/lib/domain/mappers";

type PrepareAppointmentRemindersOptions = {
  clinicId: string;
  hoursAhead?: number;
};

export async function prepareAppointmentReminders(
  options: PrepareAppointmentRemindersOptions
) {
  const hoursAhead = options.hoursAhead ?? 24;

  return await runWithDataSource({
    demo: async () =>
      appointmentsBoard.map((appointment) => ({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        patientName: appointment.patient,
        dentistName: appointment.dentist,
        appointmentTime: appointment.time,
        channel: "whatsapp" as const,
        messageBody: `مرحبًا ${appointment.patient}، لديك موعد خلال ${hoursAhead} ساعة.`
      })),
    live: async () => {
      const from = new Date();
      const to = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);

      const appointments = await prisma.appointment.findMany({
        where: {
          clinicId: options.clinicId,
          startsAt: {
            gte: from,
            lte: to
          },
          status: {
            in: ["SCHEDULED", "CONFIRMED"]
          }
        },
        include: {
          patient: true,
          dentist: {
            include: {
              user: true
            }
          }
        }
      });

      return appointments.map((appointment) => {
        const patientName = formatFullName(
          appointment.patient.firstName,
          appointment.patient.lastName
        );
        const dentistName = formatFullName(
          appointment.dentist.user.firstName,
          appointment.dentist.user.lastName
        );
        const appointmentTime = formatTime(appointment.startsAt);

        return {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          patientName,
          dentistName,
          appointmentTime,
          channel: "whatsapp" as const,
          messageBody: `مرحبًا ${patientName}، لديك موعد قريب الساعة ${appointmentTime} مع ${dentistName}.`
        };
      });
    }
  });
}
