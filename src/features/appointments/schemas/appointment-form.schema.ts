import { z } from "zod";

export const appointmentFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required."),
  dentistId: z.string().min(1, "Dentist is required."),
  serviceId: z.string().min(1, "Service is required."),
  startsAt: z.string().min(1, "Start time is required."),
  endsAt: z.string().min(1, "End time is required."),
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

