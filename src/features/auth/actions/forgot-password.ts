"use server";

import { redirect } from "next/navigation";

import { PASSWORD_RESET_DURATION_MINUTES } from "@/lib/auth/constants";
import { generateStoredToken } from "@/lib/auth/tokens";
import { buildAppUrl } from "@/lib/communications/app-url";
import { sendEmail } from "@/lib/communications/email";
import { buildPasswordResetEmail } from "@/lib/communications/templates";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { forgotPasswordFormSchema } from "@/features/auth/schemas/auth-form.schema";

function redirectToForgotPassword(message: string): never {
  redirect(`/forgot-password?success=${encodeURIComponent(message)}`);
}

function redirectToForgotPasswordError(message: string): never {
  redirect(`/forgot-password?error=${encodeURIComponent(message)}`);
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = forgotPasswordFormSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase()
  });

  if (!parsed.success) {
    redirectToForgotPasswordError(
    parsed.error.issues[0]?.message ?? "تعذر تجهيز طلب استعادة كلمة المرور."
    );
  }

  if (shouldUseDemoData()) {
    redirectToForgotPassword(
      "تم تجهيز تدفق الاستعادة. في وضع الديمو لا يتم إرسال بريد فعلي."
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: parsed.data.email,
        status: "ACTIVE"
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (user) {
      const resetTokenPair = generateStoredToken();

      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null
        }
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetTokenPair.storedToken,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_DURATION_MINUTES * 60 * 1000)
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

      const resetUrl = buildAppUrl(`/reset-password/${resetTokenPair.plainToken}`);
      const resetEmail = buildPasswordResetEmail({
        clinicName: clinic?.name ?? "DentFlow",
        resetUrl,
        expiresMinutes: PASSWORD_RESET_DURATION_MINUTES
      });

      await sendEmail({
        to: user.email,
        subject: resetEmail.subject,
        text: resetEmail.text,
        html: resetEmail.html
      });
    }
  } catch (error) {
    redirectToForgotPasswordError(
      error instanceof Error ? error.message : "تعذر إرسال رابط الاستعادة حاليًا."
    );
  }

  redirectToForgotPassword(
    "إذا كان البريد موجودًا في النظام فسيتم تجهيز رابط إعادة التعيين."
  );
}
