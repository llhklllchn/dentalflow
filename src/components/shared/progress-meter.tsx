type ProgressMeterProps = {
  value: number;
  label?: string;
};

export function ProgressMeter({ value, label }: ProgressMeterProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-600">{label ?? "التقدم"}</span>
        <span className="font-semibold text-ink">{value}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
