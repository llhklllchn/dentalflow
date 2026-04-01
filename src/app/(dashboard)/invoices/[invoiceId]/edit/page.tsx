import { notFound, redirect } from "next/navigation";

import { InvoiceForm } from "@/components/billing/invoice-form";
import { PageHeader } from "@/components/shared/page-header";
import { updateInvoice } from "@/features/invoices/actions/update-invoice";
import { getInvoiceEditForm } from "@/features/invoices/queries/get-invoice-edit-form";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { getServicesList } from "@/features/services-catalog/queries/get-services-list";
import { requirePermission } from "@/lib/auth/guards";

type EditInvoicePageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditInvoicePage({
  params,
  searchParams
}: EditInvoicePageProps) {
  await requirePermission("invoices:*");
  const { invoiceId } = await params;
  const resolvedSearchParams = await searchParams;

  const [patients, services, invoice] = await Promise.all([
    getPatientsList(),
    getServicesList(),
    getInvoiceEditForm(invoiceId)
  ]);

  if (!invoice) {
    notFound();
  }

  async function submitInvoiceForm(formData: FormData) {
    "use server";

    const quantity = Number(formData.get("quantity") ?? 1);
    const unitPrice = Number(formData.get("unitPrice") ?? 0);
    const lineTotal = quantity * unitPrice;

    const result = await updateInvoice({
      invoiceId: String(formData.get("invoiceId") ?? ""),
      patientId: String(formData.get("patientId") ?? ""),
      issueDate: String(formData.get("issueDate") ?? ""),
      dueDate: String(formData.get("dueDate") ?? "") || undefined,
      discount: Number(formData.get("discount") ?? 0),
      tax: Number(formData.get("tax") ?? 0),
      notes: String(formData.get("notes") ?? "") || undefined,
      items: [
        {
          serviceName: String(formData.get("serviceName") ?? ""),
          description: String(formData.get("description") ?? "") || undefined,
          quantity,
          unitPrice,
          lineTotal
        }
      ]
    });

    if (!result.ok) {
      redirect(
        `/invoices/${encodeURIComponent(invoiceId)}/edit?error=${encodeURIComponent(
          result.message ?? "تعذر تحديث الفاتورة."
        )}`
      );
    }

    redirect(`/invoices/${encodeURIComponent(invoiceId)}`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Edit Invoice"
        title={`تعديل الفاتورة ${invoiceId}`}
        description="يمكنك تعديل بيانات الفاتورة وإعادة حساب الإجمالي مع الحفاظ على الاتساق المالي للدفعات المسجلة."
      />

      {invoice.paidAmount > 0 ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          يوجد على هذه الفاتورة دفعات مسجلة بقيمة {invoice.paidAmount}. لن يسمح النظام بتقليل
          الإجمالي عن هذا المبلغ.
        </div>
      ) : null}

      <InvoiceForm
        patients={patients}
        services={services}
        action={submitInvoiceForm}
        notice={resolvedSearchParams?.error}
        defaults={invoice}
        primaryLabel="حفظ التعديلات"
        secondaryHref={`/invoices/${encodeURIComponent(invoiceId)}`}
        secondaryLabel="العودة إلى الفاتورة"
        hiddenFields={<input type="hidden" name="invoiceId" value={invoice.lookupId} />}
      />
    </div>
  );
}
