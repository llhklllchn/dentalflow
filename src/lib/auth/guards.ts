import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { buildForbiddenRedirectPath, buildLoginRedirectPath } from "@/lib/auth/redirects";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions/permissions";

async function getRequestedPath() {
  const headerStore = await headers();
  const pathname = headerStore.get("x-dentflow-pathname") ?? "/dashboard";
  const search = headerStore.get("x-dentflow-search") ?? "";

  return pathname.startsWith("/") ? `${pathname}${search}` : "/dashboard";
}

export async function requireSession() {
  const user = await getSessionUser();

  if (!user) {
    redirect(buildLoginRedirectPath({ next: await getRequestedPath() }));
  }

  return user;
}

export async function requirePermission(permission: string) {
  const user = await requireSession();

  if (!hasPermission(user.role, permission)) {
    redirect(
      buildForbiddenRedirectPath({
        from: await getRequestedPath(),
        permission
      })
    );
  }

  return user;
}
