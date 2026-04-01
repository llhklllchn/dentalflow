"use server";

import { z } from "zod";

import { INVITATION_DURATION_HOURS } from "@/lib/auth/constants";
import { generateStoredToken } from "@/lib/auth/tokens";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { buildAppUrl } from "@/lib/communications/app-url";
import { sendEmail } from "@/lib/communications/email";
import { buildStaffInvitationEmail } from "@/lib/communications/templates";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { getRoleLabel } from "@/lib/domain/labels";
import { fromDatabaseEnum } from "@/lib/domain/mappers";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";
import { Role } from "@/types/domain";

const refreshStaffInvitationSchema = z.object({
  invitationId: z.string().min(1, "Invitation id is required.")
});

export async function refreshStaffInvitation(input: unknown) {
  const parsed = refreshStaffInvitationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من تجديد الدعوة.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();
    const invitationToken = generateStoredToken();

    if (!hasPermission(user.role, "staff:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لإدارة الدعوات."
      };
    }

    const invitation = await prisma.staffInvitation.findFirst({
      where: {
        id: parsed.data.invitationId,
        clinicId: user.clinicId
      }
    });

    if (!invitation) {
      return {
        ok: false,
        message: "الدعوة غير موجودة داخل العيادة الحالية."
      };
    }

    if (invitation.status === "ACCEPTED") {
      return {
        ok: false,
        message: "تم قبول هذه الدعوة مسبقًا ولا يمكن تجديدها."
      };
    }

    const updatedInvitation = await prisma.staffInvitation.update({
      where: {
        id: invitation.id
      },
      data: {
        status: "PENDING",
        token: invitationToken.storedToken,
        invitedBy: user.id,
        expiresAt: new Date(Date.now() + INVITATION_DURATION_HOURS * 60 * 60 * 1000)
      }
    });

    const clinic = await prisma.clinic.findUnique({
      where: {
        id: user.clinicId
      },
      select: {
        name: true
      }
    });

    const invitationUrl = buildAppUrl(`/accept-invitation/${invitationToken.plainToken}`);
    const invitationEmail = buildStaffInvitationEmail({
      clinicName: clinic?.name ?? "DentFlow",
      invitationUrl,
      roleLabel: getRoleLabel(fromDatabaseEnum<Role>(updatedInvitation.role)),
      expiresHours: INVITATION_DURATION_HOURS
    });

    await sendEmail({
      to: updatedInvitation.email,
      subject: invitationEmail.subject,
      text: invitationEmail.text,
      html: invitationEmail.html
    });

    await writeAuditLog({
      entityType: "staff_invitation",
      entityId: updatedInvitation.id,
      action: "refresh",
      oldValuesJson: {
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString()
      },
      newValuesJson: {
        status: updatedInvitation.status,
        expiresAt: updatedInvitation.expiresAt.toISOString()
      }
    });

    return {
      ok: true,
      message: "تم تجديد الدعوة وإعادة إرسالها بالبريد بنجاح.",
      data: {
        invitationUrl
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to refresh staff invitation."
    };
  }
}
