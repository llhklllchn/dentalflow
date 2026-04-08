"use server";

import { redirect } from "next/navigation";

import { hashPassword } from "@/lib/auth/passwords";
import { createUserSession } from "@/lib/auth/session";
import { toSessionUser } from "@/lib/auth/session-user";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils/slugs";
import { registerClinicFormSchema } from "@/features/auth/schemas/auth-form.schema";

function redirectToRegisterWithError(message: string): never {
  redirect(`/register-clinic?error=${encodeURIComponent(message)}`);
}

async function generateUniqueClinicSlug(clinicName: string) {
  const baseSlug = slugify(clinicName) || "dentflow-clinic";

  let candidate = baseSlug;
  let suffix = 2;

  while (
    await prisma.clinic.findUnique({
      where: {
        slug: candidate
      },
      select: {
        id: true
      }
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function registerClinicAction(formData: FormData) {
  const parsed = registerClinicFormSchema.safeParse({
    clinicName: String(formData.get("clinicName") ?? "").trim(),
    ownerFirstName: String(formData.get("ownerFirstName") ?? "").trim(),
    ownerLastName: String(formData.get("ownerLastName") ?? "").trim(),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    phone: String(formData.get("phone") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    country: String(formData.get("country") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    currency: String(formData.get("currency") ?? "").trim(),
    language: String(formData.get("language") ?? "").trim(),
    timezone: String(formData.get("timezone") ?? "").trim()
  });

  if (!parsed.success) {
  redirectToRegisterWithError(parsed.error.issues[0]?.message ?? "تعذر إنشاء العيادة.");
  }

  if (shouldUseDemoData()) {
    await createUserSession({
      id: "usr_demo_owner",
      clinicId: "cln_demo_live",
      firstName: parsed.data.ownerFirstName,
      lastName: parsed.data.ownerLastName,
      email: parsed.data.email,
      role: "owner"
    });

    redirect("/dashboard");
  }

  const existingUsers = await prisma.user.findMany({
    where: {
      email: parsed.data.email
    },
    select: {
      id: true
    },
    take: 1
  });

  if (existingUsers.length > 0) {
    redirectToRegisterWithError("يوجد مستخدم مسجل بهذا البريد الإلكتروني بالفعل.");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const clinicSlug = await generateUniqueClinicSlug(parsed.data.clinicName);

  const createdOwner = await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.create({
      data: {
        name: parsed.data.clinicName,
        slug: clinicSlug,
        phone: parsed.data.phone,
        email: parsed.data.email,
        country: parsed.data.country,
        city: parsed.data.city,
        timezone: parsed.data.timezone,
        currency: parsed.data.currency,
        language: parsed.data.language,
        defaultAppointmentDuration: 30
      }
    });

    return await tx.user.create({
      data: {
        clinicId: clinic.id,
        firstName: parsed.data.ownerFirstName,
        lastName: parsed.data.ownerLastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash,
        role: "OWNER",
        status: "ACTIVE"
      }
    });
  });

  await createUserSession(
    toSessionUser({
      id: createdOwner.id,
      clinicId: createdOwner.clinicId,
      firstName: createdOwner.firstName,
      lastName: createdOwner.lastName,
      email: createdOwner.email,
      role: createdOwner.role
    })
  );

  redirect("/dashboard");
}
