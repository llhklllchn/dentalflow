import Link from "next/link";

export type ActionLinkItem = {
  href: string;
  label: string;
  tone?: "default" | "brand" | "emerald";
};

type ActionLinkStripProps = {
  items: ActionLinkItem[];
};

function getToneClass(tone: ActionLinkItem["tone"]) {
  switch (tone) {
    case "brand":
      return "border-brand-200 bg-brand-50 text-brand-800 hover:border-brand-300 hover:bg-brand-100";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100";
    default:
      return "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50";
  }
}

export function ActionLinkStrip({ items }: ActionLinkStripProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={`${item.href}-${item.label}`}
          href={item.href}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${getToneClass(item.tone)}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
