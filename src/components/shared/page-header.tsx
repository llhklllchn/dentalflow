import { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  tips?: string[];
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  tips
}: PageHeaderProps) {
  return (
    <div className="panel relative mb-6 overflow-hidden p-6 md:p-8">
      <div className="pointer-events-none absolute left-0 top-0 h-40 w-40 rounded-full bg-brand-100/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-amber-100/70 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <div className="mb-3 inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              {eyebrow}
            </div>
          ) : null}
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
            {description}
          </p>
          {tips?.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {tips.map((tip) => (
                <span
                  key={tip}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {tip}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
