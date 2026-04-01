import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = resolve(".env.production.example");
const targetPath = resolve(".env.production");

if (!existsSync(sourcePath)) {
  console.error("Missing .env.production.example");
  process.exit(1);
}

if (existsSync(targetPath)) {
  console.error(".env.production already exists. Delete it first if you want to regenerate it.");
  process.exit(1);
}

function secret(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

const source = readFileSync(sourcePath, "utf8");
const prepared = source
  .replace(
    'NEXTAUTH_SECRET="replace-with-a-long-random-secret"',
    `NEXTAUTH_SECRET="${secret(32)}"`
  )
  .replace(
    'DENTFLOW_JOBS_SECRET="replace-with-a-long-random-secret"',
    `DENTFLOW_JOBS_SECRET="${secret(32)}"`
  )
  .replace(
    'NOTIFICATION_WEBHOOK_SECRET="replace-with-a-long-random-secret"',
    `NOTIFICATION_WEBHOOK_SECRET="${secret(32)}"`
  );

writeFileSync(targetPath, prepared, "utf8");

console.log(`Created ${targetPath}`);
console.log("Generated secrets for:");
console.log("- NEXTAUTH_SECRET");
console.log("- DENTFLOW_JOBS_SECRET");
console.log("- NOTIFICATION_WEBHOOK_SECRET");
console.log("You still need to replace placeholder values for:");
console.log("- DATABASE_URL");
console.log("- NEXTAUTH_URL");
console.log("- SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM_EMAIL");
console.log("- NOTIFICATION_WEBHOOK_URL if you want WhatsApp/SMS delivery");
