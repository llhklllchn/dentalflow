import { FormActions } from "@/components/shared/form-actions";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";
import {
  DentistListItem,
  PatientListItem,
  ServiceListItem
} from "@/lib/constants/mock-data";
import { getAppointmentStatusOptions } from "@/lib/domain/labels";
import { formatMetricNumber } from "@/lib/utils/formatted-value";
import { AppointmentStatus } from "@/types/domain";

type AppointmentFormDefaults = {
  patientId?: string;
  dentistId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
};

type AppointmentFormProps = {
  patients: PatientListItem[];
  dentists: DentistListItem[];
  services: ServiceListItem[];
  action: (formData: FormData) => void | Promise<void>;
  notice?: string;
  defaults?: AppointmentFormDefaults;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  showStatusField?: boolean;
};

export function AppointmentForm({
  patients,
  dentists,
  services,
  action,
  notice,
  defaults,
  primaryLabel = "حفظ الموعد",
  secondaryHref = "/appointments",
  secondaryLabel = "العودة إلى المواعيد",
  showStatusField = true
}: AppointmentFormProps) {
  const defaultStatus = defaults?.status ?? "scheduled";
  const appointmentStatuses = getAppointmentStatusOptions();
  const hasPatients = patients.length > 0;
  const hasDentists = dentists.length > 0;
  const hasServices = services.length > 0;
  const canSubmit = hasPatients && hasDentists && hasServices;

  return (
    <form action={action} className="space-y-6">
      {notice ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-brand-200 bg-brand-50 p-5">
          <div className="text-sm font-semibold text-brand-900">1. اختر المريض</div>
          <p className="mt-2 text-sm leading-7 text-brand-900/80">
            ابحث عن المريض أولًا، وإذا لم يكن موجودًا أضفه ثم عد لإتمام الحجز.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">2. حدد الطبيب والخدمة</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            اختيار الخدمة يساعد الفريق على فهم مدة الزيارة ونوع الجلسة قبل تأكيدها.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">3. ثبّت الوقت</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            النظام يفحص التعارضات الأساسية، لكن اختيار وقت واقعي يقلل إعادة الجدولة.
          </p>
        </div>
      </div>

      {!canSubmit ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900">
          {!hasPatients
            ? "لا توجد ملفات مرضى جاهزة بعد. أضف مريضًا أولًا قبل إنشاء الموعد."
            : !hasDentists
              ? "لا يوجد أطباء جاهزون بعد. اربط ملف طبيب أولًا قبل الحجز."
              : "لا توجد خدمات مفعلة متاحة للحجز. أضف خدمة أو فعّل خدمة موجودة أولًا."}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">مرضى متاحون</div>
          <div className="mt-2 text-2xl font-bold text-ink">{formatMetricNumber(patients.length)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">أطباء متاحون</div>
          <div className="mt-2 text-2xl font-bold text-ink">{formatMetricNumber(dentists.length)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">خدمات متاحة</div>
          <div className="mt-2 text-2xl font-bold text-ink">{formatMetricNumber(services.length)}</div>
        </div>
      </div>

      <FormSection
        title="تفاصيل الموعد"
        description="املأ الحد الأدنى من البيانات ليصبح الموعد واضحًا للاستقبال والطبيب من أول نظرة."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="المريض" required hint="اختر المريض الذي سيحضر للجلسة">
            <select
              name="patientId"
              defaultValue={defaults?.patientId ?? patients[0]?.id}
              required
              disabled={!hasPatients}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="الطبيب" required hint="اختر الطبيب المسؤول عن الجلسة">
            <select
              name="dentistId"
              defaultValue={defaults?.dentistId ?? dentists[0]?.id}
              required
              disabled={!hasDentists}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
            >
              {dentists.map((dentist) => (
                <option key={dentist.id} value={dentist.id}>
                  {dentist.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="الخدمة" required hint="مثل: كشف، تنظيف، علاج عصب">
            <select
              name="serviceId"
              defaultValue={defaults?.serviceId ?? services[0]?.id}
              required
              disabled={!hasServices}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </FormField>
          {showStatusField ? (
            <FormField
              label="الحالة الابتدائية"
              required
              hint="اتركها مجدول إذا لم يتم تأكيد الموعد مع المريض بعد."
            >
              <select
                name="status"
                defaultValue={defaultStatus}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
              >
                {appointmentStatuses
                  .filter((option) => ["scheduled", "confirmed"].includes(option.value))
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </FormField>
          ) : (
            <input type="hidden" name="status" value={defaultStatus} />
          )}
          <FormField label="التاريخ" required>
            <input
              name="appointmentDate"
              type="date"
              defaultValue={defaults?.appointmentDate}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="وقت البداية" required hint="مثال: 09:30">
            <input
              name="startTime"
              type="time"
              defaultValue={defaults?.startTime}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="وقت النهاية" required hint="مثال: 10:00">
            <input
              name="endTime"
              type="time"
              defaultValue={defaults?.endTime}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField
            label="ملاحظات"
            optional
            hint="مثل سبب الزيارة أو ملاحظة مهمة للاستقبال أو الطبيب"
          >
            <input
              name="notes"
              defaultValue={defaults?.notes}
              placeholder="مثال: أول زيارة أو يحتاج مكالمة تأكيد"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
        </div>
      </FormSection>

      <FormActions
        primaryLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
        primaryDisabled={!canSubmit}
        primaryDisabledReason={
          !canSubmit
            ? "وجود المريض والطبيب والخدمة شرط أساسي قبل حفظ الموعد الجديد."
            : undefined
        }
        helperText="إذا لم تؤكد الجلسة بعد، اترك الحالة مجدولة. يمكنك تغييرها لاحقًا من شاشة المواعيد بضغطة واحدة."
      />
    </form>
  );
}
