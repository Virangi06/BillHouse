import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

export interface UserProfile {
  id: string;
  name: string;
  businessName?: string;
  email: string;
  tenantId: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check login state on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('billhouse_token');
      const storedUser = localStorage.getItem('billhouse_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify with backend
          const response = await API.get('/auth/me');
          if (response.data && response.data.user) {
            const freshUser = {
              id: response.data.user._id,
              name: response.data.user.name,
              businessName: response.data.user.businessName || '',
              email: response.data.user.email,
              tenantId: response.data.user.tenantId
            };
            setUser(freshUser);
            localStorage.setItem('billhouse_user', JSON.stringify(freshUser));
          }
        } catch (error) {
          console.error('Session validation failed, logging out...', error);
          // Token expired or invalid
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('billhouse_token', newToken);
    localStorage.setItem('billhouse_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('billhouse_token');
    localStorage.removeItem('billhouse_user');
  };

  const refreshUser = async () => {
    try {
      const response = await API.get('/auth/me');
      if (response.data && response.data.user) {
        const freshUser = {
          id: response.data.user._id,
          name: response.data.user.name,
          businessName: response.data.user.businessName || '',
          email: response.data.user.email,
          tenantId: response.data.user.tenantId
        };
        setUser(freshUser);
        localStorage.setItem('billhouse_user', JSON.stringify(freshUser));
      }
    } catch (error) {
      console.error('Failed to refresh user details:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
