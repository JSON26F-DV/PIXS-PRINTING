import * as z from 'zod';

export const UserRole = {
  ADMIN: "admin",
  STAFF: "staff",
  CUSTOMER: "customer"
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export type Status = 'active' | 'suspended' | 'archived';

export interface ContactNumber {
  number: string;
  is_default: boolean;
}

export interface Address {
  id?: string;
  user_id?: string;
  label: string;
  address: string;
  full_name?: string;
  phone?: string;
  region?: string;
  province?: string;
  city?: string;
  barangay?: string;
  street?: string;
  postal_code?: string;
  is_default?: boolean;
}

export interface UserAddressBook {
  user_id: string;
  addresses: Address[];
}

export interface BaseUser {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  role: UserRoleType;
  status: Status;
  age?: number | null;
  gender?: 'male' | 'female' | 'other';
  company_name?: string;
  profile_picture?: string;
  contact_numbers: ContactNumber[];
  date_created: string;
  last_login?: string;
  // Employee-specific
  daily_rate?: number;
  ot_rate?: number;
  // Customer-specific
  total_orders_value?: number;
  orders?: number;
}

export const contactSchema = z.object({
  number: z.string().regex(/^\+63 \d{3} \d{3} \d{4}$/, "Invalid PH format (+63 XXX XXX XXXX)"),
  is_default: z.boolean()
});

export const userSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  age: z.number().min(0).max(120).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']),
  company_name: z.string().optional(),
  status: z.enum(['active', 'suspended', 'archived']),
  role: z.enum(['admin', 'staff', 'customer']),
  profile_picture: z.string().optional(),
  contact_numbers: z.array(contactSchema).min(1, "At least one contact number is required"),
  // Employee fields
  daily_rate: z.number().optional(),
  ot_rate: z.number().optional(),
  // Password for admin-level confirmation/creation
  password: z.string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "One uppercase")
    .regex(/[a-z]/, "One lowercase")
    .regex(/[0-9]/, "One number")
    .regex(/[^A-Za-z0-9]/, "One special character")
    .optional()
    .or(z.literal('')),
});

export type FormData = z.infer<typeof userSchema>;

export interface AuditLog {
  timestamp: string;
  user_id: string;
  action: string;
  details: string;
  modified_by: string;
}

export interface DeletedAccountLog {
  deleted_at: string;
  deleted_by: string;
  reason: string;
  account_snapshot: BaseUser;
}
