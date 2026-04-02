import {
  AppointmentStatus,
  InvoiceStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  Role,
  ToothStatus,
  TreatmentPlanStatus
} from "@/types/domain";

export type DashboardStat = {
  label: string;
  value: string;
  hint: string;
};

export type DashboardAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  dentistName: string;
  time: string;
  status: AppointmentStatus;
};

export type SignalTone = "brand" | "emerald" | "amber" | "rose" | "slate";

export type ExecutiveSignal = {
  label: string;
  value: string;
  description: string;
  tone: SignalTone;
};

export type ActionPrompt = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: SignalTone;
};

export type DashboardOverview = {
  stats: DashboardStat[];
  upcomingAppointments: DashboardAppointment[];
  alerts: string[];
  executiveSignals: ExecutiveSignal[];
  actionPrompts: ActionPrompt[];
};

export type PatientListItem = {
  id: string;
  fullName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  lastVisit: string;
  balance: string;
  dentistName: string;
};

export type PatientDetails = PatientListItem & {
  email: string;
  city: string;
  address: string;
  notes: string[];
  medicalSummary: string;
  recentAppointments: {
    date: string;
    title: string;
  }[];
  recentInvoices: {
    id: string;
    total: string;
    status: InvoiceStatus;
    issueDate?: string;
  }[];
};

export type AppointmentBoardItem = {
  id: string;
  patientId: string;
  dentistId?: string;
  patient: string;
  dentist: string;
  service: string;
  time: string;
  appointmentDate?: string;
  status: AppointmentStatus;
};

export type InvoiceDetails = {
  id: string;
  patientId: string;
  patient: string;
  subtotal?: string;
  discount?: string;
  tax?: string;
  total: string;
  paid: string;
  balance: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  treatmentPlanTitle?: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }[];
  paymentHistory?: {
    id: string;
    amount: string;
    method: string;
    date: string;
    notes?: string;
  }[];
};

export type PaymentListItem = {
  id: string;
  patientId: string;
  patient: string;
  invoiceId: string;
  amount: string;
  method: string;
  date: string;
};

export type DentistListItem = {
  id: string;
  name: string;
  specialty: string;
  color: string;
  hours: string;
  licenseNumber?: string;
  defaultAppointmentDuration?: number;
  startTime?: string;
  endTime?: string;
};

export type ServiceListItem = {
  id: string;
  name: string;
  description?: string;
  duration: string;
  price: string;
  defaultDurationMinutes?: number;
  priceValue?: number;
  isActive?: boolean;
};

export type StaffListItem = {
  id: string;
  name: string;
  role: Role;
  status: string;
  email: string;
  recordType: "user" | "invitation";
  expiresAt?: string;
};

export type ReportSummary = {
  label: string;
  value: string;
  hint: string;
};

export type FinancialMetric = {
  label: string;
  value: string;
  delta: string;
};

export type DoctorPerformance = {
  dentistName: string;
  visits: number;
  revenue: string;
  completionRate: string;
};

export type PeakHour = {
  slot: string;
  appointments: number;
};

export type ReportsOverview = {
  summary: ReportSummary[];
  financialMetrics: FinancialMetric[];
  doctorPerformance: DoctorPerformance[];
  peakHours: PeakHour[];
  executiveSignals: ExecutiveSignal[];
  actionPrompts: ActionPrompt[];
};

export type SettingsOverview = {
  clinicInfo: {
    name: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    currency: string;
    timezone: string;
    language: string;
  };
  workingHours: {
    days: string;
    hours: string;
    defaultAppointmentDuration: string;
    workingDaysInput: string;
    workingHoursInput: string;
    defaultAppointmentDurationMinutes: number;
  };
  billing: {
    invoicePrefix: string;
    defaultTax: string;
    footerNote: string;
  };
  reminders: {
    enabled: boolean;
    leadTime: string;
    channel: NotificationChannel;
  };
};

