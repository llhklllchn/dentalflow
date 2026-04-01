"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { NavigationItem } from "@/types/domain";

type SidebarProps = {
  items: NavigationItem[];
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

function BrandCard() {
  return (
    <div className="panel overflow-hidden p-5">
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">
        DentFlow
      </div>
      <h1 className="text-2xl font-bold text-ink">تشغيل عيادات الأسنان</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        لوحة موحدة للمواعيد والمرضى والعلاج والفواتير بتجربة عربية أوضح للفريق اليومي.
      </p>
    </div>
  );
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div className="xl:hidden px-4 pt-4 md:px-8">
        <BrandCard />
        <div className="mt-4 overflow-x-auto">
          <nav className="flex min-w-max gap-2 pb-1">
            {items.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "border-brand-600 bg-brand-600 text-white shadow-panel"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-slate-950"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <aside className="hidden border-l border-slate-200/80 bg-white/70 px-5 py-6 backdrop-blur xl:sticky xl:top-0 xl:block xl:h-screen">
        <BrandCard />

        <div className="mt-6 rounded-[1.5rem] border border-brand-100 bg-brand-50 px-4 py-4 text-sm leading-7 text-brand-950">
          تنقل بين الوحدات الأساسية بسرعة، وابقِ العمليات اليومية للفريق ضمن مسار واضح.
        </div>

        <div className="mt-6">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            الوحدات الرئيسية
          </div>
          <nav className="space-y-2">
            {items.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-slate-950 text-white shadow-panel"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  )}
                >
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      "status-dot",
                      active ? "bg-brand-300" : "bg-slate-300"
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
          <div className="font-semibold text-ink">ملاحظة تشغيلية</div>
          <p className="mt-2 leading-7">
            استخدم شريط البحث والإضافات السريعة في الأعلى لتقليل التنقل اليدوي بين الصفحات.
          </p>
        </div>
      </aside>
    </>
  );
}
