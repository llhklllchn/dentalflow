import process from "node:process";

function loadEnvironment() {
  const explicitEnvPath = process.argv[2];

  if (typeof process.loadEnvFile === "function") {
    if (explicitEnvPath) {
      process.loadEnvFile(explicitEnvPath);
      return explicitEnvPath;
    }

    process.loadEnvFile();
    return ".env";
  }

  return explicitEnvPath ?? "process.env";
}

function looksLikePlaceholder(value) {
  if (!value?.trim()) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  const placeholderFragments = [
    "example.com",
    "replace-with",
    "changeme",
    "change-me",
    "smtp-user",
    "smtp-password",
    "postgresql://user:password@host",
    "user:password@host"
  ];

  return placeholderFragments.some((fragment) => normalized.includes(fragment));
}

function isSecurePublicUrl(value) {
  try {
    const url = new URL(value);
    const isLocalhost = ["localhost", "127.0.0.1"].includes(url.hostname);

    if (isLocalhost) {
      return false;
    }

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateLaunchEnvironment(env) {
  const issues = [];

  if (!env.DATABASE_URL?.trim()) {
    issues.push("DATABASE_URL is required.");
  } else if (looksLikePlaceholder(env.DATABASE_URL)) {
    issues.push("DATABASE_URL still contains placeholder values and must be replaced.");
  }

  if (!env.NEXTAUTH_SECRET?.trim()) {
    issues.push("NEXTAUTH_SECRET is required.");
  } else if (looksLikePlaceholder(env.NEXTAUTH_SECRET)) {
    issues.push("NEXTAUTH_SECRET still contains a placeholder value.");
  }

  if (!env.SMTP_HOST?.trim()) {
    issues.push("SMTP_HOST is required.");
  } else if (looksLikePlaceholder(env.SMTP_HOST)) {
    issues.push("SMTP_HOST still contains a placeholder value.");
  }

  if (!env.SMTP_PORT?.trim()) {
    issues.push("SMTP_PORT is required.");
  }

  if (!env.SMTP_USER?.trim()) {
    issues.push("SMTP_USER is required.");
  } else if (looksLikePlaceholder(env.SMTP_USER)) {
    issues.push("SMTP_USER still contains a placeholder value.");
  }

  if (!env.SMTP_PASS?.trim()) {
    issues.push("SMTP_PASS is required.");
  } else if (looksLikePlaceholder(env.SMTP_PASS)) {
    issues.push("SMTP_PASS still contains a placeholder value.");
  }

  if (!env.SMTP_FROM_EMAIL?.trim()) {
    issues.push("SMTP_FROM_EMAIL is required.");
  } else if (looksLikePlaceholder(env.SMTP_FROM_EMAIL)) {
    issues.push("SMTP_FROM_EMAIL still contains a placeholder value.");
  }

  if (!env.DENTFLOW_JOBS_SECRET?.trim()) {
    issues.push("DENTFLOW_JOBS_SECRET is required.");
  } else if (looksLikePlaceholder(env.DENTFLOW_JOBS_SECRET)) {
    issues.push("DENTFLOW_JOBS_SECRET still contains a placeholder value.");
  }

  if (!env.NEXTAUTH_URL?.trim()) {
    issues.push("NEXTAUTH_URL is required.");
  } else if (!isSecurePublicUrl(env.NEXTAUTH_URL)) {
    issues.push("NEXTAUTH_URL must be a public HTTPS URL and must not point to localhost.");
  } else if (looksLikePlaceholder(env.NEXTAUTH_URL)) {
    issues.push("NEXTAUTH_URL still contains a placeholder value.");
  }

  if (env.DENTFLOW_DEMO_MODE !== "false") {
    issues.push('DENTFLOW_DEMO_MODE must be set to "false" before launch.');
  }

  if (
    env.NOTIFICATION_WEBHOOK_URL?.trim() &&
    looksLikePlaceholder(env.NOTIFICATION_WEBHOOK_URL)
  ) {
    issues.push("NOTIFICATION_WEBHOOK_URL still contains a placeholder value.");
  }

  if (
    env.NOTIFICATION_WEBHOOK_SECRET?.trim() &&
    looksLikePlaceholder(env.NOTIFICATION_WEBHOOK_SECRET)
  ) {
    issues.push("NOTIFICATION_WEBHOOK_SECRET still contains a placeholder value.");
  }

  return issues;
}

const loadedEnvSource = loadEnvironment();

const issues = validateLaunchEnvironment(process.env);

if (issues.length > 0) {
  console.error(`DentFlow launch validation failed for ${loadedEnvSource}:`);

  for (const issue of issues) {
    console.error(`- ${issue}`);
  }

  process.exit(1);
}

console.log(`DentFlow launch validation passed for ${loadedEnvSource}.`);
