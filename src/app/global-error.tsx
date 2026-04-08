"use client";

import Link from "next/link";

type GlobalErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 md:px-8">
          <div className="panel w-full p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
              خطأ حرج
            </div>
            <h1 className="mt-3 text-4xl font-bold text-ink">تعذر تحميل التطبيق</h1>
            <p className="mt-4 text-sm leading-8 text-slate-600">
              حدث خطأ عام منع التطبيق من المتابعة. يمكنك إعادة المحاولة، وإذا استمر ذلك فراجع
              الإعدادات أو سجلات التشغيل قبل الإطلاق.
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
                href="/"
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
              >
                فتح الصفحة الرئيسية
              </Link>
            </div>

            {error.digest ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                رمز تتبع الخطأ: {error.digest}
              </div>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
