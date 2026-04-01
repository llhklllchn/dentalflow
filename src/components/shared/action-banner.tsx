import Link from "next/link";

export type ActionBannerAction = {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
};

type ActionBannerProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ActionBannerAction[];
  tone?: "success" | "brand";
};

const toneStyles = {
  success: {
    wrapper: "border-emerald-200 bg-emerald-50/80",
    eyebrow: "border-emerald-200 bg-white text-emerald-800",
    title: "text-emerald-950",
    description: "text-emerald-900/85",
    primary: "bg-emerald-700 text-white",
    secondary: "border-emerald-200 bg-white text-emerald-900"
  },
  brand: {
    wrapper: "border-brand-200 bg-brand-50/80",
    eyebrow: "border-brand-200 bg-white text-brand-800",
    title: "text-brand-950",
    description: "text-brand-900/85",
    primary: "bg-brand-700 text-white",
    secondary: "border-brand-200 bg-white text-brand-900"
  }
} as const;

export function ActionBanner({
  eyebrow,
  title,
  description,
  actions,
  tone = "success"
}: ActionBannerProps) {
  const styles = toneStyles[tone];

  return (
    <div className={`mb-6 rounded-[1.75rem] border p-5 ${styles.wrapper}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <div
              className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${styles.eyebrow}`}
            >
              {eyebrow}
            </div>
          ) : null}
          <div className={`text-xl font-semibold ${styles.title}`}>{title}</div>
          <p className={`mt-3 max-w-3xl text-sm leading-7 ${styles.description}`}>
            {description}
          </p>
        </div>

        {actions?.length ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold ${
                  action.tone === "primary" ? styles.primary : `border ${styles.secondary}`
                }`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
