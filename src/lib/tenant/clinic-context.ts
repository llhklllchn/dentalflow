import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { ClinicContext } from "@/types/domain";

const demoClinicContext: ClinicContext = {
  clinicId: "cln_001",
  clinicName: "DentFlow Demo Clinic",
  timezone: "Asia/Amman",
  currency: "JOD",
  locale: "ar-JO"
};

export async function getClinicContext(): Promise<ClinicContext> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return demoClinicContext;
  }

  if (shouldUseDemoData()) {
    return {
      ...demoClinicContext,
      clinicId: sessionUser.clinicId
    };
  }

  const clinic = await prisma.clinic.findUnique({
    where: {
      id: sessionUser.clinicId
    },
    select: {
      id: true,
      name: true,
      timezone: true,
      currency: true,
      language: true
    }
  });

  if (!clinic) {
    return {
      ...demoClinicContext,
      clinicId: sessionUser.clinicId
    };
  }

  return {
    clinicId: clinic.id,
    clinicName: clinic.name,
    timezone: clinic.timezone ?? "Asia/Amman",
    currency: clinic.currency ?? "JOD",
    locale: clinic.language ?? "ar-JO"
  };
}
