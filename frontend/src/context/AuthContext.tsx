import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type RoleType = 'admin' | 'staff' | 'inventory' | 'customer' | 'guest';

export interface User {
  id?: string;
  name: string;
  role: RoleType;
  isLoggedIn: boolean;
  email?: string;
}

interface AuthContextType {
  user: User;
  login: (userData: Omit<User, 'isLoggedIn'>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_USER: User = { name: 'Guest', role: 'guest', isLoggedIn: false };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(GUEST_USER);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('pixs_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        // Directly set user state — do NOT call login() here to avoid recursion
        setUser({ ...parsed, isLoggedIn: true });
      } catch (e) {
        localStorage.removeItem('pixs_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: Omit<User, 'isLoggedIn'>) => {
    const newUser: User = { ...userData, isLoggedIn: true };
    setUser(newUser); // ✅ Directly update state — no recursion
    localStorage.setItem('pixs_session', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(GUEST_USER);
    localStorage.removeItem('pixs_session');
    // ✅ No window.location.href — navigation handled by consumer via useNavigate()
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
