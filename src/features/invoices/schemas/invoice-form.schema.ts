import { z } from "zod";

const invoiceItemSchema = z.object({
  serviceName: z.string().min(2, "اسم الخدمة مطلوب."),
  description: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  lineTotal: z.number().min(0)
});

export const invoiceFormSchema = z.object({
  patientId: z.string().min(1, "المريض مطلوب."),
  issueDate: z.string().min(1, "تاريخ الإصدار مطلوب."),
  dueDate: z.string().optional(),
  discount: z.number().min(0),
  tax: z.number().min(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "يجب إضافة بند واحد على الأقل إلى الفاتورة.")
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
