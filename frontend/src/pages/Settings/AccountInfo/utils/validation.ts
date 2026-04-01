import { z } from 'zod';

export const philippinePhoneRegex = /^(\+63|0)9\d{9}$/;

// ─── Profile Selection Node Schema ───────────────────────────────────────────
export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Please enter a valid email'),
  phone: z
    .string()
    .trim()
    .regex(philippinePhoneRegex, 'Please enter a valid PH mobile number'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// ─── Password Configuration Protocol Schema ──────────────────────────────────
export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type PasswordFormValues = z.infer<typeof passwordSchema>;
