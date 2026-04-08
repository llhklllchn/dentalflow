import Link from "next/link";
import { redirect } from "next/navigation";

import { FormGuidePanel } from "@/components/shared/form-guide-panel";
import { PageHeader } from "@/components/shared/page-header";
import { TreatmentPlanForm } from "@/components/treatment-plans/treatment-plan-form";
import { getDentistsList } from "@/features/dentists/queries/get-dentists-list";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { getServicesList } from "@/features/services-catalog/queries/get-services-list";
import { createTreatmentPlan } from "@/features/treatment-plans/actions/create-treatment-plan";
import { requirePermission } from "@/lib/auth/guards";
import { getFormGuide } from "@/lib/constants/form-guides";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { buildQueryPath } from "@/lib/navigation/create-flow";

type NewTreatmentPlanPageProps = {
  searchParams?: Promise<{
    error?: string;
    patientId?: string;
    dentistId?: string;
    title?: string;
    status?: string;
    serviceName?: string;
    toothNumber?: string;
    description?: string;
    estimatedCost?: string;
    sessionOrder?: string;
    plannedDate?: string;
  }>;
};

function parseNumberInput(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function NewTreatmentPlanPage({
  searchParams
}: NewTreatmentPlanPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("treatment-plans:*");
  const formGuide = getFormGuide("treatment-plan");

  const [patients, dentists, services] = await Promise.all([
    getPatientsList(),
    getDentistsList(),
    getServicesList()
  ]);

  async function submitTreatmentPlanForm(formData: FormData) {
    "use server";

    const patientId = String(formData.get("patientId") ?? "");
    const dentistId = String(formData.get("dentistId") ?? "");
    const title = String(formData.get("title") ?? "");
    const status = String(formData.get("status") ?? "draft");
    const serviceName = String(formData.get("serviceName") ?? "");
    const toothNumber = String(formData.get("toothNumber") ?? "");
    const description = String(formData.get("description") ?? "");
    const estimatedCost = Number(formData.get("estimatedCost") ?? 0);
    const sessionOrder = Number(formData.get("sessionOrder") ?? 1);
    const plannedDate = String(formData.get("plannedDate") ?? "");

    const result = await createTreatmentPlan({
      patientId,
      dentistId,
      title,
      status,
      serviceName,
      toothNumber: toothNumber || undefined,
      description: description || undefined,
      estimatedCost,
      sessionOrder,
      plannedDate: plannedDate || undefined
    });
    const createdPlanId = result.data && "id" in result.data ? result.data.id : undefined;

    if (!result.ok) {
      redirect(
        buildQueryPath("/treatment-plans/new", {
          patientId,
          dentistId,
          title,
          status,
          serviceName,
          toothNumber,
          description,
          estimatedCost,
          sessionOrder,
          plannedDate,
          error: result.message ?? "تعذر إنشاء خطة العلاج."
        })
      );
    }

    if (shouldUseDemoData() || !createdPlanId) {
      redirect(
        buildQueryPath(`/patients/${encodeURIComponent(patientId)}`, {
          success: result.message ?? "تم إنشاء خطة العلاج بنجاح.",
          spotlight: "plan-created"
        })
      );
    }

    redirect(
      buildQueryPath(`/treatment-plans/${encodeURIComponent(createdPlanId)}`, {
        success: result.message ?? "تم إنشاء خطة العلاج بنجاح.",
        spotlight: "plan-created"
      })
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="إنشاء خطة علاج"
        title="إنشاء خطة علاج جديدة"
        description="ابنِ خطة علاج مفهومة للفريق والمريض معًا، تربط الطبيب والخدمة والتكلفة والجلسة الأولى ضمن مسار واضح يسهّل المتابعة والتحويل لاحقًا إلى مواعيد وفواتير."
        tips={[
          "ابدأ بعنوان واضح يصف الهدف العلاجي",
          "اربط الخطة بخدمة فعلية لتسهيل الفوترة",
          "اجعل الحالة مسودة حتى تراجعها مع المريض"
        ]}
        actions={
          <>
            <Link
              href="/services"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              الخدمات
            </Link>
            <Link
              href="/treatment-plans"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              خطط العلاج
            </Link>
          </>
        }
      />

      <FormGuidePanel guide={formGuide} />

      <TreatmentPlanForm
        patients={patients}
        dentists={dentists}
        services={services}
        action={submitTreatmentPlanForm}
        notice={resolvedSearchParams?.error}
        draftKey="treatment-plans:create"
        defaults={{
          patientId: resolvedSearchParams?.patientId,
          dentistId: resolvedSearchParams?.dentistId,
          title: resolvedSearchParams?.title,
          status: resolvedSearchParams?.status,
          serviceName: resolvedSearchParams?.serviceName,
          toothNumber: resolvedSearchParams?.toothNumber,
          description: resolvedSearchParams?.description,
          estimatedCost: parseNumberInput(resolvedSearchParams?.estimatedCost),
          sessionOrder: parseNumberInput(resolvedSearchParams?.sessionOrder),
          plannedDate: resolvedSearchParams?.plannedDate
        }}
      />
    </div>
  );
}
