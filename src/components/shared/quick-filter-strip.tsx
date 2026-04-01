import Link from "next/link";

type QuickFilterItem = {
  label: string;
  href: string;
  active?: boolean;
  hint?: string;
};

type QuickFilterStripProps = {
  title: string;
  description?: string;
  items: QuickFilterItem[];
};

export function QuickFilterStrip({
  title,
  description,
  items
}: QuickFilterStripProps) {
  return (
    <section className="mb-5 rounded-[1.75rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink">{title}</div>
          {description ? (
            <p className="mt-1 text-sm leading-7 text-slate-600">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.hint}
            className={
              item.active
                ? "rounded-full border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-800"
            }
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
