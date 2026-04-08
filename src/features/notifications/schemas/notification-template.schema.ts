import { z } from "zod";

export const notificationTemplateFormSchema = z.object({
  name: z.string().min(2, "اسم القالب مطلوب."),
  channel: z.enum(["sms", "email", "whatsapp"]),
  templateKey: z.string().min(2, "مفتاح القالب مطلوب."),
  subject: z.string().optional(),
  body: z.string().min(5, "محتوى القالب مطلوب.")
});

export type NotificationTemplateFormValues = z.infer<typeof notificationTemplateFormSchema>;
