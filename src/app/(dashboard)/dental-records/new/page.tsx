import Link from "next/link";
import { redirect } from "next/navigation";

import { DentalRecordForm } from "@/components/dental-records/dental-record-form";
import { PageHeader } from "@/components/shared/page-header";
import { createDentalRecord } from "@/features/dental-records/actions/create-dental-record";
import { getDentistsList } from "@/features/dentists/queries/get-dentists-list";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { requirePermission } from "@/lib/auth/guards";

type NewDentalRecordPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewDentalRecordPage({
  searchParams
}: NewDentalRecordPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("dental-records:*");

  const [patients, dentists] = await Promise.all([
    getPatientsList(),
    getDentistsList()
  ]);

  async function submitDentalRecordForm(formData: FormData) {
    "use server";

    const result = await createDentalRecord({
      patientId: String(formData.get("patientId") ?? ""),
      dentistId: String(formData.get("dentistId") ?? ""),
      appointmentDate: String(formData.get("appointmentDate") ?? ""),
      toothNumbers: String(formData.get("toothNumbers") ?? "") || undefined,
      chiefComplaint: String(formData.get("chiefComplaint") ?? "") || undefined,
      examinationNotes:
        String(formData.get("examinationNotes") ?? "") || undefined,
      diagnosis: String(formData.get("diagnosis") ?? "") || undefined,
      procedureDone: String(formData.get("procedureDone") ?? "") || undefined,
      prescription: String(formData.get("prescription") ?? "") || undefined,
      followUpNotes: String(formData.get("followUpNotes") ?? "") || undefined
    });

    if (!result.ok) {
      redirect(
        `/dental-records/new?error=${encodeURIComponent(
          result.message ?? "تعذر حفظ السجل الطبي."
        )}`
      );
    }

    redirect("/dental-records");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Create Dental Record"
        title="إضافة سجل طبي جديد"
        description="وثّق الزيارة السريرية بشكل منظم من أول مرة، مع مسار واضح للطبيب يحفظ الشكوى والفحص والتشخيص والإجراء والمتابعة داخل ملف المريض."
        tips={[
          "اختر المريض والطبيب قبل كتابة التفاصيل",
          "سجّل الأسنان المتأثرة إذا كانت مهمة للعلاج",
          "اكتب المتابعة القادمة بشكل مختصر وواضح"
        ]}
        actions={
          <>
            <Link
              href="/patients"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              ملفات المرضى
            </Link>
            <Link
              href="/dental-records"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              السجلات الطبية
            </Link>
          </>
        }
      />

      <DentalRecordForm
        patients={patients}
        dentists={dentists}
        action={submitDentalRecordForm}
        notice={resolvedSearchParams?.error}
      />
    </div>
  );
}
