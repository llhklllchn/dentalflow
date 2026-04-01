import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { registerClinicAction } from "@/features/auth/actions/register-clinic";

type RegisterClinicPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterClinicPage({ searchParams }: RegisterClinicPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <AuthShell
      title="إنشاء عيادة جديدة"
      description="أنشئ حساب العيادة والمالك الأول في خطوة واحدة، مع إعدادات افتراضية مناسبة للإطلاق في الأردن."
      asideTitle="انطلاقة مرتبة من أول يوم"
      asideDescription="نجهز لك أساس التشغيل الحقيقي منذ البداية: هوية العيادة، المالك الأول، المنطقة الزمنية، اللغة، والعملة."
      highlights={[
        "تهيئة أولية سريعة لعيادة أسنان عربية بدون تعقيد تقني.",
        "إعدادات افتراضية مناسبة لـ JOD و Asia/Amman وواجهة عربية.",
        "جاهز للانتقال مباشرة إلى لوحة التحكم بعد إنشاء الحساب."
      ]}
      stats={[
        { value: "1", label: "حساب مالك أول يُفعّل العيادة ويفتح لك لوحة التشغيل مباشرة" },
        { value: "JOD", label: "إعدادات افتراضية للإطلاق المحلي في الأردن" }
      ]}
    >
      {resolvedSearchParams?.error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {resolvedSearchParams.error}
        </div>
      ) : null}

      <form action={registerClinicAction}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">اسم العيادة</span>
            <input
              name="clinicName"
              autoComplete="organization"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              الاسم الأول للمالك
            </span>
            <input
              name="ownerFirstName"
              autoComplete="given-name"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              اسم العائلة
            </span>
            <input
              name="ownerLastName"
              autoComplete="family-name"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              البريد الإلكتروني
            </span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">رقم الهاتف</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">كلمة المرور</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">الدولة</span>
            <input
              name="country"
              defaultValue="Jordan"
              autoComplete="country-name"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">المدينة</span>
            <input
              name="city"
              defaultValue="Amman"
              autoComplete="address-level2"
              required
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">العملة</span>
            <select
              name="currency"
              defaultValue="JOD"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="JOD">JOD - الدينار الأردني</option>
              <option value="USD">USD - الدولار الأمريكي</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">اللغة</span>
            <select
              name="language"
              defaultValue="ar-JO"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="ar-JO">العربية - الأردن</option>
              <option value="en">English</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              المنطقة الزمنية
            </span>
            <select
              name="timezone"
              defaultValue="Asia/Amman"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="Asia/Amman">Asia/Amman</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-500">
          بعد الإنشاء سيتم تسجيل دخولك مباشرة إلى لوحة التحكم بصفتك مالك العيادة الأول.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            إنشاء العيادة
          </button>
          <Link
            href="/login"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800"
          >
            لدي حساب بالفعل
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
