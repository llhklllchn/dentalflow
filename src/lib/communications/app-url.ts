import { getAppBaseUrl } from "@/lib/config/runtime";

export function buildAppUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, getAppBaseUrl()).toString();
}
