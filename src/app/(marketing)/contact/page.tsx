import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";

const contactChannels = [
  {
    title: "عرض تجريبي",
    description: "رتب جلسة استعراض للمنتج مع سيناريو قريب من طريقة عمل العيادة."
  },
  {
    title: "إعداد الإطلاق",
    description: "مساعدة في تهيئة البيئة، البريد، والإعدادات الأساسية قبل التشغيل الفعلي."
  },
  {
    title: "دعم ما بعد الانطلاق",
    description: "مراجعة الاستخدام الفعلي، جمع الملاحظات، وترتيب أولويات التحسين."
  }
];

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <PageHeader
        eyebrow="Contact"
        title="تواصل معنا"
        description="هذه الصفحة أصبحت مناسبة كواجهة أولية لتنظيم التواصل التجاري أو طلب عرض تجريبي قبل ربطها لاحقًا بنموذج أو CRM."
      />

      <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="panel p-6 md:p-8">
          <div className="text-xl font-semibold text-ink">كيف نبدأ مع العيادة؟</div>
          <div className="mt-5 space-y-4">
            {contactChannels.map((channel) => (
              <div
                key={channel.title}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5"
              >
                <div className="text-lg font-semibold text-ink">{channel.title}</div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {channel.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6 md:p-8">
          <div className="text-xl font-semibold text-ink">الخطوة التالية المقترحة</div>
          <p className="mt-3 text-sm leading-8 text-slate-600">
            إذا كنت تريد تحويل هذه الصفحة إلى نقطة بيع حقيقية، فالخطوة المنطقية التالية هي
            ربطها بنموذج طلب عرض تجريبي أو واتساب مخصص للمبيعات.
          </p>

          <div className="mt-6 rounded-[1.75rem] bg-slate-950 p-6 text-white">
            <div className="text-lg font-semibold">اقتراح جاهز للإطلاق المنظم</div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <div>زر لحجز عرض تجريبي لمدة 20 دقيقة.</div>
              <div>زر مباشر للتواصل عبر واتساب التجاري.</div>
              <div>نموذج مختصر يلتقط اسم العيادة والمدينة وعدد الأطباء.</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register-clinic"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
            >
              ابدأ بإنشاء عيادتك
            </Link>
            <Link
              href="/features"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            >
              راجع المزايا
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
