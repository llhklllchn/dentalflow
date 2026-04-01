import { z } from "zod";

export const staffInvitationFormSchema = z.object({
  email: z.string().email("Valid email is required."),
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
