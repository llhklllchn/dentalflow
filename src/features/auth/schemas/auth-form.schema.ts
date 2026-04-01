import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export const registerClinicFormSchema = z.object({
  clinicName: z.string().min(2, "Clinic name is required."),
  ownerFirstName: z.string().min(2, "Owner first name is required."),
  ownerLastName: z.string().min(2, "Owner last name is required."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(6, "Phone number is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  country: z.string().min(2, "Country is required."),
  city: z.string().min(2, "City is required."),
  currency: z.string().min(2, "Currency is required."),
  language: z.string().min(2, "Language is required."),
  timezone: z.string().min(2, "Timezone is required.")
});

export const forgotPasswordFormSchema = z.object({
  email: z.string().email("Please enter a valid email address.")
});

export const resetPasswordFormSchema = z
  .object({
    token: z.string().min(10, "Reset token is invalid."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm the password.")
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Password confirmation does not match.",
    path: ["confirmPassword"]
  });

export const acceptInvitationFormSchema = z
  .object({
    token: z.string().min(10, "Invitation token is invalid."),
    firstName: z.string().min(2, "First name is required."),
    lastName: z.string().min(2, "Last name is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm the password.")
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Password confirmation does not match.",
    path: ["confirmPassword"]
  });
