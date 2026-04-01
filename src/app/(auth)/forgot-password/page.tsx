import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { requestPasswordResetAction } from "@/features/auth/actions/forgot-password";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <AuthShell
      title="استعادة كلمة المرور"
      description="أدخل البريد الإلكتروني المرتبط بالحساب وسنجهز لك رابطًا آمنًا لإعادة تعيين كلمة المرور."
      asideTitle="استرجاع آمن وسريع بدون إرباك"
      asideDescription="نحافظ على أمان الحسابات عبر روابط مؤقتة، مع إبطال الروابط القديمة تلقائيًا عند طلب رابط جديد."
      highlights={[
        "رابط استعادة مؤقت بصلاحية محددة وواضحة للمستخدم.",
        "إبطال الروابط السابقة غير المستخدمة عند إصدار رابط جديد.",
        "تجربة مناسبة للموظفين والإدارة بدون كشف معلومات حساسة."
      ]}
      stats={[
        { value: "30m", label: "مدة صلاحية افتراضية للرابط لرفع مستوى الأمان" },
        { value: "SMTP", label: "جاهز للإرسال الفعلي عبر البريد بعد ضبط بيئة الإنتاج" }
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

      <form action={requestPasswordResetAction}>
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

        <p className="mt-4 text-sm leading-7 text-slate-500">
          إذا كان البريد موجودًا في النظام فسيتم تجهيز رابط آمن وإرساله حسب إعدادات البريد
          الفعلية.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            إرسال رابط الاستعادة
          </button>
          <Link
            href="/login"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800"
          >
            العودة لتسجيل الدخول
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
