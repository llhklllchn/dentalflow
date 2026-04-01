import Link from "next/link";
import { redirect } from "next/navigation";

import { DentalRecordForm } from "@/components/dental-records/dental-record-form";
import { FormGuidePanel } from "@/components/shared/form-guide-panel";
import { PageHeader } from "@/components/shared/page-header";
import { createDentalRecord } from "@/features/dental-records/actions/create-dental-record";
import { getDentistsList } from "@/features/dentists/queries/get-dentists-list";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { requirePermission } from "@/lib/auth/guards";
import { getFormGuide } from "@/lib/constants/form-guides";
import { buildQueryPath } from "@/lib/navigation/create-flow";

type NewDentalRecordPageProps = {
  searchParams?: Promise<{
    error?: string;
    patientId?: string;
    dentistId?: string;
    appointmentDate?: string;
    toothNumbers?: string;
    chiefComplaint?: string;
    examinationNotes?: string;
    diagnosis?: string;
    procedureDone?: string;
    prescription?: string;
    followUpNotes?: string;
  }>;
};

export default async function NewDentalRecordPage({
  searchParams
}: NewDentalRecordPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("dental-records:*");
  const formGuide = getFormGuide("dental-record");

  const [patients, dentists] = await Promise.all([
    getPatientsList(),
    getDentistsList()
  ]);

  async function submitDentalRecordForm(formData: FormData) {
    "use server";

    const patientId = String(formData.get("patientId") ?? "");
    const dentistId = String(formData.get("dentistId") ?? "");
    const appointmentDate = String(formData.get("appointmentDate") ?? "");
    const toothNumbers = String(formData.get("toothNumbers") ?? "");
    const chiefComplaint = String(formData.get("chiefComplaint") ?? "");
    const examinationNotes = String(formData.get("examinationNotes") ?? "");
    const diagnosis = String(formData.get("diagnosis") ?? "");
    const procedureDone = String(formData.get("procedureDone") ?? "");
    const prescription = String(formData.get("prescription") ?? "");
    const followUpNotes = String(formData.get("followUpNotes") ?? "");

    const result = await createDentalRecord({
      patientId,
      dentistId,
      appointmentDate,
      toothNumbers: toothNumbers || undefined,
      chiefComplaint: chiefComplaint || undefined,
      examinationNotes: examinationNotes || undefined,
      diagnosis: diagnosis || undefined,
      procedureDone: procedureDone || undefined,
      prescription: prescription || undefined,
      followUpNotes: followUpNotes || undefined
    });

    if (!result.ok) {
      redirect(
        buildQueryPath("/dental-records/new", {
          patientId,
          dentistId,
          appointmentDate,
          toothNumbers,
          chiefComplaint,
          examinationNotes,
          diagnosis,
          procedureDone,
          prescription,
          followUpNotes,
          error: result.message ?? "تعذر حفظ السجل الطبي."
        })
      );
    }

    redirect(
      buildQueryPath(`/patients/${encodeURIComponent(patientId)}`, {
        success: result.message ?? "تم حفظ السجل الطبي بنجاح.",
        spotlight: "record-created"
      })
    );
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

      <FormGuidePanel guide={formGuide} />

      <DentalRecordForm
        patients={patients}
        dentists={dentists}
        action={submitDentalRecordForm}
        notice={resolvedSearchParams?.error}
        draftKey="dental-records:create"
        defaults={{
          patientId: resolvedSearchParams?.patientId,
          dentistId: resolvedSearchParams?.dentistId,
          appointmentDate: resolvedSearchParams?.appointmentDate,
          toothNumbers: resolvedSearchParams?.toothNumbers,
          chiefComplaint: resolvedSearchParams?.chiefComplaint,
          examinationNotes: resolvedSearchParams?.examinationNotes,
          diagnosis: resolvedSearchParams?.diagnosis,
          procedureDone: resolvedSearchParams?.procedureDone,
          prescription: resolvedSearchParams?.prescription,
          followUpNotes: resolvedSearchParams?.followUpNotes
        }}
      />
    </div>
  );
}
