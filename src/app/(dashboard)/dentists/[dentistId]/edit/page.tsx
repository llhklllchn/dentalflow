import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { getDentistEditForm } from "@/features/dentists/queries/get-dentist-edit-form";
import { updateDentistProfile } from "@/features/dentists/actions/update-dentist-profile";
import { requirePermission } from "@/lib/auth/guards";

type EditDentistPageProps = {
  params: Promise<{
    dentistId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function EditDentistPage({
  params,
  searchParams
}: EditDentistPageProps) {
  await requirePermission("dentists:*");
  const { dentistId } = await params;
  const resolvedSearchParams = await searchParams;
  const dentist = await getDentistEditForm(dentistId);

  async function submitDentistForm(formData: FormData) {
    "use server";

    const result = await updateDentistProfile({
      dentistId: String(formData.get("dentistId") ?? ""),
      specialty: String(formData.get("specialty") ?? "") || undefined,
      licenseNumber: String(formData.get("licenseNumber") ?? "") || undefined,
      colorCode: String(formData.get("colorCode") ?? "") || undefined,
      defaultAppointmentDuration: Number(formData.get("defaultAppointmentDuration") ?? 30),
      startTime: String(formData.get("startTime") ?? "09:00"),
      endTime: String(formData.get("endTime") ?? "17:00")
    });

    if (!result.ok) {
      redirect(
        `/dentists/${encodeURIComponent(dentistId)}/edit?error=${encodeURIComponent(
          result.message ?? "تعذر تحديث ملف الطبيب."
        )}`
      );
    }

    redirect("/dentists?success=تم تحديث ملف الطبيب بنجاح.");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Edit Dentist"
        title="تعديل ملف الطبيب"
        description="تحديث التخصص واللون وساعات العمل والمدة الافتراضية للجلسة من شاشة واحدة."
      />

      {resolvedSearchParams?.error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <div className="panel p-6">
        <form action={submitDentistForm} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="dentistId" value={dentist.id} />
          <input
            name="specialty"
            defaultValue={dentist.specialty}
            placeholder="التخصص"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
          />
          <input
            name="licenseNumber"
            defaultValue={dentist.licenseNumber}
            placeholder="رقم الترخيص"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
          />
          <input
            name="colorCode"
            defaultValue={dentist.colorCode}
            placeholder="#0F766E"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
          />
          <input
            name="defaultAppointmentDuration"
            type="number"
            min={15}
            max={180}
            defaultValue={dentist.defaultAppointmentDuration}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
          />
          <input
            name="startTime"
            type="time"
            defaultValue={dentist.startTime}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
          />
          <input
            name="endTime"
            type="time"
            defaultValue={dentist.endTime}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
          />
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
            >
              حفظ التعديلات
            </button>
            <Link
              href="/dentists"
              className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800"
            >
              العودة إلى الأطباء
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
