import { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
};

export function FormField({
  label,
  hint,
  required,
  optional,
  children
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{label}</span>
        {required ? <span className="text-rose-600">*</span> : null}
        {optional ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            اختياري
          </span>
        ) : null}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
