import {
  DentistListItem,
  PatientListItem,
  ServiceListItem
} from "@/lib/constants/mock-data";
import { formatMetricNumber } from "@/lib/utils/formatted-value";

import { FormActions } from "@/components/shared/form-actions";
import { FormDraftAssistant } from "@/components/shared/form-draft-assistant";
import { FormField } from "@/components/shared/form-field";
import { FormNavigator } from "@/components/shared/form-navigator";
import { FormSection } from "@/components/shared/form-section";

type TreatmentPlanFormDefaults = {
  patientId?: string;
  dentistId?: string;
  title?: string;
  status?: string;
  serviceName?: string;
  toothNumber?: string;
  description?: string;
  estimatedCost?: number;
  sessionOrder?: number;
  plannedDate?: string;
};

type TreatmentPlanFormProps = {
  patients: PatientListItem[];
  dentists: DentistListItem[];
  services: ServiceListItem[];
  action: (formData: FormData) => void | Promise<void>;
  notice?: string;
  defaults?: TreatmentPlanFormDefaults;
  draftKey?: string;
};

function getTreatmentPlanStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "مسودة";
    case "planned":
      return "مخططة";
    case "approved":
      return "معتمدة";
    default:
      return status;
  }
}

export function TreatmentPlanForm({
  patients,
  dentists,
  services,
  action,
  notice,
  defaults,
  draftKey
}: TreatmentPlanFormProps) {
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

      {draftKey ? <FormDraftAssistant draftKey={draftKey} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-brand-200 bg-brand-50 p-5">
          <div className="text-sm font-semibold text-brand-900">1. اربط الخطة بالمريض الصحيح</div>
          <p className="mt-2 text-sm leading-7 text-brand-900/80">
            الخطة العلاجية تصبح مفيدة عندما تعكس حالة المريض الحقيقية وترتبط بطبيبه المسؤول.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">2. ابدأ بعنصر أول واضح</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            العنصر الأول هو النواة التي سيبنى عليها التقدم والجلسات والتكلفة لاحقًا.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink">3. اجعل الحالة واقعية</div>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            ابدأ بمسودة إذا كانت الخطة تحتاج نقاشًا، أو مخططة/معتمدة إذا كانت جاهزة للتنفيذ.
          </p>
        </div>
      </div>

      {!canSubmit ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900">
          {!hasPatients
            ? "لا توجد ملفات مرضى جاهزة بعد. أضف مريضًا أولًا قبل إنشاء خطة علاج."
            : !hasDentists
              ? "لا يوجد أطباء جاهزون بعد. اربط ملف طبيب أولًا قبل إنشاء الخطة."
              : "لا توجد خدمات علاجية جاهزة بعد. أضف خدمة واحدة على الأقل قبل إنشاء الخطة."}
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

      <FormNavigator
        title="ابنِ الخطة كخارطة علاج قابلة للتنفيذ"
        description="ابدأ ببيانات الخطة نفسها، ثم أضف العنصر العلاجي الأول. هذا يجعل الخطة واضحة وسهلة التحويل إلى موعد أو فاتورة."
        readinessItems={[
          "ابدأ بالمريض والطبيب والعنوان العلاجي.",
          "اختر الخدمة والتكلفة التقديرية قبل أي تفاصيل إضافية.",
          "اجعل الحالة مسودة إذا كانت الخطة تحتاج مراجعة."
        ]}
        sections={[
          {
            id: "treatment-plan-core-details",
            label: "بيانات الخطة",
            hint: "المريض والطبيب والعنوان والحالة العامة."
          },
          {
            id: "treatment-plan-first-item",
            label: "العنصر العلاجي الأول",
            hint: "الخدمة والتكلفة والجلسة الأولى أو التاريخ المقترح."
          }
        ]}
      />

      <FormSection id="treatment-plan-core-details" badgeLabel="الهوية العلاجية"
        title="بيانات الخطة"
        description="اجمع المريض والطبيب وعنوان الخطة مع الحالة العامة بحيث تصبح جاهزة للمراجعة أو التنفيذ."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="المريض" required>
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
          <FormField label="الطبيب" required>
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
          <FormField label="عنوان الخطة" required hint="مثال: إعادة تأهيل الفك العلوي أو خطة السن 16">
            <input
              name="title"
              defaultValue={defaults?.title}
              required
              placeholder="عنوان واضح يختصر الهدف العلاجي"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الحالة" required>
            <select
              name="status"
              defaultValue={defaults?.status ?? "draft"}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            >
              {["draft", "planned", "approved"].map((status) => (
                <option key={status} value={status}>
                  {getTreatmentPlanStatusLabel(status)}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </FormSection>

      <FormSection id="treatment-plan-first-item" badgeLabel="البداية العملية"
        title="العنصر العلاجي الأول"
        description="هذه النسخة الحالية تحفظ عنصرًا أوليًا واحدًا داخل الخطة، لذلك اجعله أوضح عنصر تحتاجه للبدء."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="الخدمة" required>
            <select
              name="serviceName"
              defaultValue={defaults?.serviceName ?? services[0]?.name}
              required
              disabled={!hasServices}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 disabled:bg-slate-100"
            >
              {services.map((service) => (
                <option key={service.id} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="السن المعني" optional hint="مثل: 16 أو 24-25 عند الحاجة">
            <input
              name="toothNumber"
              defaultValue={defaults?.toothNumber}
              placeholder="16"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="الوصف" optional hint="ماذا سيتضمن هذا العنصر أو ما مبرره؟">
            <textarea
              name="description"
              defaultValue={defaults?.description}
              placeholder="مثال: علاج عصب يتبعه بناء وتاج خزفي"
              className="min-h-24 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="التكلفة التقديرية" required>
            <input
              name="estimatedCost"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaults?.estimatedCost}
              required
              placeholder="0.00"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="ترتيب الجلسة" required>
            <input
              name="sessionOrder"
              type="number"
              min="1"
              step="1"
              defaultValue={defaults?.sessionOrder ?? 1}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
          <FormField label="التاريخ المقترح" optional>
            <input
              name="plannedDate"
              type="date"
              defaultValue={defaults?.plannedDate}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </FormField>
        </div>
      </FormSection>

      <FormActions
        primaryLabel="حفظ الخطة"
        secondaryHref="/treatment-plans"
        secondaryLabel="العودة إلى خطط العلاج"
        primaryDisabled={!canSubmit}
        primaryDisabledReason={
          !canSubmit
            ? "وجود المريض والطبيب والخدمة شرط أساسي قبل حفظ أي خطة علاج جديدة."
            : undefined
        }
        helperText="الخطة لا تحتاج أن تكون كاملة من أول مرة، لكن يجب أن تكون واضحة بما يكفي ليعرف الفريق ما الذي سيبدأ به وما التكلفة التقديرية للجلسة الأولى."
      />
    </form>
  );
}
