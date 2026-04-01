import { SkeletonBlock } from "@/components/shared/skeleton-block";

function LoadingCard() {
  return (
    <div className="panel p-5">
      <SkeletonBlock className="h-3 w-24 rounded-full" />
      <SkeletonBlock className="mt-4 h-9 w-28 rounded-2xl" />
      <SkeletonBlock className="mt-4 h-3 w-full rounded-full" />
      <SkeletonBlock className="mt-2 h-3 w-4/5 rounded-full" />
    </div>
  );
}

export function DashboardLoading() {
  return (
    <div className="space-y-6">
      <section className="panel p-6 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <SkeletonBlock className="h-7 w-36 rounded-full" />
            <SkeletonBlock className="h-12 w-72 rounded-[1.25rem]" />
            <SkeletonBlock className="h-4 w-full max-w-3xl rounded-full" />
            <SkeletonBlock className="h-4 w-4/5 max-w-2xl rounded-full" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-9 w-28 rounded-full" />
              <SkeletonBlock className="h-9 w-32 rounded-full" />
              <SkeletonBlock className="h-9 w-24 rounded-full" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <SkeletonBlock className="h-12 w-32 rounded-full" />
            <SkeletonBlock className="h-12 w-36 rounded-full" />
          </div>
        </div>
      </section>

      <div className="grid-cards">
        {Array.from({ length: 4 }).map((_, index) => (
          <LoadingCard key={index} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <SkeletonBlock className="h-8 w-52 rounded-2xl" />
              <SkeletonBlock className="h-4 w-80 max-w-full rounded-full" />
            </div>
            <SkeletonBlock className="h-10 w-28 rounded-full" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <SkeletonBlock className="h-3 w-24 rounded-full" />
                <SkeletonBlock className="mt-4 h-9 w-20 rounded-2xl" />
                <SkeletonBlock className="mt-4 h-3 w-full rounded-full" />
                <SkeletonBlock className="mt-2 h-3 w-4/5 rounded-full" />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
            <SkeletonBlock className="h-4 w-40 rounded-full" />
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4">
                  <SkeletonBlock className="h-3 w-16 rounded-full" />
                  <SkeletonBlock className="mt-3 h-3 w-full rounded-full" />
                  <SkeletonBlock className="mt-2 h-3 w-4/5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <SkeletonBlock className="h-8 w-44 rounded-2xl" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4"
              >
                <SkeletonBlock className="h-4 w-2/5 rounded-full" />
                <SkeletonBlock className="mt-3 h-3 w-full rounded-full" />
                <SkeletonBlock className="mt-2 h-3 w-3/4 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
