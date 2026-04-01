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

type NewPaymentPageProps = {
  searchParams?: Promise<{
    error?: string;
    invoiceId?: string;
  }>;
};

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

    const result = await recordPayment({
      invoiceId: String(formData.get("invoiceId") ?? ""),
      patientId: String(formData.get("patientId") ?? ""),
      amount: Number(formData.get("amount") ?? 0),
      paymentMethod: String(formData.get("paymentMethod") ?? "cash"),
      reference: String(formData.get("reference") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined,
      paidAt: String(formData.get("paidAt") ?? "")
    });

    if (!result.ok) {
      redirect(
        `/payments/new?invoiceId=${encodeURIComponent(
          String(formData.get("invoiceId") ?? "")
        )}&error=${encodeURIComponent(result.message ?? "تعذر تسجيل الدفعة.")}`
      );
    }

    redirect("/payments");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Record Payment"
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
        defaultInvoiceId={selectedInvoice?.id}
        defaultPatientId={selectedInvoice?.patientId}
      />
    </div>
  );
}
