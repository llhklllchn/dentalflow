import { describe, expect, it } from "vitest";

import { generateStoredToken, hashToken } from "./tokens";

describe("auth tokens", () => {
  it("generates a plain token and a stored hash", () => {
    const pair = generateStoredToken();

    expect(pair.plainToken).toMatch(/^[a-f0-9]+$/);
    expect(pair.storedToken).toHaveLength(64);
    expect(pair.storedToken).toBe(hashToken(pair.plainToken));
  });

  it("hashes identical tokens deterministically", () => {
    expect(hashToken("abc123")).toBe(hashToken("abc123"));
  });
});
