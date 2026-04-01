import { appointmentsBoard } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import {
  formatFullName,
  formatTimeRange,
  fromDatabaseEnum
} from "@/lib/domain/mappers";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { AppointmentStatus } from "@/types/domain";

type GetAppointmentsBoardOptions = {
  search?: string;
  status?: AppointmentStatus | "all";
};

export type AppointmentsBoardItem = {
  id: string;
  patientId: string;
  patient: string;
  dentist: string;
  service: string;
  time: string;
  status: AppointmentStatus;
};

export async function getAppointmentsBoard(
  options?: GetAppointmentsBoardOptions
): Promise<AppointmentsBoardItem[]> {
  const search = options?.search?.trim();
  const status = options?.status;

  return await runWithDataSource({
    demo: async () =>
      appointmentsBoard.filter((appointment) => {
        const matchesSearch = search
          ? `${appointment.patient} ${appointment.dentist} ${appointment.service}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true;
        const matchesStatus = status && status !== "all" ? appointment.status === status : true;
        return matchesSearch && matchesStatus;
      }),
    live: async () => {
      const clinicId = await getSessionClinicId();
      const appointments = await prisma.appointment.findMany({
        where: {
          clinicId,
          ...(status && status !== "all"
            ? {
                status: status.toUpperCase() as
                  | "SCHEDULED"
                  | "CONFIRMED"
                  | "CHECKED_IN"
                  | "IN_PROGRESS"
                  | "COMPLETED"
                  | "CANCELLED"
                  | "NO_SHOW"
              }
            : {}),
          ...(search
            ? {
                OR: [
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
                    dentist: {
                      is: {
                        user: {
                          is: {
                            firstName: {
                              contains: search,
                              mode: "insensitive"
                            }
                          }
                        }
                      }
                    }
                  },
                  {
                    dentist: {
                      is: {
                        user: {
                          is: {
                            lastName: {
                              contains: search,
                              mode: "insensitive"
                            }
                          }
                        }
                      }
                    }
                  },
                  {
                    service: {
                      is: {
                        name: {
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
          startsAt: "asc"
        },
        take: 20,
        include: {
          patient: true,
          dentist: {
            include: {
              user: true
            }
          },
          service: true
        }
      });

      return appointments.map((appointment) => ({
        id: appointment.id,
        patientId: appointment.patientId,
        patient: formatFullName(appointment.patient.firstName, appointment.patient.lastName),
        dentist: formatFullName(
          appointment.dentist.user.firstName,
          appointment.dentist.user.lastName
        ),
        service: appointment.service.name,
        time: formatTimeRange(appointment.startsAt, appointment.endsAt),
        status: fromDatabaseEnum<AppointmentStatus>(appointment.status)
      }));
    }
  });
}
