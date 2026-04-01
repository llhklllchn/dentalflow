type DemoModeBannerProps = {
  clinicName: string;
};

export function DemoModeBanner({ clinicName }: DemoModeBannerProps) {
  return (
    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-950 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
            Demo Mode
          </div>
          <div className="mt-1 font-semibold">
            {clinicName} تعمل الآن بوضع تجريبي، لذلك التغييرات لا تُحفَظ فعليًا داخل قاعدة
            بيانات تشغيلية.
          </div>
        </div>
        <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800">
          بيانات غير نهائية
        </span>
      </div>

      <div className="mt-3 text-amber-900/85">
        استخدم هذا الوضع للعرض والمراجعة فقط. قبل الإطلاق الحقيقي تأكد من ضبط
        <code dir="ltr"> DENTFLOW_DEMO_MODE=false </code>
        وإعداد قاعدة البيانات والبريد الإنتاجي.
      </div>
    </div>
  );
}
