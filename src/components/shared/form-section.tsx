import { ReactNode } from "react";

type FormSectionProps = {
  id?: string;
  title: string;
  description?: string;
  badgeLabel?: string;
  children: ReactNode;
};

export function FormSection({
  id,
  title,
  description,
  badgeLabel,
  children
}: FormSectionProps) {
  return (
    <section id={id} className="panel scroll-mt-28 p-6">
      <div className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {badgeLabel ? (
            <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
              {badgeLabel}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
