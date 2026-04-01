import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getDentalRecordsOverview } from "@/features/dental-records/queries/get-dental-records-overview";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

const toothStatusLabel: Record<string, string> = {
  healthy: "سليم",
  decay: "تسوس",
  filling: "حشو",
  missing: "مفقود",
  root_canal: "علاج عصب",
  crown: "تاج",
  extracted: "مخلوع",
  implant: "زرعة",
  under_observation: "مراقبة"
};

const toothStatusStyle: Record<string, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
  decay: "border-rose-200 bg-rose-50 text-rose-800",
  filling: "border-sky-200 bg-sky-50 text-sky-800",
  missing: "border-slate-200 bg-slate-100 text-slate-700",
  root_canal: "border-violet-200 bg-violet-50 text-violet-800",
  crown: "border-amber-200 bg-amber-50 text-amber-800",
  extracted: "border-rose-200 bg-rose-50 text-rose-900",
  implant: "border-cyan-200 bg-cyan-50 text-cyan-800",
  under_observation: "border-orange-200 bg-orange-50 text-orange-800"
};

export default async function DentalRecordsPage() {
  const overview = await getDentalRecordsOverview();
  const recordsWithPrescription = overview.records.filter(
    (record) => record.prescription && record.prescription !== "—"
  ).length;
  const recordsNeedingFollowUp = overview.records.filter(
    (record) => record.followUpNotes && record.followUpNotes !== "—"
  ).length;
  const highlightedRecord = overview.records[0];
  const alertTeeth = overview.odontogram.filter((tooth) => tooth.status !== "healthy").length;
  const odontogramMetrics = [
    ...overview.metrics,
    {
      label: "سجلات بوصفة",
      value: formatMetricNumber(recordsWithPrescription),
      hint: "ضمن السجلات المعروضة حاليًا في هذه الصفحة."
    }
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Dental Records"
        title="السجلات الطبية"
        description="وحدة سريرية أوضح لقراءة الزيارات والتشخيصات والإجراءات مع نظرة أسرع على المتابعة والوصفات وحالة الأسنان المرتبطة بها."
        tips={["ابدأ بالسجل الأحدث", "راجع المتابعات المفتوحة", "افتح ملف المريض من نفس البطاقة"]}
        actions={
          <>
            <Link
              href="/patients"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              صفحة المرضى
            </Link>
            <Link
              href="/dental-records/new"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              سجل زيارة جديد
            </Link>
          </>
        }
      />

      <div className="grid-cards">
        {odontogramMetrics.map((metric) => (
          <StatCard key={metric.label} {...metric} badgeLabel="السجل الطبي" />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-ink">القراءة السريرية السريعة</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                هذه المساحة تلخص ما يحتاج تركيزًا أولًا: أحدث سجل، المتابعات المفتوحة، وحجم
                التوثيق الدوائي في السجلات الأخيرة.
              </p>
            </div>
            <StatusBadge label="السجل نشط" status="completed" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">آخر سجل</div>
              <div className="mt-4 text-xl font-bold text-ink">
                {highlightedRecord?.patientName ?? "لا توجد سجلات"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">
                {highlightedRecord
                  ? `${highlightedRecord.appointmentDate} مع ${highlightedRecord.dentistName}`
                  : "ستظهر هنا آخر زيارة موثقة عند توفر بيانات."}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">متابعات مفتوحة</div>
              <div className="mt-4 text-3xl font-bold text-ink">
                {formatMetricNumber(recordsNeedingFollowUp)}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">
                عدد السجلات التي ما زالت تحمل ملاحظات متابعة أو مراجعة لاحقة.
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">أسنان تحتاج انتباهًا</div>
              <div className="mt-4 text-3xl font-bold text-ink">
                {formatMetricNumber(alertTeeth)}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">
                حالات أسنان ليست &quot;سليمة&quot; ضمن أحدث مشهد من الـ odontogram.
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
            <div className="text-sm font-semibold text-brand-900">ملاحظات تشغيلية</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                كل سجل مكتمل يوفر للطبيب والاستقبال مرجعًا سريعًا قبل أي زيارة لاحقة.
              </div>
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                ارتفاع المتابعات المفتوحة يعني أن بعض الزيارات تحتاج ربطًا أوضح بخطة علاج أو
                موعد لاحق.
              </div>
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                توثيق الوصفة والملاحظات يسرع اتخاذ القرار عند عودة المريض أو تحويله بين الأطباء.
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-6">
            <h2 className="text-xl font-semibold text-ink">خريطة الأسنان</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              عرض سريع لحالات الأسنان الأكثر أهمية في آخر مراجعة مسجلة.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {overview.odontogram.map((tooth) => (
                <div
                  key={tooth.toothNumber}
                  className={`rounded-2xl border px-3 py-4 text-center ${toothStatusStyle[tooth.status]}`}
                >
                  <div className="text-xs font-semibold tracking-[0.2em]">{tooth.toothNumber}</div>
                  <div className="mt-2 text-sm font-semibold">{toothStatusLabel[tooth.status]}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="text-xl font-semibold text-ink">يحتاج متابعة</h2>
            <div className="mt-5 space-y-3">
              {overview.records
                .filter((record) => record.followUpNotes && record.followUpNotes !== "—")
                .slice(0, 3)
                .map((record) => (
                  <div
                    key={record.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="font-semibold text-ink">{record.patientName}</div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">{record.followUpNotes}</div>
                  </div>
                ))}

              {recordsNeedingFollowUp === 0 ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  لا توجد ملاحظات متابعة ضمن السجلات المعروضة حاليًا.
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      <div className="panel mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-ink">آخر السجلات السريرية</h2>
            <p className="mt-1 text-sm text-slate-500">
              توثيق الزيارات والإجراءات المنفذة مع الوصفة وملاحظات المتابعة في بطاقات أوضح.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            {overview.records.length} سجلًا
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {overview.records.map((record) => (
            <article
              key={record.id}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-ink">{record.patientName}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {record.appointmentDate} مع {record.dentistName}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {record.followUpNotes !== "—" ? (
                    <StatusBadge label="متابعة مطلوبة" status="pending" />
                  ) : null}
                  {record.prescription !== "—" ? (
                    <StatusBadge label="بوصفة" status="approved" />
                  ) : null}
                  <Link
                    href={`/patients/${record.patientId}`}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    ملف المريض
                  </Link>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">الشكوى</div>
                  <div className="mt-2 text-sm leading-7 text-slate-700">{record.chiefComplaint}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">التشخيص</div>
                  <div className="mt-2 text-sm leading-7 text-slate-700">{record.diagnosis}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">الإجراء</div>
                  <div className="mt-2 text-sm leading-7 text-slate-700">{record.procedureDone}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">الوصفة</div>
                  <div className="mt-2 text-sm leading-7 text-slate-700">{record.prescription}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2 xl:col-span-2">
                  <div className="text-xs font-semibold text-slate-500">المتابعة</div>
                  <div className="mt-2 text-sm leading-7 text-slate-700">{record.followUpNotes}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
