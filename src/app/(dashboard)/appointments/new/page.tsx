import Link from "next/link";
import { redirect } from "next/navigation";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { FormGuidePanel } from "@/components/shared/form-guide-panel";
import { PageHeader } from "@/components/shared/page-header";
import { createAppointment } from "@/features/appointments/actions/create-appointment";
import { getDentistsList } from "@/features/dentists/queries/get-dentists-list";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { getServicesList } from "@/features/services-catalog/queries/get-services-list";
import { requirePermission } from "@/lib/auth/guards";
import { getFormGuide } from "@/lib/constants/form-guides";
import { buildQueryPath } from "@/lib/navigation/create-flow";
import { AppointmentStatus } from "@/types/domain";

type NewAppointmentPageProps = {
  searchParams?: Promise<{
    error?: string;
    patientId?: string;
    dentistId?: string;
    serviceId?: string;
    status?: AppointmentStatus;
    appointmentDate?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
  }>;
};

export default async function NewAppointmentPage({
  searchParams
}: NewAppointmentPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("appointments:*");
  const formGuide = getFormGuide("appointment");

  const [patients, dentists, services] = await Promise.all([
    getPatientsList(),
    getDentistsList(),
    getServicesList()
  ]);

  async function submitAppointmentForm(formData: FormData) {
    "use server";

    const date = String(formData.get("appointmentDate") ?? "");
    const startTime = String(formData.get("startTime") ?? "");
    const endTime = String(formData.get("endTime") ?? "");
    const patientId = String(formData.get("patientId") ?? "");

    const result = await createAppointment({
      patientId,
      dentistId: String(formData.get("dentistId") ?? ""),
      serviceId: String(formData.get("serviceId") ?? ""),
      startsAt: date && startTime ? new Date(`${date}T${startTime}:00`).toISOString() : "",
      endsAt: date && endTime ? new Date(`${date}T${endTime}:00`).toISOString() : "",
      status: String(formData.get("status") ?? "scheduled"),
      notes: String(formData.get("notes") ?? "") || undefined
    });

    if (!result.ok) {
      redirect(
        buildQueryPath("/appointments/new", {
          patientId,
          dentistId: String(formData.get("dentistId") ?? ""),
          serviceId: String(formData.get("serviceId") ?? ""),
          status: String(formData.get("status") ?? "scheduled"),
          appointmentDate: date,
          startTime,
          endTime,
          notes: String(formData.get("notes") ?? ""),
          error: result.message ?? "تعذر إنشاء الموعد."
        })
      );
    }

    redirect(
      buildQueryPath(`/patients/${encodeURIComponent(patientId)}`, {
        success: result.message ?? "تم إنشاء الموعد بنجاح.",
        spotlight: "appointment-created"
      })
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Create Appointment"
        title="حجز موعد جديد"
        description="رتّب الزيارة من أول مرة بشكل واضح للفريق كاملًا، مع اختيار المريض والطبيب والخدمة والوقت في مسار واحد نظيف يقلل الأخطاء وإعادة الجدولة."
        tips={[
          "أضف المريض أولًا إذا لم يكن موجودًا",
          "اختر الخدمة لتوضيح نوع الجلسة ومدتها",
          "اترك الحالة مجدول حتى يتم التأكيد"
        ]}
        actions={
          <>
            <Link
              href="/patients/new"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              مريض جديد
            </Link>
            <Link
              href="/appointments"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              جدول المواعيد
            </Link>
          </>
        }
      />

      <FormGuidePanel guide={formGuide} />

      <AppointmentForm
        patients={patients}
        dentists={dentists}
        services={services}
        action={submitAppointmentForm}
        notice={resolvedSearchParams?.error}
        draftKey="appointments:create"
        defaults={{
          patientId: resolvedSearchParams?.patientId,
          dentistId: resolvedSearchParams?.dentistId,
          serviceId: resolvedSearchParams?.serviceId,
          status: resolvedSearchParams?.status,
          appointmentDate: resolvedSearchParams?.appointmentDate,
          startTime: resolvedSearchParams?.startTime,
          endTime: resolvedSearchParams?.endTime,
          notes: resolvedSearchParams?.notes
        }}
      />
    </div>
  );
}
