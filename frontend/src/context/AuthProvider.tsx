import React, { useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from './auth.types';
import { AuthContext } from './AuthContext';

const GUEST_USER: User = { name: 'Guest', role: 'guest', isLoggedIn: false };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    if (typeof window === 'undefined') return GUEST_USER;
    
    const savedSession = localStorage.getItem('pixs_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        return { ...parsed, isLoggedIn: true };
      } catch {
        localStorage.removeItem('pixs_session');
      }
    }
    return GUEST_USER;
  });

  const [isLoading] = useState(false);

  const login = (userData: Omit<User, 'isLoggedIn'>) => {
    const newUser: User = { ...userData, isLoggedIn: true };
    setUser(newUser);
    localStorage.setItem('pixs_session', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(GUEST_USER);
    localStorage.removeItem('pixs_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
