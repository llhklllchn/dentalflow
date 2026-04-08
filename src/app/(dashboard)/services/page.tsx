import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { createService } from "@/features/services-catalog/actions/create-service";
import { setServiceActiveState } from "@/features/services-catalog/actions/set-service-active-state";
import { updateService } from "@/features/services-catalog/actions/update-service";
import { getServicesList } from "@/features/services-catalog/queries/get-services-list";
import { requirePermission } from "@/lib/auth/guards";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

type ServicesPageProps = {
  searchParams?: Promise<{
    q?: string;
    success?: string;
    error?: string;
  }>;
};

function buildServicesPath(searchTerm?: string, params?: { success?: string; error?: string }) {
  const query = new URLSearchParams();

  if (searchTerm) {
    query.set("q", searchTerm);
  }

  if (params?.success) {
    query.set("success", params.success);
  }

  if (params?.error) {
    query.set("error", params.error);
  }

  const serialized = query.toString();
  return serialized ? `/services?${serialized}` : "/services";
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("services:*");

  const searchTerm = resolvedSearchParams?.q?.trim() ?? "";
  const services = await getServicesList({
    search: searchTerm,
    includeInactive: true
  });
  const activeServices = services.filter((service) => service.isActive !== false).length;
  const inactiveServices = services.filter((service) => service.isActive === false).length;
  const averageDuration = services.length
    ? Math.round(
        services.reduce(
          (sum, service) => sum + (service.defaultDurationMinutes ?? 30),
          0
        ) / services.length
      )
    : 0;
  const averagePrice = services.length
    ? services.reduce((sum, service) => sum + (service.priceValue ?? 0), 0) / services.length
    : 0;
  const highestPricedService = [...services].sort(
    (left, right) => (right.priceValue ?? 0) - (left.priceValue ?? 0)
  )[0];

  async function submitServiceForm(formData: FormData) {
    "use server";

    const result = await createService({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      defaultDurationMinutes: Number(formData.get("defaultDurationMinutes") ?? 30),
      price: Number(formData.get("price") ?? 0)
    });

    if (!result.ok) {
      redirect(buildServicesPath(searchTerm, { error: result.message ?? "تعذر إنشاء الخدمة." }));
    }

    redirect(buildServicesPath(searchTerm, { success: result.message ?? "تم إنشاء الخدمة." }));
  }

  async function submitServiceUpdateForm(formData: FormData) {
    "use server";

    const result = await updateService({
      serviceId: String(formData.get("serviceId") ?? ""),
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      defaultDurationMinutes: Number(formData.get("defaultDurationMinutes") ?? 30),
      price: Number(formData.get("price") ?? 0)
    });

    if (!result.ok) {
      redirect(buildServicesPath(searchTerm, { error: result.message ?? "تعذر تحديث الخدمة." }));
    }

    redirect(buildServicesPath(searchTerm, { success: result.message ?? "تم تحديث الخدمة." }));
  }

  async function submitServiceStateForm(formData: FormData) {
    "use server";

    const result = await setServiceActiveState({
      serviceId: String(formData.get("serviceId") ?? ""),
      isActive: String(formData.get("isActive") ?? "false") === "true"
    });

    if (!result.ok) {
      redirect(
        buildServicesPath(searchTerm, { error: result.message ?? "تعذر تحديث حالة الخدمة." })
      );
    }

    redirect(
      buildServicesPath(searchTerm, { success: result.message ?? "تم تحديث حالة الخدمة." })
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="الخدمات"
        title="الخدمات"
        description="كتالوج علاجي أقوى يحدد ما يمكن جدولته وفوترته وربطه بخطط العلاج، مع قراءة أسرع للأسعار والمدد وحالة التفعيل."
        tips={["ثبت الأسعار الأساسية", "راجع الخدمات المعطلة", "وحد مدد الخدمات الشائعة"]}
        actions={
          <>
            <Link
              href="/invoices/new"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              فاتورة جديدة
            </Link>
            <a
              href="#new-service"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              خدمة جديدة
            </a>
          </>
        }
      />

      {resolvedSearchParams?.success ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {resolvedSearchParams.success}
        </div>
      ) : null}
      {resolvedSearchParams?.error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <div className="grid-cards">
        <StatCard
          label="إجمالي الخدمات"
          value={formatMetricNumber(services.length)}
          hint="كل الخدمات المطابقة للبحث الحالي بما فيها المفعلة والمعطلة."
          badgeLabel="الخدمات"
        />
        <StatCard
          label="خدمات مفعلة"
          value={formatMetricNumber(activeServices)}
          hint="الخدمات التي يمكن استخدامها الآن في المواعيد والفواتير وخطط العلاج."
          badgeLabel="الخدمات"
        />
        <StatCard
          label="متوسط المدة"
          value={`${formatMetricNumber(averageDuration)} دقيقة`}
          hint="متوسط مدة التنفيذ الافتراضية للخدمات الظاهرة حاليًا."
          badgeLabel="الخدمات"
        />
        <StatCard
          label="متوسط السعر"
          value={`${formatMetricNumber(averagePrice)} JOD`}
          hint="متوسط سعري تقريبي يساعدك على قراءة مستوى التسعير العام داخل الكتالوج."
          badgeLabel="الخدمات"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section id="new-service" className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-ink">إضافة خدمة جديدة</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                أضف الخدمة الأساسية مرة واحدة ثم استخدمها عبر المواعيد وخطط العلاج والفواتير
                بدون تكرار أو تضارب في التسعير.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              خدمات معطلة: {formatMetricNumber(inactiveServices)}
            </span>
          </div>

          <form action={submitServiceForm} className="mt-5 grid gap-4 md:grid-cols-4">
            <input
              name="name"
              required
              placeholder="اسم الخدمة"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
            <input
              name="defaultDurationMinutes"
              type="number"
              placeholder="المدة بالدقائق"
              defaultValue={30}
              min={5}
              step={5}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
            <input
              name="price"
              type="number"
              step="0.01"
              min={0}
              required
              placeholder="السعر"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
            <button
              type="submit"
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              حفظ الخدمة
            </button>
            <textarea
              name="description"
              placeholder="وصف مختصر يوضح متى تستخدم هذه الخدمة أو ما الذي تتضمنه"
              className="min-h-28 rounded-2xl border border-slate-300 bg-white px-4 py-3 md:col-span-4"
            />
          </form>

          <div className="mt-6 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
            <div className="text-sm font-semibold text-brand-900">ما الذي يجعل الكتالوج قويًا؟</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                اسم واضح يمنع التكرار والالتباس بين الاستقبال والطبيب والمحاسبة.
              </div>
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                مدة واقعية تعكس الجدولة الفعلية وتقلل التضارب في المواعيد.
              </div>
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                سعر أساسي مضبوط يجعل الفاتورة والخطة العلاجية أكثر اتساقًا وسرعة.
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">قراءة الكتالوج</div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <div className="text-slate-500">أعلى خدمة سعرًا</div>
                <div className="mt-1 font-semibold text-ink">
                  {highestPricedService?.name ?? "لا توجد بيانات"}
                </div>
                <div className="mt-1 text-slate-500">{highestPricedService?.price ?? "—"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <div className="text-slate-500">الخدمات المفعلة</div>
                <div className="mt-1 font-semibold text-ink">
                  {formatMetricNumber(activeServices)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <div className="text-slate-500">الخدمات المعطلة</div>
                <div className="mt-1 font-semibold text-ink">
                  {formatMetricNumber(inactiveServices)}
                </div>
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">إشارات تشغيلية</div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                لا تعطل الخدمة إذا كانت مستخدمة يوميًا إلا بعد التأكد من وجود بديل واضح للفريق.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                ارتفاع متوسط السعر لا يعني مشكلة، لكن يستحق مراجعة إذا لم يكن متوافقًا مع السوق
                أو نوع المرضى المستهدف.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                راجع الخدمات الطويلة زمنيًا لأنها تؤثر مباشرة في كثافة الجدول اليومي.
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="panel mt-6 p-6">
        <form method="get" className="mb-6 grid gap-3 md:grid-cols-[1fr,140px,120px]">
          <input
            name="q"
            defaultValue={searchTerm}
            placeholder="ابحث باسم الخدمة أو وصفها"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
          />
          <button
            type="submit"
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
          >
            بحث
          </button>
          <Link
            href="/services"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-center text-sm font-semibold text-slate-700"
          >
            إعادة ضبط
          </Link>
        </form>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>{services.length} خدمة ظاهرة</span>
          <span>{activeServices} مفعلة</span>
          <span>{inactiveServices} معطلة</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {services.map((service) => (
            <div key={service.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold text-ink">{service.name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {service.description || "لا يوجد وصف لهذه الخدمة بعد."}
                  </div>
                </div>
                <StatusBadge status={service.isActive === false ? "inactive" : "active"} />
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="text-slate-500">المدة الحالية</div>
                  <div className="mt-1 font-semibold text-ink">{service.duration}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="text-slate-500">السعر الحالي</div>
                  <div className="mt-1 font-semibold text-ink">{service.price}</div>
                </div>
              </div>

              <form action={submitServiceUpdateForm} className="grid gap-3">
                <input type="hidden" name="serviceId" value={service.id} />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    name="name"
                    defaultValue={service.name}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                  <input
                    name="defaultDurationMinutes"
                    type="number"
                    min={5}
                    step={5}
                    defaultValue={service.defaultDurationMinutes ?? 30}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr,140px]">
                  <textarea
                    name="description"
                    defaultValue={service.description ?? ""}
                    className="min-h-24 rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                  <input
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={service.priceValue ?? 0}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
                >
                  حفظ التعديل
                </button>
              </form>

              <form action={submitServiceStateForm} className="mt-3">
                <input type="hidden" name="serviceId" value={service.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={service.isActive === false ? "true" : "false"}
                />
                <button
                  type="submit"
                  className={
                    service.isActive === false
                      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800"
                      : "rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800"
                  }
                >
                  {service.isActive === false ? "إعادة تفعيل الخدمة" : "تعطيل الخدمة"}
                </button>
              </form>
            </div>
          ))}
        </div>

        {services.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            لم يتم العثور على خدمات تطابق البحث الحالي.
          </div>
        ) : null}
      </div>
    </div>
  );
}
