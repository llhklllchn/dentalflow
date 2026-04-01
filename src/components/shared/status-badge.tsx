import { getStatusLabel } from "@/lib/domain/labels";
import { cn } from "@/lib/utils/cn";

type StatusBadgeProps = {
  label?: string;
  status:
    | "scheduled"
    | "confirmed"
    | "checked_in"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show"
    | "draft"
    | "issued"
    | "partially_paid"
    | "paid"
    | "overdue"
    | "planned"
    | "approved"
    | "pending"
    | "sent"
    | "failed"
    | "active"
    | "inactive"
    | "invited";
};

const statusStyles: Record<StatusBadgeProps["status"], string> = {
  scheduled: "bg-sky-100 text-sky-800",
  confirmed: "bg-cyan-100 text-cyan-800",
  checked_in: "bg-amber-100 text-amber-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-700",
  no_show: "bg-rose-100 text-rose-800",
  draft: "bg-slate-200 text-slate-700",
  issued: "bg-sky-100 text-sky-800",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-rose-100 text-rose-800",
  planned: "bg-violet-100 text-violet-800",
  approved: "bg-teal-100 text-teal-800",
  pending: "bg-slate-200 text-slate-700",
  sent: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800",
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-200 text-slate-700",
  invited: "bg-brand-100 text-brand-900"
};

export function StatusBadge({ label, status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        statusStyles[status]
      )}
    >
      {label ?? getStatusLabel(status)}
    </span>
  );
}
