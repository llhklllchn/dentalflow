import Link from "next/link";

import { WorkflowGuide } from "@/lib/constants/workflow-guides";

type WorkflowGuidePanelProps = {
  guide: WorkflowGuide;
};

const toneStyles = {
  brand: "border-brand-100 bg-brand-50 text-brand-900",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-900",
  amber: "border-amber-100 bg-amber-50 text-amber-900",
  rose: "border-rose-100 bg-rose-50 text-rose-900",
  slate: "border-slate-200 bg-slate-50 text-slate-800"
} as const;

export function WorkflowGuidePanel({ guide }: WorkflowGuidePanelProps) {
  return (
    <section className="panel mt-6 p-6">
      <div className="grid gap-6 xl:grid-cols-[1.12fr,0.88fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Smart Flow
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              {guide.focusLabel}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-ink">{guide.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
            {guide.description}
          </p>

          <div className="mt-6 grid gap-3">
            {guide.steps.map((step, index) => (
              <div
                key={step}
                className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700"
              >
                <span className="mb-2 block text-xs font-semibold text-slate-500">
                  الخطوة {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-lg font-semibold text-ink">أفضل الخطوات التالية</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            تنقل ذكي مبني على الصفحة الحالية، حتى يعرف كل مستخدم أين يتحرك بعد ذلك.
          </p>

          <div className="mt-5 space-y-4">
            {guide.actions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:bg-brand-50/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      انتقال {index + 1}
                    </div>
                    <div className="mt-2 text-lg font-semibold text-ink">{action.label}</div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{action.description}</p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneStyles[action.tone]}`}
                  >
                    افتح
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
