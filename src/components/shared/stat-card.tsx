type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  badgeLabel?: string;
};

export function StatCard({ label, value, hint, badgeLabel = "لمحة سريعة" }: StatCardProps) {
  return (
    <div className="panel relative overflow-hidden p-5 md:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-brand-500 via-brand-300 to-amber-200" />
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <span className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
          {badgeLabel}
        </span>
      </div>
      <div className="mt-5 text-3xl font-bold text-ink md:text-4xl">{value}</div>
      <div className="mt-4 rounded-[1.25rem] bg-brand-50 px-4 py-3 text-sm leading-7 text-brand-900">
        {hint}
      </div>
    </div>
  );
}
