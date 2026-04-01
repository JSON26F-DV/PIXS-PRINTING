import { z } from 'zod';

/**
 * Enterprise Password Security Protocol (EPSP v1.0).
 * Enforces banking-level complexity for fulfillment hubs.
 */
export const passwordSchema = z.string()
  .min(8, "Constraint Violation: Minimum 8 nodes required.")
  .regex(/[A-Z]/, "Constraint Violation: Missing Uppercase Node.")
  .regex(/[a-z]/, "Constraint Violation: Missing Lowercase Node.")
  .regex(/[0-9]/, "Constraint Violation: Missing Numerical Node.")
  .regex(/[^A-Za-z0-9]/, "Constraint Violation: Missing Special Character Node.")
  .refine((val) => !val.includes(' '), "Constraint Violation: Whitespace logic detected.");

/**
 * Password Strength Projection Hub.
 * Formula: Weighted node evaluation for security visualization.
 */
export const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;
  return strength;
};

export const getStrengthLabel = (strength: number) => {
  if (strength < 40) return { label: 'CRITICAL', color: 'text-rose-500', bar: 'bg-rose-500' };
  if (strength < 80) return { label: 'VULNERABLE', color: 'text-amber-500', bar: 'bg-amber-500' };
  return { label: 'REINFORCED', color: 'text-emerald-500', bar: 'bg-emerald-500' };
};
