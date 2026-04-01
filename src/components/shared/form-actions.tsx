import Link from "next/link";

type FormActionsProps = {
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  helperText?: string;
  primaryDisabled?: boolean;
  primaryDisabledReason?: string;
};

export function FormActions({
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  helperText,
  primaryDisabled = false,
  primaryDisabledReason
}: FormActionsProps) {
  return (
    <div className="space-y-3">
      {helperText ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {helperText}
        </div>
      ) : null}

      {primaryDisabled && primaryDisabledReason ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {primaryDisabledReason}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          disabled={primaryDisabled}
          className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          {primaryLabel}
        </button>
        <Link
          href={secondaryHref}
          className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800"
        >
          {secondaryLabel}
        </Link>
      </div>
    </div>
  );
}
