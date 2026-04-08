import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActionBanner, type ActionBannerAction } from "@/components/shared/action-banner";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressMeter } from "@/components/shared/progress-meter";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { archivePatient } from "@/features/patients/actions/archive-patient";
import { getPatientWorkspace } from "@/features/patients/queries/get-patient-workspace";
import { requirePermission } from "@/lib/auth/guards";
import {
  buildAppointmentCreatePath,
  buildDentalRecordCreatePath,
  buildInvoiceCreatePath,
  buildTreatmentPlanCreatePath
} from "@/lib/navigation/create-flow";
import { hasPermission } from "@/lib/permissions/permissions";
import { extractFormattedAmount, formatMetricNumber } from "@/lib/utils/formatted-value";

type PatientDetailsPageProps = {
  params: Promise<{
    patientId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    success?: string;
    spotlight?: string;
  }>;
};

const patientSections = [
  { id: "overview", label: "نظرة عامة" },
  { id: "medical", label: "التاريخ الطبي" },
  { id: "records", label: "السجلات" },
  { id: "finance", label: "المالية" },
  { id: "plan", label: "الخطة" },
  { id: "journey", label: "رحلة المريض" }
];

const paymentMethodLabels = {
  cash: "نقدًا",
  card: "بطاقة",
  transfer: "تحويل",
  mixed: "دفعات متعددة"
} as const;

function getPaymentMethodLabel(value: string) {
  return paymentMethodLabels[value as keyof typeof paymentMethodLabels] ?? value;
}

function getPatientSpotlight(input: {
  spotlight?: string;
  success?: string;
  patientId: string;
  canCreateAppointments: boolean;
  canCreateInvoices: boolean;
  canCreatePlans: boolean;
  canCreateRecords: boolean;
}) {
  const appointmentHref = buildAppointmentCreatePath({ patientId: input.patientId });
  const invoiceHref = buildInvoiceCreatePath({ patientId: input.patientId });
  const planHref = buildTreatmentPlanCreatePath({ patientId: input.patientId });
  const recordHref = buildDentalRecordCreatePath({ patientId: input.patientId });

  switch (input.spotlight) {
    case "patient-created":
      return {
        eyebrow: "Patient Ready",
        title: "ملف المريض صار جاهزًا للانطلاق",
        description:
          input.success ??
          "الآن يمكنك حجز أول موعد أو بناء خطة علاج أو إضافة سجل طبي من نفس المسار دون إعادة إدخال البيانات.",
        actions: [
          input.canCreateAppointments
            ? { href: appointmentHref, label: "حجز أول موعد", tone: "primary" as const }
            : null,
          input.canCreatePlans ? { href: planHref, label: "خطة علاج" } : null,
          input.canCreateRecords ? { href: recordHref, label: "سجل طبي" } : null,
          input.canCreateInvoices ? { href: invoiceHref, label: "فاتورة" } : null
        ].filter(Boolean) as ActionBannerAction[]
      };
    case "appointment-created":
      return {
        eyebrow: "Visit Ready",
        title: "الموعد صار ضمن رحلة المريض",
        description:
          input.success ??
          "يمكنك الآن توثيق الزيارة أو تجهيز الفاتورة أو إضافة خطة علاج مرتبطة بنفس المريض.",
        actions: [
          input.canCreateRecords
            ? { href: recordHref, label: "توثيق الزيارة", tone: "primary" as const }
            : null,
          input.canCreateInvoices ? { href: invoiceHref, label: "إنشاء فاتورة" } : null,
          input.canCreatePlans ? { href: planHref, label: "خطة علاج" } : null
        ].filter(Boolean) as ActionBannerAction[]
      };
    case "invoice-created":
      return {
        eyebrow: "Finance Ready",
        title: "المسار المالي صار جاهزًا للمتابعة",
        description:
          input.success ??
          "أضفت فاتورة جديدة لهذا المريض، ويمكنك متابعة التحصيل أو العودة إلى الملف العلاجي مباشرة.",
        actions: [
          input.canCreateAppointments
            ? { href: appointmentHref, label: "موعد جديد", tone: "primary" as const }
            : null,
          { href: "/invoices", label: "عرض الفواتير" },
          input.canCreatePlans ? { href: planHref, label: "خطة علاج" } : null
        ].filter(Boolean) as ActionBannerAction[]
      };
    case "record-created":
      return {
        eyebrow: "Clinical Note Saved",
        title: "السجل الطبي انضاف مباشرة إلى الملف",
        description:
          input.success ??
          "يمكنك الآن تجهيز متابعة علاجية أو موعد لاحق أو ربط الفاتورة إذا كانت الجلسة تحتاج تحصيلًا.",
        actions: [
          input.canCreatePlans
            ? { href: planHref, label: "بناء خطة علاج", tone: "primary" as const }
            : null,
          input.canCreateAppointments ? { href: appointmentHref, label: "موعد متابعة" } : null,
          input.canCreateInvoices ? { href: invoiceHref, label: "إنشاء فاتورة" } : null
        ].filter(Boolean) as ActionBannerAction[]
      };
    case "plan-created":
      return {
        eyebrow: "Plan Ready",
        title: "خطة العلاج أصبحت جاهزة للتنفيذ",
        description:
          input.success ??
          "الآن أفضل خطوة عادة هي حجز الجلسة الأولى أو ربط الخطة بمسار الفوترة لهذا المريض.",
        actions: [
          input.canCreateAppointments
            ? { href: appointmentHref, label: "حجز الجلسة الأولى", tone: "primary" as const }
            : null,
          input.canCreateInvoices ? { href: invoiceHref, label: "ربط بفواتير" } : null,
          { href: "/treatment-plans", label: "عرض الخطط" }
        ].filter(Boolean) as ActionBannerAction[]
      };
    default:
      return null;
  }
}

