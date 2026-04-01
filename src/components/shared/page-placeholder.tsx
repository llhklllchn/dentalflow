import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";

type PagePlaceholderProps = {
  title: string;
  description: string;
  nextSteps?: string[];
};

export function PagePlaceholder({
  title,
  description,
  nextSteps = []
}: PagePlaceholderProps) {
  return (
    <div>
      <PageHeader
        eyebrow="وحدة مخططة"
        title={title}
        description={description}
        actions={
          <Link
            href="/dashboard"
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
          >
            العودة إلى لوحة التحكم
          </Link>
        }
      />

      <div className="panel p-6">
        <div className="text-lg font-semibold text-ink">ما الذي جهزناه هنا؟</div>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          هذه الصفحة موجودة ضمن الهيكل الفعلي للمشروع، ويمكن الآن ربطها بالاستعلامات
          والنماذج وقاعدة البيانات بحسب الأولوية التنفيذية.
        </p>

        {nextSteps.length > 0 ? (
          <ul className="mt-5 list-disc space-y-2 pr-5 text-sm leading-7 text-slate-700">
            {nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
