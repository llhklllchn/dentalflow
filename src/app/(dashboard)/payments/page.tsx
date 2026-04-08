import Link from "next/link";

import { CollectionEmptyState } from "@/components/shared/collection-empty-state";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { QuickFilterStrip } from "@/components/shared/quick-filter-strip";
import { StatCard } from "@/components/shared/stat-card";
import { WorkflowGuidePanel } from "@/components/shared/workflow-guide-panel";
import { getPaymentsList } from "@/features/payments/queries/get-payments-list";
import { requirePermission } from "@/lib/auth/guards";
import { getWorkflowGuide } from "@/lib/constants/workflow-guides";
import { normalizePaymentRange } from "@/lib/filters/list-presets";
import { buildQueryPath } from "@/lib/navigation/create-flow";
import { extractFormattedAmount, formatMetricNumber } from "@/lib/utils/formatted-value";

type PaymentsPageProps = {
  searchParams?: Promise<{
    search?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
    range?: string;
  }>;
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

function getPaymentMethodTone(method: string) {
  switch (method) {
    case "cash":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "card":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "transfer":
      return "border-amber-200 bg-amber-50 text-amber-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await requirePermission("payments:*");
  const workflowGuide = getWorkflowGuide("payments", user.role);

  const search = resolvedSearchParams?.search?.trim();
  const method = resolvedSearchParams?.method ?? "all";
  const dateFrom = resolvedSearchParams?.dateFrom ?? "";
  const dateTo = resolvedSearchParams?.dateTo ?? "";
  const range = normalizePaymentRange(resolvedSearchParams?.range?.trim().toLowerCase());
  const hasFilters = Boolean(search || method !== "all" || dateFrom || dateTo || range !== "all");
  const payments = await getPaymentsList({
    search,
    method,
    dateFrom,
    dateTo,
    range
  });

  const totalCollected = payments.reduce(
    (sum, payment) => sum + extractFormattedAmount(payment.amount),
    0
  );
  const cashPayments = payments.filter((payment) => payment.method === "cash").length;
  const cardPayments = payments.filter((payment) => payment.method === "card").length;
  const uniqueMethods = new Set(payments.map((payment) => payment.method)).size;
  const latestPayment = payments[0];
  const paymentExportRows = payments.map((payment) => ({
    المريض: payment.patient,
    رقم_الفاتورة: payment.invoiceId,
    المبلغ: payment.amount,
    الطريقة: getPaymentMethodLabel(payment.method),
    التاريخ: payment.date
  }));
  const quickFilterItems = [
    {
      label: "كل الفترات",
      href: buildQueryPath("/payments", {
        search,
        method: method !== "all" ? method : undefined,
        dateFrom,
        dateTo
      }),
      active: range === "all"
    },
    {
      label: "اليوم",
      href: buildQueryPath("/payments", {
        search,
        method: method !== "all" ? method : undefined,
        range: "today"
      }),
      active: range === "today"
    },
    {
      label: "آخر 7 أيام",
      href: buildQueryPath("/payments", {
        search,
        method: method !== "all" ? method : undefined,
        range: "7d"
      }),
      active: range === "7d"
    },
    {
      label: "آخر 30 يومًا",
      href: buildQueryPath("/payments", {
        search,
        method: method !== "all" ? method : undefined,
        range: "30d"
      }),
      active: range === "30d"
    }
  ];

  return (
    <div>
      <PageHeader
        eyebrow="المدفوعات"
        title="المدفوعات"
        description="سجل تحصيل متقدم لمراجعة الدفعات بسرعة، مع طباعة وتصدير منظم وربط مباشر بالفاتورة وملف المريض من نفس الواجهة."
        tips={["فلترة زمنية", "تصدير CSV", "طباعة السجل"]}
        actions={
          <>
            <ExportCsvButton
              filename="dentflow-payments.csv"
              rows={paymentExportRows}
              className="print:hidden"
            />
            <PrintButton label="طباعة السجل" className="print:hidden" />
            <Link
              href="/payments/new"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white print:hidden"
            >
              تسجيل دفعة
            </Link>
          </>
        }
      />

      <WorkflowGuidePanel guide={workflowGuide} />

      <div className="grid-cards">
        <StatCard
          label="الدفعات الظاهرة"
          value={formatMetricNumber(payments.length)}
          hint="عدد السجلات الحالية بعد تطبيق البحث أو الفلترة."
          badgeLabel="التحصيل"
        />
        <StatCard
          label="إجمالي التحصيل"
          value={`${formatMetricNumber(totalCollected)} JOD`}
          hint="إجمالي المبالغ الظاهرة في الصفحة الحالية."
          badgeLabel="التحصيل"
        />
        <StatCard
          label="دفعات نقدية"
          value={formatMetricNumber(cashPayments)}
          hint="عدد السجلات التي تم تحصيلها نقدًا."
          badgeLabel="التحصيل"
        />
        <StatCard
          label="طرق سداد ظاهرة"
          value={formatMetricNumber(uniqueMethods)}
          hint="عدد أنواع طرق الدفع داخل النتائج الحالية."
          badgeLabel="التحصيل"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-ink">قراءة التحصيل</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                مساحة سريعة لفهم توزيع الدفعات قبل الدخول في تفاصيل كل سجل أو تصدير النتائج.
              </p>
            </div>
            {latestPayment ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                آخر دفعة: {latestPayment.date}
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">التحصيل بالبطاقات</div>
              <div className="mt-4 text-3xl font-bold text-ink">
                {formatMetricNumber(cardPayments)}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">
                عدد العمليات التي تمت عبر البطاقات ضمن النتائج الحالية.
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">متوسط قيمة السجل</div>
              <div className="mt-4 text-3xl font-bold text-ink">
                {payments.length > 0
                  ? `${formatMetricNumber(totalCollected / payments.length)} JOD`
                  : "0 JOD"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">
                متوسط تقديري لقيمة الدفعة الواحدة في النتائج الحالية.
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold text-slate-500">آخر حركة</div>
              <div className="mt-4 text-xl font-bold text-ink">
                {latestPayment ? latestPayment.patient : "لا توجد دفعات"}
              </div>
              <div className="mt-3 text-sm leading-7 text-slate-600">
                {latestPayment
                  ? `${latestPayment.amount} عبر ${getPaymentMethodLabel(latestPayment.method)}`
                  : "ستظهر هنا آخر دفعة مسجلة عند وجود بيانات."}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
            <div className="text-sm font-semibold text-brand-900">ملاحظات سريعة</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                إذا زادت الدفعات النقدية كثيرًا، راقب المطابقة اليومية بين الصندوق والسجل.
              </div>
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                افتح الفاتورة مباشرة من أي سجل للتأكد من انعكاس الدفعة على الرصيد المتبقي.
              </div>
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                استخدم الفلترة الزمنية لمراجعة تحصيل يومي أو أسبوعي ثم صدّره عند الحاجة.
              </div>
            </div>
          </div>
        </section>

        <aside className="panel p-6">
          <div className="text-xl font-semibold text-ink">فلاتر التحصيل</div>
          <QuickFilterStrip
            title="فترات جاهزة"
            description="انتقل مباشرة إلى دفعات اليوم أو الأسبوع أو الشهر دون تعبئة التواريخ يدويًا في كل مرة."
            items={quickFilterItems}
          />
          <form method="get" className="mt-5 grid gap-3 print:hidden">
            <input type="hidden" name="range" value={range === "all" ? "" : range} />
            <input
              name="search"
              defaultValue={search ?? ""}
              placeholder="ابحث بالمريض أو رقم الفاتورة"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
            />
            <select
              name="method"
              defaultValue={method}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
            >
              <option value="all">كل الطرق</option>
              <option value="cash">نقدًا</option>
              <option value="card">بطاقة</option>
              <option value="transfer">تحويل</option>
              <option value="mixed">مختلط</option>
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="dateFrom"
                type="date"
                defaultValue={dateFrom}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
              />
              <input
                name="dateTo"
                type="date"
                defaultValue={dateTo}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="submit"
                className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800"
              >
                تطبيق
              </button>
              <Link
                href="/payments"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
              >
                مسح
              </Link>
            </div>
          </form>

          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              الدفعات الظاهرة: {payments.length}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              إجمالي التحصيل: {formatMetricNumber(totalCollected)} JOD
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              آخر دفعة: {latestPayment?.date ?? "لا توجد بيانات"}
            </div>
          </div>
        </aside>
      </div>

      <div className="panel mt-6 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xl font-semibold text-ink">سجل المدفوعات</div>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              افتح ملف المريض أو الفاتورة من نفس السجل، وراجع طريقة السداد والتاريخ والمبلغ دون
              مغادرة الشاشة.
            </p>
          </div>
          <div className="text-sm text-slate-500">{payments.length} سجلًا ظاهرًا</div>
        </div>

        {payments.length > 0 ? (
          <>
            <div className="space-y-4 md:hidden">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-ink">{payment.patient}</div>
                      <div className="mt-1 text-sm text-slate-500">{payment.invoiceId}</div>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentMethodTone(
                        payment.method
                      )}`}
                    >
                      {getPaymentMethodLabel(payment.method)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs font-semibold text-slate-400">المبلغ</div>
                      <div className="mt-1 text-sm font-semibold text-ink">{payment.amount}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="text-xs font-semibold text-slate-400">التاريخ</div>
                      <div className="mt-1 text-sm font-semibold text-ink">{payment.date}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm print:hidden">
                    <Link href={`/patients/${payment.patientId}`} className="font-semibold text-brand-700">
                      ملف المريض
                    </Link>
                    <Link href={`/invoices/${payment.invoiceId}`} className="font-semibold text-slate-700">
                      الفاتورة
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-right text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-4 font-medium">المريض</th>
                    <th className="px-3 py-4 font-medium">الفاتورة</th>
                    <th className="px-3 py-4 font-medium">المبلغ</th>
                    <th className="px-3 py-4 font-medium">الطريقة</th>
                    <th className="px-3 py-4 font-medium">التاريخ</th>
                    <th className="px-3 py-4 font-medium print:hidden">روابط</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100">
                      <td className="px-3 py-4 text-slate-700">{payment.patient}</td>
                      <td className="px-3 py-4 text-slate-700">{payment.invoiceId}</td>
                      <td className="px-3 py-4 text-slate-700">{payment.amount}</td>
                      <td className="px-3 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentMethodTone(
                            payment.method
                          )}`}
                        >
                          {getPaymentMethodLabel(payment.method)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-slate-700">{payment.date}</td>
                      <td className="px-3 py-4 print:hidden">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link href={`/patients/${payment.patientId}`} className="font-semibold text-brand-700">
                            المريض
                          </Link>
                          <Link href={`/invoices/${payment.invoiceId}`} className="font-semibold text-slate-700">
                            الفاتورة
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <CollectionEmptyState
            title={hasFilters ? "لا توجد مدفوعات مطابقة" : "لا توجد مدفوعات بعد"}
            description={
              hasFilters
                ? "جرّب تعديل التاريخ أو طريقة الدفع أو امسح الفلاتر الحالية للعودة إلى السجل الكامل."
                : "ابدأ بتسجيل أول دفعة ليظهر لديك سجل تحصيل واضح وقابل للطباعة والتصدير."
            }
            primaryAction={{
              href: "/payments/new",
              label: "تسجيل دفعة جديدة"
            }}
            secondaryAction={
              hasFilters
                ? {
                    href: "/payments",
                    label: "مسح الفلاتر"
                  }
                : undefined
            }
            highlights={["سجل تحصيل واضح", "ربط بالفواتير", "تصدير ومراجعة أسرع"]}
          />
        )}
      </div>
    </div>
  );
}
