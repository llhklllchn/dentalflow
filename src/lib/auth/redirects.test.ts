import { describe, expect, it } from "vitest";

import {
  buildForbiddenRedirectPath,
  buildLoginRedirectPath,
  isSafeInternalPath,
  resolveSafeInternalPath
} from "./redirects";

describe("auth redirects", () => {
  it("accepts only safe internal paths", () => {
    expect(isSafeInternalPath("/patients")).toBe(true);
    expect(isSafeInternalPath("/patients/new?source=topbar")).toBe(true);
    expect(isSafeInternalPath("https://example.com")).toBe(false);
    expect(isSafeInternalPath("//malicious.example")).toBe(false);
  });

  it("falls back to dashboard for unsafe paths", () => {
    expect(resolveSafeInternalPath(undefined)).toBe("/dashboard");
    expect(resolveSafeInternalPath("https://example.com")).toBe("/dashboard");
  });

  it("builds login redirects and preserves safe next paths", () => {
    expect(buildLoginRedirectPath()).toBe("/login");
    expect(buildLoginRedirectPath({ next: "/patients/new" })).toBe(
      "/login?next=%2Fpatients%2Fnew"
    );
    expect(
      buildLoginRedirectPath({
        next: "https://example.com",
        error: "تعذر الدخول"
      })
    ).toBe("/login?error=%D8%AA%D8%B9%D8%B0%D8%B1+%D8%A7%D9%84%D8%AF%D8%AE%D9%88%D9%84");
  });

  it("builds forbidden redirects with safe source pages", () => {
    expect(
      buildForbiddenRedirectPath({
        from: "/reports?range=month",
        permission: "reports:view"
      })
    ).toBe("/forbidden?from=%2Freports%3Frange%3Dmonth&permission=reports%3Aview");
    expect(
      buildForbiddenRedirectPath({
        from: "https://example.com",
        permission: "patients:*"
      })
    ).toBe("/forbidden?permission=patients%3A*");
  });
});
