import Link from "next/link";
import { redirect } from "next/navigation";

import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { SignalCard } from "@/components/shared/signal-card";
import { StatCard } from "@/components/shared/stat-card";
import { getReportsOverview } from "@/features/reports/queries/get-reports-overview";
import { requireSession } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/permissions/permissions";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

type ReportsPageProps = {
  searchParams?: Promise<{
    period?: "7" | "30" | "90";
  }>;
};

const reportPeriods = ["7", "30", "90"] as const;

function normalizeReportPeriod(value: string | undefined) {
  return reportPeriods.includes(value as (typeof reportPeriods)[number]) ? value : "30";
}

function parseCount(value: string) {
  const normalized = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(normalized) ? normalized : 0;
}

function parsePercent(value: string) {
  const normalized = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(normalized) ? normalized : 0;
}

function getCompletionTone(rate: number) {
  if (rate >= 90) {
    return "border-emerald-200 bg-emerald-50/70 text-emerald-900";
  }

  if (rate >= 75) {
    return "border-amber-200 bg-amber-50/70 text-amber-900";
  }

  return "border-rose-200 bg-rose-50/70 text-rose-900";
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await requireSession();
  const canViewOperationalReports = hasPermission(user.role, "reports:view");
  const canViewFinancialReports =
    canViewOperationalReports || hasPermission(user.role, "reports:view-financial");

  if (!canViewFinancialReports) {
    redirect("/dashboard");
  }

  const selectedPeriod = normalizeReportPeriod(resolvedSearchParams?.period);
  const periodDays = selectedPeriod === "7" ? 7 : selectedPeriod === "90" ? 90 : 30;
  const reportsOverview = await getReportsOverview({
    periodDays,
    includeOperational: canViewOperationalReports
  });

  const summaryCards = canViewOperationalReports
    ? reportsOverview.summary
    : reportsOverview.financialMetrics.map((metric) => ({
        label: metric.label,
        value: metric.value,
        hint: metric.delta
      }));

  const rankedDoctors = [...reportsOverview.doctorPerformance].sort(
    (left, right) => right.visits - left.visits
  );
  const topDoctor = rankedDoctors[0];
  const totalDoctorVisits = rankedDoctors.reduce((sum, doctor) => sum + doctor.visits, 0);
  const averageCompletion = rankedDoctors.length
    ? Math.round(
        rankedDoctors.reduce((sum, doctor) => sum + parsePercent(doctor.completionRate), 0) /
          rankedDoctors.length
      )
    : 0;
  const peakSlot = reportsOverview.peakHours[0];
  const paidInvoicesCount = parseCount(
    reportsOverview.financialMetrics.find((metric) => metric.label === "فواتير مدفوعة")?.value ??
      "0"
  );
  const partialInvoicesCount = parseCount(
    reportsOverview.financialMetrics.find((metric) => metric.label === "فواتير جزئية")?.value ??
      "0"
  );
  const overdueInvoicesCount = parseCount(
    reportsOverview.financialMetrics.find((metric) => metric.label === "فواتير متأخرة")?.value ??
      "0"
  );
  const totalInvoicesCount = paidInvoicesCount + partialInvoicesCount + overdueInvoicesCount;
  const collectionRatio =
    totalInvoicesCount > 0 ? Math.round((paidInvoicesCount / totalInvoicesCount) * 100) : 0;

  const summaryExportRows = summaryCards.map((report) => ({
    المؤشر: report.label,
    القيمة: report.value,
    ملاحظة: report.hint
  }));
  const doctorPerformanceExportRows = rankedDoctors.map((doctor) => ({
    الطبيب: doctor.dentistName,
    الزيارات: doctor.visits,
    الإيراد: doctor.revenue,
    نسبة_الإكمال: doctor.completionRate
  }));
  const peakHoursExportRows = reportsOverview.peakHours.map((slot, index) => ({
    الترتيب: index + 1,
    النافذة: slot.slot,
    المواعيد: slot.appointments
  }));

  return (
    <div>
      <PageHeader
        eyebrow="التقارير"
        title="التقارير"
        description="مركز تقارير تنفيذي يربط القراءة التشغيلية والمالية في مكان واحد، مع أدوات طباعة وتصدير جاهزة لتسهيل المراجعة الداخلية أو مشاركة الملخص مع الإدارة."
        tips={["اطبع الملخص الحالي", "صدّر الأداء إلى CSV", "غيّر الفترة الزمنية بسرعة"]}
        actions={
          <>
            <Link
              href="/appointments"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 print:hidden"
            >
              فتح المواعيد
            </Link>
            <Link
              href="/invoices"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white print:hidden"
            >
              فتح الفواتير
            </Link>
          </>
        }
      />

      <div className="panel mb-6 p-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <form method="get" className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600">الفترة الزمنية:</span>
            <select
              name="period"
              defaultValue={selectedPeriod}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
            >
              <option value="7">آخر 7 أيام</option>
              <option value="30">آخر 30 يومًا</option>
              <option value="90">آخر 90 يومًا</option>
            </select>
            <button
              type="submit"
              className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800"
            >
              تحديث التقرير
            </button>
          </form>

          <div className="flex flex-wrap gap-3">
            <ExportCsvButton
              filename={`dentflow-summary-${periodDays}d.csv`}
              rows={summaryExportRows}
            />
            {canViewOperationalReports ? (
              <ExportCsvButton
                filename={`dentflow-doctor-performance-${periodDays}d.csv`}
                rows={doctorPerformanceExportRows}
                label="تصدير أداء الأطباء"
              />
            ) : null}
            {canViewOperationalReports ? (
              <ExportCsvButton
                filename={`dentflow-peak-hours-${periodDays}d.csv`}
                rows={peakHoursExportRows}
                label="تصدير أوقات الذروة"
              />
            ) : null}
            <PrintButton label="طباعة التقرير" />
          </div>
        </div>
      </div>

      <div className="grid-cards">
        {summaryCards.map((report) => (
          <StatCard key={report.label} {...report} badgeLabel="تقارير" />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr,0.88fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-ink">الإشارات التنفيذية</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                قراءة أسرع لأقوى ما ظهر في الفترة الحالية قبل الغوص في الجداول التفصيلية.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              فترة التحليل: {periodDays} يومًا
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {reportsOverview.executiveSignals.map((signal) => (
              <SignalCard
                key={signal.label}
                label={signal.label}
                value={signal.value}
                description={signal.description}
                tone={signal.tone}
              />
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <div className="text-xl font-semibold text-ink">خطوات مقترحة</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            تحويل القراءة التحليلية إلى قرارات تشغيلية قابلة للتنفيذ.
          </p>

          <div className="mt-5 space-y-4">
            {reportsOverview.actionPrompts.map((prompt, index) => (
              <div
                key={prompt.title}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">إجراء {index + 1}</div>
                    <div className="mt-2 text-lg font-semibold text-ink">{prompt.title}</div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      prompt.tone === "rose"
                        ? "bg-rose-100 text-rose-800"
                        : prompt.tone === "amber"
                          ? "bg-amber-100 text-amber-800"
                          : prompt.tone === "emerald"
                            ? "bg-emerald-100 text-emerald-800"
                            : prompt.tone === "slate"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-brand-100 text-brand-900"
                    }`}
                  >
                    متابعة
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{prompt.description}</p>
                <Link
                  href={prompt.href}
                  className="mt-4 inline-flex rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800"
                >
                  {prompt.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      {canViewOperationalReports ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <section className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-ink">قراءة تنفيذية</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  هذه الخلاصة تجمع أهم إشارات الفترة الحالية حتى ترى ضغط العيادة وأداء الفريق وسرعة
                  التحصيل من نظرة واحدة.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                فترة التحليل: {periodDays} يومًا
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-slate-500">أكثر طبيب نشاطًا</div>
                <div className="mt-4 text-xl font-bold text-ink">
                  {topDoctor?.dentistName ?? "لا توجد بيانات"}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {topDoctor
                    ? `${formatMetricNumber(topDoctor.visits)} زيارة و${topDoctor.revenue} خلال هذه الفترة.`
                    : "سيظهر هنا الطبيب الأعلى نشاطًا عند توفر زيارات ضمن الفترة المحددة."}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-slate-500">الإكمال العام</div>
                <div className="mt-4 text-3xl font-bold text-ink">{averageCompletion}%</div>
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  متوسط إكمال المواعيد عبر الأطباء مع {formatMetricNumber(totalDoctorVisits)} زيارة
                  مسجلة في نفس الفترة.
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-slate-500">أفضل ساعة ذروة</div>
                <div className="mt-4 text-xl font-bold text-ink">
                  {peakSlot?.slot ?? "لا توجد بيانات"}
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-600">
                  {peakSlot
                    ? `${formatMetricNumber(peakSlot.appointments)} موعدًا في النافذة الأعلى ازدحامًا.`
                    : "ستظهر نافذة الذروة هنا عند توفر مواعيد قابلة للتحليل."}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
              <div className="text-sm font-semibold text-brand-900">ماذا تقرأ من الأرقام؟</div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                  ارتفاع الإكمال فوق 90% يعني أن مسار الموعد من التأكيد حتى الإغلاق يعمل بشكل
                  ممتاز.
                </div>
                <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                  إذا كانت الذروة مركزة في نافذة قصيرة، فكر في توزيع الضغط على الأطباء أو ضبط أوقات
                  بعض الخدمات.
                </div>
                <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                  الفواتير الجزئية والمتأخرة تعطيك إشارة مباشرة على أين يحتاج الفريق متابعة تحصيل أو
                  تذكير مالي.
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="panel p-6">
              <div className="text-xl font-semibold text-ink">مؤشرات مالية</div>
              <div className="mt-5 space-y-4">
                {reportsOverview.financialMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="text-sm text-slate-500">{metric.label}</div>
                    <div className="mt-2 text-xl font-bold text-ink">{metric.value}</div>
                    <div className="mt-2 text-sm font-semibold text-brand-800">{metric.delta}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel p-6">
              <div className="text-xl font-semibold text-ink">قصة التحصيل</div>
              <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>الفواتير المحصلة بالكامل</span>
                  <span className="font-semibold text-ink">{collectionRatio}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-brand-600 to-brand-300"
                    style={{ width: `${collectionRatio}%` }}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div className="text-slate-500">مدفوعة</div>
                    <div className="mt-1 font-semibold text-ink">
                      {formatMetricNumber(paidInvoicesCount)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div className="text-slate-500">جزئية</div>
                    <div className="mt-1 font-semibold text-ink">
                      {formatMetricNumber(partialInvoicesCount)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <div className="text-slate-500">متأخرة</div>
                    <div className="mt-1 font-semibold text-ink">
                      {formatMetricNumber(overdueInvoicesCount)}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          يتم عرض القراءة المالية فقط حسب صلاحيات حسابك الحالية، لذلك أُخفيت المؤشرات التشغيلية
          المتعلقة بالمواعيد والأطباء.
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr,0.88fr]">
        {canViewOperationalReports ? (
          <section className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-ink">أداء الأطباء</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  متابعة النشاط والإيراد ونسبة الإكمال لكل طبيب تساعدك على توزيع الضغط واتخاذ قرارات
                  الجدولة بشكل أفضل.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {formatMetricNumber(rankedDoctors.length)} طبيب ظاهر
              </span>
            </div>

            {rankedDoctors.length > 0 ? (
              <>
                <div className="mt-5 space-y-4 md:hidden">
                  {rankedDoctors.map((doctor) => {
                    const completionRate = parsePercent(doctor.completionRate);

                    return (
                      <div
                        key={doctor.dentistName}
                        className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold text-ink">{doctor.dentistName}</div>
                            <div className="mt-1 text-sm text-slate-500">{doctor.revenue}</div>
                          </div>
                          <div
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCompletionTone(
                              completionRate
                            )}`}
                          >
                            إكمال {doctor.completionRate}
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          {formatMetricNumber(doctor.visits)} زيارة خلال الفترة الحالية.
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 hidden overflow-x-auto md:block">
                  <table className="min-w-full text-right text-sm">
                    <thead className="border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-3 py-4 font-medium">الطبيب</th>
                        <th className="px-3 py-4 font-medium">الزيارات</th>
                        <th className="px-3 py-4 font-medium">الإيراد</th>
                        <th className="px-3 py-4 font-medium">نسبة الإكمال</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedDoctors.map((doctor) => {
                        const completionRate = parsePercent(doctor.completionRate);

                        return (
                          <tr key={doctor.dentistName} className="border-b border-slate-100">
                            <td className="px-3 py-4 font-semibold text-ink">{doctor.dentistName}</td>
                            <td className="px-3 py-4 text-slate-700">{doctor.visits}</td>
                            <td className="px-3 py-4 text-slate-700">{doctor.revenue}</td>
                            <td className="px-3 py-4">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCompletionTone(
                                  completionRate
                                )}`}
                              >
                                {doctor.completionRate}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                لا توجد بيانات أداء كافية ضمن الفترة الحالية.
              </div>
            )}
          </section>
        ) : (
          <section className="panel p-6">
            <div className="text-xl font-semibold text-ink">ملخص مالي</div>
            <div className="mt-3 text-sm leading-7 text-slate-600">
              تظل المؤشرات المالية متاحة لك حتى مع غياب صلاحية التقارير التشغيلية. راقب التحصيل
              المفتوح، الفواتير الجزئية، وتأخر السداد لتحديد أولويات المتابعة.
            </div>
          </section>
        )}

        <aside className="space-y-6">
          {canViewOperationalReports ? (
            <section className="panel p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xl font-semibold text-ink">أوقات الذروة</div>
                <span className="text-xs font-semibold text-slate-500">
                  {formatMetricNumber(reportsOverview.peakHours.length)} نوافذ تحليل
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {reportsOverview.peakHours.map((slot, index) => (
                  <div
                    key={slot.slot}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm"
                  >
                    <div>
                      <div className="font-semibold text-ink">{slot.slot}</div>
                      <div className="mt-1 text-xs text-slate-500">ترتيب {index + 1}</div>
                    </div>
                    <span className="font-semibold text-ink">
                      {formatMetricNumber(slot.appointments)} موعدًا
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel p-6">
            <div className="text-xl font-semibold text-ink">إشارات للمتابعة</div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                إذا زادت الفواتير المتأخرة عن الفواتير الجزئية، ركز أولًا على التواصل المالي قبل
                فتح خطط علاج جديدة لنفس المرضى.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                عند تركز الذروة في ساعات محددة، راجع التوزيع بين الأطباء أو مدد الخدمات الافتراضية
                من صفحة الإعدادات.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                اربط هذه القراءة مع صفحة الإشعارات حتى تقل حالات عدم الحضور ويصبح التقويم أكثر
                استقرارًا.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
