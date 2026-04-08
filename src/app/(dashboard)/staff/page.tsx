import Link from "next/link";
import { redirect } from "next/navigation";

import { ActionPromptCard } from "@/components/shared/action-prompt-card";
import { CollectionEmptyState } from "@/components/shared/collection-empty-state";
import { ExportCsvButton } from "@/components/shared/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { SignalCard } from "@/components/shared/signal-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { refreshStaffInvitation } from "@/features/users/actions/refresh-staff-invitation";
import { inviteStaff } from "@/features/users/actions/invite-staff";
import { setStaffUserStatus } from "@/features/users/actions/set-staff-user-status";
import { getStaffList } from "@/features/users/queries/get-staff-list";
import { requirePermission } from "@/lib/auth/guards";
import { getRoleLabel } from "@/lib/domain/labels";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

type StaffPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
    q?: string;
    status?: "all" | "active" | "inactive" | "invited";
    role?: string;
  }>;
};

type StaffList = Awaited<ReturnType<typeof getStaffList>>;
type StaffRole = StaffList[number]["role"];
type StaffStatusFilter = "all" | "active" | "inactive" | "invited";
type StaffActionPrompt = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: "brand" | "emerald" | "amber" | "rose" | "slate";
};

function getInvitationDaysRemaining(expiresAt?: string) {
  if (!expiresAt) {
    return null;
  }

  const expiryDate = new Date(`${expiresAt}T00:00:00`);
  const diffInMs = expiryDate.getTime() - Date.now();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
}

function getRoleDistribution(staff: StaffList) {
  const distribution = new Map<StaffRole, number>();

  for (const member of staff) {
    const current = distribution.get(member.role) ?? 0;
    distribution.set(member.role, current + 1);
  }

  return Array.from(distribution.entries())
    .map(([role, count]) => ({
      role,
      count
    }))
    .sort((left, right) => right.count - left.count);
}

function normalizeStaffStatusFilter(value: string | undefined): StaffStatusFilter {
  return value === "active" || value === "inactive" || value === "invited" ? value : "all";
}

function buildStaffPath(input: {
  search?: string;
  status?: StaffStatusFilter;
  role?: string;
}) {
  const query = new URLSearchParams();

  if (input.search) {
    query.set("q", input.search);
  }

  if (input.status && input.status !== "all") {
    query.set("status", input.status);
  }

  if (input.role && input.role !== "all") {
    query.set("role", input.role);
  }

  const serialized = query.toString();
  return serialized ? `/staff?${serialized}` : "/staff";
}

function toExportRows(staff: StaffList) {
  return staff.map((member) => ({
    name: member.name,
    role: getRoleLabel(member.role),
    status: member.status,
    email: member.email,
    type: member.recordType,
    expires_at: member.expiresAt ?? ""
  }));
}

