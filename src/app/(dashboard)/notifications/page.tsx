import Link from "next/link";
import { redirect } from "next/navigation";

import { ActionPromptCard } from "@/components/shared/action-prompt-card";
import { CollectionEmptyState } from "@/components/shared/collection-empty-state";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { SignalCard } from "@/components/shared/signal-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { deliverPendingNotifications } from "@/features/notifications/actions/deliver-pending-notifications";
import { queueAppointmentReminders } from "@/features/notifications/actions/queue-appointment-reminders";
import { saveNotificationTemplate } from "@/features/notifications/actions/save-notification-template";
import { setNotificationTemplateActiveState } from "@/features/notifications/actions/set-notification-template-active-state";
import { getNotificationCenter } from "@/features/notifications/queries/get-notification-center";
import { requirePermission } from "@/lib/auth/guards";
import { getNotificationChannelLabel, getStatusLabel } from "@/lib/domain/labels";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

type NotificationsPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
    templateId?: string;
    q?: string;
    status?: "all" | "pending" | "sent" | "failed";
    channel?: "all" | "whatsapp" | "sms" | "email";
  }>;
};

type Center = Awaited<ReturnType<typeof getNotificationCenter>>;
type StatusFilter = "all" | "pending" | "sent" | "failed";
type ChannelFilter = "all" | "whatsapp" | "sms" | "email";

const statuses = ["all", "pending", "sent", "failed"] as const;
const channels = ["all", "whatsapp", "sms", "email"] as const;

function normalizeFilter<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function buildPath(input: { search?: string; status: StatusFilter; channel: ChannelFilter; templateId?: string; error?: string; success?: string }) {
  const query = new URLSearchParams();
  if (input.search) query.set("q", input.search);
  if (input.status !== "all") query.set("status", input.status);
  if (input.channel !== "all") query.set("channel", input.channel);
  if (input.templateId) query.set("templateId", input.templateId);
  if (input.error) query.set("error", input.error);
  if (input.success) query.set("success", input.success);
  const serialized = query.toString();
  return serialized ? `/notifications?${serialized}` : "/notifications";
}

