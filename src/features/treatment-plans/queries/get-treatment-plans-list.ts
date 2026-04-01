import { treatmentPlans } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import {
  formatCurrency,
  formatDate,
  formatFullName,
  fromDatabaseEnum
} from "@/lib/domain/mappers";
import { calculateCompletionPercentage } from "@/lib/domain/presentation";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { TreatmentPlanStatus } from "@/types/domain";

type GetTreatmentPlansListOptions = {
  search?: string;
};

export async function getTreatmentPlansList(options?: GetTreatmentPlansListOptions) {
  const search = options?.search?.trim().toLowerCase();

  return await runWithDataSource({
    demo: async () =>
      treatmentPlans.filter((plan) => {
        if (!search) {
          return true;
        }

        const haystack = [
          plan.title,
          plan.patientName,
          plan.dentistName,
          ...plan.items.map((item) => `${item.serviceName} ${item.toothNumber} ${item.description}`)
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      }),
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinic = await getClinicContext();
      const records = await prisma.treatmentPlan.findMany({
        where: {
          clinicId,
          ...(search
            ? {
                OR: [
                  {
                    title: {
                      contains: search,
                      mode: "insensitive"
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
                    dentist: {
                      is: {
                        user: {
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
                            }
                          ]
                        }
                      }
                    }
                  },
                  {
                    items: {
                      some: {
                        OR: [
                          {
                            description: {
                              contains: search,
                              mode: "insensitive"
                            }
                          },
                          {
                            toothNumber: {
                              contains: search,
                              mode: "insensitive"
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
          patient: true,
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
      });

      return records.map((plan) => {
        const completedItems = plan.items.filter((item) => item.status === "COMPLETED").length;

        return {
          id: plan.id,
          patientId: plan.patientId,
          patientName: formatFullName(plan.patient.firstName, plan.patient.lastName),
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
    }
  });
}
