import { shouldUseDemoData } from "@/lib/db/data-source";

type ReadinessCheck = {
  key: string;
  label: string;
  ready: boolean;
  detail: string;
  critical?: boolean;
};

function looksLikePlaceholder(value: string | undefined) {
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

function isSecurePublicUrl(value: string | undefined) {
  if (!value?.trim()) {
    return false;
  }

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

export function getLaunchReadinessSummary() {
  const usesDemoData = shouldUseDemoData();
  const appUrl = process.env.NEXTAUTH_URL?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const smtpReady = Boolean(
    process.env.SMTP_HOST?.trim() &&
      !looksLikePlaceholder(process.env.SMTP_HOST) &&
      process.env.SMTP_PORT?.trim() &&
      process.env.SMTP_USER?.trim() &&
      !looksLikePlaceholder(process.env.SMTP_USER) &&
      process.env.SMTP_PASS?.trim() &&
      !looksLikePlaceholder(process.env.SMTP_PASS) &&
      process.env.SMTP_FROM_EMAIL?.trim()
      && !looksLikePlaceholder(process.env.SMTP_FROM_EMAIL)
  );
  const jobsReady = Boolean(
    process.env.DENTFLOW_JOBS_SECRET?.trim() &&
      !looksLikePlaceholder(process.env.DENTFLOW_JOBS_SECRET)
  );
  const appUrlReady = isSecurePublicUrl(appUrl) && !looksLikePlaceholder(appUrl);
  const databaseReady =
    Boolean(databaseUrl) && !usesDemoData && !looksLikePlaceholder(databaseUrl);
  const webhookReady = Boolean(
    process.env.NOTIFICATION_WEBHOOK_URL?.trim() &&
      process.env.NOTIFICATION_WEBHOOK_SECRET?.trim() &&
      !looksLikePlaceholder(process.env.NOTIFICATION_WEBHOOK_URL) &&
      !looksLikePlaceholder(process.env.NOTIFICATION_WEBHOOK_SECRET)
  );

  const checks: ReadinessCheck[] = [
    {
      key: "mode",
      label: "وضع البيانات الحية",
      ready: !usesDemoData,
      detail: usesDemoData
        ? "التطبيق يعمل الآن على وضع ديمو أو بدون قاعدة بيانات حية."
        : "التطبيق يعمل على بيانات حية وليس على وضع الديمو.",
      critical: true
    },
    {
      key: "database",
      label: "قاعدة البيانات",
      ready: databaseReady,
      detail: databaseReady
        ? "تم ربط التطبيق بقاعدة بيانات صالحة للاستخدام الحقيقي."
        : "ما زال التطبيق يحتاج قاعدة بيانات إنتاجية حقيقية مع DENTFLOW_DEMO_MODE=false.",
      critical: true
    },
    {
      key: "app-url",
      label: "الرابط العام",
      ready: appUrlReady,
      detail: appUrlReady
        ? `NEXTAUTH_URL مضبوط على رابط عام آمن: ${appUrl}`
        : "NEXTAUTH_URL ما زال غير عام أو ليس HTTPS أو ما زال يحمل قيمة وهمية.",
      critical: true
    },
    {
      key: "smtp",
      label: "البريد التشغيلي",
      ready: smtpReady,
      detail: smtpReady
        ? "إعدادات SMTP الأساسية مكتملة لإرسال الدعوات والاستعادة."
        : "إعدادات SMTP الأساسية ما تزال ناقصة أو تحمل قيمًا تجريبية.",
      critical: true
    },
    {
      key: "jobs",
      label: "وظائف الخلفية",
      ready: jobsReady,
      detail: jobsReady
        ? "سر وظائف الخلفية موجود ويمكن جدولة التذكيرات والتسليم."
        : "سر وظائف الخلفية غير موجود بعد أو ما زال قيمة افتراضية.",
      critical: true
    },
    {
      key: "webhook",
      label: "قنوات الرسائل الإضافية",
      ready: webhookReady,
      detail: webhookReady
        ? "قناة webhook مفعلة لربط WhatsApp أو SMS عند الحاجة."
        : "هذا الاختيار إضافي فقط إذا كنت تريد WhatsApp أو SMS فعليًا."
    }
  ];

  const criticalChecks = checks.filter((check) => check.critical);
  const readyCriticalChecks = criticalChecks.filter((check) => check.ready).length;
  const score = Math.round((readyCriticalChecks / criticalChecks.length) * 100);

  return {
    mode: usesDemoData ? "demo" : "live",
    score,
    ready: criticalChecks.every((check) => check.ready),
    checks,
    issues: checks.filter((check) => check.critical && !check.ready).map((check) => check.detail)
  };
}
