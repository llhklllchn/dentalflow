"use server";

import { staffInvitationFormSchema } from "@/features/users/schemas/staff-invitation.schema";
import { INVITATION_DURATION_HOURS } from "@/lib/auth/constants";
import { generateStoredToken } from "@/lib/auth/tokens";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { buildAppUrl } from "@/lib/communications/app-url";
import { sendEmail } from "@/lib/communications/email";
import { buildStaffInvitationEmail } from "@/lib/communications/templates";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { getRoleLabel } from "@/lib/domain/labels";
import { toDatabaseEnum } from "@/lib/domain/mappers";
import { hasPermission } from "@/lib/permissions/permissions";
import { getScopedSessionUser } from "@/lib/tenant/scope";

export async function inviteStaff(input: unknown) {
  const parsed = staffInvitationFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten()
    };
  }

  if (shouldUseDemoData()) {
    return {
      ok: true,
      message: "تم التحقق من الدعوة. وضع الديمو لا يحفظها فعليًا.",
      data: parsed.data
    };
  }

  try {
    const user = await getScopedSessionUser();
    const invitationToken = generateStoredToken();

    if (!hasPermission(user.role, "staff:*")) {
      return {
        ok: false,
        message: "ليس لديك صلاحية لدعوة الموظفين."
      };
    }

    const invitation = await prisma.staffInvitation.upsert({
      where: {
        clinicId_email: {
          clinicId: user.clinicId,
          email: parsed.data.email.toLowerCase()
        }
      },
      update: {
        role: toDatabaseEnum(parsed.data.role) as
          | "OWNER"
          | "ADMIN"
          | "DENTIST"
          | "RECEPTIONIST"
          | "ACCOUNTANT"
          | "ASSISTANT",
        token: invitationToken.storedToken,
        status: "PENDING",
        expiresAt: new Date(Date.now() + INVITATION_DURATION_HOURS * 60 * 60 * 1000),
        invitedBy: user.id
      },
      create: {
        clinicId: user.clinicId,
        email: parsed.data.email.toLowerCase(),
        role: toDatabaseEnum(parsed.data.role) as
          | "OWNER"
          | "ADMIN"
          | "DENTIST"
          | "RECEPTIONIST"
          | "ACCOUNTANT"
          | "ASSISTANT",
        token: invitationToken.storedToken,
        status: "PENDING",
        expiresAt: new Date(Date.now() + INVITATION_DURATION_HOURS * 60 * 60 * 1000),
        invitedBy: user.id
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
      roleLabel: getRoleLabel(parsed.data.role),
      expiresHours: INVITATION_DURATION_HOURS
    });

    await sendEmail({
      to: parsed.data.email.toLowerCase(),
      subject: invitationEmail.subject,
      text: invitationEmail.text,
      html: invitationEmail.html
    });

    await writeAuditLog({
      entityType: "staff_invitation",
      entityId: invitation.id,
      action: "create_or_refresh",
      newValuesJson: parsed.data
    });

    return {
      ok: true,
      message: "تم حفظ الدعوة وإرسالها بالبريد بنجاح.",
      data: {
        id: invitation.id,
        invitationUrl
      }
    };
  } catch (error) {
    return {
      ok: false,
        message: error instanceof Error ? error.message : "تعذر إرسال دعوة الموظف."
    };
  }
}
