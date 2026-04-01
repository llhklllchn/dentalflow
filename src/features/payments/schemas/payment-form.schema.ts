import { z } from "zod";

export const paymentFormSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required."),
  patientId: z.string().min(1, "Patient is required."),
  amount: z.number().positive("Amount must be greater than zero."),
  paymentMethod: z.enum(["cash", "card", "transfer", "mixed"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().min(1, "Payment date is required.")
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

