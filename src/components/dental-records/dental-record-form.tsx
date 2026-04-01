import { DentistListItem, PatientListItem } from "@/lib/constants/mock-data";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

import { FormActions } from "@/components/shared/form-actions";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";

type DentalRecordFormProps = {
  patients: PatientListItem[];
  dentists: DentistListItem[];
  action: (formData: FormData) => void | Promise<void>;
  notice?: string;
};

export function DentalRecordForm({
  patients,
  dentists,
  action,
  notice
}: DentalRecordFormProps) {
  const hasPatients = patients.length > 0;
  const hasDentists = dentists.length > 0;
  const canSubmit = hasPatients && hasDentists;

  return (
    <form action={action} className="space-y-6">
      {notice ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-brand-200 bg-brand-50 p-5">
          <div className="text-sm font-semibold text-brand-900">1. اربط الزيارة بالطرفين الصحيحين</div>
          <p className="mt-2 text-sm leading-7 text-brand-900/80">
            اختيار المريض والطبيب بدقة يجعل السجل قابلًا للمراجعة والمتابعة لاحقًا بدون التباس.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">2. دوّن الحد السريري المهم</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            الشكوى، التشخيص، والإجراء أهم من الإطالة. المهم أن يرى الطبيب القادم الصورة بسرعة.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">3. لا تنسَ المتابعة</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            ملاحظات المتابعة أو الوصفة هي ما يحول السجل من أرشيف إلى أداة تشغيل حقيقية.
          </p>
        </div>
      </div>

      {!canSubmit ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900">
          {hasPatients
            ? "لا يوجد أطباء جاهزون بعد. أنشئ أو اربط ملف طبيب أولًا قبل حفظ سجل سريري."
            : "لا توجد ملفات مرضى جاهزة بعد. أضف مريضًا أولًا ثم عد لتوثيق الزيارة."}
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
          <div className="text-sm text-slate-500">التوثيق المطلوب</div>
          <div className="mt-2 text-base font-bold text-ink">شكوى + تشخيص + إجراء</div>
        </div>
      </div>

      <FormSection
        title="بيانات الزيارة"
        description="أدخل السجل السريري واربطه بالمريض والطبيب وتاريخ الزيارة والأسنان المعنية."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="المريض" required>
            <select
              name="patientId"
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
          <FormField label="الطبيب" required>
            <select
              name="dentistId"
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
          <FormField label="تاريخ الزيارة" required>
            <input
              name="appointmentDate"
              type="date"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الأسنان المعنية" optional hint="مثل: 14, 16 أو 21-22">
            <input
              name="toothNumbers"
              placeholder="14, 16"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="الوصف السريري"
        description="ركّز على المحتوى السريري الذي سيساعد الطبيب عند العودة إلى السجل لاحقًا."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="الشكوى الرئيسية" optional hint="ما الذي جاء به المريض أو ما الذي اشتكى منه؟">
            <textarea
              name="chiefComplaint"
              placeholder="مثال: ألم متقطع في السن 14 منذ أسبوع"
              className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الفحص" optional hint="ملاحظات المعاينة أو الفحص السريري">
            <textarea
              name="examinationNotes"
              placeholder="مثال: حساسية للبرد، نخر واضح، وتهيج لثوي خفيف"
              className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="التشخيص" optional hint="الخلاصة الطبية أو التشخيص النهائي">
            <textarea
              name="diagnosis"
              placeholder="مثال: تسوس عميق مع حاجة لعلاج عصب"
              className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الإجراء المنفذ" optional hint="ما الذي تم عمله فعلًا خلال الجلسة؟">
            <textarea
              name="procedureDone"
              placeholder="مثال: فتح الحجرة اللبية ووضع دواء مؤقت"
              className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الوصفة" optional hint="الدواء أو التعليمات العلاجية">
            <textarea
              name="prescription"
              placeholder="مثال: مسكن عند الحاجة وغسول فم لمدة 5 أيام"
              className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="ملاحظات المتابعة" optional hint="ما الذي يجب عمله أو متابعته لاحقًا؟">
            <textarea
              name="followUpNotes"
              placeholder="مثال: مراجعة بعد أسبوع واستكمال علاج العصب"
              className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
        </div>
      </FormSection>

      <FormActions
        primaryLabel="حفظ السجل الطبي"
        secondaryHref="/dental-records"
        secondaryLabel="العودة إلى السجلات"
        primaryDisabled={!canSubmit}
        primaryDisabledReason={
          !canSubmit
            ? "وجود مريض وطبيب جاهزين شرط أساسي قبل حفظ أي سجل سريري جديد."
            : undefined
        }
        helperText="كلما كان السجل مختصرًا وواضحًا وقابلًا للمتابعة، أصبح أكثر فائدة للطبيب والفريق في الزيارات القادمة."
      />
    </form>
  );
}
