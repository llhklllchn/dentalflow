import Link from "next/link";

type NextStepCalloutProps = {
  tone: "brand" | "emerald" | "amber" | "rose" | "slate";
  label: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

function getToneClass(tone: NextStepCalloutProps["tone"]) {
  switch (tone) {
    case "brand":
      return "border-brand-100 bg-brand-50 text-brand-900";
    case "emerald":
      return "border-emerald-100 bg-emerald-50 text-emerald-900";
    case "amber":
      return "border-amber-100 bg-amber-50 text-amber-900";
    case "rose":
      return "border-rose-100 bg-rose-50 text-rose-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function NextStepCallout({
  tone,
  label,
  description,
  actionHref,
  actionLabel
}: NextStepCalloutProps) {
  return (
    <div className={`mt-4 rounded-[1.25rem] border px-4 py-4 text-sm ${getToneClass(tone)}`}>
      <div className="font-semibold">{label}</div>
      <p className="mt-2 leading-7">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-3 inline-flex rounded-full border border-current/20 bg-white/70 px-4 py-2 text-sm font-semibold"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
