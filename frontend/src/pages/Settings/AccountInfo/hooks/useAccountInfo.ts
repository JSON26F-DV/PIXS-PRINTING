import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../../context/AuthContext';
import type { ProfileFormValues, PasswordFormValues } from '../utils/validation';

export interface IContactNode {
  number: string;
  is_default: boolean;
}

export interface AccountInfo {
  id: string;
  name: string;
  email: string;
  contacts: IContactNode[];
  profilePicture?: string;
}

export const useAccountInfo = () => {
  const { user } = useAuth();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/user');
        const data = response.data;
        setAccount({
          id: data.id,
          name: data.name,
          email: data.email || '',
          contacts: data.contacts || [], // This would need a migration/table if we want multiple
          profilePicture: data.profile_picture || '',
        });
      } catch (err) {
        console.error('Failed to fetch account info:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const defaultAccount = useMemo<AccountInfo>(() => {
    if (account) return account;
    return {
      id: user.id || '',
      name: user.name || '',
      email: user.email || '',
      contacts: [],
      profilePicture: '',
    };
  }, [account, user]);

  const updateProfile = async (values: ProfileFormValues): Promise<{ success: boolean }> => {
    try {
      await axios.patch('/api/settings/profile', values);
      setAccount(prev => prev ? { ...prev, ...values } : null);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  };

  const updatePassword = async (values: PasswordFormValues): Promise<{ success: boolean }> => {
    try {
      await axios.patch('/api/settings/password', {
        password: values.newPassword,
        password_confirmation: values.confirmPassword
      });
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  };

  const uploadProfilePicture = async (file: File): Promise<{ success: boolean; url?: string }> => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      const response = await axios.post('/api/settings/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = response.data.url;
      setAccount(prev => prev ? { ...prev, profilePicture: url } : null);
      return { success: true, url };
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  };

  return {
    defaultAccount,
    updateProfile,
    updatePassword,
    uploadProfilePicture,
    isLoading
  };
};