function channelCards(center: Center) {
  return channels.filter((channel) => channel !== "all").map((channel) => ({
    channel,
    activeTemplates: center.templates.filter((template) => template.channel === channel && template.active).length,
    pendingLogs: center.logs.filter((log) => log.channel === channel && log.status === "pending").length,
    failedLogs: center.logs.filter((log) => log.channel === channel && log.status === "failed").length
  }));
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("settings:update");

  const search = resolvedSearchParams?.q?.trim();
  const status = normalizeFilter(resolvedSearchParams?.status, statuses, "all");
  const channel = normalizeFilter(resolvedSearchParams?.channel, channels, "all");
  const center = await getNotificationCenter({ search, status, channel });
  const selectedTemplate =
    center.templates.find((template) => template.id === resolvedSearchParams?.templateId?.trim()) ??
    center.templates[0];

  const activeTemplates = center.templates.filter((template) => template.active).length;
  const pendingLogs = center.logs.filter((log) => log.status === "pending").length;
  const sentLogs = center.logs.filter((log) => log.status === "sent").length;
  const failedLogs = center.logs.filter((log) => log.status === "failed").length;
  const resolvedLogs = sentLogs + failedLogs;
  const deliveryHealth = resolvedLogs > 0 ? Math.round((sentLogs / resolvedLogs) * 100) : 100;
  const activeChannels = new Set(center.templates.filter((template) => template.active).map((template) => template.channel)).size;
  const insights = channelCards(center);
  const logRows = center.logs.map((log) => ({
    patient: log.patientName,
    channel: getNotificationChannelLabel(log.channel),
    template: log.templateKey,
    status: getStatusLabel(log.status),
    scheduled_for: log.scheduledFor,
    sent_at: log.sentAt,
    error: log.errorMessage ?? ""
  }));
  const templateRows = center.templates.map((template) => ({
    name: template.name,
    channel: getNotificationChannelLabel(template.channel),
    template_key: template.templateKey,
    active: template.active,
    subject: template.subject ?? ""
  }));

  async function submitTemplate(formData: FormData) {
    "use server";
    const result = await saveNotificationTemplate({
      name: String(formData.get("name") ?? ""),
      channel: String(formData.get("channel") ?? "whatsapp"),
      templateKey: String(formData.get("templateKey") ?? ""),
      subject: String(formData.get("subject") ?? "") || undefined,
      body: String(formData.get("body") ?? "")
    });
    if (!result.ok) redirect(buildPath({ search, status, channel, templateId: selectedTemplate?.id, error: result.message ?? "تعذر حفظ القالب." }));
    const savedTemplateId = result.data && typeof result.data === "object" && "id" in result.data && typeof result.data.id === "string" ? result.data.id : selectedTemplate?.id;
    redirect(buildPath({ search, status, channel, templateId: savedTemplateId, success: "تم حفظ القالب بنجاح." }));
  }

  async function submitQueue(formData: FormData) {
    "use server";
    const hoursAhead = Number(formData.get("hoursAhead") ?? 24);
    const result = await queueAppointmentReminders(hoursAhead === 3 ? 3 : 24);
    if (!result.ok) redirect(buildPath({ search, status, channel, templateId: selectedTemplate?.id, error: result.message ?? "تعذر تجهيز التذكيرات." }));
    redirect(buildPath({ search, status, channel, templateId: selectedTemplate?.id, success: result.message ?? "تم تجهيز التذكيرات." }));
  }

  async function submitDelivery(formData: FormData) {
    "use server";
    const result = await deliverPendingNotifications(Number(formData.get("limit") ?? 50));
    if (!result.ok) redirect(buildPath({ search, status, channel, templateId: selectedTemplate?.id, error: result.message ?? "تعذر تسليم الإشعارات." }));
    redirect(buildPath({ search, status, channel, templateId: selectedTemplate?.id, success: result.message ?? "تم تسليم الإشعارات." }));
  }

  async function submitTemplateState(formData: FormData) {
    "use server";
    const templateId = String(formData.get("templateId") ?? "") || selectedTemplate?.id;
    const result = await setNotificationTemplateActiveState({ templateId, isActive: String(formData.get("isActive") ?? "false") === "true" });
    if (!result.ok) redirect(buildPath({ search, status, channel, templateId, error: result.message ?? "تعذر تحديث حالة القالب." }));
    redirect(buildPath({ search, status, channel, templateId, success: result.message ?? "تم تحديث حالة القالب." }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Notifications"
        title="الإشعارات والتذكير"
        description="مركز تشغيل أوضح للقوالب وطابور التذكير وسجل الإرسال."
        tips={["راقب صحة التسليم", "أغلق الفشل بسرعة", "حافظ على قالب نشط"]}
        actions={
          <>
            <form action={submitQueue}><input type="hidden" name="hoursAhead" value="24" /><button type="submit" className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800">تجهيز 24 ساعة</button></form>
            <form action={submitDelivery}><input type="hidden" name="limit" value="50" /><button type="submit" className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white">تشغيل التسليم</button></form>
          </>
        }
      />

      {resolvedSearchParams?.error ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{resolvedSearchParams.error}</div> : null}
      {resolvedSearchParams?.success ? <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{resolvedSearchParams.success}</div> : null}

      <div className="grid-cards">
        <StatCard label="القوالب المحفوظة" value={formatMetricNumber(center.templates.length)} hint="كل القوالب المتاحة للتذكير أو المتابعة." badgeLabel="الإشعارات" />
        <StatCard label="قوالب نشطة" value={formatMetricNumber(activeTemplates)} hint="القوالب المفعلة حاليًا." badgeLabel="الإشعارات" />
        <StatCard label="إشعارات معلقة" value={formatMetricNumber(pendingLogs)} hint="رسائل بانتظار التسليم." badgeLabel="الإشعارات" />
        <StatCard label="إشعارات فاشلة" value={formatMetricNumber(failedLogs)} hint="سجلات فشل تحتاج مراجعة." badgeLabel="الإشعارات" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="text-xl font-semibold text-ink">نبض التسليم</div><p className="mt-2 text-sm leading-7 text-slate-600">قراءة تنفيذية لوضع القنوات والطابور.</p></div>
            <ExportCsvButton filename="notification-log" rows={logRows} label="تصدير السجل" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <SignalCard label="صحة التسليم" value={`${deliveryHealth}%`} description="نسبة الرسائل المرسلة بنجاح من السجلات المحسومة." tone={deliveryHealth >= 85 ? "emerald" : deliveryHealth >= 60 ? "brand" : "amber"} />
            <SignalCard label="ضغط الطابور" value={formatMetricNumber(pendingLogs)} description="عدد الإشعارات التي تنتظر التسليم." tone={pendingLogs > 0 ? "amber" : "emerald"} />
            <SignalCard label="قنوات فعالة" value={formatMetricNumber(activeChannels)} description="عدد القنوات التي يوجد عليها قالب نشط." tone={activeChannels > 0 ? "brand" : "rose"} />
          </div>
        </section>

        <section className="panel p-6">
          <div className="text-xl font-semibold text-ink">أولويات مركز التسليم</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">أقصر الطرق لرفع الاستقرار اليومي.</p>
          <div className="mt-5 space-y-4">
            {failedLogs > 0 ? <ActionPromptCard title={`راجع ${failedLogs} إشعارات فاشلة`} description="يوجد فشل ظاهر ويحتاج فحص القناة أو البيانات." href={buildPath({ search, status: "failed", channel, templateId: selectedTemplate?.id })} cta="فتح السجل" tone="rose" /> : null}
            {pendingLogs > 0 ? <ActionPromptCard title={`شغّل ${pendingLogs} إشعارات معلقة`} description="هناك رسائل جاهزة وتنتظر تشغيل التسليم." href="#delivery-center" cta="فتح مركز التسليم" tone="amber" /> : null}
            <ActionPromptCard title={selectedTemplate?.active ? "جاهزية القوالب مستقرة" : "فعّل قالبًا أساسيًا"} description={selectedTemplate?.active ? "يوجد قالب نشط يمكن الاعتماد عليه الآن." : "يفضل وجود قالب نشط حتى لا يتعطل التذكير اليومي."} href="#templates" cta="فتح القوالب" tone={selectedTemplate?.active ? "emerald" : "slate"} />
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr,0.95fr]">
        <section className="space-y-6">
          <div id="delivery-center" className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><div className="text-xl font-semibold text-ink">مركز التذكير</div><p className="mt-2 text-sm leading-7 text-slate-600">جهّز التذكيرات المقبلة وشغّل التسليم من نفس المكان.</p></div>
              <div className="flex flex-wrap items-center gap-3">
                <form action={submitQueue} className="flex flex-wrap items-center gap-3"><select name="hoursAhead" defaultValue="24" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"><option value="24">قبل 24 ساعة</option><option value="3">قبل 3 ساعات</option></select><button type="submit" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800">تجهيز</button></form>
                <form action={submitDelivery}><input type="hidden" name="limit" value="50" /><button type="submit" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800">تسليم 50 سجلًا</button></form>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-sm text-slate-500">الحالة العامة</div><div className="mt-2 font-semibold text-ink">{center.reminderSettings.enabled ? "مفعلة" : "متوقفة"}</div></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-sm text-slate-500">نافذة الإرسال</div><div className="mt-2 font-semibold text-ink">قبل الموعد بـ {center.reminderSettings.leadTime}</div></div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-sm text-slate-500">القناة الافتراضية</div><div className="mt-2 font-semibold text-ink">{getNotificationChannelLabel(center.reminderSettings.channel)}</div></div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {insights.map((item) => (
                <div key={item.channel} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-500">{getNotificationChannelLabel(item.channel)}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">نشطة: {formatMetricNumber(item.activeTemplates)}</span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">معلقة: {formatMetricNumber(item.pendingLogs)}</span>
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">فاشلة: {formatMetricNumber(item.failedLogs)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5 text-sm leading-7 text-brand-950">{center.reminderSettings.messagePreview}</div>
          </div>

          <div id="delivery-log" className="panel p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-xl font-semibold text-ink">سجل الإرسال</div><p className="mt-2 text-sm leading-7 text-slate-600">راقب أحدث السجلات بحسب الحالة أو القناة.</p></div>
              <div className="flex flex-wrap items-center gap-3"><StatusBadge label={`${formatMetricNumber(sentLogs)} تم تسليمها`} status="sent" /><ExportCsvButton filename="notification-log-filtered" rows={logRows} label="CSV" className="px-4 py-2" /></div>
            </div>

            <form method="get" className="mb-5 grid gap-3 md:grid-cols-[1fr,180px,180px,140px,120px]">
              <input name="q" defaultValue={search ?? ""} placeholder="ابحث بالمريض أو القالب" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700" />
              <select name="status" defaultValue={status} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"><option value="all">كل الحالات</option><option value="pending">{getStatusLabel("pending")}</option><option value="sent">{getStatusLabel("sent")}</option><option value="failed">{getStatusLabel("failed")}</option></select>
              <select name="channel" defaultValue={channel} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"><option value="all">كل القنوات</option><option value="whatsapp">{getNotificationChannelLabel("whatsapp")}</option><option value="sms">{getNotificationChannelLabel("sms")}</option><option value="email">{getNotificationChannelLabel("email")}</option></select>
              <button type="submit" className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800">تطبيق</button>
              <Link href="/notifications" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700">مسح</Link>
            </form>

            {center.logs.length === 0 ? (
              <CollectionEmptyState title="لا توجد سجلات مطابقة" description="لم تظهر إشعارات تطابق الفلاتر الحالية. جرّب توسيع الفلاتر أو تشغيل طابور جديد." primaryAction={{ href: "/notifications", label: "مسح الفلاتر" }} secondaryAction={{ href: "#delivery-center", label: "فتح مركز التسليم" }} highlights={["معلقة", "فاشلة", "مرسلة"]} />
            ) : (
              <>
                <div className="space-y-4 md:hidden">
                  {center.logs.map((log) => (
                    <div key={log.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-3"><div><div className="text-lg font-semibold text-ink">{log.patientName}</div><div className="mt-1 text-sm text-slate-500">{getNotificationChannelLabel(log.channel)} | {log.templateKey}</div></div><StatusBadge status={log.status} /></div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">الجدولة: {log.scheduledFor}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">الإرسال: {log.sentAt || "لم يرسل بعد"}</span></div>
                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{log.errorMessage || "لا يوجد خطأ ظاهر لهذا السجل."}</div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-right text-sm">
                    <thead className="border-b border-slate-200 text-slate-500"><tr><th className="px-3 py-4 font-medium">المريض</th><th className="px-3 py-4 font-medium">القناة</th><th className="px-3 py-4 font-medium">القالب</th><th className="px-3 py-4 font-medium">الحالة</th><th className="px-3 py-4 font-medium">وقت الجدولة</th><th className="px-3 py-4 font-medium">الخطأ</th></tr></thead>
                    <tbody>{center.logs.map((log) => <tr key={log.id} className="border-b border-slate-100"><td className="px-3 py-4 text-slate-700">{log.patientName}</td><td className="px-3 py-4 text-slate-700">{getNotificationChannelLabel(log.channel)}</td><td className="px-3 py-4 text-slate-700">{log.templateKey}</td><td className="px-3 py-4"><StatusBadge status={log.status} /></td><td className="px-3 py-4 text-slate-700">{log.scheduledFor}</td><td className="px-3 py-4 text-slate-700">{log.errorMessage || "لا يوجد"}</td></tr>)}</tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section id="templates" className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="text-xl font-semibold text-ink">قوالب الرسائل</div><p className="mt-2 text-sm leading-7 text-slate-600">حرر القالب المحدد ثم فعّل أو أوقف القوالب حسب القناة.</p></div>
              {selectedTemplate ? <StatusBadge label={selectedTemplate.active ? "القالب المحدد نشط" : "القالب المحدد متوقف"} status={selectedTemplate.active ? "sent" : "pending"} /> : null}
            </div>

            <form action={submitTemplate} className="mt-5 space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <input name="name" defaultValue={selectedTemplate?.name ?? "تذكير موعد"} placeholder="اسم القالب" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3" />
              <div className="grid gap-4 md:grid-cols-2">
                <select name="channel" defaultValue={selectedTemplate?.channel ?? "whatsapp"} className="rounded-2xl border border-slate-300 bg-white px-4 py-3"><option value="whatsapp">{getNotificationChannelLabel("whatsapp")}</option><option value="sms">{getNotificationChannelLabel("sms")}</option><option value="email">{getNotificationChannelLabel("email")}</option></select>
                <input name="templateKey" defaultValue={selectedTemplate?.templateKey ?? "appointment_reminder_24h"} placeholder="template key" className="rounded-2xl border border-slate-300 bg-white px-4 py-3" />
              </div>
              <input name="subject" defaultValue={selectedTemplate?.subject ?? ""} placeholder="الموضوع للبريد فقط" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3" />
              <textarea name="body" defaultValue={selectedTemplate?.body ?? "مرحبًا {patient_name}، لديك موعد قريب في العيادة."} className="min-h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3" />
              <button type="submit" className="w-full rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">حفظ القالب</button>
            </form>
          </section>

          <section className="panel p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="text-lg font-semibold text-ink">القوالب المتاحة</div><ExportCsvButton filename="notification-templates" rows={templateRows} label="تصدير القوالب" className="px-4 py-2" /></div>
            <div className="space-y-4">
              {center.templates.length > 0 ? center.templates.map((template) => (
                <div key={template.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold text-ink">{template.name}</div><div className="mt-1 text-sm text-slate-500">{getNotificationChannelLabel(template.channel)} | {template.templateKey}</div></div><StatusBadge label={template.active ? "نشط" : "متوقف"} status={template.active ? "sent" : "pending"} /></div>
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{template.body}</div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link href={buildPath({ search, status, channel, templateId: template.id })} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">تحرير</Link>
                    <form action={submitTemplateState}><input type="hidden" name="templateId" value={template.id} /><input type="hidden" name="isActive" value={template.active ? "false" : "true"} /><button type="submit" className={template.active ? "rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800" : "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"}>{template.active ? "إيقاف" : "تفعيل"}</button></form>
                  </div>
                </div>
              )) : <CollectionEmptyState title="لا توجد قوالب محفوظة" description="ابدأ بإضافة أول قالب نشط حتى يصبح مسار التذكير اليومي جاهزًا." primaryAction={{ href: "#templates", label: "إضافة قالب" }} secondaryAction={{ href: "#delivery-center", label: "فتح مركز التذكير" }} highlights={["واتساب", "SMS", "Email"]} />}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
