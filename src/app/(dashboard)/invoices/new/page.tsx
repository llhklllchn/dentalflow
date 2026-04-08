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
import { shouldUseDemoData } from "@/lib/db/data-source";
import { buildQueryPath } from "@/lib/navigation/create-flow";

type NewInvoicePageProps = {
  searchParams?: Promise<{
    error?: string;
    patientId?: string;
    issueDate?: string;
    dueDate?: string;
    notes?: string;
    serviceName?: string;
    description?: string;
    quantity?: string;
    unitPrice?: string;
    discount?: string;
    tax?: string;
  }>;
};

function parseNumberInput(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("invoices:*");
  const formGuide = getFormGuide("invoice");

  const [patients, services] = await Promise.all([getPatientsList(), getServicesList()]);

  async function submitInvoiceForm(formData: FormData) {
    "use server";

    const quantity = Number(formData.get("quantity") ?? 1);
    const unitPrice = Number(formData.get("unitPrice") ?? 0);
    const patientId = String(formData.get("patientId") ?? "");
    const issueDate = String(formData.get("issueDate") ?? "");
    const dueDate = String(formData.get("dueDate") ?? "");
    const serviceName = String(formData.get("serviceName") ?? "");
    const description = String(formData.get("description") ?? "");
    const notes = String(formData.get("notes") ?? "");
    const discount = Number(formData.get("discount") ?? 0);
    const tax = Number(formData.get("tax") ?? 0);
    const lineTotal = quantity * unitPrice;

    const result = await createInvoice({
      patientId,
      issueDate,
      dueDate: dueDate || undefined,
      discount,
      tax,
      notes: notes || undefined,
      items: [
        {
          serviceName,
          description: description || undefined,
          quantity,
          unitPrice,
          lineTotal
        }
      ]
    });
    const createdInvoiceId =
      result.data && "id" in result.data ? result.data.id : undefined;

    if (!result.ok) {
      redirect(
        buildQueryPath("/invoices/new", {
          patientId,
          issueDate,
          dueDate,
          notes,
          serviceName,
          description,
          quantity,
          unitPrice,
          discount,
          tax,
          error: result.message ?? "تعذر إنشاء الفاتورة."
        })
      );
    }

    if (shouldUseDemoData() || !createdInvoiceId) {
      redirect(
        buildQueryPath(`/patients/${encodeURIComponent(patientId)}`, {
          success: result.message ?? "تم إنشاء الفاتورة بنجاح.",
          spotlight: "invoice-created"
        })
      );
    }

    redirect(
      buildQueryPath(`/invoices/${encodeURIComponent(createdInvoiceId)}`, {
        success: result.message ?? "تم إنشاء الفاتورة بنجاح.",
        spotlight: "invoice-created"
      })
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="إنشاء فاتورة"
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
        draftKey="invoices:create"
        defaults={{
          patientId: resolvedSearchParams?.patientId,
          issueDate: resolvedSearchParams?.issueDate,
          dueDate: resolvedSearchParams?.dueDate,
          notes: resolvedSearchParams?.notes,
          serviceName: resolvedSearchParams?.serviceName,
          description: resolvedSearchParams?.description,
          quantity: parseNumberInput(resolvedSearchParams?.quantity),
          unitPrice: parseNumberInput(resolvedSearchParams?.unitPrice),
          discount: parseNumberInput(resolvedSearchParams?.discount),
          tax: parseNumberInput(resolvedSearchParams?.tax)
        }}
      />
    </div>
  );
}
