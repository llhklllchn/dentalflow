"use client";

import Link from "next/link";

type RootErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function RootErrorPage({ error, reset }: RootErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 md:px-8">
      <div className="grid w-full gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="panel p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
            خطأ في النظام
          </div>
          <h1 className="mt-3 text-4xl font-bold text-ink">حدث خطأ غير متوقع</h1>
          <p className="mt-4 text-sm leading-8 text-slate-600">
            النظام واجه مشكلة أثناء تحميل هذه الصفحة. يمكنك إعادة المحاولة الآن، وإذا استمرت
            المشكلة فارجع إلى لوحة التحكم أو شارك فريقك بخطوات الوصول إليها.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              إعادة المحاولة
            </button>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              العودة إلى لوحة التحكم
            </Link>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">تفاصيل مساعدة</div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                جرّب تحديث الصفحة أو إعادة فتحها من المسار الأساسي بدل رابط قديم.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                إذا تكرر الخطأ في نفس العملية، فهذه إشارة لمراجعة السجلات أو الإعدادات.
              </div>
              {error.digest ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-xs text-slate-600">
                  رمز تتبع الخطأ: {error.digest}
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
