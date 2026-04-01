export type FormGuidePage =
  | "patient"
  | "appointment"
  | "invoice"
  | "payment"
  | "dental-record"
  | "treatment-plan";

type GuideTone = "brand" | "emerald" | "amber" | "slate";

export type FormGuideAction = {
  href: string;
  label: string;
  description: string;
  tone: GuideTone;
};

export type FormGuide = {
  title: string;
  description: string;
  readinessLabel: string;
  firstSteps: string[];
  beforeSave: string[];
  afterSaveActions: FormGuideAction[];
};

const formGuides: Record<FormGuidePage, FormGuide> = {
  patient: {
    title: "ابدأ الملف بأقل مجهود ثم وسّعه لاحقًا",
    description:
      "يكفي الاسم والهاتف كبداية، ثم يمكن للفريق استكمال بقية التفاصيل الطبية أو التشغيلية لاحقًا بدون تعطيل الاستقبال.",
    readinessLabel: "الحد الأدنى الذكي: اسم + هاتف",
    firstSteps: [
      "ابدأ بالاسم الكامل والهاتف أولًا.",
      "أضف واتساب إذا كان مختلفًا عن الهاتف الأساسي.",
      "سجل الحساسية أو الأدوية الحالية فقط إذا كانت مهمة للعلاج."
    ],
    beforeSave: [
      "تأكد من صحة رقم الهاتف وقابلية التواصل.",
      "لا تترك معلومة طبية مهمة في خانة عامة بشكل مبهم.",
      "حدد الخطوة التالية بعد الحفظ: موعد أم متابعة ملف."
    ],
    afterSaveActions: [
      { href: "/appointments/new", label: "حجز موعد", description: "حوّل الملف الجديد مباشرة إلى زيارة.", tone: "brand" },
      { href: "/patients", label: "قائمة المرضى", description: "ارجع لمراجعة الملف ضمن بقية الملفات.", tone: "slate" },
      { href: "/search", label: "بحث عام", description: "تأكد من سهولة العثور على الملف بعد حفظه.", tone: "emerald" }
    ]
  },
  appointment: {
    title: "رتّب الموعد بحيث لا يحتاج الفريق لتعديله لاحقًا",
    description:
      "كل اختيار صحيح هنا يوفر وقتًا في الاستقبال والطبيب لاحقًا، ويقلل إعادة الجدولة أو الالتباس في الخدمة.",
    readinessLabel: "الوضوح هنا يقلل إعادة الجدولة",
    firstSteps: [
      "ابدأ بالمريض ثم الطبيب ثم الخدمة.",
      "اختر وقت البداية والنهاية بدقة.",
      "اترك الحالة مجدولة إذا كان التأكيد سيتم لاحقًا."
    ],
    beforeSave: [
      "تأكد أن المريض والطبيب والخدمة يطابقون الزيارة المقصودة.",
      "راجع الوقت قبل الحفظ، خصوصًا عند الضغط اليومي.",
      "فكر هل الخطوة التالية ستكون سجلًا طبيًا أو متابعة أو تذكيرًا."
    ],
    afterSaveActions: [
      { href: "/appointments", label: "العودة للجدول", description: "راجع ظهور الموعد داخل التقويم.", tone: "brand" },
      { href: "/patients", label: "ملف المريض", description: "ارجع للملف إذا احتجت سياقًا إضافيًا.", tone: "slate" },
      { href: "/dental-records/new", label: "سجل طبي", description: "انتقل للتوثيق إذا كان الموعد ضمن زيارة حالية.", tone: "emerald" }
    ]
  },
  invoice: {
    title: "أصدر الفاتورة بشكل واضح من أول مرة",
    description:
      "كل بند واضح هنا يختصر أسئلة لاحقة عند التحصيل أو المراجعة، ويجعل الفاتورة مفهومة للمريض والفريق.",
    readinessLabel: "فاتورة بسيطة وواضحة أفضل من فاتورة غامضة",
    firstSteps: [
      "ابدأ بالمريض الصحيح ثم البند أو الخدمة الأساسية.",
      "استخدم كمية وسعرًا واضحين حتى لو كانت الفاتورة بسيطة.",
      "أضف الخصم أو الضريبة فقط إذا كانت مؤكدة."
    ],
    beforeSave: [
      "راجع الإجمالي والقيمة النهائية قبل الحفظ.",
      "تأكد من تاريخ الإصدار والاستحقاق إن كنت تستخدمهما.",
      "حدد هل ستسجل دفعة مباشرة بعد إنشاء الفاتورة."
    ],
    afterSaveActions: [
      { href: "/payments/new", label: "تسجيل دفعة", description: "حوّل الفاتورة إلى تحصيل مباشرة إذا لزم.", tone: "emerald" },
      { href: "/invoices", label: "قائمة الفواتير", description: "راجع الفاتورة ضمن بقية السجل المالي.", tone: "brand" },
      { href: "/reports", label: "التقارير", description: "تابع أثرها على الصورة المالية العامة.", tone: "amber" }
    ]
  },
  payment: {
    title: "سجل التحصيل بدقة لأن هذه هي الحقيقة المالية",
    description:
      "بعد الفاتورة، هذه الخطوة هي الأهم ماليًا، لذلك الدقة في المبلغ والطريقة والوقت أساسية جدًا.",
    readinessLabel: "الدفع الصحيح أهم من السرعة وحدها",
    firstSteps: [
      "ابدأ بالفاتورة الصحيحة ثم تأكد من المريض.",
      "أدخل المبلغ كما تم تحصيله فعلًا.",
      "اختر طريقة الدفع الواقعية لا الافتراضية."
    ],
    beforeSave: [
      "راجع المبلغ وطريقة الدفع والتاريخ.",
      "أضف المرجع عند التحويل أو البطاقة إذا وجد.",
      "تأكد أن الدفعة مرتبطة بالفاتورة الصحيحة."
    ],
    afterSaveActions: [
      { href: "/payments", label: "سجل المدفوعات", description: "راجع ظهور الدفعة ضمن السجل العام.", tone: "brand" },
      { href: "/invoices", label: "الفواتير", description: "تحقق من انعكاس الدفعة على الرصيد المتبقي.", tone: "emerald" },
      { href: "/reports", label: "التقارير", description: "راقب أثر التحصيل على مؤشراتك المالية.", tone: "amber" }
    ]
  },
  "dental-record": {
    title: "وثّق الزيارة بحيث تكون واضحة عند الرجوع إليها",
    description:
      "السجل الطبي الجيد يبدأ بالشكوى ثم الفحص ثم التشخيص والإجراء، ويترك متابعة مفهومة للجلسة القادمة.",
    readinessLabel: "ابدأ بالشكوى ثم امشِ سريريًا خطوة بخطوة",
    firstSteps: [
      "ابدأ بالمريض والطبيب والتاريخ.",
      "سجل الشكوى ثم الفحص ثم التشخيص.",
      "أضف الإجراء أو الوصفة أو المتابعة فقط إذا كانت واضحة."
    ],
    beforeSave: [
      "تأكد أن السجل مفهوم لمن سيفتحه لاحقًا.",
      "لا تخلط الوصف الطبي العام بخطوة المتابعة القادمة.",
      "حدد هل ستنتقل بعدها إلى خطة علاج أو موعد متابعة."
    ],
    afterSaveActions: [
      { href: "/dental-records", label: "السجلات الطبية", description: "راجع السجل داخل قائمة الزيارات.", tone: "brand" },
      { href: "/treatment-plans/new", label: "خطة علاج", description: "ابدأ خطة إذا كشفت الزيارة مسارًا علاجيًا أوضح.", tone: "emerald" },
      { href: "/appointments/new", label: "موعد متابعة", description: "حدد الزيارة القادمة بعد التوثيق.", tone: "amber" }
    ]
  },
  "treatment-plan": {
    title: "ابنِ الخطة كخارطة علاج قابلة للتنفيذ",
    description:
      "الخطة الجيدة هنا يجب أن تكون مفهومة للفريق والمريض، وقابلة للتحويل بسهولة إلى مواعيد وفواتير لاحقًا.",
    readinessLabel: "العنوان والخدمة والجلسة الأولى هي نقطة الانطلاق",
    firstSteps: [
      "ابدأ بالمريض والطبيب والعنوان العلاجي الواضح.",
      "اختر الخدمة وأدخل التكلفة التقديرية.",
      "أضف الجلسة الأولى أو التاريخ المتوقع إذا كان معروفًا."
    ],
    beforeSave: [
      "راجع العنوان والخدمة والتكلفة والجلسة الأولى.",
      "تأكد أن الخطة قابلة للفهم دون شرح طويل.",
      "حدد هل الخطوة التالية ستكون موعدًا أم فاتورة."
    ],
    afterSaveActions: [
      { href: "/appointments/new", label: "موعد جديد", description: "حوّل الجلسة الأولى إلى موعد فعلي.", tone: "brand" },
      { href: "/invoices/new", label: "فاتورة جديدة", description: "ابدأ الفوترة إذا كانت الخطة جاهزة ماليًا.", tone: "emerald" },
      { href: "/treatment-plans", label: "خطط العلاج", description: "راجع الخطة ضمن بقية الخطط الحالية.", tone: "amber" }
    ]
  }
};

export function getFormGuide(page: FormGuidePage) {
  return formGuides[page];
}
