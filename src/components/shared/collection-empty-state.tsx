import Link from "next/link";

type CollectionEmptyStateProps = {
  title: string;
  description: string;
  primaryAction?: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
  highlights?: string[];
};

export function CollectionEmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
  highlights = []
}: CollectionEmptyStateProps) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-sm font-bold text-brand-800">
        DF
      </div>

      <h2 className="mt-5 text-2xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-8 text-slate-600">{description}</p>

      {highlights.length > 0 ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {highlights.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              {highlight}
            </span>
          ))}
        </div>
      ) : null}

      {primaryAction || secondaryAction ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {primaryAction ? (
            <Link
              href={primaryAction.href}
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              {primaryAction.label}
            </Link>
          ) : null}

          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
