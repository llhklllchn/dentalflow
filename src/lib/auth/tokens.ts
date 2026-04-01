import { createHash, randomBytes } from "node:crypto";

export function generateSecureToken(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateStoredToken(bytes = 24) {
  const plainToken = generateSecureToken(bytes);

  return {
    plainToken,
    storedToken: hashToken(plainToken)
  };
}
