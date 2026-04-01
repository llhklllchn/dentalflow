import Link from "next/link";

import { ActionPromptCard } from "@/components/shared/action-prompt-card";
import { CollectionEmptyState } from "@/components/shared/collection-empty-state";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { SignalCard } from "@/components/shared/signal-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getGlobalSearchResults } from "@/features/search/queries/get-global-search-results";
import { requireSession } from "@/lib/auth/guards";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

type SearchResults = Awaited<ReturnType<typeof getGlobalSearchResults>>;
type SearchActionPrompt = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: "brand" | "emerald" | "amber" | "rose" | "slate";
};
type SearchSignal = {
  label: string;
  value: string;
  description: string;
  tone: "brand" | "emerald" | "amber" | "rose" | "slate";
};
type BadgeStatus = Parameters<typeof StatusBadge>[0]["status"];

const paymentMethodLabels = {
  cash: "نقدًا",
  card: "بطاقة",
  transfer: "تحويل",
  mixed: "مدمج"
} as const;

function getPaymentMethodLabel(value: string) {
  return paymentMethodLabels[value as keyof typeof paymentMethodLabels] ?? value;
}

function getTopCategory(results: SearchResults) {
  const categories = [
    { label: "المرضى", count: results.patients.length },
    { label: "المواعيد", count: results.appointments.length },
    { label: "الفواتير", count: results.invoices.length },
    { label: "المدفوعات", count: results.payments.length },
    { label: "الخطط العلاجية", count: results.treatmentPlans.length }
  ].sort((left, right) => right.count - left.count);

  return categories[0]?.count ? categories[0].label : "لا توجد نتائج بعد";
}

function getSearchSignals(results: SearchResults, totalMatches: number): SearchSignal[] {
  const topCategory = getTopCategory(results);
  const coverage = [
    results.patients.length,
    results.appointments.length,
    results.invoices.length,
    results.payments.length,
    results.treatmentPlans.length
  ].filter((count) => count > 0).length;

  return [
    {
      label: "إجمالي النتائج",
      value: formatMetricNumber(totalMatches),
      description: `نتائج مطابقة لعبارة "${results.query}" عبر كل المسارات المتاحة لك.`,
      tone: totalMatches > 0 ? "brand" : "slate"
    },
    {
      label: "القسم الأبرز",
      value: topCategory,
      description: "القسم الذي ظهر فيه أعلى عدد مطابقات في جولة البحث الحالية.",
      tone: totalMatches > 0 ? "emerald" : "slate"
    },
    {
      label: "اتساع التغطية",
      value: `${formatMetricNumber(coverage)}/5`,
      description: "عدد المسارات التي ظهر فيها تطابق فعلي لهذا البحث.",
      tone: coverage >= 3 ? "brand" : coverage >= 1 ? "amber" : "slate"
    }
  ];
}

function getSearchActionPrompts(results: SearchResults): SearchActionPrompt[] {
  const prompts: SearchActionPrompt[] = [];

  if (results.patients[0]) {
    prompts.push({
      title: `افتح ملف ${results.patients[0].fullName}`,
      description: "هذا أقرب اختصار للانتقال من نتيجة البحث إلى ملف المريض مباشرة.",
      href: `/patients/${results.patients[0].id}`,
      cta: "فتح الملف",
      tone: "brand"
    });
  }

  if (results.invoices[0]) {
    prompts.push({
      title: `راجع الفاتورة ${results.invoices[0].id}`,
      description: "اختصار مناسب إذا كان المقصود من البحث متابعة جانب مالي أو رصيد متبقٍ.",
      href: `/invoices/${results.invoices[0].id}`,
      cta: "فتح الفاتورة",
      tone: "emerald"
    });
  }

  if (results.treatmentPlans[0]) {
    prompts.push({
      title: `تابع الخطة ${results.treatmentPlans[0].title}`,
      description: "يفيد عندما يكون البحث مرتبطًا بخطة علاج أو جلسات قادمة للمريض.",
      href: `/treatment-plans/${results.treatmentPlans[0].id}`,
      cta: "فتح الخطة",
      tone: "amber"
    });
  }

  if (results.payments[0]) {
    prompts.push({
      title: `افتح سجل ${results.payments[0].patient}`,
      description: "نتيجة مفيدة إذا كان التركيز الآن على التحصيل أو ربط الدفعات بالفواتير.",
      href: `/payments?search=${encodeURIComponent(results.payments[0].patient)}`,
      cta: "فتح المدفوعات",
      tone: "slate"
    });
  }

  return prompts.slice(0, 3);
}

function getPopulatedSections(results: SearchResults) {
  return [
    { id: "patients", label: "المرضى", count: results.patients.length },
    { id: "appointments", label: "المواعيد", count: results.appointments.length },
    { id: "invoices", label: "الفواتير", count: results.invoices.length },
    { id: "payments", label: "المدفوعات", count: results.payments.length },
    { id: "treatment-plans", label: "الخطط العلاجية", count: results.treatmentPlans.length }
  ].filter((section) => section.count > 0);
}

