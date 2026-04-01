import Link from "next/link";
import { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import { StatusBadge } from "./status-badge";

type ActivityTone = "brand" | "emerald" | "amber" | "slate";

export type ActivityTimelineEntry = {
  id: string;
  date: string;
  title: string;
  description: string;
  status?: ComponentProps<typeof StatusBadge>["status"];
  badgeLabel?: string;
  href?: string;
  hrefLabel?: string;
  tone?: ActivityTone;
};

type ActivityTimelineProps = {
  title?: string;
  description?: string;
  entries: ActivityTimelineEntry[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

const toneStyles: Record<ActivityTone, string> = {
  brand: "bg-brand-500 ring-brand-100",
  emerald: "bg-emerald-500 ring-emerald-100",
  amber: "bg-amber-500 ring-amber-100",
  slate: "bg-slate-400 ring-slate-100"
};

export function ActivityTimeline({
  title,
  description,
  entries,
  emptyTitle = "لا توجد أحداث ظاهرة بعد",
  emptyDescription = "ستظهر هنا آخر التحديثات والزيارات والتحصيلات المرتبطة بهذا الملف.",
  className
}: ActivityTimelineProps) {
  return (
    <section className={cn("rounded-[1.75rem] border border-slate-200 bg-white p-6", className)}>
      {title ? <div className="text-lg font-semibold text-ink">{title}</div> : null}
      {description ? (
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      ) : null}

      {entries.length > 0 ? (
        <div className="mt-6 space-y-5">
          {entries.map((entry, index) => (
            <article key={entry.id} className="relative pr-7">
              {index < entries.length - 1 ? (
                <div className="absolute right-[0.8rem] top-7 h-[calc(100%+1.5rem)] w-px bg-slate-200" />
              ) : null}

              <div
                className={cn(
                  "absolute right-0 top-1.5 h-4 w-4 rounded-full ring-4",
                  toneStyles[entry.tone ?? "brand"]
                )}
              />

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{entry.title}</div>
                    <div className="mt-1 text-xs font-medium text-slate-500">{entry.date}</div>
                  </div>
                  {entry.status ? (
                    <StatusBadge label={entry.badgeLabel} status={entry.status} />
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-7 text-slate-700">{entry.description}</p>

                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="mt-3 inline-flex text-sm font-semibold text-brand-700"
                  >
                    {entry.hrefLabel ?? "فتح التفاصيل"}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8">
          <div className="text-base font-semibold text-ink">{emptyTitle}</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">{emptyDescription}</p>
        </div>
      )}
    </section>
  );
}
