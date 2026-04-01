import { hashToken } from "@/lib/auth/tokens";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { getRoleLabel } from "@/lib/domain/labels";
import { fromDatabaseEnum } from "@/lib/domain/mappers";
import { Role } from "@/types/domain";

export type InvitationPreview = {
  isValid: boolean;
  email?: string;
  clinicName?: string;
  roleLabel?: string;
  expiresAtLabel?: string;
  errorMessage?: string;
};

function formatPreviewDateTime(value: Date) {
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

export async function getInvitationPreview(token: string): Promise<InvitationPreview> {
  if (!token) {
    return {
      isValid: false,
      errorMessage: "رابط الدعوة غير مكتمل."
    };
  }

  return await runWithDataSource<InvitationPreview>({
    demo: async () => ({
      isValid: true,
      email: "staff@dentflow.local",
      clinicName: "DentFlow Demo Clinic",
      roleLabel: getRoleLabel("receptionist"),
      expiresAtLabel: formatPreviewDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
    }),
    live: async () => {
      const invitation = await prisma.staffInvitation.findFirst({
        where: {
          OR: [
            {
              token: hashToken(token)
            },
            {
              token
            }
          ]
        },
        include: {
          clinic: {
            select: {
              name: true
            }
          }
        }
      });

      if (!invitation) {
        return {
          isValid: false,
          errorMessage: "هذه الدعوة غير موجودة أو لم تعد صالحة."
        };
      }

      if (invitation.status !== "PENDING") {
        return {
          isValid: false,
          errorMessage:
            invitation.status === "ACCEPTED"
              ? "تم قبول هذه الدعوة مسبقًا."
              : "هذه الدعوة لم تعد متاحة للاستخدام."
        };
      }

      if (invitation.expiresAt.getTime() < Date.now()) {
        return {
          isValid: false,
          errorMessage: "انتهت صلاحية رابط الدعوة. اطلب من مدير العيادة إعادة الإرسال."
        };
      }

      return {
        isValid: true,
        email: invitation.email,
        clinicName: invitation.clinic.name,
        roleLabel: getRoleLabel(fromDatabaseEnum<Role>(invitation.role)),
        expiresAtLabel: formatPreviewDateTime(invitation.expiresAt)
      };
    }
  });
}
