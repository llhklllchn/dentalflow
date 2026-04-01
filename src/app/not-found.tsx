import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 md:px-8">
      <div className="grid w-full gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="panel p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            404
          </div>
          <h1 className="mt-3 text-4xl font-bold text-ink">الصفحة غير موجودة</h1>
          <p className="mt-4 text-sm leading-8 text-slate-600">
            الرابط الذي حاولت فتحه غير متاح الآن. ربما تم نقله، أو أن العنوان غير مكتمل،
            أو أنك وصلت إلى مسار قديم داخل النظام.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              العودة إلى لوحة التحكم
            </Link>
            <Link
              href="/search"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              فتح البحث العام
            </Link>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">اقتراحات سريعة</div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                ارجع إلى لوحة التحكم ثم افتح القسم المطلوب من التنقل الرئيسي.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                استخدم البحث العام للوصول إلى مريض أو موعد أو فاتورة بسرعة.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                إذا كان الرابط وصلك من رسالة أو إشارة قديمة، فافتح السجل من داخل النظام مباشرة.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
