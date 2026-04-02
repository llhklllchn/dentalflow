import Link from "next/link";
import { redirect } from "next/navigation";

import { ActionLinkStrip } from "@/components/shared/action-link-strip";
import { CollectionEmptyState } from "@/components/shared/collection-empty-state";
import { ContactActions } from "@/components/shared/contact-actions";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { NextStepCallout } from "@/components/shared/next-step-callout";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { QuickFilterStrip } from "@/components/shared/quick-filter-strip";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { WorkflowGuidePanel } from "@/components/shared/workflow-guide-panel";
import { setInvoiceStatus } from "@/features/invoices/actions/set-invoice-status";
import { getInvoicesList } from "@/features/invoices/queries/get-invoices-list";
import { requirePermission } from "@/lib/auth/guards";
import { getInvoiceMessagePresets } from "@/lib/contact/message-templates";
import { getWorkflowGuide } from "@/lib/constants/workflow-guides";
import { getInvoiceStatusOptions } from "@/lib/domain/labels";
import { normalizeInvoiceView } from "@/lib/filters/list-presets";
import { buildPaymentCreatePath, buildQueryPath } from "@/lib/navigation/create-flow";
import { hasPermission } from "@/lib/permissions/permissions";
import { getInvoiceNextStep } from "@/lib/recommendations/next-step";
import { extractFormattedAmount, formatMetricNumber } from "@/lib/utils/formatted-value";
import { InvoiceStatus } from "@/types/domain";

type InvoicesPageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: InvoiceStatus | "all";
    view?: string;
    error?: string;
    success?: string;
  }>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const resolvedSearchParams = await searchParams;
  const invoiceStatuses = getInvoiceStatusOptions();
  const invoiceStatusLabels = Object.fromEntries(
    invoiceStatuses.map((option) => [option.value, option.label])
  ) as Partial<Record<InvoiceStatus, string>>;
  const user = await requirePermission("invoices:view");
  const canManageInvoices = hasPermission(user.role, "invoices:*");
  const canRecordPayments = hasPermission(user.role, "payments:*");
  const canViewPatients = hasPermission(user.role, "patients:view");
  const workflowGuide = getWorkflowGuide("invoices", user.role);

  const search = resolvedSearchParams?.search?.trim();
  const status = resolvedSearchParams?.status ?? "all";
  const view = normalizeInvoiceView(resolvedSearchParams?.view?.trim().toLowerCase());
  const hasFilters = Boolean(search || status !== "all" || view !== "all");
  const invoices = await getInvoicesList({
    search,
    status,
    view
  });

  const visibleTotal = invoices.reduce(
    (sum, invoice) => sum + extractFormattedAmount(invoice.total),
    0
  );
  const outstandingTotal = invoices.reduce(
    (sum, invoice) => sum + extractFormattedAmount(invoice.balance),
    0
  );
  const paidInvoices = invoices.filter((invoice) => invoice.status === "paid").length;
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "overdue").length;
  const invoiceExportRows = invoices.map((invoice) => ({
    رقم_الفاتورة: invoice.id,
    المريض: invoice.patient,
    تاريخ_الإصدار: invoice.issueDate,
    الإجمالي: invoice.total,
    المدفوع: invoice.paid,
    المتبقي: invoice.balance,
    الحالة: invoiceStatusLabels[invoice.status] ?? invoice.status
  }));
  const quickFilterItems = [
    {
      label: "كل الفواتير",
      href: buildQueryPath("/invoices", {
        search,
        status: status !== "all" ? status : undefined
      }),
      active: view === "all"
    },
    {
      label: "تحتاج تحصيل",
      href: buildQueryPath("/invoices", {
        search,
        view: "attention"
      }),
      active: view === "attention"
    },
    {
      label: "برصيد مفتوح",
      href: buildQueryPath("/invoices", {
        search,
        view: "open_balance"
      }),
      active: view === "open_balance"
    },
    {
      label: "مدفوعة",
      href: buildQueryPath("/invoices", {
        search,
        view: "settled"
      }),
      active: view === "settled"
    }
  ];

  function getInvoiceActionItems(invoice: (typeof invoices)[number]) {
    return [
      canRecordPayments &&
      invoice.status !== "cancelled" &&
      extractFormattedAmount(invoice.balance) > 0
        ? {
            href: buildPaymentCreatePath({
              invoiceId: invoice.id,
              patientId: invoice.patientId
            }),
            label: "تسجيل دفعة",
            tone: "brand" as const
          }
        : null,
      canViewPatients
        ? {
            href: `/patients/${invoice.patientId}`,
            label: "ملف المريض"
          }
        : null
    ].filter(Boolean) as Array<{
      href: string;
      label: string;
      tone?: "default" | "brand" | "emerald";
    }>;
  }

  function getInvoiceRecommendation(invoice: (typeof invoices)[number]) {
    const suggestion = getInvoiceNextStep({
      status: invoice.status,
      balance: invoice.balance
    });

    const action =
      suggestion.actionKey === "record_payment" &&
      canRecordPayments &&
      invoice.status !== "cancelled"
        ? {
            href: buildPaymentCreatePath({
              invoiceId: invoice.id,
              patientId: invoice.patientId
            }),
            label: "سجل الدفعة الآن"
          }
        : suggestion.actionKey === "open_patient" && canViewPatients
          ? {
              href: `/patients/${invoice.patientId}`,
              label: "افتح ملف المريض"
            }
          : undefined;

    return {
      ...suggestion,
      actionHref: action?.href,
      actionLabel: action?.label
    };
  }

  async function submitStatusForm(formData: FormData) {
    "use server";

    const result = await setInvoiceStatus({
      invoiceId: String(formData.get("invoiceId") ?? ""),
      nextStatus: String(formData.get("nextStatus") ?? "cancelled")
    });

    const query = new URLSearchParams();
    const currentSearch = String(formData.get("search") ?? "");
    const currentStatus = String(formData.get("status") ?? "all");
    const currentView = String(formData.get("view") ?? "all");

    if (currentSearch) {
      query.set("search", currentSearch);
    }

    if (currentStatus) {
      query.set("status", currentStatus);
    }

    if (currentView && currentView !== "all") {
      query.set("view", currentView);
    }

    if (!result.ok) {
      query.set("error", result.message ?? "تعذر تحديث حالة الفاتورة.");
      redirect(`/invoices?${query.toString()}`);
    }

    query.set("success", result.message ?? "تم تحديث حالة الفاتورة بنجاح.");
    redirect(`/invoices?${query.toString()}`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Invoices"
        title="الفواتير"
        description="قراءة مالية أكثر نضجًا للفريق والإدارة، مع تصدير منظم وطباعة مباشرة ومراجعة الحالات والتحصيل من شاشة واحدة واضحة."
        tips={["تصدير CSV", "طباعة القائمة", "متابعة الأرصدة المفتوحة"]}
        actions={
          <>
            <ExportCsvButton
              filename="dentflow-invoices.csv"
              rows={invoiceExportRows}
              className="print:hidden"
            />
            <PrintButton label="طباعة الفواتير" className="print:hidden" />
            {canManageInvoices ? (
              <Link
                href="/invoices/new"
                className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white print:hidden"
              >
                إنشاء فاتورة
              </Link>
            ) : null}
          </>
        }
      />

      {resolvedSearchParams?.error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      {resolvedSearchParams?.success ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {resolvedSearchParams.success}
        </div>
      ) : null}

      <WorkflowGuidePanel guide={workflowGuide} />

      <div className="grid-cards">
        <StatCard
          label="الفواتير الظاهرة"
          value={formatMetricNumber(invoices.length)}
          hint="إجمالي النتائج الحالية بعد تطبيق البحث أو الحالة."
        />
        <StatCard
          label="إجمالي الفواتير"
          value={`${formatMetricNumber(visibleTotal)} JOD`}
          hint="قيمة الفواتير الظاهرة الآن."
        />
        <StatCard
          label="الرصيد المتبقي"
          value={`${formatMetricNumber(outstandingTotal)} JOD`}
          hint="الأرصدة المفتوحة التي تحتاج متابعة أو تحصيل."
        />
        <StatCard
          label="مدفوعة / متأخرة"
          value={`${formatMetricNumber(paidInvoices)} / ${formatMetricNumber(overdueInvoices)}`}
          hint="مقارنة سريعة بين السداد الكامل والفواتير المتأخرة."
        />
      </div>

      <div className="panel mt-6 p-6">
        <QuickFilterStrip
          title="اختصارات مالية جاهزة"
          description="انتقل بسرعة إلى الفواتير التي تحتاج تحصيل أو ما زالت برصيد مفتوح أو تلك التي أغلقت بالكامل."
          items={quickFilterItems}
        />

        <form
          method="get"
          className="mb-6 grid gap-3 print:hidden md:grid-cols-[1fr,220px,160px,140px]"
        >
          <input type="hidden" name="view" value={view === "all" ? "" : view} />
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="ابحث برقم الفاتورة أو اسم المريض أو الهاتف"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <option value="all">كل الحالات</option>
            {invoiceStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800"
          >
            تطبيق
          </button>
          <Link
            href="/invoices"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
          >
            مسح
          </Link>
        </form>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>
            {invoices.length} {invoices.length === 1 ? "فاتورة ظاهرة" : "فواتير ظاهرة"}
          </span>
          <span>من هنا يمكنك التصدير أو الطباعة أو فتح الفاتورة أو تعديلها أو إلغاؤها حسب الصلاحية.</span>
        </div>

        {invoices.length > 0 ? (
          <>
            <div className="space-y-4 md:hidden">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-ink">{invoice.id}</div>
                      <div className="mt-1 text-sm text-slate-500">{invoice.patient}</div>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs font-semibold text-slate-400">الإجمالي</div>
                      <div className="mt-1 text-sm font-semibold text-ink">{invoice.total}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs font-semibold text-slate-400">المتبقي</div>
                      <div className="mt-1 text-sm font-semibold text-ink">{invoice.balance}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm print:hidden">
                    <Link href={`/invoices/${invoice.id}`} className="font-semibold text-brand-700">
                      عرض
                    </Link>
                    {canManageInvoices && invoice.status !== "cancelled" ? (
                      <Link
                        href={`/invoices/${invoice.id}/edit`}
                        className="font-semibold text-slate-700"
                      >
                        تعديل
                      </Link>
                    ) : null}
                    {canManageInvoices &&
                    !["cancelled", "paid", "partially_paid"].includes(invoice.status) ? (
                      <form action={submitStatusForm}>
                        <input type="hidden" name="invoiceId" value={invoice.id} />
                        <input type="hidden" name="nextStatus" value="cancelled" />
                        <input type="hidden" name="search" value={search ?? ""} />
                        <input type="hidden" name="status" value={status} />
                        <input type="hidden" name="view" value={view} />
                        <button type="submit" className="font-semibold text-rose-700">
                          إلغاء
                        </button>
                      </form>
                    ) : null}
                  </div>

                  <ActionLinkStrip items={getInvoiceActionItems(invoice)} />
                  <NextStepCallout {...getInvoiceRecommendation(invoice)} />
                  <ContactActions
                    phone={invoice.patientPhone}
                    presets={getInvoiceMessagePresets({
                      patientName: invoice.patient,
                      invoiceId: invoice.id,
                      balance: invoice.balance,
                      status: invoice.status
                    })}
                  />
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-right text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-4 font-medium">رقم الفاتورة</th>
                    <th className="px-3 py-4 font-medium">المريض</th>
                    <th className="px-3 py-4 font-medium">الإجمالي</th>
                    <th className="px-3 py-4 font-medium">المدفوع</th>
                    <th className="px-3 py-4 font-medium">المتبقي</th>
                    <th className="px-3 py-4 font-medium">الحالة</th>
                    <th className="px-3 py-4 font-medium print:hidden">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-4">
                        <Link href={`/invoices/${invoice.id}`} className="font-semibold text-brand-700">
                          {invoice.id}
                        </Link>
                        <div className="mt-1 text-xs text-slate-500">{invoice.issueDate}</div>
                      </td>
                      <td className="px-3 py-4 text-slate-600">{invoice.patient}</td>
                      <td className="px-3 py-4 text-slate-600">{invoice.total}</td>
                      <td className="px-3 py-4 text-slate-600">{invoice.paid}</td>
                      <td className="px-3 py-4 text-slate-600">{invoice.balance}</td>
                      <td className="px-3 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-3 py-4 print:hidden">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Link href={`/invoices/${invoice.id}`} className="font-semibold text-brand-700">
                            عرض
                          </Link>

                          {canManageInvoices && invoice.status !== "cancelled" ? (
                            <Link
                              href={`/invoices/${invoice.id}/edit`}
                              className="font-semibold text-slate-700"
                            >
                              تعديل
                            </Link>
                          ) : null}

                          {canManageInvoices &&
                          !["cancelled", "paid", "partially_paid"].includes(invoice.status) ? (
                            <form action={submitStatusForm}>
                              <input type="hidden" name="invoiceId" value={invoice.id} />
                              <input type="hidden" name="nextStatus" value="cancelled" />
                              <input type="hidden" name="search" value={search ?? ""} />
                              <input type="hidden" name="status" value={status} />
                              <input type="hidden" name="view" value={view} />
                              <button type="submit" className="font-semibold text-rose-700">
                                إلغاء
                              </button>
                            </form>
                          ) : null}
                        </div>
                        <ActionLinkStrip items={getInvoiceActionItems(invoice)} />
                        <NextStepCallout {...getInvoiceRecommendation(invoice)} />
                        <ContactActions
                          phone={invoice.patientPhone}
                          presets={getInvoiceMessagePresets({
                            patientName: invoice.patient,
                            invoiceId: invoice.id,
                            balance: invoice.balance,
                            status: invoice.status
                          })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <CollectionEmptyState
            title={hasFilters ? "لا توجد فواتير مطابقة" : "لا توجد فواتير بعد"}
            description={
              hasFilters
                ? "غيّر البحث أو الحالة الحالية، أو امسح الفلاتر للعودة إلى كامل السجل المالي."
                : "ابدأ بإنشاء أول فاتورة ليظهر عندك سجل مالي منظم وقابل للطباعة والتصدير."
            }
            primaryAction={
              canManageInvoices
                ? {
                    href: "/invoices/new",
                    label: "إنشاء فاتورة جديدة"
                  }
                : undefined
            }
            secondaryAction={
              hasFilters
                ? {
                    href: "/invoices",
                    label: "مسح الفلاتر"
                  }
                : undefined
            }
            highlights={["تحصيل أوضح", "تصدير منظم", "طباعة مباشرة"]}
          />
        )}
      </div>
    </div>
  );
}
