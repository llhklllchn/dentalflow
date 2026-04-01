import Link from "next/link";
import { redirect } from "next/navigation";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { PageHeader } from "@/components/shared/page-header";
import { createAppointment } from "@/features/appointments/actions/create-appointment";
import { getDentistsList } from "@/features/dentists/queries/get-dentists-list";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { getServicesList } from "@/features/services-catalog/queries/get-services-list";
import { requirePermission } from "@/lib/auth/guards";

type NewAppointmentPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewAppointmentPage({
  searchParams
}: NewAppointmentPageProps) {
  const resolvedSearchParams = await searchParams;
  await requirePermission("appointments:*");

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

    const result = await createAppointment({
      patientId: String(formData.get("patientId") ?? ""),
      dentistId: String(formData.get("dentistId") ?? ""),
      serviceId: String(formData.get("serviceId") ?? ""),
      startsAt: date && startTime ? new Date(`${date}T${startTime}:00`).toISOString() : "",
      endsAt: date && endTime ? new Date(`${date}T${endTime}:00`).toISOString() : "",
      status: String(formData.get("status") ?? "scheduled"),
      notes: String(formData.get("notes") ?? "") || undefined
    });

    if (!result.ok) {
      redirect(
        `/appointments/new?error=${encodeURIComponent(
          result.message ?? "تعذر إنشاء الموعد."
        )}`
      );
    }

    redirect("/appointments");
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

      <AppointmentForm
        patients={patients}
        dentists={dentists}
        services={services}
        action={submitAppointmentForm}
        notice={resolvedSearchParams?.error}
      />
    </div>
  );
}