export type DentalRecordItem = {
  id: string;
  patientId: string;
  patientName: string;
  dentistName: string;
  appointmentDate: string;
  chiefComplaint: string;
  diagnosis: string;
  procedureDone: string;
  prescription: string;
  followUpNotes: string;
};

export type ToothItem = {
  toothNumber: string;
  status: ToothStatus;
  note: string;
};

export type DentalRecordsOverview = {
  metrics: DashboardStat[];
  records: DentalRecordItem[];
  odontogram: ToothItem[];
};

export type TreatmentPlanItem = {
  id: string;
  serviceName: string;
  toothNumber: string;
  description: string;
  estimatedCost: string;
  status: TreatmentPlanStatus;
  sessionOrder: number;
};

export type TreatmentPlanSummary = {
  id: string;
  patientId: string;
  patientName: string;
  dentistName: string;
  title: string;
  status: TreatmentPlanStatus;
  estimatedTotalCost: string;
  progress: number;
  nextSession: string;
  items: TreatmentPlanItem[];
};

export type NotificationTemplateItem = {
  id: string;
  name: string;
  channel: NotificationChannel;
  templateKey: string;
  subject?: string;
  body: string;
  active: boolean;
};

export type NotificationLogItem = {
  id: string;
  patientName: string;
  channel: NotificationChannel;
  templateKey: string;
  status: NotificationDeliveryStatus;
  scheduledFor: string;
  sentAt: string;
  errorMessage?: string;
};

export type NotificationCenter = {
  templates: NotificationTemplateItem[];
  logs: NotificationLogItem[];
  reminderSettings: {
    enabled: boolean;
    leadTime: string;
    channel: NotificationChannel;
    messagePreview: string;
  };
};

export const dashboardOverview: DashboardOverview = {
  stats: [
    { label: "مواعيد اليوم", value: "18", hint: "منها 5 مؤكدة و2 قيد التنفيذ" },
    { label: "مرضى جدد", value: "12", hint: "خلال آخر 7 أيام" },
    { label: "no-show اليوم", value: "2", hint: "تذكير الموعد يقلل هذه النسبة" },
    { label: "إيراد اليوم", value: "1,480 JOD", hint: "مدفوعات اليوم + فواتير مكتملة" }
  ],
  upcomingAppointments: [
    {
      id: "apt_001",
      patientId: "pat_001",
      patientName: "سارة علي",
      dentistName: "د. ليث",
      time: "09:30",
      status: "confirmed"
    },
    {
      id: "apt_002",
      patientId: "pat_002",
      patientName: "محمد خليل",
      dentistName: "د. هناء",
      time: "10:00",
      status: "checked_in"
    },
    {
      id: "apt_003",
      patientId: "pat_003",
      patientName: "لجين أحمد",
      dentistName: "د. ليث",
      time: "10:30",
      status: "scheduled"
    }
  ],
  alerts: [
    "3 مواعيد غير مؤكدة غدًا",
    "فاتورتان بحالة متأخرة",
    "مريض واحد يحتاج متابعة بعد علاج عصب",
    "دعوتان لموظفين ما زالتا معلقتين"
  ],
  executiveSignals: [
    {
      label: "جاهزية الجلسات",
      value: "78%",
      description: "نسبة المواعيد التي دخلت اليوم في مسار تشغيلي مستقر.",
      tone: "brand"
    },
    {
      label: "سرعة التحصيل",
      value: "1,480 JOD",
      description: "المبلغ المحصّل اليوم مقارنة بالضغط التشغيلي الحالي.",
      tone: "emerald"
    },
    {
      label: "ضغط المتابعة",
      value: "5",
      description: "العناصر التي تحتاج تدخلًا أو تثبيتًا خلال اليوم.",
      tone: "amber"
    }
  ],
  actionPrompts: [
    {
      title: "ثبّت المواعيد غير المؤكدة",
      description: "توجد مواعيد للغد ما زالت تحتاج تأكيدًا قبل بدء اليوم.",
      href: "/appointments",
      cta: "فتح المواعيد",
      tone: "amber"
    },
    {
      title: "تابع التحصيل المتأخر",
      description: "يوجد رصيد مفتوح يستحق المتابعة قبل توسيع الجدول.",
      href: "/invoices",
      cta: "فتح الفواتير",
      tone: "rose"
    },
    {
      title: "أكمل الدعوات المعلقة",
      description: "الفريق غير مكتمل بالكامل ما دامت بعض الدعوات قيد الانتظار.",
      href: "/staff",
      cta: "فتح الموظفين",
      tone: "slate"
    }
  ]
};

