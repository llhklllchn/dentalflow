import { type StaffListItem, staff } from "@/lib/constants/mock-data";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { formatFullName, fromDatabaseEnum } from "@/lib/domain/mappers";
import { getSessionClinicId } from "@/lib/tenant/scope";
import { Role } from "@/types/domain";

export async function getStaffList(): Promise<StaffListItem[]> {
  return await runWithDataSource<StaffListItem[]>({
    demo: async () => staff,
    live: async () => {
      const clinicId = await getSessionClinicId();
      const [users, invitations] = await Promise.all([
        prisma.user.findMany({
          where: {
            clinicId
          },
          orderBy: {
            createdAt: "asc"
          }
        }),
        prisma.staffInvitation.findMany({
          where: {
            clinicId,
            status: "PENDING"
          },
          orderBy: {
            createdAt: "desc"
          }
        })
      ]);

      return [
        ...users.map((user) => ({
          id: user.id,
          name: formatFullName(user.firstName, user.lastName),
          role: fromDatabaseEnum<Role>(user.role),
          status: user.status.toLowerCase(),
          email: user.email,
          recordType: "user" as const
        })),
        ...invitations.map((invitation) => ({
          id: invitation.id,
          name: "دعوة معلقة",
          role: fromDatabaseEnum<Role>(invitation.role),
          status: "invited",
          email: invitation.email,
          recordType: "invitation" as const,
          expiresAt: invitation.expiresAt.toISOString().slice(0, 10)
        }))
      ];
    }
  });
}
