"use server";

import { redirect } from "next/navigation";

import { hashPassword } from "@/lib/auth/passwords";
import { hashToken } from "@/lib/auth/tokens";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { resetPasswordFormSchema } from "@/features/auth/schemas/auth-form.schema";

function redirectToResetError(token: string, message: string): never {
  redirect(`/reset-password/${token}?error=${encodeURIComponent(message)}`);
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordFormSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? "")
  });

  if (!parsed.success) {
    redirectToResetError(
      String(formData.get("token") ?? ""),
      parsed.error.issues[0]?.message ?? "Unable to reset password."
    );
  }

  if (shouldUseDemoData()) {
    redirect(`/login?success=${encodeURIComponent("تم حفظ كلمة المرور في وضع الديمو.")}`);
  }

  const resetToken = await prisma.passwordResetToken.findFirst({
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

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
    redirectToResetError(parsed.data.token, "رابط إعادة التعيين غير صالح أو منتهي.");
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const usedAt = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: resetToken.userId
      },
      data: {
        passwordHash
      }
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null
      },
      data: {
        usedAt
      }
    })
  ]);

  redirect(`/login?success=${encodeURIComponent("تم تحديث كلمة المرور بنجاح.")}`);
}
