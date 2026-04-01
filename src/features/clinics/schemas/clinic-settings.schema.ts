import { z } from "zod";

export const clinicSettingsSchema = z.object({
  name: z.string().min(2, "Clinic name is required."),
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "A valid email address is required."
    }),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  currency: z.string().trim().min(2).max(10),
  timezone: z.string().trim().min(2),
  language: z.string().trim().min(2),
  workingDays: z.string().trim().optional(),
  workingHours: z.string().trim().optional(),
  defaultAppointmentDuration: z.number().int().min(5).max(240)
});

export type ClinicSettingsValues = z.infer<typeof clinicSettingsSchema>;
