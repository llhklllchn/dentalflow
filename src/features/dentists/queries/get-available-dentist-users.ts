import { staff } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { formatFullName } from "@/lib/domain/mappers";
import { getSessionClinicId } from "@/lib/tenant/scope";

export async function getAvailableDentistUsers() {
  return await runWithDataSource({
    demo: async () =>
      staff
        .filter((member) => member.role === "dentist")
        .map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email
        })),
    live: async () => {
      const clinicId = await getSessionClinicId();
      const [users, existingProfiles] = await Promise.all([
        prisma.user.findMany({
          where: {
            clinicId,
            role: "DENTIST",
            status: "ACTIVE"
          },
          orderBy: {
            createdAt: "asc"
          }
        }),
        prisma.dentist.findMany({
          where: {
            clinicId
          },
          select: {
            userId: true
          }
        })
      ]);

      const usedUserIds = new Set(existingProfiles.map((profile) => profile.userId));

      return users
        .filter((user) => !usedUserIds.has(user.id))
        .map((user) => ({
          id: user.id,
          name: formatFullName(user.firstName, user.lastName),
          email: user.email
        }));
    }
  });
}
