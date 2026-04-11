import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from './auth.types';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GUEST_USER: User = { name: 'Guest', role: 'guest', isLoggedIn: false };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const loginInProgress = React.useRef(false);
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

  const [isLoading, setIsLoading] = useState(true);

  const getRoleHomepage = (role: string) => {
    switch (role) {
      case 'admin':
      case 'inventory':
        return '/admin/dashboard';
      case 'staff':
      case 'technician':
      case 'welder':
        return '/staff/overview';
      case 'customer':
        return '/homepage';
      case 'banned':
        return '/delete-account';
      default:
        return '/';
    }
  };

  useEffect(() => {
    const validateSession = async () => {
      try {
        const res = await axios.get('/api/session/check');
        const { authenticated, role } = res.data;

        if (authenticated) {
          const userRes = await axios.get('/user');
          const userData = userRes.data;
          const validatedUser = {
            id: userData.id,
            name: userData.name,
            role: userData.role,
            user_type: userData.user_type,
            isLoggedIn: true,
            token: userData.token
          };
          setUser(validatedUser);
          localStorage.setItem('pixs_session', JSON.stringify(validatedUser));
          loginInProgress.current = false; // Synchronized successfully
          
          const path = window.location.pathname;
          if (path === '/' || path === '/login' || path === '/register') {
            navigate(getRoleHomepage(role));
          }
        } else {
          // Only clear if a manual login didn't just happen
          if (!loginInProgress.current) {
            setUser(GUEST_USER);
            localStorage.removeItem('pixs_session');
            
            const path = window.location.pathname;
            if (path !== '/' && path !== '/login' && path !== '/register' && path !== '/delete-account') {
              navigate('/');
            }
          }
        }
      } catch (err) {
        if (!loginInProgress.current) {
          setUser(GUEST_USER);
          localStorage.removeItem('pixs_session');
          const path = window.location.pathname;
          if (path !== '/' && path !== '/login' && path !== '/register') {
            navigate('/');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    validateSession();
  }, [navigate]);

  const login = (userData: Omit<User, 'isLoggedIn'>) => {
    loginInProgress.current = true; // Block stale validateSession results
    const newUser: User = { ...userData, isLoggedIn: true };
    setUser(newUser);
    setIsLoading(false); 
    localStorage.setItem('pixs_session', JSON.stringify(userData));
    navigate(getRoleHomepage(userData.role));
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post('/logout');
    } catch (e) {
      console.error(e);
    }
    setUser(GUEST_USER);
    setIsLoading(false);
    localStorage.removeItem('pixs_session');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
