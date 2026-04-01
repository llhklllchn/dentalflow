import { hashToken } from "@/lib/auth/tokens";
import { runWithDataSource } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";

export type ResetPasswordPreview = {
  isValid: boolean;
  clinicName?: string;
  emailHint?: string;
  expiresAtLabel?: string;
  errorMessage?: string;
};

function formatPreviewDateTime(value: Date) {
  return new Intl.DateTimeFormat("ar-JO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return email;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export async function getResetPasswordPreview(
  token: string
): Promise<ResetPasswordPreview> {
  if (!token) {
    return {
      isValid: false,
      errorMessage: "رابط إعادة التعيين غير مكتمل."
    };
  }

  return await runWithDataSource<ResetPasswordPreview>({
    demo: async () => ({
      isValid: true,
      clinicName: "DentFlow Demo Clinic",
      emailHint: maskEmail("owner@dentflow.local"),
      expiresAtLabel: formatPreviewDateTime(new Date(Date.now() + 30 * 60 * 1000))
    }),
    live: async () => {
      const resetToken = await prisma.passwordResetToken.findFirst({
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
          user: {
            select: {
              email: true,
              clinic: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      if (!resetToken) {
        return {
          isValid: false,
          errorMessage: "رابط إعادة التعيين غير موجود أو لم يعد صالحًا."
        };
      }

      if (resetToken.usedAt) {
        return {
          isValid: false,
          errorMessage: "تم استخدام هذا الرابط مسبقًا. اطلب رابطًا جديدًا للمتابعة."
        };
      }

      if (resetToken.expiresAt.getTime() < Date.now()) {
        return {
          isValid: false,
          errorMessage: "انتهت صلاحية رابط إعادة التعيين. اطلب رابطًا جديدًا."
        };
      }

      return {
        isValid: true,
        clinicName: resetToken.user.clinic.name,
        emailHint: maskEmail(resetToken.user.email),
        expiresAtLabel: formatPreviewDateTime(resetToken.expiresAt)
      };
    }
  });
}
