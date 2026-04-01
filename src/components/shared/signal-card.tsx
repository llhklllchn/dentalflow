import { cn } from "@/lib/utils/cn";

type SignalTone = "brand" | "emerald" | "amber" | "rose" | "slate";

type SignalCardProps = {
  label: string;
  value: string;
  description: string;
  tone?: SignalTone | string;
  className?: string;
};

const toneStyles: Record<SignalTone, { shell: string; badge: string }> = {
  brand: {
    shell: "border-brand-100 bg-brand-50/80",
    badge: "bg-brand-600"
  },
  emerald: {
    shell: "border-emerald-100 bg-emerald-50/80",
    badge: "bg-emerald-600"
  },
  amber: {
    shell: "border-amber-100 bg-amber-50/80",
    badge: "bg-amber-500"
  },
  rose: {
    shell: "border-rose-100 bg-rose-50/80",
    badge: "bg-rose-500"
  },
  slate: {
    shell: "border-slate-200 bg-slate-50/80",
    badge: "bg-slate-500"
  }
};

export function SignalCard({
  label,
  value,
  description,
  tone = "brand",
  className
}: SignalCardProps) {
  const normalizedTone = tone in toneStyles ? (tone as SignalTone) : "brand";
  const styles = toneStyles[normalizedTone];

  return (
    <div className={cn("rounded-[1.5rem] border p-5", styles.shell, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-semibold text-slate-600">{label}</div>
        <span className={cn("h-2.5 w-2.5 rounded-full", styles.badge)} />
      </div>
      <div className="mt-4 text-3xl font-bold text-ink">{value}</div>
      <p className="mt-4 text-sm leading-7 text-slate-700">{description}</p>
    </div>
  );
}
