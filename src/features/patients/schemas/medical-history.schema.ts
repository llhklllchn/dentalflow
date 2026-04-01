import { z } from "zod";

export const medicalHistoryFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required."),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  currentMedications: z.string().optional(),
  smokingStatus: z.string().optional(),
  pregnancyStatus: z.string().optional(),
  medicalNotes: z.string().optional()
});

export type MedicalHistoryFormValues = z.infer<typeof medicalHistoryFormSchema>;
