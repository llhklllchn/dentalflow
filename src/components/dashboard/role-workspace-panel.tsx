import Link from "next/link";

import { RoleWorkspace } from "@/lib/constants/role-workspace";

type RoleWorkspacePanelProps = {
  firstName: string;
  roleLabel: string;
  workspace: RoleWorkspace;
};

const toneStyles = {
  brand: "bg-brand-100 text-brand-900",
  emerald: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
} as const;

export function RoleWorkspacePanel({
  firstName,
  roleLabel,
  workspace
}: RoleWorkspacePanelProps) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
      <section className="panel relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -left-8 top-0 h-32 w-32 rounded-full bg-brand-100/90 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-amber-100/80 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Guided Workspace
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              {workspace.focusLabel}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-ink md:text-[2rem]">
            مرحبًا {firstName}، {workspace.heading}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
            {workspace.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              الدور الحالي: {roleLabel}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              {workspace.topbarFocus}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {workspace.journeySteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">
                    خطوة {index + 1}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${toneStyles[step.tone]}`}
                  >
                    مسار واضح
                  </span>
                </div>
                <div className="mt-3 text-lg font-semibold text-ink">{step.title}</div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
                <Link
                  href={step.href}
                  className="mt-4 inline-flex rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800"
                >
                  {step.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <div className="text-xl font-semibold text-ink">أسهل اختصارات هذا الدور</div>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          هذه المسارات تجعل الاستخدام أوضح من أول يوم، وتقلل الوقت الضائع في البحث عن الخطوة
          التالية.
        </p>

        <div className="mt-5 rounded-[1.5rem] border border-brand-100 bg-brand-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            بحث ذكي لهذا الدور
          </div>
          <div className="mt-2 text-sm leading-7 text-brand-900">{workspace.searchPlaceholder}</div>
        </div>

        <div className="mt-5 space-y-3">
          {workspace.shortcuts.map((shortcut, index) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="block rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-300 hover:bg-brand-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    اختصار {index + 1}
                  </div>
                  <div className="mt-1 font-semibold text-ink">{shortcut.label}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{shortcut.description}</p>
                </div>
                <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                  افتح
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {workspace.helperPoints.map((point) => (
            <div
              key={point}
              className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700"
            >
              {point}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
