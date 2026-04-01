import { NavigationItem, QuickAction, Role } from "@/types/domain";

type WorkspaceTone = "brand" | "emerald" | "amber" | "rose" | "slate";

type WorkspaceStep = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: WorkspaceTone;
};

type WorkspaceShortcutPreference = {
  href: string;
  label?: string;
  description: string;
};

export type RoleWorkspaceShortcut = {
  href: string;
  label: string;
  description: string;
};

export type RoleWorkspace = {
  focusLabel: string;
  heading: string;
  summary: string;
  topbarFocus: string;
  searchPlaceholder: string;
  helperPoints: string[];
  journeySteps: WorkspaceStep[];
  shortcuts: RoleWorkspaceShortcut[];
};

type RoleWorkspaceBlueprint = Omit<RoleWorkspace, "shortcuts"> & {
  preferredShortcuts: WorkspaceShortcutPreference[];
};

const roleWorkspaceBlueprints: Record<Role, RoleWorkspaceBlueprint> = {
  owner: {
    focusLabel: "رؤية تشغيلية شاملة",
    heading: "أنت تقود العيادة من شاشة واحدة",
    summary:
      "اجمع بين الإيراد والانضباط التشغيلي وجودة الخدمة في بداية اليوم، ثم تحرك مباشرة نحو التنبيهات التي تحتاج قرارًا سريعًا.",
    topbarFocus: "تركيز اليوم: التحصيل والجاهزية العامة",
    searchPlaceholder: "ابحث عن مريض أو تقرير أو فاتورة أو موظف...",
    helperPoints: [
      "ابدأ بالمؤشرات التي تؤثر على الإيراد أو رضا المرضى.",
      "استخدم الاختصارات بدل التنقل الطويل بين الصفحات.",
      "أغلق المتابعات المعلقة مبكرًا حتى يبقى التشغيل مستقرًا."
    ],
    journeySteps: [
      {
        title: "راجع نبض العيادة",
        description: "ابدأ من الملخص التنفيذي حتى ترى أين يوجد ضغط أو فرصة تحتاج قرارًا منك الآن.",
        href: "/dashboard",
        cta: "مراجعة اللوحة",
        tone: "brand"
      },
      {
        title: "تابع الفواتير والتحصيل",
        description: "التقط الرصيد المتأخر والمدفوعات الجديدة قبل أن تتراكم على الفريق المالي.",
        href: "/invoices",
        cta: "فتح الفواتير",
        tone: "emerald"
      },
      {
        title: "ثبت الجاهزية والإعدادات",
        description: "راجع دعوات الفريق وقنوات الإشعار وإعدادات الإطلاق حتى يبقى النظام منضبطًا.",
        href: "/settings",
        cta: "فتح الإعدادات",
        tone: "slate"
      }
    ],
    preferredShortcuts: [
      { href: "/reports", description: "قراءة المؤشرات التنفيذية والمالية بسرعة." },
      { href: "/invoices", description: "متابعة الفواتير المفتوحة والتحصيل المتأخر." },
      { href: "/staff", description: "ضبط الفريق والدعوات والصلاحيات." },
      { href: "/settings", description: "مراجعة جاهزية الإطلاق والإشعارات والإعدادات العامة." }
    ]
  },
  admin: {
    focusLabel: "تشغيل منظم وسريع",
    heading: "أنت تقود انضباط التشغيل اليومي",
    summary:
      "رتب تدفق المرضى والمواعيد والفريق من واجهة واحدة، ثم ادخل إلى التفاصيل فقط عندما يظهر ما يحتاج تدخلك.",
    topbarFocus: "تركيز اليوم: الفريق والمواعيد والمتابعة",
    searchPlaceholder: "ابحث عن مريض أو موعد أو موظف أو خدمة...",
    helperPoints: [
      "ابدأ بطابور الأولويات قبل الغوص في التفاصيل.",
      "ثبّت أي مواعيد غير مؤكدة مبكرًا لتقليل المفاجآت.",
      "راقب الفريق والدعوات حتى يبقى العمل متصلًا بدون انقطاع."
    ],
    journeySteps: [
      {
        title: "افتح أولويات اليوم",
        description: "راجع التنبيهات والحالات التي تحتاج قرارًا أو متابعة من الإدارة فورًا.",
        href: "/dashboard",
        cta: "فتح اللوحة",
        tone: "brand"
      },
      {
        title: "نسق الفريق والمواعيد",
        description: "وحّد العمل بين الاستقبال والأطباء والموظفين قبل بدء ضغط اليوم.",
        href: "/staff",
        cta: "فتح الموظفين",
        tone: "amber"
      },
      {
        title: "راجع الإشعارات والإعدادات",
        description: "تأكد أن التذكيرات والقوالب والإعدادات العامة جاهزة بدون عوائق.",
        href: "/notifications",
        cta: "فتح الإشعارات",
        tone: "slate"
      }
    ],
    preferredShortcuts: [
      { href: "/appointments", description: "الوصول السريع إلى جدول المواعيد وحالاته." },
      { href: "/staff", description: "تنسيق الفريق والدعوات المعلقة." },
      { href: "/notifications", description: "متابعة الإرسال والقوالب وسجل التذكيرات." },
      { href: "/settings", description: "التحكم في الجاهزية والإعدادات اليومية." }
    ]
  },
  dentist: {
    focusLabel: "تركيز سريري مباشر",
    heading: "أمامك مسار علاجي واضح وسريع",
    summary:
      "ادخل إلى الجلسات، افتح الملف السريري، ثم حرّك خطة العلاج أو المتابعة بدون دوران بين صفحات كثيرة.",
    topbarFocus: "تركيز اليوم: الجلسات والسجل الطبي",
    searchPlaceholder: "ابحث عن مريض أو سجل طبي أو خطة علاج...",
    helperPoints: [
      "ابدأ بالمواعيد الحالية أو المؤكدة قبل الحالات المؤجلة.",
      "استخدم الملف السريري كمرجعك الأول بدل البحث في أكثر من مكان.",
      "حدّث خطة العلاج مباشرة بعد الجلسة حتى تبقى الصورة واضحة."
    ],
    journeySteps: [
      {
        title: "راجع جلسات اليوم",
        description: "ابدأ بالمواعيد الحالية والمؤكدة لتعرف ترتيب المرضى والحالات التي تنتظرك.",
        href: "/appointments",
        cta: "فتح المواعيد",
        tone: "brand"
      },
      {
        title: "افتح السجل الطبي",
        description: "دوّن الفحص والتشخيص والإجراء والوصفة من نفس المسار السريري.",
        href: "/dental-records",
        cta: "فتح السجلات الطبية",
        tone: "emerald"
      },
      {
        title: "حدّث خطة العلاج",
        description: "حافظ على وضوح الجلسات القادمة والتكلفة والتقدم بعد كل زيارة.",
        href: "/treatment-plans",
        cta: "فتح خطط العلاج",
        tone: "amber"
      }
    ],
    preferredShortcuts: [
      { href: "/appointments", description: "الوصول السريع إلى قائمة الجلسات اليومية." },
      { href: "/dental-records", description: "فتح السجل السريري للحالات الحالية." },
      { href: "/treatment-plans", description: "متابعة التقدم والخطوات القادمة للعلاج." },
      { href: "/patients", description: "الوصول المباشر إلى ملفات المرضى." }
    ]
  },
  receptionist: {
    focusLabel: "استقبال سريع وواضح",
    heading: "أنت تدير أول انطباع وتجربة الحجز",
    summary:
      "اجعل تسجيل المرضى وحجز المواعيد والتأكيد اليومي أسهل وأسرع، ثم مرر الحالة للفريق بدون أي ضياع.",
    topbarFocus: "تركيز اليوم: الاستقبال والتقويم",
    searchPlaceholder: "ابحث عن مريض أو هاتف أو موعد...",
    helperPoints: [
      "ابدأ بإنشاء أو العثور على المريض قبل أي خطوة أخرى.",
      "ثبّت مواعيد اليوم والغد مبكرًا لتقليل الغياب.",
      "مرر الحالات المكتملة للطبيب أو المحاسبة بشكل واضح."
    ],
    journeySteps: [
      {
        title: "سجل المريض بسرعة",
        description: "أنشئ الملف أو افتحه مباشرة حتى لا يتعطل الاستقبال أو الاتصال.",
        href: "/patients/new",
        cta: "إضافة مريض",
        tone: "brand"
      },
      {
        title: "احجز الموعد المناسب",
        description: "اختر الطبيب والخدمة والوقت من نفس المسار مع منع التعارض.",
        href: "/appointments/new",
        cta: "حجز موعد",
        tone: "emerald"
      },
      {
        title: "تابع جدول اليوم",
        description: "راجع التأكيدات والحضور والانتظار من صفحة واحدة واضحة.",
        href: "/appointments",
        cta: "فتح المواعيد",
        tone: "amber"
      }
    ],
    preferredShortcuts: [
      { href: "/patients/new", description: "إضافة مريض جديد مباشرة من أعلى النظام." },
      { href: "/appointments/new", description: "بدء حجز جديد بسرعة مع الطبيب والخدمة." },
      { href: "/patients", description: "العثور على ملف المريض ومتابعته." },
      { href: "/appointments", description: "متابعة تقويم اليوم والحالات المؤكدة." }
    ]
  },
  accountant: {
    focusLabel: "تحصيل واضح ودقيق",
    heading: "أنت تمسك الدورة المالية اليومية",
    summary:
      "اجعل الفواتير والمدفوعات والتقارير ضمن مسار واحد واضح حتى ترى الرصيد المفتوح والتحصيل الجاري بدون تعقيد.",
    topbarFocus: "تركيز اليوم: الفواتير والمدفوعات",
    searchPlaceholder: "ابحث عن فاتورة أو دفعة أو رصيد أو مريض...",
    helperPoints: [
      "ابدأ بالفواتير المتأخرة قبل تسجيل الدفعات الجديدة.",
      "استخدم صفحة المدفوعات لسحب القصة المالية بسرعة.",
      "اختم يومك من خلال التقارير المالية لا من الذاكرة."
    ],
    journeySteps: [
      {
        title: "راجع الفواتير المفتوحة",
        description: "ابدأ بالحالات المتأخرة أو الجزئية حتى يبقى التحصيل تحت السيطرة.",
        href: "/invoices",
        cta: "فتح الفواتير",
        tone: "brand"
      },
      {
        title: "سجل دفعة جديدة",
        description: "أضف التحصيل مباشرة واربطه بالفاتورة الصحيحة دون تأخير.",
        href: "/payments/new",
        cta: "تسجيل دفعة",
        tone: "emerald"
      },
      {
        title: "اقرأ التقرير المالي",
        description: "راجع الأداء اليومي والرصيد المفتوح حتى تنهي اليوم بصورة واضحة.",
        href: "/reports",
        cta: "فتح التقارير",
        tone: "amber"
      }
    ],
    preferredShortcuts: [
      { href: "/payments/new", description: "تسجيل دفعة جديدة بسرعة." },
      { href: "/invoices", description: "متابعة الفواتير المفتوحة والمتأخرة." },
      { href: "/payments", description: "قراءة سجل التحصيل والمدفوعات الأخيرة." },
      { href: "/reports", description: "الانتقال إلى التقرير المالي المختصر." }
    ]
  },
  assistant: {
    focusLabel: "دعم يومي سلس",
    heading: "أنت تجهز سير الجلسات قبل وأثناء اليوم",
    summary:
      "تابع جدول المرضى والحالات القادمة، وابق قريبًا من الملفات الأساسية حتى تساعد الفريق بسرعة وبدون ارتباك.",
    topbarFocus: "تركيز اليوم: جاهزية الجلسات",
    searchPlaceholder: "ابحث عن موعد أو مريض أو جلسة قريبة...",
    helperPoints: [
      "ابدأ بجدول المواعيد لمعرفة التسلسل الحالي.",
      "حافظ على الوصول السريع إلى ملفات المرضى أثناء الحركة.",
      "استخدم لوحة التحكم كمختصر لمعرفة أين يحتاجك الفريق الآن."
    ],
    journeySteps: [
      {
        title: "راجع نبض اليوم",
        description: "ابدأ من لوحة التحكم لمعرفة الزحام والتنبيهات والحالات القريبة.",
        href: "/dashboard",
        cta: "فتح اللوحة",
        tone: "brand"
      },
      {
        title: "تابع المواعيد الحالية",
        description: "اعرف من وصل ومن ينتظر ومن دخل الجلسة من صفحة واضحة وسريعة.",
        href: "/appointments",
        cta: "فتح المواعيد",
        tone: "emerald"
      },
      {
        title: "افتح ملف المريض عند الحاجة",
        description: "ابق قريبًا من بيانات المريض الأساسية حتى تدعم الفريق بسرعة.",
        href: "/patients",
        cta: "فتح المرضى",
        tone: "slate"
      }
    ],
    preferredShortcuts: [
      { href: "/appointments", description: "الوصول السريع إلى ترتيب الجلسات والحضور." },
      { href: "/patients", description: "فتح ملفات المرضى الأساسية عند الحاجة." },
      { href: "/dashboard", description: "الرجوع إلى النبض العام والتنبيهات اليومية." }
    ]
  }
};

