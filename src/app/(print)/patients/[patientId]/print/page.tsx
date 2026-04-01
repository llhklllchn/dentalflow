import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { PrintButton } from "@/components/shared/print-button";
import { ProgressMeter } from "@/components/shared/progress-meter";
import { StatusBadge } from "@/components/shared/status-badge";
import { getPatientWorkspace } from "@/features/patients/queries/get-patient-workspace";
import { requirePermission } from "@/lib/auth/guards";
import { getClinicContext } from "@/lib/tenant/clinic-context";

type PatientPrintPageProps = {
  params: Promise<{
    patientId: string;
  }>;
};

export default async function PatientPrintPage({ params }: PatientPrintPageProps) {
  await requirePermission("patients:view");
  const { patientId } = await params;

  const [workspace, clinic] = await Promise.all([
    getPatientWorkspace(patientId),
    getClinicContext()
  ]);

  if (!workspace) {
    notFound();
  }

  const { patient, dentalRecords, treatmentPlans, payments, timeline } = workspace;
  const activePlan = treatmentPlans[0];

  return (
    <main className="min-h-screen bg-[#f4efe7] px-4 py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 shadow-panel print:rounded-none print:shadow-none">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4 print:hidden">
          <Link
            href={`/patients/${patientId}`}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            العودة إلى الملف
          </Link>
          <PrintButton label="طباعة / حفظ PDF" />
        </div>

        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                DentFlow
              </div>
              <h1 className="mt-2 text-3xl font-bold text-ink">ملخص ملف المريض</h1>
              <p className="mt-2 text-sm text-slate-500">{clinic.clinicName}</p>
              <p className="mt-1 text-sm text-slate-500">
                العملة: {clinic.currency} | المنطقة الزمنية: {clinic.timezone}
              </p>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div>اسم المريض: {patient.fullName}</div>
              <div>الهاتف: {patient.phone}</div>
              <div>آخر زيارة: {patient.lastVisit}</div>
              <div>الرصيد المفتوح: {patient.balance}</div>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">المدينة</div>
            <div className="mt-3 text-lg font-bold text-ink">{patient.city}</div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">البريد</div>
            <div className="mt-3 text-lg font-bold text-ink">{patient.email}</div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">السجلات</div>
            <div className="mt-3 text-lg font-bold text-ink">{dentalRecords.length}</div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">المدفوعات</div>
            <div className="mt-3 text-lg font-bold text-ink">{payments.length}</div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-[1fr,20rem]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-slate-500">التاريخ الطبي المختصر</div>
            <div className="mt-3 text-sm leading-7 text-slate-700">{patient.medicalSummary}</div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                طبيب المتابعة: {patient.dentistName}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                العنوان: {patient.address}
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5 text-sm leading-7 text-brand-900">
            هذه النسخة مهيأة للطباعة أو الحفظ كملف PDF وتجمع آخر المؤشرات السريرية
            والمالية وخطوات المتابعة في تنسيق واضح للأرشفة أو العرض السريع.
          </div>
        </section>

        {activePlan ? (
          <section className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-ink">{activePlan.title}</div>
                <div className="mt-1 text-sm text-slate-500">
                  التكلفة التقديرية: {activePlan.estimatedTotalCost}
                </div>
              </div>
              <StatusBadge status={activePlan.status} />
            </div>

            <div className="mt-4">
              <ProgressMeter value={activePlan.progress} label="تقدم الخطة العلاجية" />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {activePlan.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-ink">
                      {item.serviceName} - السن {item.toothNumber}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{item.estimatedCost}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="text-lg font-semibold text-ink">آخر السجلات الطبية</div>
            <div className="mt-4 space-y-3">
              {dentalRecords.length > 0 ? (
                dentalRecords.slice(0, 4).map((record) => (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="font-semibold text-ink">{record.appointmentDate}</div>
                    <div className="mt-1 text-sm text-slate-500">{record.dentistName}</div>
                    <div className="mt-3 text-sm leading-7 text-slate-700">
                      {record.diagnosis} - {record.procedureDone}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  لا توجد سجلات طبية موثقة بعد.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="text-lg font-semibold text-ink">ملخص مالي</div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>الفواتير الحديثة</span>
                <span>{patient.recentInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>الدفعات المسجلة</span>
                <span>{payments.length}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold text-ink">
                <span>الرصيد المفتوح</span>
                <span>{patient.balance}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <ActivityTimeline
            title="رحلة المريض"
            description="تسلسل مختصر لأحدث الأحداث السريرية والتشغيلية والمالية المرتبطة بهذا الملف."
            entries={timeline.slice(0, 8)}
            className="border-slate-200"
          />
        </section>
      </div>
    </main>
  );
}
