import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActionBanner, type ActionBannerAction } from "@/components/shared/action-banner";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { ProgressMeter } from "@/components/shared/progress-meter";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { setInvoiceStatus } from "@/features/invoices/actions/set-invoice-status";
import { getInvoiceById } from "@/features/invoices/queries/get-invoice-by-id";
import { requirePermission } from "@/lib/auth/guards";
import { buildPaymentCreatePath } from "@/lib/navigation/create-flow";
import { hasPermission } from "@/lib/permissions/permissions";
import { extractFormattedAmount, formatMetricNumber } from "@/lib/utils/formatted-value";

type InvoiceDetailsPageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    success?: string;
    spotlight?: string;
  }>;
};

const invoiceSections = [
  { id: "overview", label: "نظرة عامة" },
  { id: "items", label: "البنود" },
  { id: "collection", label: "التحصيل" },
  { id: "notes", label: "ملاحظات" }
];

const paymentMethodLabels = {
  cash: "نقدًا",
  card: "بطاقة",
  transfer: "تحويل",
  mixed: "دفعات متعددة"
} as const;

function getPaymentMethodLabel(value: string) {
  return paymentMethodLabels[value as keyof typeof paymentMethodLabels] ?? value;
}

function buildCollectionGuidance(status: string, balanceAmount: number) {
  switch (status) {
    case "paid":
      return "التحصيل مكتمل بالكامل ولا توجد متابعة مالية مطلوبة على هذه الفاتورة.";
    case "partially_paid":
      return `تم تحصيل جزء من الفاتورة وما يزال ${formatMetricNumber(balanceAmount)} JOD يحتاج متابعة.`;
    case "overdue":
      return "الفاتورة متأخرة وتحتاج تواصلًا مباشرًا وجدولة تحصيل واضحة مع المريض.";
    case "cancelled":
      return "الفاتورة ألغيت ولن تدخل ضمن مسار التحصيل الحالي.";
    default:
      return "الفاتورة ما تزال في بداية دورة التحصيل وتنتظر أول دفعة أو تثبيت الحالة.";
  }
}

function getInvoiceSpotlight(input: {
  spotlight?: string;
  success?: string;
  invoiceId: string;
  patientId: string;
  balanceAmount: number;
  canRecordPayments: boolean;
}) {
  switch (input.spotlight) {
    case "invoice-created":
      return {
        eyebrow: "Collection Ready",
        title: "الفاتورة أصبحت جاهزة للتحصيل",
        description:
          input.success ??
          "الخطوة التالية عادة هي تسجيل أول دفعة أو مشاركة الفاتورة مع الفريق المالي وملف المريض.",
        actions: [
          input.canRecordPayments
            ? {
                href: buildPaymentCreatePath({
                  invoiceId: input.invoiceId,
                  patientId: input.patientId
                }),
                label: "تسجيل دفعة",
                tone: "primary" as const
              }
            : null,
          { href: `/patients/${input.patientId}`, label: "ملف المريض" },
          { href: "/invoices", label: "كل الفواتير" }
        ].filter(Boolean) as ActionBannerAction[]
      };
    case "payment-recorded":
      return {
        eyebrow: "Payment Applied",
        title:
          input.balanceAmount > 0
            ? "تم تحديث الرصيد وبقي جزء يحتاج متابعة"
            : "تم إغلاق الفاتورة ماليًا بنجاح",
        description:
          input.success ??
          (input.balanceAmount > 0
            ? "يمكنك تسجيل دفعة إضافية لاحقًا أو العودة إلى ملف المريض لمتابعة العلاج والتحصيل."
            : "الدفعة الأخيرة انعكست على الفاتورة مباشرة، ويمكنك الآن العودة إلى ملف المريض أو سجل المدفوعات."),
        actions: [
          input.canRecordPayments && input.balanceAmount > 0
            ? {
                href: buildPaymentCreatePath({
                  invoiceId: input.invoiceId,
                  patientId: input.patientId
                }),
                label: "دفعة إضافية",
                tone: "primary" as const
              }
            : null,
          { href: `/patients/${input.patientId}`, label: "ملف المريض" },
          { href: "/payments", label: "سجل المدفوعات" }
        ].filter(Boolean) as ActionBannerAction[]
      };
    default:
      return null;
  }
}

