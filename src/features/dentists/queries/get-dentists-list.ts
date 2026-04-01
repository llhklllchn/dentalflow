import { dentists } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { formatFullName } from "@/lib/domain/mappers";
import { formatWorkingHours } from "@/lib/domain/presentation";
import { getSessionClinicId } from "@/lib/tenant/scope";

type GetDentistsListOptions = {
  search?: string;
};

export async function getDentistsList(options?: GetDentistsListOptions) {
  const search = options?.search?.trim().toLowerCase();

  return await runWithDataSource({
    demo: async () =>
      dentists.filter((dentist) => {
        if (!search) {
          return true;
        }

        return `${dentist.name} ${dentist.specialty} ${dentist.licenseNumber ?? ""}`
          .toLowerCase()
          .includes(search);
      }),
    live: async () => {
      const clinicId = await getSessionClinicId();
      const records = await prisma.dentist.findMany({
        where: {
          clinicId,
          ...(search
            ? {
                OR: [
                  {
                    specialty: {
                      contains: search,
                      mode: "insensitive"
                    }
                  },
                  {
                    licenseNumber: {
                      contains: search,
                      mode: "insensitive"
                    }
                  },
                  {
                    user: {
                      is: {
                        firstName: {
                          contains: search,
                          mode: "insensitive"
                        }
                      }
                    }
                  },
                  {
                    user: {
                      is: {
                        lastName: {
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
          createdAt: "asc"
        },
        include: {
          user: true
        }
      });

      return records.map((dentist) => {
        const workingHours = (dentist.workingHoursJson ?? null) as
          | { start?: string; end?: string }
          | null;

        return {
          id: dentist.id,
          name: formatFullName(dentist.user.firstName, dentist.user.lastName),
          specialty: dentist.specialty ?? "General Dentistry",
          color: dentist.colorCode ?? "#0F766E",
          hours: formatWorkingHours(dentist.workingHoursJson),
          licenseNumber: dentist.licenseNumber ?? "",
          defaultAppointmentDuration: dentist.defaultAppointmentDuration ?? 30,
          startTime: workingHours?.start ?? "09:00",
          endTime: workingHours?.end ?? "17:00"
        };
      });
    }
  });
}
