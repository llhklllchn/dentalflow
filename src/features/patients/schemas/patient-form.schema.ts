import { z } from "zod";

export const patientFormSchema = z.object({
  firstName: z.string().min(2, "الاسم الأول مطلوب."),
  lastName: z.string().min(2, "اسم العائلة مطلوب."),
  gender: z.enum(["male", "female"]).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().min(6, "رقم الهاتف مطلوب."),
  whatsappPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  nationalId: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
