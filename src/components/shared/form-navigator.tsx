type FormNavigatorSection = {
  id: string;
  label: string;
  hint: string;
};

type FormNavigatorProps = {
  title: string;
  description: string;
  readinessItems: string[];
  sections: FormNavigatorSection[];
};

export function FormNavigator({
  title,
  description,
  readinessItems,
  sections
}: FormNavigatorProps) {
  return (
    <section className="panel mt-6 p-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <div>
          <div className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Guided Form
          </div>
          <h2 className="mt-4 text-2xl font-bold text-ink">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
            {description}
          </p>

          <div className="mt-6 grid gap-3">
            {readinessItems.map((item, index) => (
              <div
                key={item}
                className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700"
              >
                <span className="mb-2 block text-xs font-semibold text-slate-500">
                  تهيئة {index + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <div className="text-lg font-semibold text-ink">التنقل داخل النموذج</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            استخدم هذه الروابط للانتقال السريع إلى القسم الذي تحتاجه بدل التمرير الطويل.
          </p>

          <div className="mt-5 space-y-3">
            {sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-brand-300 hover:bg-brand-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      القسم {index + 1}
                    </div>
                    <div className="mt-1 font-semibold text-ink">{section.label}</div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">{section.hint}</div>
                  </div>
                  <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold text-brand-800">
                    انتقال
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
