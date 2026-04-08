import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { createDentistProfile } from "@/features/dentists/actions/create-dentist-profile";
import { getAvailableDentistUsers } from "@/features/dentists/queries/get-available-dentist-users";
import { getDentistsList } from "@/features/dentists/queries/get-dentists-list";
import { requirePermission } from "@/lib/auth/guards";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

type DentistsPageProps = {
  searchParams?: Promise<{
    search?: string;
    error?: string;
    success?: string;
  }>;
};

function buildDentistsPath(search?: string, params?: { error?: string; success?: string }) {
  const query = new URLSearchParams();

  if (search) {
    query.set("search", search);
  }

  if (params?.error) {
    query.set("error", params.error);
  }

  if (params?.success) {
    query.set("success", params.success);
  }

  const serialized = query.toString();
  return serialized ? `/dentists?${serialized}` : "/dentists";
}

function toMinutes(value?: string) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTimeLabel(totalMinutes: number | null) {
  if (totalMinutes === null) {
    return "غير متوفر";
  }

  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default async function DentistsPage({ searchParams }: DentistsPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("dentists:*");
  const search = resolvedSearchParams?.search?.trim();

  const [dentists, availableUsers] = await Promise.all([
    getDentistsList({ search }),
    getAvailableDentistUsers()
  ]);

  const licensedDentists = dentists.filter((dentist) => dentist.licenseNumber).length;
  const averageDuration = dentists.length
    ? Math.round(
        dentists.reduce(
          (sum, dentist) => sum + (dentist.defaultAppointmentDuration ?? 30),
          0
        ) / dentists.length
      )
    : 0;
  const specialtyCount = new Set(dentists.map((dentist) => dentist.specialty)).size;
  const earliestStart = dentists.reduce<number | null>((current, dentist) => {
    const parsed = toMinutes(dentist.startTime);
    if (parsed === null) {
      return current;
    }

    if (current === null || parsed < current) {
      return parsed;
    }

    return current;
  }, null);
  const latestEnd = dentists.reduce<number | null>((current, dentist) => {
    const parsed = toMinutes(dentist.endTime);
    if (parsed === null) {
      return current;
    }

    if (current === null || parsed > current) {
      return parsed;
    }

    return current;
  }, null);

  async function submitDentistForm(formData: FormData) {
    "use server";

    const result = await createDentistProfile({
      userId: String(formData.get("userId") ?? ""),
      specialty: String(formData.get("specialty") ?? "") || undefined,
      licenseNumber: String(formData.get("licenseNumber") ?? "") || undefined,
      colorCode: String(formData.get("colorCode") ?? "") || undefined,
      defaultAppointmentDuration: Number(formData.get("defaultAppointmentDuration") ?? 30),
      startTime: String(formData.get("startTime") ?? "09:00"),
      endTime: String(formData.get("endTime") ?? "17:00")
    });

    if (!result.ok) {
      redirect(buildDentistsPath(search, { error: result.message ?? "تعذر إنشاء ملف الطبيب." }));
    }

    redirect(buildDentistsPath(search, { success: "تمت إضافة ملف الطبيب بنجاح." }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="الأطباء"
        title="الأطباء"
        description="إدارة الفريق الطبي بصياغة أوضح: ربط الطبيب بحسابه، قراءة التغطية اليومية، ومراجعة التخصصات وساعات العمل من نفس الشاشة."
        tips={["اربط الحساب قبل الجدولة", "راجع التغطية الزمنية", "ثبت مدة الجلسة الافتراضية"]}
        actions={
          <>
            <Link
              href="/appointments"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              فتح المواعيد
            </Link>
            <Link
              href="/staff"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              إدارة الموظفين
            </Link>
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

      <div className="grid-cards">
        <StatCard
          label="الأطباء الظاهرون"
          value={formatMetricNumber(dentists.length)}
          hint="عدد ملفات الأطباء المطابقة للبحث الحالي أو المعروضة الآن داخل العيادة."
          badgeLabel="الأطباء"
        />
        <StatCard
          label="حسابات قابلة للربط"
          value={formatMetricNumber(availableUsers.length)}
          hint="مستخدمون بدور طبيب ما زالوا بانتظار إنشاء ملفهم التشغيلي وربطهم بالجدول."
          badgeLabel="الأطباء"
        />
        <StatCard
          label="تخصصات ظاهرة"
          value={formatMetricNumber(specialtyCount)}
          hint="عدد التخصصات المختلفة بين الأطباء المعروضين حاليًا في هذه الصفحة."
          badgeLabel="الأطباء"
        />
        <StatCard
          label="متوسط الجلسة"
          value={`${formatMetricNumber(averageDuration)} دقيقة`}
          hint="متوسط مدة الجلسة الافتراضية للأطباء الظاهرين حاليًا."
          badgeLabel="الأطباء"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section id="link-dentist" className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-ink">ربط مستخدم بملف طبيب</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                هذه الخطوة تنقل المستخدم من مجرد حساب فريق إلى طبيب قابل للجدولة وربط المواعيد
                والخطط والسجلات به.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              مرشحون للربط: {formatMetricNumber(availableUsers.length)}
            </span>
          </div>

          {availableUsers.length > 0 ? (
            <>
              <form action={submitDentistForm} className="mt-5 grid gap-4 md:grid-cols-3">
                <select
                  name="userId"
                  defaultValue={availableUsers[0]?.id}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                >
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} | {user.email}
                    </option>
                  ))}
                </select>
                <input
                  name="specialty"
                  placeholder="التخصص"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  name="licenseNumber"
                  placeholder="رقم الترخيص"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  name="defaultAppointmentDuration"
                  type="number"
                  defaultValue={30}
                  min={15}
                  step={5}
                  placeholder="مدة الجلسة"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  name="colorCode"
                  type="color"
                  defaultValue="#0F766E"
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-2 py-2"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="startTime"
                    type="time"
                    defaultValue="09:00"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                  <input
                    name="endTime"
                    type="time"
                    defaultValue="17:00"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white md:col-span-3"
                >
                  إنشاء ملف الطبيب
                </button>
              </form>

              <div className="mt-6 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
                <div className="text-sm font-semibold text-brand-900">لماذا يهم هذا الربط؟</div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                    يحدد اللون والمدة الافتراضية شكل التقويم وسرعة إنشاء الموعد.
                  </div>
                  <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                    ساعات العمل تضبط التغطية اليومية وتقلل التضارب بين الجداول.
                  </div>
                  <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                    التخصص والترخيص يسهلان التصنيف الداخلي ويقويان الجاهزية التشغيلية.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-brand-100 bg-brand-50 px-4 py-4 text-sm leading-7 text-brand-900">
              لا يوجد حاليًا مستخدمون بدور طبيب بدون ملف تشغيلي. ادعُ طبيبًا من صفحة الموظفين ثم
              عد إلى هنا لإكمال الربط.
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">تغطية اليوم</div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <div className="text-slate-500">أول دوام ظاهر</div>
                <div className="mt-1 font-semibold text-ink">{formatTimeLabel(earliestStart)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <div className="text-slate-500">آخر دوام ظاهر</div>
                <div className="mt-1 font-semibold text-ink">{formatTimeLabel(latestEnd)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <div className="text-slate-500">ملفات بترخيص</div>
                <div className="mt-1 font-semibold text-ink">
                  {formatMetricNumber(licensedDentists)}
                </div>
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">إشارات سريعة</div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                إذا زاد عدد الحسابات القابلة للربط، راجع صفحة الموظفين أولًا لتقليل التشتت قبل
                بدء الجدولة.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                اختلاف مدد الجلسات بين الأطباء يفيد، لكنه يحتاج ضبطًا دقيقًا حتى لا يتشوه
                التقويم اليومي.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                راقب بداية ونهاية التغطية اليومية لمعرفة إن كنت تحتاج توسيع ساعات العمل أو إعادة
                توزيع الفريق.
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="panel mt-6 p-6">
        <form method="get" className="mb-6 grid gap-3 md:grid-cols-[1fr,160px,120px]">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="ابحث باسم الطبيب أو التخصص أو رقم الترخيص"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          />
          <button
            type="submit"
            className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800"
          >
            تطبيق
          </button>
          <Link
            href="/dentists"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
          >
            مسح
          </Link>
        </form>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>{dentists.length} ملفًا ظاهرًا</span>
          <span>{licensedDentists} بترخيص محفوظ</span>
          <span>{specialtyCount} تخصصات</span>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {dentists.map((dentist) => (
            <div key={dentist.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-4 w-4 rounded-full ring-4 ring-slate-100"
                    style={{ backgroundColor: dentist.color }}
                  />
                  <div>
                    <div className="text-xl font-semibold text-ink">{dentist.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{dentist.specialty}</div>
                  </div>
                </div>
                <Link
                  href={`/dentists/${dentist.id}/edit`}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  تعديل
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="text-slate-500">ساعات العمل</div>
                  <div className="mt-1 font-semibold text-ink">{dentist.hours}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="text-slate-500">مدة الجلسة</div>
                  <div className="mt-1 font-semibold text-ink">
                    {dentist.defaultAppointmentDuration ?? 30} دقيقة
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:col-span-2">
                  <div className="text-slate-500">رقم الترخيص</div>
                  <div className="mt-1 font-semibold text-ink">
                    {dentist.licenseNumber || "غير محدد"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {dentists.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            لا يوجد أطباء مطابقون للبحث الحالي.
          </div>
        ) : null}
      </div>
    </div>
  );
}