export default async function InvoiceDetailsPage({
  params,
  searchParams
}: InvoiceDetailsPageProps) {
  const user = await requirePermission("invoices:view");
  const { invoiceId } = await params;
  const resolvedSearchParams = await searchParams;
  const canManageInvoices = hasPermission(user.role, "invoices:*");
  const canRecordPayments = hasPermission(user.role, "payments:*");
  const invoice = await getInvoiceById(invoiceId);

  if (!invoice) {
    notFound();
  }

  const totalAmount = extractFormattedAmount(invoice.total);
  const paidAmount = extractFormattedAmount(invoice.paid);
  const balanceAmount = extractFormattedAmount(invoice.balance);
  const collectionProgress =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  const itemCount = invoice.items.length;
  const totalQuantity = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  const paymentCount = invoice.paymentHistory?.length ?? 0;
  const collectionGuidance = buildCollectionGuidance(invoice.status, balanceAmount);
  const invoiceSpotlight = getInvoiceSpotlight({
    spotlight: resolvedSearchParams?.spotlight,
    success: resolvedSearchParams?.success,
    invoiceId: invoice.id,
    patientId: invoice.patientId,
    balanceAmount,
    canRecordPayments
  });

  const itemRows = invoice.items.map((item) => ({
    service: item.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total: item.total
  }));
  const paymentRows =
    invoice.paymentHistory?.map((payment) => ({
      date: payment.date,
      amount: payment.amount,
      method: payment.method,
      notes: payment.notes ?? ""
    })) ?? [];
  const paymentTimelineEntries =
    invoice.paymentHistory?.map((payment) => ({
      id: payment.id,
      date: payment.date,
      title: `دفعة ${payment.amount}`,
      description:
        payment.notes && payment.notes.length > 0
          ? `${payment.notes} عبر ${getPaymentMethodLabel(payment.method)}.`
          : `تم تسجيل الدفعة عبر ${getPaymentMethodLabel(payment.method)}.`,
      status: "paid" as const,
      tone: "emerald" as const,
      href: `/payments`,
      hrefLabel: "فتح المدفوعات"
    })) ?? [];

  async function submitStatusForm(formData: FormData) {
    "use server";

    const result = await setInvoiceStatus({
      invoiceId: String(formData.get("invoiceId") ?? ""),
      nextStatus: String(formData.get("nextStatus") ?? "cancelled")
    });

    if (!result.ok) {
      redirect(
        `/invoices/${encodeURIComponent(invoiceId)}?error=${encodeURIComponent(
          result.message ?? "تعذر تحديث حالة الفاتورة."
        )}`
      );
    }

    redirect(
      `/invoices/${encodeURIComponent(invoiceId)}?success=${encodeURIComponent(
        result.message ?? "تم تحديث حالة الفاتورة بنجاح."
      )}`
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Invoice Collection"
        title={`الفاتورة ${invoice.id}`}
        description="صفحة تنفيذية أوضح لإدارة الفاتورة: البنود، التفصيل المالي، سجل الدفعات، وحالة التحصيل ضمن مشهد واحد للمحاسبة والإدارة."
        tips={[
          `إصدار: ${invoice.issueDate}`,
          `استحقاق: ${invoice.dueDate || "عند الإصدار"}`,
          `المريض: ${invoice.patient}`,
          collectionGuidance
        ]}
        actions={
          <>
            {canManageInvoices && invoice.status !== "cancelled" ? (
              <Link
                href={`/invoices/${invoice.id}/edit`}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
              >
                تعديل الفاتورة
              </Link>
            ) : null}
            {canRecordPayments && invoice.status !== "cancelled" ? (
              <Link
                href={buildPaymentCreatePath({
                  invoiceId: invoice.id,
                  patientId: invoice.patientId
                })}
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
              >
                تسجيل دفعة
              </Link>
            ) : null}
            <Link
              href={`/patients/${invoice.patientId}`}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              ملف المريض
            </Link>
            <Link
              href={`/invoices/${invoice.id}/print`}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              صفحة الطباعة
            </Link>
            <ExportCsvButton
              filename={`invoice-${invoice.id}-items`}
              rows={itemRows}
              label="تصدير البنود"
            />
          </>
        }
      />

      {resolvedSearchParams?.error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      {invoiceSpotlight ? <ActionBanner {...invoiceSpotlight} /> : null}

      {resolvedSearchParams?.success && !invoiceSpotlight ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {resolvedSearchParams.success}
        </div>
      ) : null}

      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {invoiceSections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={
                index === 0
                  ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              }
            >
              {section.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid-cards">
        <StatCard
          label="الإجمالي"
          value={`${formatMetricNumber(totalAmount)} JOD`}
          hint="القيمة الكاملة لهذه الفاتورة قبل الإغلاق أو الإلغاء."
        />
        <StatCard
          label="المحصّل"
          value={`${formatMetricNumber(paidAmount)} JOD`}
          hint="إجمالي المبلغ المسجل كدفعات على هذه الفاتورة."
        />
        <StatCard
          label="المتبقي"
          value={`${formatMetricNumber(balanceAmount)} JOD`}
          hint="المبلغ الذي ما يزال مفتوحًا ويحتاج متابعة."
        />
        <StatCard
          label="البنود / الدفعات"
          value={`${formatMetricNumber(itemCount)} / ${formatMetricNumber(paymentCount)}`}
          hint="عدد البنود التفصيلية مقابل عدد عمليات التحصيل المسجلة."
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr,0.9fr]">
        <section className="space-y-6">
          <div id="overview" className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-xl font-semibold text-ink">{invoice.patient}</div>
                  <StatusBadge status={invoice.status} />
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  هذه الصفحة توضح حالة الفاتورة ومسار التحصيل المرتبط بها، مع ربط مباشر
                  بملف المريض والطباعة وسجل الدفعات.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600">
                <div className="font-semibold text-ink">حالة التحصيل</div>
                <div className="mt-2">{collectionGuidance}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">تاريخ الإصدار</div>
                <div className="mt-2 font-semibold text-ink">{invoice.issueDate}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">الاستحقاق</div>
                <div className="mt-2 font-semibold text-ink">{invoice.dueDate || "عند الإصدار"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm text-slate-500">عدد الكميات</div>
                <div className="mt-2 font-semibold text-ink">{formatMetricNumber(totalQuantity)}</div>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <ProgressMeter value={collectionProgress} label="نسبة التحصيل من الفاتورة" />
            </div>

            {invoice.treatmentPlanTitle ? (
              <div className="mt-5 rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5">
                <div className="text-sm font-semibold text-brand-900">مرتبطة بخطة علاج</div>
                <p className="mt-3 text-sm leading-7 text-brand-950">{invoice.treatmentPlanTitle}</p>
              </div>
            ) : null}
          </div>

          <div id="items" className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-ink">بنود الفاتورة</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  عرض تفصيلي للخدمات والكميات وسعر الوحدة والإجمالي.
                </p>
              </div>
              <ExportCsvButton
                filename={`invoice-${invoice.id}-items`}
                rows={itemRows}
                label="تصدير البنود"
              />
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-right text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-4 font-medium">الخدمة</th>
                    <th className="px-3 py-4 font-medium">الكمية</th>
                    <th className="px-3 py-4 font-medium">السعر</th>
                    <th className="px-3 py-4 font-medium">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.length > 0 ? (
                    invoice.items.map((item) => (
                      <tr key={`${invoice.id}-${item.name}`} className="border-b border-slate-100">
                        <td className="px-3 py-4 text-slate-700">{item.name}</td>
                        <td className="px-3 py-4 text-slate-700">{item.quantity}</td>
                        <td className="px-3 py-4 text-slate-700">{item.unitPrice}</td>
                        <td className="px-3 py-4 font-semibold text-ink">{item.total}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-500">
                        لا توجد بنود تفصيلية ظاهرة لهذه الفاتورة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div id="collection" className="panel p-6">
            <div className="text-lg font-semibold text-ink">ملخص التحصيل</div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>الإجمالي قبل الخصومات</span>
                <span>{invoice.subtotal ?? invoice.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>الخصم</span>
                <span>{invoice.discount ?? "0.00 JOD"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>الضريبة</span>
                <span>{invoice.tax ?? "0.00 JOD"}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-ink">
                <span>المجموع النهائي</span>
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

            <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
              <div className="text-sm font-semibold text-amber-900">الخطوة التالية</div>
              <p className="mt-3 text-sm leading-7 text-amber-950">{collectionGuidance}</p>
            </div>
          </div>

          <div className="panel p-2">
            <ActivityTimeline
              title="سجل التحصيل"
              description="كل الدفعات المسجلة على هذه الفاتورة بترتيب زمني واضح."
              entries={paymentTimelineEntries}
              emptyTitle="لا توجد دفعات مسجلة بعد"
              emptyDescription="ستظهر هنا كل دفعة جديدة على هذه الفاتورة فور تسجيلها."
            />
          </div>

          {paymentRows.length > 0 ? (
            <div className="panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-lg font-semibold text-ink">تصدير سجل الدفعات</div>
                <ExportCsvButton
                  filename={`invoice-${invoice.id}-payments`}
                  rows={paymentRows}
                  label="تصدير الدفعات"
                />
              </div>
            </div>
          ) : null}

          {invoice.notes ? (
            <div id="notes" className="panel p-6">
              <div className="text-lg font-semibold text-ink">ملاحظات</div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                {invoice.notes}
              </div>
            </div>
          ) : null}

          {canManageInvoices &&
          !["cancelled", "paid", "partially_paid"].includes(invoice.status) ? (
            <form action={submitStatusForm} className="panel p-6">
              <input type="hidden" name="invoiceId" value={invoice.lookupId ?? invoice.id} />
              <input type="hidden" name="nextStatus" value="cancelled" />
              <div className="text-lg font-semibold text-ink">إجراء سريع</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                إذا كانت الفاتورة أُنشئت بالخطأ أو لن تُستكمل، يمكنك إلغاؤها من هنا.
              </p>
              <button
                type="submit"
                className="mt-5 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
              >
                إلغاء الفاتورة
              </button>
            </form>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
