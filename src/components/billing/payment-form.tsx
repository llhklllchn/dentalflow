import { InvoiceDetails, PatientListItem } from "@/lib/constants/mock-data";

import { FormActions } from "@/components/shared/form-actions";
import { FormField } from "@/components/shared/form-field";
import { FormNavigator } from "@/components/shared/form-navigator";
import { FormSection } from "@/components/shared/form-section";
import { extractFormattedAmount, formatMetricNumber } from "@/lib/utils/formatted-value";

type PaymentFormProps = {
  patients: PatientListItem[];
  invoices: InvoiceDetails[];
  action: (formData: FormData) => void | Promise<void>;
  notice?: string;
  defaultPatientId?: string;
  defaultInvoiceId?: string;
};

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case "cash":
      return "نقدًا";
    case "card":
      return "بطاقة";
    case "transfer":
      return "تحويل";
    case "mixed":
      return "مختلط";
    default:
      return method;
  }
}

export function PaymentForm({
  patients,
  invoices,
  action,
  notice,
  defaultPatientId,
  defaultInvoiceId
}: PaymentFormProps) {
  const hasPatients = patients.length > 0;
  const hasInvoices = invoices.length > 0;
  const canSubmit = hasPatients && hasInvoices;
  const selectedInvoice =
    invoices.find((invoice) => invoice.id === defaultInvoiceId) ?? invoices[0];
  const outstandingInvoices = invoices.filter(
    (invoice) => extractFormattedAmount(invoice.balance) > 0
  ).length;

  return (
    <form action={action} className="space-y-6">
      {notice ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-brand-200 bg-brand-50 p-5">
          <div className="text-sm font-semibold text-brand-900">1. اختر الفاتورة الصحيحة</div>
          <p className="mt-2 text-sm leading-7 text-brand-900/80">
            ربط الدفعة بالفاتورة المناسبة يضمن تحديث الرصيد والحالة المالية للمريض مباشرة.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">2. ثبت طريقة السداد</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            اختر الطريقة الأقرب للواقع حتى تبقى تقارير التحصيل والصندوق أكثر دقة.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">3. راجع المرجع والتاريخ</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            المرجع وتاريخ الدفع مهمان خصوصًا في التحويلات والمدفوعات التي تحتاج تدقيقًا لاحقًا.
          </p>
        </div>
      </div>

      {!canSubmit ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900">
          {hasPatients
            ? "لا توجد فواتير متاحة لتسجيل دفعة عليها الآن. أنشئ فاتورة أولًا ثم عد لتسجيل الدفع."
            : "لا توجد ملفات مرضى جاهزة بعد. أضف مريضًا وفاتورة أولًا ثم عد لتسجيل الدفعة."}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">مرضى متاحون</div>
          <div className="mt-2 text-2xl font-bold text-ink">{formatMetricNumber(patients.length)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">فواتير مفتوحة</div>
          <div className="mt-2 text-2xl font-bold text-ink">
            {formatMetricNumber(outstandingInvoices)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">الفاتورة المختارة</div>
          <div className="mt-2 text-base font-bold text-ink">
            {selectedInvoice ? selectedInvoice.id : "لا توجد فاتورة"}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {selectedInvoice ? `${selectedInvoice.balance} متبقٍ` : "—"}
          </div>
        </div>
      </div>

      <FormNavigator
        title="سجّل الدفعة كخطوة مالية دقيقة وواضحة"
        description="ابدأ بالفاتورة الصحيحة ثم أدخل المبلغ وطريقة الدفع والمرجع. هذا يمنع أي التباس لاحقًا في الرصيد أو المراجعة."
        readinessItems={[
          "تأكد من الفاتورة والمريض قبل إدخال المبلغ.",
          "اختر طريقة الدفع كما حدثت فعلًا لا كما تتوقع.",
          "أضف المرجع عند التحويل أو البطاقة إذا كان مهمًا للمراجعة."
        ]}
        sections={[
          {
            id: "payment-core-details",
            label: "بيانات الدفعة",
            hint: "الفاتورة والمريض والمبلغ وطريقة الدفع والتاريخ."
          }
        ]}
      />

      <FormSection id="payment-core-details" badgeLabel="التحصيل"
        title="بيانات الدفعة"
        description="سجّل الدفعة واربطها مباشرة بالمريض والفاتورة وطريقة السداد مع أقل قدر من الخطوات."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="المريض" required hint="اختر المريض المرتبط بالفاتورة">
            <select
              name="patientId"
              defaultValue={defaultPatientId ?? patients[0]?.id}
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
          <FormField label="الفاتورة" required hint="سيُحدّث النظام رصيدها تلقائيًا بعد الحفظ">
            <select
              name="invoiceId"
              defaultValue={defaultInvoiceId ?? invoices[0]?.id}
              required
              disabled={!hasInvoices}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
            >
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.id} - {invoice.patient}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="المبلغ" required hint="اكتب المبلغ المقبوض فعليًا">
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={extractFormattedAmount(selectedInvoice?.balance ?? "40")}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="طريقة الدفع" required>
            <select
              name="paymentMethod"
              defaultValue="cash"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            >
              {["cash", "card", "transfer", "mixed"].map((method) => (
                <option key={method} value={method}>
                  {getPaymentMethodLabel(method)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="مرجع العملية" optional hint="مفيد للتحويل أو البطاقة أو التسوية الداخلية">
            <input
              name="reference"
              placeholder="رقم مرجع أو آخر 4 أرقام أو وصف داخلي"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="تاريخ الدفع" required>
            <input
              name="paidAt"
              type="date"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField
            label="ملاحظات"
            optional
            hint="مثل: دفعة أولى، تسوية متأخرة، أو جزء من خطة علاج"
          >
            <textarea
              name="notes"
              placeholder="أي سياق يساعد المحاسبة أو الاستقبال لاحقًا"
              className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
        </div>
      </FormSection>

      <FormActions
        primaryLabel="حفظ الدفعة"
        secondaryHref="/payments"
        secondaryLabel="العودة إلى المدفوعات"
        primaryDisabled={!canSubmit}
        primaryDisabledReason={
          !canSubmit
            ? "أكمل وجود المرضى والفواتير أولًا حتى يصبح تسجيل الدفعة ممكنًا."
            : undefined
        }
        helperText="بعد الحفظ سيحدّث النظام حالة الفاتورة والرصيد المتبقي تلقائيًا، لذلك تأكد من اختيار الفاتورة والمبلغ الصحيحين."
      />
    </form>
  );
}
