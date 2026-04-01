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
    </main>
  );
}
