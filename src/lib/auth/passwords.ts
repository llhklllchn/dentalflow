import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, storedDerived] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !storedDerived) {
    return false;
  }

  const derivedBuffer = Buffer.from(
    scryptSync(password, salt, KEY_LENGTH).toString("hex"),
    "hex"
  );
  const storedBuffer = Buffer.from(storedDerived, "hex");

  if (derivedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedBuffer, storedBuffer);
}

