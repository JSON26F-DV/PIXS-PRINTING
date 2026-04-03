import { useAuth } from '../context/AuthContext';
import { useMemo } from 'react';

export function usePermissions() {
  const { user } = useAuth();
  
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);
  const isStaff = useMemo(() => user?.role === 'staff', [user?.role]);
  
  return {
    isAdmin,
    isStaff,
    userRole: user?.role
  };
}
