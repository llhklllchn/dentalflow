import { z } from "zod";

export const serviceFormSchema = z.object({
  name: z.string().min(2, "Service name is required."),
  description: z.string().optional(),
  defaultDurationMinutes: z.number().int().min(5),
  price: z.number().min(0)
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
