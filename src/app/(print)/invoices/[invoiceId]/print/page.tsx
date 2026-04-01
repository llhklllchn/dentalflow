import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/shared/print-button";
import { getInvoiceById } from "@/features/invoices/queries/get-invoice-by-id";
import { requirePermission } from "@/lib/auth/guards";
import { getStatusLabel } from "@/lib/domain/labels";
import { getClinicContext } from "@/lib/tenant/clinic-context";

type InvoicePrintPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function InvoicePrintPage({ params }: InvoicePrintPageProps) {
  await requirePermission("invoices:view");
  const { invoiceId } = await params;

  const [invoice, clinic] = await Promise.all([
    getInvoiceById(invoiceId),
    getClinicContext()
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f4efe7] px-4 py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-panel print:rounded-none print:shadow-none">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4 print:hidden">
          <Link
            href={`/invoices/${invoiceId}`}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            العودة إلى الفاتورة
          </Link>
          <PrintButton label="طباعة / حفظ PDF" />
        </div>

        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                DentFlow
              </div>
              <h1 className="mt-2 text-3xl font-bold text-ink">فاتورة علاج</h1>
              <p className="mt-2 text-sm text-slate-500">{clinic.clinicName}</p>
              <p className="mt-1 text-sm text-slate-500">
                العملة: {clinic.currency} | المنطقة الزمنية: {clinic.timezone}
              </p>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div>رقم الفاتورة: {invoice.id}</div>
              <div>اسم المريض: {invoice.patient}</div>
              <div>تاريخ الإصدار: {invoice.issueDate}</div>
              <div>تاريخ الاستحقاق: {invoice.dueDate ?? "عند الإصدار"}</div>
              <div>الحالة: {getStatusLabel(invoice.status)}</div>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">الإجمالي</div>
            <div className="mt-3 text-2xl font-bold text-ink">{invoice.total}</div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">المدفوع</div>
            <div className="mt-3 text-2xl font-bold text-ink">{invoice.paid}</div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">المتبقي</div>
            <div className="mt-3 text-2xl font-bold text-ink">{invoice.balance}</div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-[1fr,18rem]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-slate-500">بيانات الفاتورة</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                المريض: {invoice.patient}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                رقم الفاتورة: {invoice.id}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                الإصدار: {invoice.issueDate}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                الاستحقاق: {invoice.dueDate ?? "عند الإصدار"}
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5 text-sm leading-7 text-brand-900">
            هذه النسخة مهيأة للطباعة أو الحفظ كملف PDF مباشرة من المتصفح مع تنسيق واضح للفريق
            والمريض والمحاسبة.
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[1.5rem] border border-slate-200">
          <table className="min-w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-4 font-medium">الخدمة</th>
                <th className="px-4 py-4 font-medium">الكمية</th>
                <th className="px-4 py-4 font-medium">سعر الوحدة</th>
                <th className="px-4 py-4 font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length > 0 ? (
                invoice.items.map((item) => (
                  <tr key={`${invoice.id}-${item.name}`} className="border-t border-slate-200">
                    <td className="px-4 py-4 text-slate-700">{item.name}</td>
                    <td className="px-4 py-4 text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-4 text-slate-700">{item.unitPrice}</td>
                    <td className="px-4 py-4 font-semibold text-ink">{item.total}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                    لا توجد بنود ظاهرة داخل هذه الفاتورة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {invoice.notes ? (
          <section className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">ملاحظات</div>
            <div className="mt-3 text-sm leading-7 text-slate-700">{invoice.notes}</div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-6 md:grid-cols-[1fr,22rem]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
            تم إنشاء هذه الفاتورة من نظام DentFlow لإدارة عيادات الأسنان. يمكن طباعتها أو حفظها
            كملف PDF مباشرة من المتصفح مع الحفاظ على تنسيق واضح للعرض والأرشفة.
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>الإجمالي</span>
                <span>{invoice.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>المدفوع</span>
                <span>{invoice.paid}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold text-ink">
                <span>المتبقي</span>
                <span>{invoice.balance}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
