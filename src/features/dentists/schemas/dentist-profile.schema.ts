import { z } from "zod";

const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const dentistProfileFieldsSchema = z.object({
  userId: z.string().min(1, "يجب اختيار مستخدم الطبيب."),
  specialty: z.string().optional(),
  licenseNumber: z.string().optional(),
  colorCode: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || colorRegex.test(value), "لون الجدول غير صالح."),
  defaultAppointmentDuration: z.number().int().min(15).max(180),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "وقت البداية غير صالح."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "وقت النهاية غير صالح.")
});

export const dentistProfileFormSchema = dentistProfileFieldsSchema.refine(
  (data) => data.endTime > data.startTime,
  {
    message: "وقت النهاية يجب أن يكون بعد وقت البداية.",
    path: ["endTime"]
  }
);

export type DentistProfileFormValues = z.infer<typeof dentistProfileFormSchema>;
