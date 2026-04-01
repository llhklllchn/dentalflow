import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/auth/constants";
import { createSessionToken, parseSessionToken } from "@/lib/auth/session-token";
import { getAppBaseUrl, isDemoMode } from "@/lib/config/runtime";
import { SessionUser } from "@/types/domain";

const demoSessionUser: SessionUser = {
  id: "usr_owner_001",
  clinicId: "cln_001",
  firstName: "Dr.",
  lastName: "Amina",
  email: "owner@dentflow.local",
  role: "owner"
};

async function getCookieStore() {
  return await Promise.resolve(cookies());
}

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === "production" && getAppBaseUrl().startsWith("https://");
}

function getSessionCookieOptions(expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt
  };
}

export function getDemoSessionUser() {
  return { ...demoSessionUser };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await getCookieStore();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const parsed = parseSessionToken(token);

    if (parsed) {
      return parsed;
    }
  }

  if (isDemoMode()) {
    return getDemoSessionUser();
  }

  return null;
}

export async function createUserSession(
  user: SessionUser,
  options?: {
    expiresInSeconds?: number;
  }
) {
  const cookieStore = await getCookieStore();
  const expiresAt = new Date(
    Date.now() + 1000 * (options?.expiresInSeconds ?? SESSION_DURATION_SECONDS)
  );
  const token = createSessionToken(user, expiresAt);

  cookieStore.set({
    ...getSessionCookieOptions(expiresAt),
    value: token
  });

  return expiresAt;
}

export async function destroyUserSession() {
  const cookieStore = await getCookieStore();

  cookieStore.set({
    ...getSessionCookieOptions(new Date(0)),
    value: ""
  });
}
