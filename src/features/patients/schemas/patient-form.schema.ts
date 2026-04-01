import { z } from "zod";

export const patientFormSchema = z.object({
  firstName: z.string().min(2, "First name is required."),
  lastName: z.string().min(2, "Last name is required."),
  gender: z.enum(["male", "female"]).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().min(6, "Phone number is required."),
  whatsappPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  nationalId: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

