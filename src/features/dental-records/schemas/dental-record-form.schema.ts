import { z } from "zod";

export const dentalRecordFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required."),
  dentistId: z.string().min(1, "Dentist is required."),
  appointmentDate: z.string().min(1, "Appointment date is required."),
  toothNumbers: z.string().optional(),
  chiefComplaint: z.string().optional(),
  examinationNotes: z.string().optional(),
  diagnosis: z.string().optional(),
  procedureDone: z.string().optional(),
  prescription: z.string().optional(),
  followUpNotes: z.string().optional()
});

export type DentalRecordFormValues = z.infer<typeof dentalRecordFormSchema>;
