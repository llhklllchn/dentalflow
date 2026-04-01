import Link from "next/link";
import { redirect } from "next/navigation";

import { PatientForm } from "@/components/patients/patient-form";
import { FormGuidePanel } from "@/components/shared/form-guide-panel";
import { PageHeader } from "@/components/shared/page-header";
import { createPatient } from "@/features/patients/actions/create-patient";
import { saveMedicalHistory } from "@/features/patients/actions/save-medical-history";
import { requirePermission } from "@/lib/auth/guards";
import { getFormGuide } from "@/lib/constants/form-guides";
import { shouldUseDemoData } from "@/lib/db/data-source";
import { buildQueryPath } from "@/lib/navigation/create-flow";

type NewPatientPageProps = {
  searchParams?: Promise<{
    error?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string;
    phone?: string;
    whatsappPhone?: string;
    email?: string;
    nationalId?: string;
    city?: string;
    address?: string;
    notes?: string;
    allergies?: string;
    chronicConditions?: string;
    currentMedications?: string;
  }>;
};

export default async function NewPatientPage({ searchParams }: NewPatientPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("patients:*");
  const formGuide = getFormGuide("patient");

  async function submitPatientForm(formData: FormData) {
    "use server";

    const patientResult = await createPatient({
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      gender: String(formData.get("gender") ?? "") || undefined,
      dateOfBirth: String(formData.get("dateOfBirth") ?? "") || undefined,
      phone: String(formData.get("phone") ?? ""),
      whatsappPhone: String(formData.get("whatsappPhone") ?? "") || undefined,
      email: String(formData.get("email") ?? "") || undefined,
      nationalId: String(formData.get("nationalId") ?? "") || undefined,
      city: String(formData.get("city") ?? "") || undefined,
      address: String(formData.get("address") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined
    });

    if (!patientResult.ok || !patientResult.data?.id) {
      redirect(
        buildQueryPath("/patients/new", {
          firstName: String(formData.get("firstName") ?? ""),
          lastName: String(formData.get("lastName") ?? ""),
          gender: String(formData.get("gender") ?? ""),
          dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          whatsappPhone: String(formData.get("whatsappPhone") ?? ""),
          email: String(formData.get("email") ?? ""),
          nationalId: String(formData.get("nationalId") ?? ""),
          city: String(formData.get("city") ?? ""),
          address: String(formData.get("address") ?? ""),
          notes: String(formData.get("notes") ?? ""),
          allergies: String(formData.get("allergies") ?? ""),
          chronicConditions: String(formData.get("chronicConditions") ?? ""),
          currentMedications: String(formData.get("currentMedications") ?? ""),
          error: patientResult.message ?? "تعذر إنشاء المريض."
        })
      );
    }

    const hasMedicalData = [
      formData.get("allergies"),
      formData.get("chronicConditions"),
      formData.get("currentMedications")
    ].some((value) => String(value ?? "").trim().length > 0);

    if (hasMedicalData) {
      const medicalHistoryResult = await saveMedicalHistory({
        patientId: patientResult.data.id,
        allergies: String(formData.get("allergies") ?? "") || undefined,
        chronicConditions:
          String(formData.get("chronicConditions") ?? "") || undefined,
        currentMedications:
          String(formData.get("currentMedications") ?? "") || undefined,
        medicalNotes: String(formData.get("notes") ?? "") || undefined
      });

      if (!medicalHistoryResult.ok) {
        redirect(
          buildQueryPath("/patients/new", {
            firstName: String(formData.get("firstName") ?? ""),
            lastName: String(formData.get("lastName") ?? ""),
            gender: String(formData.get("gender") ?? ""),
            dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
            phone: String(formData.get("phone") ?? ""),
            whatsappPhone: String(formData.get("whatsappPhone") ?? ""),
            email: String(formData.get("email") ?? ""),
            nationalId: String(formData.get("nationalId") ?? ""),
            city: String(formData.get("city") ?? ""),
            address: String(formData.get("address") ?? ""),
            notes: String(formData.get("notes") ?? ""),
            allergies: String(formData.get("allergies") ?? ""),
            chronicConditions: String(formData.get("chronicConditions") ?? ""),
            currentMedications: String(formData.get("currentMedications") ?? ""),
            error:
              medicalHistoryResult.message ??
              "تم حفظ المريض لكن تعذر حفظ السجل الطبي."
          })
        );
      }
    }

    if (shouldUseDemoData()) {
      redirect(
        buildQueryPath("/patients", {
          success: patientResult.message ?? "تم إنشاء المريض بنجاح."
        })
      );
    }

    redirect(
      buildQueryPath(`/patients/${encodeURIComponent(patientResult.data.id)}`, {
        success: patientResult.message ?? "تم إنشاء المريض بنجاح.",
        spotlight: "patient-created"
      })
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Create Patient"
        title="إضافة مريض جديد"
        description="افتح ملف المريض بسرعة وبشكل احترافي من أول زيارة، مع مساحة تكفي لبيانات التواصل والملاحظات الطبية الأساسية دون أن تثقل على الاستقبال أو الطبيب."
        tips={[
          "ابدأ بالاسم والهاتف فقط إذا كنت مستعجلًا",
          "أضف واتساب إذا كان مختلفًا عن رقم الهاتف",
          "سجّل الحساسية والأدوية المهمة من أول مرة"
        ]}
        actions={
          <>
            <Link
              href="/patients"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              قائمة المرضى
            </Link>
            <Link
              href="/appointments/new"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              حجز موعد
            </Link>
          </>
        }
      />

      <FormGuidePanel guide={formGuide} />

      <PatientForm
        action={submitPatientForm}
        notice={resolvedSearchParams?.error}
        draftKey="patients:create"
        defaults={{
          firstName: resolvedSearchParams?.firstName,
          lastName: resolvedSearchParams?.lastName,
          gender: resolvedSearchParams?.gender,
          dateOfBirth: resolvedSearchParams?.dateOfBirth,
          phone: resolvedSearchParams?.phone,
          whatsappPhone: resolvedSearchParams?.whatsappPhone,
          email: resolvedSearchParams?.email,
          nationalId: resolvedSearchParams?.nationalId,
          city: resolvedSearchParams?.city,
          address: resolvedSearchParams?.address,
          notes: resolvedSearchParams?.notes,
          allergies: resolvedSearchParams?.allergies,
          chronicConditions: resolvedSearchParams?.chronicConditions,
          currentMedications: resolvedSearchParams?.currentMedications
        }}
      />
    </div>
  );
}
