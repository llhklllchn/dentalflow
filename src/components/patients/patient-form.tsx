import { FormActions } from "@/components/shared/form-actions";
import { FormField } from "@/components/shared/form-field";
import { FormSection } from "@/components/shared/form-section";

type PatientFormDefaults = {
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
};

type PatientFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  notice?: string;
  defaults?: PatientFormDefaults;
  submitLabel?: string;
};

export function PatientForm({
  action,
  notice,
  defaults,
  submitLabel
}: PatientFormProps) {
  return (
    <form action={action} className="space-y-6">
      {notice ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-brand-200 bg-brand-50 p-5">
          <div className="text-sm font-semibold text-brand-900">1. ابدأ بالحد الأدنى</div>
          <p className="mt-2 text-sm leading-7 text-brand-900/80">
            يكفي الاسم ورقم الهاتف لفتح الملف، ويمكن استكمال بقية البيانات لاحقًا.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">2. سجل طريقة التواصل</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            أضف رقم واتساب إذا كان مختلفًا حتى تصل التذكيرات للشخص الصحيح.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">3. التقط الملاحظات المهمة فقط</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            الحساسية والأدوية الحالية أهم من إدخال تاريخ طبي طويل في أول زيارة.
          </p>
        </div>
      </div>

      <FormSection
        title="البيانات الأساسية"
        description="هذه الحقول تكفي لفتح ملف المريض بسرعة وتسهيل الوصول إليه من الاستقبال والطبيب."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="الاسم الأول" required hint="مثال: سارة">
            <input
              name="firstName"
              defaultValue={defaults?.firstName ?? ""}
              placeholder="اكتب الاسم الأول"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الاسم الأخير" required hint="مثال: علي">
            <input
              name="lastName"
              defaultValue={defaults?.lastName ?? ""}
              placeholder="اكتب الاسم الأخير"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الجنس" optional>
            <select
              name="gender"
              defaultValue={defaults?.gender ?? ""}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="">اختر</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </FormField>
          <FormField label="تاريخ الميلاد" optional>
            <input
              name="dateOfBirth"
              type="date"
              defaultValue={defaults?.dateOfBirth ?? ""}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField
            label="رقم الهاتف"
            required
            hint="يفضل إدخال الرقم مع مفتاح الدولة، مثل +962..."
          >
            <input
              name="phone"
              defaultValue={defaults?.phone ?? ""}
              placeholder="+9627XXXXXXXX"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField
            label="رقم واتساب"
            optional
            hint="اتركه فارغًا إذا كان نفس رقم الهاتف."
          >
            <input
              name="whatsappPhone"
              defaultValue={defaults?.whatsappPhone ?? ""}
              placeholder="+9627XXXXXXXX"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="البريد الإلكتروني" optional>
            <input
              name="email"
              type="email"
              defaultValue={defaults?.email ?? ""}
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="رقم الهوية" optional>
            <input
              name="nationalId"
              defaultValue={defaults?.nationalId ?? ""}
              placeholder="اختياري"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="المدينة" optional>
            <input
              name="city"
              defaultValue={defaults?.city ?? ""}
              placeholder="مثال: عمّان"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="العنوان" optional>
            <input
              name="address"
              defaultValue={defaults?.address ?? ""}
              placeholder="الحي أو الشارع"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="البيانات الطبية السريعة"
        description="سجل أهم ما يجب أن يراه الطبيب من أول نظرة، ويمكن تحديث هذه البيانات لاحقًا من ملف المريض."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="الحساسية" optional hint="مثل: البنسلين أو التخدير">
            <textarea
              name="allergies"
              defaultValue={defaults?.allergies ?? ""}
              placeholder="اكتب أي حساسية مهمة للطبيب"
              className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الأمراض المزمنة" optional hint="مثل: السكري أو الضغط">
            <textarea
              name="chronicConditions"
              defaultValue={defaults?.chronicConditions ?? ""}
              placeholder="اكتب الأمراض المزمنة إن وجدت"
              className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الأدوية الحالية" optional hint="تساعد الطبيب على تجنب التعارضات">
            <textarea
              name="currentMedications"
              defaultValue={defaults?.currentMedications ?? ""}
              placeholder="اكتب الأدوية الحالية إن وجدت"
              className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField
            label="ملاحظات عامة"
            optional
            hint="مثل: يفضل الاتصال مساءً أو يخاف من الإبر"
          >
            <textarea
              name="notes"
              defaultValue={defaults?.notes ?? ""}
              placeholder="أي ملاحظات تساعد الفريق في التعامل مع المريض"
              className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
        </div>
      </FormSection>

      <FormActions
        primaryLabel={submitLabel ?? "حفظ ملف المريض"}
        secondaryHref="/patients"
        secondaryLabel="العودة إلى المرضى"
        helperText="إذا اكتفيت بالاسم والهاتف الآن فهذا كافٍ. يمكنك الرجوع لاحقًا لإكمال بقية الملف من صفحة المريض."
      />
    </form>
  );
}
