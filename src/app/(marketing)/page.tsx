import Link from "next/link";

import { pricingPlans } from "@/lib/constants/pricing";

const operatingCards = [
  {
    title: "مواعيد منظمة للفريق",
    description:
      "تقويم واضح للاستقبال والأطباء مع حالات الموعد والتذكيرات والتعامل السريع مع إعادة الجدولة."
  },
  {
    title: "ملف مريض متكامل",
    description:
      "كل ما يخص المريض في مكان واحد: بياناته، سجله الطبي، خطة العلاج، الفواتير، والمدفوعات."
  },
  {
    title: "فوترة وتحصيل أوضح",
    description:
      "فواتير دقيقة، دفعات جزئية، وأرصدة ظاهرة لصاحب العيادة والمحاسب بدون تشتت."
  }
];

const workflowSteps = [
  {
    step: "01",
    title: "استقبال أسرع",
    description: "البحث عن المريض أو إنشاء ملف جديد ثم حجز الموعد خلال دقائق."
  },
  {
    step: "02",
    title: "جلسة علاج موثقة",
    description: "يدخل الطبيب ملاحظاته وخطة العلاج من نفس رحلة الموعد."
  },
  {
    step: "03",
    title: "تحصيل ومتابعة",
    description: "تُنشأ الفاتورة وتُسجل الدفعة وتُجهز التذكيرات والمتابعة لاحقًا."
  }
];

const heroMetrics = [
  { value: "100%", label: "متخصص لعيادات الأسنان فقط" },
  { value: "JOD", label: "جاهز للإطلاق بإعدادات مناسبة للأردن" },
  { value: "24h", label: "قوالب تذكير قابلة للتشغيل قبل الموعد" }
];

export default function MarketingHomePage() {
  const featuredPlans = pricingPlans.filter((plan) => plan.featured || plan.slug !== "pro");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <section className="panel overflow-hidden p-8 md:p-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr,0.8fr]">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">
              SaaS عربي لعيادات الأسنان
            </div>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-ink md:text-6xl">
              منصة تشغيل يومية تربط المواعيد والمرضى والعلاج والفوترة في تجربة واحدة
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              DentFlow مصمم لعيادات الأسنان التي تريد تشغيلًا أكثر تنظيمًا، تجربة أوضح
              للفريق، وتقليلًا للتشتت بين الدفاتر وواتساب والجداول المنفصلة.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register-clinic"
                className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
              >
                ابدأ بإنشاء عيادتك
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-brand-200 bg-brand-50 px-6 py-3 text-sm font-semibold text-brand-800"
              >
                شاهد الباقات
              </Link>
              <Link
                href="/features"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800"
              >
                استعرض المزايا
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {operatingCards.map((card) => (
              <div key={card.title} className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
                <div className="text-lg font-semibold">{card.title}</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {heroMetrics.map((metric) => (
          <div key={metric.label} className="panel p-6">
            <div className="text-3xl font-bold text-ink">{metric.value}</div>
            <div className="mt-2 text-sm leading-7 text-slate-600">{metric.label}</div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.88fr,1.12fr]">
        <div className="panel p-6 md:p-8">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
            لماذا DentFlow
          </div>
          <h2 className="mt-3 text-3xl font-bold text-ink">منظور تشغيل يومي وليس مجرد سجل</h2>
          <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
            التركيز هنا ليس فقط حفظ بيانات المرضى، بل تنظيم ما يحدث فعليًا داخل العيادة من
            أول مكالمة وحتى التحصيل والمتابعة.
          </p>
          <div className="mt-6 space-y-3">
            <div className="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-700">
              واجهة عربية مهيأة لفرق الاستقبال والأطباء بدون تعقيد زائد.
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-700">
              قابل للتوسع من عيادة صغيرة إلى مركز متعدد الأطباء مع عزل بيانات كل عيادة.
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-700">
              يربط التشغيل اليومي بالمحاسبة والتذكيرات بدل إبقائها في أدوات منفصلة.
            </div>
          </div>
        </div>

        <div className="panel p-6 md:p-8">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
            كيف يعمل
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step) => (
              <div
                key={step.step}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5"
              >
                <div className="text-sm font-semibold text-brand-700">{step.step}</div>
                <div className="mt-3 text-lg font-semibold text-ink">{step.title}</div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 panel p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              جاهزية الإطلاق
            </div>
            <h2 className="mt-3 text-3xl font-bold text-ink">منصة ويب قابلة للإطلاق المنظم</h2>
            <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
              البنية الحالية تدعم الحسابات، الدعوات، استعادة كلمة المرور، الإشعارات،
              الفواتير، التقارير، وتجهيزات النشر والتحقق اللازمة للإطلاق الاحترافي.
            </p>
          </div>

          <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white">
            <div className="text-lg font-semibold">مناسب للإطلاق في الأردن</div>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-slate-300">
              <div>يدعم العربية والاتجاه RTL من الأساس.</div>
              <div>إعدادات افتراضية للعملة JOD والمنطقة الزمنية Asia/Amman.</div>
              <div>مرن للربط مع البريد وواتساب أو SMS عبر مزودات تشغيل فعلية.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 panel p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              أسعار الإطلاق
            </div>
            <h2 className="mt-3 text-3xl font-bold text-ink">باقات واضحة للبدء في الأردن</h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              اخترنا تموضعًا بسيطًا وواضحًا: سعر لكل عيادة، بعملتها المحلية `JOD`، مع باقة
              Plus كخيار موصى به لمعظم العيادات الصغيرة والمتوسطة.
            </p>
          </div>
          <Link
            href="/pricing"
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
          >
            المقارنة الكاملة
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {featuredPlans.map((plan) => (
            <div
              key={plan.slug}
              className={`rounded-[1.75rem] border p-6 ${
                plan.featured
                  ? "border-brand-200 bg-brand-50/80"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xl font-semibold text-ink">{plan.name}</div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    plan.featured
                      ? "bg-brand-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {plan.badge}
                </span>
              </div>
              <div className="mt-5 flex items-end gap-2">
                <div className="text-4xl font-bold text-ink">{plan.monthlyPriceJod}</div>
                <div className="pb-1 text-sm text-slate-500">JOD / شهريًا</div>
              </div>
              <p className="mt-4 text-sm leading-8 text-slate-600">{plan.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
