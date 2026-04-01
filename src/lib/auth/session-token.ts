import { createHmac, timingSafeEqual } from "node:crypto";

import { getSessionSecret } from "@/lib/config/runtime";
import { Role, SessionUser } from "@/types/domain";

type SessionPayload = {
  sub: string;
  clinicId: string;
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
  iat: number;
  exp: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function signaturesMatch(expected: string, provided: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(provided, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function createSessionToken(user: SessionUser, expiresAt: Date) {
  const payload: SessionPayload = {
    sub: user.id,
    clinicId: user.clinicId,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000)
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function parseSessionToken(token: string): SessionUser | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  if (!signaturesMatch(sign(encodedPayload), signature)) {
    return null;
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return {
    id: payload.sub,
    clinicId: payload.clinicId,
    role: payload.role,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email
  };
}
