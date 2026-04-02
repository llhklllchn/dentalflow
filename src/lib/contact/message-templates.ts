import { InvoiceStatus } from "@/types/domain";
import { extractFormattedAmount, hasDisplayDate } from "@/lib/utils/formatted-value";

export type ContactMessagePreset = {
  label: string;
  message: string;
};

export function getPatientMessagePresets(input: {
  patientName: string;
  balance: string;
  lastVisit: string;
}): ContactMessagePreset[] {
  const presets: ContactMessagePreset[] = [];
  const balanceValue = extractFormattedAmount(input.balance);

  if (balanceValue > 0) {
    presets.push({
      label: "متابعة الرصيد",
      message: `مرحبًا ${input.patientName}، نود تذكيرك بوجود رصيد متبقٍ على ملفك لدينا. يرجى التواصل معنا لترتيب المتابعة أو السداد في الوقت المناسب.`
    });
  }

  if (!hasDisplayDate(input.lastVisit)) {
    presets.push({
      label: "حجز أول موعد",
      message: `مرحبًا ${input.patientName}، يسعدنا استقبالكم في العيادة. يمكننا مساعدتكم في ترتيب أول موعد في الوقت المناسب لكم.`
    });
  } else {
    presets.push({
      label: "متابعة العلاج",
      message: `مرحبًا ${input.patientName}، هذه رسالة متابعة من العيادة بخصوص زيارتكم الأخيرة. يمكننا مساعدتكم في ترتيب الخطوة التالية إذا لزم الأمر.`
    });
  }

  return presets.slice(0, 2);
}

export function getAppointmentMessagePresets(input: {
  patientName: string;
  dentistName: string;
  service: string;
  time: string;
}): ContactMessagePreset[] {
  return [
    {
      label: "تذكير الموعد",
      message: `مرحبًا ${input.patientName}، نود تذكيركم بموعدكم في العيادة مع ${input.dentistName} لخدمة ${input.service} في ${input.time}. نرجو تأكيد الحضور أو إبلاغنا إذا احتجتم إلى تعديل الموعد.`
    },
    {
      label: "إعادة تنسيق",
      message: `مرحبًا ${input.patientName}، إذا لم يكن موعد ${input.service} في ${input.time} مناسبًا لكم، يسعدنا إعادة ترتيبه بما يناسب جدولكم.`
    }
  ];
}

export function getInvoiceMessagePresets(input: {
  patientName: string;
  invoiceId: string;
  balance: string;
  status: InvoiceStatus;
}): ContactMessagePreset[] {
  const balanceValue = extractFormattedAmount(input.balance);

  if (input.status === "paid" || balanceValue <= 0) {
    return [
      {
        label: "تأكيد السداد",
        message: `مرحبًا ${input.patientName}، نشكركم على إتمام سداد الفاتورة ${input.invoiceId}. إذا احتجتم أي متابعة علاجية أو إدارية فنحن في خدمتكم.`
      }
    ];
  }

  return [
    {
      label: "متابعة الفاتورة",
      message: `مرحبًا ${input.patientName}، نود تذكيركم بأن الفاتورة ${input.invoiceId} ما زال عليها متبقٍ بقيمة ${input.balance}. يمكنكم التواصل معنا لترتيب السداد أو الاستفسار عن أي تفصيل.`
    },
    {
      label: "ترتيب السداد",
      message: `مرحبًا ${input.patientName}، يسعدنا مساعدتكم في ترتيب سداد الفاتورة ${input.invoiceId} بما يناسبكم. يرجى الرد على هذه الرسالة أو التواصل مع العيادة.`
    }
  ];
}
