import { useMemo } from 'react';
import usersData from '../../../../data/users.json';
import type { ProfileFormValues, PasswordFormValues } from '../utils/validation';


interface IContactNode {
  number: string;
  is_default: boolean;
}

interface MockCustomer {
  id: string;
  name: string;
  email: string;
  contact_numbers: IContactNode[];
  profile_picture?: string;
}

interface UsersDataShape {
  customers: MockCustomer[];
}

export interface AccountInfo {
  id: string;
  name: string;
  email: string;
  contacts: IContactNode[];
  profilePicture?: string;
}

export const useAccountInfo = () => {
  const defaultAccount = useMemo<AccountInfo>(() => {
    const payload = usersData as UsersDataShape;
    const firstCustomer = payload.customers?.[0];

    return {
      id: firstCustomer?.id ?? 'CUST-LOCAL',
      name: firstCustomer?.name ?? '',
      email: firstCustomer?.email ?? '',
      contacts: firstCustomer?.contact_numbers ?? [],
      profilePicture: firstCustomer?.profile_picture ?? '',
    };
  }, []);

  const updateProfile = async (_values: ProfileFormValues): Promise<{ success: boolean }> => {
    // ─── PHPMailer Pipeline Concept ──────────────────────────────────────────
    // TODO: Verify if email has changed. If so, trigger a PHPMailer verification 
    // code sequence before finalized update.
    console.log('Finalizing profile update node:', _values);
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
  };

  const updatePassword = async (_values: PasswordFormValues): Promise<{ success: boolean }> => {
    // ─── PHPMailer Password Alert Concept ────────────────────────────────────
    // TODO: Use PHPMailer to send a security alert/confirmation email immediately 
    // after a successful password update event.
    console.log('Finalizing password configuration protocol:', _values.newPassword);
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1500));
  };

  const uploadProfilePicture = async (_file: File): Promise<{ success: boolean; url?: string }> => {
    // Mock upload Node
    console.log('Uploading profile binary:', _file.name);
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, url: URL.createObjectURL(_file) }), 800));
  };

  return {
    defaultAccount,
    updateProfile,
    updatePassword,
    uploadProfilePicture
  };
};