export const patients: PatientDetails[] = [
  {
    id: "pat_001",
    fullName: "سارة علي",
    phone: "+962790000001",
    gender: "female",
    dateOfBirth: "1995-06-15",
    lastVisit: "2026-03-26",
    balance: "120 JOD",
    dentistName: "د. ليث",
    email: "sara@example.com",
    city: "عمان",
    address: "الجبيهة",
    medicalSummary: "حساسية من البنسلين، آخر إجراء كان حشو سن 14، ويوجد موعد متابعة قريب.",
    notes: ["تفضّل التذكير عبر واتساب", "مراجعة بعد أسبوعين"],
    recentAppointments: [
      { date: "2026-03-26", title: "تنظيف وتقييم دوري" },
      { date: "2026-03-10", title: "حشو سن 14" }
    ],
    recentInvoices: [
      { id: "inv_001", total: "160 JOD", status: "partially_paid", issueDate: "2026-03-29" },
      { id: "inv_004", total: "40 JOD", status: "paid", issueDate: "2026-03-12" }
    ]
  },
  {
    id: "pat_002",
    fullName: "محمد خليل",
    phone: "+962790000002",
    gender: "male",
    dateOfBirth: "1988-11-02",
    lastVisit: "2026-03-25",
    balance: "0 JOD",
    dentistName: "د. هناء",
    email: "mohammad@example.com",
    city: "الزرقاء",
    address: "الرصيفة",
    medicalSummary: "جلسة علاج عصب مكتملة، ولا توجد مستحقات مفتوحة حاليًا.",
    notes: ["يفضّل مواعيد بعد 4 مساءً"],
    recentAppointments: [
      { date: "2026-03-25", title: "جلسة علاج عصب" },
      { date: "2026-03-14", title: "فحص وتشخيص" }
    ],
    recentInvoices: [{ id: "inv_002", total: "120 JOD", status: "paid", issueDate: "2026-03-28" }]
  },
  {
    id: "pat_003",
    fullName: "لجين أحمد",
    phone: "+962790000003",
    gender: "female",
    dateOfBirth: "2001-01-12",
    lastVisit: "2026-03-20",
    balance: "340 JOD",
    dentistName: "د. ليث",
    email: "lojain@example.com",
    city: "إربد",
    address: "وسط البلد",
    medicalSummary: "خطة علاج مقترحة تشمل تنظيف، علاج عصب، وتاج.",
    notes: ["بحاجة لاعتماد خطة العلاج", "تذكير قبل الموعد بيوم"],
    recentAppointments: [
      { date: "2026-03-20", title: "فحص شامل" },
      { date: "2026-03-02", title: "أشعة أولية" }
    ],
    recentInvoices: [{ id: "inv_003", total: "80 JOD", status: "issued", issueDate: "2026-03-27" }]
  }
];

export const appointmentsBoard: AppointmentBoardItem[] = [
  {
    id: "apt_001",
    patientId: "pat_001",
    dentistId: "den_001",
    patient: "سارة علي",
    dentist: "د. ليث",
    service: "تنظيف",
    time: "09:30 - 10:00",
    appointmentDate: "2026-04-02",
    status: "confirmed"
  },
  {
    id: "apt_002",
    patientId: "pat_002",
    dentistId: "den_002",
    patient: "محمد خليل",
    dentist: "د. هناء",
    service: "علاج عصب",
    time: "10:00 - 11:00",
    appointmentDate: "2026-04-02",
    status: "checked_in"
  },
  {
    id: "apt_003",
    patientId: "pat_003",
    dentistId: "den_001",
    patient: "لجين أحمد",
    dentist: "د. ليث",
    service: "فحص",
    time: "11:30 - 12:00",
    appointmentDate: "2026-04-02",
    status: "scheduled"
  }
];

