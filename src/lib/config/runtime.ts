export function isDemoMode() {
  return process.env.DENTFLOW_DEMO_MODE !== "false";
}

export function getAppBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function getSessionSecret() {
  return process.env.NEXTAUTH_SECRET ?? "dentflow-dev-secret";
}

