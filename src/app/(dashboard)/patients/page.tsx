import Link from "next/link";
import { redirect } from "next/navigation";

import { ActionLinkStrip } from "@/components/shared/action-link-strip";
import { CollectionEmptyState } from "@/components/shared/collection-empty-state";
import { ContactActions } from "@/components/shared/contact-actions";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { QuickFilterStrip } from "@/components/shared/quick-filter-strip";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkflowGuidePanel } from "@/components/shared/workflow-guide-panel";
import { archivePatient } from "@/features/patients/actions/archive-patient";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/permissions/permissions";
import { getWorkflowGuide } from "@/lib/constants/workflow-guides";
import { normalizePatientSegment } from "@/lib/filters/list-presets";
import {
  buildAppointmentCreatePath,
  buildDentalRecordCreatePath,
  buildInvoiceCreatePath,
  buildQueryPath,
  buildTreatmentPlanCreatePath
} from "@/lib/navigation/create-flow";
import {
  extractFormattedAmount,
  formatMetricNumber,
  hasDisplayDate
} from "@/lib/utils/formatted-value";

type PatientsPageProps = {
  searchParams?: Promise<{
    search?: string;
    segment?: string;
    error?: string;
    success?: string;
  }>;
};

function getPatientBalanceStatus(balance: string) {
  return extractFormattedAmount(balance) > 0
    ? {
        label: "رصيد مفتوح",
        status: "partially_paid" as const
      }
    : {
        label: "مغلق",
        status: "paid" as const
      };
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await requirePermission("patients:view");
  const canManagePatients = hasPermission(user.role, "patients:*");
  const canCreateAppointments = hasPermission(user.role, "appointments:*");
  const canCreateInvoices = hasPermission(user.role, "invoices:*");
  const canCreateRecords = hasPermission(user.role, "dental-records:*");
  const canCreatePlans = hasPermission(user.role, "treatment-plans:*");
  const workflowGuide = getWorkflowGuide("patients", user.role);

  const search = resolvedSearchParams?.search?.trim();
  const segment = normalizePatientSegment(resolvedSearchParams?.segment?.trim().toLowerCase());
  const hasFilters = Boolean(search || segment !== "all");
  const patients = await getPatientsList({
    search,
    segment
  });

  const totalOutstanding = patients.reduce(
    (sum, patient) => sum + extractFormattedAmount(patient.balance),
    0
  );
  const patientsWithBalance = patients.filter(
    (patient) => extractFormattedAmount(patient.balance) > 0
  ).length;
  const recentVisitors = patients.filter((patient) => hasDisplayDate(patient.lastVisit)).length;
  const patientExportRows = patients.map((patient) => ({
    الاسم: patient.fullName,
    الهاتف: patient.phone,
    الجنس: patient.gender,
    تاريخ_الميلاد: patient.dateOfBirth,
    آخر_زيارة: patient.lastVisit,
    الطبيب: patient.dentistName,
    الرصيد: patient.balance
  }));
  const quickFilterItems = [
    {
      label: "كل المرضى",
      href: buildQueryPath("/patients", {
        search
      }),
      active: segment === "all"
    },
    {
      label: "برصيد مفتوح",
      href: buildQueryPath("/patients", {
        search,
        segment: "open_balance"
      }),
      active: segment === "open_balance"
    },
    {
      label: "لديهم زيارة",
      href: buildQueryPath("/patients", {
        search,
        segment: "recent_visit"
      }),
      active: segment === "recent_visit"
    },
    {
      label: "بلا زيارة",
      href: buildQueryPath("/patients", {
        search,
        segment: "no_visit"
      }),
      active: segment === "no_visit"
    }
  ];

  function getPatientActionItems(patientId: string) {
    return [
      canCreateAppointments
        ? {
            href: buildAppointmentCreatePath({ patientId }),
            label: "موعد جديد",
            tone: "brand" as const
          }
        : null,
      canCreateInvoices
        ? {
            href: buildInvoiceCreatePath({ patientId }),
            label: "فاتورة جديدة"
          }
        : null,
      canCreateRecords
        ? {
            href: buildDentalRecordCreatePath({ patientId }),
            label: "سجل طبي"
          }
        : null,
      canCreatePlans
        ? {
            href: buildTreatmentPlanCreatePath({ patientId }),
            label: "خطة علاج",
            tone: "emerald" as const
          }
        : null
    ].filter(Boolean) as Array<{
      href: string;
      label: string;
      tone?: "default" | "brand" | "emerald";
    }>;
  }

  async function archivePatientFromList(formData: FormData) {
    "use server";

    const patientId = String(formData.get("patientId") ?? "");
    const result = await archivePatient(patientId);

    if (!result.ok) {
      redirect(
        `/patients?error=${encodeURIComponent(result.message ?? "تعذر أرشفة المريض.")}`
      );
    }

    redirect(
      `/patients?success=${encodeURIComponent(result.message ?? "تمت أرشفة المريض بنجاح.")}`
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Patients"
        title="المرضى"
        description="واجهة تشغيل أوضح لملفات المرضى، مع بحث سريع وتصدير منظم وطباعة مباشرة والوصول إلى الملف أو التعديل أو الأرشفة من نفس الشاشة."
        tips={["ابحث بالاسم أو الهاتف", "صدّر القائمة للمراجعة", "اطبع الشاشة عند الحاجة"]}
        actions={
          <>
            <ExportCsvButton
              filename="dentflow-patients.csv"
              rows={patientExportRows}
              className="print:hidden"
            />
            <PrintButton label="طباعة القائمة" className="print:hidden" />
            {canManagePatients ? (
              <Link
                href="/patients/new"
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white print:hidden"
              >
                إضافة مريض
              </Link>
            ) : null}
          </>
        }
      />

      {resolvedSearchParams?.error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      {resolvedSearchParams?.success ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {resolvedSearchParams.success}
        </div>
      ) : null}

      <WorkflowGuidePanel guide={workflowGuide} />

      <div className="grid-cards">
        <StatCard
          label="المرضى الظاهرون"
          value={formatMetricNumber(patients.length)}
          hint="إجمالي النتائج الحالية بعد تطبيق البحث."
        />
        <StatCard
          label="إجمالي الأرصدة"
          value={`${formatMetricNumber(totalOutstanding)} JOD`}
          hint="الرصيد المفتوح للملفات الظاهرة الآن."
        />
        <StatCard
          label="ملفات برصيد مفتوح"
          value={formatMetricNumber(patientsWithBalance)}
          hint="عدد المرضى الذين ما زالت لديهم مستحقات."
        />
        <StatCard
          label="مرضى بزيارة مسجلة"
          value={formatMetricNumber(recentVisitors)}
          hint="عدد الملفات التي تحتوي على آخر زيارة واضحة."
        />
      </div>

      <div className="panel mt-6 p-6">
        <QuickFilterStrip
          title="فلاتر جاهزة"
          description="انتقل مباشرة إلى المرضى الذين يحتاجون متابعة مالية أو لديهم زيارة سابقة أو ما زالوا بلا زيارة."
          items={quickFilterItems}
        />

        <form
          method="get"
          className="mb-5 grid gap-3 print:hidden md:grid-cols-[1fr,180px,160px]"
        >
          <input type="hidden" name="segment" value={segment === "all" ? "" : segment} />
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="ابحث بالاسم أو رقم الهاتف"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          />
          <button
            type="submit"
            className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800"
          >
            تطبيق البحث
          </button>
          <Link
            href="/patients"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
          >
            مسح الفلاتر
          </Link>
        </form>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>
            {patients.length} {patients.length === 1 ? "نتيجة ظاهرة" : "نتائج ظاهرة"} حاليًا
          </span>
          <span>يمكنك التصدير أو الطباعة أو فتح الملف مباشرة من نفس المساحة.</span>
        </div>

        {patients.length > 0 ? (
          <>
            <div className="space-y-4 md:hidden">
              {patients.map((patient) => {
                const balanceStatus = getPatientBalanceStatus(patient.balance);

                return (
                  <div
                    key={patient.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-ink">{patient.fullName}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {patient.phone} | {patient.dentistName}
                        </div>
                      </div>
                      <StatusBadge label={balanceStatus.label} status={balanceStatus.status} />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-xs font-semibold text-slate-400">آخر زيارة</div>
                        <div className="mt-1 text-sm font-semibold text-ink">
                          {patient.lastVisit}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="text-xs font-semibold text-slate-400">الرصيد</div>
                        <div className="mt-1 text-sm font-semibold text-ink">{patient.balance}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                      <Link href={`/patients/${patient.id}`} className="font-semibold text-brand-700">
                        عرض الملف
                      </Link>
                      {canManagePatients ? (
                        <Link
                          href={`/patients/${patient.id}/edit`}
                          className="font-semibold text-slate-700"
                        >
                          تعديل
                        </Link>
                      ) : null}
                      {canManagePatients ? (
                        <form action={archivePatientFromList}>
                          <input type="hidden" name="patientId" value={patient.id} />
                          <button type="submit" className="font-semibold text-rose-700">
                            أرشفة
                          </button>
                        </form>
                      ) : null}
                    </div>

                    <ActionLinkStrip items={getPatientActionItems(patient.id)} />
                    <ContactActions
                      phone={patient.phone}
                      message={`مرحبًا ${patient.fullName}، هذه رسالة من عيادتكم بخصوص المتابعة.`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-right text-sm">
                <thead className="text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-4 font-medium">المريض</th>
                    <th className="px-3 py-4 font-medium">الهاتف</th>
                    <th className="px-3 py-4 font-medium">آخر زيارة</th>
                    <th className="px-3 py-4 font-medium">الطبيب</th>
                    <th className="px-3 py-4 font-medium">الرصيد</th>
                    <th className="px-3 py-4 font-medium">الحالة</th>
                    <th className="px-3 py-4 font-medium print:hidden">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => {
                    const balanceStatus = getPatientBalanceStatus(patient.balance);

                    return (
                      <tr key={patient.id} className="border-b border-slate-100 align-top">
                        <td className="px-3 py-4">
                          <div className="font-semibold text-ink">{patient.fullName}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {patient.gender} | {patient.dateOfBirth}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-slate-600">{patient.phone}</td>
                        <td className="px-3 py-4 text-slate-600">{patient.lastVisit}</td>
                        <td className="px-3 py-4 text-slate-600">{patient.dentistName}</td>
                        <td className="px-3 py-4 text-slate-600">{patient.balance}</td>
                        <td className="px-3 py-4">
                          <StatusBadge label={balanceStatus.label} status={balanceStatus.status} />
                        </td>
                        <td className="px-3 py-4 print:hidden">
                          <div className="flex flex-wrap items-center gap-3">
                            <Link href={`/patients/${patient.id}`} className="font-semibold text-brand-700">
                              عرض الملف
                            </Link>
                            {canManagePatients ? (
                              <Link
                                href={`/patients/${patient.id}/edit`}
                                className="font-semibold text-slate-700"
                              >
                                تعديل
                              </Link>
                            ) : null}
                            {canManagePatients ? (
                              <form action={archivePatientFromList}>
                                <input type="hidden" name="patientId" value={patient.id} />
                                <button type="submit" className="font-semibold text-rose-700">
                                  أرشفة
                                </button>
                              </form>
                            ) : null}
                          </div>
                          <ActionLinkStrip items={getPatientActionItems(patient.id)} />
                          <ContactActions
                            phone={patient.phone}
                            message={`مرحبًا ${patient.fullName}، هذه رسالة من عيادتكم بخصوص المتابعة.`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <CollectionEmptyState
            title={hasFilters ? "لا توجد نتائج مطابقة" : "لا توجد ملفات مرضى بعد"}
            description={
              hasFilters
                ? "جرّب عبارة بحث أقصر أو امسح الفلاتر الحالية للعودة إلى القائمة الكاملة."
                : "ابدأ بإضافة أول مريض ليصبح عندك ملف قابل للمتابعة والحجز والفوترة من داخل النظام."
            }
            primaryAction={
              canManagePatients
                ? {
                    href: "/patients/new",
                    label: "إضافة مريض جديد"
                  }
                : undefined
            }
            secondaryAction={
              hasFilters
                ? {
                    href: "/patients",
                    label: "مسح الفلاتر"
                  }
                : undefined
            }
            highlights={["ملف طبي موحد", "بحث سريع", "ربط بالمواعيد والفواتير"]}
          />
        )}
      </div>
    </div>
  );
}