export const invoices: InvoiceDetails[] = [
  {
    id: "inv_001",
    patientId: "pat_001",
    patient: "سارة علي",
    subtotal: "160 JOD",
    discount: "0 JOD",
    tax: "0 JOD",
    total: "160 JOD",
    paid: "40 JOD",
    balance: "120 JOD",
    status: "partially_paid",
    issueDate: "2026-03-29",
    dueDate: "2026-04-05",
    treatmentPlanTitle: "خطة متابعة للسن 14",
    notes: "فاتورة متابعة للخطة العلاجية النشطة.",
    items: [
      { name: "حشو سن 14", quantity: 1, unitPrice: "80 JOD", total: "80 JOD" },
      { name: "تنظيف", quantity: 1, unitPrice: "80 JOD", total: "80 JOD" }
    ],
    paymentHistory: [
      {
        id: "pay_001",
        amount: "40 JOD",
        method: "cash",
        date: "2026-03-29",
        notes: "دفعة أولى عند زيارة المتابعة"
      }
    ]
  },
  {
    id: "inv_002",
    patientId: "pat_002",
    patient: "محمد خليل",
    subtotal: "120 JOD",
    discount: "0 JOD",
    tax: "0 JOD",
    total: "120 JOD",
    paid: "120 JOD",
    balance: "0 JOD",
    status: "paid",
    issueDate: "2026-03-28",
    dueDate: "2026-03-28",
    paymentHistory: [
      {
        id: "pay_002",
        amount: "120 JOD",
        method: "card",
        date: "2026-03-28",
        notes: "تم التحصيل كاملًا في نفس يوم الإصدار"
      }
    ],
    notes: "فاتورة مدفوعة بالكامل.",
    items: [{ name: "علاج عصب", quantity: 1, unitPrice: "120 JOD", total: "120 JOD" }]
  },
  {
    id: "inv_003",
    patientId: "pat_003",
    patient: "لجين أحمد",
    subtotal: "80 JOD",
    discount: "0 JOD",
    tax: "0 JOD",
    total: "80 JOD",
    paid: "0 JOD",
    balance: "80 JOD",
    status: "issued",
    issueDate: "2026-03-27",
    dueDate: "2026-04-01",
    treatmentPlanTitle: "خطة علاج شاملة للفك العلوي",
    paymentHistory: [],
    notes: "الفاتورة الأولى ضمن الخطة العلاجية.",
    items: [{ name: "فحص", quantity: 1, unitPrice: "80 JOD", total: "80 JOD" }]
  }
];

export const payments: PaymentListItem[] = [
  {
    id: "pay_001",
    patientId: "pat_001",
    patient: "سارة علي",
    invoiceId: "inv_001",
    amount: "40 JOD",
    method: "cash",
    date: "2026-03-29"
  },
  {
    id: "pay_002",
    patientId: "pat_002",
    patient: "محمد خليل",
    invoiceId: "inv_002",
    amount: "120 JOD",
    method: "card",
    date: "2026-03-28"
  }
];

export const dentists: DentistListItem[] = [
  {
    id: "den_001",
    name: "د. ليث",
    specialty: "General Dentistry",
    color: "#269f99",
    hours: "09:00 - 17:00",
    licenseNumber: "DEN-2026-001",
    defaultAppointmentDuration: 30,
    startTime: "09:00",
    endTime: "17:00"
  },
  {
    id: "den_002",
    name: "د. هناء",
    specialty: "Endodontics",
    color: "#1d4ed8",
    hours: "10:00 - 18:00",
    licenseNumber: "DEN-2026-002",
    defaultAppointmentDuration: 60,
    startTime: "10:00",
    endTime: "18:00"
  }
];

