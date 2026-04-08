import { redirect } from "next/navigation";

import { PatientForm } from "@/components/patients/patient-form";
import { PageHeader } from "@/components/shared/page-header";
import { saveMedicalHistory } from "@/features/patients/actions/save-medical-history";
import { updatePatient } from "@/features/patients/actions/update-patient";
import { getPatientEditForm } from "@/features/patients/queries/get-patient-edit-form";
import { requirePermission } from "@/lib/auth/guards";

type EditPatientPageProps = {
  params: Promise<{
    patientId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditPatientPage({
  params,
  searchParams
}: EditPatientPageProps) {
  await requirePermission("patients:*");
  const { patientId } = await params;
  const resolvedSearchParams = await searchParams;
  const defaults = await getPatientEditForm(patientId);

  async function submitPatientUpdate(formData: FormData) {
    "use server";

    const patientResult = await updatePatient(patientId, {
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

    if (!patientResult.ok) {
      redirect(
        `/patients/${patientId}/edit?error=${encodeURIComponent(
          patientResult.message ?? "تعذر تحديث المريض."
        )}`
      );
    }

    const medicalHistoryResult = await saveMedicalHistory({
      patientId,
      allergies: String(formData.get("allergies") ?? "") || undefined,
      chronicConditions:
        String(formData.get("chronicConditions") ?? "") || undefined,
      currentMedications:
        String(formData.get("currentMedications") ?? "") || undefined,
      medicalNotes: String(formData.get("notes") ?? "") || undefined
    });

    if (!medicalHistoryResult.ok) {
      redirect(
        `/patients/${patientId}/edit?error=${encodeURIComponent(
          medicalHistoryResult.message ?? "تم تحديث المريض لكن تعذر حفظ السجل الطبي."
        )}`
      );
    }

    redirect(`/patients/${patientId}`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="تعديل المريض"
        title="تعديل ملف المريض"
        description="تحديث بيانات المريض الأساسية وملخصه الطبي من نفس نموذج الإضافة."
      />

      <PatientForm
        action={submitPatientUpdate}
        notice={resolvedSearchParams?.error}
        defaults={defaults}
        submitLabel="حفظ التعديلات"
      />
    </div>
  );
}
