import Link from "next/link";
import { redirect } from "next/navigation";

import { ActionLinkStrip } from "@/components/shared/action-link-strip";
import { CollectionEmptyState } from "@/components/shared/collection-empty-state";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { QuickFilterStrip } from "@/components/shared/quick-filter-strip";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkflowGuidePanel } from "@/components/shared/workflow-guide-panel";
import { updateAppointmentStatus } from "@/features/appointments/actions/update-appointment-status";
import {
  AppointmentsBoardItem,
  getAppointmentsBoard
} from "@/features/appointments/queries/get-appointments-board";
import { requirePermission } from "@/lib/auth/guards";
import { getWorkflowGuide } from "@/lib/constants/workflow-guides";
import { getAppointmentStatusOptions } from "@/lib/domain/labels";
import { normalizeAppointmentView } from "@/lib/filters/list-presets";
import {
  buildDentalRecordCreatePath,
  buildInvoiceCreatePath,
  buildQueryPath,
  buildTreatmentPlanCreatePath
} from "@/lib/navigation/create-flow";
import { hasPermission } from "@/lib/permissions/permissions";
import { formatMetricNumber } from "@/lib/utils/formatted-value";
import { AppointmentStatus } from "@/types/domain";

type AppointmentsPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: AppointmentStatus | "all";
    view?: string;
    error?: string;
    success?: string;
  }>;
};

function getStatusActions(status: AppointmentStatus) {
  const actions: Array<{
    label: string;
    nextStatus: AppointmentStatus;
    tone?: "default" | "danger";
  }> = [];

  if (status === "scheduled") {
    actions.push({ label: "تأكيد", nextStatus: "confirmed" });
    actions.push({ label: "إلغاء", nextStatus: "cancelled", tone: "danger" });
    actions.push({ label: "لم يحضر", nextStatus: "no_show", tone: "danger" });
  }

  if (status === "confirmed") {
    actions.push({ label: "تسجيل حضور", nextStatus: "checked_in" });
    actions.push({ label: "إلغاء", nextStatus: "cancelled", tone: "danger" });
    actions.push({ label: "لم يحضر", nextStatus: "no_show", tone: "danger" });
  }

  if (status === "checked_in") {
    actions.push({ label: "بدء الجلسة", nextStatus: "in_progress" });
    actions.push({ label: "إلغاء", nextStatus: "cancelled", tone: "danger" });
  }

  if (status === "in_progress") {
    actions.push({ label: "إنهاء الموعد", nextStatus: "completed" });
  }

  if (status === "no_show") {
    actions.push({ label: "إعادة كموعد مؤكد", nextStatus: "confirmed" });
  }

  return actions;
}

function getAppointmentCardTone(status: AppointmentStatus) {
  const styles: Record<AppointmentStatus, string> = {
    scheduled: "border-sky-200 bg-sky-50/50",
    confirmed: "border-cyan-200 bg-cyan-50/40",
    checked_in: "border-amber-200 bg-amber-50/40",
    in_progress: "border-indigo-200 bg-indigo-50/40",
    completed: "border-emerald-200 bg-emerald-50/40",
    cancelled: "border-slate-200 bg-slate-50",
    no_show: "border-rose-200 bg-rose-50/40"
  };

  return styles[status];
}

