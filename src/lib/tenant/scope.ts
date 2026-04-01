import { getSessionUser } from "@/lib/auth/session";

export async function getSessionClinicId() {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Authentication is required before resolving the current clinic.");
  }

  return user.clinicId;
}

export async function getScopedSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Authentication is required before accessing clinic-scoped data.");
  }

  return user;
}

export function assertSameClinic(entityClinicId: string, clinicId: string) {
  if (entityClinicId !== clinicId) {
    throw new Error("Cross-clinic access is not allowed.");
  }
}
