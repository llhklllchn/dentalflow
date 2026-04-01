import { z } from "zod";

export const treatmentPlanFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required."),
  dentistId: z.string().min(1, "Dentist is required."),
  title: z.string().min(2, "Plan title is required."),
  status: z.enum([
    "draft",
    "planned",
    "approved",
    "in_progress",
    "completed",
    "cancelled"
  ]),
  serviceName: z.string().min(2, "Service is required."),
  toothNumber: z.string().optional(),
  description: z.string().optional(),
  estimatedCost: z.number().min(0),
  sessionOrder: z.number().int().min(1),
  plannedDate: z.string().optional()
});

export type TreatmentPlanFormValues = z.infer<typeof treatmentPlanFormSchema>;