export default async function StaffPage({ searchParams }: StaffPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("staff:*");

  const staff = await getStaffList();
  const search = resolvedSearchParams?.q?.trim() ?? "";
  const statusFilter = normalizeStaffStatusFilter(resolvedSearchParams?.status);
  const availableRoles = Array.from(new Set(staff.map((member) => member.role))).sort();
  const roleFilter =
    resolvedSearchParams?.role && availableRoles.includes(resolvedSearchParams.role as StaffRole)
      ? (resolvedSearchParams.role as StaffRole)
      : "all";

  const filteredStaff = staff.filter((member) => {
    const matchesSearch = search
      ? `${member.name} ${member.email}`.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesStatus = statusFilter === "all" ? true : member.status === statusFilter;
    const matchesRole = roleFilter === "all" ? true : member.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const activeMembers = staff.filter(
    (member) => member.recordType === "user" && member.status === "active"
  ).length;
  const inactiveMembers = staff.filter(
    (member) => member.recordType === "user" && member.status === "inactive"
  ).length;
  const pendingInvitations = staff.filter((member) => member.recordType === "invitation").length;
  const expiringSoonInvitations = staff.filter((member) => {
    if (member.recordType !== "invitation") {
      return false;
    }

    const daysRemaining = getInvitationDaysRemaining(member.expiresAt);
    return daysRemaining !== null && daysRemaining <= 3;
  }).length;

  const roleDistribution = getRoleDistribution(staff);
  const totalRecords = activeMembers + inactiveMembers + pendingInvitations;
  const teamCoverage = totalRecords > 0 ? Math.round((activeMembers / totalRecords) * 100) : 0;
  const dominantRole = roleDistribution[0];
  const staffSignals = [
    {
      label: "تغطية الفريق",
      value: `${teamCoverage}%`,
      description: "حصة الأعضاء النشطين من إجمالي السجلات الظاهرة داخل الفريق.",
      tone: teamCoverage >= 75 ? "emerald" : teamCoverage >= 50 ? "brand" : "amber"
    },
    {
      label: "ضغط الانضمام",
      value: formatMetricNumber(pendingInvitations),
      description: "عدد الدعوات التي ما تزال بانتظار قبول أو متابعة سريعة.",
      tone: pendingInvitations > 0 ? "amber" : "emerald"
    },
    {
      label: "الدور المسيطر",
      value: dominantRole ? getRoleLabel(dominantRole.role) : "غير محدد",
      description: "أكثر دور ممثل حاليًا داخل العيادة بحسب السجلات المحفوظة.",
      tone: dominantRole ? "brand" : "slate"
    }
  ] as const;

  const staffActionPrompts: StaffActionPrompt[] = [
    ...(pendingInvitations > 0
      ? [
          {
            title: `تابع ${pendingInvitations} دعوات معلقة`,
            description: "إغلاق الدعوات العالقة يرفع جاهزية الفريق للدخول الكامل على النظام.",
            href: buildStaffPath({ search, status: "invited", role: roleFilter }),
            cta: "فتح الدعوات",
            tone: "amber" as const
          }
        ]
      : []),
    ...(expiringSoonInvitations > 0
      ? [
          {
            title: `جدد ${expiringSoonInvitations} دعوات تنتهي قريبًا`,
            description: "تجديد الدعوات قبل انتهاء صلاحيتها يمنع تعطّل onboarding الفريق.",
            href: buildStaffPath({ search, status: "invited", role: roleFilter }),
            cta: "متابعة الدعوات",
            tone: "rose" as const
          }
        ]
      : []),
    ...(inactiveMembers > 0
      ? [
          {
            title: `راجع ${inactiveMembers} حسابات معطلة`,
            description: "قد تحتاج بعض الحسابات إلى إعادة تفعيل أو تنظيف قبل التشغيل الكامل.",
            href: buildStaffPath({ search, status: "inactive", role: roleFilter }),
            cta: "مراجعة الحسابات",
            tone: "slate" as const
          }
        ]
      : [
          {
            title: "حالة الفريق مستقرة",
            description: "لا توجد حسابات معطلة ظاهرة حاليًا تحتاج تدخلًا سريعًا.",
            href: "#staff-list",
            cta: "عرض القائمة",
            tone: "emerald" as const
          }
        ])
  ];

  const allStaffExportRows = toExportRows(staff);
  const filteredStaffExportRows = toExportRows(filteredStaff);

  async function submitInvitationForm(formData: FormData) {
    "use server";

    const result = await inviteStaff({
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? "receptionist")
    });

    if (!result.ok) {
      redirect(`/staff?error=${encodeURIComponent(result.message ?? "تعذر حفظ الدعوة.")}`);
    }

    redirect(`/staff?success=${encodeURIComponent(result.message ?? "تم حفظ الدعوة.")}`);
  }

  async function submitUserStatusForm(formData: FormData) {
    "use server";

    const result = await setStaffUserStatus({
      userId: String(formData.get("userId") ?? ""),
      nextStatus: String(formData.get("nextStatus") ?? "INACTIVE")
    });

    if (!result.ok) {
      redirect(
        `/staff?error=${encodeURIComponent(result.message ?? "تعذر تحديث حالة المستخدم.")}`
      );
    }

    redirect(
      `/staff?success=${encodeURIComponent(result.message ?? "تم تحديث حالة المستخدم.")}`
    );
  }

  async function submitInvitationRefreshForm(formData: FormData) {
    "use server";

    const result = await refreshStaffInvitation({
      invitationId: String(formData.get("invitationId") ?? "")
    });

    if (!result.ok) {
      redirect(`/staff?error=${encodeURIComponent(result.message ?? "تعذر تجديد الدعوة.")}`);
    }

    redirect(`/staff?success=${encodeURIComponent(result.message ?? "تم تجديد الدعوة.")}`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="الفريق"
        title="الموظفون"
        description="مركز إدارة الفريق والدعوات والأدوار مع قراءة أوضح للجاهزية والتفعيل وتوزيع المسؤوليات داخل العيادة."
        tips={[
          "أرسل الدعوة من هنا",
          "راجع الدعوات القريبة من الانتهاء",
          "راقب الأدوار والجاهزية من نفس الصفحة"
        ]}
        actions={
          <>
            <a
              href="#invite"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              دعوة جديدة
            </a>
            <Link
              href="/settings"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              فتح الإعدادات
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
          label="أعضاء نشطون"
          value={formatMetricNumber(activeMembers)}
          hint="المستخدمون الذين يمكنهم العمل داخل النظام الآن دون الحاجة إلى إعادة تفعيل."
          badgeLabel="الفريق"
        />
        <StatCard
          label="دعوات معلقة"
          value={formatMetricNumber(pendingInvitations)}
          hint="دعوات أُرسلت لكنها ما زالت تنتظر القبول ويستحسن متابعتها قبل التشغيل الكامل."
          badgeLabel="الفريق"
        />
        <StatCard
          label="حسابات معطلة"
          value={formatMetricNumber(inactiveMembers)}
          hint="مستخدمون محفوظون داخل العيادة لكنهم غير مفعّلين حاليًا."
          badgeLabel="الفريق"
        />
        <StatCard
          label="دعوات تنتهي قريبًا"
          value={formatMetricNumber(expiringSoonInvitations)}
          hint="دعوات تحتاج تجديدًا سريعًا حتى لا يضيع رابط الانضمام على الفريق."
          badgeLabel="الفريق"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xl font-semibold text-ink">مؤشرات الفريق</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                قراءة تنفيذية أسرع لوضع الفريق والدعوات والأدوار قبل الدخول في التفاصيل.
              </p>
            </div>
            <ExportCsvButton
              filename="staff-roster"
              rows={allStaffExportRows}
              label="تصدير الفريق"
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {staffSignals.map((signal) => (
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
          <div className="text-xl font-semibold text-ink">أولويات جاهزية الفريق</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            هذه الخطوات تعطيك أسرع أثر على استقرار استخدام النظام داخل العيادة.
          </p>

          <div className="mt-5 space-y-4">
            {staffActionPrompts.map((prompt, index) => (
              <ActionPromptCard key={prompt.title} index={index} {...prompt} />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <section id="invite" className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-ink">دعوة موظف جديد</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                أرسل دعوة مباشرة بالبريد وحدد الدور المناسب حتى يدخل الموظف إلى النظام
                بالصلاحيات الصحيحة من أول يوم.
              </p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              إجمالي السجلات: {formatMetricNumber(staff.length)}
            </span>
          </div>

          <form action={submitInvitationForm} className="mt-5 grid gap-4 md:grid-cols-3">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              placeholder="staff@clinic.com"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
            <select
              name="role"
              defaultValue="receptionist"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="admin">{getRoleLabel("admin")}</option>
              <option value="dentist">{getRoleLabel("dentist")}</option>
              <option value="receptionist">{getRoleLabel("receptionist")}</option>
              <option value="accountant">{getRoleLabel("accountant")}</option>
              <option value="assistant">{getRoleLabel("assistant")}</option>
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              إرسال الدعوة
            </button>
          </form>

          <div className="mt-6 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
            <div className="text-sm font-semibold text-brand-900">ماذا يحدث بعد الإرسال؟</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                تصل الدعوة إلى البريد مع رابط قبول ودور الموظف المحدد.
              </div>
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                يبقى السجل ظاهرًا هنا كدعوة معلقة حتى يتم قبولها أو تجديدها.
              </div>
              <div className="rounded-[1.25rem] border border-brand-100 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                يمكنك تعطيل المستخدم أو إعادة تفعيل الحساب من نفس الصفحة متى احتجت.
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">توزيع الأدوار</div>
            <div className="mt-5 flex flex-wrap gap-3">
              {roleDistribution.map((item) => (
                <div
                  key={item.role}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {getRoleLabel(item.role)}: {formatMetricNumber(item.count)}
                </div>
              ))}
            </div>
            {roleDistribution.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                لا توجد حسابات أو دعوات محفوظة بعد.
              </div>
            ) : null}
          </section>

          <section className="panel p-6">
            <div className="text-lg font-semibold text-ink">ملاحظات تشغيلية</div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                كثرة الدعوات المعلقة تعني أن الفريق لم يكتمل دخوله بعد، ويفضل متابعتها قبل
                الاعتماد اليومي الكامل على النظام.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                عطّل الحسابات غير المستخدمة بدل حذفها حتى تحافظ على السجل والآثار المرتبطة بها.
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                راجع الصلاحيات والأدوار مع صفحة الإعدادات إذا كنت تجهز العيادة للإطلاق الرسمي.
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div id="staff-list" className="panel mt-6 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-ink">قائمة الموظفين والدعوات</div>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              فلترة سريعة للفريق نفسه حتى تراجع الدعوات أو الحسابات المعطلة أو دورًا محددًا
              من نفس المساحة.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-slate-500">
              المعروض الآن: {filteredStaff.length} من {staff.length}
            </div>
            <ExportCsvButton
              filename="staff-list-visible"
              rows={filteredStaffExportRows}
              label="CSV"
              className="px-4 py-2"
            />
          </div>
        </div>

        <form method="get" className="mb-5 grid gap-3 md:grid-cols-[1fr,180px,180px,120px]">
          <input
            name="q"
            defaultValue={search}
            placeholder="ابحث بالاسم أو البريد"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          />
          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">معطل</option>
            <option value="invited">دعوة معلقة</option>
          </select>
          <select
            name="role"
            defaultValue={roleFilter}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <option value="all">كل الأدوار</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {getRoleLabel(role)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800"
          >
            تطبيق
          </button>
        </form>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Link
            href={buildStaffPath({ search, status: "all", role: roleFilter })}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              statusFilter === "all"
                ? "border-brand-200 bg-brand-50 text-brand-900"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            الكل
          </Link>
          <Link
            href={buildStaffPath({ search, status: "invited", role: roleFilter })}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              statusFilter === "invited"
                ? "border-brand-200 bg-brand-50 text-brand-900"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            الدعوات
          </Link>
          <Link
            href={buildStaffPath({ search, status: "inactive", role: roleFilter })}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              statusFilter === "inactive"
                ? "border-brand-200 bg-brand-50 text-brand-900"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            المعطلون
          </Link>
          <Link
            href="/staff"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            إزالة الفلاتر
          </Link>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>{activeMembers} نشط</span>
          <span>{inactiveMembers} معطل</span>
          <span>{pendingInvitations} دعوة معلقة</span>
        </div>

        {filteredStaff.length === 0 ? (
          <CollectionEmptyState
            title={
              staff.length === 0 ? "لا توجد سجلات فريق بعد" : "لا توجد نتائج للفلاتر الحالية"
            }
            description={
              staff.length === 0
                ? "ابدأ بإرسال أول دعوة أو راجع الإعدادات قبل تجهيز العيادة للعمل اليومي الكامل."
                : "لم تظهر سجلات تطابق البحث أو الفلترة الحالية. جرّب توسيع المعايير أو إزالة الفلاتر."
            }
            primaryAction={{
              href: staff.length === 0 ? "#invite" : "/staff",
              label: staff.length === 0 ? "إرسال دعوة" : "إزالة الفلاتر"
            }}
            secondaryAction={{ href: "/settings", label: "فتح الإعدادات" }}
            highlights={["دعوات", "أدوار", "حسابات", "جاهزية الفريق"]}
          />
        ) : (
          <>
            <div className="space-y-4 md:hidden">
              {filteredStaff.map((member) => {
                const daysRemaining = getInvitationDaysRemaining(member.expiresAt);

                return (
                  <div
                    key={member.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-ink">{member.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{member.email}</div>
                      </div>
                      <StatusBadge status={member.status as "active" | "inactive" | "invited"} />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                        {getRoleLabel(member.role)}
                      </span>
                      {member.recordType === "invitation" && member.expiresAt ? (
                        <span
                          className={`rounded-full border px-3 py-1 ${
                            daysRemaining !== null && daysRemaining <= 3
                              ? "border-amber-200 bg-amber-50 text-amber-900"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          تنتهي في {member.expiresAt}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                      {member.recordType === "user" ? (
                        <form action={submitUserStatusForm}>
                          <input type="hidden" name="userId" value={member.id} />
                          <input
                            type="hidden"
                            name="nextStatus"
                            value={member.status === "inactive" ? "ACTIVE" : "INACTIVE"}
                          />
                          <button
                            type="submit"
                            className={
                              member.status === "inactive"
                                ? "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-800"
                                : "rounded-full border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700"
                            }
                          >
                            {member.status === "inactive" ? "إعادة التفعيل" : "تعطيل المستخدم"}
                          </button>
                        </form>
                      ) : (
                        <form action={submitInvitationRefreshForm}>
                          <input type="hidden" name="invitationId" value={member.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 font-semibold text-brand-800"
                          >
                            تجديد الدعوة
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-right text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-3 py-4 font-medium">الاسم</th>
                    <th className="px-3 py-4 font-medium">الدور</th>
                    <th className="px-3 py-4 font-medium">الحالة</th>
                    <th className="px-3 py-4 font-medium">البريد</th>
                    <th className="px-3 py-4 font-medium">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => {
                    const daysRemaining = getInvitationDaysRemaining(member.expiresAt);

                    return (
                      <tr key={member.id} className="border-b border-slate-100 align-top">
                        <td className="px-3 py-4 font-semibold text-ink">
                          {member.name}
                          {member.recordType === "invitation" && member.expiresAt ? (
                            <div className="mt-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  daysRemaining !== null && daysRemaining <= 3
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                تنتهي في: {member.expiresAt}
                              </span>
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-4 text-slate-600">{getRoleLabel(member.role)}</td>
                        <td className="px-3 py-4">
                          <StatusBadge
                            status={member.status as "active" | "inactive" | "invited"}
                          />
                        </td>
                        <td className="px-3 py-4 text-slate-600">{member.email}</td>
                        <td className="px-3 py-4">
                          {member.recordType === "user" ? (
                            <form action={submitUserStatusForm}>
                              <input type="hidden" name="userId" value={member.id} />
                              <input
                                type="hidden"
                                name="nextStatus"
                                value={member.status === "inactive" ? "ACTIVE" : "INACTIVE"}
                              />
                              <button
                                type="submit"
                                className={
                                  member.status === "inactive"
                                    ? "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-800"
                                    : "rounded-full border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700"
                                }
                              >
                                {member.status === "inactive"
                                  ? "إعادة التفعيل"
                                  : "تعطيل المستخدم"}
                              </button>
                            </form>
                          ) : (
                            <form action={submitInvitationRefreshForm}>
                              <input type="hidden" name="invitationId" value={member.id} />
                              <button
                                type="submit"
                                className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 font-semibold text-brand-800"
                              >
                                تجديد الدعوة
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
