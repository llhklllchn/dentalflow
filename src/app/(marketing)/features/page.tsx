import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";

const featureGroups = [
  {
    title: "تشغيل المواعيد",
    items: [
      "تقويم واضح للاستقبال مع حالات الموعد وإعادة الجدولة.",
      "إسناد المواعيد حسب الطبيب والخدمة مع منع التعارض.",
      "تذكيرات قابلة للتشغيل قبل الموعد عبر القنوات المتاحة."
    ]
  },
  {
    title: "ملف المريض والعلاج",
    items: [
      "ملف مريض واحد يربط الزيارات والخطة العلاجية والسجل الطبي.",
      "متابعة إجراءات الأسنان وخطط العلاج متعددة الجلسات.",
      "رحلة أوضح للطبيب من الفحص إلى التوثيق والمتابعة."
    ]
  },
  {
    title: "الفوترة والتحصيل",
    items: [
      "إنشاء الفواتير وربطها بالمريض أو خطة العلاج.",
      "تسجيل الدفعات وتحديث الرصيد والحالة مباشرة.",
      "رؤية أسرع لصاحب العيادة حول الإيراد والفواتير المفتوحة."
    ]
  }
];

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Features"
        title="المزايا الرئيسية"
        description="بنية المنتج الآن أوضح وأقرب لمنتج SaaS متخصص، مع تقسيم عملي لما يحتاجه فريق العيادة يوميًا."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {featureGroups.map((group) => (
          <section key={group.title} className="panel p-6">
            <h2 className="text-xl font-semibold text-ink">{group.title}</h2>
            <div className="mt-5 space-y-3">
              {group.items.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="panel mt-8 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              الخطوة التالية
            </div>
            <h2 className="mt-3 text-3xl font-bold text-ink">اختر باقة الإطلاق المناسبة</h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              بعد وضوح المزايا، الخطوة التجارية المنطقية هي توضيح الباقة المناسبة للعيادة
              بحسب حجمها وطريقة تشغيلها.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              افتح الباقات
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              تواصل معنا
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