function buildNavigationDescription(label: string) {
  return `الانتقال المباشر إلى ${label} من دون البحث بين الأقسام.`;
}

export function getRoleWorkspace(
  role: Role,
  navigationItems: NavigationItem[],
  quickActions: QuickAction[]
): RoleWorkspace {
  const blueprint = roleWorkspaceBlueprints[role];
  const resolvedItems = new Map<string, { label: string; description: string }>();

  quickActions.forEach((action) => {
    resolvedItems.set(action.href, {
      label: action.label,
      description: action.description
    });
  });

  navigationItems.forEach((item) => {
    if (!resolvedItems.has(item.href)) {
      resolvedItems.set(item.href, {
        label: item.label,
        description: buildNavigationDescription(item.label)
      });
    }
  });

  const shortcuts: RoleWorkspaceShortcut[] = [];
  const seen = new Set<string>();

  blueprint.preferredShortcuts.forEach((shortcut) => {
    const resolved = resolvedItems.get(shortcut.href);

    if (!resolved || seen.has(shortcut.href)) {
      return;
    }

    shortcuts.push({
      href: shortcut.href,
      label: shortcut.label ?? resolved.label,
      description: shortcut.description || resolved.description
    });
    seen.add(shortcut.href);
  });

  if (shortcuts.length < 4) {
    quickActions.forEach((action) => {
      if (seen.has(action.href) || shortcuts.length >= 4) {
        return;
      }

      shortcuts.push({
        href: action.href,
        label: action.label,
        description: action.description
      });
      seen.add(action.href);
    });
  }

  if (shortcuts.length < 4) {
    navigationItems.forEach((item) => {
      if (seen.has(item.href) || shortcuts.length >= 4) {
        return;
      }

      shortcuts.push({
        href: item.href,
        label: item.label,
        description: buildNavigationDescription(item.label)
      });
      seen.add(item.href);
    });
  }

  return {
    focusLabel: blueprint.focusLabel,
    heading: blueprint.heading,
    summary: blueprint.summary,
    topbarFocus: blueprint.topbarFocus,
    searchPlaceholder: blueprint.searchPlaceholder,
    helperPoints: blueprint.helperPoints,
    journeySteps: blueprint.journeySteps,
    shortcuts
  };
}
