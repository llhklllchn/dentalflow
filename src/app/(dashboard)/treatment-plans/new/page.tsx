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

type NewTreatmentPlanPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

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

    const result = await createTreatmentPlan({
      patientId: String(formData.get("patientId") ?? ""),
      dentistId: String(formData.get("dentistId") ?? ""),
      title: String(formData.get("title") ?? ""),
      status: String(formData.get("status") ?? "draft"),
      serviceName: String(formData.get("serviceName") ?? ""),
      toothNumber: String(formData.get("toothNumber") ?? "") || undefined,
      description: String(formData.get("description") ?? "") || undefined,
      estimatedCost: Number(formData.get("estimatedCost") ?? 0),
      sessionOrder: Number(formData.get("sessionOrder") ?? 1),
      plannedDate: String(formData.get("plannedDate") ?? "") || undefined
    });

    if (!result.ok) {
      redirect(
        `/treatment-plans/new?error=${encodeURIComponent(
          result.message ?? "تعذر إنشاء خطة العلاج."
        )}`
      );
    }

    redirect("/treatment-plans");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Create Treatment Plan"
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
      />
    </div>
  );
}
