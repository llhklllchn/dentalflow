const DEFAULT_POST_LOGIN_PATH = "/dashboard";

export function isSafeInternalPath(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  return value.startsWith("/") && !value.startsWith("//");
}

export function resolveSafeInternalPath(
  value: string | null | undefined,
  fallback = DEFAULT_POST_LOGIN_PATH
): string {
  return isSafeInternalPath(value) ? value : fallback;
}

export function buildLoginRedirectPath(options?: {
  next?: string | null;
  error?: string | null;
  success?: string | null;
}) {
  const query = new URLSearchParams();
  const next = resolveSafeInternalPath(options?.next, DEFAULT_POST_LOGIN_PATH);

  if (options?.error) {
    query.set("error", options.error);
  }

  if (options?.success) {
    query.set("success", options.success);
  }

  if (next !== DEFAULT_POST_LOGIN_PATH) {
    query.set("next", next);
  }

  const serialized = query.toString();
  return serialized ? `/login?${serialized}` : "/login";
}

export function buildForbiddenRedirectPath(options?: {
  from?: string | null;
  permission?: string | null;
}) {
  const query = new URLSearchParams();
  const from = resolveSafeInternalPath(options?.from, DEFAULT_POST_LOGIN_PATH);

  if (from !== DEFAULT_POST_LOGIN_PATH) {
    query.set("from", from);
  }

  if (options?.permission) {
    query.set("permission", options.permission);
  }

  const serialized = query.toString();
  return serialized ? `/forbidden?${serialized}` : "/forbidden";
}
