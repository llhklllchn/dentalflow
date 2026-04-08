import { z } from "zod";

export const paymentFormSchema = z.object({
  invoiceId: z.string().min(1, "الفاتورة مطلوبة."),
  patientId: z.string().min(1, "المريض مطلوب."),
  amount: z.number().positive("يجب أن يكون المبلغ أكبر من صفر."),
  paymentMethod: z.enum(["cash", "card", "transfer", "mixed"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().min(1, "تاريخ الدفع مطلوب.")
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
