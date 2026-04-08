"use server";

import { redirect } from "next/navigation";

import { buildLoginRedirectPath, resolveSafeInternalPath } from "@/lib/auth/redirects";
import { verifyPassword } from "@/lib/auth/passwords";
import { createUserSession, getDemoSessionUser } from "@/lib/auth/session";
import { toSessionUser } from "@/lib/auth/session-user";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { loginFormSchema } from "@/features/auth/schemas/auth-form.schema";

function redirectToLoginWithError(message: string, nextPath?: string): never {
  redirect(
    buildLoginRedirectPath({
      next: nextPath,
      error: message
    })
  );
}

export async function loginAction(formData: FormData) {
  const nextPath = resolveSafeInternalPath(String(formData.get("next") ?? ""));
  const parsed = loginFormSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? "")
  });

  if (!parsed.success) {
    redirectToLoginWithError(parsed.error.issues[0]?.message ?? "تعذر تسجيل الدخول.", nextPath);
  }

  if (shouldUseDemoData()) {
    const demoUser = getDemoSessionUser();
    await createUserSession({
      ...demoUser,
      email: parsed.data.email || demoUser.email
    });
    redirect(nextPath);
  }

  const candidates = await prisma.user.findMany({
    where: {
      email: parsed.data.email,
      status: "ACTIVE"
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  let matchedUser = null as (typeof candidates)[number] | null;

  for (const candidate of candidates) {
    const isValid = await verifyPassword(parsed.data.password, candidate.passwordHash);

    if (isValid) {
      matchedUser = candidate;
      break;
    }
  }

  if (!matchedUser) {
    redirectToLoginWithError("البريد الإلكتروني أو كلمة المرور غير صحيحين.", nextPath);
  }

  await prisma.user.update({
    where: {
      id: matchedUser.id
    },
    data: {
      lastLoginAt: new Date()
    }
  });

  await createUserSession(
    toSessionUser({
      id: matchedUser.id,
      clinicId: matchedUser.clinicId,
      firstName: matchedUser.firstName,
      lastName: matchedUser.lastName,
      email: matchedUser.email,
      role: matchedUser.role
    })
  );

  redirect(nextPath);
}