export const services: ServiceListItem[] = [
  { id: "srv_001", name: "فحص", duration: "30 دقيقة", price: "20 JOD" },
  { id: "srv_002", name: "تنظيف", duration: "45 دقيقة", price: "35 JOD" },
  { id: "srv_003", name: "علاج عصب", duration: "60 دقيقة", price: "120 JOD" }
];

export const staff: StaffListItem[] = [
  {
    id: "usr_001",
    name: "أمل سمير",
    role: "receptionist",
    status: "active",
    email: "amal@clinic.local",
    recordType: "user"
  },
  {
    id: "usr_002",
    name: "نور حسن",
    role: "accountant",
    status: "active",
    email: "nour@clinic.local",
    recordType: "user"
  },
  {
    id: "usr_003",
    name: "ريم علي",
    role: "assistant",
    status: "invited",
    email: "reem@clinic.local",
    recordType: "invitation",
    expiresAt: "2026-04-03"
  }
];

export const reportsOverview: ReportsOverview = {
  summary: [
    { label: "الإيراد الشهري", value: "18,400 JOD", hint: "قابل للفلترة حسب الفترة" },
    { label: "نسبة no-show", value: "7%", hint: "يمكن ربطها بالتذكيرات لاحقًا" },
    { label: "مرضى جدد", value: "42", hint: "خلال آخر 30 يومًا" }
  ],
  financialMetrics: [
    { label: "فواتير مدفوعة", value: "87", delta: "+11%" },
    { label: "فواتير جزئية", value: "14", delta: "+3%" },
    { label: "فواتير متأخرة", value: "6", delta: "-2%" }
  ],
  doctorPerformance: [
    { dentistName: "د. ليث", visits: 64, revenue: "8,200 JOD", completionRate: "91%" },
    { dentistName: "د. هناء", visits: 41, revenue: "6,300 JOD", completionRate: "88%" },
    { dentistName: "د. سامر", visits: 23, revenue: "3,900 JOD", completionRate: "93%" }
  ],
  peakHours: [
    { slot: "09:00 - 11:00", appointments: 18 },
    { slot: "11:00 - 13:00", appointments: 14 },
    { slot: "16:00 - 18:00", appointments: 11 }
  ],
  executiveSignals: [
    {
      label: "قوة التحصيل",
      value: "81%",
      description: "نسبة الفواتير المكتملة ضمن الفترة الحالية.",
      tone: "emerald"
    },
    {
      label: "ثبات الأداء",
      value: "91%",
      description: "متوسط الإكمال عبر الأطباء والزيارات.",
      tone: "brand"
    },
    {
      label: "ضغط الذروة",
      value: "18",
      description: "أعلى عدد مواعيد في نافذة واحدة خلال الفترة.",
      tone: "amber"
    }
  ],
  actionPrompts: [
    {
      title: "عالج الفواتير المتأخرة",
      description: "التركيز على التحصيل المتأخر يرفع تدفق السيولة بشكل مباشر.",
      href: "/invoices",
      cta: "فتح الفواتير",
      tone: "rose"
    },
    {
      title: "أعد توزيع الذروة",
      description: "التركز الزمني العالي يحتاج ضبطًا في الجدولة والمدد.",
      href: "/settings",
      cta: "فتح الإعدادات",
      tone: "amber"
    },
    {
      title: "اربط التقرير بالتنفيذ",
      description: "حوّل القراءة التنفيذية إلى خطوات تشغيل ومتابعة يومية.",
      href: "/dashboard",
      cta: "فتح لوحة التحكم",
      tone: "brand"
    }
  ]
};

export const reportsSummary: ReportSummary[] = reportsOverview.summary;

