import Link from "next/link";
import { ReactNode } from "react";

type MarketingLayoutProps = {
  children: ReactNode;
};

const marketingLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/features", label: "المزايا" },
  { href: "/contact", label: "التواصل" }
];

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-[#fcfbf8]/85 px-4 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-xl font-bold text-ink">
              DentFlow
            </Link>
            <div className="text-sm text-slate-500">تشغيل عيادات الأسنان في الأردن</div>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
            {marketingLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 transition hover:bg-white hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register-clinic"
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            >
              ابدأ الآن
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-slate-200/80 px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <div>منصة عربية متخصصة لإدارة عيادات الأسنان والمواعيد والعلاج والفوترة.</div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/features">المزايا</Link>
            <Link href="/contact">التواصل</Link>
            <Link href="/login">الدخول</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
