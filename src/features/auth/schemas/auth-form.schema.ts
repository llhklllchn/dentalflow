import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح."),
  password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.")
});

export const registerClinicFormSchema = z.object({
  clinicName: z.string().min(2, "اسم العيادة مطلوب."),
  ownerFirstName: z.string().min(2, "الاسم الأول للمالك مطلوب."),
  ownerLastName: z.string().min(2, "اسم العائلة للمالك مطلوب."),
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح."),
  phone: z.string().min(6, "رقم الهاتف مطلوب."),
  password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."),
  country: z.string().min(2, "الدولة مطلوبة."),
  city: z.string().min(2, "المدينة مطلوبة."),
  currency: z.string().min(2, "العملة مطلوبة."),
  language: z.string().min(2, "اللغة مطلوبة."),
  timezone: z.string().min(2, "المنطقة الزمنية مطلوبة.")
});

export const forgotPasswordFormSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صالح.")
});

export const resetPasswordFormSchema = z
  .object({
    token: z.string().min(10, "رمز إعادة التعيين غير صالح."),
    password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."),
    confirmPassword: z.string().min(8, "يرجى تأكيد كلمة المرور.")
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "تأكيد كلمة المرور غير مطابق.",
    path: ["confirmPassword"]
  });

export const acceptInvitationFormSchema = z
  .object({
    token: z.string().min(10, "رمز الدعوة غير صالح."),
    firstName: z.string().min(2, "الاسم الأول مطلوب."),
    lastName: z.string().min(2, "اسم العائلة مطلوب."),
    password: z.string().min(8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل."),
    confirmPassword: z.string().min(8, "يرجى تأكيد كلمة المرور.")
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "تأكيد كلمة المرور غير مطابق.",
    path: ["confirmPassword"]
  });
