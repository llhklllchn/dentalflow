import { randomBytes } from "node:crypto";

function secret(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

console.log("NEXTAUTH_SECRET=" + secret(32));
console.log("DENTFLOW_JOBS_SECRET=" + secret(32));
console.log("NOTIFICATION_WEBHOOK_SECRET=" + secret(32));
