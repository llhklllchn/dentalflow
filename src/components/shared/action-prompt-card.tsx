import Link from "next/link";

import { cn } from "@/lib/utils/cn";

type ActionPromptTone = "brand" | "emerald" | "amber" | "rose" | "slate";

type ActionPromptCardProps = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone?: ActionPromptTone | string;
  index?: number;
  className?: string;
};

const toneStyles: Record<ActionPromptTone, string> = {
  brand: "bg-brand-100 text-brand-900",
  emerald: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-800",
  slate: "bg-slate-100 text-slate-700"
};

export function ActionPromptCard({
  title,
  description,
  href,
  cta,
  tone = "brand",
  index,
  className
}: ActionPromptCardProps) {
  const normalizedTone = tone in toneStyles ? (tone as ActionPromptTone) : "brand";

  return (
    <div className={cn("rounded-[1.5rem] border border-slate-200 bg-white p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {typeof index === "number" ? (
            <div className="text-xs font-semibold text-slate-500">أولوية {index + 1}</div>
          ) : null}
          <div className="mt-2 text-lg font-semibold text-ink">{title}</div>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", toneStyles[normalizedTone])}>
          متابعة
        </span>
      </div>

      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>

      <Link
        href={href}
        className="mt-4 inline-flex rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800"
      >
        {cta}
      </Link>
    </div>
  );
}
