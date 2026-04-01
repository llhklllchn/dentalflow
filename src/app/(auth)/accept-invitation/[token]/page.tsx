import Link from "next/link";

import { acceptInvitationAction } from "@/features/auth/actions/accept-invitation";
import { getInvitationPreview } from "@/features/auth/queries/get-invitation-preview";

type AcceptInvitationPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AcceptInvitationPage({
  params,
  searchParams
}: AcceptInvitationPageProps) {
  const { token } = await params;
  const resolvedSearchParams = await searchParams;
  const invitation = await getInvitationPreview(token);
  const errorMessage =
    resolvedSearchParams?.error ?? (invitation.isValid ? undefined : invitation.errorMessage);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <section className="panel p-8">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">
            DentFlow
          </div>
          <h1 className="mt-4 text-3xl font-bold text-ink">إكمال دعوة الانضمام</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            راجع تفاصيل الدعوة ثم أكمل بياناتك لتفعيل الحساب والانضمام إلى العيادة بشكل
            آمن.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm text-slate-500">العيادة</div>
              <div className="mt-2 text-lg font-semibold text-ink">
                {invitation.clinicName ?? "عيادة DentFlow"}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="text-sm text-slate-500">البريد المدعو</div>
                <div className="mt-2 font-semibold text-ink">
                  {invitation.email ?? "غير متاح"}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="text-sm text-slate-500">الدور</div>
                <div className="mt-2 font-semibold text-ink">
                  {invitation.roleLabel ?? "عضو فريق"}
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5">
              <div className="text-sm text-brand-700">صلاحية الرابط</div>
              <div className="mt-2 font-semibold text-brand-950">
                {invitation.expiresAtLabel ?? "يرجى طلب دعوة جديدة إذا تعذر المتابعة"}
              </div>
            </div>
          </div>
        </section>

        <section className="panel p-8">
          <div className="text-xl font-semibold text-ink">بيانات الحساب</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            استخدم اسمك الحقيقي وكلمة مرور قوية حتى تتمكن من الدخول مباشرة بعد قبول
            الدعوة.
          </p>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {errorMessage}
            </div>
          ) : null}

          {invitation.isValid ? (
            <form action={acceptInvitationAction} className="mt-6">
              <input type="hidden" name="token" value={token} />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    الاسم الأول
                  </span>
                  <input
                    name="firstName"
                    autoComplete="given-name"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    الاسم الأخير
                  </span>
                  <input
                    name="lastName"
                    autoComplete="family-name"
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    كلمة المرور
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
                يفضّل استخدام كلمة مرور لا تقل عن 8 أحرف وتتضمن حروفًا وأرقامًا.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
                >
                  قبول الدعوة وتفعيل الحساب
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
                href="/login"
                className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
              >
                الانتقال لتسجيل الدخول
              </Link>
              <Link
                href="/register-clinic"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800"
              >
                إنشاء عيادة جديدة
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
