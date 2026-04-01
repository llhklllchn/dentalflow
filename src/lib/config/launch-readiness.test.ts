import { afterEach, describe, expect, it } from "vitest";

import { getLaunchReadinessSummary } from "./launch-readiness";

const ORIGINAL_ENV = { ...process.env };

describe("launch readiness", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("flags demo mode and missing launch requirements", () => {
    process.env.DENTFLOW_DEMO_MODE = "true";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/dentflow";
    process.env.NEXTAUTH_URL = "http://127.0.0.1:3000";
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM_EMAIL;
    delete process.env.DENTFLOW_JOBS_SECRET;

    const summary = getLaunchReadinessSummary();

    expect(summary.mode).toBe("demo");
    expect(summary.ready).toBe(false);
    expect(summary.score).toBeLessThan(100);
    expect(summary.issues.length).toBeGreaterThan(0);
  });

  it("passes when core production requirements are present", () => {
    process.env.DENTFLOW_DEMO_MODE = "false";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@db.example.com:5432/dentflow";
    process.env.NEXTAUTH_URL = "https://app.dentflow.example";
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";
    process.env.SMTP_FROM_EMAIL = "hello@example.com";
    process.env.DENTFLOW_JOBS_SECRET = "secret";

    const summary = getLaunchReadinessSummary();

    expect(summary.mode).toBe("live");
    expect(summary.ready).toBe(true);
    expect(summary.score).toBe(100);
  });
});
