import { describe, expect, it } from "vitest";

import { createSessionToken, parseSessionToken } from "./session-token";

describe("session token", () => {
  it("parses a valid session token", () => {
    const token = createSessionToken(
      {
        id: "usr_123",
        clinicId: "cln_123",
        firstName: "مالك",
        lastName: "تجربة",
        email: "owner@example.com",
        role: "owner"
      },
      new Date(Date.now() + 60_000)
    );

    expect(parseSessionToken(token)).toEqual({
      id: "usr_123",
      clinicId: "cln_123",
      firstName: "مالك",
      lastName: "تجربة",
      email: "owner@example.com",
      role: "owner"
    });
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken(
      {
        id: "usr_123",
        clinicId: "cln_123",
        firstName: "مالك",
        lastName: "تجربة",
        email: "owner@example.com",
        role: "owner"
      },
      new Date(Date.now() + 60_000)
    );

    const [payload, signature] = token.split(".");
    const tamperedToken = `${payload}.tampered${signature}`;

    expect(parseSessionToken(tamperedToken)).toBeNull();
  });

  it("rejects a token with a mismatched signature length", () => {
    const token = createSessionToken(
      {
        id: "usr_123",
        clinicId: "cln_123",
        firstName: "مالك",
        lastName: "تجربة",
        email: "owner@example.com",
        role: "owner"
      },
      new Date(Date.now() + 60_000)
    );

    const [payload] = token.split(".");
    expect(parseSessionToken(`${payload}.short`)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = createSessionToken(
      {
        id: "usr_123",
        clinicId: "cln_123",
        firstName: "مالك",
        lastName: "تجربة",
        email: "owner@example.com",
        role: "owner"
      },
      new Date(Date.now() - 1_000)
    );

    expect(parseSessionToken(token)).toBeNull();
  });
});
