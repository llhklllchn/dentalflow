import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { SignalCard } from "@/components/shared/signal-card";
import { StatCard } from "@/components/shared/stat-card";
import { updateClinicSettings } from "@/features/clinics/actions/update-clinic-settings";
import { getSettingsOverview } from "@/features/clinics/queries/get-settings-overview";
import { requirePermission } from "@/lib/auth/guards";
import { getLaunchReadinessSummary } from "@/lib/config/launch-readiness";
import { getNotificationChannelLabel } from "@/lib/domain/labels";
import { formatMetricNumber } from "@/lib/utils/formatted-value";
import { NotificationChannel } from "@/types/domain";

type SettingsPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

type LaunchPrompt = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: "amber" | "rose" | "emerald";
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("settings:view");
  const settingsOverview = await getSettingsOverview();
  const launchReadiness = getLaunchReadinessSummary();
  const profileFields = [
    settingsOverview.clinicInfo.name,
    settingsOverview.clinicInfo.phone,
    settingsOverview.clinicInfo.email,
    settingsOverview.clinicInfo.city,
    settingsOverview.clinicInfo.address,
    settingsOverview.clinicInfo.currency,
    settingsOverview.clinicInfo.timezone,
    settingsOverview.clinicInfo.language
  ];
  const completedProfileFields = profileFields.filter((value) => value.trim().length > 0).length;
  const profileCompletion = Math.round((completedProfileFields / profileFields.length) * 100);
  const configuredContactChannels = [
    settingsOverview.clinicInfo.phone,
    settingsOverview.clinicInfo.email
  ].filter((value) => value.trim().length > 0).length;
  const isWorkScheduleConfigured =
    settingsOverview.workingHours.workingDaysInput.trim().length > 0 &&
    settingsOverview.workingHours.workingHoursInput.trim().length > 0;
  const readinessChecks = [
    {
      label: "هوية العيادة",
      description: "الاسم، العملة، اللغة والمنطقة الزمنية",
      ready: profileCompletion >= 75
    },
    {
      label: "قنوات التواصل",
      description: "الهاتف والبريد الإلكتروني",
      ready: configuredContactChannels >= 1
    },
    {
      label: "ساعات العمل",
      description: "الأيام والساعات ومدة الموعد الافتراضية",
      ready: isWorkScheduleConfigured
    },
    {
      label: "التذكيرات",
      description: "قناة التذكير الحالية وقالب نشط",
      ready: settingsOverview.reminders.enabled
    }
  ];
  const readinessScore = readinessChecks.filter((item) => item.ready).length;
  const reminderChannelLabel = getNotificationChannelLabel(
    settingsOverview.reminders.channel as NotificationChannel
  );
  const readinessPercent = Math.round((readinessScore / readinessChecks.length) * 100);
  const launchEnvironmentTone = launchReadiness.ready
    ? "emerald"
    : launchReadiness.score >= 60
      ? "amber"
      : "rose";
  const launchSignals = [
    {
      label: "جاهزية الإطلاق",
      value: `${readinessPercent}%`,
      description: "ملخص مباشر لمدى اكتمال المحاور الأساسية قبل الاعتماد الكامل على النظام.",
      tone:
        readinessPercent >= 85 ? "emerald" : readinessPercent >= 60 ? "brand" : "amber"
    },
    {
      label: "ثبات الجدولة",
      value: isWorkScheduleConfigured ? "مضبوطة" : "تحتاج ضبطًا",
      description: "وضوح أيام وساعات العمل ومدة الموعد الافتراضية.",
      tone: isWorkScheduleConfigured ? "emerald" : "amber"
    },
    {
      label: "قنوات التواصل",
      value: String(configuredContactChannels),
      description: "عدد القنوات المعبأة داخل ملف العيادة لاستخدامها في التواصل والمتابعة.",
      tone: configuredContactChannels >= 1 ? "brand" : "rose"
    }
  ] as const;
  const launchPrompts = [
    !readinessChecks[0].ready
      ? {
          title: "أكمل هوية العيادة",
          description: "الاسم والعملة واللغة والمنطقة الزمنية يجب أن تكون واضحة قبل الإطلاق.",
          href: "#clinic-profile",
          cta: "فتح بيانات العيادة",
          tone: "amber" as const
        }
      : null,
    !readinessChecks[2].ready
      ? {
          title: "اضبط ساعات العمل",
          description: "الجدولة تصبح أقوى عندما تكون أيام وساعات العمل محددة بشكل صريح.",
          href: "#working-hours",
          cta: "فتح ساعات العمل",
          tone: "amber" as const
        }
      : null,
    !readinessChecks[3].ready
      ? {
          title: "فعّل التذكيرات",
          description: "التذكيرات تقلل no-show وتدعم إطلاقًا أكثر استقرارًا.",
          href: "/notifications",
          cta: "فتح الإشعارات",
          tone: "rose" as const
        }
      : {
          title: "جاهزية التذكيرات مستقرة",
          description: "قناة التذكير الحالية مفعلة وجاهزة للمتابعة اليومية.",
          href: "/notifications",
          cta: "مراجعة الإشعارات",
          tone: "emerald" as const
        }
  ].filter((item): item is LaunchPrompt => Boolean(item));

  async function submitSettingsForm(formData: FormData) {
    "use server";

    const result = await updateClinicSettings({
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? "") || undefined,
      email: String(formData.get("email") ?? "") || undefined,
      city: String(formData.get("city") ?? "") || undefined,
      address: String(formData.get("address") ?? "") || undefined,
      currency: String(formData.get("currency") ?? ""),
      timezone: String(formData.get("timezone") ?? ""),
      language: String(formData.get("language") ?? ""),
      workingDays: String(formData.get("workingDays") ?? "") || undefined,
      workingHours: String(formData.get("workingHours") ?? "") || undefined,
      defaultAppointmentDuration: Number(formData.get("defaultAppointmentDuration") ?? 30)
    });

    if (!result.ok) {
      redirect(
        `/settings?error=${encodeURIComponent(result.message ?? "تعذر تحديث إعدادات العيادة.")}`
      );
    }

    redirect(
      `/settings?success=${encodeURIComponent(result.message ?? "تم حفظ إعدادات العيادة.")}`
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="الإعدادات"
        description="مساحة ضبط تشغيلية تجمع تعريف العيادة، ساعات العمل، وتفاصيل الجاهزية اليومية حتى يكون الإطلاق والإدارة أكثر ثباتًا وتنظيمًا."
        tips={["أكمل ملف العيادة", "ثبت ساعات العمل", "راجع التذكيرات قبل الإطلاق"]}
        actions={
          <>
            <Link
              href="/staff"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              إدارة الموظفين
            </Link>
            <Link
              href="/notifications"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              إدارة الإشعارات
            </Link>
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
          label="اكتمال الملف"
          value={`${profileCompletion}%`}
          hint="كلما اكتملت بيانات العيادة الأساسية، صار الإطلاق والتشغيل اليومي أوضح وأكثر احترافية."
          badgeLabel="الإعدادات"
        />
        <StatCard
          label="قنوات التواصل"
          value={formatMetricNumber(configuredContactChannels)}
          hint="القنوات المعبأة حاليًا داخل ملف العيادة والتي يمكن الاعتماد عليها في التواصل."
          badgeLabel="الإعدادات"
        />
        <StatCard
          label="جاهزية التشغيل"
          value={`${readinessScore}/${readinessChecks.length}`}
          hint="قراءة سريعة لأهم المحاور التي يجب ضبطها قبل الاعتماد الكامل على النظام."
          badgeLabel="الإعدادات"
        />
        <StatCard
          label="جاهزية الإطلاق"
          value={`${launchReadiness.score}%`}
          hint="تقيس اكتمال متطلبات البيئة الحقيقية مثل الرابط العام والبريد والبيانات الحية."
          badgeLabel="الإطلاق"
        />
        <StatCard
          label="مدة الموعد الافتراضية"
          value={settingsOverview.workingHours.defaultAppointmentDuration}
          hint="تؤثر مباشرة على الجدولة اليومية ووضوح السعة الزمنية لكل طبيب."
          badgeLabel="الإعدادات"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-ink">Launch Control</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                لوحة جاهزية سريعة تساعدك على معرفة ما الذي أصبح مستقرًا وما الذي يحتاج
                إغلاقه قبل الإطلاق الكامل.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {readinessScore}/{readinessChecks.length} محاور جاهزة
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {launchSignals.map((signal) => (
              <SignalCard
                key={signal.label}
                label={signal.label}
                value={signal.value}
                description={signal.description}
                tone={signal.tone}
              />
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <div className="text-xl font-semibold text-ink">ما الذي ينتظر الإغلاق؟</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            الخطوات الأقرب تأثيرًا على جاهزية الإطلاق والاستخدام اليومي.
          </p>

          <div className="mt-5 space-y-4">
            {launchPrompts.map((prompt, index) => (
              <div
                key={prompt.title}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">عنصر {index + 1}</div>
                    <div className="mt-2 text-lg font-semibold text-ink">{prompt.title}</div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      prompt.tone === "rose"
                        ? "bg-rose-100 text-rose-800"
                        : prompt.tone === "amber"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    متابعة
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{prompt.description}</p>
                <Link
                  href={prompt.href}
                  className="mt-4 inline-flex rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800"
                >
                  {prompt.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-ink">جاهزية البيئة الإنتاجية</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                هذه القراءة تختلف عن بيانات العيادة نفسها، لأنها تفحص هل التطبيق مضبوط
                فعلًا للإطلاق الحقيقي أم ما يزال في وضع عرض أو ينقصه إعداد تشغيلي.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                launchEnvironmentTone === "emerald"
                  ? "bg-emerald-100 text-emerald-800"
                  : launchEnvironmentTone === "amber"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
              }`}
            >
              {launchReadiness.ready ? "جاهز للإطلاق" : "ما يزال يحتاج إغلاقًا"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {launchReadiness.checks.map((check) => (
              <SignalCard
                key={check.key}
                label={check.label}
                value={check.ready ? "جاهز" : "غير مكتمل"}
                description={check.detail}
                tone={check.ready ? "emerald" : check.critical ? "amber" : "slate"}
              />
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <div className="text-xl font-semibold text-ink">ما الذي يمنع الإطلاق الآن؟</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            إذا كانت هذه القائمة فارغة، فهذا يعني أن متطلبات الإطلاق الأساسية مكتملة من جهة
            البيئة والتشغيل.
          </p>

          <div className="mt-5 space-y-3">
            {launchReadiness.issues.length > 0 ? (
              launchReadiness.issues.map((issue) => (
                <div
                  key={issue}
                  className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-950"
                >
                  {issue}
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-7 text-emerald-900">
                المتطلبات الأساسية للإطلاق مكتملة من جهة البيئة. بقي فقط التأكد من بيانات
                الاستضافة الفعلية والتجربة النهائية مع المستخدمين.
              </div>
            )}
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
            اختبر دائمًا:
            <div className="mt-2 font-semibold text-ink">`npm run validate:launch -- .env.production`</div>
          </div>
        </section>
      </div>

      <form action={submitSettingsForm} className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="space-y-6">
          <section id="clinic-profile" className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-ink">بيانات العيادة</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  هذه البيانات تظهر داخل التشغيل اليومي وتحدد هوية العيادة الأساسية في النظام.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {completedProfileFields}/{profileFields.length} حقول مكتملة
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">اسم العيادة</span>
                <input
                  name="name"
                  defaultValue={settingsOverview.clinicInfo.name}
                  autoComplete="organization"
                  required
                  placeholder="اسم العيادة كما تريد ظهوره داخل النظام"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">الهاتف</span>
                <input
                  name="phone"
                  defaultValue={settingsOverview.clinicInfo.phone}
                  autoComplete="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder="+9627XXXXXXXX"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  البريد الإلكتروني
                </span>
                <input
                  name="email"
                  type="email"
                  defaultValue={settingsOverview.clinicInfo.email}
                  autoComplete="email"
                  dir="ltr"
                  placeholder="info@yourclinic.com"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">المدينة</span>
                <input
                  name="city"
                  defaultValue={settingsOverview.clinicInfo.city}
                  autoComplete="address-level2"
                  placeholder="عمّان"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">العنوان</span>
                <input
                  name="address"
                  defaultValue={settingsOverview.clinicInfo.address}
                  autoComplete="street-address"
                  placeholder="الحي، الشارع، والطابق أو الوصف الأقرب للمراجعين"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">العملة</span>
                <input
                  name="currency"
                  defaultValue={settingsOverview.clinicInfo.currency}
                  list="currency-options"
                  placeholder="JOD"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  المنطقة الزمنية
                </span>
                <input
                  name="timezone"
                  defaultValue={settingsOverview.clinicInfo.timezone}
                  list="timezone-options"
                  dir="ltr"
                  placeholder="Asia/Amman"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">اللغة</span>
                <input
                  name="language"
                  defaultValue={settingsOverview.clinicInfo.language}
                  list="language-options"
                  dir="ltr"
                  placeholder="ar-JO"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
            </div>
          </section>

          <section id="working-hours" className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-ink">ساعات العمل والتشغيل</div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  ضبط الأيام والساعات ومدة الموعد الافتراضية يعطي الفريق صورة أوضح عند الحجز
                  وإعادة الجدولة.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {isWorkScheduleConfigured ? "الجدول مضبوط" : "يحتاج مراجعة"}
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">أيام العمل</span>
                <textarea
                  name="workingDays"
                  defaultValue={settingsOverview.workingHours.workingDaysInput}
                  placeholder={"السبت\nالأحد\nالاثنين\nالثلاثاء\nالأربعاء\nالخميس"}
                  className="min-h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
                <span className="mt-2 block text-xs leading-6 text-slate-500">
                  اكتب كل يوم في سطر مستقل أو افصل القيم بعلامة `;`.
                </span>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">ساعات العمل</span>
                <textarea
                  name="workingHours"
                  defaultValue={settingsOverview.workingHours.workingHoursInput}
                  dir="ltr"
                  placeholder="09:00 - 18:00"
                  className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
                <span className="mt-2 block text-xs leading-6 text-slate-500">
                  يمكنك إدخال فترة واحدة أو عدة فترات بحسب طريقة تشغيل العيادة.
                </span>
              </label>
              <label className="block md:max-w-xs">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  مدة الموعد الافتراضية
                </span>
                <input
                  name="defaultAppointmentDuration"
                  type="number"
                  min={5}
                  step={5}
                  defaultValue={settingsOverview.workingHours.defaultAppointmentDurationMinutes}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
                <span className="mt-2 block text-xs leading-6 text-slate-500">
                  تستخدم كقيمة افتراضية عند إنشاء موعد جديد قبل تخصيص مدة الخدمة أو الطبيب.
                </span>
              </label>
            </div>
          </section>

          <datalist id="currency-options">
            <option value="JOD" />
            <option value="USD" />
            <option value="EUR" />
          </datalist>

          <datalist id="timezone-options">
            <option value="Asia/Amman" />
            <option value="Asia/Riyadh" />
            <option value="UTC" />
          </datalist>

          <datalist id="language-options">
            <option value="ar-JO" />
            <option value="ar" />
            <option value="en" />
          </datalist>
        </div>

        <div className="space-y-6">
          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">جاهزية التشغيل</div>
            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>نسبة الجاهزية الحالية</span>
                <span className="font-semibold text-ink">{profileCompletion}%</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-brand-600 to-brand-300"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <div className="mt-4 space-y-3">
                {readinessChecks.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-ink">{item.label}</div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.ready
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.ready ? "جاهز" : "يحتاج ضبطًا"}
                      </span>
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-600">{item.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">ملخص الفوترة</div>
            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                بادئة الفواتير: {settingsOverview.billing.invoicePrefix}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                الضريبة الافتراضية: {settingsOverview.billing.defaultTax}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 leading-7">
                {settingsOverview.billing.footerNote}
              </div>
              <div className="text-xs text-slate-500">
                قوالب التذكير والإشعارات تدار من صفحة الإشعارات، بينما تبقى هذه الصفحة مرجع
                الهوية التشغيلية الأساسية للعيادة.
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">التذكيرات الحالية</div>
            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                الحالة: {settingsOverview.reminders.enabled ? "مفعلة" : "متوقفة"}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                وقت التذكير: قبل الموعد بـ {settingsOverview.reminders.leadTime}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                القناة الافتراضية: {reminderChannelLabel}
              </div>
            </div>
            <Link
              href="/notifications"
              className="mt-5 inline-flex rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800"
            >
              إدارة الإشعارات
            </Link>
          </section>

          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">الملخص الحالي</div>
            <div className="mt-5 text-sm leading-7 text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                اسم العيادة: {settingsOverview.clinicInfo.name}
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                اللغة / العملة: {settingsOverview.clinicInfo.language} /{" "}
                {settingsOverview.clinicInfo.currency}
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                المنطقة الزمنية: {settingsOverview.clinicInfo.timezone}
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                {settingsOverview.workingHours.days}
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                {settingsOverview.workingHours.hours}
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                مدة الموعد الافتراضية: {settingsOverview.workingHours.defaultAppointmentDuration}
              </div>
            </div>
            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              حفظ إعدادات العيادة
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}
