import { AppointmentStatus, InvoiceStatus } from "@/types/domain";
import { extractFormattedAmount, hasDisplayDate } from "@/lib/utils/formatted-value";

export type NextStepActionKey =
  | "open_patient"
  | "new_appointment"
  | "new_record"
  | "new_invoice"
  | "record_payment";

export type NextStepSuggestion = {
  tone: "brand" | "emerald" | "amber" | "rose" | "slate";
  label: string;
  description: string;
  actionKey?: NextStepActionKey;
};

export function getPatientNextStep(input: {
  balance: string;
  lastVisit: string;
}): NextStepSuggestion {
  const balanceValue = extractFormattedAmount(input.balance);

  if (balanceValue > 0) {
    return {
      tone: "amber",
      label: "أفضل خطوة الآن: متابعة التحصيل",
      description: "هذا الملف لديه رصيد مفتوح؛ راجع الملف المالي أو تابع المريض بلطف لإغلاق المستحقات.",
      actionKey: "open_patient"
    };
  }

  if (!hasDisplayDate(input.lastVisit)) {
    return {
      tone: "brand",
      label: "أفضل خطوة الآن: بدء الزيارة الأولى",
      description: "لا توجد زيارة مسجلة بعد؛ ابدأ بحجز الموعد الأول حتى يدخل الملف في دورة العمل الفعلية.",
      actionKey: "new_appointment"
    };
  }

  return {
    tone: "emerald",
    label: "أفضل خطوة الآن: توثيق المتابعة",
    description: "الملف نشط ولا يحمل رصيدًا مفتوحًا؛ وسّعه بسجل طبي جديد أو متابعة علاجية منظمة.",
    actionKey: "new_record"
  };
}

export function getAppointmentNextStep(status: AppointmentStatus): NextStepSuggestion {
  switch (status) {
    case "scheduled":
      return {
        tone: "amber",
        label: "أفضل خطوة الآن: تأكيد الموعد",
        description: "الموعد ما يزال مجدولًا؛ التواصل المسبق مع المريض يقلل الغياب ويثبت الجدول.",
        actionKey: "open_patient"
      };
    case "confirmed":
      return {
        tone: "brand",
        label: "أفضل خطوة الآن: تجهيز الاستقبال",
        description: "الموعد مؤكد؛ افتح ملف المريض أو جهّز خطوة تسجيل الحضور قبل وصوله.",
        actionKey: "open_patient"
      };
    case "checked_in":
      return {
        tone: "brand",
        label: "أفضل خطوة الآن: بدء السجل الطبي",
        description: "المريض حاضر الآن؛ وثّق الشكوى والفحص مباشرة قبل أن تضيع التفاصيل.",
        actionKey: "new_record"
      };
    case "in_progress":
      return {
        tone: "emerald",
        label: "أفضل خطوة الآن: إغلاق الزيارة ماليًا",
        description: "بعد انتهاء الإجراء، انتقل للفاتورة أو استكمال التوثيق حتى تبقى الزيارة مكتملة.",
        actionKey: "new_invoice"
      };
    case "completed":
      return {
        tone: "emerald",
        label: "أفضل خطوة الآن: مراجعة الإغلاق",
        description: "الزيارة اكتملت؛ تأكد من انعكاسها على الفاتورة أو المتابعة القادمة داخل الملف.",
        actionKey: "new_invoice"
      };
    case "no_show":
      return {
        tone: "rose",
        label: "أفضل خطوة الآن: إعادة التنسيق",
        description: "هذه الحالة تحتاج تواصلًا سريعًا وإعادة حجز مناسبة بدل ترك الموعد ينتهي بلا متابعة.",
        actionKey: "new_appointment"
      };
    case "cancelled":
      return {
        tone: "slate",
        label: "أفضل خطوة الآن: المتابعة عند الحاجة",
        description: "الموعد ملغي؛ احتفظ به كسجل مرجعي وأعد الجدولة فقط إذا طلب المريض ذلك."
      };
  }
}

export function getInvoiceNextStep(input: {
  status: InvoiceStatus;
  balance: string;
}): NextStepSuggestion {
  const balanceValue = extractFormattedAmount(input.balance);

  if (input.status === "cancelled") {
    return {
      tone: "slate",
      label: "أفضل خطوة الآن: إبقاء الفاتورة مرجعية",
      description: "تم إلغاء هذه الفاتورة؛ لا حاجة لإجراء مالي جديد إلا إذا تطلب الملف إصدارًا بديلًا."
    };
  }

  if (input.status === "paid" || balanceValue <= 0) {
    return {
      tone: "emerald",
      label: "أفضل خطوة الآن: الانتقال للمتابعة التالية",
      description: "التحصيل مغلق هنا؛ افتح ملف المريض واستعد للخطوة العلاجية أو الزيارة التالية.",
      actionKey: "open_patient"
    };
  }

  if (input.status === "overdue") {
    return {
      tone: "rose",
      label: "أفضل خطوة الآن: تحصيل عاجل",
      description: "الفاتورة متأخرة وبها رصيد مفتوح؛ سجّل دفعة جديدة أو ابدأ متابعة فورية مع المريض.",
      actionKey: "record_payment"
    };
  }

  if (input.status === "partially_paid") {
    return {
      tone: "amber",
      label: "أفضل خطوة الآن: إغلاق المتبقي",
      description: "تبقّى جزء من المبلغ؛ أفضل خطوة الآن هي تسجيل الدفعة التالية لإغلاق الفاتورة.",
      actionKey: "record_payment"
    };
  }

  return {
    tone: "brand",
    label: "أفضل خطوة الآن: بدء التحصيل",
    description: "الفاتورة جاهزة للدفعة الأولى؛ ابدأ التحصيل الآن حتى لا يتراكم الرصيد المفتوح.",
    actionKey: "record_payment"
  };
}
