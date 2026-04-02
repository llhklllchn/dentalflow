import Link from "next/link";
import { ReactNode } from "react";

import { ActionLinkItem, ActionLinkStrip } from "@/components/shared/action-link-strip";

type SearchResultCardProps = {
  title: string;
  href: string;
  subtitle: string;
  badge?: ReactNode;
  actions?: ActionLinkItem[];
};

export function SearchResultCard({
  title,
  href,
  subtitle,
  badge,
  actions = []
}: SearchResultCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={href} className="font-semibold text-ink transition hover:text-brand-700">
            {title}
          </Link>
          <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
        </div>
        {badge}
      </div>

      <ActionLinkStrip items={actions} />
    </div>
  );
}
