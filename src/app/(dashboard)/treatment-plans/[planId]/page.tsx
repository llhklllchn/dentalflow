import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionBanner, type ActionBannerAction } from "@/components/shared/action-banner";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressMeter } from "@/components/shared/progress-meter";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getTreatmentPlanById } from "@/features/treatment-plans/queries/get-treatment-plan-by-id";
import { requirePermission } from "@/lib/auth/guards";
import {
  buildAppointmentCreatePath,
  buildInvoiceCreatePath
} from "@/lib/navigation/create-flow";
import { hasPermission } from "@/lib/permissions/permissions";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

type TreatmentPlanDetailsPageProps = {
  params: Promise<{
    planId: string;
  }>;
  searchParams?: Promise<{
    success?: string;
    spotlight?: string;
  }>;
};

function getPlanSpotlight(input: {
  spotlight?: string;
  success?: string;
  patientId: string;
  canCreateAppointments: boolean;
  canCreateInvoices: boolean;
}) {
  if (input.spotlight !== "plan-created") {
    return null;
  }

  return {
    eyebrow: "Plan Ready",
    title: "الخطة أصبحت جاهزة للتنفيذ الفعلي",
    description:
      input.success ??
      "أفضل خطوة الآن غالبًا هي حجز الجلسة الأولى وربط الخطة بمسار الفوترة لنفس المريض.",
    actions: [
      input.canCreateAppointments
        ? {
            href: buildAppointmentCreatePath({ patientId: input.patientId }),
            label: "حجز الجلسة الأولى",
            tone: "primary" as const
          }
        : null,
      input.canCreateInvoices
        ? {
            href: buildInvoiceCreatePath({ patientId: input.patientId }),
            label: "ربط بفواتير"
          }
        : null,
      { href: `/patients/${input.patientId}`, label: "ملف المريض" }
    ].filter(Boolean) as ActionBannerAction[]
  };
}

export default async function TreatmentPlanDetailsPage({
  params,
  searchParams
}: TreatmentPlanDetailsPageProps) {
  const user = await requirePermission("treatment-plans:view");
  const { planId } = await params;
  const resolvedSearchParams = await searchParams;
  const plan = await getTreatmentPlanById(planId);

  if (!plan) {
    notFound();
  }

  const canCreateAppointments = hasPermission(user.role, "appointments:*");
  const canCreateInvoices = hasPermission(user.role, "invoices:*");
  const completedItems = plan.items.filter((item) => item.status === "completed").length;
  const activeItems = plan.items.filter((item) =>
    ["planned", "approved", "in_progress"].includes(item.status)
  ).length;
  const totalItems = plan.items.length;
  const primaryServiceName = plan.items[0]?.serviceName;
  const planSpotlight = getPlanSpotlight({
    spotlight: resolvedSearchParams?.spotlight,
    success: resolvedSearchParams?.success,
    patientId: plan.patientId,
    canCreateAppointments,
    canCreateInvoices
  });

  return (
    <div>
      <PageHeader
        eyebrow="Treatment Plan Details"
        title={plan.title}
        description={`خطة علاج للمريض ${plan.patientName} مع الطبيب ${plan.dentistName}.`}
        actions={
          <>
            {canCreateAppointments ? (
              <Link
                href={buildAppointmentCreatePath({ patientId: plan.patientId })}
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
              >
                إنشاء جلسة جديدة
              </Link>
            ) : null}
            {canCreateInvoices ? (
              <Link
                href={buildInvoiceCreatePath({
                  patientId: plan.patientId,
                  serviceName: primaryServiceName
                })}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
              >
                ربط بفاتورة
              </Link>
            ) : null}
            <Link
              href={`/patients/${plan.patientId}`}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              ملف المريض
            </Link>
          </>
        }
      />

      {planSpotlight ? <ActionBanner {...planSpotlight} /> : null}

      {resolvedSearchParams?.success && !planSpotlight ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {resolvedSearchParams.success}
        </div>
      ) : null}

      <div className="grid-cards">
        <StatCard
          label="العناصر الكلية"
          value={formatMetricNumber(totalItems)}
          hint="عدد بنود الخطة العلاجية المسجلة حتى الآن."
        />
        <StatCard
          label="العناصر المكتملة"
          value={formatMetricNumber(completedItems)}
          hint="الجلسات أو البنود التي أُنجزت بالفعل ضمن الخطة."
        />
        <StatCard
          label="العناصر النشطة"
          value={formatMetricNumber(activeItems)}
          hint="البنود الجارية أو المخطط لها والتي ما تزال ضمن مسار التنفيذ."
        />
        <StatCard
          label="التقدم العام"
          value={`${formatMetricNumber(plan.progress)}%`}
          hint="نسبة الإنجاز الحالية المحسوبة عبر عناصر الخطة."
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr,0.95fr]">
        <section className="panel p-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <ProgressMeter value={plan.progress} label="التقدم العام للخطة" />
          </div>

          <div className="mt-6 space-y-4">
            {plan.items
              .sort((left, right) => left.sessionOrder - right.sessionOrder)
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-ink">
                        الجلسة {item.sessionOrder} - {item.serviceName}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                          السن {item.toothNumber}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                          {item.estimatedCost}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 text-sm leading-7 text-slate-600">
                    {item.description}
                  </div>
                </div>
              ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">ملخص الخطة</div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>الحالة</span>
                <StatusBadge status={plan.status} />
              </div>
              <div className="flex items-center justify-between">
                <span>التكلفة الإجمالية</span>
                <span className="font-semibold text-ink">{plan.estimatedTotalCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>الجلسة القادمة</span>
                <span className="font-semibold text-ink">{plan.nextSession}</span>
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">صورة التنفيذ</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                العناصر المكتملة تُظهر أين وصل العلاج فعليًا داخل الخطة.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                العناصر النشطة تساعد الفريق على معرفة ما يحتاج حجز جلسة أو متابعة مباشرة.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                ربط الخطة بالفواتير والمواعيد يحافظ على مسار علاجي ومالي أكثر وضوحًا.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
