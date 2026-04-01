import Link from "next/link";

import { resetPasswordAction } from "@/features/auth/actions/reset-password";
import { getResetPasswordPreview } from "@/features/auth/queries/get-reset-password-preview";

type ResetPasswordPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function ResetPasswordPage({
  params,
  searchParams
}: ResetPasswordPageProps) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const resetPreview = await getResetPasswordPreview(token);
  const errorMessage =
    resolvedSearchParams?.error ?? (resetPreview.isValid ? undefined : resetPreview.errorMessage);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[0.92fr,1.08fr]">
        <section className="panel p-8">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">
            DentFlow
          </div>
          <h1 className="mt-4 text-3xl font-bold text-ink">إعادة تعيين كلمة المرور</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            أنشئ كلمة مرور جديدة للحساب المرتبط بهذا الرابط، وبعدها يمكنك تسجيل الدخول
            مباشرة.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm text-slate-500">الحساب</div>
              <div className="mt-2 text-lg font-semibold text-ink">
                {resetPreview.emailHint ?? "رابط خاص باستعادة الحساب"}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="text-sm text-slate-500">العيادة</div>
                <div className="mt-2 font-semibold text-ink">
                  {resetPreview.clinicName ?? "DentFlow"}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="text-sm text-slate-500">صلاحية الرابط</div>
                <div className="mt-2 font-semibold text-ink">
                  {resetPreview.expiresAtLabel ?? "اطلب رابطًا جديدًا عند الحاجة"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel p-8">
          <div className="text-xl font-semibold text-ink">كلمة المرور الجديدة</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            اختر كلمة مرور قوية يصعب تخمينها، ثم أكدها مرة أخرى قبل الحفظ.
          </p>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {errorMessage}
            </div>
          ) : null}

          {resetPreview.isValid ? (
            <form action={resetPasswordAction} className="mt-6">
              <input type="hidden" name="token" value={token} />

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    كلمة المرور الجديدة
                  </span>
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    تأكيد كلمة المرور
                  </span>
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                </label>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                يفضّل استخدام حروف وأرقام ورمز واحد على الأقل لرفع مستوى الأمان.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
                >
                  حفظ كلمة المرور الجديدة
                </button>
                <Link
                  href="/login"
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800"
                >
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </form>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/forgot-password"
                className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
              >
                طلب رابط جديد
              </Link>
              <Link
                href="/login"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800"
              >
                العودة لتسجيل الدخول
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
