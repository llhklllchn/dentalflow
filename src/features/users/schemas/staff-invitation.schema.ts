import { z } from "zod";

export const staffInvitationFormSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح."),
  role: z.enum([
    "owner",
    "admin",
    "dentist",
    "receptionist",
    "accountant",
    "assistant"
  ])
});

export type StaffInvitationFormValues = z.infer<typeof staffInvitationFormSchema>;
