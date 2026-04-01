import { ReactNode } from "react";

type AuthShellStat = {
  value: string;
  label: string;
};

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  asideTitle: string;
  asideDescription: string;
  highlights: string[];
  stats?: AuthShellStat[];
  children: ReactNode;
};

export function AuthShell({
  eyebrow = "DentFlow",
  title,
  description,
  asideTitle,
  asideDescription,
  highlights,
  stats,
  children
}: AuthShellProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 md:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.92fr,1.08fr]">
        <aside className="panel overflow-hidden p-8">
          <div className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">
            {eyebrow}
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-tight text-ink md:text-4xl">
            {asideTitle}
          </h1>
          <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
            {asideDescription}
          </p>

          <div className="mt-6 space-y-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-[1.25rem] border border-slate-200 bg-white/80 px-4 py-4 text-sm font-medium leading-7 text-slate-700"
              >
                {highlight}
              </div>
            ))}
          </div>

          {stats?.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {stats.map((stat) => (
                <div
                  key={`${stat.value}-${stat.label}`}
                  className="rounded-[1.5rem] bg-slate-950 px-5 py-4 text-white"
                >
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </aside>

        <section className="panel p-8 md:p-10">
          <div className="mb-6">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
              {eyebrow}
            </div>
            <h2 className="mt-3 text-3xl font-bold text-ink">{title}</h2>
            <p className="mt-3 text-sm leading-8 text-slate-600 md:text-base">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
