import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { loginAction } from "@/features/auth/actions/login";
import { resolveSafeInternalPath } from "@/lib/auth/redirects";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolveSafeInternalPath(resolvedSearchParams?.next);

  return (
    <AuthShell
      title="تسجيل الدخول"
      description="ادخل إلى لوحة تشغيل العيادة لإدارة المرضى والمواعيد والفواتير من مكان واحد."
      asideTitle="تشغيل يومي أسرع وأوضح للفريق كله"
      asideDescription="من الاستقبال وحتى الطبيب والمحاسبة، كل خطوة في يوم العيادة تصبح أوضح عندما تكون البيانات والمواعيد والفواتير في نظام واحد."
      highlights={[
        "متابعة المواعيد وحالاتها لحظة بلحظة من نفس الشاشة.",
        "الوصول إلى ملف المريض وخطة العلاج والفاتورة بدون تنقل مشتت.",
        "مصمم للعربية وعيادات الأسنان مع إعدادات مناسبة للأردن."
      ]}
      stats={[
        { value: "1", label: "واجهة موحدة لرحلة المريض من الحجز حتى التحصيل" },
        { value: "24/7", label: "وصول آمن لحسابك من أي جهاز بعد التفعيل" }
      ]}
    >
      {resolvedSearchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      {resolvedSearchParams?.success ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {resolvedSearchParams.success}
        </div>
      ) : null}

      {resolvedSearchParams?.next ? (
        <div className="mb-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          بعد تسجيل الدخول سنعيدك مباشرة إلى الصفحة التي كنت تريد فتحها.
        </div>
      ) : null}

      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            البريد الإلكتروني
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">كلمة المرور</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
        >
          دخول إلى النظام
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <Link href="/forgot-password" className="font-semibold text-brand-700">
          نسيت كلمة المرور
        </Link>
        <Link href="/register-clinic" className="font-semibold text-slate-700">
          إنشاء عيادة جديدة
        </Link>
      </div>
    </AuthShell>
  );
}
