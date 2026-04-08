import { redirect } from "next/navigation";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { PageHeader } from "@/components/shared/page-header";
import { updateAppointment } from "@/features/appointments/actions/update-appointment";
import { getAppointmentEditForm } from "@/features/appointments/queries/get-appointment-edit-form";
import { getDentistsList } from "@/features/dentists/queries/get-dentists-list";
import { getPatientsList } from "@/features/patients/queries/get-patients-list";
import { getServicesList } from "@/features/services-catalog/queries/get-services-list";
import { requirePermission } from "@/lib/auth/guards";

type EditAppointmentPageProps = {
  params: Promise<{
    appointmentId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditAppointmentPage({
  params,
  searchParams
}: EditAppointmentPageProps) {
  await requirePermission("appointments:*");
  const { appointmentId } = await params;
  const resolvedSearchParams = await searchParams;

  const [appointment, patients, dentists, services] = await Promise.all([
    getAppointmentEditForm(appointmentId),
    getPatientsList(),
    getDentistsList(),
    getServicesList()
  ]);

  if (!appointment) {
    redirect("/appointments?error=%D8%A7%D9%84%D9%85%D9%88%D8%B9%D8%AF%20%D8%BA%D9%8A%D8%B1%20%D9%85%D9%88%D8%AC%D9%88%D8%AF");
  }

  const currentAppointment = appointment;

  async function submitAppointmentUpdateForm(formData: FormData) {
    "use server";

    const date = String(formData.get("appointmentDate") ?? "");
    const startTime = String(formData.get("startTime") ?? "");
    const endTime = String(formData.get("endTime") ?? "");

    const result = await updateAppointment({
      appointmentId,
      patientId: String(formData.get("patientId") ?? ""),
      dentistId: String(formData.get("dentistId") ?? ""),
      serviceId: String(formData.get("serviceId") ?? ""),
      startsAt: date && startTime ? new Date(`${date}T${startTime}:00`).toISOString() : "",
      endsAt: date && endTime ? new Date(`${date}T${endTime}:00`).toISOString() : "",
      status: String(formData.get("status") ?? currentAppointment.status),
      notes: String(formData.get("notes") ?? "") || undefined
    });

    if (!result.ok) {
      redirect(
        `/appointments/${appointmentId}/edit?error=${encodeURIComponent(
          result.message ?? "تعذر تحديث الموعد."
        )}`
      );
    }

    redirect(
      `/appointments?success=${encodeURIComponent(result.message ?? "تم تحديث الموعد.")}`
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="تعديل الموعد"
        title="تعديل الموعد"
        description="إعادة جدولة الموعد أو تعديل الطبيب أو الخدمة أو الملاحظات بدون فقدان حالة الموعد الحالية."
      />

      <AppointmentForm
        patients={patients}
        dentists={dentists}
        services={services}
        action={submitAppointmentUpdateForm}
        notice={resolvedSearchParams?.error}
        defaults={currentAppointment}
        primaryLabel="حفظ تعديلات الموعد"
        showStatusField={false}
      />
    </div>
  );
}