export default async function AppointmentsPage({
  searchParams
}: AppointmentsPageProps) {
  const resolvedSearchParams = await searchParams;
  const appointmentStatuses = getAppointmentStatusOptions();
  const statusLabelMap = Object.fromEntries(
    appointmentStatuses.map((option) => [option.value, option.label])
  ) as Partial<Record<AppointmentStatus, string>>;
  const user = await requirePermission("appointments:view");
  const canManageAppointments = hasPermission(user.role, "appointments:*");
  const canUpdateStatuses =
    canManageAppointments || hasPermission(user.role, "appointments:update-status");
  const canCreateInvoices = hasPermission(user.role, "invoices:*");
  const canCreateRecords = hasPermission(user.role, "dental-records:*");
  const canCreatePlans = hasPermission(user.role, "treatment-plans:*");
  const workflowGuide = getWorkflowGuide("appointments", user.role);

  const search = resolvedSearchParams?.search?.trim();
  const status = resolvedSearchParams?.status ?? "all";
  const view = normalizeAppointmentView(resolvedSearchParams?.view?.trim().toLowerCase());
  const hasFilters = Boolean(search || status !== "all" || view !== "all");
  const appointments: AppointmentsBoardItem[] = await getAppointmentsBoard({
    search,
    status,
    view
  });

  const confirmedOrCheckedIn = appointments.filter((appointment) =>
    ["confirmed", "checked_in"].includes(appointment.status)
  ).length;
  const activeSessions = appointments.filter(
    (appointment) => appointment.status === "in_progress"
  ).length;
  const followUpNeeded = appointments.filter((appointment) =>
    ["scheduled", "no_show"].includes(appointment.status)
  ).length;
  const appointmentExportRows = appointments.map((appointment) => ({
    المريض: appointment.patient,
    الطبيب: appointment.dentist,
    الخدمة: appointment.service,
    الوقت: appointment.time,
    الحالة: statusLabelMap[appointment.status] ?? appointment.status
  }));
  const quickFilterItems = [
    {
      label: "كل المواعيد",
      href: buildQueryPath("/appointments", {
        search,
        status: status !== "all" ? status : undefined
      }),
      active: view === "all"
    },
    {
      label: "جاهزة للاستقبال",
      href: buildQueryPath("/appointments", {
        search,
        view: "ready"
      }),
      active: view === "ready"
    },
    {
      label: "قيد التنفيذ",
      href: buildQueryPath("/appointments", {
        search,
        view: "active"
      }),
      active: view === "active"
    },
    {
      label: "تحتاج متابعة",
      href: buildQueryPath("/appointments", {
        search,
        view: "follow_up"
      }),
      active: view === "follow_up"
    },
    {
      label: "مكتملة",
      href: buildQueryPath("/appointments", {
        search,
        view: "completed"
      }),
      active: view === "completed"
    }
  ];

  function getAppointmentActionItems(appointment: AppointmentsBoardItem) {
    return [
      canCreateRecords
        ? {
            href: buildDentalRecordCreatePath({
              patientId: appointment.patientId,
              dentistId: appointment.dentistId,
              appointmentDate: appointment.appointmentDate
            }),
            label: "سجل طبي",
            tone: "brand" as const
          }
        : null,
      canCreateInvoices
        ? {
            href: buildInvoiceCreatePath({
              patientId: appointment.patientId,
              serviceName: appointment.service
            }),
            label: "فاتورة"
          }
        : null,
      canCreatePlans
        ? {
            href: buildTreatmentPlanCreatePath({
              patientId: appointment.patientId,
              dentistId: appointment.dentistId,
              serviceName: appointment.service
            }),
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

  async function submitStatusChange(formData: FormData) {
    "use server";

    const appointmentId = String(formData.get("appointmentId") ?? "");
    const nextStatus = String(formData.get("nextStatus") ?? "") as AppointmentStatus;
    const currentSearch = String(formData.get("search") ?? "");
    const currentStatus = String(formData.get("status") ?? "all");
    const currentView = String(formData.get("view") ?? "all");

    const result = await updateAppointmentStatus(appointmentId, nextStatus);
    const query = new URLSearchParams();

    if (currentSearch) {
      query.set("search", currentSearch);
    }

    if (currentStatus) {
      query.set("status", currentStatus);
    }

    if (currentView && currentView !== "all") {
      query.set("view", currentView);
    }

    if (!result.ok) {
      query.set("error", result.message ?? "تعذر تحديث حالة الموعد.");
      redirect(`/appointments?${query.toString()}`);
    }

    query.set("success", result.message ?? "تم تحديث حالة الموعد بنجاح.");
    redirect(`/appointments?${query.toString()}`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Appointments"
        title="المواعيد"
        description="واجهة تشغيل يومية أكثر احترافية لجدولة المواعيد ومتابعة الحالات وطباعة القائمة أو تصديرها ومراجعة الجلسات الجاهزة من نفس الشاشة."
        tips={["فلترة حسب الحالة", "تصدير سريع", "إجراءات مباشرة من البطاقة"]}
        actions={
          <>
            <ExportCsvButton
              filename="dentflow-appointments.csv"
              rows={appointmentExportRows}
              className="print:hidden"
            />
            <PrintButton label="طباعة الجدول" className="print:hidden" />
            {canManageAppointments ? (
              <Link
                href="/appointments/new"
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white print:hidden"
              >
                إنشاء موعد
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
          label="المواعيد الظاهرة"
          value={formatMetricNumber(appointments.length)}
          hint="النتائج الحالية وفق البحث أو الحالة المحددة."
        />
        <StatCard
          label="جاهزة للاستقبال"
          value={formatMetricNumber(confirmedOrCheckedIn)}
          hint="مواعيد مؤكدة أو تم تسجيل حضورها."
        />
        <StatCard
          label="جلسات قيد التنفيذ"
          value={formatMetricNumber(activeSessions)}
          hint="المواعيد التي يجري العمل عليها الآن."
        />
        <StatCard
          label="تحتاج متابعة"
          value={formatMetricNumber(followUpNeeded)}
          hint="مواعيد غير مؤكدة أو حالات عدم حضور."
        />
      </div>

      <div className="panel mt-6 p-6">
        <QuickFilterStrip
          title="حالات جاهزة بنقرة واحدة"
          description="بدل تغيير الفلاتر يدويًا كل مرة، افتح مباشرة المواعيد الجاهزة أو التي تحتاج متابعة أو الجلسات النشطة الآن."
          items={quickFilterItems}
        />

        <form
          method="get"
          className="mb-6 grid gap-3 print:hidden md:grid-cols-[1fr,220px,160px,140px]"
        >
          <input type="hidden" name="view" value={view === "all" ? "" : view} />
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="ابحث بالمريض أو الطبيب أو الخدمة"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <option value="all">كل الحالات</option>
            {appointmentStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800"
          >
            تطبيق
          </button>
          <Link
            href="/appointments"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
          >
            مسح
          </Link>
        </form>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>
            {appointments.length} {appointments.length === 1 ? "موعد مطابق" : "مواعيد مطابقة"}
          </span>
          <span>يمكنك الطباعة أو التصدير أو فتح ملف المريض أو تحديث الحالة من نفس الصفحة.</span>
        </div>

        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const statusActions = getStatusActions(appointment.status);

              return (
                <div
                  key={appointment.id}
                  className={`rounded-[1.75rem] border p-5 ${getAppointmentCardTone(
                    appointment.status
                  )}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-semibold text-ink">{appointment.patient}</div>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {appointment.time}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                          الطبيب: {appointment.dentist}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                          الخدمة: {appointment.service}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-sm print:hidden">
                    <Link
                      href={`/patients/${appointment.patientId}`}
                      className="rounded-full border border-brand-200 bg-white px-4 py-2 font-semibold text-brand-700"
                    >
                      فتح ملف المريض
                    </Link>

                    {canManageAppointments ? (
                      <Link
                        href={`/appointments/${appointment.id}/edit`}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
                      >
                        تعديل / إعادة جدولة
                      </Link>
                    ) : null}

                    {canUpdateStatuses
                      ? statusActions.map((action) => (
                          <form
                            key={`${appointment.id}-${action.nextStatus}`}
                            action={submitStatusChange}
                          >
                            <input type="hidden" name="appointmentId" value={appointment.id} />
                            <input type="hidden" name="nextStatus" value={action.nextStatus} />
                            <input type="hidden" name="search" value={search ?? ""} />
                            <input type="hidden" name="status" value={status} />
                            <input type="hidden" name="view" value={view} />
                            <button
                              type="submit"
                              className={
                                action.tone === "danger"
                                  ? "rounded-full border border-rose-200 bg-white px-4 py-2 font-semibold text-rose-700"
                                  : "rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700"
                              }
                            >
                              {action.label}
                            </button>
                          </form>
                        ))
                      : null}
                  </div>

                  <ActionLinkStrip items={getAppointmentActionItems(appointment)} />
                </div>
              );
            })}
          </div>
        ) : (
          <CollectionEmptyState
            title={hasFilters ? "لا توجد مواعيد مطابقة" : "لا توجد مواعيد بعد"}
            description={
              hasFilters
                ? "غيّر الحالة أو عبارة البحث الحالية، أو امسح الفلاتر للعودة إلى كامل الجدول."
                : "ابدأ بجدولة أول موعد حتى يصبح عندك مسار تشغيلي واضح للاستقبال والطبيب."
            }
            primaryAction={
              canManageAppointments
                ? {
                    href: "/appointments/new",
                    label: "حجز موعد جديد"
                  }
                : undefined
            }
            secondaryAction={
              hasFilters
                ? {
                    href: "/appointments",
                    label: "مسح الفلاتر"
                  }
                : undefined
            }
            highlights={["جدولة أسرع", "حالات واضحة", "تحديث مباشر للحالة"]}
          />
        )}
      </div>
    </div>
  );
}