export default async function PatientDetailsPage({
  params,
  searchParams
}: PatientDetailsPageProps) {
  const user = await requirePermission("patients:view");
  const { patientId } = await params;
  const resolvedSearchParams = await searchParams;
  const canManagePatients = hasPermission(user.role, "patients:*");
  const canCreateAppointments = hasPermission(user.role, "appointments:*");
  const canCreateInvoices = hasPermission(user.role, "invoices:*");
  const canCreatePlans = hasPermission(user.role, "treatment-plans:*");
  const canCreateRecords = hasPermission(user.role, "dental-records:*");

  const workspace = await getPatientWorkspace(patientId);

  if (!workspace) {
    notFound();
  }

  const { patient, dentalRecords, treatmentPlans, payments, timeline } = workspace;
  const activePlan = treatmentPlans[0];
  const patientSpotlight = getPatientSpotlight({
    spotlight: resolvedSearchParams?.spotlight,
    success: resolvedSearchParams?.success,
    patientId,
    canCreateAppointments,
    canCreateInvoices,
    canCreatePlans,
    canCreateRecords
  });

  const outstandingBalance = extractFormattedAmount(patient.balance);
  const invoiceCount = patient.recentInvoices.length;
  const paymentCount = payments.length;
  const recordCount = dentalRecords.length;
  const remainingPlanItems =
    activePlan?.items.filter((item) => item.status !== "completed").length ?? 0;
  const nextJourneyItem = timeline[0];
  const financialFocus =
    outstandingBalance > 0
      ? `يوجد ${formatMetricNumber(outstandingBalance)} JOD تحتاج متابعة مالية.`
      : "لا توجد مستحقات مفتوحة حاليًا لهذا المريض.";
  const careFocus = activePlan
    ? remainingPlanItems > 0
      ? `تبقى ${formatMetricNumber(remainingPlanItems)} عناصر ضمن الخطة الحالية.`
      : "كل عناصر الخطة الحالية مكتملة حتى الآن."
    : "لا توجد خطة علاج نشطة مرتبطة بهذا الملف حاليًا.";

  const patientJourneyRows = timeline.map((entry) => ({
    date: entry.date,
    title: entry.title,
    description: entry.description,
    status: entry.status
  }));
  const financeRows = [
    ...patient.recentInvoices.map((invoice) => ({
      type: "invoice",
      id: invoice.id,
      date: invoice.issueDate ?? "—",
      amount: invoice.total,
      status: invoice.status
    })),
    ...payments.map((payment) => ({
      type: "payment",
      id: payment.invoiceId,
      date: payment.date,
      amount: payment.amount,
      status: payment.method
    }))
  ];
  const recordRows = dentalRecords.map((record) => ({
    date: record.appointmentDate,
    dentist: record.dentistName,
    diagnosis: record.diagnosis,
    procedure: record.procedureDone,
    follow_up: record.followUpNotes
  }));

  async function archiveCurrentPatient() {
    "use server";

    const result = await archivePatient(patientId);

    if (!result.ok) {
      redirect(
        `/patients/${patientId}?error=${encodeURIComponent(
          result.message ?? "تعذر أرشفة المريض."
        )}`
      );
    }

    redirect(
      `/patients?success=${encodeURIComponent(
        result.message ?? "تمت أرشفة المريض بنجاح."
      )}`
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="رحلة المريض"
        title={`ملف المريض ${patient.fullName}`}
        description="مساحة تشغيل متكاملة تجمع الرحلة السريرية والمالية والخطة العلاجية والطباعة والتتبع اليومي من صفحة واحدة أوضح للفريق."
        tips={[
          `آخر زيارة: ${patient.lastVisit}`,
          `طبيب المتابعة: ${patient.dentistName}`,
          `المدينة: ${patient.city}`,
          financialFocus
        ]}
        actions={
          <>
            {canCreateAppointments ? (
              <Link
                href={buildAppointmentCreatePath({ patientId })}
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
              >
                موعد جديد
              </Link>
            ) : null}
            {canCreateInvoices ? (
              <Link
                href={buildInvoiceCreatePath({ patientId })}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
              >
                فاتورة جديدة
              </Link>
            ) : null}
            {canCreateRecords ? (
              <Link
                href={buildDentalRecordCreatePath({ patientId })}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
              >
                سجل طبي
              </Link>
            ) : null}
            {canCreatePlans ? (
              <Link
                href={buildTreatmentPlanCreatePath({ patientId })}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
              >
                خطة علاج
              </Link>
            ) : null}
            <Link
              href={`/patients/${patientId}/print`}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              نسخة طباعة
            </Link>
            <ExportCsvButton
              filename={`patient-${patient.id}-journey`}
              rows={patientJourneyRows}
              label="تصدير الرحلة"
            />
            {canManagePatients ? (
              <Link
                href={`/patients/${patientId}/edit`}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
              >
                تعديل الملف
              </Link>
            ) : null}
            {canManagePatients ? (
              <form action={archiveCurrentPatient}>
                <button
                  type="submit"
                  className="rounded-full border border-rose-300 bg-white px-5 py-3 text-sm font-semibold text-rose-700"
                >
                  أرشفة المريض
                </button>
              </form>
            ) : null}
          </>
        }
      />

      {resolvedSearchParams?.error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      {patientSpotlight ? <ActionBanner {...patientSpotlight} /> : null}

      {resolvedSearchParams?.success && !patientSpotlight ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {resolvedSearchParams.success}
        </div>
      ) : null}

      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {patientSections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={
                index === 0
                  ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              }
            >
              {section.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid-cards">
        <StatCard
          label="الرصيد المفتوح"
          value={`${formatMetricNumber(outstandingBalance)} JOD`}
          hint="إجمالي المستحقات الحالية المرتبطة بهذا المريض."
        />
        <StatCard
          label="السجلات الطبية"
          value={formatMetricNumber(recordCount)}
          hint="عدد السجلات الطبية الموثقة للمريض حتى الآن."
        />
        <StatCard
          label="الفواتير والمدفوعات"
          value={`${formatMetricNumber(invoiceCount)} / ${formatMetricNumber(paymentCount)}`}
          hint="عدد الفواتير الحديثة مقابل الدفعات المسجلة داخل الملف."
        />
        <StatCard
          label="عناصر الخطة المفتوحة"
          value={formatMetricNumber(remainingPlanItems)}
          hint="العناصر التي ما تزال تحتاج تنفيذًا أو متابعة ضمن الخطة الحالية."
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
        <section className="space-y-6">
          <div id="overview" className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-xl font-semibold text-ink">{patient.fullName}</div>
                  <StatusBadge
                    label={outstandingBalance > 0 ? "تحتاج متابعة مالية" : "الملف مستقر"}
                    status={outstandingBalance > 0 ? "partially_paid" : "completed"}
                  />
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  هذا الملف يعطي الفريق صورة موحدة عن حالة المريض السريرية والمالية وآخر
                  الأحداث التي مر بها داخل العيادة.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
                <div className="font-semibold text-ink">الحدث الأحدث</div>
                <div className="mt-2">{nextJourneyItem?.title ?? "لا توجد أحداث ظاهرة بعد"}</div>
                <div className="mt-1 text-xs text-slate-500">{nextJourneyItem?.date ?? "—"}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">الهاتف</div>
                <div className="mt-2 font-semibold text-ink">{patient.phone}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">آخر زيارة</div>
                <div className="mt-2 font-semibold text-ink">{patient.lastVisit}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">الرصيد المستحق</div>
                <div className="mt-2 font-semibold text-ink">{patient.balance}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">البريد</div>
                <div className="mt-2 text-sm font-semibold text-ink">{patient.email}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">المدينة</div>
                <div className="mt-2 text-sm font-semibold text-ink">{patient.city}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">العنوان</div>
                <div className="mt-2 text-sm font-semibold text-ink">{patient.address}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5">
                <div className="text-sm font-semibold text-brand-900">تركيز سريري</div>
                <p className="mt-3 text-sm leading-7 text-brand-950">{careFocus}</p>
              </div>
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
                <div className="text-sm font-semibold text-amber-900">تركيز مالي</div>
                <p className="mt-3 text-sm leading-7 text-amber-950">{financialFocus}</p>
              </div>
            </div>
          </div>

          <div id="medical" className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-ink">التاريخ الطبي المختصر</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  ملخص سريع يساعد الطبيب والاستقبال على فهم الحالة قبل الزيارة أو أثناء
                  المتابعة.
                </p>
              </div>
              <StatusBadge
                label={patient.notes.length > 0 ? "ملاحظات متابعة" : "بدون تنبيهات"}
                status={patient.notes.length > 0 ? "approved" : "completed"}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700">
              {patient.medicalSummary}
            </div>

            <div className="mt-4 grid gap-3">
              {patient.notes.length > 0 ? (
                patient.notes.map((note) => (
                  <div
                    key={note}
                    className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-4 text-sm leading-7 text-brand-950"
                  >
                    {note}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  لا توجد ملاحظات إضافية مرتبطة بهذا الملف حاليًا.
                </div>
              )}
            </div>
          </div>

          <div id="records" className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-ink">السجلات الطبية الأخيرة</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  آخر الإجراءات والتشخيصات والمتابعات الظاهرة لهذا المريض.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ExportCsvButton
                  filename={`patient-${patient.id}-records`}
                  rows={recordRows}
                  label="تصدير السجلات"
                />
                <Link href="/dental-records" className="text-sm font-semibold text-brand-700">
                  فتح السجلات
                </Link>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {dentalRecords.length > 0 ? (
                dentalRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-ink">{record.appointmentDate}</div>
                        <div className="mt-1 text-sm text-slate-500">{record.dentistName}</div>
                      </div>
                      <StatusBadge label="سجل موثق" status="completed" />
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="text-sm leading-7 text-slate-700">
                        <span className="font-semibold text-ink">الشكوى:</span> {record.chiefComplaint}
                      </div>
                      <div className="text-sm leading-7 text-slate-700">
                        <span className="font-semibold text-ink">التشخيص:</span> {record.diagnosis}
                      </div>
                      <div className="text-sm leading-7 text-slate-700">
                        <span className="font-semibold text-ink">الإجراء:</span> {record.procedureDone}
                      </div>
                      <div className="text-sm leading-7 text-slate-700">
                        <span className="font-semibold text-ink">المتابعة:</span> {record.followUpNotes}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  لا توجد سجلات طبية موثقة لهذا المريض بعد.
                </div>
              )}
            </div>
          </div>

          <div id="finance" className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-ink">المالية والتحصيل</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  الفواتير الحديثة والمدفوعات المرتبطة بالمريض مع قراءة أسرع للتحصيل.
                </p>
              </div>
              <ExportCsvButton
                filename={`patient-${patient.id}-finance`}
                rows={financeRows}
                label="تصدير المالية"
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-semibold text-ink">آخر الفواتير</div>
                  <Link href="/invoices" className="text-sm font-semibold text-brand-700">
                    عرض الكل
                  </Link>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  {patient.recentInvoices.length > 0 ? (
                    patient.recentInvoices.map((invoice) => (
                      <Link
                        key={invoice.id}
                        href={`/invoices/${invoice.id}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50"
                      >
                        <div>
                          <div className="font-semibold text-ink">{invoice.id}</div>
                          <div className="text-xs text-slate-500">{invoice.issueDate ?? "—"}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>{invoice.total}</span>
                          <StatusBadge status={invoice.status} />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      لا توجد فواتير حديثة مسجلة لهذا المريض.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-semibold text-ink">المدفوعات الأخيرة</div>
                  <Link href="/payments" className="text-sm font-semibold text-brand-700">
                    فتح المدفوعات
                  </Link>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <div>
                          <div className="font-semibold text-ink">{payment.invoiceId}</div>
                          <div className="text-xs text-slate-500">
                            {payment.date} • {getPaymentMethodLabel(payment.method)}
                          </div>
                        </div>
                        <span>{payment.amount}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                      لا توجد مدفوعات مسجلة بعد.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div id="plan" className="panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-ink">الخطة العلاجية الحالية</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  ملخص تنفيذي للخطة النشطة والعناصر التالية التي ينتظرها الفريق.
                </p>
              </div>
              <Link href="/treatment-plans" className="text-sm font-semibold text-brand-700">
                فتح الخطط
              </Link>
            </div>

            {activePlan ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-ink">{activePlan.title}</div>
                    <StatusBadge status={activePlan.status} />
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    التكلفة التقديرية: {activePlan.estimatedTotalCost}
                  </div>
                  <div className="mt-4">
                    <ProgressMeter value={activePlan.progress} label="تقدم الخطة" />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      الجلسة القادمة: {activePlan.nextSession}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      العناصر المفتوحة: {formatMetricNumber(remainingPlanItems)}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-sm font-semibold text-ink">العناصر القادمة</div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    {activePlan.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                      >
                        <div>
                          <div className="font-semibold text-ink">
                            {item.serviceName} - السن {item.toothNumber}
                          </div>
                          <div className="text-xs text-slate-500">{item.estimatedCost}</div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                لا توجد خطة علاج نشطة لهذا المريض حاليًا.
              </div>
            )}
          </div>

          <div id="journey" className="panel p-2">
            <ActivityTimeline
              title="رحلة المريض"
              description="تسلسل موحد يجمع آخر الزيارات والسجلات والفواتير والمدفوعات والخطة العلاجية."
              entries={timeline}
              emptyTitle="لا توجد أحداث ظاهرة بعد"
              emptyDescription="ستظهر هنا تلقائيًا كل حركة تشغيلية أو سريرية مرتبطة بملف المريض."
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