export const settingsOverview: SettingsOverview = {
  clinicInfo: {
    name: "DentFlow Demo Clinic",
    phone: "+96265000000",
    email: "info@dentflow.local",
    address: "Amman - Shmeisani",
    city: "عمان",
    currency: "JOD",
    timezone: "Asia/Amman",
    language: "ar-JO"
  },
  workingHours: {
    days: "السبت - الخميس",
    hours: "09:00 - 18:00",
    workingDaysInput: "Saturday\nSunday\nMonday\nTuesday\nWednesday\nThursday",
    workingHoursInput: "09:00 - 18:00",
    defaultAppointmentDurationMinutes: 30,
    defaultAppointmentDuration: "30 دقيقة"
  },
  billing: {
    invoicePrefix: "DEN",
    defaultTax: "0%",
    footerNote: "شكراً لثقتكم بعيادتنا."
  },
  reminders: {
    enabled: true,
    leadTime: "24 ساعة",
    channel: "whatsapp"
  }
};

export const dentalRecordsOverview: DentalRecordsOverview = {
  metrics: [
    { label: "سجلات هذا الأسبوع", value: "23", hint: "موزعة على 4 أطباء" },
    { label: "إجراءات منفذة", value: "31", hint: "يشمل الحشو والتنظيف وعلاج العصب" },
    { label: "متابعات مطلوبة", value: "6", hint: "بحاجة مواعيد متابعة" }
  ],
  records: [
    {
      id: "dr_001",
      patientId: "pat_001",
      patientName: "سارة علي",
      dentistName: "د. ليث",
      appointmentDate: "2026-03-26",
      chiefComplaint: "ألم متقطع في الجهة اليمنى العليا",
      diagnosis: "تسوس في السن 14",
      procedureDone: "حشو كومبوزت",
      prescription: "مسكن عند الحاجة",
      followUpNotes: "مراجعة بعد أسبوعين"
    },
    {
      id: "dr_002",
      patientId: "pat_002",
      patientName: "محمد خليل",
      dentistName: "د. هناء",
      appointmentDate: "2026-03-25",
      chiefComplaint: "ألم شديد مع حساسية للبارد",
      diagnosis: "التهاب لبّي غير عكوس",
      procedureDone: "جلسة علاج عصب",
      prescription: "مضاد حيوي + مسكن",
      followUpNotes: "جلسة ثانية خلال 5 أيام"
    },
    {
      id: "dr_003",
      patientId: "pat_003",
      patientName: "لجين أحمد",
      dentistName: "د. ليث",
      appointmentDate: "2026-03-20",
      chiefComplaint: "فحص شامل وتنظيف",
      diagnosis: "تراكم جير وتسوس ابتدائي",
      procedureDone: "تنظيف شامل",
      prescription: "غسول فم",
      followUpNotes: "إعداد خطة علاج"
    }
  ],
  odontogram: [
    { toothNumber: "11", status: "healthy", note: "سليم" },
    { toothNumber: "12", status: "healthy", note: "سليم" },
    { toothNumber: "13", status: "filling", note: "حشو قديم" },
    { toothNumber: "14", status: "decay", note: "تسوس يحتاج متابعة" },
    { toothNumber: "15", status: "healthy", note: "سليم" },
    { toothNumber: "16", status: "root_canal", note: "بعد علاج عصب" },
    { toothNumber: "21", status: "healthy", note: "سليم" },
    { toothNumber: "22", status: "healthy", note: "سليم" },
    { toothNumber: "23", status: "crown", note: "تاج" },
    { toothNumber: "24", status: "healthy", note: "سليم" },
    { toothNumber: "25", status: "missing", note: "مفقود" },
    { toothNumber: "26", status: "implant", note: "زرعة" }
  ]
};

