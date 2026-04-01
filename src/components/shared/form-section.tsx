import { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="panel p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

