import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import {
  pricingComparisonRows,
  pricingFaqs,
  pricingPlans
} from "@/lib/constants/pricing";

function formatJod(value: number) {
  return `${value} JOD`;
}

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Pricing"
        title="باقات الإطلاق"
        description="تسعير واضح ومناسب للإطلاق في الأردن، مبني على فكرة السعر لكل عيادة لا لكل مستخدم، حتى يبقى القرار أسهل على المالك والمدير."
        tips={["سعر شهري واضح", "تموضع مناسب للأردن", "Plus هي التوصية الأقوى للإطلاق"]}
        actions={
          <>
            <Link
              href="/contact"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              اطلب عرضًا
            </Link>
            <Link
              href="/register-clinic"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              ابدأ الآن
            </Link>
          </>
        }
      />

      <section className="grid gap-6 xl:grid-cols-3">
        {pricingPlans.map((plan) => (
          <article
            key={plan.slug}
            className={`panel relative overflow-hidden p-6 md:p-8 ${
              plan.featured ? "border-brand-300 shadow-[0_24px_70px_rgba(14,165,164,0.18)]" : ""
            }`}
          >
            {plan.featured ? (
              <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-brand-100/80 blur-3xl" />
            ) : null}

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-2xl font-bold text-ink">{plan.name}</div>
                  <div className="mt-2 text-sm text-slate-500">{plan.audience}</div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    plan.featured
                      ? "bg-brand-100 text-brand-800"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {plan.badge}
                </span>
              </div>

              <div className="mt-6 flex items-end gap-3">
                <div className="text-5xl font-bold text-ink">{plan.monthlyPriceJod}</div>
                <div className="pb-2 text-sm text-slate-500">JOD / شهريًا</div>
              </div>

              <div className="mt-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700">
                سنويًا: {formatJod(plan.annualPriceJod)} <br />
                <span className="text-slate-500">{plan.annualNote}</span>
              </div>

              <p className="mt-5 text-sm leading-8 text-slate-600">{plan.description}</p>

              <div className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700"
                  >
                    {feature}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                <span className="font-semibold text-ink">طبيعة الدعم:</span> {plan.support}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className={`rounded-full px-5 py-3 text-sm font-semibold ${
                    plan.featured
                      ? "bg-brand-600 text-white"
                      : "border border-slate-300 bg-white text-slate-800"
                  }`}
                >
                  اطلب هذه الباقة
                </Link>
                <Link
                  href="/register-clinic"
                  className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  جرّب النظام
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="panel mt-8 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              مقارنة سريعة
            </div>
            <h2 className="mt-3 text-3xl font-bold text-ink">كيف نميّز بين الباقات؟</h2>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              الفرق هنا ليس في وجود أساسيات التشغيل، بل في مستوى المرافقة والتموضع وحجم
              العيادة المستهدف عند الإطلاق.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            العملة: JOD
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-right text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-4 font-medium">البند</th>
                {pricingPlans.map((plan) => (
                  <th key={plan.slug} className="px-4 py-4 font-medium">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pricingComparisonRows.map((row) => (
                <tr key={row.label} className="border-b border-slate-100">
                  <td className="px-4 py-4 font-semibold text-ink">{row.label}</td>
                  {row.values.map((value, index) => (
                    <td key={`${row.label}-${index}`} className="px-4 py-4 text-slate-600">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="panel p-6 md:p-8">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
            التوصية
          </div>
          <h2 className="mt-3 text-3xl font-bold text-ink">أي باقة نبدأ بها؟</h2>
          <div className="mt-5 space-y-3 text-sm leading-8 text-slate-700">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5">
              إذا كنت تريد دخولًا مرنًا جدًا للسوق، ابدأ بـ <strong>Starter</strong>.
            </div>
            <div className="rounded-[1.5rem] border border-brand-200 bg-brand-50 px-5 py-5">
              إذا كنت تريد أفضل توازن بين السعر والانطباع والاعتماد اليومي، ابدأ بـ{" "}
              <strong>Plus</strong>.
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5">
              إذا كنت تستهدف مراكز أكبر أو عيادات متعددة الأطباء، فـ <strong>Pro</strong> هو
              التموضع الأنسب.
            </div>
          </div>
        </div>

        <div className="panel p-6 md:p-8">
          <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
            أسئلة شائعة
          </div>
          <div className="mt-5 space-y-4">
            {pricingFaqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5"
              >
                <div className="text-lg font-semibold text-ink">{faq.question}</div>
                <p className="mt-3 text-sm leading-8 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
