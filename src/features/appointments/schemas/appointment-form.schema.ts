import { z } from "zod";

export const appointmentFormSchema = z.object({
  patientId: z.string().min(1, "المريض مطلوب."),
  dentistId: z.string().min(1, "الطبيب مطلوب."),
  serviceId: z.string().min(1, "الخدمة مطلوبة."),
  startsAt: z.string().min(1, "وقت البداية مطلوب."),
  endsAt: z.string().min(1, "وقت النهاية مطلوب."),
  status: z.enum([
    "scheduled",
    "confirmed",
    "checked_in",
    "in_progress",
    "completed",
    "cancelled",
    "no_show"
  ]),
  notes: z.string().optional()
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
