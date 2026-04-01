import Link from "next/link";

import { CommandCenter } from "@/components/layout/command-center";
import { DemoModeBanner } from "@/components/layout/demo-mode-banner";
import { logoutAction } from "@/features/auth/actions/logout";
import { getSessionUser } from "@/lib/auth/session";
import { getVisibleNavigationItems, getVisibleQuickActions } from "@/lib/constants/navigation";
import { getRoleWorkspace } from "@/lib/constants/role-workspace";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { getRoleLabel } from "@/lib/domain/labels";
import { getClinicContext } from "@/lib/tenant/clinic-context";

function getInitials(firstName?: string, lastName?: string) {
  const first = firstName?.trim().charAt(0) ?? "";
  const last = lastName?.trim().charAt(0) ?? "";
  return `${first}${last}` || "DF";
}

function formatTodayLabel() {
  return new Intl.DateTimeFormat("ar-JO", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
}

export async function Topbar() {
  const [clinic, user] = await Promise.all([getClinicContext(), getSessionUser()]);
  const visibleNavigation = user ? getVisibleNavigationItems(user.role) : [];
  const visibleQuickActions = user ? getVisibleQuickActions(user.role) : [];
  const roleWorkspace =
    user ? getRoleWorkspace(user.role, visibleNavigation, visibleQuickActions) : null;
  const shortcutLinks = roleWorkspace?.shortcuts.slice(0, 3) ?? [];

  const todayLabel = formatTodayLabel();
  const userInitials = user ? getInitials(user.firstName, user.lastName) : "DF";
  const showDemoBanner = shouldUseDemoData();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#fcfbf8]/88 px-4 py-4 backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                اليوم
              </div>
              <div className="mt-1 font-semibold text-ink">{todayLabel}</div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                العيادة الحالية
              </div>
              <div className="mt-1 font-semibold text-ink">{clinic.clinicName}</div>
              <div className="mt-1 text-xs text-slate-500">
                {clinic.currency} | {clinic.timezone}
              </div>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                {userInitials}
              </div>
              <div>
                <div className="font-semibold text-ink">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-slate-500">{getRoleLabel(user.role)}</div>
              </div>
              <form action={logoutAction} className="ms-1">
                <button
                  type="submit"
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  تسجيل الخروج
                </button>
              </form>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex flex-1 flex-col gap-3 xl:flex-row">
            <form
              action="/search"
              className="flex flex-1 items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                بحث سريع
              </span>
              <input
                name="q"
                placeholder={roleWorkspace?.searchPlaceholder ?? "ابحث عن مريض أو موعد أو فاتورة..."}
                className="w-full bg-transparent text-sm text-slate-600 outline-none"
              />
              <button
                type="submit"
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                ابحث
              </button>
            </form>

            <CommandCenter
              clinicName={clinic.clinicName}
              navigationItems={visibleNavigation}
              quickActions={visibleQuickActions}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {roleWorkspace ? (
              <span className="rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-xs font-semibold text-white">
                {roleWorkspace.topbarFocus}
              </span>
            ) : null}
            {shortcutLinks.length > 0 ? (
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                مسارات سريعة
              </span>
            ) : null}
            {shortcutLinks.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                title={action.description}
                className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-100"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {showDemoBanner ? <DemoModeBanner clinicName={clinic.clinicName} /> : null}
      </div>
    </header>
  );
}