function getExportRows(results: SearchResults) {
  return [
    ...results.patients.map((patient) => ({
      category: "patient",
      title: patient.fullName,
      subtitle: patient.phone,
      status: patient.dentistName,
      date: patient.lastVisit,
      amount: patient.balance
    })),
    ...results.appointments.map((appointment) => ({
      category: "appointment",
      title: appointment.patient,
      subtitle: `${appointment.service} - ${appointment.dentist}`,
      status: appointment.status,
      date: appointment.time,
      amount: ""
    })),
    ...results.invoices.map((invoice) => ({
      category: "invoice",
      title: invoice.id,
      subtitle: invoice.patient,
      status: invoice.status,
      date: invoice.issueDate,
      amount: invoice.balance
    })),
    ...results.payments.map((payment) => ({
      category: "payment",
      title: payment.invoiceId,
      subtitle: payment.patient,
      status: payment.method,
      date: payment.date,
      amount: payment.amount
    })),
    ...results.treatmentPlans.map((plan) => ({
      category: "treatment_plan",
      title: plan.title,
      subtitle: plan.patientName,
      status: plan.status,
      date: plan.nextSession,
      amount: plan.estimatedTotalCost
    }))
  ];
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await requireSession();
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const results = await getGlobalSearchResults({
    query,
    role: user.role
  });

  const totalMatches =
    results.patients.length +
    results.appointments.length +
    results.invoices.length +
    results.payments.length +
    results.treatmentPlans.length;
  const signals = getSearchSignals(results, totalMatches);
  const actionPrompts = getSearchActionPrompts(results);
  const populatedSections = getPopulatedSections(results);
  const exportRows = getExportRows(results);

  return (
    <div>
      <PageHeader
        eyebrow="Global Search"
        title="البحث العام"
        description="مركز بحث واسع يصل الآن إلى المرضى والمواعيد والفواتير والمدفوعات والخطط العلاجية من واجهة واحدة أسرع وأوضح."
        tips={[
          "ابحث بالاسم أو الهاتف أو رقم الفاتورة",
          "استخدم النتائج كاختصار تنقل مباشر",
          "راقب أي قسم ظهر كأقوى تطابق"
        ]}
        actions={
          <>
            <Link
              href="/patients"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              صفحة المرضى
            </Link>
            <Link
              href="/appointments"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              صفحة المواعيد
            </Link>
          </>
        }
      />

      <section className="panel p-6">
        <form method="get" className="grid gap-3 md:grid-cols-[1fr,140px,140px]">
          <input
            name="q"
            defaultValue={query}
            placeholder="ابحث بالاسم، الهاتف، رقم الفاتورة، عنوان الخطة، أو اسم الخدمة"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          />
          <button
            type="submit"
            className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800"
          >
            بحث
          </button>
          <Link
            href="/search"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
          >
            مسح
          </Link>
        </form>
      </section>

      {!query ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
          <CollectionEmptyState
            title="ابدأ من البحث الواسع"
            description="من هنا تصل بسرعة إلى ملفات المرضى والمواعيد والفواتير والمدفوعات والخطط العلاجية دون الحاجة لمعرفة الصفحة الأصلية لكل سجل."
            primaryAction={{ href: "/patients", label: "فتح المرضى" }}
            secondaryAction={{ href: "/appointments", label: "فتح المواعيد" }}
            highlights={["مرضى", "مواعيد", "فواتير", "مدفوعات", "خطط علاجية"]}
          />

          <section className="panel p-6">
            <div className="text-xl font-semibold text-ink">مسارات سريعة</div>
            <div className="mt-5 space-y-3">
              <Link
                href="/patients"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:border-brand-300"
              >
                <span>فتح المرضى</span>
                <span className="text-brand-700">انتقال</span>
              </Link>
              <Link
                href="/payments"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:border-brand-300"
              >
                <span>فتح المدفوعات</span>
                <span className="text-brand-700">انتقال</span>
              </Link>
              <Link
                href="/treatment-plans"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:border-brand-300"
              >
                <span>فتح الخطط العلاجية</span>
                <span className="text-brand-700">انتقال</span>
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      {query ? (
        <>
          <div className="mt-6 grid-cards">
            <StatCard
              label="إجمالي النتائج"
              value={formatMetricNumber(totalMatches)}
              hint={`عدد النتائج المطابقة لعبارة "${results.query}" عبر كل الأقسام المتاحة.`}
              badgeLabel="البحث"
            />
            <StatCard
              label="المدفوعات"
              value={formatMetricNumber(results.payments.length)}
              hint="نتائج مالية مرتبطة بالدفعات والتحصيلات المطابقة لهذا البحث."
              badgeLabel="البحث"
            />
            <StatCard
              label="الخطط العلاجية"
              value={formatMetricNumber(results.treatmentPlans.length)}
              hint="خطط علاج ظهرت ضمن البحث بحسب العنوان أو المريض أو الطبيب أو عناصر الخطة."
              badgeLabel="البحث"
            />
            <StatCard
              label="القسم الأبرز"
              value={getTopCategory(results)}
              hint="القسم الذي ظهر فيه أعلى عدد مطابقات ضمن هذه الجولة."
              badgeLabel="البحث"
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
            <section className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-ink">رادار النتائج</div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    قراءة تنفيذية سريعة لما كشفه البحث قبل فتح السجلات واحدًا واحدًا.
                  </p>
                </div>
                <ExportCsvButton
                  filename={`search-${results.query}`}
                  rows={exportRows}
                  label="تصدير النتائج"
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {signals.map((signal) => (
                  <SignalCard
                    key={signal.label}
                    label={signal.label}
                    value={signal.value}
                    description={signal.description}
                    tone={signal.tone}
                  />
                ))}
              </div>

              {populatedSections.length > 0 ? (
                <div className="mt-6 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
                  <div className="text-sm font-semibold text-brand-900">التنقل بين الأقسام</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {populatedSections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        {section.label}: {formatMetricNumber(section.count)}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="panel p-6">
              <div className="text-xl font-semibold text-ink">أفضل مسارات المتابعة</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                اقتراحات مبنية على أقرب النتائج الظاهرة لك الآن لتختصر عليك الخطوة التالية.
              </p>

              <div className="mt-5 space-y-4">
                {actionPrompts.length > 0 ? (
                  actionPrompts.map((prompt, index) => (
                    <ActionPromptCard key={prompt.title} index={index} {...prompt} />
                  ))
                ) : (
                  <CollectionEmptyState
                    title="لا توجد مسارات مقترحة"
                    description={`لم يظهر ما يكفي من النتائج لبناء اختصارات مباشرة لعبارة "${results.query}".`}
                    primaryAction={{ href: "/search", label: "بحث جديد" }}
                    secondaryAction={{ href: "/dashboard", label: "فتح لوحة التحكم" }}
                  />
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}

      {results.patients.length > 0 ? (
        <section id="patients" className="panel mt-6 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold text-ink">نتائج المرضى</div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {results.patients.length} نتيجة
            </span>
          </div>
          <div className="grid gap-3">
            {results.patients.map((patient) => (
              <Link
                key={patient.id}
                href={`/patients/${patient.id}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{patient.fullName}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {patient.phone} | آخر زيارة: {patient.lastVisit} | الرصيد: {patient.balance}
                    </div>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {patient.dentistName}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.appointments.length > 0 ? (
        <section id="appointments" className="panel mt-6 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold text-ink">نتائج المواعيد</div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {results.appointments.length} نتيجة
            </span>
          </div>
          <div className="grid gap-3">
            {results.appointments.map((appointment) => (
              <Link
                key={appointment.id}
                href={`/appointments?search=${encodeURIComponent(appointment.patient)}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{appointment.patient}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {appointment.service} | {appointment.dentist} | {appointment.time}
                    </div>
                  </div>
                  <StatusBadge status={appointment.status as BadgeStatus} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.invoices.length > 0 ? (
        <section id="invoices" className="panel mt-6 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold text-ink">نتائج الفواتير</div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {results.invoices.length} نتيجة
            </span>
          </div>
          <div className="grid gap-3">
            {results.invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{invoice.id}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {invoice.patient} | الإجمالي: {invoice.total} | المتبقي: {invoice.balance}
                    </div>
                  </div>
                  <StatusBadge status={invoice.status as BadgeStatus} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.payments.length > 0 ? (
        <section id="payments" className="panel mt-6 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold text-ink">نتائج المدفوعات</div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {results.payments.length} نتيجة
            </span>
          </div>
          <div className="grid gap-3">
            {results.payments.map((payment) => (
              <Link
                key={payment.id}
                href={`/payments?search=${encodeURIComponent(payment.patient)}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{payment.invoiceId}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {payment.patient} | {payment.amount} | {payment.date}
                    </div>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {getPaymentMethodLabel(payment.method)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {results.treatmentPlans.length > 0 ? (
        <section id="treatment-plans" className="panel mt-6 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold text-ink">نتائج الخطط العلاجية</div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {results.treatmentPlans.length} نتيجة
            </span>
          </div>
          <div className="grid gap-3">
            {results.treatmentPlans.map((plan) => (
              <Link
                key={plan.id}
                href={`/treatment-plans/${plan.id}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{plan.title}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {plan.patientName} | {plan.estimatedTotalCost} | الجلسة التالية: {plan.nextSession}
                    </div>
                  </div>
                  <StatusBadge status={plan.status as BadgeStatus} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {query && totalMatches === 0 ? (
        <div className="mt-6">
          <CollectionEmptyState
            title="لم يتم العثور على نتائج"
            description={`لم يظهر أي تطابق لعبارة "${results.query}". جرّب جزءًا من الاسم، رقم الهاتف، رقم الفاتورة، أو عنوان الخطة العلاجية.`}
            primaryAction={{ href: "/search", label: "بحث جديد" }}
            secondaryAction={{ href: "/dashboard", label: "فتح لوحة التحكم" }}
            highlights={["مرضى", "مواعيد", "فواتير", "مدفوعات", "خطط علاجية"]}
          />
        </div>
      ) : null}
    </div>
  );
}
