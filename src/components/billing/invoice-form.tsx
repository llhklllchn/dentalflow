import type { ReactNode } from "react";

import { FormActions } from "@/components/shared/form-actions";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import { PatientListItem, ServiceListItem } from "@/lib/constants/mock-data";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

type InvoiceFormDefaults = {
  patientId?: string;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  serviceName?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  tax?: number;
};

type InvoiceFormProps = {
  patients: PatientListItem[];
  services: ServiceListItem[];
  action: (formData: FormData) => void | Promise<void>;
  notice?: string;
  defaults?: InvoiceFormDefaults;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  hiddenFields?: ReactNode;
};

export function InvoiceForm({
  patients,
  services,
  action,
  notice,
  defaults,
  primaryLabel = "حفظ الفاتورة",
  secondaryHref = "/invoices",
  secondaryLabel = "العودة إلى الفواتير",
  hiddenFields
}: InvoiceFormProps) {
  const hasPatients = patients.length > 0;
  const hasServices = services.length > 0;
  const canSubmit = hasPatients && hasServices;
  const averageServicePrice = services.length
    ? services.reduce((sum, service) => sum + (service.priceValue ?? 0), 0) / services.length
    : 0;

  return (
    <form action={action} className="space-y-6">
      {hiddenFields}

      {notice ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-brand-200 bg-brand-50 p-5">
          <div className="text-sm font-semibold text-brand-900">1. اختر المريض</div>
          <p className="mt-2 text-sm leading-7 text-brand-900/80">
            اربط الفاتورة بالمريض الصحيح حتى تظهر في ملفه المالي مباشرة.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">2. أضف الخدمة والسعر</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            يكفي بند واحد كبداية، والمهم أن تكون الخدمة والسعر واضحين وقابلين للمراجعة.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">3. راجع الخصم والضريبة</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            النظام يحسب الإجمالي تلقائيًا بعد الحفظ، لكن دقة الخصم والضريبة تبقى مسؤولية الإدخال.
          </p>
        </div>
      </div>

      {!canSubmit ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900">
          {!hasPatients
            ? "لا توجد ملفات مرضى جاهزة بعد. أضف مريضًا أولًا قبل إصدار فاتورة."
            : "لا توجد خدمات مفعلة جاهزة للفوترة. أضف خدمة أو فعّل خدمة موجودة أولًا."}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">مرضى متاحون</div>
          <div className="mt-2 text-2xl font-bold text-ink">{formatMetricNumber(patients.length)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">خدمات مفعلة</div>
          <div className="mt-2 text-2xl font-bold text-ink">{formatMetricNumber(services.length)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">متوسط سعر الخدمات</div>
          <div className="mt-2 text-2xl font-bold text-ink">
            {formatMetricNumber(averageServicePrice)} JOD
          </div>
        </div>
      </div>

      <FormSection
        title="بيانات الفاتورة"
        description="أدخل الحد الأدنى الذي تحتاجه المحاسبة والاستقبال لإصدار فاتورة واضحة وقابلة للمتابعة."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="المريض" required hint="ستظهر الفاتورة داخل ملف المريض فور حفظها">
            <select
              name="patientId"
              defaultValue={defaults?.patientId ?? patients[0]?.id}
              required
              disabled={!hasPatients}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="تاريخ الإصدار" required>
            <input
              name="issueDate"
              type="date"
              defaultValue={defaults?.issueDate}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="تاريخ الاستحقاق" optional hint="اتركه فارغًا إذا كانت الفاتورة مستحقة فورًا">
            <input
              name="dueDate"
              type="date"
              defaultValue={defaults?.dueDate}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="ملاحظات" optional hint="مثل: مرتبطة بخطة علاج أو جلسة متابعة">
            <input
              name="notes"
              defaultValue={defaults?.notes}
              placeholder="أي ملاحظة توضيحية للمحاسبة أو الطبيب"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="بنود الفاتورة"
        description="هذه النسخة تدعم بندًا أساسيًا واحدًا لتسريع العمل اليومي، مع إمكانية تعديل الكمية والسعر والخصم والضريبة."
      >
        <div className="grid gap-4 md:grid-cols-[1.4fr,1fr,140px,160px]">
          <FormField label="الخدمة" required>
            <select
              name="serviceName"
              defaultValue={defaults?.serviceName ?? services[0]?.name}
              required
              disabled={!hasServices}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
            >
              {services.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="الوصف" optional hint="يمكنك توضيح السن أو الجلسة المرتبطة">
            <input
              name="description"
              defaultValue={defaults?.description}
              placeholder="مثال: حشو السن 14"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الكمية" required>
            <input
              name="quantity"
              type="number"
              min="1"
              step="1"
              defaultValue={defaults?.quantity ?? 1}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="سعر الوحدة" required>
            <input
              name="unitPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaults?.unitPrice ?? services[0]?.priceValue ?? 80}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <FormField label="الخصم" optional hint="اكتب 0 إذا لم يوجد خصم">
            <input
              name="discount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaults?.discount ?? 0}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الضريبة" optional hint="اكتب 0 إذا لم يتم تطبيق ضريبة">
            <input
              name="tax"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaults?.tax ?? 0}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
            المجموع الفرعي يحسب تلقائيًا عند الحفظ.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700">
            حالة الفاتورة النهائية تتحدد من النظام حسب المدفوع والمتبقي.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-ink">
            يمكنك إضافة الدفعة لاحقًا من شاشة الفواتير أو من داخل الفاتورة نفسها.
          </div>
        </div>
      </FormSection>

      <FormActions
        primaryLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
        primaryDisabled={!canSubmit}
        primaryDisabledReason={
          !canSubmit
            ? "وجود المريض والخدمة شرط أساسي قبل إصدار أي فاتورة جديدة."
            : undefined
        }
        helperText="ليس ضروريًا أن تسجل الدفعة الآن. احفظ الفاتورة أولًا، ثم أضف المدفوعات عندما يتم التحصيل."
      />
    </form>
  );
}
