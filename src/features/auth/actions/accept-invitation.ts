"use server";

import { redirect } from "next/navigation";

import { hashPassword } from "@/lib/auth/passwords";
import { hashToken } from "@/lib/auth/tokens";
import { createUserSession } from "@/lib/auth/session";
import { toSessionUser } from "@/lib/auth/session-user";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { acceptInvitationFormSchema } from "@/features/auth/schemas/auth-form.schema";

function redirectToInvitationError(token: string, message: string): never {
  redirect(`/accept-invitation/${token}?error=${encodeURIComponent(message)}`);
}

export async function acceptInvitationAction(formData: FormData) {
  const parsed = acceptInvitationFormSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? "")
  });

  if (!parsed.success) {
    redirectToInvitationError(
      String(formData.get("token") ?? ""),
      parsed.error.issues[0]?.message ?? "Unable to accept invitation."
    );
  }

  if (shouldUseDemoData()) {
    await createUserSession({
      id: "usr_demo_staff",
      clinicId: "cln_demo_live",
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: "staff@dentflow.local",
      role: "receptionist"
    });

    redirect("/dashboard");
  }

  const invitation = await prisma.staffInvitation.findFirst({
    where: {
      OR: [
        {
          token: hashToken(parsed.data.token)
        },
        {
          token: parsed.data.token
        }
      ]
    }
  });

  if (
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.expiresAt.getTime() < Date.now()
  ) {
    redirectToInvitationError(parsed.data.token, "الدعوة غير صالحة أو منتهية.");
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const acceptedUser = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: {
        clinicId_email: {
          clinicId: invitation.clinicId,
          email: invitation.email
        }
      }
    });

    const user = existingUser
      ? await tx.user.update({
          where: {
            id: existingUser.id
          },
          data: {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            passwordHash,
            role: invitation.role,
            status: "ACTIVE"
          }
        })
      : await tx.user.create({
          data: {
            clinicId: invitation.clinicId,
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            email: invitation.email,
            passwordHash,
            role: invitation.role,
            status: "ACTIVE"
          }
        });

    await tx.staffInvitation.update({
      where: {
        id: invitation.id
      },
      data: {
        status: "ACCEPTED"
      }
    });

    return user;
  });

  await createUserSession(
    toSessionUser({
      id: acceptedUser.id,
      clinicId: acceptedUser.clinicId,
      firstName: acceptedUser.firstName,
      lastName: acceptedUser.lastName,
      email: acceptedUser.email,
      role: acceptedUser.role
    })
  );

  redirect("/dashboard");
}
