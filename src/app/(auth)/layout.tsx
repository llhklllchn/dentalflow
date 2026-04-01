import Link from "next/link";
import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-brand-100/60 blur-3xl" />
      </div>

      <div className="relative">
        <header className="px-4 pt-5 md:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-full border border-white/70 bg-white/70 px-5 py-3 shadow-sm backdrop-blur">
            <Link href="/" className="text-lg font-bold text-ink">
              DentFlow
            </Link>
            <div className="text-sm text-slate-600">منصة تشغيل عربية لعيادات الأسنان</div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
