import Link from "next/link";
import { redirect } from "next/navigation";

import { PaymentForm } from "@/components/billing/payment-form";
import { FormGuidePanel } from "@/components/shared/form-guide-panel";
import { PageHeader } from "@/components/shared/page-header";
import { getInvoicesList } from "@/features/invoices/queries/get-invoices-list";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { recordPayment } from "@/features/payments/actions/record-payment";
import { requirePermission } from "@/lib/auth/guards";
import { getFormGuide } from "@/lib/constants/form-guides";
import { buildQueryPath } from "@/lib/navigation/create-flow";

type NewPaymentPageProps = {
  searchParams?: Promise<{
    error?: string;
    invoiceId?: string;
    patientId?: string;
    amount?: string;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    paidAt?: string;
  }>;
};

function parseNumberInput(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function NewPaymentPage({ searchParams }: NewPaymentPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("payments:*");
  const formGuide = getFormGuide("payment");

  const [patients, invoices] = await Promise.all([getPatientsList(), getInvoicesList()]);
  const selectedInvoice = invoices.find(
    (invoice) => invoice.id === resolvedSearchParams?.invoiceId
  );

  async function submitPaymentForm(formData: FormData) {
    "use server";

    const invoiceId = String(formData.get("invoiceId") ?? "");
    const patientId = String(formData.get("patientId") ?? "");
    const amount = Number(formData.get("amount") ?? 0);
    const paymentMethod = String(formData.get("paymentMethod") ?? "cash");
    const reference = String(formData.get("reference") ?? "");
    const notes = String(formData.get("notes") ?? "");
    const paidAt = String(formData.get("paidAt") ?? "");

    const result = await recordPayment({
      invoiceId,
      patientId,
      amount,
      paymentMethod,
      reference: reference || undefined,
      notes: notes || undefined,
      paidAt
    });

    if (!result.ok) {
      redirect(
        buildQueryPath("/payments/new", {
          invoiceId,
          patientId,
          amount,
          paymentMethod,
          reference,
          notes,
          paidAt,
          error: result.message ?? "تعذر تسجيل الدفعة."
        })
      );
    }

    redirect(
      buildQueryPath(`/invoices/${encodeURIComponent(invoiceId)}`, {
        success: result.message ?? "تم تسجيل الدفعة وتحديث الفاتورة بنجاح.",
        spotlight: "payment-recorded"
      })
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="تسجيل دفعة"
        title="تسجيل دفعة جديدة"
        description="وثّق التحصيل بشكل دقيق ومرتب من أول مرة، مع ربط مباشر بالفاتورة والمريض وتحديث الحالة المالية تلقائيًا بعد الحفظ."
        tips={[
          "اختر الفاتورة الصحيحة قبل تسجيل المبلغ",
          "ثبّت طريقة الدفع كما حدثت فعليًا",
          "أضف المرجع عند التحويل أو البطاقة"
        ]}
        actions={
          <>
            <Link
              href="/invoices"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              مراجعة الفواتير
            </Link>
            <Link
              href="/payments"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              سجل المدفوعات
            </Link>
          </>
        }
      />

      <FormGuidePanel guide={formGuide} />

      <PaymentForm
        patients={patients}
        invoices={invoices}
        action={submitPaymentForm}
        notice={resolvedSearchParams?.error}
        draftKey="payments:create"
        defaultInvoiceId={selectedInvoice?.id ?? resolvedSearchParams?.invoiceId}
        defaultPatientId={resolvedSearchParams?.patientId ?? selectedInvoice?.patientId}
        defaults={{
          amount: parseNumberInput(resolvedSearchParams?.amount),
          paymentMethod: resolvedSearchParams?.paymentMethod,
          reference: resolvedSearchParams?.reference,
          paidAt: resolvedSearchParams?.paidAt,
          notes: resolvedSearchParams?.notes
        }}
      />
    </div>
  );
}
