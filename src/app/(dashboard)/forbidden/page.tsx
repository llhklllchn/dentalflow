import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { SignalCard } from "@/components/shared/signal-card";
import { resolveSafeInternalPath } from "@/lib/auth/redirects";
import { getSessionUser } from "@/lib/auth/session";
import { getRoleLabel } from "@/lib/domain/labels";
import { getPermissionScopeLabel } from "@/lib/permissions/permissions";

type ForbiddenPageProps = {
  searchParams?: Promise<{
    from?: string;
    permission?: string;
  }>;
};

export default async function ForbiddenPage({ searchParams }: ForbiddenPageProps) {
  const [resolvedSearchParams, user] = await Promise.all([searchParams, getSessionUser()]);
  const fromPath = resolveSafeInternalPath(resolvedSearchParams?.from);
  const permission = resolvedSearchParams?.permission ?? "";
  const permissionLabel = permission ? getPermissionScopeLabel(permission) : "هذه الصفحة";

  return (
    <div>
      <PageHeader
        eyebrow="التحكم بالوصول"
        title="الوصول غير متاح لحسابك الحالي"
        description={`حسابك الحالي لا يملك الصلاحية الكافية للوصول إلى ${permissionLabel}. إذا كنت تحتاج هذه المساحة ضمن عملك اليومي، اطلب من مالك العيادة أو مدير النظام مراجعة دورك.`}
        actions={
          <>
            <Link
              href={fromPath}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              العودة إلى الصفحة السابقة
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              العودة إلى لوحة التحكم
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SignalCard
          label="حسابك الحالي"
          value={user ? getRoleLabel(user.role) : "غير معروف"}
          description="هذا هو الدور المستخدم الآن في الجلسة الحالية، وهو الذي يحدد ما يمكنك فتحه أو تنفيذه داخل النظام."
          tone="slate"
        />
        <SignalCard
          label="الوحدة المطلوبة"
          value={permissionLabel}
          description="هذه هي المساحة التي حاولت الوصول إليها، وقد تم إيقاف الفتح لأن الدور الحالي لا يملك الصلاحية المناسبة لها."
          tone="amber"
        />
        <SignalCard
          label="الخطوة التالية"
          value="مراجعة الدور"
          description="إذا كان الوصول مطلوبًا لعملك، اطلب من المالك أو المدير تعديل دورك أو تنفيذ العملية من حساب يملك الصلاحية المناسبة."
          tone="brand"
        />
      </div>

      <section className="panel mt-6 p-6">
        <div className="text-lg font-semibold text-ink">كيف نحل هذا بسرعة؟</div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
            إذا كنت طبيبًا، قد تحتاج فقط إلى صفحة المرضى أو السجلات أو خطط العلاج، وليس
            كل الوحدات الإدارية أو المالية.
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
            إذا كنت مديرًا أو مالكًا، راجع إعدادات الفريق وصفحة الموظفين للتأكد من أن
            الدور المعيّن مطابق للمسؤوليات الفعلية.
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
            إذا وصلت إلى هنا بالخطأ، ارجع إلى الصفحة السابقة أو إلى لوحة التحكم وأكمل من
            المسارات المصرح بها لحسابك.
          </div>
        </div>

        {permission ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            مرجع داخلي للصلاحية المطلوبة: <code dir="ltr">{permission}</code>
          </div>
        ) : null}
      </section>
    </div>
  );
}
