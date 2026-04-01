import Link from "next/link";

import { FormGuide } from "@/lib/constants/form-guides";

type FormGuidePanelProps = {
  guide: FormGuide;
};

const toneStyles = {
  brand: "border-brand-100 bg-brand-50 text-brand-900",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-900",
  amber: "border-amber-100 bg-amber-50 text-amber-900",
  slate: "border-slate-200 bg-slate-50 text-slate-800"
} as const;

export function FormGuidePanel({ guide }: FormGuidePanelProps) {
  return (
    <section className="panel mt-6 p-6">
      <div className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              Form Assistant
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
              {guide.readinessLabel}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold text-ink">{guide.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
            {guide.description}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-ink">ابدأ من هنا</div>
              <div className="mt-4 space-y-3">
                {guide.firstSteps.map((step, index) => (
                  <div key={step} className="text-sm leading-7 text-slate-700">
                    <span className="me-2 text-xs font-semibold text-slate-500">
                      {index + 1}.
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5">
              <div className="text-sm font-semibold text-brand-900">قبل الحفظ</div>
              <div className="mt-4 space-y-3">
                {guide.beforeSave.map((step, index) => (
                  <div key={step} className="text-sm leading-7 text-slate-700">
                    <span className="me-2 text-xs font-semibold text-brand-700">
                      {index + 1}.
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-lg font-semibold text-ink">بعد الحفظ مباشرة</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            حتى لا يتوقف المستخدم بعد الحفظ، هذه أفضل الانتقالات التالية من نفس المسار.
          </p>

          <div className="mt-5 space-y-4">
            {guide.afterSaveActions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:bg-brand-50/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      الخطوة التالية {index + 1}
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
