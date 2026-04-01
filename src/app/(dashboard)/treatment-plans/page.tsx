import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { ProgressMeter } from "@/components/shared/progress-meter";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getTreatmentPlansList } from "@/features/treatment-plans/queries/get-treatment-plans-list";
import {
  extractFormattedAmount,
  formatMetricNumber,
  hasDisplayDate
} from "@/lib/utils/formatted-value";

export default async function TreatmentPlansPage() {
  const treatmentPlans = await getTreatmentPlansList();
  const activePlans = treatmentPlans.filter((plan) =>
    ["planned", "approved", "in_progress"].includes(plan.status)
  ).length;
  const averageProgress = treatmentPlans.length
    ? Math.round(
        treatmentPlans.reduce((sum, plan) => sum + plan.progress, 0) / treatmentPlans.length
      )
    : 0;
  const estimatedPortfolio = treatmentPlans.reduce(
    (sum, plan) => sum + extractFormattedAmount(plan.estimatedTotalCost),
    0
  );
  const upcomingSessions = treatmentPlans.filter((plan) => hasDisplayDate(plan.nextSession)).length;
  const topPlan = [...treatmentPlans].sort((left, right) => right.progress - left.progress)[0];

  return (
    <div>
      <PageHeader
        eyebrow="Treatment Plans"
        title="خطط العلاج"
        description="مساحة متابعة أقوى للعلاجات متعددة الجلسات، مع قراءة أسرع لتقدم التنفيذ وحجم المحفظة العلاجية والجلسات القادمة."
        tips={["راجع الخطط النشطة أولًا", "افتح الخطة من نفس البطاقة", "تابع الجلسات القادمة"]}
        actions={
          <>
            <Link
              href="/patients"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              صفحة المرضى
            </Link>
            <Link
              href="/treatment-plans/new"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              خطة علاج جديدة
            </Link>
          </>
        }
      />

      <div className="grid-cards">
        <StatCard
          label="إجمالي الخطط"
          value={formatMetricNumber(treatmentPlans.length)}
          hint="كل الخطط المعروضة حاليًا داخل العيادة عبر مختلف الحالات."
          badgeLabel="العلاج"
        />
        <StatCard
          label="خطط نشطة"
          value={formatMetricNumber(activePlans)}
          hint="الخطط التي ما زالت قيد التنفيذ أو تنتظر جلسات أو اعتمادًا نهائيًا."
          badgeLabel="العلاج"
        />
        <StatCard
          label="متوسط الإنجاز"
          value={`${formatMetricNumber(averageProgress)}%`}
          hint="متوسط التقدم العام عبر كل الخطط الظاهرة في هذه الصفحة."
          badgeLabel="العلاج"
        />
        <StatCard
          label="قيمة المحفظة"
          value={`${formatMetricNumber(estimatedPortfolio)} JOD`}
          hint="إجمالي القيمة التقديرية للخطط المعروضة حاليًا."
          badgeLabel="العلاج"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-ink">القراءة التنفيذية</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                هذه الخلاصة تساعدك على فهم وضع الخطط العلاجية قبل الدخول في تفاصيل كل مريض أو
                كل جلسة.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              جلسات قادمة: {formatMetricNumber(upcomingSessions)}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">أعلى خطة تقدمًا</div>
              <div className="mt-4 text-xl font-bold text-ink">
                {topPlan?.title ?? "لا توجد خطط"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">
                {topPlan
                  ? `${topPlan.progress}% للمريض ${topPlan.patientName}`
                  : "ستظهر هنا الخطة الأكثر تقدمًا عند توفر بيانات."}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">خطط قيد العمل</div>
              <div className="mt-4 text-3xl font-bold text-ink">
                {formatMetricNumber(
                  treatmentPlans.filter((plan) => plan.status === "in_progress").length
                )}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">
                الخطط التي يجري تنفيذها فعليًا وتحتاج متابعة تشغيلية مستمرة.
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">جلسات محددة قادمًا</div>
              <div className="mt-4 text-3xl font-bold text-ink">
                {formatMetricNumber(upcomingSessions)}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">
                الخطط التي تظهر فيها جلسة قادمة محددة بوضوح ويمكن تحويلها إلى أولوية متابعة.
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
            <div className="text-sm font-semibold text-brand-900">ماذا تراقب؟</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                الخطط النشطة كثيرة لكن التقدم منخفض: راجع انتظام الجلسات والمتابعة.
              </div>
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                المحفظة العلاجية المرتفعة تحتاج ربطًا أوضح بين التنفيذ والتحصيل المالي.
              </div>
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                الجلسات القادمة الظاهرة تساعد الاستقبال على ترتيب الأولويات بسرعة.
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">ملخص الخطة العلاجية</div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <div className="text-slate-500">خطط مع جلسة قادمة</div>
                <div className="mt-1 font-semibold text-ink">{formatMetricNumber(upcomingSessions)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <div className="text-slate-500">متوسط التقدم</div>
                <div className="mt-1 font-semibold text-ink">{averageProgress}%</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <div className="text-slate-500">إجمالي القيمة</div>
                <div className="mt-1 font-semibold text-ink">
                  {formatMetricNumber(estimatedPortfolio)} JOD
                </div>
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">إشارات سريعة</div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                إذا كانت الخطة معتمدة لكن دون جلسة قادمة، فقد تحتاج إعادة تواصل أو إعادة جدولة.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                راقب العناصر غير المكتملة داخل كل خطة، لأنها أكثر ما يحدد سرعة الإنجاز الحقيقي.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                افتح تفاصيل الخطة عند وجود تعثر في التقدم لفهم المرحلة العالقة بالضبط.
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="mt-6 grid gap-6">
        {treatmentPlans.map((plan) => (
          <section key={plan.id} className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-ink">{plan.title}</div>
                <div className="mt-2 text-sm text-slate-500">
                  {plan.patientName} | {plan.dentistName} | الجلسة القادمة: {plan.nextSession}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={plan.status} />
                <Link
                  href={`/patients/${plan.patientId}`}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  ملف المريض
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,320px]">
              <div>
                <ProgressMeter value={plan.progress} label="نسبة الإنجاز" />

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {plan.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-ink">{item.serviceName}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            السن {item.toothNumber} | الجلسة {item.sessionOrder}
                          </div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="mt-3 text-sm leading-7 text-slate-600">
                        {item.description}
                      </div>
                      <div className="mt-3 text-sm font-semibold text-brand-800">
                        {item.estimatedCost}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="text-sm text-slate-500">التكلفة التقديرية</div>
                <div className="mt-2 text-2xl font-bold text-ink">{plan.estimatedTotalCost}</div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div className="text-slate-500">التقدم الحالي</div>
                    <div className="mt-1 font-semibold text-ink">{plan.progress}%</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div className="text-slate-500">الجلسة القادمة</div>
                    <div className="mt-1 font-semibold text-ink">{plan.nextSession}</div>
                  </div>
                </div>
                <Link
                  href={`/treatment-plans/${plan.id}`}
                  className="mt-5 inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-900"
                >
                  عرض التفاصيل
                </Link>
              </aside>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
