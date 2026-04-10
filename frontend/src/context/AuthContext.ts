import { createContext, useContext } from 'react';
import type { User } from './auth.types';

export interface AuthContextType {
  user: User;
  login: (userData: Omit<User, 'isLoggedIn'>) => void;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
