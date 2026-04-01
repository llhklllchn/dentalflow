import Link from "next/link";

import { RoleWorkspacePanel } from "@/components/dashboard/role-workspace-panel";
import { PageHeader } from "@/components/shared/page-header";
import { SignalCard } from "@/components/shared/signal-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getDashboardOverview } from "@/features/reports/queries/get-dashboard-overview";
import { requireSession } from "@/lib/auth/guards";
import { getVisibleNavigationItems, getVisibleQuickActions } from "@/lib/constants/navigation";
import { getRoleWorkspace } from "@/lib/constants/role-workspace";
import { getRoleLabel } from "@/lib/domain/labels";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

function getHeaderLinks(
  quickActions: Array<{ href: string; label: string; description: string }>,
  shortcuts: Array<{ href: string; label: string; description: string }>
) {
  const seen = new Set<string>();
  const combined = [...quickActions, ...shortcuts];

  return combined.filter((item) => {
    if (seen.has(item.href)) {
      return false;
    }

    seen.add(item.href);
    return true;
  });
}

export default async function DashboardPage() {
  const [overview, user] = await Promise.all([getDashboardOverview(), requireSession()]);

  const visibleNavigation = getVisibleNavigationItems(user.role);
  const visibleQuickActions = getVisibleQuickActions(user.role);
  const roleWorkspace = getRoleWorkspace(user.role, visibleNavigation, visibleQuickActions);
  const roleLabel = getRoleLabel(user.role);
  const headerLinks = getHeaderLinks(visibleQuickActions, roleWorkspace.shortcuts).slice(0, 2);

  const activeAppointments = overview.upcomingAppointments.filter((appointment) =>
    ["confirmed", "checked_in", "in_progress"].includes(appointment.status)
  ).length;
  const scheduledOnly = overview.upcomingAppointments.filter(
    (appointment) => appointment.status === "scheduled"
  ).length;
  const alertCount = overview.alerts.length;

  const startDayChecklist = [
    `ابدأ من ${formatMetricNumber(activeAppointments)} مواعيد دخلت مسار التنفيذ أو التأكيد.`,
    `تابع ${formatMetricNumber(scheduledOnly)} مواعيد ما تزال تحتاج تثبيتًا أو تواصلًا.`,
    `أغلق ${formatMetricNumber(alertCount)} تنبيهات تشغيلية قبل نهاية اليوم.`
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Clinic Control"
        title="لوحة التحكم"
        description={`مركز قيادة يومي مصمم لـ ${roleLabel} داخل العيادة، يجمع الإشارات السريعة والأولويات والتنقل الذكي في بداية اليوم.`}
        tips={[roleWorkspace.focusLabel, roleWorkspace.topbarFocus, "ابدأ من المسار المقترح"]}
        actions={
          <>
            {headerLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                title={link.description}
                className={
                  index === 0
                    ? "rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
                    : "rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
                }
              >
                {link.label}
              </Link>
            ))}
          </>
        }
      />

      <RoleWorkspacePanel
        firstName={user.firstName}
        roleLabel={roleLabel}
        workspace={roleWorkspace}
      />

      <div className="mt-6 grid-cards">
        {overview.stats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink">نبض التشغيل</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                قراءة تنفيذية سريعة تلخص وضع الجلسات والتحصيل والمتابعة قبل الدخول في
                التفاصيل.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              تحديث حي لليوم الحالي
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {overview.executiveSignals.map((signal) => (
              <SignalCard
                key={signal.label}
                label={signal.label}
                value={signal.value}
                description={signal.description}
                tone={signal.tone}
              />
            ))}
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
            <div className="text-sm font-semibold text-brand-900">خطة تشغيل سريعة</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {startDayChecklist.map((item, index) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700"
                >
                  <div className="mb-2 text-xs font-semibold text-brand-700">
                    خطوة {index + 1}
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">طابور الأولويات</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                أهم ثلاث حركات تشغيلية تستحق التنفيذ الآن.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {overview.actionPrompts.map((prompt, index) => (
              <div
                key={prompt.title}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      أولوية {index + 1}
                    </div>
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
                    الآن
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr,0.9fr]">
        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">أقرب المواعيد</h2>
              <p className="mt-1 text-sm text-slate-500">
                الجلسات القريبة لهذا اليوم مع الحالة الحالية
              </p>
            </div>
            <Link href="/appointments" className="text-sm font-semibold text-brand-700">
              عرض الكل
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {overview.upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{appointment.patientName}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                        {appointment.time}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                        {appointment.dentistName}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-xl font-semibold text-ink">تنبيهات سريعة</h2>
          <div className="mt-5 space-y-3">
            {overview.alerts.map((alert, index) => (
              <div
                key={alert}
                className="rounded-[1.5rem] border border-brand-100 bg-brand-50 px-4 py-4 text-sm leading-7 text-brand-900"
              >
                <div className="mb-2 text-xs font-semibold text-brand-700">
                  تنبيه {index + 1}
                </div>
                {alert}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
