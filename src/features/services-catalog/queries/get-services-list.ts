import { services } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/domain/mappers";
import { getClinicContext } from "@/lib/tenant/clinic-context";
import { getSessionClinicId } from "@/lib/tenant/scope";

type GetServicesListOptions = {
  search?: string;
  includeInactive?: boolean;
};

function parseNumberFromLabel(value: string) {
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getServicesList(options?: GetServicesListOptions) {
  const search = options?.search?.trim();
  const includeInactive = options?.includeInactive ?? false;

  return await runWithDataSource({
    demo: async () =>
      services
        .filter((service) => {
          const matchesSearch = search
            ? `${service.name} ${service.description ?? ""}`
                .toLowerCase()
                .includes(search.toLowerCase())
            : true;
          const matchesActivity = includeInactive ? true : service.isActive !== false;
          return matchesSearch && matchesActivity;
        })
        .map((service) => ({
          ...service,
          description: service.description ?? "",
          defaultDurationMinutes:
            service.defaultDurationMinutes ?? parseNumberFromLabel(service.duration),
          priceValue: service.priceValue ?? parseNumberFromLabel(service.price),
          isActive: service.isActive ?? true
        })),
    live: async () => {
      const clinicId = await getSessionClinicId();
      const clinic = await getClinicContext();
      const records = await prisma.service.findMany({
        where: {
          clinicId,
          ...(includeInactive ? {} : { isActive: true }),
          ...(search
            ? {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: "insensitive"
                    }
                  },
                  {
                    description: {
                      contains: search,
                      mode: "insensitive"
                    }
                  }
                ]
              }
            : {})
        },
        orderBy: {
          name: "asc"
        }
      });

      return records.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description ?? "",
        duration: `${service.defaultDurationMinutes} دقيقة`,
        price: formatCurrency(service.price, clinic.currency),
        defaultDurationMinutes: service.defaultDurationMinutes,
        priceValue: Number(service.price),
        isActive: service.isActive
      }));
    }
  });
}
