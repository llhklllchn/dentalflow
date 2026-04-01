"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type FormEvent,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition
} from "react";

import { cn } from "@/lib/utils/cn";
import { NavigationItem, QuickAction } from "@/types/domain";

type CommandCenterProps = {
  clinicName: string;
  navigationItems: NavigationItem[];
  quickActions: QuickAction[];
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export function CommandCenter({
  clinicName,
  navigationItems,
  quickActions
}: CommandCenterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [isPending, startTransition] = useTransition();

  const filteredQuickActions = quickActions.filter((item) => {
    if (!deferredQuery) {
      return true;
    }

    const haystack = `${item.label} ${item.description} ${item.href}`.toLowerCase();
    return haystack.includes(deferredQuery);
  });

  const filteredNavigation = navigationItems.filter((item) => {
    if (!deferredQuery) {
      return true;
    }

    const haystack = `${item.label} ${item.href}`.toLowerCase();
    return haystack.includes(deferredQuery);
  });

  const hasMatches = filteredQuickActions.length > 0 || filteredNavigation.length > 0;

  function closePalette() {
    setIsOpen(false);
    setQuery("");
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!query.trim()) {
      return;
    }

    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      closePalette();
    });
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((current) => !current);
        return;
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 40);

    return () => {
      window.clearTimeout(timer);
      document.body.style.removeProperty("overflow");
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-start shadow-sm xl:min-w-[240px]"
      >
        <div>
          <div className="text-sm font-semibold text-ink">لوحة الأوامر</div>
          <div className="mt-1 text-xs text-slate-500">تنقل أسرع وابحث من أي مكان</div>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          Ctrl K
        </span>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm md:px-8 md:py-10">
          <button
            type="button"
            aria-label="إغلاق لوحة الأوامر"
            className="absolute inset-0"
            onClick={closePalette}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="لوحة الأوامر"
            className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-[#fcfbf8] shadow-[0_32px_90px_rgba(15,23,42,0.22)]"
          >
            <div className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur md:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
                    Command Center
                  </div>
                  <div className="mt-2 text-2xl font-bold text-ink">لوحة أوامر {clinicName}</div>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                    ابحث عن صفحة أو افتح إجراء سريع أو انتقل مباشرة إلى النتائج العامة دون الخروج
                    من سياق العمل الحالي.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePalette}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  إغلاق
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-3 lg:flex-row">
                <div className="flex flex-1 items-center gap-3 rounded-[1.5rem] border border-brand-200 bg-brand-50 px-4 py-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-800">
                    بحث عام
                  </span>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ابحث عن صفحة أو اكتب اسم مريض أو أمر تريد الوصول إليه..."
                    className="w-full bg-transparent text-sm text-slate-700 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="rounded-[1.5rem] bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isPending ? "جارٍ الفتح..." : "فتح البحث"}
                </button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Ctrl+K لفتح اللوحة", "Enter لفتح نتائج البحث", "Esc للإغلاق"].map((tip) => (
                  <span
                    key={tip}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    {tip}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[1.05fr,0.95fr]">
              <section className="space-y-4">
                <div className="rounded-[1.75rem] border border-brand-100 bg-brand-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-brand-900">أفضل بداية الآن</div>
                      <p className="mt-2 text-sm leading-7 text-brand-900/80">
                        استخدم هذه اللوحة عندما تحتاج الوصول السريع بدل التنقل اليدوي بين أكثر من
                        صفحة.
                      </p>
                    </div>
                    <span className="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-800">
                      {deferredQuery ? "نتائج مفلترة" : "جاهزة الآن"}
                    </span>
                  </div>

                  {query.trim() ? (
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(() => {
                          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                          closePalette();
                        })
                      }
                      className="mt-4 flex w-full items-center justify-between rounded-[1.25rem] border border-brand-200 bg-white px-4 py-4 text-start transition hover:border-brand-300"
                    >
                      <div>
                        <div className="text-sm font-semibold text-ink">
                          ابحث عن &quot;{query.trim()}&quot;
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          افتح صفحة البحث العام مع نتائج عبر المرضى والمواعيد والفواتير.
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-brand-700">فتح</span>
                    </button>
                  ) : null}
                </div>

                <div className="panel p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-ink">الإجراءات السريعة</div>
                      <p className="mt-1 text-sm text-slate-500">
                        اختصارات لأكثر التدفقات استخدامًا خلال اليوم.
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {filteredQuickActions.length}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {filteredQuickActions.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closePalette}
                        className="flex items-center justify-between rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-brand-300 hover:bg-brand-50"
                      >
                        <div>
                          <div className="text-sm font-semibold text-ink">{item.label}</div>
                          <div className="mt-1 text-sm text-slate-600">{item.description}</div>
                        </div>
                        <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                          إجراء سريع
                        </span>
                      </Link>
                    ))}

                    {filteredQuickActions.length === 0 ? (
                      <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        لا توجد إجراءات سريعة مطابقة لعبارة البحث الحالية.
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="panel p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-ink">التنقل بين الوحدات</div>
                      <p className="mt-1 text-sm text-slate-500">
                        افتح أي قسم رئيسي بسرعة مع إبراز ما أنت فيه الآن.
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {filteredNavigation.length}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {filteredNavigation.map((item) => {
                      const active = isActivePath(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closePalette}
                          className={cn(
                            "flex items-center justify-between rounded-[1.35rem] border px-4 py-4 transition",
                            active
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50"
                          )}
                        >
                          <div>
                            <div className="text-sm font-semibold">{item.label}</div>
                            <div
                              className={cn(
                                "mt-1 text-sm",
                                active ? "text-white/70" : "text-slate-600"
                              )}
                            >
                              {active ? "أنت داخل هذا القسم الآن" : `افتح ${item.label} مباشرة`}
                            </div>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              active
                                ? "bg-white/10 text-white"
                                : "border border-slate-200 bg-slate-50 text-slate-600"
                            )}
                          >
                            {active ? "مفتوح" : "فتح"}
                          </span>
                        </Link>
                      );
                    })}

                    {filteredNavigation.length === 0 ? (
                      <div className="rounded-[1.35rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                        لا توجد وحدات رئيسية مطابقة لعبارة البحث الحالية.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
                  <div className="text-lg font-semibold text-ink">ملاحظات سريعة</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                      افتح اللوحة من أي صفحة داخل لوحة التحكم باستخدام <strong>Ctrl + K</strong>.
                    </div>
                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                      إذا لم تجد الوجهة بسرعة، اكتب العبارة ثم افتح البحث العام مباشرة من نفس المكان.
                    </div>
                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                      اللوحة تحترم الصلاحيات الحالية، لذلك لن تظهر إلا الصفحات والإجراءات المسموح لك بها.
                    </div>
                  </div>
                </div>

                {!hasMatches ? (
                  <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
                    لا توجد نتائج مطابقة الآن. جرّب كلمات أقصر أو افتح البحث العام بالعبارة التي كتبتها.
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