export const treatmentPlans: TreatmentPlanSummary[] = [
  {
    id: "tp_001",
    patientId: "pat_003",
    patientName: "لجين أحمد",
    dentistName: "د. ليث",
    title: "خطة علاج شاملة للفك العلوي",
    status: "approved",
    estimatedTotalCost: "340 JOD",
    progress: 45,
    nextSession: "2026-04-02",
    items: [
      {
        id: "tpi_001",
        serviceName: "تنظيف",
        toothNumber: "-",
        description: "تنظيف كامل وإزالة الجير",
        estimatedCost: "35 JOD",
        status: "completed",
        sessionOrder: 1
      },
      {
        id: "tpi_002",
        serviceName: "حشو",
        toothNumber: "14",
        description: "حشو كومبوزت",
        estimatedCost: "65 JOD",
        status: "completed",
        sessionOrder: 2
      },
      {
        id: "tpi_003",
        serviceName: "علاج عصب",
        toothNumber: "16",
        description: "جلستان علاج عصب",
        estimatedCost: "120 JOD",
        status: "in_progress",
        sessionOrder: 3
      },
      {
        id: "tpi_004",
        serviceName: "تاج",
        toothNumber: "16",
        description: "تاج خزفي بعد العلاج",
        estimatedCost: "120 JOD",
        status: "planned",
        sessionOrder: 4
      }
    ]
  },
  {
    id: "tp_002",
    patientId: "pat_001",
    patientName: "سارة علي",
    dentistName: "د. ليث",
    title: "خطة متابعة للسن 14",
    status: "in_progress",
    estimatedTotalCost: "160 JOD",
    progress: 75,
    nextSession: "2026-04-05",
    items: [
      {
        id: "tpi_005",
        serviceName: "فحص",
        toothNumber: "14",
        description: "إعادة تقييم الألم",
        estimatedCost: "20 JOD",
        status: "completed",
        sessionOrder: 1
      },
      {
        id: "tpi_006",
        serviceName: "حشو",
        toothNumber: "14",
        description: "حشو نهائي",
        estimatedCost: "80 JOD",
        status: "completed",
        sessionOrder: 2
      },
      {
        id: "tpi_007",
        serviceName: "مراجعة",
        toothNumber: "14",
        description: "متابعة بعد أسبوعين",
        estimatedCost: "60 JOD",
        status: "planned",
        sessionOrder: 3
      }
    ]
  }
];

export const notificationCenter: NotificationCenter = {
  templates: [
    {
      id: "nt_001",
      name: "تذكير موعد",
      channel: "whatsapp",
      templateKey: "appointment_reminder",
      subject: "",
      body: "مرحبًا {patient_name}، لديك موعد غدًا الساعة {appointment_time} مع {dentist_name}.",
      active: true
    },
    {
      id: "nt_002",
      name: "شكر بعد الزيارة",
      channel: "sms",
      templateKey: "post_visit_thanks",
      subject: "",
      body: "شكراً لزيارتك اليوم، نتمنى لك دوام الصحة.",
      active: true
    },
    {
      id: "nt_003",
      name: "تذكير دفعة متأخرة",
      channel: "email",
      templateKey: "invoice_overdue",
      subject: "فاتورة مستحقة",
      body: "نذكرك بوجود رصيد مستحق على فاتورتك الأخيرة.",
      active: false
    }
  ],
  logs: [
    {
      id: "nl_001",
      patientName: "سارة علي",
      channel: "whatsapp",
      templateKey: "appointment_reminder",
      status: "sent",
      scheduledFor: "2026-03-28 09:00",
      sentAt: "2026-03-28 09:00"
    },
    {
      id: "nl_002",
      patientName: "محمد خليل",
      channel: "sms",
      templateKey: "post_visit_thanks",
      status: "sent",
      scheduledFor: "2026-03-25 18:30",
      sentAt: "2026-03-25 18:31"
    },
    {
      id: "nl_003",
      patientName: "لجين أحمد",
      channel: "email",
      templateKey: "invoice_overdue",
      status: "failed",
      scheduledFor: "2026-03-27 10:00",
      sentAt: "-",
      errorMessage: "Mailbox unavailable"
    }
  ],
  reminderSettings: {
    enabled: true,
    leadTime: "24 ساعة",
    channel: "whatsapp",
    messagePreview:
      "مرحبًا {patient_name}، لديك موعد غدًا الساعة {appointment_time} مع {dentist_name}."
  }
};
