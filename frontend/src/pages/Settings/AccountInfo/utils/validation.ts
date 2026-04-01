import { z } from 'zod';
import { passwordSchema } from '../../../../utils/passwordValidation';

/**
 * Industrial Profile Logic Schema.
 * Linked to communication terminal requirements.
 */
export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name node too short'),
  email: z.string().trim().email('Invalid coordination terminal'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

/**
 * Enterprise Password Reset Protocol Schema.
 * Enforces dual-node confirmation alignment.
 */
export const passwordFormSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Configuration mismatch: Encryption sequences do not align.",
  path: ["confirmPassword"],
});

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;
