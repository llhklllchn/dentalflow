import { z } from "zod";

export const notificationTemplateFormSchema = z.object({
  name: z.string().min(2, "Template name is required."),
  channel: z.enum(["sms", "email", "whatsapp"]),
  templateKey: z.string().min(2, "Template key is required."),
  subject: z.string().optional(),
  body: z.string().min(5, "Template body is required.")
});

export type NotificationTemplateFormValues = z.infer<typeof notificationTemplateFormSchema>;
