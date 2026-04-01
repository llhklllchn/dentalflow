"use client";

import { cn } from "@/lib/utils/cn";

type PrintButtonProps = {
  label?: string;
  className?: string;
};

export function PrintButton({
  label = "طباعة الصفحة",
  className
}: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(
        "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700",
        className
      )}
    >
      {label}
    </button>
  );
}
