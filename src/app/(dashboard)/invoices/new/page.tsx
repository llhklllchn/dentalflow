import Link from "next/link";
import { redirect } from "next/navigation";

import { InvoiceForm } from "@/components/billing/invoice-form";
import { FormGuidePanel } from "@/components/shared/form-guide-panel";
import { PageHeader } from "@/components/shared/page-header";
import { createInvoice } from "@/features/invoices/actions/create-invoice";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { getServicesList } from "@/features/services-catalog/queries/get-services-list";
import { requirePermission } from "@/lib/auth/guards";
import { getFormGuide } from "@/lib/constants/form-guides";

type NewInvoicePageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("invoices:*");
  const formGuide = getFormGuide("invoice");

  const [patients, services] = await Promise.all([getPatientsList(), getServicesList()]);

  async function submitInvoiceForm(formData: FormData) {
    "use server";

    const quantity = Number(formData.get("quantity") ?? 1);
    const unitPrice = Number(formData.get("unitPrice") ?? 0);
    const lineTotal = quantity * unitPrice;

    const result = await createInvoice({
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
        `/invoices/new?error=${encodeURIComponent(
          result.message ?? "تعذر إنشاء الفاتورة."
        )}`
      );
    }

    redirect("/invoices");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Create Invoice"
        title="إنشاء فاتورة جديدة"
        description="أنشئ فاتورة واضحة وقابلة للتحصيل بسرعة، مع ربط مباشر بالمريض والخدمة وتوثيق التفاصيل التي تحتاجها المحاسبة والاستقبال من أول إصدار."
        tips={[
          "اختر المريض الصحيح قبل أي شيء",
          "يكفي بند واحد واضح كبداية",
          "يمكن تسجيل الدفعة لاحقًا بعد التحصيل"
        ]}
        actions={
          <>
            <Link
              href="/services"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              الخدمات
            </Link>
            <Link
              href="/invoices"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              قائمة الفواتير
            </Link>
          </>
        }
      />

      <FormGuidePanel guide={formGuide} />

      <InvoiceForm
        patients={patients}
        services={services}
        action={submitInvoiceForm}
        notice={resolvedSearchParams?.error}
      />
    </div>
  );
}
